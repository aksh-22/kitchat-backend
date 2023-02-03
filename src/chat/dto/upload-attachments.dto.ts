import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CHUploadAttachments {
  @IsNotEmpty()
  attachments: [];
}
