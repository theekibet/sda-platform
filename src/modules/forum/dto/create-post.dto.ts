export class CreatePostDto {
    title: string;
    content: string;
    isAnonymous?: boolean;
    location?: string;
  }