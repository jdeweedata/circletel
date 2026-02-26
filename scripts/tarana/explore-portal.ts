/**
 * Tarana Portal Explorer
 * Automates login and explores the map interface
 */
import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const TARANA_URL = 'https://portal.tcs.taranawireless.com/operator-portal/operator/map';
const USERNAME = 'mmathabo.setoaba@circletel.co.za';
const PASSWORD = 'rLa!46Tnk3#m84R';

interface NetworkRequest {
  url: string;
  method: string;
  resourceType: string;
  status?: number;
  responseHeaders?: Record<string, string>;
}

interface ExplorationResult {
  loginSuccess: boolean;
  loginDetails: string[];
  pageTitle: string;
  currentUrl: string;
  networkRequests: NetworkRequest[];
  apiEndpoints: string[];
  uiElements: string[];
  consoleMessages: string[];
  errors: string[];
}

async function explorePortal(): Promise<ExplorationResult> {
  const result: ExplorationResult = {
    loginSuccess: false,
    loginDetails: [],
    pageTitle: '',
    currentUrl: '',
    networkRequests: [],
    apiEndpoints: [],
    uiElements: [],
    consoleMessages: [],
    errors: []
  };

  let browser: Browser | null = null;
  let page: Page | null = null;

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

    // Capture console messages
    page.on('console', (msg) => {
      result.consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Capture network requests
    page.on('request', (request) => {
      const url = request.url();
      result.networkRequests.push({
        url,
        method: request.method(),
        resourceType: request.resourceType()
      });

      // Identify API endpoints
      if (url.includes('/api/') || url.includes('/graphql') || url.includes('/rest/')) {
        result.apiEndpoints.push(`${request.method()} ${url}`);
      }
    });

    page.on('response', async (response) => {
      const request = response.request();
      const existingReq = result.networkRequests.find(r => r.url === request.url());
      if (existingReq) {
        existingReq.status = response.status();
      }
    });

    // Navigate to the portal
    console.log('Navigating to Tarana portal...');
    result.loginDetails.push(`Navigating to: ${TARANA_URL}`);

    await page.goto(TARANA_URL, { waitUntil: 'networkidle', timeout: 60000 });
    result.loginDetails.push(`Initial page loaded: ${page.url()}`);

    // Take screenshot of login page
    const screenshotDir = '/home/circletel/scripts/tarana/screenshots';
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    await page.screenshot({ path: path.join(screenshotDir, '01-login-page.png'), fullPage: true });
    result.loginDetails.push('Screenshot saved: 01-login-page.png');

    // Wait for login form to be visible
    console.log('Waiting for login form...');

    // Try to find login form elements
    const possibleUsernameSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[name="username"]',
      'input[name="user"]',
      'input[id*="email"]',
      'input[id*="username"]',
      'input[id*="user"]',
      '#email',
      '#username',
      'input[placeholder*="email" i]',
      'input[placeholder*="user" i]'
    ];

    const possiblePasswordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      '#password'
    ];

    let usernameSelector: string | null = null;
    let passwordSelector: string | null = null;

    // Find username field
    for (const selector of possibleUsernameSelectors) {
      try {
        const element = await page.$(selector);
        if (element && await element.isVisible()) {
          usernameSelector = selector;
          result.loginDetails.push(`Found username field: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue trying
      }
    }

    // Find password field
    for (const selector of possiblePasswordSelectors) {
      try {
        const element = await page.$(selector);
        if (element && await element.isVisible()) {
          passwordSelector = selector;
          result.loginDetails.push(`Found password field: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue trying
      }
    }

    // Get page HTML for debugging
    const pageContent = await page.content();
    const formMatch = pageContent.match(/<form[^>]*>([\s\S]*?)<\/form>/gi);
    if (formMatch) {
      result.loginDetails.push(`Found ${formMatch.length} form(s) on page`);
    }

    // Check for any input fields
    const allInputs = await page.$$('input');
    result.loginDetails.push(`Total input fields found: ${allInputs.length}`);

    for (let i = 0; i < allInputs.length; i++) {
      const input = allInputs[i];
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      const placeholder = await input.getAttribute('placeholder');
      result.loginDetails.push(`Input ${i + 1}: type=${type}, name=${name}, id=${id}, placeholder=${placeholder}`);
    }

    if (usernameSelector && passwordSelector) {
      // Fill in credentials
      console.log('Filling in credentials...');
      result.loginDetails.push('Filling in username...');
      await page.fill(usernameSelector, USERNAME);

      result.loginDetails.push('Filling in password...');
      await page.fill(passwordSelector, PASSWORD);

      await page.screenshot({ path: path.join(screenshotDir, '02-credentials-filled.png'), fullPage: true });
      result.loginDetails.push('Screenshot saved: 02-credentials-filled.png');

      // Find and click submit button
      const possibleSubmitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Login")',
        'button:has-text("Sign in")',
        'button:has-text("Log in")',
        'button:has-text("Submit")',
        '.login-button',
        '#loginButton',
        '#submitBtn'
      ];

      let submitClicked = false;
      for (const selector of possibleSubmitSelectors) {
        try {
          const button = await page.$(selector);
          if (button && await button.isVisible()) {
            result.loginDetails.push(`Clicking submit button: ${selector}`);
            await button.click();
            submitClicked = true;
            break;
          }
        } catch (e) {
          // Continue trying
        }
      }

      if (!submitClicked) {
        // Try pressing Enter as fallback
        result.loginDetails.push('No submit button found, pressing Enter...');
        await page.keyboard.press('Enter');
      }

      // Wait for navigation or response
      console.log('Waiting for login response...');
      try {
        await page.waitForNavigation({ timeout: 30000 });
        result.loginDetails.push('Navigation completed after login');
      } catch (e) {
        result.loginDetails.push('No navigation after login (may be SPA)');
        await page.waitForTimeout(5000);
      }

      await page.screenshot({ path: path.join(screenshotDir, '03-after-login.png'), fullPage: true });
      result.loginDetails.push('Screenshot saved: 03-after-login.png');

      result.currentUrl = page.url();
      result.pageTitle = await page.title();

      // Check if login was successful
      if (page.url().includes('map') || page.url().includes('dashboard') || page.url().includes('home')) {
        result.loginSuccess = true;
        result.loginDetails.push('Login appears successful!');
      } else {
        result.loginDetails.push(`Current URL after login: ${page.url()}`);

        // Check for error messages
        const errorSelectors = ['.error', '.alert-danger', '.error-message', '[class*="error"]'];
        for (const selector of errorSelectors) {
          const errors = await page.$$(selector);
          for (const error of errors) {
            const text = await error.textContent();
            if (text && text.trim()) {
              result.errors.push(text.trim());
            }
          }
        }
      }
    } else {
      result.loginDetails.push('Could not find login form fields');
      result.loginDetails.push('Checking if page requires different login approach...');

      // Check current page content
      const title = await page.title();
      result.pageTitle = title;
      result.loginDetails.push(`Page title: ${title}`);
    }

    // If login successful, explore the map page
    if (result.loginSuccess || page.url().includes('map')) {
      console.log('Exploring map interface...');
      await page.waitForTimeout(3000); // Let map load

      await page.screenshot({ path: path.join(screenshotDir, '04-map-page.png'), fullPage: true });
      result.loginDetails.push('Screenshot saved: 04-map-page.png');

      // Look for UI elements
      const uiSelectors = {
        'Buttons': 'button',
        'Links': 'a',
        'Dropdowns': 'select',
        'Checkboxes': 'input[type="checkbox"]',
        'Map container': '[class*="map"], #map, .leaflet-container, .mapboxgl-map',
        'Sidebars': '[class*="sidebar"], [class*="panel"], aside',
        'Toolbars': '[class*="toolbar"], [class*="controls"]',
        'Menus': 'nav, [class*="menu"], [class*="nav"]',
        'Modals': '[class*="modal"], [class*="dialog"]'
      };

      for (const [name, selector] of Object.entries(uiSelectors)) {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          result.uiElements.push(`${name}: ${elements.length} found`);

          // Get details for key elements
          if (elements.length <= 10) {
            for (const element of elements) {
              const text = await element.textContent();
              const id = await element.getAttribute('id');
              const className = await element.getAttribute('class');
              if (text && text.trim().length < 50) {
                result.uiElements.push(`  - ${text.trim().substring(0, 40)} (id=${id || 'none'})`);
              }
            }
          }
        }
      }

      // Check for specific Tarana features
      const taranaFeatures = [
        { name: 'Base Nodes', selector: '[class*="base"], [class*="node"]' },
        { name: 'Remote Nodes', selector: '[class*="remote"]' },
        { name: 'Links', selector: '[class*="link"]' },
        { name: 'Coverage', selector: '[class*="coverage"]' },
        { name: 'Statistics', selector: '[class*="stat"], [class*="metric"]' },
        { name: 'Alerts', selector: '[class*="alert"], [class*="warning"]' },
        { name: 'Search', selector: 'input[type="search"], [class*="search"]' },
        { name: 'Filters', selector: '[class*="filter"]' },
        { name: 'Layers', selector: '[class*="layer"]' }
      ];

      for (const feature of taranaFeatures) {
        const elements = await page.$$(feature.selector);
        if (elements.length > 0) {
          result.uiElements.push(`Tarana Feature - ${feature.name}: ${elements.length} elements`);
        }
      }

      // Take additional screenshots of any visible panels/modals
      const panels = await page.$$('[class*="panel"]:visible, [class*="sidebar"]:visible');
      if (panels.length > 0) {
        result.uiElements.push(`Visible panels/sidebars: ${panels.length}`);
      }
    }

    // Summarize API endpoints
    const uniqueApiEndpoints = [...new Set(result.apiEndpoints)];
    result.apiEndpoints = uniqueApiEndpoints;

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(`Error during exploration: ${errorMsg}`);
    console.error('Error:', errorMsg);

    if (page) {
      await page.screenshot({
        path: '/home/circletel/scripts/tarana/screenshots/error-state.png',
        fullPage: true
      }).catch(() => {});
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return result;
}

// Run the exploration
explorePortal()
  .then((result) => {
    console.log('\n=== EXPLORATION RESULTS ===\n');
    console.log(JSON.stringify(result, null, 2));

    // Save results to file
    fs.writeFileSync(
      '/home/circletel/scripts/tarana/exploration-results.json',
      JSON.stringify(result, null, 2)
    );
    console.log('\nResults saved to: /home/circletel/scripts/tarana/exploration-results.json');
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
