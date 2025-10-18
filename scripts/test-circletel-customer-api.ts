/**
 * Test script to discover CircleTel Customer Portal API endpoints
 * Analyzes https://circletel-customer.agilitygis.com/#/ to find actual API patterns
 *
 * Base Domain Discovered: https://integration.agilitygis.com
 */

import { chromium, Browser, Page } from 'playwright';

interface APIRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  response?: {
    status: number;
    body: any;
    headers: Record<string, string>;
  };
}

const capturedRequests: APIRequest[] = [];

async function captureNetworkTraffic(page: Page) {
  // Listen to all requests
  page.on('request', request => {
    const url = request.url();

    // Filter for API calls only
    if (
      url.includes('agilitygis.com') ||
      url.includes('/api/') ||
      url.includes('lead') ||
      url.includes('package') ||
      url.includes('coverage') ||
      url.includes('feasibility')
    ) {
      const headers = request.headers(); // Already returns Record<string, string>

      capturedRequests.push({
        url: request.url(),
        method: request.method(),
        headers,
        body: request.postData() || undefined
      });

      console.log(`\n📤 REQUEST: ${request.method()} ${url}`);
      if (request.postData()) {
        console.log('   Body:', request.postData()?.substring(0, 200));
      }
    }
  });

  // Listen to all responses
  page.on('response', async response => {
    const url = response.url();

    // Filter for API responses only
    if (
      url.includes('agilitygis.com') ||
      url.includes('/api/') ||
      url.includes('lead') ||
      url.includes('package') ||
      url.includes('coverage') ||
      url.includes('feasibility')
    ) {
      try {
        const contentType = response.headers()['content-type'] || '';
        let body: any = null;

        if (contentType.includes('json')) {
          body = await response.json();
        } else if (contentType.includes('text')) {
          body = await response.text();
        }

        // Find matching request
        const matchingRequest = capturedRequests.find(r => r.url === url && !r.response);
        if (matchingRequest) {
          matchingRequest.response = {
            status: response.status(),
            body,
            headers: response.headers()
          };
        }

        console.log(`\n📥 RESPONSE: ${response.status()} ${url}`);
        if (body) {
          console.log('   Body:', JSON.stringify(body).substring(0, 200));
        }
      } catch (error) {
        console.error('Error processing response:', error);
      }
    }
  });
}

