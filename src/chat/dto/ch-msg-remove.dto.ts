import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class CHMessageRemoveDto {
  @IsNotEmpty()
  @IsMongoId()
  messageId: string;
}
