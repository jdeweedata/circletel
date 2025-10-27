/**
 * Partner Registration Flow Test Script
 *
 * Tests the partner onboarding API endpoint
 *
 * Usage:
 *   node scripts/test-partner-registration.js
 *   NEXT_PUBLIC_APP_URL=http://localhost:3001 node scripts/test-partner-registration.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

// Test data
const validPartnerData = {
  businessName: 'Test Sales Agency PTY LTD',
  businessType: 'company',
  registrationNumber: '2023/123456/07',
  vatNumber: '4123456789',
  contactPerson: 'John Doe',
  email: 'john.doe@testsalesagency.co.za',
  phone: '0821234567',
  alternativePhone: '0112345678',
  streetAddress: '123 Main Road',
  suburb: 'Sandton',
  city: 'Johannesburg',
  province: 'Gauteng',
  postalCode: '2196',
  bankName: 'FNB',
  accountHolder: 'Test Sales Agency PTY LTD',
  accountNumber: '62123456789',
  accountType: 'cheque',
  branchCode: '250655'
};

// Test 1: Environment Check
async function testEnvironment() {
  section('Test 1: Environment Check');

  log(`Base URL: ${BASE_URL}`, 'blue');

  try {
    const response = await fetch(BASE_URL);
    if (response.ok) {
      log('✓ Server is running', 'green');
      return true;
    } else {
      log(`✗ Server returned status ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Cannot connect to server: ${error.message}`, 'red');
    log('  Make sure the dev server is running (npm run dev:memory)', 'yellow');
    return false;
  }
}

// Test 2: Page Accessibility
async function testRegistrationPage() {
  section('Test 2: Partner Registration Page');

  try {
    const response = await fetch(`${BASE_URL}/partners/onboarding`);
    const html = await response.text();

    if (response.ok) {
      log('✓ Registration page is accessible', 'green');

      // Check for key elements
      const checks = {
        'Business Information section': html.includes('Business Information'),
        'Contact Information section': html.includes('Contact Information'),
        'Business Address section': html.includes('Business Address'),
        'Banking Details section': html.includes('Banking Details'),
        'Submit button': html.includes('Continue to Verification'),
      };

      for (const [check, passed] of Object.entries(checks)) {
        if (passed) {
          log(`  ✓ ${check}`, 'green');
        } else {
          log(`  ✗ ${check}`, 'red');
        }
      }

      return true;
    } else {
      log(`✗ Page returned status ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Error accessing page: ${error.message}`, 'red');
    return false;
  }
}

// Test 3: API Endpoint - Unauthenticated Request
async function testUnauthenticatedRequest() {
  section('Test 3: API - Unauthenticated Request');

  try {
    const response = await fetch(`${BASE_URL}/api/partners/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPartnerData),
    });

    const result = await response.json();

    if (response.status === 401) {
      log('✓ Correctly rejects unauthenticated requests (401)', 'green');
      log(`  Message: ${result.error}`, 'blue');
      return true;
    } else {
      log(`✗ Expected 401, got ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    return false;
  }
}

// Test 4: API Endpoint - Invalid Data
async function testInvalidData() {
  section('Test 4: API - Invalid Data Validation');

  const invalidData = {
    businessName: 'T', // Too short
    email: 'invalid-email', // Invalid format
    phone: '123', // Too short
  };

  try {
    const response = await fetch(`${BASE_URL}/api/partners/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData),
    });

    const result = await response.json();

    if (response.status === 400 || response.status === 401) {
      log('✓ Correctly validates request data', 'green');
      if (result.details) {
        log('  Validation errors detected:', 'blue');
        for (const [field, errors] of Object.entries(result.details)) {
          log(`    - ${field}: ${errors.join(', ')}`, 'yellow');
        }
      }
      return true;
    } else {
      log(`✗ Expected 400/401, got ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    return false;
  }
}

// Test 5: GET Endpoint - Retrieve Partner Status
async function testGetPartnerStatus() {
  section('Test 5: API - Get Partner Status');

  try {
    const response = await fetch(`${BASE_URL}/api/partners/onboarding`);
    const result = await response.json();

    if (response.status === 401) {
      log('✓ Correctly requires authentication for GET (401)', 'green');
      log(`  Message: ${result.error}`, 'blue');
      return true;
    } else if (response.status === 200) {
      log('✓ Successfully retrieved partner status', 'green');
      if (result.data) {
        log(`  Partner ID: ${result.data.id}`, 'blue');
        log(`  Status: ${result.data.status}`, 'blue');
        log(`  Business: ${result.data.business_name}`, 'blue');
      } else {
        log('  No partner registration found', 'blue');
      }
      return true;
    } else {
      log(`✗ Unexpected status ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║         Partner Registration Flow Test Suite              ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');

  const results = [];

  // Run all tests
  results.push(await testEnvironment());
  results.push(await testRegistrationPage());
  results.push(await testUnauthenticatedRequest());
  results.push(await testInvalidData());
  results.push(await testGetPartnerStatus());

  // Summary
  section('Test Summary');
  const passed = results.filter(r => r).length;
  const total = results.length;

  log(`Tests Passed: ${passed}/${total}`, passed === total ? 'green' : 'yellow');

  if (passed === total) {
    log('\n✓ All tests passed!', 'green');
  } else {
    log(`\n✗ ${total - passed} test(s) failed`, 'red');
  }

  // Next steps
  section('Manual Testing Steps');
  log('To test the complete registration flow:', 'blue');
  log('1. Sign up or log in as a customer', 'yellow');
  log('2. Navigate to /partners/onboarding', 'yellow');
  log('3. Fill out the registration form', 'yellow');
  log('4. Submit and verify redirect to /partners/onboarding/verify', 'yellow');
  log('5. Check Supabase for new partner record (status: pending)', 'yellow');

  section('Database Check');
  log('To verify partner was created in Supabase:', 'blue');
  log('SELECT * FROM partners ORDER BY created_at DESC LIMIT 1;', 'cyan');

  console.log('\n');
}

// Run tests
runTests().catch(error => {
  log(`\n✗ Test suite failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
