import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async createAnnouncement(adminId: string, dto: CreateAnnouncementDto) {
    const { title, content, type, targetRole, targetUsers, scheduledAt, expiresAt } = dto;

    const announcement = await this.prisma.announcement.create({
      data: {
        title,
        content,
        type: type || 'info',
        targetRole: targetRole || 'all',
        targetUsers: targetUsers ? JSON.stringify(targetUsers) : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: adminId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Announcement created successfully',
      announcement,
    };
  }

  async getAllAnnouncements(page = 1, limit = 20, active?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (active === 'true') {
      where.isActive = true;
      where.OR = [
        { scheduledAt: null },
        { scheduledAt: { lte: new Date() } },
      ];
      where.AND = [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } },
      ];
    }

    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { views: true },
          },
        },
        orderBy: [
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return {
      announcements: announcements.map(a => ({
        ...a,
        viewCount: a._count.views,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getActiveAnnouncements(userId?: string) {
    const now = new Date();

    const announcements = await this.prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          { scheduledAt: null },
          { scheduledAt: { lte: now } },
        ],
        AND: [
          { expiresAt: null },
          { expiresAt: { gte: now } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!userId) {
      return announcements;
    }

    // Check which ones user has viewed
    const viewed = await this.prisma.announcementView.findMany({
      where: {
        userId,
        announcementId: { in: announcements.map(a => a.id) },
      },
    });

    const viewedIds = new Set(viewed.map(v => v.announcementId));

    return announcements.map(a => ({
      ...a,
      viewed: viewedIds.has(a.id),
    }));
  }

  async getAnnouncementById(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        views: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 10,
          orderBy: { viewedAt: 'desc' },
        },
      },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return {
      ...announcement,
      viewCount: announcement.views.length,
    };
  }

  async updateAnnouncement(adminId: string, id: string, dto: UpdateAnnouncementDto) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    const updated = await this.prisma.announcement.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        type: dto.type,
        targetRole: dto.targetRole,
        targetUsers: dto.targetUsers ? JSON.stringify(dto.targetUsers) : announcement.targetUsers,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : announcement.scheduledAt,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : announcement.expiresAt,
        isActive: dto.isActive,
      },
    });

    return {
      success: true,
      message: 'Announcement updated successfully',
      announcement: updated,
    };
  }

  async deleteAnnouncement(adminId: string, id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    await this.prisma.announcement.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Announcement deleted successfully',
    };
  }

  async markAsViewed(userId: string, announcementId: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    // Check if already viewed
    const existing = await this.prisma.announcementView.findUnique({
      where: {
        announcementId_userId: {
          announcementId,
          userId,
        },
      },
    });

    if (!existing) {
      await this.prisma.announcementView.create({
        data: {
          announcementId,
          userId,
        },
      });

      // Update view count
      await this.prisma.announcement.update({
        where: { id: announcementId },
        data: {
          viewCount: { increment: 1 },
        },
      });
    }

    return { success: true, message: 'Marked as viewed' };
  }
}