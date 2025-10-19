/**
 * Test Coverage Checker on Homepage
 *
 * This script uses Playwright to:
 * 1. Navigate to the homepage
 * 2. Find and fill the coverage checker form
 * 3. Submit an address for checking
 * 4. Verify displayed products match MTN API response
 * 5. Take screenshots of results
 */

import { chromium, Browser, Page } from 'playwright';

const PROD_URL = 'https://circletel-staging.vercel.app';
const TEST_ADDRESS = '18 Rasmus Erasmus, Heritage Hill, Centurion';

async function testCoverageChecker() {
  let browser: Browser | null = null;

  try {
    console.log('🚀 Starting Coverage Checker Test...\n');

    // Launch browser
    browser = await chromium.launch({
      headless: false, // Show browser for debugging
      slowMo: 500 // Slow down actions to see what's happening
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    // Step 1: Navigate to homepage
    console.log('📍 Step 1: Navigating to homepage...');
    await page.goto(PROD_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'coverage-test-1-homepage.png', fullPage: true });
    console.log('✅ Homepage loaded\n');

    // Step 2: Find coverage checker form
    console.log('🔍 Step 2: Looking for "Check Service Availability" form...');

    // Strategy: Find the heading, then traverse to find the input within the same card/section
    const heading = page.getByText('Check Service Availability', { exact: false });

    if (!await heading.isVisible()) {
      console.log('⚠️  "Check Service Availability" heading not found');
      await page.screenshot({ path: 'coverage-test-error-no-heading.png', fullPage: true });
      throw new Error('Check Service Availability heading not found');
    }

    console.log('✅ Found "Check Service Availability" heading');

    // Find the parent card/section containing this heading
    const coverageCard = heading.locator('xpath=ancestor::div[contains(@class, "card") or contains(@class, "border") or contains(@class, "rounded")][1]');

    // Try multiple strategies to find the input field
    let addressInput = null;

    // Strategy 1: Look for input with placeholder containing "address"
    try {
      addressInput = await coverageCard.locator('input[placeholder*="address" i]').first();
      if (await addressInput.isVisible({ timeout: 2000 })) {
        console.log('✅ Found address input via placeholder');
      } else {
        addressInput = null;
      }
    } catch (e) {
      console.log('⚠️  Strategy 1 failed (placeholder)');
    }

    // Strategy 2: Look for any text input in the coverage card
    if (!addressInput) {
      try {
        addressInput = await coverageCard.locator('input[type="text"]').first();
        if (await addressInput.isVisible({ timeout: 2000 })) {
          console.log('✅ Found address input via type=text');
        } else {
          addressInput = null;
        }
      } catch (e) {
        console.log('⚠️  Strategy 2 failed (type=text)');
      }
    }

    // Strategy 3: Look for any input in the coverage card
    if (!addressInput) {
      try {
        addressInput = await coverageCard.locator('input').first();
        if (await addressInput.isVisible({ timeout: 2000 })) {
          console.log('✅ Found address input via generic input selector');
        } else {
          addressInput = null;
        }
      } catch (e) {
        console.log('⚠️  Strategy 3 failed (generic input)');
      }
    }

    if (!addressInput) {
      console.log('⚠️  Could not find address input in coverage form');
      await page.screenshot({ path: 'coverage-test-error-no-input.png', fullPage: true });

      // Debug: Print the card HTML
      const cardHTML = await coverageCard.innerHTML();
      console.log('\n🔍 Coverage Card HTML:');
      console.log(cardHTML.substring(0, 500) + '...');

      throw new Error('Address input not found in coverage form');
    }

    console.log('✅ Address input located\n');

    // Step 3: Fill in address
    console.log('✍️  Step 3: Entering test address...');
    await addressInput.fill(TEST_ADDRESS);
    console.log(`   Address: ${TEST_ADDRESS}`);
    await page.screenshot({ path: 'coverage-test-2-address-entered.png', fullPage: true });
    console.log('✅ Address entered\n');

    // Step 4: Submit form
    console.log('📤 Step 4: Submitting coverage check...');

    // Try to find submit button within the coverage card
    let submitButton = null;

    // Strategy 1: Look for button with specific text within the card
    const buttonTexts = ['Check', 'Search', 'Submit', 'Find'];
    for (const text of buttonTexts) {
      try {
        submitButton = await coverageCard.locator(`button:has-text("${text}")`).first();
        if (await submitButton.isVisible({ timeout: 1000 })) {
          console.log(`✅ Found submit button with text "${text}"`);
          break;
        } else {
          submitButton = null;
        }
      } catch (e) {
        // Try next text
      }
    }

    // Strategy 2: Look for submit type button
    if (!submitButton) {
      try {
        submitButton = await coverageCard.locator('button[type="submit"]').first();
        if (await submitButton.isVisible({ timeout: 1000 })) {
          console.log('✅ Found submit button via type=submit');
        } else {
          submitButton = null;
        }
      } catch (e) {
        console.log('⚠️  No submit type button found');
      }
    }

    // Strategy 3: Just click any button in the card
    if (!submitButton) {
      try {
        submitButton = await coverageCard.locator('button').first();
        if (await submitButton.isVisible({ timeout: 1000 })) {
          console.log('✅ Found generic button in coverage card');
        } else {
          submitButton = null;
        }
      } catch (e) {
        console.log('⚠️  No buttons found in coverage card');
      }
    }

    if (!submitButton) {
      // Try pressing Enter instead
      console.log('⚠️  Submit button not found, trying Enter key...');
      await addressInput.press('Enter');
    } else {
      await submitButton.click();
    }

    console.log('⏳ Waiting for results...\n');

    // Wait for API response
    const apiResponse = await page.waitForResponse(
      response => response.url().includes('/api/') && response.url().includes('feasibility'),
      { timeout: 30000 }
    );

    const apiData = await apiResponse.json();
    console.log('📊 MTN API Response:');
    console.log(JSON.stringify(apiData, null, 2));
    console.log('');

    // Extract available products from API
    const availableProducts = apiData.outputs?.[0]?.product_results
      ?.filter((p: any) => p.product_feasible === 'Yes')
      ?.map((p: any) => p.product_name) || [];

    console.log('✅ Available Products (from MTN API):');
    availableProducts.forEach((product: string) => console.log(`   - ${product}`));
    console.log('');

    // Wait for results to render
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'coverage-test-3-results.png', fullPage: true });

    // Step 5: Verify displayed products
    console.log('🔍 Step 5: Verifying displayed products...');

    // Try to find product cards/listings on the page
    const pageContent = await page.content();
    const bodyText = await page.textContent('body');

    // Check if available products are shown
    const displayedProducts: string[] = [];
    const notDisplayedProducts: string[] = [];

    for (const product of availableProducts) {
      // Check different possible display names
      const productVariations = [
        product,
        product.replace('Fixed Wireless Broadband', 'SkyFibre'),
        product.replace('Wholesale', ''),
        'SkyFibre' // CircleTel branding
      ];

      let found = false;
      for (const variation of productVariations) {
        if (bodyText?.includes(variation)) {
          displayedProducts.push(product);
          found = true;
          break;
        }
      }

      if (!found) {
        notDisplayedProducts.push(product);
      }
    }

    console.log('\n📋 Results Summary:');
    console.log('==================');
    console.log(`✅ Products displayed: ${displayedProducts.length}`);
    displayedProducts.forEach(p => console.log(`   ✓ ${p}`));

    if (notDisplayedProducts.length > 0) {
      console.log(`\n⚠️  Products NOT displayed: ${notDisplayedProducts.length}`);
      notDisplayedProducts.forEach(p => console.log(`   ✗ ${p}`));
    }

    console.log('\n📸 Screenshots saved:');
    console.log('   - coverage-test-1-homepage.png');
    console.log('   - coverage-test-2-address-entered.png');
    console.log('   - coverage-test-3-results.png');

    // Final verdict
    console.log('\n🎯 Test Result:');
    if (displayedProducts.length === availableProducts.length) {
      console.log('✅ SUCCESS: All available products are displayed!');
      return true;
    } else if (displayedProducts.length > 0) {
      console.log('⚠️  PARTIAL: Some products displayed but not all');
      return false;
    } else {
      console.log('❌ FAILED: No products found on page');
      return false;
    }

  } catch (error) {
    console.error('\n❌ Test Error:', error);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testCoverageChecker()
  .then(success => {
    console.log('\n' + '='.repeat(60));
    console.log(success ? '✅ Test Completed Successfully' : '❌ Test Failed');
    console.log('='.repeat(60));
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
