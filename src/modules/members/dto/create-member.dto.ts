export class CreateMemberDto {
    name: string;
    phone: string;
    email?: string;
    church?: string;
    conference?: string;
    role: string;
    dateOfBirth?: Date;
    baptismDate?: Date;
    skills?: string[];
  }