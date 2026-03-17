import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ModerateContentDto } from './dto/moderate-content.dto';
import { ModerationQueryDto } from './dto/moderation-query.dto';

// Define a type for the content that can come from different tables
type ContentType = 
  | (Awaited<ReturnType<PrismaService['prayerRequest']['findUnique']>>)
  | (Awaited<ReturnType<PrismaService['testimony']['findUnique']>>)
  | (Awaited<ReturnType<PrismaService['groupMessage']['findUnique']>>)
  | (Awaited<ReturnType<PrismaService['communityPost']['findUnique']>>);

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  // ============ MODERATION QUEUE ============

  async getModerationQueue(query: ModerationQueryDto) {
    const { 
      type, 
      status = 'pending', 
      severity, 
      page = 1, 
      limit = 20,
      search 
    } = query;
    
    const skip = (page - 1) * limit;

    const where: any = {
      status,
    };

    if (type) {
      // Handle backward compatibility for group types
      if (type === 'groupDiscussion' || type === 'groupMessage') {
        where.contentType = {
          in: ['groupDiscussion', 'groupMessage']
        };
      } else {
        where.contentType = type;
      }
    }

    if (severity) {
      where.priority = severity;
    }

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { contentSnippet: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: {
          reportedBy: {
            select: {
              id: true,
              name: true,
            },
          },
          reportedUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.report.count({ where }),
    ]);

    // Transform items for consistent content type naming
    const transformedItems = items.map(item => ({
      ...item,
      contentType: item.contentType === 'groupDiscussion' ? 'groupMessage' : item.contentType,
    }));

    return {
      items: transformedItems,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getContentForReview(contentId: string, contentType: string): Promise<ContentType> {
    let content: ContentType = null;

    switch (contentType) {
      case 'prayerRequest':
        content = await this.prisma.prayerRequest.findUnique({
          where: { id: contentId },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }) as ContentType;
        break;
      case 'testimony':
        content = await this.prisma.testimony.findUnique({
          where: { id: contentId },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }) as ContentType;
        break;
      case 'groupDiscussion':
      case 'groupMessage':
        content = await this.prisma.groupMessage.findUnique({
          where: { id: contentId },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            group: true,
          },
        }) as ContentType;
        break;
      case 'communityPost':
        content = await this.prisma.communityPost.findUnique({
          where: { id: contentId },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }) as ContentType;
        break;
    }

    if (!content) {
      throw new NotFoundException(`${contentType} with ID ${contentId} not found`);
    }

    return content;
  }

  async moderateContent(
    moderatorId: string,
    contentId: string,
    contentType: string,
    dto: ModerateContentDto,
  ) {
    const { action, reason, notifyUser, sendWarning, warningMessage } = dto;

    // Get the content
    const content = await this.getContentForReview(contentId, contentType);
    
    // Get the author ID if it exists
    const authorId = (content as any).authorId || (content as any).author?.id;

    // Log the moderation action
    await this.prisma.moderationLog.create({
      data: {
        moderatorId,
        action,
        contentType: contentType === 'groupDiscussion' ? 'groupMessage' : contentType,
        contentId,
        contentSnippet: this.getContentSnippet(content),
        reason,
        details: JSON.stringify({
          ...dto,
          contentPreview: this.getContentPreview(content),
        }),
        targetUserId: authorId,
      },
    });

    // Take action based on the moderation decision
    switch (action) {
      case 'remove':
        await this.removeContent(contentId, contentType);
        break;
      case 'warn':
        if (sendWarning && authorId) {
          await this.sendWarningToUser(authorId, warningMessage || reason);
        }
        break;
      case 'flag':
        // Just flag for review, no action
        break;
      case 'approve':
        // Mark as approved, no action needed
        break;
      case 'dismiss':
        // Dismiss the report, no action on content
        break;
    }

    // Update any related reports
    await this.prisma.report.updateMany({
      where: {
        contentId,
        contentType: {
          in: [contentType, contentType === 'groupDiscussion' ? 'groupMessage' : contentType]
        },
        status: 'pending',
      },
      data: {
        status: 'resolved',
        resolution: action,
        resolvedById: moderatorId,
        resolvedAt: new Date(),
        adminNotes: reason,
      },
    });

    return {
      success: true,
      message: `Content ${action}d successfully`,
      action,
      contentId,
      contentType: contentType === 'groupDiscussion' ? 'groupMessage' : contentType,
    };
  }

  async getModerationLogs(query: any) {
    const { moderatorId, startDate, endDate, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (moderatorId) {
      where.moderatorId = moderatorId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      this.prisma.moderationLog.findMany({
        where,
        include: {
          moderator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.moderationLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============ HELPER METHODS ============

  private async removeContent(contentId: string, contentType: string) {
    switch (contentType) {
      case 'prayerRequest':
        await this.prisma.prayerRequest.delete({ where: { id: contentId } });
        break;
      case 'testimony':
        await this.prisma.testimony.delete({ where: { id: contentId } });
        break;
      case 'groupDiscussion':
      case 'groupMessage':
        await this.prisma.groupMessage.delete({ where: { id: contentId } });
        break;
      case 'communityPost':
        await this.prisma.communityPost.delete({ where: { id: contentId } });
        break;
    }
  }

  private async sendWarningToUser(userId: string, message?: string) {
    console.log(`Warning sent to user ${userId}: ${message}`);
    
    const user = await this.prisma.member.findUnique({
      where: { id: userId },
      select: { adminNotes: true }
    });

    const warningNote = `[${new Date().toISOString()}] User warned. Message: ${message || 'No message'}`;
    const updatedNotes = user?.adminNotes 
      ? `${user.adminNotes}\n\n${warningNote}`
      : warningNote;

    await this.prisma.member.update({
      where: { id: userId },
      data: {
        adminNotes: updatedNotes,
      },
    });
  }

  private getContentSnippet(content: any): string {
    if (content?.content) {
      return content.content.substring(0, 100);
    }
    if (content?.title) {
      return `${content.title}: ${content.content?.substring(0, 50) || ''}`;
    }
    if (content?.description) {
      return content.description.substring(0, 100);
    }
    return JSON.stringify(content).substring(0, 100);
  }

  private getContentPreview(content: any): string {
    if (content?.content) {
      return content.content;
    }
    if (content?.title) {
      return `${content.title}\n\n${content.content || ''}`;
    }
    if (content?.description) {
      return content.description;
    }
    return JSON.stringify(content);
  }

  // ============ AUTO-MODERATION ============

  async checkContentForFlags(content: string, contentType: string, authorId?: string) {
    const flags = await this.prisma.contentFlag.findMany({
      where: { isActive: true },
    });

    const flaggedWords = flags.filter(flag => 
      content.toLowerCase().includes(flag.keyword.toLowerCase())
    );

    if (flaggedWords.length > 0) {
      // Generate a temporary ID for auto-flagged content
      const tempId = `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create auto-report
      await this.prisma.report.create({
        data: {
          reportedById: 'system',
          contentType: contentType === 'groupDiscussion' ? 'groupMessage' : contentType,
          contentId: tempId,
          contentSnippet: content.substring(0, 200),
          category: 'auto-flagged',
          description: `Auto-flagged for: ${flaggedWords.map(f => f.keyword).join(', ')}`,
          status: 'pending',
          priority: 'high',
        },
      });

      return {
        flagged: true,
        flags: flaggedWords,
      };
    }

    return { flagged: false };
  }

  // ============ STATISTICS ============

  async getModerationStats() {
    const [pendingReports, resolvedToday, totalModerated, topModerators] = await Promise.all([
      this.prisma.report.count({ where: { status: 'pending' } }),
      this.prisma.report.count({
        where: {
          status: 'resolved',
          resolvedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.moderationLog.count(),
      this.prisma.moderationLog.groupBy({
        by: ['moderatorId'],
        _count: true,
        orderBy: {
          _count: {
            moderatorId: 'desc',
          },
        },
        take: 5,
      }),
    ]);

    const contentTypeBreakdown = await this.prisma.report.groupBy({
      by: ['contentType'],
      _count: true,
    });

    // Transform content types for consistent naming
    const transformedBreakdown = contentTypeBreakdown.reduce((acc, curr) => {
      const key = curr.contentType === 'groupDiscussion' ? 'groupMessage' : curr.contentType;
      acc[key] = (acc[key] || 0) + curr._count;
      return acc;
    }, {});

    return {
      pendingReports,
      resolvedToday,
      totalModerated,
      contentTypeBreakdown: transformedBreakdown,
      topModerators,
    };
  }

  // ============ BULK OPERATIONS ============

  async bulkModerate(
    moderatorId: string, 
    contentIds: string[], 
    contentType: string, 
    action: 'approve' | 'remove' | 'warn' | 'flag' | 'dismiss', 
    reason?: string
  ) {
    const results: Array<{ 
      contentId: string; 
      success: boolean; 
      result?: { 
        success: boolean; 
        message: string; 
        action: string; 
        contentId: string; 
        contentType: string; 
      }; 
      error?: string;
    }> = [];
    
    for (const contentId of contentIds) {
      try {
        const result = await this.moderateContent(moderatorId, contentId, contentType, {
          action,
          reason,
          notifyUser: false,
          sendWarning: false,
        });
        results.push({ contentId, success: true, result });
      } catch (error) {
        results.push({ contentId, success: false, error: error.message });
      }
    }

    return {
      success: true,
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }
}