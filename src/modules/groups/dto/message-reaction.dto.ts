import { IsEnum, IsString } from 'class-validator';

export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  PRAY = 'pray',
  AMEN = 'amen',
  THANKS = 'thanks'
}

export class MessageReactionDto {
  @IsString()
  messageId: string;

  @IsEnum(ReactionType)
  reaction: ReactionType;
}