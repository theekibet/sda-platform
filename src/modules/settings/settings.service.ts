import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { FeatureFlagDto } from './dto/feature-flag.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAllSettings() {
    const settings = await this.prisma.systemSetting.findMany({
      orderBy: { category: 'asc' },
    });

    // Parse JSON values
    return settings.map(s => ({
      ...s,
      value: this.parseValue(s.value, s.type),
    }));
  }

  async getPublicSettings() {
    const settings = await this.prisma.systemSetting.findMany({
      where: { isPublic: true },
    });

    return settings.map(s => ({
      key: s.key,
      value: this.parseValue(s.value, s.type),
      type: s.type,
    }));
  }

  async getSetting(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting ${key} not found`);
    }

    return {
      ...setting,
      value: this.parseValue(setting.value, setting.type),
    };
  }

  async updateSetting(key: string, dto: UpdateSettingDto) {
    const existing = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    const value = this.stringifyValue(dto.value, dto.type || 'string');

    if (existing) {
      // Update existing
      return this.prisma.systemSetting.update({
        where: { key },
        data: {
          value,
          type: dto.type || existing.type,
          description: dto.description,
          category: dto.category,
          isPublic: dto.isPublic,
          isEncrypted: dto.isEncrypted,
        },
      });
    } else {
      // Create new
      return this.prisma.systemSetting.create({
        data: {
          key: dto.key,
          value,
          type: dto.type || 'string',
          description: dto.description,
          category: dto.category || 'general',
          isPublic: dto.isPublic || false,
          isEncrypted: dto.isEncrypted || false,
        },
      });
    }
  }

  async getAllFeatures() {
    const features = await this.prisma.featureFlag.findMany({
      orderBy: { name: 'asc' },
    });

    return features;
  }

  async getFeatureFlag(name: string) {
    const feature = await this.prisma.featureFlag.findUnique({
      where: { name },
    });

    if (!feature) {
      // Return default if not found
      return { name, enabled: false, description: 'Feature not configured' };
    }

    return feature;
  }

  async updateFeatureFlag(name: string, dto: FeatureFlagDto) {
    const existing = await this.prisma.featureFlag.findUnique({
      where: { name },
    });

    if (existing) {
      return this.prisma.featureFlag.update({
        where: { name },
        data: {
          description: dto.description,
          enabled: dto.enabled,
          percentage: dto.percentage,
          userGroups: dto.userGroups ? JSON.stringify(dto.userGroups) : null,
        },
      });
    } else {
      return this.prisma.featureFlag.create({
        data: {
          name: dto.name,
          description: dto.description,
          enabled: dto.enabled,
          percentage: dto.percentage,
          userGroups: dto.userGroups ? JSON.stringify(dto.userGroups) : null,
        },
      });
    }
  }

  // ============ HELPER METHODS ============

  private parseValue(value: string, type: string): any {
    try {
      switch (type) {
        case 'number':
          return Number(value);
        case 'boolean':
          return value === 'true';
        case 'json':
          return JSON.parse(value);
        default:
          return value;
      }
    } catch {
      return value;
    }
  }

  private stringifyValue(value: any, type: string): string {
    if (type === 'json') {
      return JSON.stringify(value);
    }
    return String(value);
  }
}