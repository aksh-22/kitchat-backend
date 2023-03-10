import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsOptional } from 'class-validator';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type ChannelDocument = Channel & Document;

@Schema()
class Attachment {
  @Prop()
  original: string;

  @Prop()
  thumbnail: string;
}

@Schema()
export class Channel {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'App',
    required: true,
  })
  appId: Types.ObjectId;

  @Prop({})
  title: string;

  @Prop({})
  description: string;

  @Prop({ required: true, default: [] })
  participants: string[];

  @Prop({ required: true, default: [] })
  admins: string[];

  @Prop({ required: true, default: [] })
  mutedMembers: string[];

  @Prop({})
  teamId: string;

  @Prop({
    required: true,
    enum: ['DIRECT', 'CHANNEL_PUBLIC', 'CHANNEL_PRIVATE'],
  })
  type: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
  })
  createdBy: Types.ObjectId;

  @Prop({
    default: new Date(),
  })
  lastUpdatedAt: Date;

  @Prop({
    default: new Date(),
  })
  createdAt: Date;

  @Prop({ required: true, default: [] })
  participantsDetails: [MongooseSchema.Types.Mixed];

  @Prop({ default: [], required: false })
  @IsOptional()
  attachments: [Attachment];
}

export const ChannelSchema = SchemaFactory.createForClass(Channel);
