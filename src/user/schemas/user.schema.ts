import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'App',
    required: true,
  })
  appId: Types.ObjectId;

  @Prop({ required: true })
  teamId: string;

  @Prop({ required: true })
  referenceId: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({})
  avatar: string;

  @Prop({ type: Object })
  notificationIds: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
