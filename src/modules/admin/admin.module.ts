// src/modules/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminBibleController } from './bible/admin-bible.controller'; // ✅ Import the Bible admin controller
import { PrismaService } from '../../prisma.service';
import { BibleModule } from '../bible/bible.module'; // ✅ Import BibleModule to get BibleVerseService and BibleApiService
import { NotificationModule } from '../notifications/notification.module'; // ✅ Import NotificationModule for notifications

@Module({
  imports: [
    BibleModule, // ✅ This provides BibleVerseService and BibleApiService
    NotificationModule, // ✅ This provides NotificationService for sending notifications
  ],
  controllers: [
    AdminController,
    AdminBibleController, // ✅ Add the Bible admin controller here
  ],
  providers: [
    AdminService, 
    PrismaService,
    // BibleVerseService and BibleApiService are provided by BibleModule
    // NotificationService is provided by NotificationModule
  ],
  exports: [AdminService], // Export if needed by other modules
})
export class AdminModule {}