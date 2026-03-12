export class BackupDto {
  filename: string;
  type?: 'manual' | 'scheduled' | 'pre-update';
  includeTables?: string[];
  excludeTables?: string[];
}
