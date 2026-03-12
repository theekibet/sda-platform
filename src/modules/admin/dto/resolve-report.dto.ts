// CREATE this file
export class ResolveReportDto {
    action: 'dismiss' | 'warn_user' | 'suspend_user' | 'remove_content' | 'ban_user';
    notes?: string;
    notifyUser?: boolean;
    suspensionDuration?: string;
    warningMessage?: string;
  }