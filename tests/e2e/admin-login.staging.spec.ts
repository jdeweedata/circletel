import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://circletel-staging.vercel.app';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.PLAYWRIGHT_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.PLAYWRIGHT_ADMIN_PASSWORD;

// Simple guard to avoid running without credentials
const haveCreds = !!(ADMIN_EMAIL && ADMIN_PASSWORD);

// Only run this test when credentials are provided
(haveCreds ? test : test.skip)('Admin login to staging works and lands on /admin', async ({ page }) => {
  test.info().annotations.push({ type: 'env', description: BASE_URL });

  // Ensure clean state by forcing signout via login page param that the app recognizes
  await page.goto(`${BASE_URL}/admin/login?signout=true`, { waitUntil: 'domcontentloaded' });

  // Wait for login page to be ready
  await expect(page).toHaveURL(/\/admin\/login/);

  // Fill in credentials
  await page.getByLabel('Email', { exact: false }).fill(ADMIN_EMAIL!);
  await page.getByLabel('Password', { exact: false }).fill(ADMIN_PASSWORD!);

  // Submit form
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to admin dashboard
  await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[-/\\^$*+?.()|[\]{}]/g, r => r === '.' ? '\\.' : r)}/admin/?$`), { timeout: 20000 });

  // Assert dashboard content renders (welcome header exists)
  await expect(page.getByText(/welcome back/i)).toBeVisible();

  // Ensure no unauthorized error param in URL
  expect(page.url()).not.toContain('error=unauthorized');
});

// Provide helpful skip reason if creds missing
if (!haveCreds) {
  test.describe('Admin login to staging', () => {
    test('skipped due to missing credentials', async () => {
      test.skip(true, 'Set ADMIN_EMAIL and ADMIN_PASSWORD env vars to run this test');
    });
  });
}
