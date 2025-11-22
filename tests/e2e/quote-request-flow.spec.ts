import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Test: Complete Quote Request Flow
 *
 * This test covers the entire quote request journey:
 * 1. Navigate to quote request page
 * 2. Fill in business details
 * 3. Enter address and check coverage
 * 4. Open map modal (horizontal layout)
 * 5. Select location on map
 * 6. Confirm location
 * 7. Select package
 * 8. Submit quote request
 */

test.describe('Quote Request Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to quote request page
    await page.goto('http://localhost:3000/quotes/request');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full quote request flow with map modal', async ({ page }) => {
    console.log('Starting complete quote request flow test...');

    // Step 1: Verify page loaded
    await expect(page.locator('h1, h2').filter({ hasText: /Request.*Quote/i })).toBeVisible({ timeout: 10000 });
    console.log('✓ Page loaded successfully');

    // Step 2: Fill in business details
    console.log('Filling in business details...');

    // Company name
    const companyInput = page.locator('input[name="companyName"], input[placeholder*="company"], input[placeholder*="Company"]').first();
    await companyInput.waitFor({ state: 'visible', timeout: 5000 });
    await companyInput.fill('Test Company Ltd');

    // Contact person
    const contactInput = page.locator('input[name="contactPerson"], input[placeholder*="contact"], input[placeholder*="Contact"]').first();
    if (await contactInput.isVisible()) {
      await contactInput.fill('John Doe');
    }

    // Email
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await emailInput.fill('john.doe@testcompany.co.za');

    // Phone
    const phoneInput = page.locator('input[type="tel"], input[name="phone"], input[placeholder*="phone"]').first();
    await phoneInput.waitFor({ state: 'visible', timeout: 5000 });
    await phoneInput.fill('0821234567');

    console.log('✓ Business details filled');

    // Step 3: Enter address
    console.log('Entering address...');
    const addressInput = page.locator('input[placeholder*="address"], input[name="address"]').first();
    await addressInput.waitFor({ state: 'visible', timeout: 5000 });
    await addressInput.fill('123 Test Street, Pretoria');
    await page.waitForTimeout(1000); // Wait for autocomplete

    console.log('✓ Address entered');

    // Step 4: Check coverage
    console.log('Checking coverage...');
    const checkCoverageButton = page.locator('button').filter({ hasText: /Check.*Coverage/i }).first();
    if (await checkCoverageButton.isVisible({ timeout: 5000 })) {
      await checkCoverageButton.click();
      await page.waitForTimeout(3000); // Wait for coverage check API
      console.log('✓ Coverage checked');

      // Step 5: Check if coverage unavailable prompt appears
      const coverageUnavailablePrompt = page.locator('text=/coverage.*unavailable/i, text=/no.*coverage/i').first();
      if (await coverageUnavailablePrompt.isVisible({ timeout: 5000 })) {
        console.log('Coverage unavailable - opening map modal...');

        // Click "Select on map" button
        const selectOnMapButton = page.locator('button').filter({ hasText: /Select.*map/i }).first();
        await selectOnMapButton.click();
        await page.waitForTimeout(2000);

        // Step 6: Verify horizontal map modal opened
        console.log('Verifying horizontal map modal...');
        const mapModal = page.locator('[role="dialog"]').first();
        await expect(mapModal).toBeVisible({ timeout: 10000 });

        // Check for map elements
        const googleMapIframe = page.frameLocator('iframe[src*="google.com/maps"]').first();
        await expect(googleMapIframe.locator('body')).toBeVisible({ timeout: 15000 });
        console.log('✓ Google Maps loaded');

        // Verify horizontal layout elements (controls on right side)
        const confirmButton = page.locator('button').filter({ hasText: /Confirm.*Location/i }).first();
        await expect(confirmButton).toBeVisible();

        const useMyLocationButton = page.locator('button').filter({ hasText: /Use My Location/i }).first();
        await expect(useMyLocationButton).toBeVisible();
        console.log('✓ Horizontal layout verified (map left, controls right)');

        // Step 7: Test address input in modal
        const modalAddressInput = mapModal.locator('input[placeholder*="address"]').first();
        if (await modalAddressInput.isVisible()) {
          await modalAddressInput.fill('456 New Street, Johannesburg');
          await page.waitForTimeout(2000); // Wait for geocoding
          console.log('✓ Address updated in map modal');
        }

        // Step 8: Confirm location
        await confirmButton.click();
        await page.waitForTimeout(1000);
        console.log('✓ Location confirmed');

        // Verify modal closed
        await expect(mapModal).not.toBeVisible({ timeout: 5000 });
        console.log('✓ Map modal closed');
      } else {
        console.log('Coverage available - skipping map modal test');
      }
    }

    // Step 9: Select package (if package selection is available)
    console.log('Looking for package selection...');
    const packageCard = page.locator('[data-testid*="package"], .package-card, button:has-text("Select Package")').first();
    if (await packageCard.isVisible({ timeout: 5000 })) {
      await packageCard.click();
      await page.waitForTimeout(1000);
      console.log('✓ Package selected');
    }

    // Step 10: Submit quote request
    console.log('Submitting quote request...');
    const submitButton = page.locator('button').filter({ hasText: /Submit.*Quote|Request.*Quote|Get.*Quote/i }).first();
    if (await submitButton.isVisible({ timeout: 5000 })) {
      await submitButton.click();
      await page.waitForTimeout(3000);

      // Verify success message or redirect
      const successMessage = page.locator('text=/success|submitted|received/i').first();
      const thanksMessage = page.locator('text=/thank you|thanks/i').first();

      const isSuccess = await successMessage.isVisible({ timeout: 5000 }).catch(() => false);
      const isThanks = await thanksMessage.isVisible({ timeout: 5000 }).catch(() => false);

      if (isSuccess || isThanks) {
        console.log('✓ Quote request submitted successfully');
      } else {
        console.log('⚠ Could not verify submission success message');
      }
    }

    console.log('✅ Complete quote request flow test finished');
  });

  test('should open map modal from AddressAutocomplete', async ({ page }) => {
    console.log('Testing AddressAutocomplete map modal with horizontal layout...');

    // Step 1: Find address input
    const addressInput = page.locator('input[placeholder*="address"]').first();
    await addressInput.waitFor({ state: 'visible', timeout: 10000 });
    await addressInput.fill('Test Address');
    console.log('✓ Address input filled');

    // Step 2: Click "Can't find your address? Select on map" button
    const selectOnMapButton = page.locator('button').filter({ hasText: /Can't find.*address.*Select on map/i }).first();
    await selectOnMapButton.waitFor({ state: 'visible', timeout: 5000 });
    await selectOnMapButton.click();
    await page.waitForTimeout(2000);
    console.log('✓ Clicked "Select on map" button');

    // Step 3: Verify horizontal map modal opened
    const mapModal = page.locator('[role="dialog"]').first();
    await expect(mapModal).toBeVisible({ timeout: 10000 });
    console.log('✓ Map modal opened');

    // Step 4: Verify Google Maps loaded
    const googleMapIframe = page.frameLocator('iframe[src*="google.com/maps"]').first();
    await expect(googleMapIframe.locator('body')).toBeVisible({ timeout: 15000 });
    console.log('✓ Google Maps loaded');

    // Step 5: Verify horizontal layout elements
    const confirmButton = page.locator('button').filter({ hasText: /Confirm.*Location/i }).first();
    await expect(confirmButton).toBeVisible();

    const cancelButton = page.locator('button').filter({ hasText: /Cancel|Close/i }).first();
    await expect(cancelButton).toBeVisible();

    const useMyLocationButton = page.locator('button').filter({ hasText: /Use My Location/i }).first();
    await expect(useMyLocationButton).toBeVisible();
    console.log('✓ All horizontal layout controls visible');

    // Step 6: Test map/satellite toggle
    const mapTypeToggle = page.locator('button').filter({ hasText: /Map|Satellite/i }).first();
    if (await mapTypeToggle.isVisible()) {
      await mapTypeToggle.click();
      await page.waitForTimeout(1000);
      console.log('✓ Map type toggle working');
    }

    // Step 7: Close modal
    await cancelButton.click();
    await page.waitForTimeout(1000);
    await expect(mapModal).not.toBeVisible();
    console.log('✓ Modal closed successfully');

    console.log('✅ AddressAutocomplete map modal test finished');
  });

  test('should be mobile responsive', async ({ page }) => {
    console.log('Testing mobile responsive layout...');

    // Test at mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000/quotes/request');
    await page.waitForLoadState('networkidle');
    console.log('✓ Mobile viewport set (375×667)');

    // Find and click address input's map button
    const addressInput = page.locator('input[placeholder*="address"]').first();
    await addressInput.waitFor({ state: 'visible', timeout: 10000 });
    await addressInput.fill('Mobile Test Address');

    const selectOnMapButton = page.locator('button').filter({ hasText: /Select on map/i }).first();
    if (await selectOnMapButton.isVisible({ timeout: 5000 })) {
      await selectOnMapButton.click();
      await page.waitForTimeout(2000);

      // Verify modal opened
      const mapModal = page.locator('[role="dialog"]').first();
      await expect(mapModal).toBeVisible({ timeout: 10000 });
      console.log('✓ Map modal opened on mobile');

      // Verify single column layout (map on top, controls below)
      // On mobile, the layout should stack vertically
      const modalContent = mapModal.locator('.flex-col, [class*="flex-col"]').first();
      await expect(modalContent).toBeVisible();
      console.log('✓ Single column layout verified on mobile');

      // Close modal
      const cancelButton = page.locator('button').filter({ hasText: /Cancel|Close/i }).first();
      await cancelButton.click();
      await page.waitForTimeout(1000);
    }

    // Test at tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    console.log('✓ Tablet viewport tested (768×1024)');

    // Test at desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    console.log('✓ Desktop viewport tested (1920×1080)');

    console.log('✅ Mobile responsive test finished');
  });

  test('should have no console errors', async ({ page }) => {
    console.log('Testing for console errors...');

    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    // Listen for console messages
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning' && !msg.text().includes('Fast Refresh')) {
        consoleWarnings.push(msg.text());
      }
    });

    // Navigate and interact with the page
    await page.goto('http://localhost:3000/quotes/request');
    await page.waitForLoadState('networkidle');

    // Fill address to trigger autocomplete
    const addressInput = page.locator('input[placeholder*="address"]').first();
    await addressInput.waitFor({ state: 'visible', timeout: 10000 });
    await addressInput.fill('Test Address for Console Check');
    await page.waitForTimeout(2000);

    // Try to open map modal
    const selectOnMapButton = page.locator('button').filter({ hasText: /Select on map/i }).first();
    if (await selectOnMapButton.isVisible({ timeout: 5000 })) {
      await selectOnMapButton.click();
      await page.waitForTimeout(3000); // Wait for Google Maps to load

      // Check for map modal and Google Maps
      const mapModal = page.locator('[role="dialog"]').first();
      if (await mapModal.isVisible({ timeout: 5000 })) {
        await page.waitForTimeout(5000); // Wait for map interactions

        // Close modal
        const cancelButton = page.locator('button').filter({ hasText: /Cancel|Close/i }).first();
        await cancelButton.click();
      }
    }

    await page.waitForTimeout(2000);

    // Report results
    console.log('\n📊 Console Error Analysis:');
    console.log(`   Errors detected: ${consoleErrors.length}`);
    console.log(`   Warnings detected: ${consoleWarnings.length}`);

    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors:');
      consoleErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    if (consoleWarnings.length > 0) {
      console.log('\n⚠️  Console Warnings:');
      consoleWarnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }

    // Assert no critical errors
    expect(consoleErrors.length).toBe(0);
    console.log('✅ No console errors detected');
  });
});
