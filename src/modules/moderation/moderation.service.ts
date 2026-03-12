import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ModerateContentDto } from './dto/moderate-content.dto';
import { ModerationQueryDto } from './dto/moderation-query.dto';

// Define a type for the content that can come from different tables
type ContentType = 
  | (Awaited<ReturnType<PrismaService['forumPost']['findUnique']>>)
  | (Awaited<ReturnType<PrismaService['forumReply']['findUnique']>>)
  | (Awaited<ReturnType<PrismaService['prayerRequest']['findUnique']>>)
  | (Awaited<ReturnType<PrismaService['testimony']['findUnique']>>)
  | (Awaited<ReturnType<PrismaService['groupDiscussion']['findUnique']>>);

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
      where.contentType = type;
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

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getContentForReview(contentId: string, contentType: string): Promise<ContentType> {
    let content: ContentType = null;

    switch (contentType) {
      case 'forumPost':
        content = await this.prisma.forumPost.findUnique({
          where: { id: contentId },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            replies: true,
          },
        }) as ContentType;
        break;
      case 'forumReply':
        content = await this.prisma.forumReply.findUnique({
          where: { id: contentId },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            post: true,
          },
        }) as ContentType;
        break;
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
        content = await this.prisma.groupDiscussion.findUnique({
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
        contentType,
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
    }

    // Update any related reports
    await this.prisma.report.updateMany({
      where: {
        contentId,
        contentType,
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
      contentType,
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
      case 'forumPost':
        await this.prisma.forumPost.delete({ where: { id: contentId } });
        break;
      case 'forumReply':
        await this.prisma.forumReply.delete({ where: { id: contentId } });
        break;
      case 'prayerRequest':
        await this.prisma.prayerRequest.delete({ where: { id: contentId } });
        break;
      case 'testimony':
        await this.prisma.testimony.delete({ where: { id: contentId } });
        break;
      case 'groupDiscussion':
        await this.prisma.groupDiscussion.delete({ where: { id: contentId } });
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
    if (content.content) {
      return content.content.substring(0, 100);
    }
    if (content.title) {
      return `${content.title}: ${content.content?.substring(0, 50) || ''}`;
    }
    return JSON.stringify(content).substring(0, 100);
  }

  private getContentPreview(content: any): string {
    if (content.content) {
      return content.content;
    }
    if (content.title) {
      return `${content.title}\n\n${content.content || ''}`;
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
      // Create auto-report with required contentId
      await this.prisma.report.create({
        data: {
          reportedById: 'system',
          contentType,
          contentId: 'auto-flag', // Add a placeholder or generate one
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
}