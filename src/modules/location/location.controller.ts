import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { LocationService } from './location.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationConsentDto } from './dto/location-consent.dto';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post('update')
  @UseGuards(JwtAuthGuard)
  async updateLocation(
    @CurrentUser() user: any,
    @Body() locationData: UpdateLocationDto,
  ) {
    const updated = await this.locationService.updateUserLocation(user.id, locationData);
    return {
      success: true,
      message: 'Location updated successfully',
      data: updated,
    };
  }

  @Post('consent')
  @UseGuards(JwtAuthGuard)
  async updateConsent(
    @CurrentUser() user: any,
    @Body() consentData: LocationConsentDto,
  ) {
    const result = await this.locationService.updateLocationConsent(user.id, consentData);
    return {
      success: true,
      message: consentData.enableLocation ? 'Location sharing enabled' : 'Location sharing disabled',
      data: result,
    };
  }



  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getLocationStats() {
    const stats = await this.locationService.getLocationStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('privacy-options')
  getPrivacyOptions() {
    return {
      success: true,
      data: {
        levels: [
          { value: 'exact', label: 'Show exact distance', description: 'Others can see how far away you are (e.g., "2.3km away")' },
          { value: 'city', label: 'Show city only', description: 'Others can see your city name (e.g., "Nairobi")' },
          { value: 'country', label: 'Show country only', description: 'Others can see your country (e.g., "Kenya")' },
          { value: 'none', label: 'Hide location', description: 'Your location is not visible to anyone' },
        ],
        default: 'city',
      },
    };
  }
}