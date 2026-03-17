import { IsBoolean, IsOptional, IsIn } from 'class-validator';

export class LocationConsentDto {
  @IsBoolean()
  enableLocation: boolean;

  @IsOptional()
  @IsIn(['exact', 'city', 'country', 'none'])
  privacyLevel?: string;
}