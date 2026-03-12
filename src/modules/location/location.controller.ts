import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { LocationService } from './location.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateLocationDto } from './dto/update-location.dto';

@Controller('location')
@UseGuards(JwtAuthGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post('update')
  updateLocation(
    @CurrentUser() user: any,
    @Body() locationData: UpdateLocationDto,
  ) {
    return this.locationService.updateUserLocation(user.id, locationData);
  }

  @Get('nearby')
  findNearby(
    @CurrentUser() user: any,
    @Query('city') city: string,
  ) {
    return this.locationService.findNearbyUsers(city || user.city, user.id);
  }

  @Get('stats')
  getLocationStats(@Query('city') city: string) {
    return this.locationService.getLocationStats(city);
  }
}