import { validateEnv } from './env.schema';

describe('validateEnv', () => {
  const valid = {
    NODE_ENV: 'test',
    API_PORT: '3000',
    API_PREFIX: 'api',
    WEB_ORIGIN: 'http://localhost:5173',
    MONGODB_URI: 'mongodb://127.0.0.1:27017/c2c',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'test-secret-must-be-long',
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
    CREDENTIAL_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef',
  };

  it('accepts a valid configuration', () => {
    const env = validateEnv(valid);
    expect(env.API_PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('test');
  });

  it('rejects a missing database url', () => {
    expect(() =>
      validateEnv({
        ...valid,
        MONGODB_URI: '',
      }),
    ).toThrow(/Invalid environment configuration/);
  });

  it('rejects a short jwt secret', () => {
    expect(() =>
      validateEnv({
        ...valid,
        JWT_SECRET: 'short',
      }),
    ).toThrow(/Invalid environment configuration/);
  });
});
