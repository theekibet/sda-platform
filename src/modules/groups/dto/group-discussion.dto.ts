export class CreateDiscussionDto {
    title: string;
    content: string;
    groupId: string;
  }
  
  export class CreateDiscussionReplyDto {
    content: string;
    discussionId: string;
  }