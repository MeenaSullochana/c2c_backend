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
exports.RedisHealthIndicator = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const redis_service_1 = require("../redis/redis.service");
let RedisHealthIndicator = class RedisHealthIndicator {
    redis;
    healthIndicatorService;
    constructor(redis, healthIndicatorService) {
        this.redis = redis;
        this.healthIndicatorService = healthIndicatorService;
    }
    async isHealthy(key) {
        const indicator = this.healthIndicatorService.check(key);
        try {
            const pong = await this.redis.ping();
            if (pong !== 'PONG') {
                return indicator.down('Unexpected Redis ping response');
            }
            return indicator.up();
        }
        catch (error) {
            return indicator.down(error instanceof Error ? error.message : 'Redis unavailable');
        }
    }
};
exports.RedisHealthIndicator = RedisHealthIndicator;
exports.RedisHealthIndicator = RedisHealthIndicator = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        terminus_1.HealthIndicatorService])
], RedisHealthIndicator);
//# sourceMappingURL=redis.health.js.map