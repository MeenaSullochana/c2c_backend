import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../database/schemas/user.schema';
import { Tenant, TenantDocument } from '../database/schemas/tenant.schema';
import type { AuthUser, PublicUser } from '../auth/auth.types';
import { toAuthUser } from './user.mapper';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(Tenant.name) private readonly tenants: Model<TenantDocument>,
  ) {}

  async getAuthContext(userId: string, tenantId: string): Promise<AuthUser> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(tenantId)) {
      throw new UnauthorizedException('auth.unauthorized');
    }

    const user = await this.users
      .findOne({
        _id: new Types.ObjectId(userId),
        tenantId: new Types.ObjectId(tenantId),
        status: 'ACTIVE',
      })
      .exec();

    if (!user) {
      throw new UnauthorizedException('auth.unauthorized');
    }

    const tenant = await this.tenants.findById(user.tenantId).exec();
    if (!tenant || tenant.status !== 'ACTIVE') {
      throw new UnauthorizedException('auth.unauthorized');
    }

    return toAuthUser(user);
  }

  async listForTenant(tenantId: string): Promise<AuthUser[]> {
    const users = await this.users
      .find({ tenantId: new Types.ObjectId(tenantId) })
      .sort({ createdAt: -1 })
      .exec();

    return users.map((user) => toAuthUser(user));
  }

  async getPublicProfile(userId: string, tenantId: string): Promise<PublicUser> {
    const user = await this.getAuthContext(userId, tenantId);
    const tenant = await this.tenants.findById(tenantId).exec();

    if (!tenant) {
      throw new NotFoundException('tenant.not_found');
    }

    return {
      ...user,
      tenant: {
        id: String(tenant._id),
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        locale: tenant.locale,
      },
    };
  }
}
