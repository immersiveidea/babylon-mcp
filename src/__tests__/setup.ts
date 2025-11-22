import { beforeAll, afterAll, afterEach, vi } from 'vitest';

beforeAll(() => {
  // Global test setup
  console.log('Starting test suite...');
});

afterAll(() => {
  // Global test teardown
  console.log('Test suite complete.');
});

afterEach(() => {
  // Clear all mocks after each test
  vi.clearAllMocks();
});
