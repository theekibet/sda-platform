// src/modules/notifications/notification.controller.ts
import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Query,
    Body,
    UseGuards,
  } from '@nestjs/common';
  import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
  import { CurrentUser } from '../../common/decorators/current-user.decorator';
  import { NotificationService } from './notification.service';
  import { NotificationQueryDto } from './dto/notification-query.dto';
  
  @Controller('notifications')
  @UseGuards(JwtAuthGuard)
  export class NotificationController {
    constructor(private notificationService: NotificationService) {}
  
    @Get()
    async getMyNotifications(
      @CurrentUser() user: any,
      @Query() query: NotificationQueryDto,
    ) {
      const result = await this.notificationService.getUserNotifications(user.id, query);
      return {
        success: true,
        data: result.notifications,
        unreadCount: result.unreadCount,
        pagination: result.pagination,
      };
    }
  
    @Get('unread-count')
    async getUnreadCount(@CurrentUser() user: any) {
      const count = await this.notificationService.getUnreadCount(user.id);
      return { success: true, data: { count } };
    }
  
    @Patch(':id/read')
    async markAsRead(@CurrentUser() user: any, @Param('id') id: string) {
      await this.notificationService.markAsRead(user.id, id);
      return { success: true, message: 'Notification marked as read' };
    }
  
    @Post('read-all')
    async markAllAsRead(@CurrentUser() user: any) {
      await this.notificationService.markAllAsRead(user.id);
      return { success: true, message: 'All notifications marked as read' };
    }
  
    @Delete(':id')
    async delete(@CurrentUser() user: any, @Param('id') id: string) {
      await this.notificationService.delete(user.id, id);
      return { success: true, message: 'Notification deleted' };
    }
  
    @Patch(':id/archive')
    async archive(@CurrentUser() user: any, @Param('id') id: string) {
      await this.notificationService.archive(user.id, id);
      return { success: true, message: 'Notification archived' };
    }
  }