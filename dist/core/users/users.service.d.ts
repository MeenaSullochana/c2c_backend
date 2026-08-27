import { Model } from 'mongoose';
import { UserDocument } from '../database/schemas/user.schema';
import { TenantDocument } from '../database/schemas/tenant.schema';
import type { AuthUser, PublicUser } from '../auth/auth.types';
export declare class UsersService {
    private readonly users;
    private readonly tenants;
    constructor(users: Model<UserDocument>, tenants: Model<TenantDocument>);
    getAuthContext(userId: string, tenantId: string): Promise<AuthUser>;
    listForTenant(tenantId: string): Promise<AuthUser[]>;
    getPublicProfile(userId: string, tenantId: string): Promise<PublicUser>;
}
