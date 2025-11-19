/**
 * Script: Generate Zoho OAuth Token INSERT statements
 * Purpose: Creates SQL INSERT statements with actual credentials from environment
 *
 * Usage: node scripts/generate-zoho-oauth-insert.js
 * Output: SQL statements ready to paste into Supabase SQL Editor
 */

require('dotenv').config({ path: '.env.local' });

const clientId = process.env.ZOHO_CLIENT_ID;
const clientSecret = process.env.ZOHO_CLIENT_SECRET;
const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

if (!clientId || !clientSecret || !refreshToken) {
  console.error('❌ Missing required Zoho credentials in environment:');
  console.error(`   ZOHO_CLIENT_ID: ${clientId ? '✅ Found' : '❌ Missing'}`);
  console.error(`   ZOHO_CLIENT_SECRET: ${clientSecret ? '✅ Found' : '❌ Missing'}`);
  console.error(`   ZOHO_REFRESH_TOKEN: ${refreshToken ? '✅ Found' : '❌ Missing'}`);
  console.error('\nPlease ensure these are set in your .env.local file');
  process.exit(1);
}

console.log('🔐 Found Zoho credentials:');
console.log(`   Client ID: ${clientId.slice(0, 20)}...`);
console.log(`   Client Secret: ${clientSecret.slice(0, 20)}...`);
console.log(`   Refresh Token: ${refreshToken.slice(0, 30)}...`);
console.log('');

const sql = `
-- ============================================================================
-- Insert Zoho OAuth Tokens into integration_oauth_tokens
-- Generated: ${new Date().toISOString()}
-- IMPORTANT: These credentials are sensitive! Do NOT commit this output.
-- ============================================================================

-- Zoho CRM OAuth Token
INSERT INTO integration_oauth_tokens (
  integration_slug,
  client_id,
  client_secret,
  auth_url,
  token_url,
  scopes,
  refresh_token,
  token_type,
  is_active
)
VALUES (
  'zoho-crm',
  '${clientId}',
  '${clientSecret}',
  'https://accounts.zoho.com/oauth/v2/auth',
  'https://accounts.zoho.com/oauth/v2/token',
  ARRAY[
    'ZohoCRM.modules.ALL',
    'ZohoCRM.settings.ALL',
    'ZohoCRM.users.READ',
    'ZohoCRM.org.READ'
  ],
  '${refreshToken}',
  'Bearer',
  true
)
ON CONFLICT (integration_slug, is_active) DO UPDATE SET
  client_id = EXCLUDED.client_id,
  client_secret = EXCLUDED.client_secret,
  refresh_token = EXCLUDED.refresh_token,
  scopes = EXCLUDED.scopes,
  updated_at = NOW();

-- Zoho Billing OAuth Token
INSERT INTO integration_oauth_tokens (
  integration_slug,
  client_id,
  client_secret,
  auth_url,
  token_url,
  scopes,
  refresh_token,
  token_type,
  is_active
)
VALUES (
  'zoho-billing',
  '${clientId}',
  '${clientSecret}',
  'https://accounts.zoho.com/oauth/v2/auth',
  'https://accounts.zoho.com/oauth/v2/token',
  ARRAY[
    'ZohoSubscriptions.subscriptions.ALL',
    'ZohoSubscriptions.invoices.ALL',
    'ZohoSubscriptions.customers.ALL',
    'ZohoSubscriptions.plans.ALL',
    'ZohoSubscriptions.products.ALL'
  ],
  '${refreshToken}',
  'Bearer',
  true
)
ON CONFLICT (integration_slug, is_active) DO UPDATE SET
  client_id = EXCLUDED.client_id,
  client_secret = EXCLUDED.client_secret,
  refresh_token = EXCLUDED.refresh_token,
  scopes = EXCLUDED.scopes,
  updated_at = NOW();

-- Zoho Sign OAuth Token
INSERT INTO integration_oauth_tokens (
  integration_slug,
  client_id,
  client_secret,
  auth_url,
  token_url,
  scopes,
  refresh_token,
  token_type,
  is_active
)
VALUES (
  'zoho-sign',
  '${clientId}',
  '${clientSecret}',
  'https://accounts.zoho.com/oauth/v2/auth',
  'https://accounts.zoho.com/oauth/v2/token',
  ARRAY[
    'ZohoSign.documents.ALL',
    'ZohoSign.templates.ALL',
    'ZohoSign.account.READ'
  ],
  '${refreshToken}',
  'Bearer',
  true
)
ON CONFLICT (integration_slug, is_active) DO UPDATE SET
  client_id = EXCLUDED.client_id,
  client_secret = EXCLUDED.client_secret,
  refresh_token = EXCLUDED.refresh_token,
  scopes = EXCLUDED.scopes,
  updated_at = NOW();

-- ============================================================================
-- Verify Insertion
-- ============================================================================
SELECT
  integration_slug,
  client_id,
  LENGTH(client_secret) as client_secret_length,
  LENGTH(refresh_token) as refresh_token_length,
  scopes,
  is_active,
  created_at
FROM integration_oauth_tokens
ORDER BY integration_slug;
`;

console.log('📋 SQL INSERT Statements:\n');
console.log('═══════════════════════════════════════════════════════════════════');
console.log(sql);
console.log('═══════════════════════════════════════════════════════════════════\n');

console.log('📝 Next Steps:');
console.log('   1. Copy the SQL statements above');
console.log('   2. Open Supabase SQL Editor: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql');
console.log('   3. Paste and execute the SQL');
console.log('   4. Verify the results show 3 rows inserted (zoho-billing, zoho-crm, zoho-sign)');
console.log('');
