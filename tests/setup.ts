import { beforeAll, afterAll, afterEach } from 'vitest';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
});

afterEach(async () => {
  // Cleanup after each test
});

afterAll(async () => {
  // Cleanup test databases
  const testDbPath = join(process.cwd(), 'test.db');
  if (existsSync(testDbPath)) {
    try {
      unlinkSync(testDbPath);
    } catch (error) {
      // Ignore cleanup errors
    }
  }
});
