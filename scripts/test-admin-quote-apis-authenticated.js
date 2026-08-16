/**
 * CircleTel Admin Quote API Testing Script (With Authentication)
 *
 * Comprehensive test suite with proper admin authentication
 * Tests all quote-related API endpoints with session cookies
 *
 * Usage:
 *   node scripts/test-admin-quote-apis-authenticated.js
 *
 * Prerequisites:
 *   - Development server running on http://localhost:3000
 *   - Admin user: jeffrey.de.wee@circletel.co.za
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_TEST_EMAIL || 'jeffrey.de.wee@circletel.co.za';
const ADMIN_PASSWORD = process.env.ADMIN_TEST_PASSWORD || 'a35kK4qCc3sVfj2!';

function assertSafeTestTarget() {
  const allowProd = process.env.ALLOW_PROD_QUOTE_TESTS === '1';
  const url = String(BASE_URL).toLowerCase();
  const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
  const isProdHost =
    url.includes('circletel.co.za') ||
    url.includes('agyjovdugmtopasyvlng');

  if (!isLocal && !allowProd) {
    console.error(
      'Refusing to run quote API tests against a non-local host.\n' +
        'Set TEST_BASE_URL=http://localhost:3000, or ALLOW_PROD_QUOTE_TESTS=1 only for an explicit sandbox.'
    );
    process.exit(1);
  }
  if (isProdHost && !allowProd) {
    console.error(
      'Refusing to write test quotes to production. This script previously filled business_quotes with 382 automated drafts.'
    );
    process.exit(1);
  }
}

assertSafeTestTarget();

// Test state
let sessionCookies = '';
let testQuoteId = null;
let testPackageId = null;
let testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  console.log(`\n${colors.cyan}━━━ ${name} ━━━${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ PASS: ${message}`, 'green');
  testResults.passed++;
}

function logFailure(message) {
  log(`❌ FAIL: ${message}`, 'red');
  testResults.failed++;
}

function logSkip(message) {
  log(`⏭️  SKIP: ${message}`, 'yellow');
  testResults.skipped++;
}

// HTTP request helper with cookie support
function makeRequest(method, path, body = null, customHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const client = url.protocol === 'https:' ? https : http;

    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    };

    // Add cookies if we have them
    if (sessionCookies) {
      headers['Cookie'] = sessionCookies;
    }

    const options = {
      method,
      headers
    };

    const req = client.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed,
            cookies: res.headers['set-cookie'] || []
          });
        } catch (err) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            cookies: res.headers['set-cookie'] || []
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Parse cookies from set-cookie headers
function parseCookies(setCookieHeaders) {
  if (!setCookieHeaders || setCookieHeaders.length === 0) {
    return '';
  }

  // Extract only the name=value pairs (ignore Path, HttpOnly, etc.)
  const cookiePairs = setCookieHeaders.map(cookie => {
    // Split by semicolon and take only the first part (name=value)
    return cookie.split(';')[0].trim();
  });

  return cookiePairs.join('; ');
}

// Authentication
async function authenticateAdmin() {
  logTest('🔐 Admin Authentication');

  try {
    const response = await makeRequest('POST', '/api/admin/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (response.status === 200 && response.data.success) {
      // Store session cookies (parse them properly)
      if (response.cookies && response.cookies.length > 0) {
        sessionCookies = parseCookies(response.cookies);
        log(`Cookies captured: ${sessionCookies.substring(0, 50)}...`, 'gray');
      }
      logSuccess(`Authenticated as ${ADMIN_EMAIL} (${response.data.user.role})`);
      return true;
    } else {
      logFailure(`Authentication failed: ${response.status} - ${JSON.stringify(response.data).substring(0, 200)}`);
      return false;
    }
  } catch (error) {
    logFailure(`Authentication error: ${error.message}`);
    return false;
  }
}

// Get a test package ID
async function getTestPackageId() {
  logTest('📦 Getting Test Package ID');

  // Use a known package ID from the database
  testPackageId = 'a7f66fd1-cb60-4452-9993-77d754f52883'; // MTN Home Max+ 380GB
  logSuccess(`Using test package ID: ${testPackageId}`);
  return true;
}

// Test 1: List Quotes
async function testListQuotes() {
  logTest('1️⃣ GET /api/quotes - List Quotes');

  try {
    log(`Sending cookies: ${sessionCookies.substring(0, 100)}...`, 'gray');
    const response = await makeRequest('GET', '/api/quotes');

    if (response.status === 200 && response.data.success) {
      logSuccess(`Listed ${response.data.quotes?.length || 0} quotes`);
      return true;
    } else {
      logFailure(`Failed: ${response.status} - ${JSON.stringify(response.data)}`);
      log(`Debug: Cookie count in request: ${sessionCookies.split(';').length}`, 'gray');
      return false;
    }
  } catch (error) {
    logFailure(`Error: ${error.message}`);
    return false;
  }
}

// Test 2: Create Quote
async function testCreateQuote() {
  logTest('2️⃣ POST /api/quotes/business/create - Create Quote');

  if (!testPackageId) {
    logSkip('No package ID available');
    return false;
  }

  const quoteData = {
    customer_type: 'smme',
    company_name: 'Test Company Ltd (Automated Test)',
    registration_number: '2025/999999/07',
    vat_number: '4999999999',
    contact_name: 'API Test User',
    contact_email: `test-${Date.now()}@testcompany.co.za`,
    contact_phone: '+27821234567',
    service_address: '123 Test Street, Cape Town, 8001',
    contract_term: 24,
    items: [
      {
        package_id: testPackageId,
        item_type: 'primary',
        quantity: 1
      }
    ],
    customer_notes: 'Automated API test quote'
  };

  try {
    const response = await makeRequest('POST', '/api/quotes/business/create', quoteData);

    if (response.status === 200 && response.data.success && response.data.quote) {
      testQuoteId = response.data.quote.id;
      logSuccess(`Created quote: ${response.data.quote.quote_number} (${testQuoteId})`);
      return true;
    } else {
      logFailure(`Failed: ${response.status} - ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    logFailure(`Error: ${error.message}`);
    return false;
  }
}

// Test 3: Get Quote Details
async function testGetQuote() {
  logTest('3️⃣ GET /api/quotes/business/[id] - Get Quote');

  if (!testQuoteId) {
    logSkip('No test quote ID available');
    return false;
  }

  try {
    const response = await makeRequest('GET', `/api/quotes/business/${testQuoteId}`);

    if (response.status === 200 && response.data.success && response.data.quote) {
      logSuccess(`Retrieved quote: ${response.data.quote.quote_number}`);
      return true;
    } else {
      logFailure(`Failed: ${response.status} - ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    logFailure(`Error: ${error.message}`);
    return false;
  }
}

// Test 4: Update Quote
async function testUpdateQuote() {
  logTest('4️⃣ PUT /api/quotes/business/[id] - Update Quote');

  if (!testQuoteId) {
    logSkip('No test quote ID available');
    return false;
  }

  const updates = {
    company_name: 'Updated Test Company Ltd',
    notes: 'Updated via authenticated API test'
  };

  try {
    const response = await makeRequest('PUT', `/api/quotes/business/${testQuoteId}`, updates);

    if (response.status === 200 && response.data.success) {
      logSuccess('Quote updated successfully');
      return true;
    } else {
      logFailure(`Failed: ${response.status} - ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    logFailure(`Error: ${error.message}`);
    return false;
  }
}

// Test 5: Approve Quote
async function testApproveQuote() {
  logTest('5️⃣ POST /api/quotes/business/[id]/approve - Approve Quote');

  if (!testQuoteId) {
    logSkip('No test quote ID available');
    return false;
  }

  try {
    const response = await makeRequest('POST', `/api/quotes/business/${testQuoteId}/approve`);

    if (response.status === 200 && response.data.success) {
      logSuccess('Quote approved successfully');
      return true;
    } else {
      logFailure(`Failed: ${response.status} - ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    logFailure(`Error: ${error.message}`);
    return false;
  }
}

// Test 6: Pending Quotes
async function testPendingQuotes() {
  logTest('6️⃣ GET /api/quotes/business/admin/pending - Pending Quotes');

  try {
    const response = await makeRequest('GET', '/api/quotes/business/admin/pending?limit=10');

    if (response.status === 200 && response.data.success) {
      logSuccess(`Retrieved ${response.data.quotes?.length || 0} pending quotes`);
      return true;
    } else {
      logFailure(`Failed: ${response.status} - ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    logFailure(`Error: ${error.message}`);
    return false;
  }
}

// Test 7: Analytics
async function testAnalytics() {
  logTest('7️⃣ GET /api/quotes/business/admin/analytics - Analytics');

  try {
    const response = await makeRequest('GET', '/api/quotes/business/admin/analytics');

    if (response.status === 200 && response.data.success && response.data.analytics) {
      const { analytics } = response.data;
      logSuccess(`Analytics: ${analytics.total_quotes} total, ${analytics.accepted_quotes} accepted`);
      return true;
    } else {
      logFailure(`Failed: ${response.status} - ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    logFailure(`Error: ${error.message}`);
    return false;
  }
}

// Test 8: Delete Quote
async function testDeleteQuote() {
  logTest('8️⃣ DELETE /api/quotes/business/[id] - Delete Quote');

  if (!testQuoteId) {
    logSkip('No test quote ID available');
    return false;
  }

  // Create a new draft quote for deletion (can't delete approved quotes)
  const quoteData = {
    customer_type: 'smme',
    company_name: 'Delete Me Test Co',
    contact_name: 'Delete Test',
    contact_email: `delete-${Date.now()}@test.co.za`,
    contact_phone: '+27821234567',
    service_address: '123 Delete St',
    contract_term: 24,
    items: [{ package_id: testPackageId, item_type: 'primary', quantity: 1 }]
  };

  try {
    // Create draft quote
    const createResp = await makeRequest('POST', '/api/quotes/business/create', quoteData);
    if (!createResp.data.success) {
      logFailure('Could not create test quote for deletion');
      return false;
    }

    const deleteQuoteId = createResp.data.quote.id;

    // Delete it
    const deleteResp = await makeRequest('DELETE', `/api/quotes/business/${deleteQuoteId}`);

    if (deleteResp.status === 200 && deleteResp.data.success) {
      logSuccess('Quote deleted successfully');
      return true;
    } else {
      logFailure(`Failed: ${deleteResp.status} - ${JSON.stringify(deleteResp.data)}`);
      return false;
    }
  } catch (error) {
    logFailure(`Error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n╔═══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║   CircleTel Admin Quote API Tests (With Authentication)      ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════════╝', 'cyan');
  log(`\nBase URL: ${BASE_URL}`, 'blue');
  log(`Admin User: ${ADMIN_EMAIL}\n`, 'blue');

  // Step 1: Authenticate
  const authenticated = await authenticateAdmin();
  if (!authenticated) {
    log('\n❌ Authentication failed. Cannot proceed with tests.', 'red');
    process.exit(1);
  }

  // Step 2: Get test package
  await getTestPackageId();

  // Step 3: Run tests
  await testListQuotes();
  await testCreateQuote();
  await testGetQuote();
  await testUpdateQuote();
  await testApproveQuote();
  await testPendingQuotes();
  await testAnalytics();
  try {
    await testDeleteQuote();
  } finally {
    if (testQuoteId) {
      try {
        await makeRequest('DELETE', `/api/quotes/business/${testQuoteId}`);
      } catch (cleanupErr) {
        log(`Could not delete leftover test quote ${testQuoteId}: ${cleanupErr.message}`, 'yellow');
      }
    }
  }

  // Print summary
  log('\n╔═══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                      TEST SUMMARY                             ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════════╝', 'cyan');

  const total = testResults.passed + testResults.failed + testResults.skipped;
  const passRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;

  log(`\nTotal Tests: ${total}`, 'blue');
  log(`✅ Passed: ${testResults.passed}`, 'green');
  log(`❌ Failed: ${testResults.failed}`, 'red');
  log(`⏭️  Skipped: ${testResults.skipped}`, 'yellow');
  log(`\nPass Rate: ${passRate}%`, passRate >= 80 ? 'green' : 'red');

  if (testResults.failed === 0 && testResults.passed > 0) {
    log('\n🎉 All tests passed!', 'green');
    process.exit(0);
  } else if (testResults.failed > 0) {
    log('\n⚠️  Some tests failed. Please review the output above.', 'yellow');
    process.exit(1);
  } else {
    log('\n⚠️  No tests were run successfully.', 'yellow');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
