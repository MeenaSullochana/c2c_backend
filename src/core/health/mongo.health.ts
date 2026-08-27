import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { HealthIndicatorService } from '@nestjs/terminus';
import { Connection } from 'mongoose';

@Injectable()
export class MongoHealthIndicator {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);
    if (this.connection.readyState === 1) {
      return indicator.up();
    }
    return indicator.down('MongoDB is not connected');
  }
}
