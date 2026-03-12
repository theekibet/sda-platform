import { 
    Controller, Get, Post, Body, Param, Query, 
    UseGuards, DefaultValuePipe, ParseIntPipe 
  } from '@nestjs/common';
  import { ModerationService } from './moderation.service';
  import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
  import { AdminGuard } from '../../common/guards/admin.guard';
  import { CurrentUser } from '../../common/decorators/current-user.decorator';
  import { ModerateContentDto } from './dto/moderate-content.dto';
  import { ModerationQueryDto } from './dto/moderation-query.dto';
  
  @Controller('admin/moderation')
  @UseGuards(JwtAuthGuard, AdminGuard)
  export class ModerationController {
    constructor(private readonly moderationService: ModerationService) {}
  
    @Get('queue')
    getModerationQueue(@Query() query: ModerationQueryDto) {
      return this.moderationService.getModerationQueue(query);
    }
  
    @Get('content/:contentType/:contentId')
    getContentForReview(
      @Param('contentId') contentId: string,
      @Param('contentType') contentType: string,
    ) {
      return this.moderationService.getContentForReview(contentId, contentType);
    }
  
    @Post('content/:contentType/:contentId')
    moderateContent(
      @CurrentUser() admin: any,
      @Param('contentId') contentId: string,
      @Param('contentType') contentType: string,
      @Body() dto: ModerateContentDto,
    ) {
      return this.moderationService.moderateContent(
        admin.id,
        contentId,
        contentType,
        dto,
      );
    }
  
    @Get('logs')
    getModerationLogs(@Query() query: any) {
      return this.moderationService.getModerationLogs(query);
    }
  
    @Post('check-content')
    checkContent(
      @Body('content') content: string,
      @Body('contentType') contentType: string,
      @Body('authorId') authorId?: string,
    ) {
      return this.moderationService.checkContentForFlags(content, contentType, authorId);
    }
  }