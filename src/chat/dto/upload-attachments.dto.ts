import { IsNotEmpty } from 'class-validator';

export class CHUploadAttachments {
  @IsNotEmpty()
  channelId: string;
}
