import { IsNotEmpty, IsOptional } from 'class-validator';

export class ConnectUserDto {
  @IsNotEmpty()
  teamId: string;

  @IsNotEmpty()
  referenceId: string;

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  avatar: string;
}
