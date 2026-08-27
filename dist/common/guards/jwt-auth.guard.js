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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const public_decorator_1 = require("../decorators/public.decorator");
const users_service_1 = require("../../core/users/users.service");
let JwtAuthGuard = class JwtAuthGuard {
    reflector;
    jwt;
    users;
    constructor(reflector, jwt, users) {
        this.reflector = reflector;
        this.jwt = jwt;
        this.users = users;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const header = request.headers.authorization ?? '';
        const [scheme, token] = header.split(' ');
        if (scheme !== 'Bearer' || !token) {
            throw new common_1.UnauthorizedException('auth.unauthorized');
        }
        try {
            const payload = await this.jwt.verifyAsync(token);
            const user = await this.users.getAuthContext(payload.sub, payload.tenantId);
            request.user = user;
            return true;
        }
        catch {
            throw new common_1.UnauthorizedException('auth.unauthorized');
        }
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        jwt_1.JwtService,
        users_service_1.UsersService])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map