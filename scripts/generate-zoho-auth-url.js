/**
 * Generate Zoho OAuth Authorization URL
 *
 * Generates the URL to authorize Zoho API access with all required scopes
 * including Payments API
 *
 * Usage:
 *   node scripts/generate-zoho-auth-url.js
 */

const CLIENT_ID = '1000.VTYBCTZDCMNAABFD7R91IG2KPLGVRO';
const REDIRECT_URI = 'https://circletel.co.za/api/integrations/zoho/callback';

// All required scopes for CircleTel Zoho Billing integration
const SCOPES = [
  // CRM scopes
  'ZohoCRM.modules.ALL',
  'ZohoCRM.settings.ALL',

  // Billing/Subscriptions scopes
  'ZohoSubscriptions.products.ALL',      // ← CRITICAL: Required for Products API
  'ZohoSubscriptions.plans.ALL',
  'ZohoSubscriptions.items.ALL',
  'ZohoSubscriptions.subscriptions.ALL',
  'ZohoSubscriptions.customers.ALL',
  'ZohoSubscriptions.invoices.ALL',
  'ZohoSubscriptions.payments.CREATE',   // ← NEW: Required for recording payments
  'ZohoSubscriptions.payments.READ',     // ← NEW: Required for reading payment details
  'ZohoSubscriptions.payments.UPDATE',   // ← NEW: Required for updating payments
  'ZohoSubscriptions.settings.ALL',
];

const scopeParam = SCOPES.join(',');

const authUrl = `https://accounts.zoho.com/oauth/v2/auth?scope=${encodeURIComponent(scopeParam)}&client_id=${CLIENT_ID}&response_type=code&access_type=offline&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  Zoho OAuth Authorization URL Generator');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('STEP 1: Visit this URL to authorize Zoho API access');
console.log('───────────────────────────────────────────────────────────');
console.log('');
console.log(authUrl);
console.log('');
console.log('STEP 2: After authorization, you will be redirected to:');
console.log('───────────────────────────────────────────────────────────');
console.log('');
console.log(`${REDIRECT_URI}?code=AUTHORIZATION_CODE`);
console.log('');
console.log('STEP 3: Copy the authorization code from the URL');
console.log('───────────────────────────────────────────────────────────');
console.log('');
console.log('Look for the "code" parameter in the redirect URL');
console.log('');
console.log('STEP 4: Exchange the code for a refresh token');
console.log('───────────────────────────────────────────────────────────');
console.log('');
console.log('Run: node scripts/exchange-zoho-token.js <AUTHORIZATION_CODE>');
console.log('');
console.log('STEP 5: Update .env.local with the new ZOHO_REFRESH_TOKEN');
console.log('───────────────────────────────────────────────────────────');
console.log('');
console.log('STEP 6: Update Vercel environment variable');
console.log('───────────────────────────────────────────────────────────');
console.log('');
console.log('Run: echo "NEW_REFRESH_TOKEN" | vercel env add ZOHO_REFRESH_TOKEN production');
console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  Scopes Included:');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
SCOPES.forEach(scope => {
  const isNew = scope.includes('payments');
  console.log(`  ${isNew ? '✨ NEW: ' : '        '}${scope}`);
});
console.log('');
