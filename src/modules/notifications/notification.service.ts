// src/modules/notifications/notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationQueryDto } from './dto/notification-query.dto';

export interface CreateNotificationDto {
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  userId: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway,
  ) {}

  async create(dto: CreateNotificationDto) {
    this.logger.log(`Creating notification for user ${dto.userId}: ${dto.type}`);
    
    try {
      const notification = await this.prisma.notification.create({
        data: {
          type: dto.type,
          title: dto.title,
          message: dto.message,
          data: dto.data ? JSON.stringify(dto.data) : null,
          userId: dto.userId,
        },
      });

      this.logger.log(`✅ Notification created with ID: ${notification.id}`);

      // Send real-time notification if user is online
      try {
        this.notificationGateway.sendToUser(
          dto.userId, 
          'NEW_NOTIFICATION', 
          notification
        );
        this.logger.log(`📨 Real-time notification sent to user ${dto.userId}`);
      } catch (wsError) {
        this.logger.error(`❌ Failed to send real-time notification: ${wsError.message}`);
      }

      return notification;
    } catch (error) {
      this.logger.error(`❌ Failed to create notification: ${error.message}`);
      throw error;
    }
  }

  async createBulk(dtos: CreateNotificationDto[]) {
    this.logger.log(`📦 Creating ${dtos.length} notifications in bulk`);
    
    if (dtos.length === 0) {
      this.logger.log('⚠️ No notifications to create');
      return { count: 0 };
    }

    try {
      // Log sample of first few notifications for debugging
      this.logger.debug('Sample of first 3 notifications:');
      dtos.slice(0, 3).forEach((d, i) => {
        this.logger.debug(`  ${i+1}. User: ${d.userId}, Type: ${d.type}, Title: ${d.title.substring(0, 30)}...`);
      });

      const notifications = await this.prisma.notification.createMany({
        data: dtos.map(d => ({
          type: d.type,
          title: d.title,
          message: d.message,
          data: d.data ? JSON.stringify(d.data) : null,
          userId: d.userId,
        })),
      });

      this.logger.log(`✅ Successfully created ${notifications.count} notifications`);

      // Send real-time notifications to each user (but don't block on errors)
      this.logger.log(`📨 Attempting to send real-time notifications to ${dtos.length} users...`);
      
      let sentCount = 0;
      dtos.forEach(dto => {
        try {
          this.notificationGateway.sendToUser(
            dto.userId, 
            'NEW_NOTIFICATION', 
            { 
              id: `temp-${Date.now()}`, // Note: real ID would come from createMany but not available
              type: dto.type,
              title: dto.title,
              message: dto.message,
              data: dto.data,
              createdAt: new Date(),
              isRead: false,
            }
          );
          sentCount++;
        } catch (wsError) {
          this.logger.debug(`Could not send real-time to user ${dto.userId}: ${wsError.message}`);
        }
      });
      
      this.logger.log(`📨 Real-time notifications sent to ${sentCount}/${dtos.length} users`);

      return notifications;
    } catch (error) {
      this.logger.error(`❌ Error in createBulk: ${error.message}`);
      this.logger.error(error.stack);
      throw error;
    }
  }

  async getUserNotifications(userId: string, query: NotificationQueryDto) {
    this.logger.log(`Fetching notifications for user ${userId}`);
    
    const { page = 1, limit = 20, unreadOnly = false, type } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      isArchived: false,
      ...(unreadOnly ? { isRead: false } : {}),
      ...(type ? { type } : {}),
    };

    try {
      const [notifications, total] = await Promise.all([
        this.prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.notification.count({ where }),
      ]);

      const unreadCount = await this.prisma.notification.count({
        where: { userId, isRead: false, isArchived: false },
      });

      this.logger.debug(`Found ${notifications.length} notifications for user ${userId} (${unreadCount} unread)`);

      // Parse JSON data for each notification
      const parsedNotifications = notifications.map(notif => {
        try {
          return {
            ...notif,
            data: notif.data ? JSON.parse(notif.data) : null,
          };
        } catch (e) {
          this.logger.warn(`Failed to parse notification data for ${notif.id}: ${e.message}`);
          return { ...notif, data: null };
        }
      });

      return {
        notifications: parsedNotifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching notifications for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async markAsRead(userId: string, notificationId: string) {
    this.logger.log(`Marking notification ${notificationId} as read for user ${userId}`);
    
    try {
      const result = await this.prisma.notification.update({
        where: { id: notificationId, userId },
        data: { isRead: true, readAt: new Date() },
      });
      
      this.logger.log(`✅ Notification ${notificationId} marked as read`);
      
      // Notify other devices about the read status
      try {
        this.notificationGateway.sendToUser(
          userId,
          'notificationUpdated',
          { id: notificationId, isRead: true }
        );
      } catch (wsError) {
        // Ignore WebSocket errors for this operation
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to mark notification ${notificationId} as read: ${error.message}`);
      throw error;
    }
  }

  async markAllAsRead(userId: string) {
    this.logger.log(`Marking all notifications as read for user ${userId}`);
    
    try {
      const result = await this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
      
      this.logger.log(`✅ Marked ${result.count} notifications as read for user ${userId}`);
      
      // Notify about the bulk update
      try {
        this.notificationGateway.sendToUser(
          userId,
          'allNotificationsRead',
          { timestamp: new Date() }
        );
      } catch (wsError) {
        // Ignore WebSocket errors
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to mark all notifications as read for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async archive(userId: string, notificationId: string) {
    this.logger.log(`Archiving notification ${notificationId} for user ${userId}`);
    
    try {
      const result = await this.prisma.notification.update({
        where: { id: notificationId, userId },
        data: { isArchived: true },
      });
      
      this.logger.log(`✅ Notification ${notificationId} archived`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to archive notification ${notificationId}: ${error.message}`);
      throw error;
    }
  }

  async delete(userId: string, notificationId: string) {
    this.logger.log(`Deleting notification ${notificationId} for user ${userId}`);
    
    try {
      const result = await this.prisma.notification.delete({
        where: { id: notificationId, userId },
      });
      
      this.logger.log(`✅ Notification ${notificationId} deleted`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to delete notification ${notificationId}: ${error.message}`);
      throw error;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await this.prisma.notification.count({
        where: { userId, isRead: false, isArchived: false },
      });
      
      return count;
    } catch (error) {
      this.logger.error(`Failed to get unread count for user ${userId}: ${error.message}`);
      return 0;
    }
  }
}