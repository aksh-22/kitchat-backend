import { IsIn, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CHPatchDto {
  @IsOptional()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  description: string;

  @IsIn(['true', 'false'])
  duplicateTitleAllowed: string;
}
