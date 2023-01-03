import { IsIn, IsNotEmpty, IsOptional } from 'class-validator';

export class CHCreatePvtDto {
  @IsNotEmpty()
  title: string;

  @IsOptional()
  description: string;

  @IsOptional()
  teamId: string;

  @IsIn(['true', 'false'])
  duplicateTitleAllowed: string;
}
