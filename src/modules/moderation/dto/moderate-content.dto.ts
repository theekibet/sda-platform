export class ModerateContentDto {
    action: 'approve' | 'remove' | 'warn' | 'flag' | 'dismiss';
    reason?: string;
    notifyUser?: boolean;
    sendWarning?: boolean;
    warningMessage?: string;
  }