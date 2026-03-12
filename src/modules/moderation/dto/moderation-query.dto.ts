// src/modules/moderation/dto/moderation-query.dto.ts
import { IsOptional, IsString, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ModerationQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['forumPost', 'forumReply', 'prayerRequest', 'testimony', 'groupDiscussion', 'user'])
  type?: string;

  @IsOptional()
  @IsString()
  @IsIn(['pending', 'investigating', 'resolved', 'dismissed'])
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(['low', 'medium', 'high', 'critical'])
  severity?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;
}