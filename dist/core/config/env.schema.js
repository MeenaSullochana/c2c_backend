"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envSchema = void 0;
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
exports.envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z
        .enum(['development', 'test', 'production'])
        .default('development'),
    API_PORT: zod_1.z.coerce.number().int().positive().default(3000),
    API_PREFIX: zod_1.z.string().min(1).default('api'),
    WEB_ORIGIN: zod_1.z.string().url().default('http://localhost:5173'),
    MONGODB_URI: zod_1.z.string().min(1),
    REDIS_URL: zod_1.z.preprocess((value) => (value === '' ? undefined : value), zod_1.z.string().optional()),
    JWT_SECRET: zod_1.z.string().min(16),
    JWT_EXPIRES_IN: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    CREDENTIAL_ENCRYPTION_KEY: zod_1.z.string().min(32),
});
function validateEnv(config) {
    const parsed = exports.envSchema.safeParse(config);
    if (!parsed.success) {
        const details = parsed.error.flatten().fieldErrors;
        throw new Error(`Invalid environment configuration: ${JSON.stringify(details)}`);
    }
    return parsed.data;
}
//# sourceMappingURL=env.schema.js.map