/**
 * Jest setup file
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '8001';
process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/english_tutor_test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';
process.env.BCRYPT_ROUNDS = '4'; // Lower for faster tests
process.env.LOG_LEVEL = 'error'; // Only log errors during tests

// Increase timeout for integration tests
jest.setTimeout(30000);
