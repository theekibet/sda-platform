// src/modules/admin/bible/admin-bible.controller.ts
import { 
  Controller, Get, Post, Body, Param, Query, 
  UseGuards, ParseIntPipe, Logger 
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PrismaService } from '../../../prisma.service';
import { BibleVerseService } from '../../bible/bible-verse.service';

@Controller('admin/bible')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminBibleController {
  private readonly logger = new Logger(AdminBibleController.name);

  constructor(
    private prisma: PrismaService,
    private bibleVerseService: BibleVerseService,
  ) {}

  @Get('submissions')
  async getSubmissions(
    @Query('status') status: string = 'pending',
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    const skip = (page - 1) * limit;
    
    const [submissions, total] = await Promise.all([
      this.prisma.sharedVerse.findMany({
        where: { status },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          verse: {
            include: {
              version: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.sharedVerse.count({ where: { status } }),
    ]);

    // Calculate queue positions for pending submissions
    let submissionsWithPosition = submissions;
    if (status === 'pending') {
      submissionsWithPosition = await Promise.all(
        submissions.map(async (sub, index) => {
          const position = await this.prisma.sharedVerse.count({
            where: {
              status: 'pending',
              createdAt: {
                lt: sub.createdAt,
              },
            },
          }) + 1;
          
          return {
            ...sub,
            queuePosition: position,
          };
        })
      );
    }
    
    return {
      success: true,
      data: {
        submissions: submissionsWithPosition,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  @Get('submissions/:id')
  async getSubmission(@Param('id') id: string) {
    const submission = await this.prisma.sharedVerse.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        verse: {
          include: {
            version: true,
          },
        },
      },
    });

    if (!submission) {
      return { success: false, message: 'Submission not found' };
    }

    // Get user's other submissions
    const otherSubmissions = await this.prisma.sharedVerse.findMany({
      where: {
        userId: submission.userId,
        id: { not: id },
        status: { in: ['pending', 'approved', 'scheduled', 'published'] },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: {
        ...submission,
        otherSubmissions,
      },
    };
  }

  @Post('submissions/:id/approve')
  async approveSubmission(
    @CurrentUser() admin: any,
    @Param('id') id: string,
    @Body() body: { scheduledFor?: string; notes?: string },
  ) {
    const submission = await this.prisma.sharedVerse.findUnique({
      where: { id },
      include: { verse: true },
    });
    
    if (!submission) {
      return { success: false, message: 'Submission not found' };
    }

    // Allow updating both pending and approved submissions
    if (submission.status !== 'pending' && submission.status !== 'approved') {
      return { success: false, message: 'Only pending or approved submissions can be updated' };
    }

    // Determine the new status
    // If we have a scheduled date, it becomes 'scheduled'
    // Otherwise it becomes 'approved' (waiting for scheduling)
    const newStatus = body.scheduledFor ? 'scheduled' : 'approved';
    
    // Only set scheduledFor if date is provided
    const scheduledFor = body.scheduledFor 
      ? new Date(body.scheduledFor)
      : null;

    const updated = await this.prisma.sharedVerse.update({
      where: { id },
      data: {
        status: newStatus,
        scheduledFor: scheduledFor,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        reviewNotes: body.notes,
      },
      include: {
        user: true,
        verse: true,
      },
    });
    
    // Log the action
    await this.prisma.moderationLog.create({
      data: {
        moderatorId: admin.id,
        action: newStatus,
        contentType: 'verse_submission',
        contentId: id,
        reason: body.notes || `Changed to ${newStatus}`,
      },
    });
    
    return {
      success: true,
      message: `Submission ${newStatus}`,
      data: updated,
    };
  }

  @Post('submissions/:id/schedule')
  async scheduleSubmission(
    @CurrentUser() admin: any,
    @Param('id') id: string,
    @Body() body: { scheduledFor: string; notes?: string },
  ) {
    if (!body.scheduledFor) {
      return { success: false, message: 'Scheduled date is required' };
    }

    const submission = await this.prisma.sharedVerse.findUnique({
      where: { id },
    });

    if (!submission) {
      return { success: false, message: 'Submission not found' };
    }

    if (submission.status !== 'approved' && submission.status !== 'scheduled') {
      return { success: false, message: 'Only approved submissions can be scheduled' };
    }

    const scheduledDate = new Date(body.scheduledFor);

    const updated = await this.prisma.sharedVerse.update({
      where: { id },
      data: {
        status: 'scheduled',
        scheduledFor: scheduledDate,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        reviewNotes: body.notes || submission.reviewNotes,
      },
    });

    // Log the action
    await this.prisma.moderationLog.create({
      data: {
        moderatorId: admin.id,
        action: 'scheduled',
        contentType: 'verse_submission',
        contentId: id,
        reason: body.notes || 'Scheduled from admin panel',
      },
    });

    return {
      success: true,
      message: 'Submission scheduled',
      data: updated,
    };
  }

  @Post('submissions/:id/reject')
  async rejectSubmission(
    @CurrentUser() admin: any,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    if (!body.reason) {
      return { success: false, message: 'Rejection reason is required' };
    }

    const submission = await this.prisma.sharedVerse.findUnique({
      where: { id },
    });
    
    if (!submission) {
      return { success: false, message: 'Submission not found' };
    }

    if (submission.status !== 'pending' && submission.status !== 'approved') {
      return { success: false, message: 'Only pending or approved submissions can be rejected' };
    }

    const updated = await this.prisma.sharedVerse.update({
      where: { id },
      data: {
        status: 'rejected',
        reviewedById: admin.id,
        reviewedAt: new Date(),
        reviewNotes: body.reason,
      },
      include: {
        user: true,
        verse: true,
      },
    });

    // Log the action
    await this.prisma.moderationLog.create({
      data: {
        moderatorId: admin.id,
        action: 'rejected',
        contentType: 'verse_submission',
        contentId: id,
        reason: body.reason,
      },
    });
    
    return {
      success: true,
      message: 'Submission rejected',
      data: updated,
    };
  }

  @Post('schedule')
  async scheduleVerses() {
    // Get all approved but not scheduled verses
    const approved = await this.prisma.sharedVerse.findMany({
      where: { 
        status: 'approved',
        scheduledFor: null,
      },
      orderBy: { 
        reviewedAt: 'asc', // Oldest approved first
      },
    });
    
    let nextDate = await this.bibleVerseService.getNextAvailableDate();
    
    // FIX: Explicitly type the updates array
    const updates: any[] = [];
  
    for (const submission of approved) {
      const updated = await this.prisma.sharedVerse.update({
        where: { id: submission.id },
        data: {
          scheduledFor: nextDate,
          status: 'scheduled',
        },
      });
      
      updates.push(updated);
      
      // Log the action
      await this.prisma.moderationLog.create({
        data: {
          moderatorId: submission.reviewedById || 'system',
          action: 'scheduled',
          contentType: 'verse_submission',
          contentId: submission.id,
          reason: 'Auto-scheduled by system',
        },
      });
      
      // Move to next day
      const newDate = new Date(nextDate);
      newDate.setDate(newDate.getDate() + 1);
      nextDate = newDate;
    }
    
    return {
      success: true,
      message: `Scheduled ${updates.length} verses`,
      data: updates,
    };
  }

  @Post('publish-today')
  async publishTodayVerse() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find verse scheduled for today
    const scheduled = await this.prisma.sharedVerse.findFirst({
      where: {
        scheduledFor: {
          gte: today,
          lt: tomorrow,
        },
        status: 'scheduled',
      },
    });
    
    if (!scheduled) {
      return { success: false, message: 'No verse scheduled for today' };
    }
    
    const published = await this.prisma.sharedVerse.update({
      where: { id: scheduled.id },
      data: {
        status: 'published',
      },
      include: {
        verse: true,
        user: true,
      },
    });

    // Log the action
    await this.prisma.moderationLog.create({
      data: {
        moderatorId: 'system',
        action: 'published',
        contentType: 'verse_submission',
        contentId: scheduled.id,
        reason: 'Published by cron job',
      },
    });
    
    return {
      success: true,
      message: 'Verse published for today',
      data: published,
    };
  }

  @Get('stats')
  async getStats() {
    const [pending, approved, scheduled, published, rejected] = await Promise.all([
      this.prisma.sharedVerse.count({ where: { status: 'pending' } }),
      this.prisma.sharedVerse.count({ where: { status: 'approved' } }),
      this.prisma.sharedVerse.count({ where: { status: 'scheduled' } }),
      this.prisma.sharedVerse.count({ where: { status: 'published' } }),
      this.prisma.sharedVerse.count({ where: { status: 'rejected' } }),
    ]);

    const nextAvailableDate = await this.bibleVerseService.getNextAvailableDate();

    return {
      success: true,
      data: {
        counts: { pending, approved, scheduled, published, rejected },
        nextAvailableDate,
      },
    };
  }

  @Get('activity')
  async getRecentActivity() {
    const activity = await this.prisma.moderationLog.findMany({
      where: {
        contentType: 'verse_submission',
      },
      include: {
        moderator: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      success: true,
      data: activity,
    };
  }
}