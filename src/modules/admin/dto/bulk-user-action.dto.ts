export class BulkUserActionDto {
    action: 'suspend' | 'unsuspend' | 'delete' | 'makeAdmin' | 'removeAdmin';
    userIds: string[];
    reason?: string;
    duration?: string; // For suspensions: '1', '7', '30', 'permanent'
  }
  