/**
 * Payment Flow E2E Tests
 *
 * Tests the complete payment processing flow including:
 * - Successful payments
 * - Error recovery and retry
 * - Payment persistence
 * - Alternative payment suggestions
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3005';
const TEST_EMAIL = 'payment-test@circletel.co.za';
const TEST_ADDRESS = '123 Test Street, Cape Town, 8001';

// Netcash test cards
const TEST_CARDS = {
  successful: {
    number: '4000000000000002',
    expiry: '12/25',
    cvv: '123',
  },
  declined: {
    number: '4000000000000010',
    expiry: '12/25',
    cvv: '123',
  },
  insufficientFunds: {
    number: '4000000000009995',
    expiry: '12/25',
    cvv: '123',
  },
};

// Helper function to complete order flow to payment page
async function navigateToPaymentPage(page: Page) {
  // Step 1: Coverage Check
  await page.goto(`${BASE_URL}/coverage`);
  await expect(page).toHaveTitle(/Coverage|CircleTel/);

  // Enter test address
  await page.fill('input[name="address"]', TEST_ADDRESS);
  await page.click('button:has-text("Check Coverage")');

  // Wait for coverage results
  await page.waitForSelector('[data-testid="coverage-results"]', { timeout: 10000 });

  // Step 2: Select Package
  await page.click('[data-testid="package-card"]:first-child button:has-text("Select")');
  await page.waitForURL('**/order/account');

  // Step 3: Account Details
  await page.fill('input[name="firstName"]', 'John');
  await page.fill('input[name="lastName"]', 'Test');
  await page.fill('input[name="email"]', TEST_EMAIL);
  await page.fill('input[name="phone"]', '+27821234567');
  await page.click('button:has-text("Continue")');
  await page.waitForURL('**/order/contact');

  // Step 4: Contact Details (use same as account)
  await page.click('input[name="useSameAsAccount"]');
  await page.click('button:has-text("Continue")');
  await page.waitForURL('**/order/installation');

  // Step 5: Installation Preferences
  await page.fill('input[name="preferredDate"]', '2025-11-01');
  await page.fill('textarea[name="specialInstructions"]', 'Test installation');
  await page.click('button:has-text("Continue")');
  await page.waitForURL('**/order/payment');

  // Verify we're on payment page
  await expect(page.locator('h2:has-text("Payment")')).toBeVisible();
}

// Helper function to simulate payment on Netcash gateway
async function simulateNetcashPayment(page: Page, cardType: 'successful' | 'declined' | 'insufficientFunds') {
  // Wait for redirect to Netcash
  await page.waitForURL(/netcash|paynow/i, { timeout: 10000 });

  // Fill in test card details
  const card = TEST_CARDS[cardType];
  await page.fill('input[name="cardNumber"]', card.number);
  await page.fill('input[name="expiryDate"]', card.expiry);
  await page.fill('input[name="cvv"]', card.cvv);

  // Submit payment
  await page.click('button:has-text("Pay Now")');

  // Wait for Netcash to process
  await page.waitForTimeout(2000);
}

