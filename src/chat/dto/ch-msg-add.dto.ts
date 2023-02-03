import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CHMessageAddDto {
  @IsOptional()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsMongoId()
  channelId: string;

  @IsOptional()
  attachments: [];
}
