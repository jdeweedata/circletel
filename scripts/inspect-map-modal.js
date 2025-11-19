const { chromium } = require('@playwright/test');

(async () => {
  console.log('🚀 Starting map modal inspection...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text });
    if (type === 'error') {
      console.log(`❌ Console Error: ${text}`);
    }
  });

  try {
    console.log('1. Navigating to quote request page...');
    await page.goto('http://localhost:3000/quotes/request', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    console.log('✓ Page loaded\n');
    await page.screenshot({ path: 'screenshots/01-page-loaded.png', fullPage: true });

    console.log('2. Filling address field...');
    const addressInput = await page.locator('input[placeholder*="street address"]').first();
    await addressInput.fill('123 Fake Street, Johannesburg');
    await page.waitForTimeout(1000);
    console.log('✓ Address filled\n');

    console.log('3. Looking for "Check Coverage" button...');
    const checkButton = page.locator('button').filter({ hasText: /Check Coverage|check coverage/i });
    const checkButtonExists = await checkButton.count() > 0;

    if (checkButtonExists) {
      console.log('✓ Found Check Coverage button, clicking...');
      await checkButton.first().click();
      await page.waitForTimeout(5000); // Wait for API call
      console.log('✓ Coverage check completed\n');
      await page.screenshot({ path: 'screenshots/02-after-coverage-check.png', fullPage: true });
    } else {
      console.log('⚠️  Check Coverage button not found, skipping...\n');
    }

    console.log('4. Looking for map modal trigger...');
    // Try multiple selectors
    const mapTriggers = [
      page.locator('button').filter({ hasText: /Select Location on Map/i }),
      page.locator('button').filter({ hasText: /interactive map/i }),
      page.locator('button').filter({ hasText: /Select on map/i }),
      page.locator('button:has(svg + text)').filter({ hasText: /map/i })
    ];

    let mapTrigger = null;
    for (const trigger of mapTriggers) {
      const count = await trigger.count();
      if (count > 0) {
        mapTrigger = trigger.first();
        break;
      }
    }

    if (mapTrigger) {
      console.log('✓ Found map trigger button, clicking...');
      await mapTrigger.click();
      await page.waitForTimeout(3000); // Wait for modal to open
      console.log('✓ Map modal should be open\n');

      await page.screenshot({ path: 'screenshots/03-map-modal-desktop.png', fullPage: true });

      console.log('5. Inspecting modal UI elements...\n');

      // Check modal visibility
      const modalDialog = page.locator('[role="dialog"]');
      const modalVisible = await modalDialog.isVisible().catch(() => false);
      console.log(`  Modal dialog visible: ${modalVisible ? '✓' : '✗'}`);

      if (modalVisible) {
        // Check map container
        const mapDiv = page.locator('.GoogleMap, div[style*="width"], div[style*="height"]').first();
        const mapExists = await mapDiv.count() > 0;
        console.log(`  Map container exists: ${mapExists ? '✓' : '✗'}`);

        // Check for iframe (Google Maps loads in iframe)
        const iframe = page.locator('iframe[src*="google.com"]');
        const iframeCount = await iframe.count();
        console.log(`  Google Maps iframes: ${iframeCount}`);

        // Check address input in modal
        const modalInput = modalDialog.locator('input[placeholder*="address"]');
        const inputVisible = await modalInput.isVisible().catch(() => false);
        console.log(`  Address input in modal: ${inputVisible ? '✓' : '✗'}`);

        // Check buttons
        const confirmButton = modalDialog.locator('button').filter({ hasText: /Confirm|Search/i });
        const confirmCount = await confirmButton.count();
        console.log(`  Confirm/Search buttons: ${confirmCount}`);

        const cancelButton = modalDialog.locator('button').filter({ hasText: /Cancel|Close/i });
        const cancelCount = await cancelButton.count();
        console.log(`  Cancel/Close buttons: ${cancelCount}`);

        // Check for map toggle
        const mapToggle = modalDialog.locator('button').filter({ hasText: /Map|Satellite/i });
        const toggleCount = await mapToggle.count();
        console.log(`  Map/Satellite toggle: ${toggleCount} buttons`);

        // Check layout on different sizes
        console.log('\n6. Testing responsive layouts...\n');

        console.log('  Desktop (1920px):');
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/04-desktop-1920.png', fullPage: true });

        // Check if two-column layout on desktop
        const modalContent = await modalDialog.boundingBox();
        if (modalContent) {
          console.log(`    Modal width: ${modalContent.width}px`);
          console.log(`    Modal height: ${modalContent.height}px`);
        }

        console.log('\n  Tablet (768px):');
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/05-tablet-768.png', fullPage: true });

        console.log('\n  Mobile (375px):');
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/06-mobile-375.png', fullPage: true });

        // Reset viewport
        await page.setViewportSize({ width: 1920, height: 1080 });
      } else {
        console.log('\n❌ Modal not visible after clicking trigger!');
      }

    } else {
      console.log('❌ Could not find map trigger button\n');
      await page.screenshot({ path: 'screenshots/03-no-map-trigger.png', fullPage: true });

      // Log all buttons for debugging
      console.log('\n📋 All buttons on page:');
      const allButtons = await page.locator('button').all();
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const text = await allButtons[i].textContent().catch(() => 'N/A');
        console.log(`  ${i + 1}. "${text.trim()}"`);
      }
    }

    // Summary
    console.log('\n\n📊 SUMMARY\n');
    console.log(`Total console messages: ${consoleMessages.length}`);
    const errors = consoleMessages.filter(m => m.type === 'error');
    const warnings = consoleMessages.filter(m => m.type === 'warning');
    console.log(`  Errors: ${errors.length}`);
    console.log(`  Warnings: ${warnings.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Console Errors:');
      errors.slice(0, 5).forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.text.substring(0, 100)}`);
      });
    }

    console.log('\n✅ Test complete! Screenshots saved to screenshots/');
    console.log('\nPress Ctrl+C to close browser, or it will close in 10 seconds...');

    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'screenshots/error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n👋 Browser closed');
  }
})();
