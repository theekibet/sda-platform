export class AdminResetPasswordDto {
    userId: string;
    newPassword: string;
    sendEmail?: boolean;
  }