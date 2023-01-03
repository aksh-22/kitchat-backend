import { IsMongoId, IsNotEmpty } from 'class-validator';

export class ChMessageDto {
  @IsNotEmpty()
  @IsMongoId()
  channelId: string;
}
