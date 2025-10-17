/**
 * MTN SSO Authentication Test Script
 *
 * Tests the MTN SSO authentication flow and validates session management.
 *
 * Usage:
 *   npx tsx scripts/test-mtn-sso-auth.ts [--manual]
 *
 * Options:
 *   --manual  Run manual authentication with visible browser (for reCAPTCHA)
 */

import { mtnSSOAuth } from '../lib/services/mtn-sso-auth';

async function testAuthentication(manual: boolean = false) {
  console.log('='.repeat(60));
  console.log('MTN SSO Authentication Test');
  console.log('='.repeat(60));
  console.log('');

  try {
    let result;

    if (manual) {
      console.log('🔧 Running MANUAL authentication (visible browser)...');
      console.log('⏳ You will need to solve the reCAPTCHA manually');
      console.log('');
      result = await mtnSSOAuth.authenticateManual();
    } else {
      console.log('🤖 Running AUTOMATED authentication...');
      console.log('⚠️  Note: This may fail at reCAPTCHA step');
      console.log('   Use --manual flag if automated auth fails');
      console.log('');
      result = await mtnSSOAuth.getAuthSession();
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('Authentication Result');
    console.log('='.repeat(60));

    if (result.success) {
      console.log('✅ Status: SUCCESS');
      console.log('');
      console.log('Session Details:');
      console.log(`  Session ID: ${result.sessionId}`);
      console.log(`  Expires At: ${result.expiresAt?.toISOString()}`);
      console.log(`  Cookies Count: ${result.cookies?.length || 0}`);
      console.log('');

      if (result.cookies && result.cookies.length > 0) {
        console.log('Cookies:');
        result.cookies.forEach(cookie => {
          const expiryDate = cookie.expires > 0
            ? new Date(cookie.expires * 1000).toISOString()
            : 'session';
          console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 20)}... (expires: ${expiryDate})`);
        });
        console.log('');
      }

      // Test cookie header generation
      const cookieHeader = await mtnSSOAuth.getCookieHeader();
      console.log('Cookie Header (first 100 chars):');
      console.log(`  ${cookieHeader?.substring(0, 100)}...`);
      console.log('');

      console.log('✅ Session cached successfully');
      console.log('   Cached at: .cache/mtn-session.json');
      console.log('');

      // Test re-authentication (should use cache)
      console.log('Testing cached session retrieval...');
      const cachedResult = await mtnSSOAuth.getAuthSession();
      if (cachedResult.success && cachedResult.sessionId === result.sessionId) {
        console.log('✅ Cached session retrieved successfully');
      } else {
        console.log('⚠️  Warning: Cached session retrieval failed or returned different session');
      }

    } else {
      console.log('❌ Status: FAILED');
      console.log('');
      console.log('Error Details:');
      console.log(`  ${result.error}`);
      console.log('');

      if (!manual) {
        console.log('💡 Tip: Try running with --manual flag:');
        console.log('   npx tsx scripts/test-mtn-sso-auth.ts --manual');
      }
    }

    console.log('');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('❌ Test Failed with Exception');
    console.error('='.repeat(60));
    console.error('');
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('');
    if (error instanceof Error && error.stack) {
      console.error('Stack Trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

async function testAPICall() {
  console.log('');
  console.log('='.repeat(60));
  console.log('Testing MTN API Call with Authentication');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Get authenticated session
    const authResult = await mtnSSOAuth.getAuthSession();

    if (!authResult.success) {
      console.error('❌ Cannot test API call - authentication failed');
      return;
    }

    const cookieHeader = await mtnSSOAuth.getCookieHeader();

    console.log('Making authenticated request to MTN Products API...');
    const response = await fetch(
      'https://asp-feasibility.mtnbusiness.co.za/api/v1/feasibility/product/wholesale/mns',
      {
        method: 'GET',
        headers: {
          'Cookie': cookieHeader || '',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://asp-feasibility.mtnbusiness.co.za/'
        }
      }
    );

    console.log(`Response Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful!');
      console.log('');
      console.log('Response Data:');
      console.log(JSON.stringify(data, null, 2).substring(0, 500) + '...');
    } else {
      const errorText = await response.text();
      console.log('❌ API call failed');
      console.log('Error:', errorText.substring(0, 200));
    }

  } catch (error) {
    console.error('❌ API call failed with exception:', error);
  }

  console.log('');
  console.log('='.repeat(60));
}

async function clearCache() {
  console.log('');
  console.log('='.repeat(60));
  console.log('Clearing MTN Session Cache');
  console.log('='.repeat(60));
  console.log('');

  await mtnSSOAuth.clearSession();
  console.log('✅ Session cache cleared');
  console.log('');
}

// Main execution
const args = process.argv.slice(2);
const isManual = args.includes('--manual');
const shouldClear = args.includes('--clear');
const shouldTestAPI = args.includes('--test-api');

(async () => {
  if (shouldClear) {
    await clearCache();
  }

  await testAuthentication(isManual);

  if (shouldTestAPI) {
    await testAPICall();
  }

  console.log('');
  console.log('Test complete!');
  console.log('');

  if (!shouldTestAPI) {
    console.log('💡 To test API call with auth, run:');
    console.log('   npx tsx scripts/test-mtn-sso-auth.ts --test-api');
    console.log('');
  }

  process.exit(0);
})();
