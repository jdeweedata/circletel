/**
 * Mobile Navigation Tests
 *
 * Tests mobile-specific navigation patterns:
 * - Hamburger menu functionality
 * - Touch interactions
 * - Responsive layout validation
 */

import { test, expect, devices } from '@playwright/test';
import { MobileTestHelper, hasHorizontalOverflow, findOverflowElements } from '../../utils/mobile-helpers';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3005';

test.describe('Mobile Navigation - iPhone 13', () => {
  test.use({ ...devices['iPhone 13'] });

  test('page loads without horizontal overflow', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const hasOverflow = await hasHorizontalOverflow(page);
    if (hasOverflow) {
      const overflowElements = await findOverflowElements(page);
      console.log('Elements causing overflow:', overflowElements);
    }

    expect(hasOverflow).toBe(false);
  });

  test('hamburger menu is visible on mobile', async ({ page }) => {
    const mobile = new MobileTestHelper(page);

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Verify mobile viewport
    await mobile.assertMobileViewport();

    // Check for hamburger menu
    const hasMenu = await mobile.hasHamburgerMenu();
    expect(hasMenu).toBe(true);
  });

  test('can navigate using mobile menu', async ({ page }) => {
    const mobile = new MobileTestHelper(page);

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Open mobile menu
    if (await mobile.hasHamburgerMenu()) {
      await mobile.openMobileMenu();
      await page.waitForTimeout(500);

      // Look for navigation links
      const navLinks = page.locator('nav a, [role="navigation"] a, [data-mobile-nav] a');
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThan(0);
    }
  });

  test('touch targets meet minimum size requirements', async ({ page }) => {
    const mobile = new MobileTestHelper(page);

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const audit = await mobile.auditTouchTargets();

    console.log(`Touch target audit: ${audit.passing}/${audit.total} passing`);
    if (audit.failing.length > 0) {
      console.log('Failing elements:', audit.failing.slice(0, 5));
    }

    // At least 80% should pass WCAG touch target requirements
    const passRate = audit.passing / audit.total;
    expect(passRate).toBeGreaterThan(0.8);
  });
});

test.describe('Mobile Navigation - Pixel 5', () => {
  test.use({ ...devices['Pixel 5'] });

  test('Android Chrome renders correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const hasOverflow = await hasHorizontalOverflow(page);
    expect(hasOverflow).toBe(false);

    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/mobile-pixel5-home.png' });
  });

  test('can scroll page with touch', async ({ page }) => {
    const mobile = new MobileTestHelper(page);

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Get initial scroll position
    const initialScroll = await page.evaluate(() => window.scrollY);

    // Swipe up to scroll
    await mobile.swipeUp(300);
    await page.waitForTimeout(500);

    // Verify page scrolled
    const newScroll = await page.evaluate(() => window.scrollY);
    expect(newScroll).toBeGreaterThan(initialScroll);
  });
});

test.describe('Mobile Navigation - Galaxy S8', () => {
  test.use({ ...devices['Galaxy S8'] });

  test('small screen renders without issues', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const hasOverflow = await hasHorizontalOverflow(page);
    expect(hasOverflow).toBe(false);

    await page.screenshot({ path: 'test-results/mobile-galaxy-s8-home.png' });
  });
});

test.describe('Tablet Navigation - iPad Mini', () => {
  test.use({ ...devices['iPad Mini'] });

  test('tablet layout renders correctly', async ({ page }) => {
    const mobile = new MobileTestHelper(page);

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    await mobile.assertTabletViewport();

    const hasOverflow = await hasHorizontalOverflow(page);
    expect(hasOverflow).toBe(false);

    await page.screenshot({ path: 'test-results/mobile-ipad-mini-home.png' });
  });
});
