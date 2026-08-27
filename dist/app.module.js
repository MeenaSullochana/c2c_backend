"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_module_1 = require("./core/config/config.module");
const auth_module_1 = require("./core/auth/auth.module");
const health_module_1 = require("./core/health/health.module");
const mongo_module_1 = require("./core/database/mongo.module");
const redis_module_1 = require("./core/redis/redis.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [config_module_1.AppConfigModule, mongo_module_1.MongoModule, redis_module_1.RedisModule, auth_module_1.AuthModule, health_module_1.HealthModule],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map