/**
 * Debug script to check for credential issues (whitespace, encoding, etc.)
 */

require('dotenv').config({ path: '.env.local' });

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
const ZOHO_REDIRECT_URI = process.env.ZOHO_REDIRECT_URI;

console.log('='.repeat(70));
console.log('ZOHO CREDENTIALS DEBUG');
console.log('='.repeat(70));
console.log();

// Check for whitespace issues
function checkForWhitespace(name, value) {
  if (!value) {
    console.log(`❌ ${name}: MISSING`);
    return;
  }

  const hasLeadingSpace = value !== value.trimStart();
  const hasTrailingSpace = value !== value.trimEnd();
  const hasInternalSpace = value.includes(' ');

  console.log(`✓ ${name}:`);
  console.log(`  Length: ${value.length}`);
  console.log(`  Leading whitespace: ${hasLeadingSpace ? '⚠️  YES' : '✓ No'}`);
  console.log(`  Trailing whitespace: ${hasTrailingSpace ? '⚠️  YES' : '✓ No'}`);
  console.log(`  Internal spaces: ${hasInternalSpace ? '⚠️  YES' : '✓ No'}`);
  console.log(`  First 30 chars: "${value.substring(0, 30)}..."`);
  console.log();
}

checkForWhitespace('ZOHO_CLIENT_ID', ZOHO_CLIENT_ID);
checkForWhitespace('ZOHO_CLIENT_SECRET', ZOHO_CLIENT_SECRET);
checkForWhitespace('ZOHO_REFRESH_TOKEN', ZOHO_REFRESH_TOKEN);
checkForWhitespace('ZOHO_REDIRECT_URI', ZOHO_REDIRECT_URI);

// Now test with exact same request as curl
async function testWithExactCredentials() {
  console.log('='.repeat(70));
  console.log('TESTING WITH TRIMMED CREDENTIALS');
  console.log('='.repeat(70));
  console.log();

  const clientId = ZOHO_CLIENT_ID?.trim();
  const clientSecret = ZOHO_CLIENT_SECRET?.trim();
  const refreshToken = ZOHO_REFRESH_TOKEN?.trim();
  const redirectUri = ZOHO_REDIRECT_URI?.trim() || 'https://circletel.co.za/api/integrations/zoho/callback';

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  console.log('Request Details:');
  console.log(`  URL: https://accounts.zoho.com/oauth/v2/token`);
  console.log(`  Method: POST`);
  console.log(`  Content-Type: application/x-www-form-urlencoded`);
  console.log();
  console.log('Body parameters:');
  console.log(`  grant_type: refresh_token`);
  console.log(`  refresh_token: ${refreshToken.substring(0, 30)}...`);
  console.log(`  client_id: ${clientId}`);
  console.log(`  client_secret: ${clientSecret.substring(0, 20)}...`);
  console.log();

  try {
    const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    console.log(`Response Status: ${response.status}`);

    const data = await response.json();

    if (data.access_token) {
      console.log('✅ SUCCESS! Token obtained');
      console.log();
      console.log('Response:');
      console.log(`  Access Token: ${data.access_token.substring(0, 30)}...`);
      console.log(`  Expires In: ${data.expires_in}s`);
      console.log(`  API Domain: ${data.api_domain}`);
      console.log(`  Token Type: ${data.token_type}`);
    } else {
      console.log('❌ FAILED');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testWithExactCredentials();
