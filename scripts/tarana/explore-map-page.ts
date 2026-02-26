/**
 * Tarana Portal Map Page Explorer
 * Navigates to map page after login and explores features
 */
import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const TARANA_URL = 'https://portal.tcs.taranawireless.com/operator-portal/operator/map';
const LOGIN_URL = 'https://portal.tcs.taranawireless.com/operator-portal/login';
const USERNAME = 'mmathabo.setoaba@circletel.co.za';
const PASSWORD = 'rLa!46Tnk3#m84R';

const screenshotDir = '/home/circletel/scripts/tarana/screenshots';

interface ApiCall {
  url: string;
  method: string;
  status?: number;
  requestBody?: string;
  responseBody?: string;
}

async function exploreMapPage(): Promise<void> {
  let browser: Browser | null = null;
  let page: Page | null = null;
  const apiCalls: ApiCall[] = [];

  try {
    console.log('Launching browser...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    page = await context.newPage();

    // Capture API calls
    page.on('request', async (request) => {
      const url = request.url();
      if (url.includes('/api/')) {
        const apiCall: ApiCall = {
          url,
          method: request.method(),
        };
        try {
          const postData = request.postData();
          if (postData) {
            apiCall.requestBody = postData.substring(0, 500);
          }
        } catch (e) {}
        apiCalls.push(apiCall);
      }
    });

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/')) {
        const existingCall = apiCalls.find(c => c.url === url && !c.status);
        if (existingCall) {
          existingCall.status = response.status();
          try {
            const body = await response.text();
            existingCall.responseBody = body.substring(0, 1000);
          } catch (e) {}
        }
      }
    });

    // Step 1: Navigate to login page
    console.log('Navigating to login page...');
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle', timeout: 60000 });

    // Step 2: Login
    console.log('Logging in...');
    await page.fill('input[name="username"]', USERNAME);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    console.log('Login successful, on dashboard');

    // Step 3: Navigate to map page
    console.log('Navigating to map page...');

    // Look for map link in sidebar
    const navItems = await page.$$('nav a, [class*="nav"] a, [class*="sidebar"] a, [class*="menu"] a');
    console.log(`Found ${navItems.length} navigation items`);

    for (const item of navItems) {
      const href = await item.getAttribute('href');
      const text = await item.textContent();
      console.log(`Nav item: "${text?.trim()}" -> ${href}`);
    }

    // Try to find and click the map link
    const mapLink = await page.$('a[href*="map"], [class*="map"] a, button:has-text("Map")');
    if (mapLink) {
      console.log('Found map link, clicking...');
      await mapLink.click();
      await page.waitForTimeout(5000);
    } else {
      // Navigate directly
      console.log('Navigating directly to map URL...');
      await page.goto(TARANA_URL, { waitUntil: 'networkidle', timeout: 60000 });
    }

    await page.waitForTimeout(5000); // Let map fully load
    await page.screenshot({ path: path.join(screenshotDir, '05-map-page-full.png'), fullPage: true });
    console.log('Screenshot saved: 05-map-page-full.png');

    // Step 4: Explore the map page structure
    console.log('\n=== EXPLORING MAP PAGE STRUCTURE ===\n');

    // Get page title and URL
    console.log(`Current URL: ${page.url()}`);
    console.log(`Page Title: ${await page.title()}`);

    // Find all buttons
    const buttons = await page.$$('button');
    console.log(`\n--- Buttons (${buttons.length}) ---`);
    for (let i = 0; i < Math.min(buttons.length, 20); i++) {
      const btn = buttons[i];
      const text = await btn.textContent();
      const ariaLabel = await btn.getAttribute('aria-label');
      const title = await btn.getAttribute('title');
      const className = await btn.getAttribute('class');
      if (text?.trim() || ariaLabel || title) {
        console.log(`Button ${i + 1}: "${text?.trim() || ariaLabel || title}" (class: ${className?.substring(0, 50)})`);
      }
    }

    // Find navigation/sidebar items
    const sidebarItems = await page.$$('[class*="sidebar"] *, [class*="nav"] li, [class*="menu"] li');
    console.log(`\n--- Sidebar/Navigation Items (${sidebarItems.length}) ---`);

    // Find dropdowns/selects
    const selects = await page.$$('select, [class*="dropdown"], [class*="select"]');
    console.log(`\n--- Dropdowns/Selects (${selects.length}) ---`);
    for (let i = 0; i < Math.min(selects.length, 10); i++) {
      const sel = selects[i];
      const id = await sel.getAttribute('id');
      const name = await sel.getAttribute('name');
      const ariaLabel = await sel.getAttribute('aria-label');
      console.log(`Select ${i + 1}: id=${id}, name=${name}, aria-label=${ariaLabel}`);
    }

    // Find filter controls
    const filterElements = await page.$$('[class*="filter"], [class*="Filter"]');
    console.log(`\n--- Filter Elements (${filterElements.length}) ---`);

    // Find map-related elements
    const mapElements = await page.$$('[class*="map"], [id*="map"], .leaflet-container, .mapboxgl-map, canvas');
    console.log(`\n--- Map Elements (${mapElements.length}) ---`);
    for (let i = 0; i < mapElements.length; i++) {
      const el = mapElements[i];
      const tagName = await el.evaluate(e => e.tagName);
      const id = await el.getAttribute('id');
      const className = await el.getAttribute('class');
      console.log(`Map element ${i + 1}: <${tagName}> id=${id} class=${className?.substring(0, 80)}`);
    }

    // Find any tables
    const tables = await page.$$('table, [class*="table"], [class*="grid"]');
    console.log(`\n--- Tables/Grids (${tables.length}) ---`);

    // Find icons (might indicate features)
    const icons = await page.$$('[class*="icon"], svg, i[class*="fa-"]');
    console.log(`\n--- Icons found: ${icons.length} ---`);

    // Step 5: Get all visible text for context
    console.log('\n=== PAGE TEXT CONTENT (Key Elements) ===\n');

    // Get headings
    const headings = await page.$$('h1, h2, h3, h4, h5, h6');
    console.log('--- Headings ---');
    for (const h of headings) {
      const text = await h.textContent();
      if (text?.trim()) {
        console.log(`  ${text.trim()}`);
      }
    }

    // Get labels
    const labels = await page.$$('label, [class*="label"]');
    console.log('\n--- Labels ---');
    for (let i = 0; i < Math.min(labels.length, 20); i++) {
      const text = await labels[i].textContent();
      if (text?.trim() && text.trim().length < 50) {
        console.log(`  ${text.trim()}`);
      }
    }

    // Step 6: Check for specific Tarana features
    console.log('\n=== TARANA-SPECIFIC FEATURES ===\n');

    // Check for BN (Base Node) elements
    const bnElements = await page.$$('[class*="BN"], [class*="base"], [data-type*="BN"]');
    console.log(`Base Node (BN) elements: ${bnElements.length}`);

    // Check for RN (Remote Node) elements
    const rnElements = await page.$$('[class*="RN"], [class*="remote"], [data-type*="RN"]');
    console.log(`Remote Node (RN) elements: ${rnElements.length}`);

    // Check for link/connection elements
    const linkElements = await page.$$('[class*="link"], [class*="connection"]');
    console.log(`Link/Connection elements: ${linkElements.length}`);

    // Check for alarm/alert elements
    const alarmElements = await page.$$('[class*="alarm"], [class*="alert"], [class*="warning"]');
    console.log(`Alarm/Alert elements: ${alarmElements.length}`);

    // Step 7: Try clicking on sidebar items to explore navigation
    console.log('\n=== EXPLORING SIDEBAR NAVIGATION ===\n');

    // Find all clickable sidebar items
    const sidebarLinks = await page.$$('[class*="sidebar"] a, [class*="sidebar"] button, nav a, nav button');
    const menuTexts: string[] = [];

    for (const link of sidebarLinks) {
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      const ariaLabel = await link.getAttribute('aria-label');
      const title = await link.getAttribute('title');
      const displayText = text?.trim() || ariaLabel || title || 'Unknown';
      if (displayText && displayText !== 'Unknown' && !menuTexts.includes(displayText)) {
        menuTexts.push(displayText);
        console.log(`Menu item: "${displayText}" -> ${href || 'no href'}`);
      }
    }

    // Step 8: Try to find coverage/planning tools
    console.log('\n=== LOOKING FOR COVERAGE/PLANNING TOOLS ===\n');

    const toolElements = await page.$$('[class*="tool"], [class*="Tool"]');
    console.log(`Tool elements: ${toolElements.length}`);

    const planningElements = await page.$$('[class*="plan"], [class*="Plan"], [class*="coverage"], [class*="Coverage"]');
    console.log(`Planning/Coverage elements: ${planningElements.length}`);

    // Step 9: Document the API calls made
    console.log('\n=== API CALLS CAPTURED ===\n');

    // Filter unique API calls
    const uniqueApis = new Map<string, ApiCall>();
    for (const call of apiCalls) {
      const key = `${call.method} ${call.url.split('?')[0]}`;
      if (!uniqueApis.has(key)) {
        uniqueApis.set(key, call);
      }
    }

    for (const [key, call] of uniqueApis) {
      console.log(`\n${call.method} ${call.url}`);
      console.log(`  Status: ${call.status || 'pending'}`);
      if (call.requestBody) {
        console.log(`  Request: ${call.requestBody.substring(0, 200)}...`);
      }
      if (call.responseBody) {
        try {
          const parsed = JSON.parse(call.responseBody);
          console.log(`  Response keys: ${Object.keys(parsed).join(', ')}`);
        } catch {
          console.log(`  Response: ${call.responseBody.substring(0, 200)}...`);
        }
      }
    }

    // Step 10: Take screenshots of different areas
    console.log('\n=== TAKING ADDITIONAL SCREENSHOTS ===\n');

    // Try to expand any collapsed panels
    const expandButtons = await page.$$('[class*="expand"], [class*="collapse"], [aria-expanded]');
    for (let i = 0; i < Math.min(expandButtons.length, 3); i++) {
      try {
        await expandButtons[i].click();
        await page.waitForTimeout(1000);
      } catch (e) {}
    }

    await page.screenshot({ path: path.join(screenshotDir, '06-map-expanded.png'), fullPage: true });
    console.log('Screenshot saved: 06-map-expanded.png');

    // Save API documentation
    const apiDocPath = '/home/circletel/scripts/tarana/api-documentation.json';
    const apiDoc = {
      timestamp: new Date().toISOString(),
      baseUrl: 'https://portal.tcs.taranawireless.com',
      endpoints: Array.from(uniqueApis.values()).map(call => ({
        method: call.method,
        path: call.url.replace('https://portal.tcs.taranawireless.com', ''),
        status: call.status,
        sampleRequest: call.requestBody,
        sampleResponse: call.responseBody
      }))
    };

    fs.writeFileSync(apiDocPath, JSON.stringify(apiDoc, null, 2));
    console.log(`\nAPI documentation saved to: ${apiDocPath}`);

  } catch (error) {
    console.error('Error:', error);
    if (page) {
      await page.screenshot({ path: path.join(screenshotDir, 'error-map.png'), fullPage: true });
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

exploreMapPage();
