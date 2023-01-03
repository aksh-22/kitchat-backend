import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class CHMessageAddDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsMongoId()
  channelId: string;
}
