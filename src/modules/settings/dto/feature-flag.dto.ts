export class FeatureFlagDto {
  name: string;
  description?: string;
  enabled: boolean;
  percentage?: number;
  userGroups?: string[];
}
