// src/modules/notifications/dto/create-notification.dto.ts
export class CreateNotificationDto {
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    userId: string;
  }
  
  // src/modules/notifications/dto/notification-query.dto.ts
  export class NotificationQueryDto {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }
  