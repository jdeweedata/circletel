/**
 * Exchange Zoho OAuth Authorization Code for Refresh Token
 *
 * This script exchanges an authorization code for access and refresh tokens
 *
 * Usage:
 *   node scripts/exchange-zoho-token.js <authorization_code>
 */

const https = require('https');

// Get authorization code from command line
const authCode = process.argv[2];

if (!authCode) {
  console.error('❌ Error: Authorization code is required');
  console.error('Usage: node scripts/exchange-zoho-token.js <authorization_code>');
  process.exit(1);
}

// Zoho OAuth credentials
const CLIENT_ID = '1000.VTYBCTZDCMNAABFD7R91IG2KPLGVRO';
const CLIENT_SECRET = '13e418a304edeaaf1d4fd99dcf08c488c739dd9e86';
const REDIRECT_URI = 'https://circletel.co.za/api/integrations/zoho/callback';

// Build request parameters
const params = new URLSearchParams({
  grant_type: 'authorization_code',
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET,
  redirect_uri: REDIRECT_URI,
  code: authCode,
});

const postData = params.toString();

const options = {
  hostname: 'accounts.zoho.com',
  port: 443,
  path: '/oauth/v2/token',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
  },
};

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  Exchanging Authorization Code for Refresh Token');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('Authorization Code:', authCode);
console.log('');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    console.log('');

    try {
      const response = JSON.parse(data);

      if (res.statusCode === 200) {
        console.log('✅ Success! Token Exchange Complete');
        console.log('');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('  OAuth Tokens');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        console.log('Access Token:', response.access_token);
        console.log('Refresh Token:', response.refresh_token);
        console.log('Expires In:', response.expires_in, 'seconds');
        console.log('Token Type:', response.token_type);
        console.log('');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('  Update .env.local');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        console.log('Copy this line to your .env.local file:');
        console.log('');
        console.log(`ZOHO_REFRESH_TOKEN=${response.refresh_token}`);
        console.log('');
        console.log('This refresh token includes scopes for:');
        console.log('  - ZohoCRM.modules.ALL');
        console.log('  - ZohoCRM.settings.ALL');
        console.log('  - ZohoSubscriptions.plans.ALL');
        console.log('  - ZohoSubscriptions.items.ALL');
        console.log('  - ZohoSubscriptions.subscriptions.ALL');
        console.log('  - ZohoSubscriptions.customers.ALL');
        console.log('  - ZohoSubscriptions.invoices.ALL');
        console.log('  - ZohoSubscriptions.settings.ALL');
        console.log('');
      } else {
        console.error('❌ Error: Token exchange failed');
        console.error('');
        console.error('Error Code:', response.error);
        console.error('Error Message:', response.error_description || response.message);
        console.error('');
        console.error('Full Response:', JSON.stringify(response, null, 2));
        console.error('');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error: Failed to parse response');
      console.error('');
      console.error('Raw Response:', data);
      console.error('');
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error: Request failed');
  console.error('');
  console.error(error);
  console.error('');
  process.exit(1);
});

req.write(postData);
req.end();
