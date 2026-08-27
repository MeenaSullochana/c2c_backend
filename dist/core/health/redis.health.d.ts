import { HealthIndicatorService } from '@nestjs/terminus';
import { RedisService } from '../redis/redis.service';
export declare class RedisHealthIndicator {
    private readonly redis;
    private readonly healthIndicatorService;
    constructor(redis: RedisService, healthIndicatorService: HealthIndicatorService);
    isHealthy(key: string): Promise<import("@nestjs/terminus").HealthIndicatorResult<string, "up", {
        [x: string]: unknown;
    }> | import("@nestjs/terminus").HealthIndicatorResult<string, "down", {
        message: string;
    }>>;
}
