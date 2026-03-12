export class CreateReplyDto {
    content: string;
    postId: string;
    isAnonymous?: boolean;
  }