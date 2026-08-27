import { Router } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import {
  ROLE_KEYS,
  TENANT_OWNER_PERMISSIONS,
} from './shared';
import { AuditLogModel, RefreshTokenModel, TenantModel, UserModel } from './models';
import {
  comparePassword,
  createRefreshToken,
  hashPassword,
  hashToken,
  publicUser,
  signAccessToken,
} from './auth-utils';
import { env } from './config';
import { requireAuth } from './middleware';

export const authRouter = Router();

const registerSchema = z.object({
  tenantName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(72),
  tenantSlug: z.string().trim().min(1).max(80).optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(16),
});

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'validation.failed' });
  }

  const email = parsed.data.email.toLowerCase();
  const slug = await uniqueSlug(parsed.data.tenantName);
  const tenant = await TenantModel.create({
    name: parsed.data.tenantName,
    slug,
    status: 'ACTIVE',
    locale: 'en',
    brandName: 'MoneyZone',
    tagline: 'Financial Services',
    logoUrl: '/moneyzone-logo.png',
  });

  try {
    const user = await UserModel.create({
      tenantId: tenant._id,
      email,
      passwordHash: await hashPassword(parsed.data.password),
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      status: 'ACTIVE',
      locale: 'en',
      roleKeys: [ROLE_KEYS.TENANT_OWNER],
      permissions: [...TENANT_OWNER_PERMISSIONS],
    });

    await AuditLogModel.create({
      tenantId: tenant._id,
      actorUserId: user._id,
      action: 'auth.register',
      resource: 'user',
      metadata: { email },
    });

    return res.status(201).json(await issueAuth(user, tenant));
  } catch (error) {
    await UserModel.deleteMany({ tenantId: tenant._id });
    await TenantModel.deleteOne({ _id: tenant._id });
    if (typeof error === 'object' && error && 'code' in error && error.code === 11000) {
      return res.status(409).json({ message: 'auth.email_taken' });
    }
    throw error;
  }
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'validation.failed' });
  }

  const email = parsed.data.email.toLowerCase();
  const matches = await UserModel.find({ email, status: 'ACTIVE' })
    .select('+passwordHash')
    .exec();

  if (matches.length === 0) {
    return res.status(401).json({ message: 'auth.invalid_credentials' });
  }

  let user = matches[0];
  if (parsed.data.tenantSlug) {
    const tenant = await TenantModel.findOne({
      slug: parsed.data.tenantSlug.toLowerCase().trim(),
    }).exec();
    const matched = matches.find(
      (candidate) => tenant && String(candidate.tenantId) === String(tenant._id),
    );
    if (!tenant || !matched) {
      return res.status(401).json({ message: 'auth.invalid_credentials' });
    }
    user = matched;
  } else if (matches.length > 1) {
    return res.status(422).json({ message: 'auth.tenant_required' });
  }

  if (!user.passwordHash || !(await comparePassword(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ message: 'auth.invalid_credentials' });
  }

  const tenant = await TenantModel.findById(user.tenantId).exec();
  if (!tenant || tenant.status !== 'ACTIVE') {
    return res.status(401).json({ message: 'auth.invalid_credentials' });
  }

  user.lastLoginAt = new Date();
  await user.save();
  await AuditLogModel.create({
    tenantId: tenant._id,
    actorUserId: user._id,
    action: 'auth.login',
    resource: 'user',
    metadata: { email },
  });

  return res.json(await issueAuth(user, tenant));
});

authRouter.post('/refresh', async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'validation.failed' });
  }

  const stored = await RefreshTokenModel.findOne({
    tokenHash: hashToken(parsed.data.refreshToken),
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  }).exec();

  if (!stored) {
    return res.status(401).json({ message: 'auth.unauthorized' });
  }

  stored.revokedAt = new Date();
  await stored.save();

  const user = await UserModel.findById(stored.userId).exec();
  const tenant = await TenantModel.findById(stored.tenantId).exec();
  if (!user || user.status !== 'ACTIVE' || !tenant || tenant.status !== 'ACTIVE') {
    return res.status(401).json({ message: 'auth.unauthorized' });
  }

  return res.json({
    accessToken: signAccessToken({ sub: String(user._id), tenantId: String(tenant._id) }),
    refreshToken: await createRefreshToken(String(user._id), String(tenant._id)),
    expiresIn: env.JWT_EXPIRES_IN,
  });
});

authRouter.post('/logout', requireAuth, async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (parsed.success && req.authUser) {
    await RefreshTokenModel.updateOne(
      {
        tokenHash: hashToken(parsed.data.refreshToken),
        tenantId: new mongoose.Types.ObjectId(req.authUser.tenantId),
      },
      { $set: { revokedAt: new Date() } },
    );
  }
  return res.json({ success: true });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await UserModel.findById(req.authUser?.id).exec();
  const tenant = await TenantModel.findById(req.authUser?.tenantId).exec();
  if (!user || !tenant) {
    return res.status(401).json({ message: 'auth.unauthorized' });
  }
  return res.json(publicUser(user, tenant));
});

async function issueAuth(
  user: { _id: unknown; tenantId: unknown; email: string; firstName: string; lastName: string; status: string; locale: string; roleKeys: string[]; permissions: string[] },
  tenant: { _id: unknown; name: string; slug: string; status: string; locale: string },
) {
  return {
    user: publicUser(user, tenant),
    tokens: {
      accessToken: signAccessToken({
        sub: String(user._id),
        tenantId: String(tenant._id),
      }),
      refreshToken: await createRefreshToken(String(user._id), String(tenant._id)),
      expiresIn: env.JWT_EXPIRES_IN,
    },
  };
}

async function uniqueSlug(name: string): Promise<string> {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'workspace';
  let slug = base;
  let attempt = 0;
  while (await TenantModel.exists({ slug })) {
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
  return slug;
}
