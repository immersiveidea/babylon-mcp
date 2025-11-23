import { beforeAll, afterAll, afterEach, vi } from 'vitest';

beforeAll(() => {
  // Global test setup
  console.log('Starting test suite...');

  // Increase max listeners to prevent warnings during tests
  // Multiple server instances in tests add SIGINT/SIGTERM listeners
  process.setMaxListeners(20);
});

afterAll(() => {
  // Global test teardown
  console.log('Test suite complete.');
});

afterEach(() => {
  // Clear all mocks after each test
  vi.clearAllMocks();
});
