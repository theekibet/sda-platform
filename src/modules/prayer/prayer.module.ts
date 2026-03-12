import { Module } from '@nestjs/common';
import { PrayerService } from './prayer.service';
import { PrayerController } from './prayer.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [PrayerController],
  providers: [PrayerService, PrismaService],
})
export class PrayerModule {}