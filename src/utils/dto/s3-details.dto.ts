import { IsNotEmpty, IsOptional } from 'class-validator';

export class s3DetailsDto {
  @IsNotEmpty()
  accessKeyId: string;

  @IsNotEmpty()
  secretAccessKey: string;

  @IsNotEmpty()
  bucketName: string;

  @IsOptional()
  region: string;
}
