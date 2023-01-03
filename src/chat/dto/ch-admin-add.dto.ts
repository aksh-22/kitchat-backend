import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CHAdminAddDto {
  @IsNotEmpty()
  @IsMongoId()
  channelId: string;

  @IsNotEmpty()
  @IsMongoId()
  adminId: string;
}
