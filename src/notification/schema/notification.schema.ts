import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema()
export class Notification {
  @Prop({ isRequired: true })
  title: string;

  @Prop({ isRequired: true })
  message: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', isRequired: true })
  senderId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', isRequired: true })
  receiverId: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
