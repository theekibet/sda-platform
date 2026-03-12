export class CreateReportDto {
    contentType: 'forumPost' | 'forumReply' | 'prayerRequest' | 'testimony' | 'groupDiscussion' | 'user';
    contentId: string;
    category: 'spam' | 'harassment' | 'inappropriate' | 'fake' | 'other';
    description?: string;
  }