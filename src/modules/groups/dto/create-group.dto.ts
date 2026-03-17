// src/modules/groups/dto/create-group.dto.ts
import { IsString, IsOptional, IsBoolean, IsEnum, IsNotEmpty } from 'class-validator';

// Update the enum to include string values
export enum GroupCategory {
  MUSIC = 'MUSIC',
  BIBLE_STUDY = 'BIBLE_STUDY',
  PRAYER = 'PRAYER',
  MENTAL_HEALTH = 'MENTAL_HEALTH',
  SPORTS = 'SPORTS',
  ARTS = 'ARTS',
  CAREER = 'CAREER',
  OUTREACH = 'OUTREACH',
  ONLINE = 'ONLINE',
  OTHER = 'OTHER',
  GENERAL = 'GENERAL',
}

export enum MeetingType {
  ONLINE = 'online',
  IN_PERSON = 'in-person',
  HYBRID = 'hybrid',
}

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty({ message: 'Group name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Group description is required' })
  description: string;

  @IsEnum(GroupCategory, { message: 'Invalid category' })
  category: GroupCategory;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsString()
  location?: string; // Display location (e.g., "Nairobi, Kenya" or "Online")

  @IsOptional()
  @IsString()
  rules?: string;

  @IsOptional()
  @IsBoolean()
  requireApproval?: boolean;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  // ============ NEW FIELDS ============

  /**
   * Explicitly marks if this group is location-specific
   * Only set to true if the group genuinely serves a specific geographic area
   * Examples:
   * - true: "Nairobi CBD Young Professionals" (meets in person)
   * - false: "Music Ministry Discussion" (interest-based, location-independent)
   */
  @IsOptional()
  @IsBoolean()
  isLocationBased?: boolean;

  /**
   * How the group primarily meets
   * - online: Virtual meetings only
   * - in-person: Physical meetups required
   * - hybrid: Both online and in-person options
   */
  @IsOptional()
  @IsEnum(MeetingType, { message: 'Invalid meeting type' })
  meetingType?: MeetingType;
}