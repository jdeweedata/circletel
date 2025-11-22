const { chromium } = require('playwright');

async function debugDevToolsPopups() {
  console.log('🚀 Starting DevTools popup investigation...\n');
  console.log('This script will monitor for:');
  console.log('  - New browser windows/tabs opening');
  console.log('  - Popup windows');
  console.log('  - Scripts that call window.open()');
  console.log('  - Service worker behavior');
  console.log('  - Any suspicious redirects\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    args: [
      '--disable-blink-features=AutomationControlled', // Prevent detection
      '--no-first-run',
      '--no-default-browser-check',
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
  });

  // Track all windows/pages created
  const allPages = [];
  let popupCount = 0;

  // Listen for new pages (popups/windows)
  context.on('page', newPage => {
    popupCount++;
    console.log(`\n🪟 NEW WINDOW/POPUP #${popupCount} OPENED!`);
    console.log(`   URL: ${newPage.url()}`);
    console.log(`   Time: ${new Date().toISOString()}`);

    allPages.push({
      page: newPage,
      openedAt: new Date().toISOString(),
      url: newPage.url()
    });

    // Monitor this new page
    newPage.on('load', () => {
      console.log(`   ✅ Window #${popupCount} loaded: ${newPage.url()}`);
    });

    newPage.on('console', msg => {
      console.log(`   📝 Window #${popupCount} console:`, msg.text());
    });

    // Try to get the opener information
    newPage.evaluate(() => {
      if (window.opener) {
        return {
          hasOpener: true,
          openerUrl: window.opener.location.href
        };
      }
      return { hasOpener: false };
    }).then(result => {
      console.log(`   Opener info:`, result);
    }).catch(() => {});
  });

  const page = await context.newPage();
  allPages.push({ page, openedAt: new Date().toISOString(), url: 'initial' });

  // Enhanced console monitoring
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({
      type: msg.type(),
      text,
      timestamp: new Date().toISOString()
    });

    // Flag suspicious messages
    if (text.includes('window.open') || text.includes('popup') || text.includes('devtools')) {
      console.log(`🚨 SUSPICIOUS CONSOLE: [${msg.type()}] ${text}`);
    }
  });

  // Monitor page errors
  page.on('pageerror', error => {
    console.log('💥 Page Error:', error.message);
  });

  // Monitor dialogs (alert/confirm/prompt)
  page.on('dialog', dialog => {
    console.log(`📢 Dialog opened: ${dialog.type()} - ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });

  // Track window.open calls by injecting monitoring code
  await page.addInitScript(() => {
    const originalOpen = window.open;
    window._openCalls = [];

    window.open = function(...args) {
      console.log('🚨 window.open() CALLED WITH:', args);
      window._openCalls.push({
        args,
        stack: new Error().stack,
        timestamp: Date.now()
      });
      return originalOpen.apply(this, args);
    };
  });

  try {
    console.log('\n📍 Step 1: Navigate to login page...');
    await page.goto('https://www.circletel.co.za/admin/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ Login page loaded');
    console.log(`   Current pages open: ${allPages.length}`);

    // Wait a bit to see if any popups appear on login page
    await page.waitForTimeout(2000);

    if (popupCount > 0) {
      console.log(`\n⚠️  ${popupCount} popup(s) opened just from loading login page!`);
    }

    // Check if window.open was called
    const openCalls = await page.evaluate(() => window._openCalls || []);
    if (openCalls.length > 0) {
      console.log('\n🚨 window.open() WAS CALLED:');
      openCalls.forEach((call, i) => {
        console.log(`\n  Call #${i + 1}:`);
        console.log(`    Args:`, call.args);
        console.log(`    Stack:`, call.stack);
      });
    }

    console.log('\n📍 Step 2: Fill login credentials...');
    await page.fill('input[type="email"]', 'devadmin@circletel.co.za');
    await page.fill('input[type="password"]', 'aQp6vK8bBfNVB4C!');

    await page.waitForTimeout(1000);

    console.log('📍 Step 3: Click login button...');
    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();

    console.log('📍 Step 4: Wait for dashboard navigation...');
    await page.waitForURL('**/admin/dashboard', { timeout: 30000 });

    console.log('\n✅ Dashboard page loaded');
    console.log(`   Current pages open: ${allPages.length}`);

    // Wait to observe behavior
    console.log('\n📍 Step 5: Monitoring for 10 seconds...');

    for (let i = 1; i <= 10; i++) {
      await page.waitForTimeout(1000);

      if (popupCount > 0) {
        console.log(`   [${i}s] Popup count: ${popupCount}`);
      }

      // Check for new window.open calls
      const newOpenCalls = await page.evaluate(() => window._openCalls || []);
      if (newOpenCalls.length > openCalls.length) {
        console.log(`\n🚨 NEW window.open() call detected at ${i}s!`);
        const newCalls = newOpenCalls.slice(openCalls.length);
        newCalls.forEach((call, idx) => {
          console.log(`\n  New Call #${idx + 1}:`);
          console.log(`    Args:`, call.args);
          console.log(`    Stack:`, call.stack);
        });
      }
    }

    console.log('\n📍 Step 6: Checking service worker...');
    const swInfo = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.map(reg => ({
          scope: reg.scope,
          state: reg.active?.state,
          scriptURL: reg.active?.scriptURL,
          installing: !!reg.installing,
          waiting: !!reg.waiting
        }));
      }
      return [];
    });

    console.log('Service Workers:', JSON.stringify(swInfo, null, 2));

    console.log('\n📍 Step 7: Checking for suspicious scripts...');

    // Check all inline scripts
    const inlineScripts = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script:not([src])'));
      return scripts.map(script => ({
        content: script.textContent.substring(0, 500),
        hasDebugger: script.textContent.includes('debugger'),
        hasWindowOpen: script.textContent.includes('window.open'),
        hasEval: script.textContent.includes('eval('),
      })).filter(s => s.hasDebugger || s.hasWindowOpen || s.hasEval);
    });

    if (inlineScripts.length > 0) {
      console.log('\n🚨 SUSPICIOUS INLINE SCRIPTS FOUND:');
      inlineScripts.forEach((script, i) => {
        console.log(`\n  Script #${i + 1}:`);
        console.log(`    Has debugger: ${script.hasDebugger}`);
        console.log(`    Has window.open: ${script.hasWindowOpen}`);
        console.log(`    Has eval: ${script.hasEval}`);
        console.log(`    Content preview: ${script.content.substring(0, 200)}...`);
      });
    } else {
      console.log('✅ No suspicious inline scripts found');
    }

    // Check for iframe injections
    const iframes = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('iframe')).map(iframe => ({
        src: iframe.src,
        id: iframe.id,
        className: iframe.className
      }));
    });

    if (iframes.length > 0) {
      console.log('\n📦 Iframes found:', JSON.stringify(iframes, null, 2));
    }

    // Final summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 INVESTIGATION SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total pages/windows opened: ${allPages.length}`);
    console.log(`Popup windows detected: ${popupCount}`);
    console.log(`window.open() calls: ${(await page.evaluate(() => window._openCalls?.length || 0))}`);
    console.log(`Service workers: ${swInfo.length}`);
    console.log(`Suspicious scripts: ${inlineScripts.length}`);
    console.log(`Iframes: ${iframes.length}`);

    if (popupCount > 0) {
      console.log('\n🚨 POPUPS DETECTED!');
      console.log('Details:');
      allPages.slice(1).forEach((pageInfo, i) => {
        console.log(`  Popup #${i + 1}:`);
        console.log(`    Opened at: ${pageInfo.openedAt}`);
        console.log(`    URL: ${pageInfo.url}`);
      });
    } else {
      console.log('\n✅ No popups detected - issue is specific to your Chrome profile');
      console.log('\nRecommended actions:');
      console.log('  1. Check Chrome extensions (chrome://extensions)');
      console.log('  2. Check Chrome DevTools settings');
      console.log('  3. Try creating a new Chrome profile');
      console.log('  4. Check for "Auto-open DevTools" settings');
    }

    // Save report
    const fs = require('fs');
    const report = {
      timestamp: new Date().toISOString(),
      totalPages: allPages.length,
      popupCount,
      windowOpenCalls: await page.evaluate(() => window._openCalls || []),
      serviceWorkers: swInfo,
      suspiciousScripts: inlineScripts,
      iframes,
      consoleMessages: consoleMessages.slice(-20) // Last 20 messages
    };

    fs.writeFileSync('screenshots/devtools-popup-report.json', JSON.stringify(report, null, 2));
    console.log('\n✅ Report saved to: screenshots/devtools-popup-report.json');

    console.log('\n🔍 Browser will stay open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n💥 ERROR:', error.message);
    console.error(error.stack);
  } finally {
    console.log('\n👋 Closing browser...');
    await browser.close();
  }
}

debugDevToolsPopups().catch(console.error);
