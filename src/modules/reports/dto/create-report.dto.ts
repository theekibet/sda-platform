export class CreateReportDto {
    contentType: 'prayerRequest' | 'testimony' | 'groupDiscussion' | 'user';
    contentId: string;
    category: 'spam' | 'harassment' | 'inappropriate' | 'fake' | 'other';
    description?: string;
  }
