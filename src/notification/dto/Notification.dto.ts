import { IsNotEmpty } from 'class-validator';

export class NotificationDto {
  @IsNotEmpty()
  playerId: string;

  @IsNotEmpty()
  deviceId: string;
}
