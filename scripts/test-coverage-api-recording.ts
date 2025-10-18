/**
 * Playwright Test Script: Coverage Feasibility API Recording
 *
 * This script records all API calls, console messages, cookies, and authentication
 * methods used during coverage feasibility checks on:
 * - Supersonic (https://supersonic.co.za/home)
 * - CircleTel Customer Portal (https://circletel-customer.agilitygis.com/#/)
 *
 * Test Addresses:
 * 1. Witkoppen Spruit Park, 23 Granite Rd, Witkoppen, Sandton, 2068
 * 2. 18 Rasmus Erasmus Boulevard, Heritage Hill, Centurion, South Africa
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface NetworkRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  postData?: string;
  timestamp: string;
}

interface NetworkResponse {
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: string;
}

interface ConsoleMessage {
  type: string;
  text: string;
  timestamp: string;
}

interface CookieInfo {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: string;
}

interface TestResult {
  site: string;
  address: string;
  requests: NetworkRequest[];
  responses: NetworkResponse[];
  consoleMessages: ConsoleMessage[];
  cookies: CookieInfo[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  timestamp: string;
}

const TEST_ADDRESSES = [
  {
    name: 'Witkoppen Spruit Park',
    full: 'Witkoppen Spruit Park, 23 Granite Rd, Witkoppen, Sandton, 2068',
    short: '23 Granite Rd, Witkoppen, Sandton, 2068'
  },
  {
    name: 'Heritage Hill',
    full: '18 Rasmus Erasmus Boulevard, Heritage Hill, Centurion, South Africa',
    short: '18 Rasmus Erasmus Boulevard, Heritage Hill, Centurion'
  }
];

const SITES = [
  {
    name: 'Supersonic',
    url: 'https://supersonic.co.za/home',
    shortName: 'supersonic'
  },
  {
    name: 'CircleTel Customer Portal',
    url: 'https://circletel-customer.agilitygis.com/#/',
    shortName: 'circletel-portal'
  }
];

class APIRecorder {
  private requests: NetworkRequest[] = [];
  private responses: NetworkResponse[] = [];
  private consoleMessages: ConsoleMessage[] = [];

  setupListeners(page: Page) {
    // Record all network requests
    page.on('request', request => {
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(request.headers())) {
        headers[key] = value;
      }

      this.requests.push({
        url: request.url(),
        method: request.method(),
        headers,
        postData: request.postData() || undefined,
        timestamp: new Date().toISOString()
      });
    });

    // Record all network responses
    page.on('response', async response => {
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(response.headers())) {
        headers[key] = value;
      }

      let body: any = undefined;
      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('application/json')) {
          body = await response.json();
        } else if (contentType.includes('text/')) {
          body = await response.text();
        }
      } catch (e) {
        // Ignore body parsing errors
      }

      this.responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers,
        body,
        timestamp: new Date().toISOString()
      });
    });

    // Record console messages
    page.on('console', msg => {
      this.consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    });
  }

  getRequests(): NetworkRequest[] {
    return this.requests;
  }

  getResponses(): NetworkResponse[] {
    return this.responses;
  }

  getConsoleMessages(): ConsoleMessage[] {
    return this.consoleMessages;
  }

  reset() {
    this.requests = [];
    this.responses = [];
    this.consoleMessages = [];
  }
}

async function testSupersonicSite(
  browser: Browser,
  address: typeof TEST_ADDRESSES[0]
): Promise<TestResult> {
  console.log(`\n🔍 Testing Supersonic with address: ${address.name}`);

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  const recorder = new APIRecorder();
  recorder.setupListeners(page);

  try {
    // Navigate to Supersonic
    console.log('  📄 Loading Supersonic homepage...');
    try {
      await page.goto('https://supersonic.co.za/home', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
    } catch (e) {
      console.log('  ⚠️  Initial page load timed out, continuing anyway...');
    }

    // Take initial screenshot
    await page.screenshot({
      path: `.playwright-mcp/supersonic-${address.name.toLowerCase().replace(/\s+/g, '-')}-initial.png`,
      fullPage: true
    });

    // Wait for page to be fully loaded
    await page.waitForTimeout(3000);

    // Look for address input field
    console.log('  🔍 Looking for address input field...');
    const addressSelectors = [
      'input[placeholder*="address"]',
      'input[placeholder*="Address"]',
      'input[type="text"][name*="address"]',
      'input[id*="address"]',
      '#address',
      '[data-testid*="address"]',
      'input[placeholder*="Enter your address"]'
    ];

    let addressInput = null;
    for (const selector of addressSelectors) {
      try {
        addressInput = await page.$(selector);
        if (addressInput) {
          console.log(`  ✅ Found address input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!addressInput) {
      console.log('  ⚠️  Could not find address input automatically, trying to find any visible input...');
      const allInputs = await page.$$('input[type="text"]:visible, input:not([type]):visible');
      if (allInputs.length > 0) {
        addressInput = allInputs[0];
        console.log(`  ✅ Using first visible input field`);
      }
    }

    if (addressInput) {
      // Type address
      console.log(`  ⌨️  Typing address: ${address.short}`);
      await addressInput.click();
      await addressInput.fill(address.short);
      await page.waitForTimeout(2000);

      // Take screenshot after typing
      await page.screenshot({
        path: `.playwright-mcp/supersonic-${address.name.toLowerCase().replace(/\s+/g, '-')}-typed.png`,
        fullPage: true
      });

      // Look for suggestions dropdown or submit button
      console.log('  🔍 Looking for submit button or suggestions...');
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Check")',
        'button:has-text("Search")',
        'button:has-text("Find")',
        'button:has-text("Coverage")',
        '[role="button"]:has-text("Check")'
      ];

      let submitButton = null;
      for (const selector of submitSelectors) {
        try {
          submitButton = await page.$(selector);
          if (submitButton) {
            console.log(`  ✅ Found submit button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (submitButton) {
        console.log('  🖱️  Clicking submit button...');
        await submitButton.click();
        await page.waitForTimeout(5000);

        // Take screenshot after submission
        await page.screenshot({
          path: `.playwright-mcp/supersonic-${address.name.toLowerCase().replace(/\s+/g, '-')}-results.png`,
          fullPage: true
        });
      } else {
        // Try pressing Enter
        console.log('  ⌨️  Pressing Enter key...');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(5000);

        await page.screenshot({
          path: `.playwright-mcp/supersonic-${address.name.toLowerCase().replace(/\s+/g, '-')}-results.png`,
          fullPage: true
        });
      }
    } else {
      console.log('  ❌ Could not find address input field');
    }

    // Get cookies
    const cookies = await context.cookies();

    // Get localStorage and sessionStorage
    const localStorage = await page.evaluate(() => {
      const items: Record<string, string> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          items[key] = window.localStorage.getItem(key) || '';
        }
      }
      return items;
    });

    const sessionStorage = await page.evaluate(() => {
      const items: Record<string, string> = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key) {
          items[key] = window.sessionStorage.getItem(key) || '';
        }
      }
      return items;
    });

    return {
      site: 'Supersonic',
      address: address.full,
      requests: recorder.getRequests(),
      responses: recorder.getResponses(),
      consoleMessages: recorder.getConsoleMessages(),
      cookies,
      localStorage,
      sessionStorage,
      timestamp: new Date().toISOString()
    };

  } finally {
    await context.close();
  }
}

async function testCircleTelPortal(
  browser: Browser,
  address: typeof TEST_ADDRESSES[0]
): Promise<TestResult> {
  console.log(`\n🔍 Testing CircleTel Customer Portal with address: ${address.name}`);

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  const recorder = new APIRecorder();
  recorder.setupListeners(page);

  try {
    // Navigate to CircleTel Portal
    console.log('  📄 Loading CircleTel Customer Portal...');
    try {
      await page.goto('https://circletel-customer.agilitygis.com/#/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
    } catch (e) {
      console.log('  ⚠️  Initial page load timed out, continuing anyway...');
    }

    // Take initial screenshot
    await page.screenshot({
      path: `.playwright-mcp/circletel-portal-${address.name.toLowerCase().replace(/\s+/g, '-')}-initial.png`,
      fullPage: true
    });

    // Wait for page to be fully loaded (Angular app)
    await page.waitForTimeout(5000);

    // Look for address input field
    console.log('  🔍 Looking for address input field...');
    const addressSelectors = [
      'input[placeholder*="address"]',
      'input[placeholder*="Address"]',
      'input[type="text"][ng-model*="address"]',
      'input[id*="address"]',
      '#address',
      'input[placeholder*="Enter your address"]',
      '.form-control[placeholder*="address"]',
      'input[type="search"]'
    ];

    let addressInput = null;
    for (const selector of addressSelectors) {
      try {
        addressInput = await page.$(selector);
        if (addressInput) {
          console.log(`  ✅ Found address input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!addressInput) {
      console.log('  ⚠️  Could not find address input automatically, trying to find any visible input...');
      const allInputs = await page.$$('input:visible');
      if (allInputs.length > 0) {
        addressInput = allInputs[0];
        console.log(`  ✅ Using first visible input field`);
      }
    }

    if (addressInput) {
      // Type address
      console.log(`  ⌨️  Typing address: ${address.short}`);
      await addressInput.click();
      await addressInput.fill(address.short);
      await page.waitForTimeout(3000);

      // Take screenshot after typing
      await page.screenshot({
        path: `.playwright-mcp/circletel-portal-${address.name.toLowerCase().replace(/\s+/g, '-')}-typed.png`,
        fullPage: true
      });

      // Look for suggestions dropdown or submit button
      console.log('  🔍 Looking for submit button or suggestions...');
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Check")',
        'button:has-text("Search")',
        'button:has-text("Find")',
        'button:has-text("Coverage")',
        'button:has-text("Next")',
        'button.btn-primary',
        'button.btn-success',
        '[ng-click*="check"]',
        '[ng-click*="search"]'
      ];

      let submitButton = null;
      for (const selector of submitSelectors) {
        try {
          submitButton = await page.$(selector);
          if (submitButton) {
            console.log(`  ✅ Found submit button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (submitButton) {
        console.log('  🖱️  Clicking submit button...');
        await submitButton.click();
        await page.waitForTimeout(7000);

        // Take screenshot after submission
        await page.screenshot({
          path: `.playwright-mcp/circletel-portal-${address.name.toLowerCase().replace(/\s+/g, '-')}-results.png`,
          fullPage: true
        });
      } else {
        // Try pressing Enter
        console.log('  ⌨️  Pressing Enter key...');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(7000);

        await page.screenshot({
          path: `.playwright-mcp/circletel-portal-${address.name.toLowerCase().replace(/\s+/g, '-')}-results.png`,
          fullPage: true
        });
      }

      // Wait for additional API calls
      await page.waitForTimeout(5000);
    } else {
      console.log('  ❌ Could not find address input field');
    }

    // Get cookies
    const cookies = await context.cookies();

    // Get localStorage and sessionStorage
    const localStorage = await page.evaluate(() => {
      const items: Record<string, string> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          items[key] = window.localStorage.getItem(key) || '';
        }
      }
      return items;
    });

    const sessionStorage = await page.evaluate(() => {
      const items: Record<string, string> = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key) {
          items[key] = window.sessionStorage.getItem(key) || '';
        }
      }
      return items;
    });

    return {
      site: 'CircleTel Customer Portal',
      address: address.full,
      requests: recorder.getRequests(),
      responses: recorder.getResponses(),
      consoleMessages: recorder.getConsoleMessages(),
      cookies,
      localStorage,
      sessionStorage,
      timestamp: new Date().toISOString()
    };

  } finally {
    await context.close();
  }
}

function analyzeResults(results: TestResult[]): void {
  console.log('\n\n📊 ANALYSIS REPORT\n');
  console.log('='.repeat(80));

  for (const result of results) {
    console.log(`\n🌐 Site: ${result.site}`);
    console.log(`📍 Address: ${result.address}`);
    console.log(`⏰ Timestamp: ${result.timestamp}\n`);

    // API Endpoints Analysis
    console.log(`📡 API Endpoints Called (${result.responses.length} total):`);
    const apiCalls = result.responses.filter(r =>
      r.url.includes('/api/') ||
      r.url.includes('agilitygis.com') ||
      r.url.includes('supersonic.co.za') ||
      r.headers['content-type']?.includes('application/json')
    );

    apiCalls.forEach((response, index) => {
      const request = result.requests.find(req => req.url === response.url);
      console.log(`  ${index + 1}. ${request?.method || 'GET'} ${response.url}`);
      console.log(`     Status: ${response.status} ${response.statusText}`);

      if (request?.postData) {
        console.log(`     POST Data: ${request.postData.substring(0, 200)}${request.postData.length > 200 ? '...' : ''}`);
      }

      if (response.body) {
        const bodyPreview = typeof response.body === 'string'
          ? response.body.substring(0, 200)
          : JSON.stringify(response.body).substring(0, 200);
        console.log(`     Response: ${bodyPreview}${bodyPreview.length >= 200 ? '...' : ''}`);
      }
      console.log('');
    });

    // Authentication Analysis
    console.log(`🔐 Authentication Methods:`);
    const authHeaders = result.requests.filter(r =>
      r.headers['authorization'] ||
      r.headers['x-api-key'] ||
      r.headers['x-auth-token']
    );

    if (authHeaders.length > 0) {
      authHeaders.forEach(req => {
        console.log(`  - ${req.url}`);
        if (req.headers['authorization']) {
          console.log(`    Authorization: ${req.headers['authorization'].substring(0, 50)}...`);
        }
        if (req.headers['x-api-key']) {
          console.log(`    X-API-Key: ${req.headers['x-api-key']}`);
        }
      });
    } else {
      console.log('  ❌ No explicit authentication headers found');
    }
    console.log('');

    // Cookies Analysis
    console.log(`🍪 Cookies (${result.cookies.length} total):`);
    result.cookies.forEach(cookie => {
      console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 50)}${cookie.value.length > 50 ? '...' : ''}`);
      console.log(`    Domain: ${cookie.domain}, Path: ${cookie.path}`);
      console.log(`    Secure: ${cookie.secure}, HttpOnly: ${cookie.httpOnly}, SameSite: ${cookie.sameSite || 'none'}`);
    });
    console.log('');

    // LocalStorage Analysis
    console.log(`💾 LocalStorage (${Object.keys(result.localStorage).length} items):`);
    Object.entries(result.localStorage).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
    });
    console.log('');

    // SessionStorage Analysis
    console.log(`💾 SessionStorage (${Object.keys(result.sessionStorage).length} items):`);
    Object.entries(result.sessionStorage).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
    });
    console.log('');

    // WMS Analysis
    console.log(`🗺️  WMS/GIS Requests:`);
    const wmsRequests = result.requests.filter(r =>
      r.url.toLowerCase().includes('wms') ||
      r.url.toLowerCase().includes('gis') ||
      r.url.toLowerCase().includes('map') ||
      r.url.toLowerCase().includes('tile')
    );

    if (wmsRequests.length > 0) {
      wmsRequests.forEach(req => {
        console.log(`  - ${req.method} ${req.url}`);
      });
    } else {
      console.log('  ❌ No WMS/GIS requests detected');
    }
    console.log('');

    // Console Messages
    console.log(`📝 Console Messages (${result.consoleMessages.length} total):`);
    result.consoleMessages.slice(0, 10).forEach(msg => {
      console.log(`  [${msg.type}] ${msg.text}`);
    });
    if (result.consoleMessages.length > 10) {
      console.log(`  ... and ${result.consoleMessages.length - 10} more messages`);
    }
    console.log('');

    console.log('='.repeat(80));
  }
}

async function main() {
  console.log('🚀 Starting Coverage Feasibility API Recording\n');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`🏠 Test Addresses: ${TEST_ADDRESSES.length}`);
  console.log(`🌐 Sites: ${SITES.length}\n`);

  const browser = await chromium.launch({
    headless: false, // Set to true for headless mode
    slowMo: 100 // Slow down actions for better observation
  });

  const allResults: TestResult[] = [];

  try {
    // Test each site with each address
    for (const address of TEST_ADDRESSES) {
      // Test Supersonic
      const supersonicResult = await testSupersonicSite(browser, address);
      allResults.push(supersonicResult);

      // Test CircleTel Portal
      const circletelResult = await testCircleTelPortal(browser, address);
      allResults.push(circletelResult);
    }

    // Save results to JSON file
    const outputDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(outputDir, `coverage-api-recording-${timestamp}.json`);

    fs.writeFileSync(outputFile, JSON.stringify(allResults, null, 2));
    console.log(`\n✅ Results saved to: ${outputFile}`);

    // Analyze results
    analyzeResults(allResults);

  } finally {
    await browser.close();
    console.log('\n✅ Test completed successfully!');
  }
}

main().catch(error => {
  console.error('❌ Error running tests:', error);
  process.exit(1);
});
