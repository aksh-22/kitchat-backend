import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type AppDocument = App & Document;

@Schema()
export class App {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  apiKey: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  })
  customerId: Types.ObjectId;
}

export const AppSchema = SchemaFactory.createForClass(App);
