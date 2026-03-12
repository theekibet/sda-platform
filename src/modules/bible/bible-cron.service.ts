// src/modules/bible/bible-cron.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class BibleCronService {
  private readonly logger = new Logger(BibleCronService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Runs every day at midnight to publish scheduled verses
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async publishScheduledVerses() {
    this.logger.log('🌅 Running scheduled verse publishing...');
    
    const today = new Date();
    
    // Start of today (00:00:00)
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    // End of today (23:59:59.999)
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    try {
      // Find all scheduled verses for today
      const scheduledVerses = await this.prisma.sharedVerse.findMany({
        where: {
          scheduledFor: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: 'scheduled',
        },
        include: {
          verse: true,
          user: true,
        },
      });

      if (scheduledVerses.length === 0) {
        this.logger.log('No verses scheduled for today');
        return;
      }

      // Publish all scheduled verses for today
      const result = await this.prisma.sharedVerse.updateMany({
        where: {
          scheduledFor: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: 'scheduled',
        },
        data: {
          status: 'published',
        },
      });

      this.logger.log(`✅ Published ${result.count} verse(s) for today:`);
      
      // Log which verses were published
      scheduledVerses.forEach(verse => {
        this.logger.log(`   - ${verse.verse.reference} (shared by: ${verse.user?.name || 'Anonymous'})`);
      });

      // Optional: Send notifications to users who shared the verses
      // await this.notifyUsersOfPublishedVerses(scheduledVerses); // Commented out for now

    } catch (error) {
      this.logger.error(`❌ Error publishing scheduled verses: ${error.message}`);
    }
  }

  /**
   * Also runs every hour to catch any verses that might have been scheduled
   * for today but missed the midnight run (backup)
   */
  @Cron('0 * * * *') // Every hour at minute 0
  async hourlyCheck() {
    this.logger.debug('Running hourly check for scheduled verses...');
    
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.prisma.sharedVerse.updateMany({
      where: {
        scheduledFor: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'scheduled',
      },
      data: {
        status: 'published',
      },
    });

    if (result.count > 0) {
      this.logger.log(`✅ Hourly check published ${result.count} verse(s)`);
    }
  }


}