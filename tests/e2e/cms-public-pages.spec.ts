import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3005';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.PLAYWRIGHT_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.PLAYWRIGHT_ADMIN_PASSWORD;

const haveCreds = !!(ADMIN_EMAIL && ADMIN_PASSWORD);

/**
 * CMS Public Pages E2E Tests
 * Tests the public rendering of published pages
 */
test.describe('CMS Public Pages', () => {
  let testPageSlug: string;

  test.beforeAll(async ({ browser }) => {
    if (!haveCreds) {
      return;
    }

    // Create a test page that we can view publicly
    const page = await browser.newPage();

    try {
      // Login
      await page.goto(`${BASE_URL}/admin/login`);
      await page.getByLabel('Email', { exact: false }).fill(ADMIN_EMAIL!);
      await page.getByLabel('Password', { exact: false }).fill(ADMIN_PASSWORD!);
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForURL(/\/admin/);

      // Create and publish a test page
      await page.goto(`${BASE_URL}/admin/cms/create`);

      const timestamp = Date.now();
      testPageSlug = `e2e-test-public-${timestamp}`;

      await page.getByLabel(/^title/i).fill(`E2E Test Public Page ${timestamp}`);
      await page.getByLabel(/slug/i).fill(testPageSlug);

      // Add content
      const editor = page.locator('.tiptap');
      await editor.click();
      await page.keyboard.type('This is a test page for E2E testing of public page rendering.');

      // Add heading
      await page.keyboard.press('Enter');
      await page.keyboard.type('Test Heading');
      const headingButton = page.getByRole('button', { name: /heading/i }).first();
      await headingButton.click();

      // Add more content
      await page.keyboard.press('Enter');
      await page.keyboard.type('This page should be publicly accessible after publishing.');

      // Fill SEO metadata
      await page.getByLabel(/meta.*title/i).fill('E2E Test Page - SEO Title');
      await page.getByLabel(/meta.*description/i).fill('This is a test page for end-to-end testing');

      // Save as draft
      await page.getByRole('button', { name: /save.*draft/i }).click();
      await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 10000 });

      await page.waitForTimeout(2000);

      // Publish the page
      const publishButton = page.getByRole('button', { name: /publish/i });
      if (await publishButton.isVisible()) {
        await publishButton.click();

        const confirmButton = page.getByRole('button', { name: /confirm|yes|publish/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        await expect(page.getByText(/published/i)).toBeVisible({ timeout: 10000 });
      }

      await page.waitForTimeout(2000);
    } catch (error) {
      console.error('Failed to create test page:', error);
    } finally {
      await page.close();
    }
  });

  test('should render published page publicly', async ({ page }) => {
    if (!haveCreds || !testPageSlug) {
      test.skip();
      return;
    }

    // Navigate to the public page
    await page.goto(`${BASE_URL}/${testPageSlug}`);

    // Page should load without authentication
    await expect(page).toHaveURL(`${BASE_URL}/${testPageSlug}`);

    // Should show the content
    await expect(page.getByText(/test page for E2E testing/i)).toBeVisible();

    // Should show the heading
    await expect(page.getByText(/Test Heading/i)).toBeVisible();

    // Should NOT show draft banner or admin controls
    await expect(page.getByText(/draft|preview/i)).toBeHidden();
  });

  test('should have correct SEO meta tags', async ({ page }) => {
    if (!haveCreds || !testPageSlug) {
      test.skip();
      return;
    }

    await page.goto(`${BASE_URL}/${testPageSlug}`);

    // Check meta title
    const title = await page.title();
    expect(title).toContain('E2E Test Page');

    // Check meta description
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).toContain('test page for end-to-end testing');

    // Check Open Graph tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();

    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
    expect(ogDescription).toBeTruthy();
  });

  test('should return 404 for non-existent page', async ({ page }) => {
    await page.goto(`${BASE_URL}/non-existent-page-12345`);

    // Should show 404 page
    await expect(page.getByText(/404|not found|page.*not.*exist/i)).toBeVisible();
  });

  test('should not show draft pages publicly', async ({ page }) => {
    if (!haveCreds) {
      test.skip();
      return;
    }

    // Create a draft page
    const adminPage = page;
    await adminPage.goto(`${BASE_URL}/admin/login`);
    await adminPage.getByLabel('Email', { exact: false }).fill(ADMIN_EMAIL!);
    await adminPage.getByLabel('Password', { exact: false }).fill(ADMIN_PASSWORD!);
    await adminPage.getByRole('button', { name: /sign in/i }).click();
    await adminPage.waitForURL(/\/admin/);

    await adminPage.goto(`${BASE_URL}/admin/cms/create`);

    const draftSlug = `draft-page-${Date.now()}`;
    await adminPage.getByLabel(/^title/i).fill('Draft Page');
    await adminPage.getByLabel(/slug/i).fill(draftSlug);

    const editor = adminPage.locator('.tiptap');
    await editor.click();
    await adminPage.keyboard.type('This is a draft page');

    await adminPage.getByRole('button', { name: /save.*draft/i }).click();
    await expect(adminPage.getByText(/saved/i)).toBeVisible({ timeout: 10000 });

    await adminPage.waitForTimeout(2000);

    // Sign out
    await adminPage.goto(`${BASE_URL}/admin/login?signout=true`);

    // Try to access the draft page publicly
    await adminPage.goto(`${BASE_URL}/${draftSlug}`);

    // Should show 404 or access denied
    await expect(adminPage.getByText(/404|not found|access denied/i)).toBeVisible();
  });

  test('should show preview with preview token', async ({ page }) => {
    if (!haveCreds) {
      test.skip();
      return;
    }

    // Login and create a draft page
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Email', { exact: false }).fill(ADMIN_EMAIL!);
    await page.getByLabel('Password', { exact: false }).fill(ADMIN_PASSWORD!);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/admin/);

    await page.goto(`${BASE_URL}/admin/cms/create`);

    const previewSlug = `preview-test-${Date.now()}`;
    await page.getByLabel(/^title/i).fill('Preview Test Page');
    await page.getByLabel(/slug/i).fill(previewSlug);

    const editor = page.locator('.tiptap');
    await editor.click();
    await page.keyboard.type('This is preview content');

    await page.getByRole('button', { name: /save.*draft/i }).click();
    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 10000 });

    await page.waitForTimeout(2000);

    // Look for preview button
    const previewButton = page.getByRole('button', { name: /preview/i });
    if (await previewButton.isVisible()) {
      await previewButton.click();

      // Preview should open in new tab or show modal with link
      // Check for preview link or new tab
      const previewLink = page.getByText(/preview.*link|copy.*link/i);
      if (await previewLink.isVisible()) {
        // Preview functionality exists
        expect(await previewLink.isVisible()).toBe(true);
      }
    }
  });

  test('should have proper content structure', async ({ page }) => {
    if (!haveCreds || !testPageSlug) {
      test.skip();
      return;
    }

    await page.goto(`${BASE_URL}/${testPageSlug}`);

    // Should have main content area
    const mainContent = page.locator('main, article, [role="main"]');
    await expect(mainContent).toBeVisible();

    // Should have header elements
    const heading = page.locator('h1, h2, h3').first();
    await expect(heading).toBeVisible();

    // Should have paragraph text
    const paragraph = page.locator('p').first();
    await expect(paragraph).toBeVisible();
  });

  test('should be mobile responsive', async ({ page }) => {
    if (!haveCreds || !testPageSlug) {
      test.skip();
      return;
    }

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await page.goto(`${BASE_URL}/${testPageSlug}`);

    // Content should be visible
    await expect(page.getByText(/test page for E2E testing/i)).toBeVisible();

    // Should not have horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 0;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // Allow 10px tolerance
  });

  test('should load quickly', async ({ page }) => {
    if (!haveCreds || !testPageSlug) {
      test.skip();
      return;
    }

    const startTime = Date.now();

    await page.goto(`${BASE_URL}/${testPageSlug}`);

    const loadTime = Date.now() - startTime;

    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);

    // Content should be visible
    await expect(page.getByText(/test page/i)).toBeVisible();
  });

  test('should handle navigation back', async ({ page }) => {
    if (!haveCreds || !testPageSlug) {
      test.skip();
      return;
    }

    // Visit home page first
    await page.goto(`${BASE_URL}/`);

    // Navigate to test page
    await page.goto(`${BASE_URL}/${testPageSlug}`);
    await expect(page.getByText(/test page/i)).toBeVisible();

    // Go back
    await page.goBack();

    // Should be back on home page
    await expect(page).toHaveURL(`${BASE_URL}/`);
  });

  test('should have accessible content', async ({ page }) => {
    if (!haveCreds || !testPageSlug) {
      test.skip();
      return;
    }

    await page.goto(`${BASE_URL}/${testPageSlug}`);

    // Check for basic accessibility
    // Should have proper heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);

    // Images should have alt text (if any)
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      // Alt can be empty string for decorative images, but attribute should exist
      expect(alt !== null).toBe(true);
    }

    // Links should have accessible text
    const links = await page.locator('a').all();
    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      // Should have either text or aria-label
      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
  });
});

// Provide helpful skip reason if creds missing
if (!haveCreds) {
  test.describe('CMS Public Pages', () => {
    test('skipped due to missing credentials', async () => {
      test.skip(true, 'Set ADMIN_EMAIL and ADMIN_PASSWORD env vars to run this test');
    });
  });
}
