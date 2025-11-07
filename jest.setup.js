/**
 * Jest Setup File
 *
 * Runs before each test file
 * Sets up global test environment and mocks
 */

// Mock environment variables for tests
process.env.NEXT_PUBLIC_NETCASH_SERVICE_KEY = 'test-service-key';
process.env.NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY = 'test-pci-vault-key';
process.env.NETCASH_WEBHOOK_SECRET = 'test-webhook-secret';
process.env.NEXT_PUBLIC_DEFAULT_PAYMENT_PROVIDER = 'netcash';
process.env.NEXT_PUBLIC_BASE_URL = 'https://circletel.co.za';
process.env.NODE_ENV = 'test';

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests (optional)
// Uncomment if you want cleaner test output
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Setup test timeout
jest.setTimeout(10000);

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
