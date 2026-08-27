import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { Env } from '../config/env.schema';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis | null;

  constructor(config: ConfigService<Env, true>) {
    const url = config.get('REDIS_URL', { infer: true });
    this.client = url
      ? new Redis(url, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: true,
        })
      : null;

    if (this.client) {
      this.client.connect().catch((error: unknown) => {
        this.logger.warn(
          error instanceof Error ? error.message : 'Redis connection failed',
        );
      });
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  ping(): Promise<string> {
    if (!this.client) {
      return Promise.reject(new Error('Redis not configured'));
    }
    return this.client.ping();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }
}
