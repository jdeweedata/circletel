const { chromium } = require('playwright');

async function debugAdminDashboard() {
  console.log('🚀 Starting admin dashboard debug...\n');

  const browser = await chromium.launch({
    headless: false, // Show browser so we can see what's happening
    slowMo: 500 // Slow down actions to see them
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  // Capture console logs
  const consoleLogs = [];
  const errors = [];
  const warnings = [];

  const page = await context.newPage();

  // Listen to console messages
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();

    consoleLogs.push({ type, text, timestamp: new Date().toISOString() });

    if (type === 'error') {
      errors.push(text);
      console.log('❌ Console Error:', text);
    } else if (type === 'warning') {
      warnings.push(text);
      console.log('⚠️  Console Warning:', text);
    } else {
      console.log(`📝 Console [${type}]:`, text);
    }
  });

  // Listen to page errors
  page.on('pageerror', error => {
    console.log('💥 Page Error:', error.message);
    errors.push('Page Error: ' + error.message);
  });

  // Monitor network requests
  const networkRequests = [];
  page.on('request', request => {
    networkRequests.push({
      method: request.method(),
      url: request.url(),
      timestamp: new Date().toISOString()
    });
    console.log(`🌐 Request: ${request.method()} ${request.url()}`);
  });

  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    if (status >= 400) {
      console.log(`❌ Failed Request: ${status} ${url}`);
    }
  });

  try {
    console.log('\n📍 Step 1: Navigate to login page...');
    await page.goto('https://www.circletel.co.za/admin/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ Login page loaded\n');

    // Take screenshot
    await page.screenshot({ path: 'screenshots/01-login-page.png' });

    console.log('📍 Step 2: Fill in login credentials...');
    await page.fill('input[type="email"]', 'devadmin@circletel.co.za');
    await page.fill('input[type="password"]', 'aQp6vK8bBfNVB4C!');

    console.log('📍 Step 3: Click login button...');
    await page.click('button[type="submit"]');

    console.log('📍 Step 4: Wait for navigation to dashboard...');
    await page.waitForURL('**/admin/dashboard', { timeout: 30000 });

    console.log('✅ Dashboard loaded\n');
    await page.screenshot({ path: 'screenshots/02-dashboard-loaded.png' });

    // Wait a bit to see if any delayed scripts trigger
    console.log('📍 Step 5: Waiting 5 seconds to observe behavior...');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'screenshots/03-dashboard-after-5s.png' });

    // Check for any window.open calls or suspicious scripts
    console.log('\n📍 Step 6: Checking for suspicious scripts...');
    const suspiciousScripts = await page.evaluate(() => {
      const scripts = [];

      // Check if window.open has been called
      const originalOpen = window.open;
      let openCalls = 0;
      window.open = function(...args) {
        openCalls++;
        console.log('window.open called with:', args);
        return originalOpen.apply(this, args);
      };

      // Check for debugger statements
      const scriptTags = document.querySelectorAll('script');
      scriptTags.forEach(script => {
        if (script.textContent.includes('debugger')) {
          scripts.push({
            type: 'inline-debugger',
            content: script.textContent.substring(0, 200)
          });
        }
      });

      // Check for suspicious console methods
      const consoleTrace = window.console.trace.toString();

      return {
        scripts,
        openCalls,
        consoleTraceOverridden: !consoleTrace.includes('[native code]')
      };
    });

    console.log('\n🔍 Suspicious Script Check:', JSON.stringify(suspiciousScripts, null, 2));

    // Get all loaded scripts
    const loadedScripts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
    });

    console.log('\n📦 Loaded Scripts:');
    loadedScripts.forEach(src => console.log('  -', src));

    // Check service workers
    const serviceWorkers = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.map(reg => ({
          scope: reg.scope,
          state: reg.active?.state,
          scriptURL: reg.active?.scriptURL
        }));
      }
      return [];
    });

    console.log('\n🔧 Service Workers:', JSON.stringify(serviceWorkers, null, 2));

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 DEBUG SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Console Logs: ${consoleLogs.length}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    console.log(`Network Requests: ${networkRequests.length}`);
    console.log(`Service Workers: ${serviceWorkers.length}`);

    if (errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      errors.forEach(err => console.log('  -', err));
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS FOUND:');
      warnings.forEach(warn => console.log('  -', warn));
    }

    // Save detailed log
    const fs = require('fs');
    const report = {
      timestamp: new Date().toISOString(),
      consoleLogs,
      errors,
      warnings,
      networkRequests: networkRequests.slice(0, 50), // First 50 requests
      serviceWorkers,
      suspiciousScripts,
      loadedScripts
    };

    fs.writeFileSync('screenshots/debug-report.json', JSON.stringify(report, null, 2));
    console.log('\n✅ Detailed report saved to: screenshots/debug-report.json');

    console.log('\n🔍 Press Ctrl+C to close the browser and exit...');
    console.log('   (Browser will stay open for manual inspection)');

    // Keep browser open for manual inspection
    await new Promise(() => {}); // Never resolves

  } catch (error) {
    console.error('\n💥 ERROR:', error.message);
    console.error(error.stack);

    // Take error screenshot
    try {
      await page.screenshot({ path: 'screenshots/error-state.png' });
    } catch (e) {
      // Ignore screenshot errors
    }
  } finally {
    // Don't close automatically - let user inspect
    // await browser.close();
  }
}

// Run the debug
debugAdminDashboard().catch(console.error);
