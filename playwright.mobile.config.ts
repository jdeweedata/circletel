import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Mobile Testing Configuration
 *
 * Comprehensive mobile device emulation for CircleTel UI/UX testing.
 * Includes iOS, Android, and tablet devices with touch support.
 */

// Custom device definitions for devices not in Playwright's registry
const customDevices = {
  'iPhone 14 Pro Max': {
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  },
  'Galaxy S23 Ultra': {
    viewport: { width: 384, height: 824 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
  },
  'Pixel 7': {
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
  },
};

export default defineConfig({
  testDir: './tests/e2e/mobile',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only */
  forbidOnly: !!process.env.CI,

  /* Retry failed tests */
  retries: process.env.CI ? 2 : 1,

  /* Workers for parallel execution */
  workers: process.env.CI ? 2 : 4,

  /* Reporter configuration */
  reporter: [
    ['html', { outputFolder: 'playwright-report-mobile', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/mobile-results.json' }],
  ],

  /* Shared settings for all mobile projects */
  use: {
    /* Base URL */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3005',

    /* Trace on first retry */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',

    /* Action timeout */
    actionTimeout: 15000,

    /* Navigation timeout */
    navigationTimeout: 30000,
  },

  /* Mobile device projects */
  projects: [
    // ============================================
    // iOS Devices
    // ============================================
    {
      name: 'iPhone SE',
      use: { ...devices['iPhone SE'] },
    },
    {
      name: 'iPhone 12',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'iPhone 13',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'iPhone 14 Pro Max',
      use: { ...customDevices['iPhone 14 Pro Max'] },
    },

    // ============================================
    // Android Devices
    // ============================================
    {
      name: 'Pixel 5',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Pixel 7',
      use: { ...customDevices['Pixel 7'] },
    },
    {
      name: 'Galaxy S8',
      use: { ...devices['Galaxy S8'] },
    },
    {
      name: 'Galaxy S23 Ultra',
      use: { ...customDevices['Galaxy S23 Ultra'] },
    },

    // ============================================
    // Tablets
    // ============================================
    {
      name: 'iPad Mini',
      use: { ...devices['iPad Mini'] },
    },
    {
      name: 'iPad Pro 11',
      use: { ...devices['iPad Pro 11'] },
    },

    // ============================================
    // Landscape Orientations
    // ============================================
    {
      name: 'iPhone 13 Landscape',
      use: { ...devices['iPhone 13 landscape'] },
    },
    {
      name: 'Pixel 5 Landscape',
      use: { ...devices['Pixel 5 landscape'] },
    },

    // ============================================
    // Slow Network Simulation
    // ============================================
    {
      name: 'iPhone 13 - Slow 3G',
      use: {
        ...devices['iPhone 13'],
        // Note: Network throttling requires CDP and is set in tests
      },
    },
  ],

  /* Web server configuration */
  webServer: {
    command: 'npm run dev:memory',
    url: 'http://localhost:3005',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