async function testCircleTelCustomerPortal() {
  console.log('🚀 Starting CircleTel Customer Portal API Discovery\n');
  console.log('Target: https://circletel-customer.agilitygis.com/#/\n');

  let browser: Browser | null = null;

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: false, // Show browser for debugging
      slowMo: 1000 // Slow down by 1 second for visibility
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    // Set up network traffic capture
    await captureNetworkTraffic(page);

    // Navigate to CircleTel customer portal
    console.log('📍 Navigating to CircleTel customer portal...');
    await page.goto('https://circletel-customer.agilitygis.com/#/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ Page loaded');

    // Wait for the page to fully render
    await page.waitForTimeout(3000);

    // Take screenshot of initial state
    await page.screenshot({ path: '.playwright-mcp/circletel-customer-initial.png', fullPage: true });
    console.log('📸 Screenshot saved: circletel-customer-initial.png');

    // Try to find and interact with address input
    console.log('\n🔍 Looking for address input field...');

    const addressSelectors = [
      'input[placeholder*="address" i]',
      'input[placeholder*="location" i]',
      'input[type="text"]',
      'input[name*="address" i]',
      '.address-input',
      '#address',
      '[data-testid*="address"]'
    ];

    let addressInput = null;
    for (const selector of addressSelectors) {
      try {
        addressInput = await page.locator(selector).first();
        if (await addressInput.isVisible({ timeout: 1000 })) {
          console.log(`✅ Found address input: ${selector}`);
          break;
        }
      } catch {
        continue;
      }
    }

    if (addressInput) {
      // Type a test address
      const testAddress = '18 Rasmus Erasmus Boulevard, Heritage Hill, Centurion';
      console.log(`\n⌨️  Typing address: ${testAddress}`);
      await addressInput.fill(testAddress);
      await page.waitForTimeout(2000);

      // Take screenshot after typing
      await page.screenshot({ path: '.playwright-mcp/circletel-customer-address-typed.png', fullPage: true });
      console.log('📸 Screenshot saved: circletel-customer-address-typed.png');

      // Look for submit/check coverage button
      console.log('\n🔍 Looking for submit button...');
      const buttonSelectors = [
        'button:has-text("Check")',
        'button:has-text("Submit")',
        'button:has-text("Coverage")',
        'button:has-text("Search")',
        'button[type="submit"]',
        '.submit-button',
        '.check-coverage-button'
      ];

      let submitButton = null;
      for (const selector of buttonSelectors) {
        try {
          submitButton = await page.locator(selector).first();
          if (await submitButton.isVisible({ timeout: 1000 })) {
            console.log(`✅ Found submit button: ${selector}`);
            break;
          }
        } catch {
          continue;
        }
      }

      if (submitButton) {
        console.log('\n🖱️  Clicking submit button...');
        await submitButton.click();

        // Wait for API calls to complete
        await page.waitForTimeout(5000);

        // Take screenshot of results
        await page.screenshot({ path: '.playwright-mcp/circletel-customer-results.png', fullPage: true });
        console.log('📸 Screenshot saved: circletel-customer-results.png');
      }
    }

    // Additional wait to capture any delayed API calls
    console.log('\n⏳ Waiting for any additional API calls...');
    await page.waitForTimeout(3000);

    // Print all captured requests
    console.log('\n\n' + '='.repeat(80));
    console.log('📋 CAPTURED API REQUESTS SUMMARY');
    console.log('='.repeat(80));

    capturedRequests.forEach((req, index) => {
      console.log(`\n[${index + 1}] ${req.method} ${req.url}`);

      if (req.body) {
        console.log('   Request Body:');
        try {
          const parsed = JSON.parse(req.body);
          console.log('   ', JSON.stringify(parsed, null, 2).split('\n').join('\n    '));
        } catch {
          console.log('   ', req.body.substring(0, 200));
        }
      }

      if (req.response) {
        console.log(`   Response Status: ${req.response.status}`);
        if (req.response.body) {
          console.log('   Response Body:');
          if (typeof req.response.body === 'object') {
            console.log('   ', JSON.stringify(req.response.body, null, 2).split('\n').join('\n    '));
          } else {
            console.log('   ', String(req.response.body).substring(0, 200));
          }
        }
      }
    });

    // Generate integration guide
    console.log('\n\n' + '='.repeat(80));
    console.log('🎯 INTEGRATION GUIDE FOR CIRCLETEL PROJECT');
    console.log('='.repeat(80));

    const uniqueEndpoints = [...new Set(capturedRequests.map(r => {
      const url = new URL(r.url);
      return `${r.method} ${url.origin}${url.pathname}`;
    }))];

    console.log('\n📍 Discovered Endpoints:');
    uniqueEndpoints.forEach(endpoint => {
      console.log(`   - ${endpoint}`);
    });

    const baseUrls = [...new Set(capturedRequests.map(r => new URL(r.url).origin))];
    console.log('\n🌐 Base URLs:');
    baseUrls.forEach(base => {
      console.log(`   - ${base}`);
    });

    console.log('\n✨ Recommended Next Steps:');
    console.log('   1. Update lib/coverage/supersonic/client.ts with correct base URL');
    console.log('   2. Update API endpoints to match discovered patterns');
    console.log('   3. Implement proper authentication based on captured headers');
    console.log('   4. Test with the same request/response patterns');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    if (browser) {
      console.log('\n🔚 Closing browser...');
      await browser.close();
    }
  }

  console.log('\n✅ API Discovery Complete!');
}

// Run the test
testCircleTelCustomerPortal().catch(console.error);
