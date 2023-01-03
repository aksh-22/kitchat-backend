import { IsNotEmpty } from 'class-validator';

export class RemoveNotificationDto {
  @IsNotEmpty()
  deviceId: string;
}
