-- ============================================================================
-- Fix: Delete placeholder OAuth tokens and insert actual credentials
-- ============================================================================

-- Step 1: Delete existing placeholder rows
DELETE FROM integration_oauth_tokens
WHERE integration_slug IN ('zoho-crm', 'zoho-billing', 'zoho-sign');

-- Step 2: Insert actual Zoho CRM OAuth Token
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
  '1000.VTYBCTZDCMNAABFD7R91IG2KPLGVRO',
  '13e418a304edeaaf1d4fd99dcf08c488c739dd9e86',
  'https://accounts.zoho.com/oauth/v2/auth',
  'https://accounts.zoho.com/oauth/v2/token',
  ARRAY['ZohoCRM.modules.ALL', 'ZohoCRM.settings.ALL', 'ZohoCRM.users.READ', 'ZohoCRM.org.READ'],
  '1000.031e47fb8fa6319fa76b79e6f8d50aab.6979006c161f5b02dbc3845c59345895',
  'Bearer',
  true
);

-- Step 3: Insert actual Zoho Billing OAuth Token
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
  '1000.VTYBCTZDCMNAABFD7R91IG2KPLGVRO',
  '13e418a304edeaaf1d4fd99dcf08c488c739dd9e86',
  'https://accounts.zoho.com/oauth/v2/auth',
  'https://accounts.zoho.com/oauth/v2/token',
  ARRAY['ZohoSubscriptions.subscriptions.ALL', 'ZohoSubscriptions.invoices.ALL', 'ZohoSubscriptions.customers.ALL', 'ZohoSubscriptions.plans.ALL', 'ZohoSubscriptions.products.ALL'],
  '1000.031e47fb8fa6319fa76b79e6f8d50aab.6979006c161f5b02dbc3845c59345895',
  'Bearer',
  true
);

-- Step 4: Insert actual Zoho Sign OAuth Token
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
  '1000.VTYBCTZDCMNAABFD7R91IG2KPLGVRO',
  '13e418a304edeaaf1d4fd99dcf08c488c739dd9e86',
  'https://accounts.zoho.com/oauth/v2/auth',
  'https://accounts.zoho.com/oauth/v2/token',
  ARRAY['ZohoSign.documents.ALL', 'ZohoSign.templates.ALL', 'ZohoSign.account.READ'],
  '1000.031e47fb8fa6319fa76b79e6f8d50aab.6979006c161f5b02dbc3845c59345895',
  'Bearer',
  true
);

-- ============================================================================
-- Verification: Check that actual credentials were inserted
-- ============================================================================
SELECT
  integration_slug,
  SUBSTRING(client_id, 1, 15) || '...' as client_id_preview,
  LENGTH(client_id) as client_id_length,
  LENGTH(client_secret) as client_secret_length,
  LENGTH(refresh_token) as refresh_token_length,
  SUBSTRING(refresh_token, 1, 20) || '...' as refresh_token_preview,
  array_length(scopes, 1) as scopes_count,
  is_active,
  created_at
FROM integration_oauth_tokens
WHERE integration_slug IN ('zoho-crm', 'zoho-billing', 'zoho-sign')
ORDER BY integration_slug;
