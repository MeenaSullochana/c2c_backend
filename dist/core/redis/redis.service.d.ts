import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema';
export declare class RedisService implements OnModuleDestroy {
    private readonly logger;
    private readonly client;
    constructor(config: ConfigService<Env, true>);
    isConfigured(): boolean;
    ping(): Promise<string>;
    onModuleDestroy(): Promise<void>;
}
