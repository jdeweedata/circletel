/**
 * Zoho Authentication Test Script
 * Tests OAuth token refresh with detailed error reporting
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
const ZOHO_REGION = process.env.ZOHO_REGION || 'US';

// Region-specific accounts URL mapping
const getAccountsUrl = (region) => {
  const regionMap = {
    US: '',
    EU: '.eu',
    IN: '.in',
    AU: '.com.au',
    CN: '.com.cn',
  };

  const suffix = regionMap[region] || '';
  return `https://accounts.zoho${suffix}.com`;
};

async function testZohoAuth() {
  console.log('='.repeat(60));
  console.log('ZOHO AUTHENTICATION TEST');
  console.log('='.repeat(60));
  console.log();

  // Step 1: Verify credentials are present
  console.log('Step 1: Verifying credentials...');
  console.log(`  Client ID: ${ZOHO_CLIENT_ID ? '✓ Present' : '✗ Missing'}`);
  console.log(`  Client Secret: ${ZOHO_CLIENT_SECRET ? '✓ Present' : '✗ Missing'}`);
  console.log(`  Refresh Token: ${ZOHO_REFRESH_TOKEN ? '✓ Present' : '✗ Missing'}`);
  console.log(`  Region: ${ZOHO_REGION}`);
  console.log();

  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    console.error('ERROR: Missing required Zoho credentials');
    process.exit(1);
  }

  // Step 2: Test token refresh
  console.log('Step 2: Testing OAuth token refresh...');
  const accountsUrl = getAccountsUrl(ZOHO_REGION);
  console.log(`  Accounts URL: ${accountsUrl}/oauth/v2/token`);
  console.log();

  try {
    // Build params - include redirect_uri if available
    const params = {
      grant_type: 'refresh_token',
      refresh_token: ZOHO_REFRESH_TOKEN,
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
    };

    const redirectUri = process.env.ZOHO_REDIRECT_URI;
    if (redirectUri) {
      params.redirect_uri = redirectUri;
    }

    const response = await fetch(`${accountsUrl}/oauth/v2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params),
    });

    console.log(`  Response Status: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('  ERROR: Invalid JSON response');
      console.error('  Response:', responseText);
      process.exit(1);
    }

    // Check for error in response body (Zoho returns 200 with error object)
    if (!response.ok || data.error) {
      console.log();
      console.error('ERROR: Token refresh failed');
      console.error('Response:', JSON.stringify(data, null, 2));
      console.log();

      // Provide helpful diagnostics
      if (data.error === 'invalid_client') {
        console.log('DIAGNOSIS: invalid_client error');
        console.log('Common causes:');
        console.log('  1. Client ID or Client Secret is incorrect');
        console.log('  2. OAuth client was created in a different region');
        console.log('  3. OAuth client has been revoked or deleted');
        console.log();
        console.log('Solutions:');
        console.log('  1. Verify credentials in Zoho API Console:');
        console.log('     https://api-console.zoho.com/');
        console.log('  2. Check if you log into Zoho with a different domain:');
        console.log('     - US: crm.zoho.com → ZOHO_REGION=US');
        console.log('     - EU: crm.zoho.eu → ZOHO_REGION=EU');
        console.log('     - IN: crm.zoho.in → ZOHO_REGION=IN');
        console.log('  3. Regenerate OAuth credentials if needed');
      } else if (data.error === 'invalid_code') {
        console.log('DIAGNOSIS: Refresh token is invalid or expired');
        console.log('Solution: Generate a new refresh token in Zoho API Console');
      }

      process.exit(1);
    }

    // Success!
    console.log();
    console.log('✓ Token refresh successful!');
    console.log();
    console.log('Token Details:');

    if (data.access_token) {
      console.log(`  Access Token: ${data.access_token.substring(0, 20)}...`);
    } else {
      console.log('  Access Token: (not in expected format)');
      console.log('  Full Response:', JSON.stringify(data, null, 2));
    }

    if (data.expires_in) {
      console.log(`  Expires In: ${data.expires_in} seconds (${Math.floor(data.expires_in / 60)} minutes)`);
    }

    if (data.token_type) {
      console.log(`  Token Type: ${data.token_type}`);
    }

    if (data.api_domain) {
      console.log(`  API Domain: ${data.api_domain}`);
    }

    console.log();
    console.log('='.repeat(60));
    console.log('SUCCESS: Zoho authentication is working correctly!');
    console.log('='.repeat(60));

  } catch (error) {
    console.log();
    console.error('ERROR: Failed to test Zoho authentication');
    console.error('Details:', error.message);
    console.error();
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testZohoAuth().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
