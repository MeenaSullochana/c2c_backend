"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const audit_service_1 = require("../audit/audit.service");
const tenants_controller_1 = require("../tenants/tenants.controller");
const tenants_service_1 = require("../tenants/tenants.service");
const users_controller_1 = require("../users/users.controller");
const users_service_1 = require("../users/users.service");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const password_service_1 = require("./password.service");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    secret: config.get('JWT_SECRET', { infer: true }),
                    signOptions: {
                        expiresIn: config.get('JWT_EXPIRES_IN', { infer: true }),
                    },
                }),
            }),
        ],
        controllers: [auth_controller_1.AuthController, users_controller_1.UsersController, tenants_controller_1.TenantsController],
        providers: [
            password_service_1.PasswordService,
            auth_service_1.AuthService,
            users_service_1.UsersService,
            tenants_service_1.TenantsService,
            audit_service_1.AuditService,
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: permissions_guard_1.PermissionsGuard,
            },
        ],
        exports: [users_service_1.UsersService, password_service_1.PasswordService, jwt_1.JwtModule],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map