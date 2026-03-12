export class UpdateProfileDto {
    name?: string;
    email?: string;
    dateOfBirth?: Date;
    baptismDate?: Date;
    skills?: string[];
    currentPassword?: string;
    newPassword?: string;
  }
  