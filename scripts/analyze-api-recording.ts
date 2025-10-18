/**
 * Analyzer for Coverage API Recording Results
 * Extracts key insights about API calls, authentication, cookies, and WMS requests
 */

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
  consoleMessages: any[];
  cookies: CookieInfo[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  timestamp: string;
}

function analyzeApiCalls(result: TestResult) {
  console.log(`\n${'='.repeat(100)}`);
  console.log(`🌐 SITE: ${result.site}`);
  console.log(`📍 ADDRESS: ${result.address}`);
  console.log(`⏰ TIMESTAMP: ${result.timestamp}`);
  console.log(`${'='.repeat(100)}\n`);

  // Filter for coverage/lead API calls
  const apiCalls = result.responses.filter(r =>
    (r.url.includes('/api/') ||
    r.url.includes('agilitygis') ||
    r.url.includes('lead') ||
    r.url.includes('coverage') ||
    r.url.includes('package') ||
    r.url.includes('supersonic') ||
    r.url.includes('feasibility')) &&
    !r.url.includes('google') &&
    !r.url.includes('facebook') &&
    !r.url.includes('analytics') &&
    !r.url.includes('.js') &&
    !r.url.includes('.css') &&
    !r.url.includes('.png') &&
    !r.url.includes('.jpg')
  );

  console.log(`\n📡 COVERAGE/LEAD API CALLS (${apiCalls.length} total):\n`);

  apiCalls.forEach((response, index) => {
    const request = result.requests.find(req => req.url === response.url);

    console.log(`${index + 1}. ${request?.method || 'GET'} ${response.url}`);
    console.log(`   Status: ${response.status} ${response.statusText}`);

    // Show relevant headers
    const relevantHeaders = ['content-type', 'authorization', 'x-api-key', 'x-auth-token', 'cookie', 'set-cookie'];
    const headers = Object.entries(response.headers)
      .filter(([key]) => relevantHeaders.includes(key.toLowerCase()));

    if (headers.length > 0) {
      console.log(`   Response Headers:`);
      headers.forEach(([key, value]) => {
        const displayValue = value.length > 100 ? value.substring(0, 100) + '...' : value;
        console.log(`     ${key}: ${displayValue}`);
      });
    }

    if (request?.headers) {
      const reqHeaders = Object.entries(request.headers)
        .filter(([key]) => relevantHeaders.includes(key.toLowerCase()));

      if (reqHeaders.length > 0) {
        console.log(`   Request Headers:`);
        reqHeaders.forEach(([key, value]) => {
          const displayValue = value.length > 100 ? value.substring(0, 100) + '...' : value;
          console.log(`     ${key}: ${displayValue}`);
        });
      }
    }

    if (request?.postData) {
      console.log(`   POST Data:`);
      try {
        const parsed = JSON.parse(request.postData);
        console.log(`     ${JSON.stringify(parsed, null, 2).split('\n').slice(0, 10).join('\n     ')}`);
      } catch {
        const displayData = request.postData.substring(0, 300);
        console.log(`     ${displayData}${request.postData.length > 300 ? '...' : ''}`);
      }
    }

    if (response.body) {
      console.log(`   Response Body:`);
      try {
        const bodyStr = typeof response.body === 'string'
          ? response.body
          : JSON.stringify(response.body, null, 2);

        const lines = bodyStr.split('\n').slice(0, 15);
        console.log(`     ${lines.join('\n     ')}`);
        if (bodyStr.split('\n').length > 15) {
          console.log(`     ... (truncated)`);
        }
      } catch {
        console.log(`     [Unable to parse body]`);
      }
    }

    console.log('');
  });

  // Authentication Analysis
  console.log(`\n🔐 AUTHENTICATION ANALYSIS:\n`);

  const authRequests = result.requests.filter(r =>
    r.headers['authorization'] ||
    r.headers['x-api-key'] ||
    r.headers['x-auth-token'] ||
    r.headers['cookie']
  );

  if (authRequests.length > 0) {
    console.log(`Found ${authRequests.length} requests with authentication:`);
    authRequests.slice(0, 5).forEach(req => {
      console.log(`  - ${req.method} ${req.url}`);
      if (req.headers['authorization']) {
        console.log(`    Authorization: ${req.headers['authorization'].substring(0, 50)}...`);
      }
      if (req.headers['x-api-key']) {
        console.log(`    X-API-Key: ${req.headers['x-api-key']}`);
      }
      if (req.headers['cookie']) {
        console.log(`    Cookie: ${req.headers['cookie'].substring(0, 100)}...`);
      }
    });
  } else {
    console.log(`❌ No explicit authentication headers found in API requests`);
  }

  // Cookies Analysis
  console.log(`\n\n🍪 COOKIES (${result.cookies.length} total):\n`);

  result.cookies.forEach(cookie => {
    console.log(`  ${cookie.name}`);
    console.log(`    Domain: ${cookie.domain}`);
    console.log(`    Value: ${cookie.value.substring(0, 80)}${cookie.value.length > 80 ? '...' : ''}`);
    console.log(`    Secure: ${cookie.secure}, HttpOnly: ${cookie.httpOnly}, SameSite: ${cookie.sameSite || 'none'}`);
    console.log('');
  });

  // LocalStorage Analysis
  console.log(`\n💾 LOCAL STORAGE (${Object.keys(result.localStorage).length} items):\n`);

  Object.entries(result.localStorage).forEach(([key, value]) => {
    console.log(`  ${key}:`);
    const displayValue = value.substring(0, 150);
    console.log(`    ${displayValue}${value.length > 150 ? '...' : ''}`);
    console.log('');
  });

  // SessionStorage Analysis
  console.log(`\n💾 SESSION STORAGE (${Object.keys(result.sessionStorage).length} items):\n`);

  Object.entries(result.sessionStorage).forEach(([key, value]) => {
    console.log(`  ${key}:`);
    const displayValue = value.substring(0, 150);
    console.log(`    ${displayValue}${value.length > 150 ? '...' : ''}`);
    console.log('');
  });

  // WMS/GIS Analysis
  console.log(`\n🗺️  WMS/GIS REQUESTS:\n`);

  const wmsRequests = result.requests.filter(r =>
    r.url.toLowerCase().includes('wms') ||
    r.url.toLowerCase().includes('gis') ||
    r.url.toLowerCase().includes('getcapabilities') ||
    r.url.toLowerCase().includes('getmap') ||
    r.url.toLowerCase().includes('getfeatureinfo')
  );

  if (wmsRequests.length > 0) {
    console.log(`Found ${wmsRequests.length} WMS/GIS requests:`);
    wmsRequests.forEach(req => {
      console.log(`  - ${req.method} ${req.url}`);

      // Check for WMS-specific parameters
      const url = new URL(req.url);
      const params = url.searchParams;

      if (params.has('SERVICE')) {
        console.log(`    SERVICE: ${params.get('SERVICE')}`);
      }
      if (params.has('REQUEST')) {
        console.log(`    REQUEST: ${params.get('REQUEST')}`);
      }
      if (params.has('VERSION')) {
        console.log(`    VERSION: ${params.get('VERSION')}`);
      }
      if (params.has('LAYERS')) {
        console.log(`    LAYERS: ${params.get('LAYERS')}`);
      }

      console.log('');
    });
  } else {
    console.log(`❌ No WMS/GIS requests detected`);
  }

  console.log('\n');
}

