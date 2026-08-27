import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export const USER_STATUSES = ['ACTIVE', 'INVITED', 'DEACTIVATED'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({ required: true, enum: USER_STATUSES, default: 'ACTIVE' })
  status!: UserStatus;

  @Prop({ required: true, default: 'en' })
  locale!: string;

  @Prop({ type: [String], required: true, default: [] })
  roleKeys!: string[];

  @Prop({ type: [String], required: true, default: [] })
  permissions!: string[];

  @Prop()
  lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });

UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const record = ret as unknown as Record<string, unknown> & { _id?: unknown };
    delete record.passwordHash;
    delete record.__v;
    record.id = String(record._id);
    return record;
  },
});
