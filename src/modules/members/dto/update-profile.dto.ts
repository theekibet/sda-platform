export class UpdateProfileDto {
  name?: string;
  email?: string;
  dateOfBirth?: Date;
  baptismDate?: Date;
  skills?: string[];
  currentPassword?: string;
  newPassword?: string;
  
  // ============ NEW LOCATION FIELDS ============
  locationName?: string;      // e.g., "Nairobi, Kenya"
  locationPrivacy?: 'exact' | 'city' | 'country' | 'none';
}