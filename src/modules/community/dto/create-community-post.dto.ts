// src/modules/community/dto/create-community-post.dto.ts
import { IsString, IsOptional, IsDateString, IsNumber, Min, Max, IsEmail, IsIn } from 'class-validator';

export class CreateCommunityPostDto {
  @IsString()
  @IsIn(['event', 'support', 'ride', 'donation', 'announcement', 'general'])
  type: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  // Event fields (optional)
  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @IsOptional()
  @IsString()
  location?: string;

  // Support/Donation fields (optional)
  @IsOptional()
  @IsNumber()
  @Min(0)
  goalAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentAmount?: number;

  @IsOptional()
  @IsString()
  itemsNeeded?: string;

  // Ride sharing fields (optional)
  @IsOptional()
  @IsString()
  fromLocation?: string;

  @IsOptional()
  @IsString()
  toLocation?: string;

  @IsOptional()
  @IsDateString()
  departureTime?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  seatsAvailable?: number;

  // Contact info (optional)
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;
}