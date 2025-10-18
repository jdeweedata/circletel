/**
 * Simplified CircleTel Customer Portal API Discovery
 * Focus on lead creation and package fetching
 */

import { chromium } from 'playwright';

interface CapturedAPI {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  response?: {
    status: number;
    body: any;
  };
}

async function testCircleTelAPI() {
  console.log('🚀 CircleTel Customer Portal API Discovery\n');

  const captured: CapturedAPI[] = [];
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture API calls
  page.on('request', req => {
    const url = req.url();
    if (url.includes('agilitygis.com') && (
      url.includes('/api/') ||
      url.includes('lead') ||
      url.includes('package') ||
      url.includes('coverage')
    )) {
      console.log(`📤 ${req.method()} ${url}`);
      captured.push({
        url,
        method: req.method(),
        headers: req.headers(),
        body: req.postData()
      });
    }
  });

  page.on('response', async res => {
    const url = res.url();
    if (url.includes('agilitygis.com') && (
      url.includes('/api/') ||
      url.includes('lead') ||
      url.includes('package') ||
      url.includes('coverage')
    )) {
      const item = captured.find(c => c.url === url && !c.response);
      if (item) {
        try {
          const contentType = res.headers()['content-type'] || '';
          const body = contentType.includes('json') ? await res.json() : await res.text();
          item.response = {
            status: res.status(),
            body
          };
          console.log(`📥 ${res.status()} ${url}`);
          if (contentType.includes('json')) {
            console.log('   ', JSON.stringify(body).substring(0, 150));
          }
        } catch (e) {
          console.error('Error parsing response:', e);
        }
      }
    }
  });

  try {
    console.log('📍 Navigating to portal...');
    await page.goto('https://circletel-customer.agilitygis.com/#/', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    // Wait for initial load
    await page.waitForTimeout(5000);

    console.log('\n✅ Page loaded. Capturing screenshots...');
    await page.screenshot({ path: '.playwright-mcp/circletel-portal-home.png', fullPage: true });

    // Try to find address input
    console.log('\n🔍 Looking for address input...');
    const addressInput = page.locator('input[type="text"]').first();

    if (await addressInput.isVisible({ timeout: 2000 })) {
      console.log('✅ Found input field');

      const testAddress = '18 Rasmus Erasmus, Centurion';
      console.log(`⌨️  Typing: ${testAddress}`);

      await addressInput.click();
      await addressInput.fill(testAddress);
      await page.waitForTimeout(2000);

      await page.screenshot({ path: '.playwright-mcp/circletel-portal-typed.png', fullPage: true });

      // Look for button
      const button = page.locator('button').filter({ hasText: /check|submit|search/i }).first();
      if (await button.isVisible({ timeout: 2000 })) {
        console.log('🖱️  Clicking submit button...');
        await button.click();
        await page.waitForTimeout(5000);

        await page.screenshot({ path: '.playwright-mcp/circletel-portal-results.png', fullPage: true });
      }
    }

    // Wait for any remaining API calls
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('❌ Error:', error);
  }

  await browser.close();

  // Print captured API calls
  console.log('\n' + '='.repeat(80));
  console.log('📋 CAPTURED API CALLS');
  console.log('='.repeat(80));

  const apiDomains = new Set<string>();
  const leadEndpoints = captured.filter(c => c.url.includes('lead'));
  const packageEndpoints = captured.filter(c => c.url.includes('package'));
  const coverageEndpoints = captured.filter(c => c.url.includes('coverage'));

  captured.forEach((call, i) => {
    const urlObj = new URL(call.url);
    apiDomains.add(urlObj.origin);

    console.log(`\n[${i + 1}] ${call.method} ${call.url}`);

    if (call.body) {
      console.log('    Request Body:', call.body.substring(0, 200));
    }

    if (call.response) {
      console.log(`    Response: ${call.response.status}`);
      if (call.response.body && typeof call.response.body === 'object') {
        console.log('    ', JSON.stringify(call.response.body, null, 2).substring(0, 300));
      }
    }
  });

  console.log('\n\n' + '='.repeat(80));
  console.log('🎯 INTEGRATION SUMMARY');
  console.log('='.repeat(80));

  console.log('\n📍 API Base Domains:');
  apiDomains.forEach(domain => console.log(`   - ${domain}`));

  console.log('\n📝 Lead Creation Endpoints:');
  if (leadEndpoints.length > 0) {
    leadEndpoints.forEach(e => console.log(`   - ${e.method} ${e.url}`));
  } else {
    console.log('   - None found (may need to complete full user flow)');
  }

  console.log('\n📦 Package Endpoints:');
  if (packageEndpoints.length > 0) {
    packageEndpoints.forEach(e => console.log(`   - ${e.method} ${e.url}`));
  } else {
    console.log('   - None found (may need to complete full user flow)');
  }

  console.log('\n🗺️  Coverage Endpoints:');
  coverageEndpoints.forEach(e => console.log(`   - ${e.method} ${e.url}`));

  console.log('\n✅ Discovery complete!');
}

testCircleTelAPI().catch(console.error);
