import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreatePrayerRequestDto } from './dto/create-prayer-request.dto';
import { CreateTestimonyDto } from './dto/create-testimony.dto';

@Injectable()
export class PrayerService {
  constructor(private prisma: PrismaService) {}

  // ============ PRAYER REQUESTS ============

  async createPrayerRequest(userId: string | null, dto: CreatePrayerRequestDto, locationName?: string) {
    const { content, isAnonymous } = dto;

    return this.prisma.prayerRequest.create({
      data: {
        content,
        authorId: isAnonymous ? null : userId,
        isAnonymous: isAnonymous || false,
        locationName: locationName, // Changed from 'city' to 'locationName'
      },
      include: {
        author: !isAnonymous,
      },
    });
  }

  async getPrayerRequests(locationName?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const where = locationName ? { locationName } : {}; // Changed from 'city' to 'locationName'
    
    const [requests, total] = await Promise.all([
      this.prisma.prayerRequest.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { prayers: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.prayerRequest.count({ where }),
    ]);

    return {
      requests: requests.map(r => ({
        ...r,
        prayedCount: r._count?.prayers || 0, // Added optional chaining
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPrayerRequestById(id: string) {
    const request = await this.prisma.prayerRequest.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        prayers: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10, // Show recent prayers
        },
        _count: {
          select: { prayers: true },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Prayer request not found');
    }

    return {
      ...request,
      prayedCount: request._count?.prayers || 0, // Added optional chaining
    };
  }

  async prayForRequest(userId: string, requestId: string) {
    // Check if request exists
    const request = await this.prisma.prayerRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Prayer request not found');
    }

    // Check if user already prayed
    const existing = await this.prisma.prayerInteraction.findUnique({
      where: {
        requestId_memberId: {
          requestId,
          memberId: userId,
        },
      },
    });

    if (existing) {
      // User already prayed - maybe return a message
      return { message: 'You already prayed for this request' };
    }

    // Create prayer interaction
    await this.prisma.prayerInteraction.create({
      data: {
        requestId,
        memberId: userId,
      },
    });

    return { message: 'Prayer recorded' };
  }

  async getTrendingPrayers(limit = 10) {
    // Get prayers with most interactions in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const requests = await this.prisma.prayerRequest.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { prayers: true },
        },
      },
      orderBy: {
        prayers: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return requests.map(r => ({
      ...r,
      prayedCount: r._count?.prayers || 0, // Added optional chaining
    }));
  }

  // ============ TESTIMONIES ============

  async createTestimony(userId: string, dto: CreateTestimonyDto) {
    const { title, content, prayerRequestId } = dto;

    // Prepare data object - only include prayerRequestId if it exists
    const data: any = {
      title,
      content,
      authorId: userId,
    };

    // Only add prayerRequestId if it's provided and not empty
    if (prayerRequestId && prayerRequestId.trim() !== '') {
      data.prayerRequestId = prayerRequestId;
    }

    return this.prisma.testimony.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        prayerRequest: {
          select: {
            id: true,
            content: true,
          },
        },
      },
    });
  }

  async getTestimonies(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [testimonies, total] = await Promise.all([
      this.prisma.testimony.findMany({
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          prayerRequest: {
            select: {
              id: true,
              content: true,
            },
          },
          _count: {
            select: { encouragements: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.testimony.count(),
    ]);

    return {
      testimonies: testimonies.map(t => ({
        ...t,
        encouragedCount: t._count?.encouragements || 0, // Added optional chaining
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async encourageTestimony(userId: string, testimonyId: string) {
    // Check if testimony exists
    const testimony = await this.prisma.testimony.findUnique({
      where: { id: testimonyId },
    });

    if (!testimony) {
      throw new NotFoundException('Testimony not found');
    }

    // Check if user already encouraged
    const existing = await this.prisma.encouragement.findUnique({
      where: {
        testimonyId_memberId: {
          testimonyId,
          memberId: userId,
        },
      },
    });

    if (existing) {
      return { message: 'You already encouraged this testimony' };
    }

    // Create encouragement
    await this.prisma.encouragement.create({
      data: {
        testimonyId,
        memberId: userId,
      },
    });

    // Update the encouraged count
    await this.prisma.testimony.update({
      where: { id: testimonyId },
      data: {
        encouragedCount: {
          increment: 1,
        },
      },
    });

    return { message: 'Encouragement recorded' };
  }
}