import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { HealthCheckService } from '@nestjs/terminus';
import { HealthController } from '../src/core/health/health.controller';
import { MongoHealthIndicator } from '../src/core/health/mongo.health';
import { RedisHealthIndicator } from '../src/core/health/redis.health';
import { RedisService } from '../src/core/redis/redis.service';

describe('HealthController', () => {
  let app: INestApplication;
  let controller: HealthController;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: async (indicators: Array<() => unknown>) => {
              await Promise.all(indicators.map((indicator) => indicator()));
              return { status: 'ok' };
            },
          },
        },
        {
          provide: MongoHealthIndicator,
          useValue: {
            isHealthy: () => ({ mongodb: { status: 'up' } }),
          },
        },
        {
          provide: RedisHealthIndicator,
          useValue: {
            isHealthy: async () => ({ redis: { status: 'up' } }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            isConfigured: () => true,
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    controller = moduleRef.get(HealthController);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns ok when dependencies are healthy', async () => {
    await expect(controller.check()).resolves.toEqual({ status: 'ok' });
  });
});
