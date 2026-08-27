import { HealthCheckService } from '@nestjs/terminus';
import { RedisService } from '../redis/redis.service';
import { MongoHealthIndicator } from './mongo.health';
import { RedisHealthIndicator } from './redis.health';
export declare class HealthController {
    private readonly health;
    private readonly mongoHealth;
    private readonly redisHealth;
    private readonly redis;
    constructor(health: HealthCheckService, mongoHealth: MongoHealthIndicator, redisHealth: RedisHealthIndicator, redis: RedisService);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>>, Partial<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>>> | undefined, Partial<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>>> | undefined>>;
    ready(): Promise<import("@nestjs/terminus").HealthCheckResult<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>>, Partial<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>>> | undefined, Partial<import("@nestjs/terminus").HealthIndicatorResult<string, import("@nestjs/terminus").HealthIndicatorStatus, Record<string, any>>> | undefined>>;
}
