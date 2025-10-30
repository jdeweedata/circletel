/**
 * Test Admin Login with Playwright
 * Captures network calls, cookies, and console messages
 */

const { chromium } = require('playwright');

async function testAdminLogin() {
  console.log('🎭 Starting Playwright Admin Login Test...\n');

  const browser = await chromium.launch({
    headless: false, // Show browser so we can see what's happening
    slowMo: 500 // Slow down so we can observe
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
    });
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
  });

  // Capture network requests
  const networkRequests = [];
  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
    });
    if (request.url().includes('/api/admin/login')) {
      console.log(`\n[Network] → POST ${request.url()}`);
    }
  });

  // Capture network responses
  page.on('response', async response => {
    if (response.url().includes('/api/admin/login')) {
      console.log(`[Network] ← ${response.status()} ${response.url()}`);
      console.log(`[Network] Response headers:`, response.headers());
      try {
        const body = await response.json();
        console.log(`[Network] Response body:`, JSON.stringify(body, null, 2));
      } catch (e) {
        // Not JSON
      }
    }
  });

  try {
    console.log('📍 Step 1: Navigate to login page...\n');
    await page.goto('http://localhost:3002/admin/login');
    await page.waitForLoadState('networkidle');

    console.log('📍 Step 2: Check cookies before login...\n');
    const cookiesBefore = await context.cookies();
    console.log(`[Cookies Before] Count: ${cookiesBefore.length}`);
    cookiesBefore.forEach(cookie => {
      console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 50)}...`);
    });

    console.log('\n📍 Step 3: Fill in login form...\n');
    await page.fill('input[type="email"]', 'admin@circletel.co.za');
    await page.fill('input[type="password"]', 'admin123');

    console.log('📍 Step 4: Click Sign in button...\n');

    // Wait for the response before clicking
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/admin/login'),
      { timeout: 10000 }
    );

    await page.click('button[type="submit"]');

    // Wait for the API response
    const loginResponse = await responsePromise;
    console.log(`\n[Login Response] Status: ${loginResponse.status()}`);

    // Wait a bit for cookies to be set
    await page.waitForTimeout(1000);

    console.log('\n📍 Step 5: Check cookies after login...\n');
    const cookiesAfter = await context.cookies();
    console.log(`[Cookies After] Count: ${cookiesAfter.length}`);
    cookiesAfter.forEach(cookie => {
      console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 50)}...`);
      console.log(`    Path: ${cookie.path}, HttpOnly: ${cookie.httpOnly}, Secure: ${cookie.secure}`);
    });

    // Compare cookies
    const newCookies = cookiesAfter.filter(after =>
      !cookiesBefore.some(before => before.name === after.name)
    );
    console.log(`\n[Cookies] New cookies set: ${newCookies.length}`);
    newCookies.forEach(cookie => {
      console.log(`  ✅ ${cookie.name}`);
    });

    console.log('\n📍 Step 6: Wait for redirect...\n');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log(`[Current URL] ${currentUrl}`);

    if (currentUrl.includes('/admin/login')) {
      console.log('\n❌ FAILED: Still on login page!');
      console.log('Expected: Redirect to /admin');
      console.log('Actual: Stayed on /admin/login');
    } else if (currentUrl.includes('/admin')) {
      console.log('\n✅ SUCCESS: Redirected to admin dashboard!');
    } else {
      console.log(`\n⚠️  UNEXPECTED: Redirected to ${currentUrl}`);
    }

    console.log('\n📍 Step 7: Capture final state...\n');

    // Check for toast messages
    const toasts = await page.locator('[role="status"]').count();
    console.log(`[Toasts] Found ${toasts} toast notifications`);

    // Check for any error messages
    const errors = await page.locator('.text-red-600, .text-red-500').count();
    console.log(`[Errors] Found ${errors} error messages on page`);

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Console Messages: ${consoleMessages.length}`);
    console.log(`Network Requests: ${networkRequests.length}`);
    console.log(`Cookies Before: ${cookiesBefore.length}`);
    console.log(`Cookies After: ${cookiesAfter.length}`);
    console.log(`New Cookies: ${newCookies.length}`);
    console.log(`Final URL: ${currentUrl}`);
    console.log('='.repeat(60));

    // Keep browser open for 5 seconds so you can inspect
    console.log('\n⏳ Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Test complete!');
  }
}

// Run the test
testAdminLogin().catch(console.error);
