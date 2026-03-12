import { 
    Controller, Get, Post, Body, Param, Query, 
    UseGuards, DefaultValuePipe, ParseIntPipe 
  } from '@nestjs/common';
  import { ReportsService } from './reports.service';
  import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
  import { CurrentUser } from '../../common/decorators/current-user.decorator';
  import { CreateReportDto } from './dto/create-report.dto';
  import { ReportQueryDto } from './dto/report-query.dto';
  
  @Controller('reports')
  @UseGuards(JwtAuthGuard)
  export class ReportsController {
    constructor(private readonly reportsService: ReportsService) {}
  
    @Post()
    createReport(
      @CurrentUser() user: any,
      @Body() dto: CreateReportDto,
    ) {
      return this.reportsService.createReport(user.id, dto);
    }
  
    @Get('my-reports')
    getMyReports(
      @CurrentUser() user: any,
      @Query() query: ReportQueryDto,
    ) {
      return this.reportsService.getMyReports(user.id, query);
    }
  
    @Get('my-reports/:reportId')
    getReportById(
      @CurrentUser() user: any,
      @Param('reportId') reportId: string,
    ) {
      return this.reportsService.getReportById(user.id, reportId);
    }
  }