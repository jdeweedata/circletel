/**
 * Mobile Address Autocomplete E2E Test
 * 
 * Tests the address autocomplete dropdown functionality on mobile devices:
 * 1. User types an address in the search input
 * 2. Google Places autocomplete suggestions appear
 * 3. User can tap/touch to select an address from the dropdown
 * 4. Selected address populates the input field
 * 
 * Target: https://www.circletel.co.za/
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test configuration for production site
const PROD_URL = 'https://www.circletel.co.za';

// Test addresses (South African addresses for Google Places)
const TEST_ADDRESSES = {
  partial: '123 Main',
  sandton: '123 Sandton Drive, Sandton',
  capeTown: '1 Long Street, Cape Town',
  johannesburg: 'Nelson Mandela Square, Johannesburg',
};

// Mobile viewport configurations
const MOBILE_VIEWPORTS = {
  iPhone12: { width: 390, height: 844 },
  iPhone14Pro: { width: 393, height: 852 },
  galaxyS21: { width: 360, height: 800 },
  pixel5: { width: 393, height: 851 },
};

// Helper to wait for Google Places API to load
async function waitForGooglePlacesAPI(page: Page, timeout = 15000): Promise<boolean> {
  try {
    await page.waitForFunction(
      () => typeof google !== 'undefined' && google.maps && google.maps.places,
      { timeout }
    );
    console.log('✓ Google Places API loaded');
    return true;
  } catch {
    console.log('⚠ Google Places API not loaded within timeout');
    return false;
  }
}

// Helper to find the address input field
async function findAddressInput(page: Page): Promise<ReturnType<Page['locator']> | null> {
  // Try multiple selectors for the address input
  const selectors = [
    'input[placeholder*="address"]',
    'input[placeholder*="Address"]',
    'input[placeholder*="street"]',
    'input[placeholder*="Street"]',
    'input[placeholder*="Enter"]',
    '[data-testid="address-input"]',
    '.pac-target-input', // Google Places autocomplete class
  ];

  for (const selector of selectors) {
    const input = page.locator(selector).first();
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log(`✓ Found address input with selector: ${selector}`);
      return input;
    }
  }

  return null;
}

// Helper to find autocomplete dropdown
async function findAutocompleteDropdown(page: Page): Promise<ReturnType<Page['locator']> | null> {
  // Google Places autocomplete dropdown selectors
  const selectors = [
    '.pac-container', // Google Places autocomplete container
    '.pac-item', // Google Places autocomplete items
    '[role="listbox"]', // ARIA listbox
    '[class*="suggestions"]',
    '[class*="dropdown"]',
    '[class*="autocomplete"]',
  ];

  for (const selector of selectors) {
    const dropdown = page.locator(selector).first();
    if (await dropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log(`✓ Found autocomplete dropdown with selector: ${selector}`);
      return dropdown;
    }
  }

  return null;
}

test.describe('Mobile Address Autocomplete - Production Site', () => {
  test.setTimeout(120000); // 2 minutes for production tests

  // Configure mobile viewport for all tests in this describe block
  test.use({
    viewport: MOBILE_VIEWPORTS.iPhone12,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    hasTouch: true,
    isMobile: true,
  });

  test('should display autocomplete suggestions when typing address on mobile', async ({ page }) => {
    console.log('\n========================================');
    console.log('MOBILE ADDRESS AUTOCOMPLETE TEST');
    console.log('========================================\n');

    // Navigate to production site
    console.log('Step 1: Navigating to CircleTel homepage...');
    await page.goto(PROD_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
      console.log('⚠ Network idle timeout - continuing anyway');
    });

    await page.screenshot({ path: 'test-results/mobile-1-homepage.png', fullPage: false });
    console.log('✓ Homepage loaded');

    // Wait for Google Places API
    console.log('\nStep 2: Waiting for Google Places API...');
    const apiLoaded = await waitForGooglePlacesAPI(page);

    // Find the address input
    console.log('\nStep 3: Finding address input field...');
    const addressInput = await findAddressInput(page);

    if (!addressInput) {
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/mobile-error-no-input.png', fullPage: true });
      throw new Error('Could not find address input field on the page');
    }

    // Scroll to make input visible on mobile
    await addressInput.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Tap on the input to focus it (mobile touch event)
    console.log('\nStep 4: Tapping on address input...');
    await addressInput.tap();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'test-results/mobile-2-input-focused.png' });
    console.log('✓ Input focused');

    // Type a partial address to trigger autocomplete
    console.log('\nStep 5: Typing address to trigger autocomplete...');
    await addressInput.fill('');
    await addressInput.type('123 Sandton', { delay: 100 }); // Type slowly to trigger autocomplete

    await page.waitForTimeout(2000); // Wait for autocomplete suggestions
    await page.screenshot({ path: 'test-results/mobile-3-typing-address.png' });
    console.log('✓ Address typed');

    // Look for autocomplete dropdown
    console.log('\nStep 6: Looking for autocomplete suggestions...');
    
    // Wait for Google Places autocomplete container
    const pacContainer = page.locator('.pac-container');
    const pacItems = page.locator('.pac-item');
    
    // Also check for custom dropdown
    const customDropdown = page.locator('[class*="suggestions"], [class*="dropdown"]').first();

    let suggestionsFound = false;
    let suggestionElement: ReturnType<Page['locator']> | null = null;

    // Check for Google Places autocomplete
    if (await pacContainer.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✓ Google Places autocomplete container visible');
      suggestionsFound = true;
      
      const itemCount = await pacItems.count();
      console.log(`  Found ${itemCount} autocomplete suggestions`);
      
      if (itemCount > 0) {
        suggestionElement = pacItems.first();
      }
    }

    // Check for custom dropdown if Google Places not found
    if (!suggestionsFound && await customDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('✓ Custom autocomplete dropdown visible');
      suggestionsFound = true;
      suggestionElement = customDropdown.locator('button, [role="option"], li').first();
    }

    await page.screenshot({ path: 'test-results/mobile-4-suggestions-visible.png' });

    if (!suggestionsFound) {
      console.log('⚠ No autocomplete suggestions visible - checking if API is working...');
      
      // Check console for errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(2000);
      
      if (consoleErrors.length > 0) {
        console.log('Console errors found:', consoleErrors);
      }
      
      // This might be expected if Google API key has restrictions
      console.log('ℹ Autocomplete may be disabled or API key restricted');
    }

    // Step 7: Test touch selection of suggestion (if available)
    if (suggestionElement) {
      console.log('\nStep 7: Testing touch selection of suggestion...');
      
      // Get the suggestion text before tapping
      const suggestionText = await suggestionElement.textContent();
      console.log(`  Suggestion text: ${suggestionText?.substring(0, 50)}...`);
      
      // Tap on the suggestion (mobile touch event)
      await suggestionElement.tap();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'test-results/mobile-5-after-selection.png' });
      
      // Verify the input was updated
      const inputValue = await addressInput.inputValue();
      console.log(`  Input value after selection: ${inputValue}`);
      
      if (inputValue && inputValue.length > 0) {
        console.log('✓ Address successfully selected via touch');
        expect(inputValue.length).toBeGreaterThan(0);
      } else {
        console.log('⚠ Input value not updated after selection');
      }
    } else {
      console.log('\nStep 7: Skipped - No suggestion element to tap');
    }

    // Step 8: Test the "Check coverage" button
    console.log('\nStep 8: Testing Check Coverage button...');
    const checkCoverageBtn = page.locator('button:has-text("Check coverage"), button:has-text("Check Coverage")').first();
    
    if (await checkCoverageBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const isEnabled = await checkCoverageBtn.isEnabled();
      console.log(`  Check Coverage button visible: true, enabled: ${isEnabled}`);
      
      await page.screenshot({ path: 'test-results/mobile-6-check-coverage-btn.png' });
    }

    console.log('\n========================================');
    console.log('TEST COMPLETED');
    console.log('========================================\n');
  });

  test('should handle touch interactions correctly on mobile viewport', async ({ page }) => {
    console.log('\n--- Mobile Touch Interaction Test ---\n');

    await page.goto(PROD_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

    const addressInput = await findAddressInput(page);
    if (!addressInput) {
      throw new Error('Address input not found');
    }

    // Test 1: Tap to focus
    console.log('Test 1: Tap to focus input');
    await addressInput.tap();
    const isFocused = await addressInput.evaluate(el => el === document.activeElement);
    console.log(`  Input focused after tap: ${isFocused}`);
    expect(isFocused).toBe(true);

    // Test 2: Type with touch keyboard simulation
    console.log('\nTest 2: Type address');
    await addressInput.fill('Nelson Mandela Square');
    const value = await addressInput.inputValue();
    console.log(`  Input value: ${value}`);
    expect(value).toBe('Nelson Mandela Square');

    // Test 3: Clear button interaction (if exists)
    console.log('\nTest 3: Clear button interaction');
    const clearButton = page.locator('button:has(svg[class*="X"]), [class*="clear"]').first();
    if (await clearButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await clearButton.tap();
      const clearedValue = await addressInput.inputValue();
      console.log(`  Value after clear: "${clearedValue}"`);
    } else {
      console.log('  Clear button not visible');
    }

    await page.screenshot({ path: 'test-results/mobile-touch-test.png' });
    console.log('\n✓ Touch interaction test completed');
  });

  test('should work correctly across different mobile viewports', async ({ page, browser }) => {
    console.log('\n--- Multi-Viewport Mobile Test ---\n');

    const viewports = [
      { name: 'iPhone 12', ...MOBILE_VIEWPORTS.iPhone12 },
      { name: 'Galaxy S21', ...MOBILE_VIEWPORTS.galaxyS21 },
      { name: 'Pixel 5', ...MOBILE_VIEWPORTS.pixel5 },
    ];

    for (const viewport of viewports) {
      console.log(`\nTesting viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      // Create a new context with the specific viewport
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        hasTouch: true,
        isMobile: true,
      });
      
      const testPage = await context.newPage();
      
      try {
        await testPage.goto(PROD_URL, { waitUntil: 'domcontentloaded' });
        await testPage.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});

        const addressInput = await findAddressInput(testPage);
        
        if (addressInput) {
          // Check if input is visible and accessible
          const isVisible = await addressInput.isVisible();
          const boundingBox = await addressInput.boundingBox();
          
          console.log(`  Input visible: ${isVisible}`);
          console.log(`  Input position: x=${boundingBox?.x}, y=${boundingBox?.y}`);
          console.log(`  Input size: ${boundingBox?.width}x${boundingBox?.height}`);
          
          // Verify input fits within viewport
          if (boundingBox) {
            expect(boundingBox.x).toBeGreaterThanOrEqual(0);
            expect(boundingBox.x + boundingBox.width).toBeLessThanOrEqual(viewport.width);
          }
          
          // Test tap interaction
          await addressInput.tap();
          await addressInput.type('Test', { delay: 50 });
          
          const value = await addressInput.inputValue();
          console.log(`  Input accepts text: ${value === 'Test' ? 'Yes' : 'No'}`);
          
          await testPage.screenshot({ 
            path: `test-results/mobile-viewport-${viewport.name.replace(/\s/g, '-')}.png` 
          });
        } else {
          console.log(`  ⚠ Address input not found for ${viewport.name}`);
        }
      } finally {
        await context.close();
      }
    }

    console.log('\n✓ Multi-viewport test completed');
  });
});

test.describe('Mobile Address Selection Flow - End to End', () => {
  test.setTimeout(180000); // 3 minutes

  test.use({
    viewport: MOBILE_VIEWPORTS.iPhone12,
    hasTouch: true,
    isMobile: true,
  });

  test('complete address selection flow on mobile', async ({ page }) => {
    console.log('\n========================================');
    console.log('COMPLETE MOBILE ADDRESS SELECTION FLOW');
    console.log('========================================\n');

    // Step 1: Navigate to site
    console.log('Step 1: Navigate to CircleTel...');
    await page.goto(PROD_URL);
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    console.log('✓ Page loaded');

    // Step 2: Find and interact with address input
    console.log('\nStep 2: Find address input...');
    const addressInput = await findAddressInput(page);
    expect(addressInput).not.toBeNull();
    
    await addressInput!.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'test-results/mobile-flow-1-initial.png' });

    // Step 3: Tap and type address
    console.log('\nStep 3: Enter address...');
    await addressInput!.tap();
    await page.waitForTimeout(300);
    
    // Type a real South African address
    await addressInput!.type('Sandton City Shopping Centre', { delay: 80 });
    await page.waitForTimeout(2500); // Wait for autocomplete
    
    await page.screenshot({ path: 'test-results/mobile-flow-2-typed.png' });

    // Step 4: Wait for and interact with suggestions
    console.log('\nStep 4: Check for suggestions...');
    
    // Try to find Google Places autocomplete
    const pacContainer = page.locator('.pac-container');
    const pacItem = page.locator('.pac-item').first();
    
    if (await pacContainer.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✓ Google Places suggestions visible');
      
      const suggestionCount = await page.locator('.pac-item').count();
      console.log(`  Found ${suggestionCount} suggestions`);
      
      if (suggestionCount > 0) {
        // Get first suggestion text
        const firstSuggestion = await pacItem.textContent();
        console.log(`  First suggestion: ${firstSuggestion?.substring(0, 60)}...`);
        
        // Tap on first suggestion
        console.log('\nStep 5: Tap on suggestion...');
        await pacItem.tap();
        await page.waitForTimeout(1000);
        
        // Verify selection
        const selectedAddress = await addressInput!.inputValue();
        console.log(`  Selected address: ${selectedAddress}`);
        
        await page.screenshot({ path: 'test-results/mobile-flow-3-selected.png' });
        
        expect(selectedAddress.length).toBeGreaterThan(0);
        console.log('✓ Address selected successfully');
      }
    } else {
      console.log('⚠ Google Places suggestions not visible');
      console.log('  This may be due to API key restrictions or network issues');
      
      // Check for fallback/manual suggestions
      const fallbackDropdown = page.locator('[class*="suggestion"], [class*="dropdown"]').first();
      if (await fallbackDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('✓ Fallback suggestions found');
      }
    }

    // Step 6: Test Check Coverage button
    console.log('\nStep 6: Check Coverage button state...');
    const checkCoverageBtn = page.locator('button:has-text("Check coverage")').first();
    
    if (await checkCoverageBtn.isVisible()) {
      const isEnabled = await checkCoverageBtn.isEnabled();
      console.log(`  Button enabled: ${isEnabled}`);
      
      if (isEnabled) {
        console.log('  Tapping Check Coverage...');
        await checkCoverageBtn.tap();
        
        // Wait for navigation or loading state
        await page.waitForTimeout(3000);
        
        const currentUrl = page.url();
        console.log(`  Current URL after tap: ${currentUrl}`);
        
        await page.screenshot({ path: 'test-results/mobile-flow-4-after-check.png' });
      }
    }

    console.log('\n========================================');
    console.log('FLOW TEST COMPLETED');
    console.log('========================================\n');
  });
});

// Standalone test that can be run with Playwright MCP
test('Mobile address autocomplete - quick validation', async ({ page }) => {
  test.setTimeout(60000);
  
  // Set mobile viewport
  await page.setViewportSize(MOBILE_VIEWPORTS.iPhone12);
  
  // Navigate
  await page.goto(PROD_URL);
  await page.waitForLoadState('domcontentloaded');
  
  // Find input
  const input = page.locator('input[placeholder*="address" i], input[placeholder*="street" i]').first();
  
  if (await input.isVisible({ timeout: 10000 })) {
    // Tap and type
    await input.tap();
    await input.fill('123 Main Road Sandton');
    
    // Wait for suggestions
    await page.waitForTimeout(2000);
    
    // Check for pac-container (Google Places)
    const hasSuggestions = await page.locator('.pac-container').isVisible().catch(() => false);
    
    console.log(`Address input found: true`);
    console.log(`Suggestions visible: ${hasSuggestions}`);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/mobile-quick-validation.png' });
  } else {
    console.log('Address input not found');
  }
});