test.describe('Payment Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: Clear localStorage after test
    await page.evaluate(() => localStorage.clear());
  });

  test('TC1: Should complete successful payment flow', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes for full flow

    // Navigate to payment page
    await navigateToPaymentPage(page);

    // Verify order summary
    await expect(page.locator('[data-testid="order-summary"]')).toBeVisible();
    await expect(page.locator('text=/Total Due Today/i')).toBeVisible();

    // Click pay button
    await page.click('button:has-text("Pay with Netcash")');

    // Complete payment with successful card
    await simulateNetcashPayment(page, 'successful');

    // Wait for redirect back to success page
    await page.waitForURL(/order\/success|order\/confirmation/i, { timeout: 15000 });

    // Verify success message
    await expect(page.locator('text=/payment successful|order confirmed/i')).toBeVisible();

    // Verify localStorage cleared
    const orderData = await page.evaluate(() => localStorage.getItem('circletel_order_data'));
    expect(orderData).toBeNull();
  });

  test('TC2: Should handle declined payment with retry', async ({ page }) => {
    test.setTimeout(120000);

    // Navigate to payment page
    await navigateToPaymentPage(page);

    // Click pay button
    await page.click('button:has-text("Pay with Netcash")');

    // Attempt payment with declined card
    await simulateNetcashPayment(page, 'declined');

    // Return to CircleTel (simulate redirect or back button)
    await page.goBack();
    await page.waitForURL('**/order/payment');

    // Verify error display shown
    await expect(page.locator('[data-testid="payment-error-display"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/payment.*declined/i')).toBeVisible();

    // Verify retry button present
    await expect(page.locator('button:has-text("Try Payment Again")')).toBeVisible();

    // Verify retry count
    await expect(page.locator('text=/attempted payment 1 time/i')).toBeVisible();

    // Check localStorage persistence
    const orderData = await page.evaluate(() => localStorage.getItem('circletel_order_data'));
    expect(orderData).not.toBeNull();

    const retryInfo = await page.evaluate(() => localStorage.getItem('circletel_payment_retries'));
    expect(retryInfo).not.toBeNull();
    const retryData = JSON.parse(retryInfo);
    expect(retryData.count).toBe(1);

    // Click retry button
    await page.click('button:has-text("Try Payment Again")');

    // Complete payment with successful card this time
    await page.waitForURL(/netcash|paynow/i, { timeout: 10000 });
    await simulateNetcashPayment(page, 'successful');

    // Verify success
    await page.waitForURL(/order\/success|order\/confirmation/i, { timeout: 15000 });
    await expect(page.locator('text=/payment successful|order confirmed/i')).toBeVisible();
  });

  test('TC3: Should show alternatives after 3 retries', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes for multiple retries

    // Navigate to payment page
    await navigateToPaymentPage(page);

    // Attempt 1
    await page.click('button:has-text("Pay with Netcash")');
    await simulateNetcashPayment(page, 'declined');
    await page.goBack();
    await page.waitForURL('**/order/payment');
    await expect(page.locator('text=/attempted payment 1 time/i')).toBeVisible();

    // Attempt 2
    await page.click('button:has-text("Try Payment Again")');
    await simulateNetcashPayment(page, 'declined');
    await page.goBack();
    await page.waitForURL('**/order/payment');
    await expect(page.locator('text=/attempted payment 2 times/i')).toBeVisible();

    // Attempt 3
    await page.click('button:has-text("Try Payment Again")');
    await simulateNetcashPayment(page, 'declined');
    await page.goBack();
    await page.waitForURL('**/order/payment');
    await expect(page.locator('text=/attempted payment 3 times/i')).toBeVisible();

    // Verify alternative payment options card visible
    await expect(page.locator('[data-testid="alternative-payment-card"]')).toBeVisible();
    await expect(page.locator('text=/Alternative Payment Options/i')).toBeVisible();
    await expect(page.locator('text=/EFT.*Bank Transfer/i')).toBeVisible();
    await expect(page.locator('text=/Assisted Payment/i')).toBeVisible();

    // Verify warning message
    await expect(page.locator('text=/multiple attempts.*recommend contacting support/i')).toBeVisible();

    // Verify retry button still available (max 5 attempts)
    await expect(page.locator('button:has-text("Try Payment Again")')).toBeVisible();
  });

  test('TC4: Should handle network timeout', async ({ page }) => {
    test.setTimeout(120000);

    // Navigate to payment page
    await navigateToPaymentPage(page);

    // Simulate network timeout by going offline
    await page.context().setOffline(true);

    // Attempt payment
    await page.click('button:has-text("Pay with Netcash")');

    // Wait for timeout error (should fail to reach Netcash)
    await page.waitForTimeout(5000);

    // Restore network
    await page.context().setOffline(false);

    // Verify error displayed
    await expect(page.locator('[data-testid="payment-error-display"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/timeout|connection|network/i')).toBeVisible();

    // Verify suggestion
    await expect(page.locator('text=/check.*internet connection/i')).toBeVisible();

    // Retry should work now
    await page.click('button:has-text("Try Payment Again")');
    await simulateNetcashPayment(page, 'successful');
    await page.waitForURL(/order\/success|order\/confirmation/i, { timeout: 15000 });
  });

  test('TC5: Should validate invalid payment details', async ({ page }) => {
    test.setTimeout(120000);

    // Navigate to payment page
    await navigateToPaymentPage(page);

    // Click pay button
    await page.click('button:has-text("Pay with Netcash")');

    // Wait for Netcash page
    await page.waitForURL(/netcash|paynow/i, { timeout: 10000 });

    // Enter invalid card number
    await page.fill('input[name="cardNumber"]', '1234567890123456');
    await page.fill('input[name="expiryDate"]', '12/25');
    await page.fill('input[name="cvv"]', '123');
    await page.click('button:has-text("Pay Now")');

    // Verify validation error on Netcash page
    await expect(page.locator('text=/invalid.*card/i')).toBeVisible({ timeout: 5000 });

    // Go back to CircleTel
    await page.goBack();
    await page.waitForURL('**/order/payment');

    // Verify error display
    await expect(page.locator('[data-testid="payment-error-display"]')).toBeVisible();
    await expect(page.locator('text=/invalid.*card.*details/i')).toBeVisible();

    // Verify suggestion
    await expect(page.locator('text=/double-check.*card number.*expiry.*CVV/i')).toBeVisible();
  });

  test('TC6: Should persist abandoned payments', async ({ page }) => {
    test.setTimeout(120000);

    // Navigate to payment page
    await navigateToPaymentPage(page);

    // Click pay button
    await page.click('button:has-text("Pay with Netcash")');

    // Wait for Netcash page
    await page.waitForURL(/netcash|paynow/i, { timeout: 10000 });

    // Simulate user closing tab (go to blank page)
    await page.goto('about:blank');
    await page.waitForTimeout(1000);

    // Reopen CircleTel payment page
    await page.goto(`${BASE_URL}/order/payment`);

    // Verify retry session banner visible
    await expect(page.locator('[data-testid="retry-session-banner"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/Previous payment attempt detected/i')).toBeVisible();
    await expect(page.locator('text=/Order created.*ago/i')).toBeVisible();

    // Verify order data persisted
    const orderData = await page.evaluate(() => localStorage.getItem('circletel_order_data'));
    expect(orderData).not.toBeNull();
    const order = JSON.parse(orderData);
    expect(order.customerEmail).toBe(TEST_EMAIL);

    // Verify can complete payment
    await page.click('button:has-text("Pay with Netcash")');
    await simulateNetcashPayment(page, 'successful');
    await page.waitForURL(/order\/success|order\/confirmation/i, { timeout: 15000 });
  });

  test('TC7: Should clear retry session', async ({ page }) => {
    test.setTimeout(120000);

    // Navigate to payment page
    await navigateToPaymentPage(page);

    // Create a retry session (failed payment)
    await page.click('button:has-text("Pay with Netcash")');
    await simulateNetcashPayment(page, 'declined');
    await page.goBack();
    await page.waitForURL('**/order/payment');

    // Verify retry session exists
    await expect(page.locator('[data-testid="retry-session-banner"]')).toBeVisible();

    // Click "Clear Session" button
    await page.click('button:has-text("Clear Session")');

    // Verify banner disappears
    await expect(page.locator('[data-testid="retry-session-banner"]')).not.toBeVisible({ timeout: 2000 });

    // Verify success toast
    await expect(page.locator('text=/Payment session cleared/i')).toBeVisible();

    // Verify localStorage cleared
    const orderData = await page.evaluate(() => localStorage.getItem('circletel_order_data'));
    expect(orderData).toBeNull();

    const retryInfo = await page.evaluate(() => localStorage.getItem('circletel_payment_retries'));
    expect(retryInfo).toBeNull();
  });

  test('TC8: Should clear stale sessions (24-hour check)', async ({ page }) => {
    test.setTimeout(60000);

    // Navigate to payment page
    await navigateToPaymentPage(page);

    // Manually create a stale order in localStorage (25 hours old)
    await page.evaluate(() => {
      const staleOrder = {
        customerName: 'John Test',
        customerEmail: 'test@circletel.co.za',
        customerPhone: '+27821234567',
        packageId: 'test-package',
        packageName: '50/10 Mbps Fibre',
        serviceType: 'fibre',
        basePrice: 599,
        installationFee: 1000,
        totalAmount: 1599,
        installationAddress: '123 Test Street',
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
      };

      localStorage.setItem('circletel_order_data', JSON.stringify(staleOrder));

      const staleRetry = {
        count: 2,
        lastErrorCode: 'DECLINED',
        attempts: [
          { timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), errorCode: 'DECLINED', errorMessage: 'Test' },
        ],
      };

      localStorage.setItem('circletel_payment_retries', JSON.stringify(staleRetry));
    });

    // Refresh page to trigger staleness check
    await page.reload();
    await page.waitForTimeout(1000);

    // Verify retry session banner NOT visible
    await expect(page.locator('[data-testid="retry-session-banner"]')).not.toBeVisible();

    // Verify localStorage cleared
    const orderData = await page.evaluate(() => localStorage.getItem('circletel_order_data'));
    expect(orderData).toBeNull();
  });

  test('TC9: Support contact buttons functional', async ({ page }) => {
    test.setTimeout(60000);

    // Navigate to payment page
    await navigateToPaymentPage(page);

    // Create error state
    await page.click('button:has-text("Pay with Netcash")');
    await simulateNetcashPayment(page, 'declined');
    await page.goBack();
    await page.waitForURL('**/order/payment');

    // Verify error display with support buttons
    await expect(page.locator('button:has-text("Call Support")')).toBeVisible();
    await expect(page.locator('button:has-text("Email Support")')).toBeVisible();

    // Verify phone button has correct href
    const phoneButton = page.locator('button:has-text("Call Support")');
    await expect(phoneButton).toHaveAttribute('onclick', /tel:0860247253/);

    // Verify email button has correct href
    const emailButton = page.locator('button:has-text("Email Support")');
    await expect(emailButton).toHaveAttribute('onclick', /mailto:support@circletel\.co\.za/);
  });

  test('TC10: Mobile responsive payment flow', async ({ page }) => {
    test.setTimeout(120000);

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X

    // Navigate to payment page
    await navigateToPaymentPage(page);

    // Verify payment card is visible and responsive
    await expect(page.locator('h2:has-text("Payment")')).toBeVisible();
    await expect(page.locator('[data-testid="order-summary"]')).toBeVisible();

    // Verify buttons are accessible
    const payButton = page.locator('button:has-text("Pay with Netcash")');
    await expect(payButton).toBeVisible();

    // Verify no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasHorizontalScroll).toBe(false);

    // Create error state to test error display responsiveness
    await page.click('button:has-text("Pay with Netcash")');
    await simulateNetcashPayment(page, 'declined');
    await page.goBack();
    await page.waitForURL('**/order/payment');

    // Verify error display is readable on mobile
    await expect(page.locator('[data-testid="payment-error-display"]')).toBeVisible();
    await expect(page.locator('button:has-text("Try Payment Again")')).toBeVisible();
    await expect(page.locator('button:has-text("Call Support")')).toBeVisible();
  });
});
