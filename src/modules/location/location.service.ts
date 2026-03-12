import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  async updateUserLocation(userId: string, locationData: any) {
    return this.prisma.member.update({
      where: { id: userId },
      data: {
        city: locationData.city,
        region: locationData.region,
        country: locationData.country,
        showLocation: locationData.showLocation ?? true,
      },
      select: {
        id: true,
        name: true,
        city: true,
        region: true,
        country: true,
        showLocation: true,
      },
    });
  }

  async findNearbyUsers(city: string, currentUserId: string) {
    return this.prisma.member.findMany({
      where: {
        city: city,
        id: { not: currentUserId },
        showLocation: true,
      },
      select: {
        id: true,
        name: true,
        city: true,
        age: true,
        bio: true,
      },
      take: 20,
    });
  }

  async getLocationStats(city: string) {
    const count = await this.prisma.member.count({
      where: { city },
    });

    return { city, members: count };
  }
}