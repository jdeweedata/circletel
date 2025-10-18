/**
 * CircleTel Customer Portal - Complete Flow Testing
 * Uses Playwright to capture network traffic and test full user journey
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';

interface NetworkCall {
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  requestBody?: string;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: any;
  timestamp: number;
}

const networkCalls: NetworkCall[] = [];

async function setupNetworkMonitoring(page: Page) {
  // Monitor all requests
  page.on('request', request => {
    const url = request.url();

    // Filter for API calls
    if (
      url.includes('agilitygis.com') &&
      (url.includes('/api/') || url.includes('lead') || url.includes('package') || url.includes('coverage'))
    ) {
      networkCalls.push({
        url: request.url(),
        method: request.method(),
        requestHeaders: request.headers(),
        requestBody: request.postData(),
        timestamp: Date.now()
      });

      console.log(`\n📤 ${request.method()} ${url}`);
      if (request.postData()) {
        try {
          const body = JSON.parse(request.postData()!);
          console.log('   Body:', JSON.stringify(body, null, 2).substring(0, 200));
        } catch {
          console.log('   Body:', request.postData()?.substring(0, 100));
        }
      }
    }
  });

  // Monitor all responses
  page.on('response', async response => {
    const url = response.url();

    if (
      url.includes('agilitygis.com') &&
      (url.includes('/api/') || url.includes('lead') || url.includes('package') || url.includes('coverage'))
    ) {
      const call = networkCalls.find(c => c.url === url && !c.responseStatus);

      if (call) {
        call.responseStatus = response.status();
        call.responseHeaders = response.headers();

        try {
          const contentType = response.headers()['content-type'] || '';
          if (contentType.includes('json')) {
            call.responseBody = await response.json();
          } else {
            call.responseBody = await response.text();
          }
        } catch (error) {
          console.error('Error parsing response:', error);
        }
      }

      console.log(`📥 ${response.status()} ${url}`);
      if (call?.responseBody) {
        const preview = typeof call.responseBody === 'object'
          ? JSON.stringify(call.responseBody, null, 2).substring(0, 200)
          : String(call.responseBody).substring(0, 200);
        console.log('   ', preview);
      }
    }
  });
}

async function testCircleTelPortal() {
  console.log('🚀 CircleTel Customer Portal - Full Flow Test\n');
  console.log('Target: https://circletel-customer.agilitygis.com/#/\n');

  let browser: Browser | null = null;
  let context: BrowserContext | null = null;

  try {
    // Launch browser in non-headless mode for visibility
    browser = await chromium.launch({
      headless: false,
      slowMo: 500 // Slow down by 500ms for visibility
    });

    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    const page = await context.newPage();

    // Set up network monitoring
    await setupNetworkMonitoring(page);

    console.log('📍 Step 1: Navigate to portal...');
    await page.goto('https://circletel-customer.agilitygis.com/#/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for initial API calls
    await page.waitForTimeout(5000);

    console.log('📸 Screenshot: Initial state');
    await page.screenshot({
      path: '.playwright-mcp/circletel-portal-step1-initial.png',
      fullPage: true
    });

    console.log('\n📍 Step 2: Find and fill address input...');

    // Try multiple selectors for address input
    const addressSelectors = [
      'input[type="text"]',
      'input[placeholder*="address" i]',
      'input[placeholder*="location" i]',
      'input.form-control',
      '#address',
      '[ng-model*="address"]'
    ];

    let addressInput = null;
    for (const selector of addressSelectors) {
      try {
        const input = page.locator(selector).first();
        if (await input.isVisible({ timeout: 1000 })) {
          addressInput = input;
          console.log(`✅ Found input: ${selector}`);
          break;
        }
      } catch {}
    }

    if (!addressInput) {
      console.log('❌ Could not find address input field');
      console.log('📋 Page content preview:');
      const bodyText = await page.textContent('body');
      console.log(bodyText?.substring(0, 500));
      return;
    }

    const testAddress = '18 Rasmus Erasmus Boulevard, Heritage Hill, Centurion';
    console.log(`⌨️  Typing: ${testAddress}`);

    await addressInput.click();
    await addressInput.fill(testAddress);
    await page.waitForTimeout(3000); // Wait for autocomplete

    console.log('📸 Screenshot: Address entered');
    await page.screenshot({
      path: '.playwright-mcp/circletel-portal-step2-typed.png',
      fullPage: true
    });

    console.log('\n📍 Step 3: Look for autocomplete dropdown...');

    // Check if Google Places autocomplete appeared
    const autocompleteSelectors = [
      '.pac-container .pac-item',
      '.suggestions li',
      '[role="option"]',
      '.autocomplete-item'
    ];

    let foundAutocomplete = false;
    for (const selector of autocompleteSelectors) {
      try {
        const items = page.locator(selector);
        const count = await items.count();
        if (count > 0) {
          console.log(`✅ Found ${count} autocomplete suggestions`);
          console.log('🖱️  Clicking first suggestion...');
          await items.first().click();
          foundAutocomplete = true;
          await page.waitForTimeout(2000);
          break;
        }
      } catch {}
    }

    if (!foundAutocomplete) {
      console.log('⚠️  No autocomplete found, proceeding with typed address');
    }

    console.log('\n📍 Step 4: Look for submit/search button...');

    const buttonSelectors = [
      'button:has-text("Check")',
      'button:has-text("Submit")',
      'button:has-text("Search")',
      'button:has-text("Continue")',
      'button[type="submit"]',
      '.btn-primary',
      'button.btn'
    ];

    let submitButton = null;
    for (const selector of buttonSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 1000 })) {
          submitButton = button;
          const text = await button.textContent();
          console.log(`✅ Found button: "${text?.trim()}"`);
          break;
        }
      } catch {}
    }

    if (submitButton) {
      console.log('🖱️  Clicking submit button...');
      await submitButton.click();

      // Wait for results
      console.log('⏳ Waiting for results (30 seconds)...');
      await page.waitForTimeout(30000);

      console.log('📸 Screenshot: Results page');
      await page.screenshot({
        path: '.playwright-mcp/circletel-portal-step3-results.png',
        fullPage: true
      });
    } else {
      console.log('⚠️  No submit button found');
    }

    // Additional wait for any delayed API calls
    console.log('\n⏳ Waiting for additional API calls...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    console.log('\n' + '='.repeat(80));
    console.log('📋 CAPTURED NETWORK CALLS SUMMARY');
    console.log('='.repeat(80));

    // Group by endpoint type
    const leadCalls = networkCalls.filter(c => c.url.includes('lead'));
    const packageCalls = networkCalls.filter(c => c.url.includes('package'));
    const coverageCalls = networkCalls.filter(c => c.url.includes('coverage'));
    const otherCalls = networkCalls.filter(c =>
      !c.url.includes('lead') &&
      !c.url.includes('package') &&
      !c.url.includes('coverage')
    );

    console.log(`\n📝 Lead Creation Calls: ${leadCalls.length}`);
    leadCalls.forEach(call => {
      console.log(`   ${call.method} ${call.url}`);
      console.log(`   Status: ${call.responseStatus || 'pending'}`);
      if (call.responseBody) {
        const preview = typeof call.responseBody === 'object'
          ? JSON.stringify(call.responseBody, null, 2).substring(0, 300)
          : String(call.responseBody).substring(0, 300);
        console.log(`   Response: ${preview}`);
      }
    });

    console.log(`\n📦 Package Calls: ${packageCalls.length}`);
    packageCalls.forEach(call => {
      console.log(`   ${call.method} ${call.url}`);
      console.log(`   Status: ${call.responseStatus || 'pending'}`);
      if (call.responseBody) {
        const preview = typeof call.responseBody === 'object'
          ? JSON.stringify(call.responseBody, null, 2).substring(0, 300)
          : String(call.responseBody).substring(0, 300);
        console.log(`   Response: ${preview}`);
      }
    });

    console.log(`\n🗺️  Coverage Calls: ${coverageCalls.length}`);
    coverageCalls.forEach(call => {
      console.log(`   ${call.method} ${call.url}`);
      console.log(`   Status: ${call.responseStatus || 'pending'}`);
    });

    console.log(`\n🔧 Other API Calls: ${otherCalls.length}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ Test Complete!');
    console.log('='.repeat(80));
    console.log('\nScreenshots saved in .playwright-mcp/ directory');
    console.log('Network calls captured:', networkCalls.length);

    if (browser) {
      console.log('\n🔚 Closing browser...');
      await browser.close();
    }
  }
}

// Run the test
testCircleTelPortal().catch(console.error);
