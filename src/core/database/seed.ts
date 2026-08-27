import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as bcrypt from 'bcryptjs';
import mongoose, { Schema } from 'mongoose';
import {
  ROLE_KEYS,
  TENANT_ADMIN_PERMISSIONS,
  TENANT_MEMBER_PERMISSIONS,
  TENANT_OWNER_PERMISSIONS,
} from '../../shared';

const DEMO_PASSWORD = 'Password123!';

const TenantModel = mongoose.model(
  'Tenant',
  new Schema(
    {
      name: { type: String, required: true, trim: true },
      slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
      status: { type: String, required: true, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
      locale: { type: String, required: true, default: 'en' },
    },
    { timestamps: true, collection: 'tenants' },
  ),
);

const UserModel = mongoose.model(
  'User',
  new Schema(
    {
      tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      passwordHash: { type: String, required: true },
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
  ),
);

function loadEnv(): void {
  const files = [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../.env')];

  for (const file of files) {
    try {
      const text = readFileSync(file, 'utf8');
      for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) {
          continue;
        }
        const separator = line.indexOf('=');
        if (separator === -1) {
          continue;
        }
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim();
        if (key && process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    } catch {
      // File may not exist.
    }
  }
}

async function main() {
  loadEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is missing');
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB database c2c');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const acme = await TenantModel.findOneAndUpdate(
    { slug: 'acme-hr' },
    {
      $set: {
        name: 'Acme HR',
        slug: 'acme-hr',
        status: 'ACTIVE',
        locale: 'en',
      },
    },
    { upsert: true, new: true },
  );

  const nimbus = await TenantModel.findOneAndUpdate(
    { slug: 'nimbus-leads' },
    {
      $set: {
        name: 'Nimbus Leads',
        slug: 'nimbus-leads',
        status: 'ACTIVE',
        locale: 'en',
      },
    },
    { upsert: true, new: true },
  );

  const users = [
    {
      tenantId: acme._id,
      email: 'owner@acme.test',
      firstName: 'Asha',
      lastName: 'Iyer',
      roleKeys: [ROLE_KEYS.TENANT_OWNER],
      permissions: [...TENANT_OWNER_PERMISSIONS],
    },
    {
      tenantId: acme._id,
      email: 'admin@acme.test',
      firstName: 'Rahul',
      lastName: 'Menon',
      roleKeys: [ROLE_KEYS.TENANT_ADMIN],
      permissions: [...TENANT_ADMIN_PERMISSIONS],
    },
    {
      tenantId: acme._id,
      email: 'member@acme.test',
      firstName: 'Priya',
      lastName: 'Nair',
      roleKeys: [ROLE_KEYS.TENANT_MEMBER],
      permissions: [...TENANT_MEMBER_PERMISSIONS],
    },
    {
      tenantId: nimbus._id,
      email: 'owner@nimbus.test',
      firstName: 'Omar',
      lastName: 'Khan',
      roleKeys: [ROLE_KEYS.TENANT_OWNER],
      permissions: [...TENANT_OWNER_PERMISSIONS],
    },
    {
      tenantId: nimbus._id,
      email: 'sales@nimbus.test',
      firstName: 'Lina',
      lastName: 'George',
      roleKeys: [ROLE_KEYS.TENANT_ADMIN],
      permissions: [...TENANT_ADMIN_PERMISSIONS],
    },
  ];

  for (const user of users) {
    await UserModel.findOneAndUpdate(
      { tenantId: user.tenantId, email: user.email },
      { $set: { ...user, status: 'ACTIVE', locale: 'en', passwordHash } },
      { upsert: true, new: true },
    );
  }

  console.log('Seeded workspaces: acme-hr, nimbus-leads');
  console.log('Demo password for all seeded users: Password123!');
  console.log(
    'Logins: owner@acme.test, admin@acme.test, member@acme.test, owner@nimbus.test, sales@nimbus.test',
  );

  await mongoose.disconnect();
}

main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
