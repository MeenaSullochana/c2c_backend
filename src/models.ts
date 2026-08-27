import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const tenantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, required: true, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
    locale: { type: String, required: true, default: 'en' },
    brandName: { type: String, trim: true, default: 'MoneyZone' },
    tagline: { type: String, trim: true, default: 'Financial Services' },
    logoUrl: { type: String, trim: true, default: '/moneyzone-logo.png' },
    supportEmail: { type: String, trim: true, default: '' },
    supportPhone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
  },
  { timestamps: true, collection: 'tenants' },
);

const userSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    status: {
      type: String,
      required: true,
      enum: ['ACTIVE', 'INVITED', 'DEACTIVATED'],
      default: 'ACTIVE',
    },
    locale: { type: String, required: true, default: 'en' },
    roleKeys: { type: [String], required: true, default: [] },
    permissions: { type: [String], required: true, default: [] },
    lastLoginAt: { type: Date },
  },
  { timestamps: true, collection: 'users' },
);

userSchema.index({ tenantId: 1, email: 1 }, { unique: true });

const refreshTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
  },
  { timestamps: true, collection: 'refresh_tokens' },
);

const auditLogSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant' },
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    resource: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true, collection: 'audit_logs' },
);

export type Tenant = InferSchemaType<typeof tenantSchema> & { _id: mongoose.Types.ObjectId };
export type User = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };

export const TenantModel: Model<Tenant> =
  mongoose.models.Tenant ?? mongoose.model<Tenant>('Tenant', tenantSchema);
export const UserModel: Model<User> =
  mongoose.models.User ?? mongoose.model<User>('User', userSchema);
export const RefreshTokenModel =
  mongoose.models.RefreshToken ?? mongoose.model('RefreshToken', refreshTokenSchema);
export const AuditLogModel =
  mongoose.models.AuditLog ?? mongoose.model('AuditLog', auditLogSchema);
