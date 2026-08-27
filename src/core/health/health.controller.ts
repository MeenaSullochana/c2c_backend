import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, type HealthIndicatorFunction } from '@nestjs/terminus';
import { Public } from '../../common/decorators/public.decorator';
import { RedisService } from '../redis/redis.service';
import { MongoHealthIndicator } from './mongo.health';
import { RedisHealthIndicator } from './redis.health';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoHealth: MongoHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness and dependency health' })
  check() {
    const checks: HealthIndicatorFunction[] = [
      () => Promise.resolve(this.mongoHealth.isHealthy('mongodb')),
    ];

    if (this.redis.isConfigured()) {
      checks.push(() => this.redisHealth.isHealthy('redis'));
    }

    return this.health.check(checks);
  }

  @Public()
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe' })
  ready() {
    return this.check();
  }
}
