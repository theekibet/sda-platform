import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { FeatureFlagDto } from './dto/feature-flag.dto';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, AdminGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getAllSettings() {
    return this.settingsService.getAllSettings();
  }

  @Get('public')
  getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }

  @Get(':key')
  getSetting(@Param('key') key: string) {
    return this.settingsService.getSetting(key);
  }

  @Put(':key')
  updateSetting(
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
  ) {
    return this.settingsService.updateSetting(key, dto);
  }

  @Get('features/all')
  getAllFeatures() {
    return this.settingsService.getAllFeatures();
  }

  @Get('features/:name')
  getFeatureFlag(@Param('name') name: string) {
    return this.settingsService.getFeatureFlag(name);
  }

  @Put('features/:name')
  updateFeatureFlag(
    @Param('name') name: string,
    @Body() dto: FeatureFlagDto,
  ) {
    return this.settingsService.updateFeatureFlag(name, dto);
  }
}