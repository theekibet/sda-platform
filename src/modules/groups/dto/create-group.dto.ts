// Update the enum to include string values
export enum GroupCategory {
    MUSIC = 'MUSIC',
    BIBLE_STUDY = 'BIBLE_STUDY',
    PRAYER = 'PRAYER',
    MENTAL_HEALTH = 'MENTAL_HEALTH',
    SPORTS = 'SPORTS',
    ARTS = 'ARTS',
    CAREER = 'CAREER',
    OUTREACH = 'OUTREACH',
    ONLINE = 'ONLINE',
    OTHER = 'OTHER',
  }
  
  export class CreateGroupDto {
    name: string;
    description: string;
    category: GroupCategory;
    isPrivate?: boolean;
    location?: string;
    rules?: string;
    requireApproval?: boolean;
    imageUrl?: string;
  }