import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from './config';
import { RefreshTokenModel } from './models';

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signAccessToken(payload: { sub: string; tenantId: string }): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): { sub: string; tenantId: string } {
  return jwt.verify(token, env.JWT_SECRET) as { sub: string; tenantId: string };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createRefreshToken(userId: string, tenantId: string) {
  const refreshToken = randomBytes(32).toString('hex');
  const days = Number(/^(\d+)d$/.exec(env.JWT_REFRESH_EXPIRES_IN)?.[1] ?? 7);
  await RefreshTokenModel.create({
    userId,
    tenantId,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
  });
  return refreshToken;
}

export function publicUser(user: {
  _id: unknown;
  tenantId: unknown;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  locale: string;
  roleKeys: string[];
  permissions: string[];
  employeeId?: unknown;
  accessScope?: string;
}, tenant: {
  _id: unknown;
  name: string;
  slug: string;
  status: string;
  locale: string;
  brandName?: string;
  tagline?: string;
  logoUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  address?: string;
  website?: string;
}, scopeMeta?: {
  employeeId?: string | null;
  accessScope?: string;
  orgRole?: string | null;
  branch?: { id: string; name: string; code?: string } | null;
  city?: { id: string; name: string } | null;
  state?: { id: string; name: string; code?: string } | null;
  country?: { id: string; name: string; code?: string } | null;
}) {
  return {
    id: String(user._id),
    tenantId: String(user.tenantId),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    status: user.status,
    locale: user.locale,
    roleKeys: user.roleKeys,
    permissions: user.permissions,
    employeeId: scopeMeta?.employeeId ?? (user.employeeId ? String(user.employeeId) : null),
    accessScope: scopeMeta?.accessScope ?? user.accessScope ?? 'ALL',
    orgRole: scopeMeta?.orgRole ?? null,
    branch: scopeMeta?.branch ?? null,
    city: scopeMeta?.city ?? null,
    state: scopeMeta?.state ?? null,
    country: scopeMeta?.country ?? null,
    tenant: publicTenant(tenant),
  };
}

export function publicTenant(tenant: {
  _id: unknown;
  name: string;
  slug: string;
  status: string;
  locale: string;
  brandName?: string;
  tagline?: string;
  logoUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
  address?: string;
  website?: string;
}) {
  return {
    id: String(tenant._id),
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    locale: tenant.locale,
    brandName: tenant.brandName || 'MoneyZone',
    tagline: tenant.tagline || 'Financial Services',
    logoUrl: tenant.logoUrl || '/moneyzone-logo.png',
    supportEmail: tenant.supportEmail || '',
    supportPhone: tenant.supportPhone || '',
    address: tenant.address || '',
    website: tenant.website || '',
  };
}
