import { 
    Controller, Get, Post, Body, Param, UseGuards, 
    Query, DefaultValuePipe, ParseIntPipe 
  } from '@nestjs/common';
  import { PrayerService } from './prayer.service';
  import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
  import { CurrentUser } from '../../common/decorators/current-user.decorator';
  import { CreatePrayerRequestDto } from './dto/create-prayer-request.dto';
  import { CreateTestimonyDto } from './dto/create-testimony.dto';
  
  @Controller('prayer')
  @UseGuards(JwtAuthGuard)
  export class PrayerController {
    constructor(private readonly prayerService: PrayerService) {}
  
    // ============ PRAYER REQUESTS ============
  
    @Post('requests')
    createPrayerRequest(
      @CurrentUser() user: any,
      @Body() dto: CreatePrayerRequestDto,
    ) {
      return this.prayerService.createPrayerRequest(
        user?.id,
        dto,
        user?.city,
      );
    }
  
    @Get('requests')
    getPrayerRequests(
      @Query('city') city?: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
      @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    ) {
      return this.prayerService.getPrayerRequests(city, page, limit);
    }
  
    @Get('requests/trending')
    getTrendingPrayers() {
      return this.prayerService.getTrendingPrayers();
    }
  
    @Get('requests/:id')
    getPrayerRequestById(@Param('id') id: string) {
      return this.prayerService.getPrayerRequestById(id);
    }
  
    @Post('requests/:id/pray')
    prayForRequest(
      @CurrentUser() user: any,
      @Param('id') requestId: string,
    ) {
      return this.prayerService.prayForRequest(user.id, requestId);
    }
  
    // ============ TESTIMONIES ============
  
    @Post('testimonies')
    createTestimony(
      @CurrentUser() user: any,
      @Body() dto: CreateTestimonyDto,
    ) {
      return this.prayerService.createTestimony(user.id, dto);
    }
  
    @Get('testimonies')
    getTestimonies(
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
      @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    ) {
      return this.prayerService.getTestimonies(page, limit);
    }
  
    @Post('testimonies/:id/encourage')
    encourageTestimony(
      @CurrentUser() user: any,
      @Param('id') testimonyId: string,
    ) {
      return this.prayerService.encourageTestimony(user.id, testimonyId);
    }
  }