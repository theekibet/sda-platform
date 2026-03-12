// src/modules/announcements/announcements.module.ts
import { Module } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { MemberAnnouncementsController } from './controllers/member-announcements.controller';
import { AdminAnnouncementsController } from './controllers/admin-announcements.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [
    MemberAnnouncementsController,
    AdminAnnouncementsController,
  ],
  providers: [AnnouncementsService, PrismaService],
  exports: [AnnouncementsService],
})
export class AnnouncementsModule {}