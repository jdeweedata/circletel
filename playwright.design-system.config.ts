/**
 * Playwright Configuration for Design System Testing
 *
 * Specialized configuration for running design system validation tests
 * with visual regression testing and accessibility checks
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/design-system',

  // Test files
  testMatch: [
    '**/components/*.spec.ts',
    '**/accessibility/*.spec.ts',
    '**/tokens/*.spec.ts',
    '**/workflows/*.spec.ts',
  ],

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/design-system-report' }],
    ['json', { outputFile: 'test-results/design-system-results.json' }],
    ['junit', { outputFile: 'test-results/design-system-junit.xml' }],
    ['line'],
  ],

  // Global test configuration
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:8080',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Take screenshots on failure
    screenshot: 'only-on-failure',

    // Record video on failure
    video: 'retain-on-failure',

    // Global timeout for actions
    actionTimeout: 10000,

    // Global timeout for navigation
    navigationTimeout: 30000,
  },

  // Configure projects for major browsers and devices
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
      testDir: './tests/design-system/components',
    },

    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
      testDir: './tests/design-system/components',
    },

    {
      name: 'Desktop Safari',
      use: { ...devices['Desktop Safari'] },
      testDir: './tests/design-system/components',
    },

    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testDir: './tests/design-system/components',
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      testDir: './tests/design-system/components',
    },

    // Tablet testing
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
      testDir: './tests/design-system/components',
    },

    // Accessibility testing (run on specific browser)
    {
      name: 'Accessibility Tests',
      use: { ...devices['Desktop Chrome'] },
      testDir: './tests/design-system/accessibility',
      testMatch: '**/*.spec.ts',
    },

    // Token consistency testing
    {
      name: 'Token Consistency',
      use: {
        ...devices['Desktop Chrome'],
        // Disable animations for consistent token testing
        reducedMotion: 'reduce',
      },
      testDir: './tests/design-system/tokens',
      testMatch: '**/*.spec.ts',
    },

    // Visual regression testing
    {
      name: 'Visual Regression',
      use: {
        ...devices['Desktop Chrome'],
        // Consistent settings for visual regression
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
        // Disable animations for consistent screenshots
        reducedMotion: 'reduce',
      },
      testDir: './tests/design-system',
      testMatch: '**/components/*.spec.ts',
    },

    // New component validation workflow
    {
      name: 'New Component Validation',
      use: { ...devices['Desktop Chrome'] },
      testDir: './tests/design-system/workflows',
      testMatch: '**/new-component-validation.spec.ts',
    },
  ],

  // Web server configuration
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Screenshot and video settings
  expect: {
    // Threshold for visual comparisons (0 = exact match, 1 = any difference allowed)
    toHaveScreenshot: {
      threshold: 0.1,
      mode: 'pixel',
    },
    toMatchScreenshot: {
      threshold: 0.1,
      mode: 'pixel',
    },
  },

  // Output directories
  outputDir: 'test-results/design-system-artifacts',
});

// Environment-specific overrides
if (process.env.CI) {
  // CI-specific configuration
  module.exports.use = {
    ...module.exports.use,
    // More lenient timeouts in CI
    actionTimeout: 15000,
    navigationTimeout: 45000,
  };
}

if (process.env.DESIGN_SYSTEM_DEBUG) {
  // Debug mode configuration
  module.exports.use = {
    ...module.exports.use,
    // Keep artifacts for debugging
    video: 'on',
    screenshot: 'on',
    trace: 'on',
  };
}