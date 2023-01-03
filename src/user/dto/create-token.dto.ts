import { IsNotEmpty, IsMongoId } from 'class-validator';

export class CreateTokenDto {
  @IsNotEmpty()
  referenceId: string;
}
