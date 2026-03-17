// src/modules/bible/bible.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BibleApiService } from './bible-api.service';
import { BibleController } from './bible.controller';
import { BibleInteractionsController } from './bible-interactions.controller'; // ✅ ADD THIS
import { BibleVerseService } from './bible-verse.service';
import { BibleCronService } from './bible-cron.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [
    BibleController,
    BibleInteractionsController, // ✅ ADD THIS
  ],
  providers: [
    BibleApiService,
    BibleVerseService,
    BibleCronService,
    PrismaService,
  ],
  exports: [BibleApiService, BibleVerseService],
})
export class BibleModule {}