function createSummaryReport(results: TestResult[]) {
  console.log(`\n\n${'█'.repeat(100)}`);
  console.log(`📋 EXECUTIVE SUMMARY REPORT`);
  console.log(`${'█'.repeat(100)}\n`);

  for (const result of results) {
    console.log(`\n🌐 ${result.site} - ${result.address.split(',')[0]}\n`);

    // Key API endpoints
    const coverageApis = result.responses.filter(r =>
      (r.url.includes('/api/') || r.url.includes('agilitygis')) &&
      !r.url.includes('google') &&
      !r.url.includes('facebook') &&
      !r.url.includes('.js') &&
      !r.url.includes('.css')
    );

    console.log(`📡 API Calls: ${coverageApis.length} relevant endpoints`);

    // Authentication methods
    const hasAuth = result.requests.some(r =>
      r.headers['authorization'] || r.headers['x-api-key']
    );
    const hasCookies = result.cookies.length > 0;
    const hasLocalStorage = Object.keys(result.localStorage).length > 0;

    console.log(`🔐 Authentication:`);
    console.log(`   - Auth Headers: ${hasAuth ? '✅ Yes' : '❌ No'}`);
    console.log(`   - Cookies: ${hasCookies ? `✅ ${result.cookies.length} cookies` : '❌ No'}`);
    console.log(`   - Local Storage: ${hasLocalStorage ? `✅ ${Object.keys(result.localStorage).length} items` : '❌ No'}`);

    // WMS detection
    const hasWms = result.requests.some(r =>
      r.url.toLowerCase().includes('wms') || r.url.toLowerCase().includes('gis')
    );
    console.log(`🗺️  WMS/GIS: ${hasWms ? '✅ Detected' : '❌ Not detected'}`);

    console.log('');
  }
}

async function main() {
  // Find the latest results file
  const testResultsDir = path.join(process.cwd(), 'test-results');
  const files = fs.readdirSync(testResultsDir)
    .filter(f => f.startsWith('coverage-api-recording') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error('❌ No test results found');
    process.exit(1);
  }

  const latestFile = path.join(testResultsDir, files[0]);
  console.log(`\n📂 Reading results from: ${latestFile}\n`);

  const results: TestResult[] = JSON.parse(fs.readFileSync(latestFile, 'utf-8'));

  // Analyze each result
  for (const result of results) {
    analyzeApiCalls(result);
  }

  // Create summary report
  createSummaryReport(results);

  // Save detailed analysis to file
  const analysisFile = latestFile.replace('.json', '-ANALYSIS.txt');
  console.log(`\n💾 Full analysis would be saved to: ${analysisFile}\n`);
}

main().catch(error => {
  console.error('❌ Error analyzing results:', error);
  process.exit(1);
});
