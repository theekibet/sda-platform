import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  async updateUserLocation(userId: string, locationData: UpdateLocationDto) {
    // If user disables location, clear everything
    if (locationData.showLocation === false) {
      return this.prisma.member.update({
        where: { id: userId },
        data: {
          locationName: null,
          latitude: null,
          longitude: null,
          locationPrivacy: 'none',
          locationLastUpdated: new Date(),
        },
        select: {
          id: true,
          name: true,
          locationName: true,
          locationPrivacy: true,
          locationLastUpdated: true,
        },
      });
    }

    // Update with provided data
    return this.prisma.member.update({
      where: { id: userId },
      data: {
        locationName: locationData.locationName,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        locationPrivacy: locationData.locationPrivacy ?? 'city',
        locationLastUpdated: new Date(),
      },
      select: {
        id: true,
        name: true,
        locationName: true,
        latitude: true,
        longitude: true,
        locationPrivacy: true,
        locationLastUpdated: true,
      },
    });
  }

  async updateLocationConsent(userId: string, consentData: { enableLocation: boolean; privacyLevel?: string }) {
    const { enableLocation, privacyLevel } = consentData;

    return this.prisma.member.update({
      where: { id: userId },
      data: {
        locationPrivacy: privacyLevel || (enableLocation ? 'city' : 'none'),
        locationLastUpdated: new Date(),
      },
      select: {
        id: true,
        locationPrivacy: true,
        locationLastUpdated: true,
      },
    });
  }

  async getLocationStats() {
    const total = await this.prisma.member.count({
      where: { 
        latitude: { not: null },
        locationPrivacy: { not: 'none' }
      }
    });

    return {
      totalMembersWithLocation: total,
      lastUpdated: new Date(),
    };
  }
}