/**
 * Mobile Responsive Layout Tests
 *
 * Tests responsive behavior across different breakpoints:
 * - Layout changes at breakpoints
 * - Element visibility/hiding
 * - Font sizing
 * - Spacing adjustments
 */

import { test, expect, devices } from '@playwright/test';
import {
  MobileTestHelper,
  BREAKPOINTS,
  hasHorizontalOverflow,
  findOverflowElements,
} from '../../utils/mobile-helpers';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3005';

// Key pages to test for responsiveness
const PAGES_TO_TEST = [
  { path: '/', name: 'Home' },
  { path: '/order', name: 'Order Start' },
  { path: '/order/packages', name: 'Packages' },
  { path: '/order/account', name: 'Account' },
  { path: '/auth/login', name: 'Login' },
];

test.describe('Responsive Layout - All Pages', () => {
  test.use({ ...devices['iPhone 13'] });

  for (const pageInfo of PAGES_TO_TEST) {
    test(`${pageInfo.name} page has no horizontal overflow`, async ({ page }) => {
      await page.goto(`${BASE_URL}${pageInfo.path}`);
      await page.waitForLoadState('networkidle');

      const hasOverflow = await hasHorizontalOverflow(page);
      if (hasOverflow) {
        const elements = await findOverflowElements(page);
        console.log(`Overflow on ${pageInfo.name}:`, elements);
      }

      expect(hasOverflow).toBe(false);
    });
  }
});

test.describe('Breakpoint Transitions', () => {
  test('layout changes correctly at sm breakpoint', async ({ page }) => {
    // Start at mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Take mobile screenshot
    await page.screenshot({ path: 'test-results/breakpoint-375.png' });

    // Transition to sm breakpoint
    await page.setViewportSize({ width: BREAKPOINTS.sm, height: 667 });
    await page.waitForTimeout(500);

    // Take sm breakpoint screenshot
    await page.screenshot({ path: 'test-results/breakpoint-sm.png' });

    // Verify no overflow at transition
    const hasOverflow = await hasHorizontalOverflow(page);
    expect(hasOverflow).toBe(false);
  });

  test('layout changes correctly at md breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: BREAKPOINTS.sm, height: 768 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'test-results/breakpoint-before-md.png' });

    // Transition to md breakpoint (tablet)
    await page.setViewportSize({ width: BREAKPOINTS.md, height: 768 });
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'test-results/breakpoint-md.png' });

    const hasOverflow = await hasHorizontalOverflow(page);
    expect(hasOverflow).toBe(false);
  });
});

test.describe('Mobile-Specific Elements', () => {
  test.use({ ...devices['iPhone 13'] });

  test('mobile nav is visible, desktop nav is hidden', async ({ page }) => {
    const mobile = new MobileTestHelper(page);

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Mobile nav (hamburger) should be visible
    const hasMobileNav = await mobile.hasHamburgerMenu();
    expect(hasMobileNav).toBe(true);

    // Desktop nav should be hidden
    const desktopNav = page.locator('[data-desktop-nav], nav.desktop-nav');
    const isDesktopNavVisible = await desktopNav.first().isVisible({ timeout: 1000 }).catch(() => false);
    expect(isDesktopNavVisible).toBe(false);
  });

  test('mobile-only elements are visible', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check for elements with mobile-only classes (Tailwind pattern)
    const mobileOnlyElements = page.locator('[class*="md:hidden"], [class*="lg:hidden"]');
    const count = await mobileOnlyElements.count();

    // Should have some mobile-only elements
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Desktop Elements Hidden on Mobile', () => {
  test.use({ ...devices['iPhone 13'] });

  test('desktop-only elements are hidden on mobile', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check for elements with desktop-only visibility (hidden on mobile)
    const desktopOnlyElements = page.locator('[class*="hidden"][class*="md:block"], [class*="hidden"][class*="md:flex"]');

    const elements = await desktopOnlyElements.all();
    for (const element of elements.slice(0, 5)) {
      const isVisible = await element.isVisible();
      // These should be hidden on mobile
      expect(isVisible).toBe(false);
    }
  });
});

test.describe('Text Readability on Mobile', () => {
  test.use({ ...devices['iPhone 13'] });

  test('body text is readable size', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check that main text elements have adequate font size
    const fontSize = await page.evaluate(() => {
      const body = document.body;
      const style = window.getComputedStyle(body);
      return parseInt(style.fontSize, 10);
    });

    // Minimum recommended mobile font size is 16px
    expect(fontSize).toBeGreaterThanOrEqual(14);
  });

  test('headings scale appropriately', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const h1FontSize = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      if (!h1) return 0;
      return parseInt(window.getComputedStyle(h1).fontSize, 10);
    });

    // H1 should be larger than body text but not too large for mobile
    if (h1FontSize > 0) {
      expect(h1FontSize).toBeGreaterThanOrEqual(20);
      expect(h1FontSize).toBeLessThanOrEqual(48);
    }
  });
});

test.describe('Touch-Friendly Spacing', () => {
  test.use({ ...devices['iPhone 13'] });

  test('buttons have adequate spacing', async ({ page }) => {
    const mobile = new MobileTestHelper(page);

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const buttons = page.locator('button, [role="button"]');
    const buttonCount = await buttons.count();

    let passCount = 0;
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      try {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const targetCheck = await mobile.checkTouchTargetSize(button);
          if (targetCheck.meetsWCAG) {
            passCount++;
          }
        }
      } catch {
        // Button may not be visible
      }
    }

    // Most buttons should meet touch target requirements
    const passRate = passCount / Math.min(buttonCount, 10);
    expect(passRate).toBeGreaterThan(0.7);
  });
});
