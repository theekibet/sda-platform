export class RateLimitDto {
  endpoint: string;
  limit: number;
  window: number; // in seconds
  message?: string;
}
