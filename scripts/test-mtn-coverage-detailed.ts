import { chromium, Browser, Page, ConsoleMessage, Request, Response } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface NetworkLog {
  timestamp: string;
  method: string;
  url: string;
  status?: number;
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  responseHeaders?: Record<string, string>;
  responseBody?: any;
}

interface ConsoleLog {
  timestamp: string;
  type: string;
  text: string;
  args?: any[];
}

interface TestResult {
  testAddress: string;
  testUrl: string;
  consoleLogs: ConsoleLog[];
  networkLogs: NetworkLog[];
  localStorage: Record<string, any>;
  sessionStorage: Record<string, any>;
  cookies: any[];
  coverageResults: any;
  screenshots: string[];
  timestamp: string;
}

async function testMTNCoverage() {
  const testAddress = '25 Fish Eagle Place, Imhofs Gift, Cape Town, Western Cape';
  const testUrl = 'https://www.mtn.co.za/home/coverage/';
  const outputDir = path.join(process.cwd(), '.playwright-mcp', 'test-fish-eagle');

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const consoleLogs: ConsoleLog[] = [];
  const networkLogs: NetworkLog[] = [];
  const screenshots: string[] = [];

  console.log('🚀 Starting MTN Coverage Test...\n');
  console.log(`Test Address: ${testAddress}`);
  console.log(`Test URL: ${testUrl}\n`);

  const browser: Browser = await chromium.launch({
    headless: false, // Run with UI to see what's happening
    devtools: true,  // Open devtools automatically
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1920, height: 1080 }
    }
  });

  const page: Page = await context.newPage();

  // Capture console logs
  page.on('console', (msg: ConsoleMessage) => {
    const log: ConsoleLog = {
      timestamp: new Date().toISOString(),
      type: msg.type(),
      text: msg.text(),
      args: msg.args().map(arg => arg.toString())
    };
    consoleLogs.push(log);
    console.log(`[CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  // Capture network traffic
  page.on('request', (request: Request) => {
    let requestBody;
    try {
      const postData = request.postData();
      if (postData) {
        requestBody = JSON.parse(postData);
      }
    } catch (e) {
      requestBody = request.postData(); // Keep as string if not JSON
    }

    const log: NetworkLog = {
      timestamp: new Date().toISOString(),
      method: request.method(),
      url: request.url(),
      requestHeaders: request.headers(),
      requestBody
    };

    if (request.url().includes('coverage') ||
        request.url().includes('wms') ||
        request.url().includes('api') ||
        request.url().includes('geoserver')) {
      console.log(`[NETWORK →] ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', async (response: Response) => {
    const request = response.request();
    const existingLog = networkLogs.find(
      log => log.url === request.url() && log.timestamp === new Date().toISOString()
    );

    const log: NetworkLog = existingLog || {
      timestamp: new Date().toISOString(),
      method: request.method(),
      url: request.url(),
      requestHeaders: request.headers(),
    };

    log.status = response.status();
    log.responseHeaders = response.headers();

    // Capture response body for important requests
    if (response.url().includes('coverage') ||
        response.url().includes('wms') ||
        response.url().includes('api') ||
        response.url().includes('geoserver')) {
      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('application/json')) {
          log.responseBody = await response.json();
        } else if (contentType.includes('text')) {
          log.responseBody = await response.text();
        }
        console.log(`[NETWORK ←] ${response.status()} ${response.url()}`);
        if (log.responseBody) {
          console.log(`[RESPONSE] ${JSON.stringify(log.responseBody).substring(0, 200)}...`);
        }
      } catch (e) {
        // Silent fail for binary responses
      }
    }

    if (!existingLog) {
      networkLogs.push(log);
    }
  });

  try {
    // Step 1: Navigate to MTN coverage page
    console.log('\n📍 Step 1: Navigating to MTN coverage page...');
    await page.goto(testUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const screenshot1 = path.join(outputDir, '01-initial-page.png');
    await page.screenshot({ path: screenshot1, fullPage: true });
    screenshots.push(screenshot1);
    console.log('✅ Initial page loaded');

    // Step 2: Find and interact with address input
    console.log('\n📝 Step 2: Looking for address input field...');

    // Try multiple selectors for address input
    const addressSelectors = [
      'input[type="text"]',
      'input[placeholder*="address" i]',
      'input[placeholder*="location" i]',
      'input[name*="address" i]',
      'input[id*="address" i]',
      'input[class*="address" i]',
      '.coverage-search input',
      '#coverage-input',
      '[data-testid*="address"]'
    ];

    let addressInput = null;
    for (const selector of addressSelectors) {
      try {
        addressInput = await page.waitForSelector(selector, { timeout: 2000 });
        if (addressInput) {
          console.log(`✅ Found address input using selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!addressInput) {
      console.log('❌ Could not find address input field');
      // Take screenshot of page to analyze
      const errorScreenshot = path.join(outputDir, '02-no-input-found.png');
      await page.screenshot({ path: errorScreenshot, fullPage: true });
      screenshots.push(errorScreenshot);

      // Get page content to analyze
      const pageContent = await page.content();
      fs.writeFileSync(path.join(outputDir, 'page-html.txt'), pageContent);
      throw new Error('Address input field not found');
    }

    // Step 3: Type the address
    console.log('\n⌨️  Step 3: Typing address...');
    await addressInput.click();
    await page.waitForTimeout(500);
    await addressInput.fill(testAddress);
    await page.waitForTimeout(2000);

    const screenshot2 = path.join(outputDir, '02-address-typed.png');
    await page.screenshot({ path: screenshot2, fullPage: true });
    screenshots.push(screenshot2);
    console.log('✅ Address typed');

    // Step 4: Look for autocomplete/suggestions
    console.log('\n🔍 Step 4: Checking for autocomplete suggestions...');
    await page.waitForTimeout(1000);

    const suggestionSelectors = [
      '.autocomplete-suggestion',
      '.suggestion-item',
      '[role="option"]',
      '.pac-item', // Google Places autocomplete
      'li[data-index]',
      '.dropdown-item'
    ];

    let suggestionClicked = false;
    for (const selector of suggestionSelectors) {
      try {
        const suggestions = await page.$$(selector);
        if (suggestions.length > 0) {
          console.log(`✅ Found ${suggestions.length} suggestions using selector: ${selector}`);
          await suggestions[0].click();
          suggestionClicked = true;
          await page.waitForTimeout(1000);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!suggestionClicked) {
      console.log('ℹ️  No autocomplete suggestions found or clicked');
    }

    const screenshot3 = path.join(outputDir, '03-after-autocomplete.png');
    await page.screenshot({ path: screenshot3, fullPage: true });
    screenshots.push(screenshot3);

    // Step 5: Submit the form
    console.log('\n🔘 Step 5: Submitting coverage check...');

    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Check")',
      'button:has-text("Search")',
      'button:has-text("Find")',
      'button:has-text("Coverage")',
      '.submit-btn',
      '.search-btn',
      '[aria-label*="search" i]',
      '[aria-label*="check" i]'
    ];

    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        const submitBtn = await page.$(selector);
        if (submitBtn) {
          console.log(`✅ Found submit button using selector: ${selector}`);
          await submitBtn.click();
          submitted = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!submitted) {
      console.log('⌨️  No submit button found, trying Enter key...');
      await addressInput.press('Enter');
    }

    await page.waitForTimeout(5000);

    const screenshot4 = path.join(outputDir, '04-results-loading.png');
    await page.screenshot({ path: screenshot4, fullPage: true });
    screenshots.push(screenshot4);
    console.log('✅ Form submitted');

    // Step 6: Wait for and capture results
    console.log('\n📊 Step 6: Waiting for coverage results...');
    await page.waitForTimeout(3000);

    const screenshot5 = path.join(outputDir, '05-final-results.png');
    await page.screenshot({ path: screenshot5, fullPage: true });
    screenshots.push(screenshot5);

    // Step 7: Capture browser storage
    console.log('\n💾 Step 7: Capturing browser storage...');

    const localStorage = await page.evaluate(() => {
      const items: Record<string, any> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          const value = window.localStorage.getItem(key);
          try {
            items[key] = JSON.parse(value || '');
          } catch {
            items[key] = value;
          }
        }
      }
      return items;
    });

    const sessionStorage = await page.evaluate(() => {
      const items: Record<string, any> = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key) {
          const value = window.sessionStorage.getItem(key);
          try {
            items[key] = JSON.parse(value || '');
          } catch {
            items[key] = value;
          }
        }
      }
      return items;
    });

    const cookies = await context.cookies();

    // Step 8: Try to extract coverage results from page
    console.log('\n🎯 Step 8: Extracting coverage results...');

    const coverageResults = await page.evaluate(() => {
      // Try to find coverage result elements
      const results: any = {
        technologies: [],
        speeds: [],
        availability: null,
        rawText: []
      };

      // Look for technology badges/tags
      const techElements = document.querySelectorAll('[class*="technology"], [class*="tech"], .badge, .tag');
      techElements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && (text.includes('5G') || text.includes('4G') || text.includes('LTE') || text.includes('3G'))) {
          results.technologies.push(text);
        }
      });

      // Look for speed information
      const speedElements = document.querySelectorAll('[class*="speed"], [class*="mbps"]');
      speedElements.forEach(el => {
        const text = el.textContent?.trim();
        if (text) {
          results.speeds.push(text);
        }
      });

      // Get all visible text from results area
      const resultsArea = document.querySelector('.results, .coverage-results, #results, [class*="result"]');
      if (resultsArea) {
        results.rawText.push(resultsArea.textContent?.trim());
      }

      return results;
    });

    // Compile final test results
    const testResult: TestResult = {
      testAddress,
      testUrl,
      consoleLogs,
      networkLogs,
      localStorage,
      sessionStorage,
      cookies,
      coverageResults,
      screenshots,
      timestamp: new Date().toISOString()
    };

    // Save comprehensive report
    const reportPath = path.join(outputDir, 'DETAILED_TEST_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(testResult, null, 2));
    console.log(`\n✅ Detailed report saved to: ${reportPath}`);

    // Generate markdown documentation
    await generateMarkdownReport(testResult, outputDir);

    console.log('\n✨ Test completed successfully!');
    console.log(`📁 Results saved in: ${outputDir}`);

  } catch (error) {
    console.error('\n❌ Error during test:', error);
    const errorScreenshot = path.join(outputDir, 'error-screenshot.png');
    await page.screenshot({ path: errorScreenshot, fullPage: true });
    throw error;
  } finally {
    await page.waitForTimeout(2000);
    await context.close();
    await browser.close();
  }
}

async function generateMarkdownReport(result: TestResult, outputDir: string) {
  const report = `# MTN Coverage Test - Detailed Analysis

## Test Information
- **Test Address**: ${result.testAddress}
- **Test URL**: ${result.testUrl}
- **Timestamp**: ${result.timestamp}

## 📸 Screenshots
${result.screenshots.map((path, i) => `${i + 1}. ![Screenshot ${i + 1}](${path.split('\\').pop()})`).join('\n')}

## 🌐 Network Traffic Analysis

### Coverage-Related API Calls
${result.networkLogs
  .filter(log => log.url.includes('coverage') || log.url.includes('wms') || log.url.includes('api') || log.url.includes('geoserver'))
  .map(log => `
#### ${log.method} ${log.url}
- **Status**: ${log.status || 'Pending'}
- **Request Headers**:
\`\`\`json
${JSON.stringify(log.requestHeaders, null, 2)}
\`\`\`
${log.requestBody ? `- **Request Body**:
\`\`\`json
${JSON.stringify(log.requestBody, null, 2)}
\`\`\`` : ''}
${log.responseBody ? `- **Response Body**:
\`\`\`json
${JSON.stringify(log.responseBody, null, 2).substring(0, 1000)}${JSON.stringify(log.responseBody).length > 1000 ? '...' : ''}
\`\`\`` : ''}
`).join('\n')}

### All Network Requests (${result.networkLogs.length} total)
${result.networkLogs.slice(0, 50).map(log => `- \`${log.method}\` ${log.url} → ${log.status || 'Pending'}`).join('\n')}

## 📝 Console Logs (${result.consoleLogs.length} total)
${result.consoleLogs.slice(0, 100).map(log => `- **[${log.type.toUpperCase()}]** (${log.timestamp}): ${log.text}`).join('\n')}

## 💾 Browser Storage

### Local Storage
\`\`\`json
${JSON.stringify(result.localStorage, null, 2)}
\`\`\`

### Session Storage
\`\`\`json
${JSON.stringify(result.sessionStorage, null, 2)}
\`\`\`

### Cookies (${result.cookies.length} total)
${result.cookies.map(cookie => `- **${cookie.name}**: ${cookie.value.substring(0, 50)}${cookie.value.length > 50 ? '...' : ''}`).join('\n')}

## 🎯 Coverage Results Extracted

### Technologies Detected
${result.coverageResults.technologies.length > 0 ? result.coverageResults.technologies.map((t: string) => `- ${t}`).join('\n') : 'None detected'}

### Speed Information
${result.coverageResults.speeds.length > 0 ? result.coverageResults.speeds.map((s: string) => `- ${s}`).join('\n') : 'None detected'}

### Raw Results Text
\`\`\`
${result.coverageResults.rawText.join('\n\n')}
\`\`\`

## 🔍 Key Findings

### API Endpoints Discovered
${[...new Set(result.networkLogs
  .filter(log => log.url.includes('coverage') || log.url.includes('wms') || log.url.includes('api'))
  .map(log => log.url.split('?')[0])
)].map(url => `- ${url}`).join('\n')}

### Request Parameters Used
${result.networkLogs
  .filter(log => log.requestBody || (log.url.includes('?')))
  .map(log => {
    if (log.requestBody) {
      return `- **POST** ${log.url.split('?')[0]}: ${JSON.stringify(log.requestBody)}`;
    } else if (log.url.includes('?')) {
      const params = log.url.split('?')[1];
      return `- **GET** ${log.url.split('?')[0]}: ${params}`;
    }
    return '';
  })
  .filter(Boolean)
  .join('\n')}

## 📊 Summary

- **Total Network Requests**: ${result.networkLogs.length}
- **Coverage API Calls**: ${result.networkLogs.filter(log => log.url.includes('coverage') || log.url.includes('wms')).length}
- **Console Messages**: ${result.consoleLogs.length}
- **Technologies Found**: ${result.coverageResults.technologies.join(', ') || 'None'}

---
*Test completed at ${result.timestamp}*
`;

  const reportPath = path.join(outputDir, 'MTN_COVERAGE_TEST_REPORT.md');
  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Markdown report saved to: ${reportPath}`);
}

// Run the test
testMTNCoverage().catch(console.error);