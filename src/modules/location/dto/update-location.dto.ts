import { IsString, IsOptional, IsBoolean, IsIn, IsNumber, Min, Max } from 'class-validator';

export class UpdateLocationDto {
  @IsOptional()
  @IsString()
  locationName?: string;  // Changed from city/region/country

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  showLocation?: boolean;  // Keep for backward compatibility

  @IsOptional()
  @IsIn(['exact', 'city', 'country', 'none'])
  locationPrivacy?: string;
}