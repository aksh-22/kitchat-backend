import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema()
export class Message {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  sender: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, default: new Date() })
  createdAt: Date;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Channel',
    required: true,
  })
  channelId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'App',
    required: true,
  })
  appId: Types.ObjectId;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
