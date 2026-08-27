import { z } from 'zod';
export declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "test", "production"]>>;
    API_PORT: z.ZodDefault<z.ZodNumber>;
    API_PREFIX: z.ZodDefault<z.ZodString>;
    WEB_ORIGIN: z.ZodDefault<z.ZodString>;
    MONGODB_URI: z.ZodString;
    REDIS_URL: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    JWT_SECRET: z.ZodString;
    JWT_EXPIRES_IN: z.ZodDefault<z.ZodString>;
    JWT_REFRESH_EXPIRES_IN: z.ZodDefault<z.ZodString>;
    CREDENTIAL_ENCRYPTION_KEY: z.ZodString;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "test" | "production";
    API_PORT: number;
    API_PREFIX: string;
    WEB_ORIGIN: string;
    MONGODB_URI: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_EXPIRES_IN: string;
    CREDENTIAL_ENCRYPTION_KEY: string;
    REDIS_URL?: string | undefined;
}, {
    MONGODB_URI: string;
    JWT_SECRET: string;
    CREDENTIAL_ENCRYPTION_KEY: string;
    NODE_ENV?: "development" | "test" | "production" | undefined;
    API_PORT?: number | undefined;
    API_PREFIX?: string | undefined;
    WEB_ORIGIN?: string | undefined;
    REDIS_URL?: unknown;
    JWT_EXPIRES_IN?: string | undefined;
    JWT_REFRESH_EXPIRES_IN?: string | undefined;
}>;
export type Env = z.infer<typeof envSchema>;
export declare function validateEnv(config: Record<string, unknown>): Env;
