// src/modules/announcements/dto/create-announcement.dto.ts
import { IsString, IsOptional, IsIn, IsArray, IsBoolean, IsDateString } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

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