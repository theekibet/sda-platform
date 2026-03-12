export class SuspendUserDto {
    suspend: boolean;
    until?: string; // ISO date string
    reason?: string;
  }