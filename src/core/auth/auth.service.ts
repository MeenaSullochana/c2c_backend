import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { createHash, randomBytes } from 'node:crypto';
import {
  ROLE_KEYS,
  TENANT_OWNER_PERMISSIONS,
} from '../../shared';
import { Model, Types } from 'mongoose';
import type { Env } from '../config/env.schema';
import { RefreshToken, RefreshTokenDocument } from '../database/schemas/refresh-token.schema';
import { Tenant, TenantDocument } from '../database/schemas/tenant.schema';
import { User, UserDocument } from '../database/schemas/user.schema';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';
import type { LoginDto, RegisterDto } from './auth.dto';
import { PasswordService } from './password.service';
import type { AuthTokens, JwtAccessPayload, PublicUser } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Tenant.name) private readonly tenants: Model<TenantDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokens: Model<RefreshTokenDocument>,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
    private readonly usersService: UsersService,
    private readonly audit: AuditService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async register(input: RegisterDto): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    const email = input.email.toLowerCase();
    const slug = await this.uniqueSlug(input.tenantName);

    const tenant = await this.tenants.create({
      name: input.tenantName,
      slug,
      status: 'ACTIVE',
      locale: 'en',
    });

    try {
      const passwordHash = await this.passwords.hash(input.password);
      const user = await this.users.create({
        tenantId: tenant._id,
        email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        status: 'ACTIVE',
        locale: 'en',
        roleKeys: [ROLE_KEYS.TENANT_OWNER],
        permissions: [...TENANT_OWNER_PERMISSIONS],
      });

      const tokens = await this.issueTokens(user, tenant);
      await this.audit.record({
        action: 'auth.register',
        tenantId: String(tenant._id),
        actorUserId: String(user._id),
        resource: 'user',
        metadata: { email },
      });

      return {
        user: await this.usersService.getPublicProfile(
          String(user._id),
          String(tenant._id),
        ),
        tokens,
      };
    } catch (error) {
      await this.users.deleteMany({ tenantId: tenant._id }).exec();
      await this.tenants.deleteOne({ _id: tenant._id }).exec();
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000
      ) {
        throw new ConflictException('auth.email_taken');
      }
      throw error;
    }
  }

  async login(input: LoginDto): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    const email = input.email.toLowerCase();
    const matches = await this.users
      .find({ email, status: 'ACTIVE' })
      .select('+passwordHash')
      .exec();

    if (matches.length === 0) {
      throw new UnauthorizedException('auth.invalid_credentials');
    }

    let user = matches[0];
    if (input.tenantSlug) {
      const tenant = await this.tenants
        .findOne({ slug: input.tenantSlug.toLowerCase().trim() })
        .exec();
      const matched = matches.find(
        (candidate) => tenant && String(candidate.tenantId) === String(tenant._id),
      );
      if (!tenant || !matched) {
        throw new UnauthorizedException('auth.invalid_credentials');
      }
      user = matched;
    } else if (matches.length > 1) {
      throw new UnprocessableEntityException('auth.tenant_required');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('auth.invalid_credentials');
    }

    const valid = await this.passwords.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('auth.invalid_credentials');
    }

    const tenant = await this.tenants.findById(user.tenantId).exec();
    if (!tenant || tenant.status !== 'ACTIVE') {
      throw new UnauthorizedException('auth.invalid_credentials');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const tokens = await this.issueTokens(user, tenant);
    await this.audit.record({
      action: 'auth.login',
      tenantId: String(tenant._id),
      actorUserId: String(user._id),
      resource: 'user',
      metadata: { email },
    });

    return {
      user: await this.usersService.getPublicProfile(
        String(user._id),
        String(tenant._id),
      ),
      tokens,
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.refreshTokens.findOne({
      tokenHash,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    }).exec();

    if (!stored) {
      throw new UnauthorizedException('auth.unauthorized');
    }

    stored.revokedAt = new Date();
    await stored.save();

    const user = await this.users.findById(stored.userId).exec();
    const tenant = await this.tenants.findById(stored.tenantId).exec();
    if (!user || user.status !== 'ACTIVE' || !tenant || tenant.status !== 'ACTIVE') {
      throw new UnauthorizedException('auth.unauthorized');
    }

    return this.issueTokens(user, tenant);
  }

  async logout(refreshToken: string, actorUserId: string, tenantId: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.refreshTokens.updateOne(
      { tokenHash, tenantId: new Types.ObjectId(tenantId) },
      { $set: { revokedAt: new Date() } },
    ).exec();

    await this.audit.record({
      action: 'auth.logout',
      tenantId,
      actorUserId,
      resource: 'user',
    });
  }

  private async issueTokens(user: UserDocument, tenant: TenantDocument): Promise<AuthTokens> {
    const payload: JwtAccessPayload = {
      sub: String(user._id),
      tenantId: String(tenant._id),
    };
    const expiresIn = this.config.get('JWT_EXPIRES_IN', { infer: true });
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = randomBytes(32).toString('hex');
    const days = this.parseDurationDays(
      this.config.get('JWT_REFRESH_EXPIRES_IN', { infer: true }),
    );

    await this.refreshTokens.create({
      userId: user._id,
      tenantId: tenant._id,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken, expiresIn };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseDurationDays(value: string): number {
    const match = /^(\d+)d$/.exec(value);
    return match ? Number(match[1]) : 7;
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'workspace';

    let slug = base;
    let attempt = 0;
    while (await this.tenants.exists({ slug })) {
      attempt += 1;
      slug = `${base}-${attempt}`;
    }
    return slug;
  }
}
