import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ============ USER-FACING REPORT METHODS ============

  async createReport(userId: string, dto: CreateReportDto) {
    const { contentType, contentId, category, description } = dto;

    // Check if content exists
    await this.validateContentExists(contentType, contentId);

    // Check if user already reported this content
    const existingReport = await this.prisma.report.findFirst({
      where: {
        reportedById: userId,
        contentType,
        contentId,
        status: { in: ['pending', 'investigating'] }
      }
    });

    if (existingReport) {
      throw new BadRequestException('You have already reported this content');
    }

    // Get content snippet for preview
    const contentSnippet = await this.getContentSnippet(contentType, contentId);

    // Create the report
    const report = await this.prisma.report.create({
      data: {
        reportedById: userId,
        contentType,
        contentId,
        contentSnippet,
        category,
        description,
        status: 'pending',
        priority: 'medium', // Default priority
      },
      include: {
        reportedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Report submitted successfully',
      report,
    };
  }

  async getMyReports(userId: string, query: ReportQueryDto) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      reportedById: userId,
    };

    if (status) {
      where.status = status;
    }

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      reports,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getReportById(userId: string, reportId: string) {
    const report = await this.prisma.report.findFirst({
      where: {
        id: reportId,
        reportedById: userId, // Ensure user owns this report
      },
      include: {
        reportedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  // ============ HELPER METHODS ============

  private async validateContentExists(contentType: string, contentId: string) {
    let exists = false;

    switch (contentType) {
      case 'forumPost':
        const post = await this.prisma.forumPost.findUnique({ where: { id: contentId } });
        exists = !!post;
        break;
      case 'forumReply':
        const reply = await this.prisma.forumReply.findUnique({ where: { id: contentId } });
        exists = !!reply;
        break;
      case 'prayerRequest':
        const prayer = await this.prisma.prayerRequest.findUnique({ where: { id: contentId } });
        exists = !!prayer;
        break;
      case 'testimony':
        const testimony = await this.prisma.testimony.findUnique({ where: { id: contentId } });
        exists = !!testimony;
        break;
      case 'groupDiscussion':
        const discussion = await this.prisma.groupDiscussion.findUnique({ where: { id: contentId } });
        exists = !!discussion;
        break;
      case 'user':
        const user = await this.prisma.member.findUnique({ where: { id: contentId } });
        exists = !!user;
        break;
    }

    if (!exists) {
      throw new NotFoundException(`${contentType} with ID ${contentId} not found`);
    }
  }

  private async getContentSnippet(contentType: string, contentId: string): Promise<string> {
    switch (contentType) {
      case 'forumPost':
        const post = await this.prisma.forumPost.findUnique({ where: { id: contentId } });
        return post?.content.substring(0, 100) || '';
      case 'forumReply':
        const reply = await this.prisma.forumReply.findUnique({ where: { id: contentId } });
        return reply?.content.substring(0, 100) || '';
      case 'prayerRequest':
        const prayer = await this.prisma.prayerRequest.findUnique({ where: { id: contentId } });
        return prayer?.content.substring(0, 100) || '';
      case 'testimony':
        const testimony = await this.prisma.testimony.findUnique({ where: { id: contentId } });
        return testimony?.content.substring(0, 100) || '';
      case 'groupDiscussion':
        const discussion = await this.prisma.groupDiscussion.findUnique({ where: { id: contentId } });
        return discussion?.content.substring(0, 100) || '';
      case 'user':
        const user = await this.prisma.member.findUnique({ where: { id: contentId } });
        return `User: ${user?.name || 'Unknown'}`;
      default:
        return '';
    }
  }
}