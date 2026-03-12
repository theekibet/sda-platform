// app.module.ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // ADD THIS
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MembersModule } from './modules/members/members.module';
import { AuthModule } from './modules/auth/auth.module';
import { LocationModule } from './modules/location/location.module';
import { ForumModule } from './modules/forum/forum.module';
import { PrayerModule } from './modules/prayer/prayer.module';
import { GroupsModule } from './modules/groups/groups.module';
import { AdminModule } from './modules/admin/admin.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { SecurityModule } from './modules/security/security.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { AuditLoggerMiddleware } from './common/middleware/audit-logger.middleware';
import { BibleModule } from './modules/bible/bible.module';

import { PrismaService } from './prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes config available everywhere
    }),
    MembersModule,
    AuthModule,
    LocationModule,
    ForumModule,
    PrayerModule,
    GroupsModule,
    AdminModule,
    ModerationModule,
    ReportsModule,
    AnalyticsModule,
    SettingsModule,
    AnnouncementsModule,
    SecurityModule,
    MaintenanceModule,
    BibleModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
  ],
  exports: [PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuditLoggerMiddleware)
      .forRoutes('*');
  }
}
