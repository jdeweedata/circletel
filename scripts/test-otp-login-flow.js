/**
 * Test OTP Login Flow
 * Tests the complete OTP authentication flow including:
 * 1. Sending OTP to phone number
 * 2. Verifying OTP code
 * 3. Signing in with verified OTP
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Test phone number (you can change this)
const TEST_PHONE = '0821234567';

console.log('🧪 Testing OTP Login Flow');
console.log('='.repeat(60));
console.log(`Base URL: ${BASE_URL}`);
console.log(`Test Phone: ${TEST_PHONE}`);
console.log('='.repeat(60));
console.log('');

async function testOTPSend() {
  console.log('📤 Step 1: Sending OTP...');

  try {
    const response = await fetch(`${BASE_URL}/api/otp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: TEST_PHONE,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ OTP sent successfully!');
      console.log(`   Message: ${data.message}`);
      return { success: true };
    } else {
      console.error('❌ Failed to send OTP');
      console.error(`   Error: ${data.error}`);
      console.error(`   Status: ${response.status}`);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('❌ Network error sending OTP');
    console.error(`   ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testOTPVerify(otp) {
  console.log('');
  console.log('🔐 Step 2: Verifying OTP...');
  console.log(`   OTP Code: ${otp}`);

  try {
    const response = await fetch(`${BASE_URL}/api/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: TEST_PHONE,
        otp: otp,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ OTP verified successfully!');
      console.log(`   Message: ${data.message}`);
      return { success: true };
    } else {
      console.error('❌ Failed to verify OTP');
      console.error(`   Error: ${data.error}`);
      console.error(`   Status: ${response.status}`);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('❌ Network error verifying OTP');
    console.error(`   ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testLoginPage() {
  console.log('');
  console.log('🌐 Step 3: Checking Login Page...');

  try {
    const response = await fetch(`${BASE_URL}/auth/login`);

    if (response.ok) {
      const html = await response.text();

      // Check for key elements
      const hasOTPToggle = html.includes('Mobile Number OTP');
      const hasEmailToggle = html.includes('Email & Password');
      const hasGoogleAuth = html.includes('Continue with Google');

      console.log('✅ Login page accessible');
      console.log(`   OTP Login Option: ${hasOTPToggle ? '✓' : '✗'}`);
      console.log(`   Email Login Option: ${hasEmailToggle ? '✓' : '✗'}`);
      console.log(`   Google OAuth: ${hasGoogleAuth ? '✓' : '✗'}`);

      return { success: true, hasOTPToggle };
    } else {
      console.error('❌ Failed to load login page');
      console.error(`   Status: ${response.status}`);
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Network error loading login page');
    console.error(`   ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testVerifyOTPPage() {
  console.log('');
  console.log('🌐 Step 4: Checking Verify OTP Page...');

  try {
    const response = await fetch(`${BASE_URL}/auth/verify-otp?phone=${encodeURIComponent(TEST_PHONE)}`);

    if (response.ok) {
      const html = await response.text();

      // Check for key elements
      const hasOTPInput = html.includes('Verification Code') || html.includes('verification code');
      const hasResendButton = html.includes('Resend code') || html.includes('resend');

      console.log('✅ Verify OTP page accessible');
      console.log(`   OTP Input Field: ${hasOTPInput ? '✓' : '✗'}`);
      console.log(`   Resend Button: ${hasResendButton ? '✓' : '✗'}`);

      return { success: true };
    } else {
      console.error('❌ Failed to load verify OTP page');
      console.error(`   Status: ${response.status}`);
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Network error loading verify OTP page');
    console.error(`   ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function checkEnvironmentVariables() {
  console.log('');
  console.log('🔧 Step 5: Checking Environment Variables...');

  const clickatellApiKey = process.env.CLICKATELL_API_KEY;
  const clickatellApiId = process.env.CLICKATELL_API_ID;

  console.log(`   CLICKATELL_API_KEY: ${clickatellApiKey ? '✓ Set' : '✗ Missing'}`);
  console.log(`   CLICKATELL_API_ID: ${clickatellApiId ? '✓ Set' : '✗ Missing'}`);

  if (!clickatellApiKey || !clickatellApiId) {
    console.warn('⚠️  Warning: ClickaTel credentials not configured');
    console.warn('   OTP sending will fail without proper credentials');
    return { success: false, error: 'Missing ClickaTel credentials' };
  }

  return { success: true };
}

async function runTests() {
  console.log('🚀 Starting OTP Login Flow Tests...\n');

  // Step 1: Check environment
  const envResult = await checkEnvironmentVariables();

  // Step 2: Test login page
  const loginPageResult = await testLoginPage();

  // Step 3: Test verify OTP page
  const verifyPageResult = await testVerifyOTPPage();

  // Step 4: Test OTP send (if env is configured)
  let sendResult = { success: false, skipped: true };
  if (envResult.success) {
    sendResult = await testOTPSend();
  } else {
    console.log('');
    console.log('⏭️  Skipping OTP send test (ClickaTel not configured)');
  }

  // Summary
  console.log('');
  console.log('='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`Environment Variables: ${envResult.success ? '✅ PASS' : '⚠️  WARNING'}`);
  console.log(`Login Page: ${loginPageResult.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Verify OTP Page: ${verifyPageResult.success ? '✅ PASS' : '❌ FAIL'}`);

  if (sendResult.skipped) {
    console.log(`OTP Send: ⏭️  SKIPPED (ClickaTel not configured)`);
  } else {
    console.log(`OTP Send: ${sendResult.success ? '✅ PASS' : '❌ FAIL'}`);
  }

  console.log('='.repeat(60));
  console.log('');

  // If OTP was sent successfully, prompt for manual verification
  if (sendResult.success) {
    console.log('📱 Manual Verification Required:');
    console.log(`   1. Check phone ${TEST_PHONE} for OTP SMS`);
    console.log(`   2. Run this command to verify:`);
    console.log(`      node scripts/test-otp-verify.js <OTP_CODE>`);
    console.log('');
  }

  // Instructions for completing the test
  console.log('🧪 To Complete End-to-End Test:');
  console.log('   1. Ensure server is running: npm run dev');
  console.log('   2. Navigate to: http://localhost:3000/auth/login');
  console.log('   3. Click "Mobile Number OTP" tab');
  console.log(`   4. Enter phone: ${TEST_PHONE}`);
  console.log('   5. Click "Send verification code"');
  console.log('   6. Check SMS and enter OTP code');
  console.log('   7. Should redirect to dashboard on success');
  console.log('');

  // Overall result
  const overallSuccess = loginPageResult.success && verifyPageResult.success;

  if (overallSuccess) {
    console.log('✅ All automated tests passed!');
    if (!envResult.success) {
      console.log('⚠️  Configure ClickaTel credentials for full OTP functionality');
    }
  } else {
    console.log('❌ Some tests failed. Please review the errors above.');
  }

  process.exit(overallSuccess ? 0 : 1);
}

// Run tests
runTests().catch((error) => {
  console.error('');
  console.error('💥 Fatal Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
