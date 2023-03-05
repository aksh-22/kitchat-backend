import { IsMongoId, IsNotEmpty } from 'class-validator';

export class ChDeleteAttachment {
  @IsNotEmpty()
  url: string;
}
