import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { BlockIpDto } from './dto/block-ip.dto';
import { RateLimitDto } from './dto/rate-limit.dto';

@Injectable()
export class SecurityService {
  constructor(private prisma: PrismaService) {}

  // ============ IP BLOCKING ============

  async getBlockedIPs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [ips, total] = await Promise.all([
      this.prisma.blockedIP.findMany({
        where: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
          isActive: true,
        },
        include: {
          blockedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.blockedIP.count({
        where: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
          isActive: true,
        },
      }),
    ]);

    return {
      ips,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async blockIP(dto: BlockIpDto) {
    const { ipAddress, reason, expiresAt } = dto;

    const existing = await this.prisma.blockedIP.findUnique({
      where: { ipAddress },
    });

    if (existing) {
      // Update existing
      return this.prisma.blockedIP.update({
        where: { ipAddress },
        data: {
          reason,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          isActive: true,
        },
      });
    } else {
      // Create new
      return this.prisma.blockedIP.create({
        data: {
          ipAddress,
          reason,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      });
    }
  }

  async unblockIP(ipAddress: string) {
    const existing = await this.prisma.blockedIP.findUnique({
      where: { ipAddress },
    });

    if (!existing) {
      throw new NotFoundException(`IP ${ipAddress} not found in blocklist`);
    }

    await this.prisma.blockedIP.update({
      where: { ipAddress },
      data: {
        isActive: false,
      },
    });

    return { success: true, message: `IP ${ipAddress} unblocked` };
  }

  // ============ RATE LIMITING ============

  async getRateLimits() {
    // This would typically come from a config file or database
    // For now, return default limits
    return {
      global: { limit: 100, window: 60 }, // 100 requests per minute
      auth: { limit: 5, window: 60 }, // 5 login attempts per minute
      api: { limit: 1000, window: 3600 }, // 1000 requests per hour
    };
  }

  async updateRateLimit(dto: RateLimitDto) {
    // This would update rate limit config in database
    // For now, just return success
    return {
      success: true,
      message: `Rate limit for ${dto.endpoint} updated`,
      config: dto,
    };
  }

  // ============ SESSION MANAGEMENT ============

  async getActiveSessions(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      this.prisma.userSession.findMany({
        where: {
          expiresAt: { gt: new Date() },
          isRevoked: false,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { lastActive: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userSession.count({
        where: {
          expiresAt: { gt: new Date() },
          isRevoked: false,
        },
      }),
    ]);

    return {
      sessions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async terminateSession(sessionId: string) {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });

    return { success: true, message: 'Session terminated' };
  }

  async terminateAllUserSessions(userId: string) {
    await this.prisma.userSession.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    return { success: true, message: `All sessions for user ${userId} terminated` };
  }

  // ============ LOGIN ATTEMPTS ============

  async getLoginAttempts(days = 7, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [attempts, total] = await Promise.all([
      this.prisma.loginAttempt.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.loginAttempt.count({
        where: { createdAt: { gte: startDate } },
      }),
    ]);

    return {
      attempts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFailedLoginAttempts(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const failed = await this.prisma.loginAttempt.groupBy({
      by: ['email'],
      where: {
        createdAt: { gte: startDate },
        success: false,
      },
      _count: true,
    });

    return failed.map(f => ({
      email: f.email,
      attempts: f._count,
    }));
  }
}