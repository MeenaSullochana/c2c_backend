"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const node_crypto_1 = require("node:crypto");
const shared_1 = require("../../shared");
const mongoose_2 = require("mongoose");
const refresh_token_schema_1 = require("../database/schemas/refresh-token.schema");
const tenant_schema_1 = require("../database/schemas/tenant.schema");
const user_schema_1 = require("../database/schemas/user.schema");
const audit_service_1 = require("../audit/audit.service");
const users_service_1 = require("../users/users.service");
const password_service_1 = require("./password.service");
let AuthService = class AuthService {
    tenants;
    users;
    refreshTokens;
    passwords;
    jwt;
    usersService;
    audit;
    config;
    constructor(tenants, users, refreshTokens, passwords, jwt, usersService, audit, config) {
        this.tenants = tenants;
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.passwords = passwords;
        this.jwt = jwt;
        this.usersService = usersService;
        this.audit = audit;
        this.config = config;
    }
    async register(input) {
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
                roleKeys: [shared_1.ROLE_KEYS.TENANT_OWNER],
                permissions: [...shared_1.TENANT_OWNER_PERMISSIONS],
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
                user: await this.usersService.getPublicProfile(String(user._id), String(tenant._id)),
                tokens,
            };
        }
        catch (error) {
            await this.users.deleteMany({ tenantId: tenant._id }).exec();
            await this.tenants.deleteOne({ _id: tenant._id }).exec();
            if (typeof error === 'object' &&
                error !== null &&
                'code' in error &&
                error.code === 11000) {
                throw new common_1.ConflictException('auth.email_taken');
            }
            throw error;
        }
    }
    async login(input) {
        const email = input.email.toLowerCase();
        const matches = await this.users
            .find({ email, status: 'ACTIVE' })
            .select('+passwordHash')
            .exec();
        if (matches.length === 0) {
            throw new common_1.UnauthorizedException('auth.invalid_credentials');
        }
        let user = matches[0];
        if (input.tenantSlug) {
            const tenant = await this.tenants
                .findOne({ slug: input.tenantSlug.toLowerCase().trim() })
                .exec();
            const matched = matches.find((candidate) => tenant && String(candidate.tenantId) === String(tenant._id));
            if (!tenant || !matched) {
                throw new common_1.UnauthorizedException('auth.invalid_credentials');
            }
            user = matched;
        }
        else if (matches.length > 1) {
            throw new common_1.UnprocessableEntityException('auth.tenant_required');
        }
        if (!user.passwordHash) {
            throw new common_1.UnauthorizedException('auth.invalid_credentials');
        }
        const valid = await this.passwords.compare(input.password, user.passwordHash);
        if (!valid) {
            throw new common_1.UnauthorizedException('auth.invalid_credentials');
        }
        const tenant = await this.tenants.findById(user.tenantId).exec();
        if (!tenant || tenant.status !== 'ACTIVE') {
            throw new common_1.UnauthorizedException('auth.invalid_credentials');
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
            user: await this.usersService.getPublicProfile(String(user._id), String(tenant._id)),
            tokens,
        };
    }
    async refresh(refreshToken) {
        const tokenHash = this.hashToken(refreshToken);
        const stored = await this.refreshTokens.findOne({
            tokenHash,
            revokedAt: { $exists: false },
            expiresAt: { $gt: new Date() },
        }).exec();
        if (!stored) {
            throw new common_1.UnauthorizedException('auth.unauthorized');
        }
        stored.revokedAt = new Date();
        await stored.save();
        const user = await this.users.findById(stored.userId).exec();
        const tenant = await this.tenants.findById(stored.tenantId).exec();
        if (!user || user.status !== 'ACTIVE' || !tenant || tenant.status !== 'ACTIVE') {
            throw new common_1.UnauthorizedException('auth.unauthorized');
        }
        return this.issueTokens(user, tenant);
    }
    async logout(refreshToken, actorUserId, tenantId) {
        const tokenHash = this.hashToken(refreshToken);
        await this.refreshTokens.updateOne({ tokenHash, tenantId: new mongoose_2.Types.ObjectId(tenantId) }, { $set: { revokedAt: new Date() } }).exec();
        await this.audit.record({
            action: 'auth.logout',
            tenantId,
            actorUserId,
            resource: 'user',
        });
    }
    async issueTokens(user, tenant) {
        const payload = {
            sub: String(user._id),
            tenantId: String(tenant._id),
        };
        const expiresIn = this.config.get('JWT_EXPIRES_IN', { infer: true });
        const accessToken = await this.jwt.signAsync(payload);
        const refreshToken = (0, node_crypto_1.randomBytes)(32).toString('hex');
        const days = this.parseDurationDays(this.config.get('JWT_REFRESH_EXPIRES_IN', { infer: true }));
        await this.refreshTokens.create({
            userId: user._id,
            tenantId: tenant._id,
            tokenHash: this.hashToken(refreshToken),
            expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        });
        return { accessToken, refreshToken, expiresIn };
    }
    hashToken(token) {
        return (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    parseDurationDays(value) {
        const match = /^(\d+)d$/.exec(value);
        return match ? Number(match[1]) : 7;
    }
    async uniqueSlug(name) {
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(tenant_schema_1.Tenant.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(2, (0, mongoose_1.InjectModel)(refresh_token_schema_1.RefreshToken.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        password_service_1.PasswordService,
        jwt_1.JwtService,
        users_service_1.UsersService,
        audit_service_1.AuditService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map