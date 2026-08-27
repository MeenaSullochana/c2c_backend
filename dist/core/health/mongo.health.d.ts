import { HealthIndicatorService } from '@nestjs/terminus';
import { Connection } from 'mongoose';
export declare class MongoHealthIndicator {
    private readonly connection;
    private readonly healthIndicatorService;
    constructor(connection: Connection, healthIndicatorService: HealthIndicatorService);
    isHealthy(key: string): import("@nestjs/terminus").HealthIndicatorResult<string, "up", {
        [x: string]: unknown;
    }> | import("@nestjs/terminus").HealthIndicatorResult<string, "down", {
        message: "MongoDB is not connected";
    }>;
}
