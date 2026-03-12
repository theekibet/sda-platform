export class ReportQueryDto {
    status?: 'pending' | 'investigating' | 'resolved' | 'dismissed';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    page?: number;
    limit?: number;
    search?: string;
  }