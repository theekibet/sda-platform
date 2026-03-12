// src/modules/announcements/dto/update-announcement.dto.ts
import { IsString, IsOptional, IsIn, IsArray, IsBoolean, IsDateString } from 'class-validator';

export class UpdateAnnouncementDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsIn(['info', 'warning', 'success', 'maintenance'])
  type?: 'info' | 'warning' | 'success' | 'maintenance';

  @IsOptional()
  @IsIn(['all', 'admin', 'user'])
  targetRole?: 'all' | 'admin' | 'user';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetUsers?: string[];

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()  
  @IsBoolean()   
  isActive?: boolean;
}