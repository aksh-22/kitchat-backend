import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CHParticipantAddDto {
  @IsNotEmpty()
  @IsMongoId()
  channelId: string;

  @IsNotEmpty()
  @IsMongoId()
  participantId: string;
}
