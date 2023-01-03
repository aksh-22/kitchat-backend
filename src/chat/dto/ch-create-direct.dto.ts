import { IsNotEmpty, IsOptional } from 'class-validator';

export class CHCreateDirectDto {
  @IsNotEmpty()
  partnerReferenceId: string;

  @IsOptional()
  teamId: string;
}
