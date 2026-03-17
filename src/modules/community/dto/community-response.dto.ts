// src/modules/community/dto/community-response.dto.ts
import { IsString, IsOptional, IsIn } from 'class-validator';

export class CommunityResponseDto {
  @IsString()
  @IsIn(['interested', 'going', 'helping', 'praying'])
  response: string;

  @IsOptional()
  @IsString()
  comment?: string;
}