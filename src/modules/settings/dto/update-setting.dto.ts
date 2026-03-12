export class UpdateSettingDto {
  key: string;
  value: any;
  type?: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  category?: string;
  isPublic?: boolean;
  isEncrypted?: boolean;
}
