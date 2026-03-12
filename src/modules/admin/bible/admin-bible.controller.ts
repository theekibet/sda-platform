// src/modules/admin/bible/admin-bible.controller.ts
import { 
    Controller, Get, Post, Body, Param, Query, 
    UseGuards, ParseIntPipe 
  } from '@nestjs/common';
  import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard'; // ✅ Fixed path
  import { AdminGuard } from '../../../common/guards/admin.guard'; // ✅ Fixed path
  import { CurrentUser } from '../../../common/decorators/current-user.decorator'; // ✅ Fixed path
  import { PrismaService } from '../../../prisma.service'; // ✅ Fixed path
  import { BibleVerseService } from '../../bible/bible-verse.service'; // ✅ Fixed path
  
  @Controller('admin/bible')
  @UseGuards(JwtAuthGuard, AdminGuard)
  export class AdminBibleController {
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
      
      return {
        success: true,
        data: {
          submissions,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
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
      });
      
      if (!submission) {
        return { success: false, message: 'Submission not found' };
      }
      
      let scheduledFor = body.scheduledFor 
        ? new Date(body.scheduledFor)
        : await this.bibleVerseService.getNextAvailableDate();
      
      const updated = await this.prisma.sharedVerse.update({
        where: { id },
        data: {
          status: 'approved',
          scheduledFor,
          reviewedById: admin.id,
          reviewedAt: new Date(),
          reviewNotes: body.notes,
        },
      });
      
      // ✅ FIX: Create a properly typed array
      const result = { ...updated };
      
      return {
        success: true,
        message: 'Submission approved',
        data: result,
      };
    }
  
    @Post('submissions/:id/reject')
    async rejectSubmission(
      @CurrentUser() admin: any,
      @Param('id') id: string,
      @Body() body: { reason: string },
    ) {
      const updated = await this.prisma.sharedVerse.update({
        where: { id },
        data: {
          status: 'rejected',
          reviewedById: admin.id,
          reviewedAt: new Date(),
          reviewNotes: body.reason,
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
      // Auto-schedule approved verses
      const approved = await this.prisma.sharedVerse.findMany({
        where: { status: 'approved', scheduledFor: null },
        orderBy: { createdAt: 'asc' },
      });
      
      let nextDate = await this.bibleVerseService.getNextAvailableDate();
      
      // ✅ FIX: Properly typed array
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
      
      const scheduled = await this.prisma.sharedVerse.findFirst({
        where: {
          scheduledFor: today,
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
      });
      
      return {
        success: true,
        message: 'Verse published for today',
        data: published,
      };
    }
  }