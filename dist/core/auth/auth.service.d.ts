import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import type { Env } from '../config/env.schema';
import { RefreshTokenDocument } from '../database/schemas/refresh-token.schema';
import { TenantDocument } from '../database/schemas/tenant.schema';
import { UserDocument } from '../database/schemas/user.schema';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';
import type { LoginDto, RegisterDto } from './auth.dto';
import { PasswordService } from './password.service';
import type { AuthTokens, PublicUser } from './auth.types';
export declare class AuthService {
    private readonly tenants;
    private readonly users;
    private readonly refreshTokens;
    private readonly passwords;
    private readonly jwt;
    private readonly usersService;
    private readonly audit;
    private readonly config;
    constructor(tenants: Model<TenantDocument>, users: Model<UserDocument>, refreshTokens: Model<RefreshTokenDocument>, passwords: PasswordService, jwt: JwtService, usersService: UsersService, audit: AuditService, config: ConfigService<Env, true>);
    register(input: RegisterDto): Promise<{
        user: PublicUser;
        tokens: AuthTokens;
    }>;
    login(input: LoginDto): Promise<{
        user: PublicUser;
        tokens: AuthTokens;
    }>;
    refresh(refreshToken: string): Promise<AuthTokens>;
    logout(refreshToken: string, actorUserId: string, tenantId: string): Promise<void>;
    private issueTokens;
    private hashToken;
    private parseDurationDays;
    private uniqueSlug;
}
