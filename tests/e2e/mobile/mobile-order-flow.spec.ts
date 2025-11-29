/**
 * Mobile Order Flow Tests
 *
 * Tests the complete customer order journey on mobile devices:
 * - Coverage check
 * - Package selection with touch
 * - Form inputs with mobile keyboard
 * - Payment flow
 */

import { test, expect, devices } from '@playwright/test';
import {
  MobileTestHelper,
  waitForMobileLoad,
  hasHorizontalOverflow,
} from '../../utils/mobile-helpers';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3005';

test.describe('Mobile Order Flow - iPhone 13', () => {
  test.use({ ...devices['iPhone 13'] });
  test.setTimeout(120000); // 2 minutes for full flow

  test('home page coverage checker works on mobile', async ({ page }) => {
    const mobile = new MobileTestHelper(page);

    await page.goto(BASE_URL);
    await waitForMobileLoad(page);

    // Screenshot initial state
    await mobile.screenshot('home-initial');

    // Find and interact with address input
    const addressInput = page.locator(
      'input[placeholder*="address"], input[placeholder*="Enter"], input[type="text"]'
    ).first();

    if (await addressInput.isVisible({ timeout: 5000 })) {
      await mobile.tap(addressInput);
      await addressInput.fill('123 Main Road, Cape Town');
      await page.waitForTimeout(1000);

      await mobile.screenshot('home-address-entered');

      // Look for coverage check button
      const checkButton = page.locator('button:has-text("Check")').first();
      if (await checkButton.isVisible()) {
        await mobile.tap(checkButton);
        await page.waitForTimeout(3000);
        await mobile.screenshot('home-after-check');
      }
    }
  });

  test('package cards are tappable on mobile', async ({ page }) => {
    const mobile = new MobileTestHelper(page);

    // Navigate directly to packages page (with mock lead ID)
    await page.goto(`${BASE_URL}/order/packages`);
    await waitForMobileLoad(page);

    await mobile.screenshot('packages-initial');

    // Check for horizontal overflow
    const hasOverflow = await hasHorizontalOverflow(page);
    expect(hasOverflow).toBe(false);

    // Find package cards
    const packageCards = page.locator(
      '[data-testid="package-card"], [class*="PackageCard"], [class*="package-card"]'
    );

    const cardCount = await packageCards.count();
    console.log(`Found ${cardCount} package cards`);

    if (cardCount > 0) {
      // Check touch target size of first card
      const firstCard = packageCards.first();
      const targetCheck = await mobile.checkTouchTargetSize(firstCard);
      console.log(`First card size: ${targetCheck.width}x${targetCheck.height}`);

      // Try to tap a card
      await mobile.tap(firstCard);
      await page.waitForTimeout(500);
      await mobile.screenshot('packages-card-tapped');
    }
  });

  test('order form works with mobile keyboard', async ({ page }) => {
    const mobile = new MobileTestHelper(page);

    await page.goto(`${BASE_URL}/order/account`);
    await waitForMobileLoad(page);

    await mobile.screenshot('account-initial');

    // Find form inputs
    const firstNameInput = page.locator(
      'input[name="firstName"], input#firstName, input[placeholder*="First"]'
    ).first();
    const emailInput = page.locator(
      'input[name="email"], input#email, input[type="email"]'
    ).first();

    if (await firstNameInput.isVisible({ timeout: 5000 })) {
      // Tap to focus (simulates keyboard appearing)
      await mobile.tap(firstNameInput);
      await page.waitForTimeout(300);

      // Type with mobile-style input
      await firstNameInput.fill('Test');
      await mobile.screenshot('account-name-entered');

      // Dismiss keyboard and move to next field
      await mobile.dismissKeyboard();
      await page.waitForTimeout(200);

      if (await emailInput.isVisible()) {
        await mobile.tap(emailInput);
        await emailInput.fill('test@circletel-test.co.za');
        await mobile.screenshot('account-email-entered');
      }
    }
  });

  test('form validation messages are visible on mobile', async ({ page }) => {
    const mobile = new MobileTestHelper(page);

    await page.goto(`${BASE_URL}/order/account`);
    await waitForMobileLoad(page);

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible({ timeout: 5000 })) {
      await mobile.tap(submitButton);
      await page.waitForTimeout(1000);

      // Check for validation messages
      const errorMessages = page.locator(
        '[class*="error"], [role="alert"], [class*="invalid"]'
      );
      const errorCount = await errorMessages.count();

      await mobile.screenshot('account-validation-errors');

      // Errors should be visible without scrolling
      if (errorCount > 0) {
        const firstError = errorMessages.first();
        const isInViewport = await mobile.isElementInViewport(firstError);
        expect(isInViewport).toBe(true);
      }
    }
  });
});

test.describe('Mobile Order Flow - iPhone SE (Small Screen)', () => {
  test.use({ ...devices['iPhone SE'] });

  test('order flow works on small screen', async ({ page }) => {
    const mobile = new MobileTestHelper(page);

    await page.goto(`${BASE_URL}/order`);
    await waitForMobileLoad(page);

    await mobile.screenshot('order-small-screen');

    // Verify no horizontal overflow on small screen
    const hasOverflow = await hasHorizontalOverflow(page);
    expect(hasOverflow).toBe(false);

    // Check that primary CTA is visible
    const ctaButton = page.locator(
      'button:has-text("Continue"), button:has-text("Next"), button:has-text("Start")'
    ).first();

    if (await ctaButton.isVisible({ timeout: 3000 })) {
      const isInViewport = await mobile.isElementInViewport(ctaButton);
      expect(isInViewport).toBe(true);
    }
  });
});

test.describe('Mobile Order Flow - Landscape', () => {
  test.use({ ...devices['iPhone 13 landscape'] });

  test('order flow works in landscape orientation', async ({ page }) => {
    const mobile = new MobileTestHelper(page);

    await page.goto(`${BASE_URL}/order`);
    await waitForMobileLoad(page);

    await mobile.screenshot('order-landscape');

    // Verify viewport is landscape
    const viewport = page.viewportSize();
    expect(viewport!.width).toBeGreaterThan(viewport!.height);

    // Check for overflow
    const hasOverflow = await hasHorizontalOverflow(page);
    expect(hasOverflow).toBe(false);
  });
});
