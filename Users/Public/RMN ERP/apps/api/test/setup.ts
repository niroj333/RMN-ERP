import { beforeAll, afterAll } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/rmn_erp_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.SESSION_SECRET = 'test-secret-key-12345678901234567890';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.PORT = '3000';

// Global test setup tasks could go here
beforeAll(async () => {
  // setup before all tests
});

afterAll(async () => {
  // teardown after all tests
});
