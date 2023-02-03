import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class CHMessageUpdateDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsMongoId()
  channelId: string;

  @IsNotEmpty()
  @IsMongoId()
  messageId: string;
}
