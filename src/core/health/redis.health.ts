import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly redis: RedisService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);

    try {
      const pong = await this.redis.ping();
      if (pong !== 'PONG') {
        return indicator.down('Unexpected Redis ping response');
      }
      return indicator.up();
    } catch (error) {
      return indicator.down(
        error instanceof Error ? error.message : 'Redis unavailable',
      );
    }
  }
}
