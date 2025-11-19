-- Insert Zoho OAuth Tokens into integration_oauth_tokens
-- Purpose: Migrate Zoho OAuth credentials from environment variables to centralized table
-- Date: 2025-11-16
--
-- INSTRUCTIONS:
-- 1. Replace <ZOHO_CLIENT_ID> with your actual Zoho Client ID
-- 2. Replace <ZOHO_CLIENT_SECRET> with your actual Zoho Client Secret
-- 3. Replace <ZOHO_REFRESH_TOKEN> with your actual Zoho Refresh Token
-- 4. Execute this SQL in Supabase SQL Editor

-- ============================================================================
-- Zoho CRM OAuth Token
-- ============================================================================
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
  '<ZOHO_CLIENT_ID>',  -- Replace with env.ZOHO_CLIENT_ID
  '<ZOHO_CLIENT_SECRET>',  -- Replace with env.ZOHO_CLIENT_SECRET
  'https://accounts.zoho.com/oauth/v2/auth',
  'https://accounts.zoho.com/oauth/v2/token',
  ARRAY[
    'ZohoCRM.modules.ALL',
    'ZohoCRM.settings.ALL',
    'ZohoCRM.users.READ',
    'ZohoCRM.org.READ'
  ],
  '<ZOHO_REFRESH_TOKEN>',  -- Replace with env.ZOHO_REFRESH_TOKEN (the new one: 1000.cfb6da93...)
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
-- Zoho Billing OAuth Token
-- ============================================================================
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
  '<ZOHO_CLIENT_ID>',  -- Same client for all Zoho services
  '<ZOHO_CLIENT_SECRET>',
  'https://accounts.zoho.com/oauth/v2/auth',
  'https://accounts.zoho.com/oauth/v2/token',
  ARRAY[
    'ZohoSubscriptions.subscriptions.ALL',
    'ZohoSubscriptions.invoices.ALL',
    'ZohoSubscriptions.customers.ALL',
    'ZohoSubscriptions.plans.ALL',
    'ZohoSubscriptions.products.ALL'
  ],
  '<ZOHO_REFRESH_TOKEN>',  -- Same token for all Zoho services
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
-- Zoho Sign OAuth Token
-- ============================================================================
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
  '<ZOHO_CLIENT_ID>',
  '<ZOHO_CLIENT_SECRET>',
  'https://accounts.zoho.com/oauth/v2/auth',
  'https://accounts.zoho.com/oauth/v2/token',
  ARRAY[
    'ZohoSign.documents.ALL',
    'ZohoSign.templates.ALL',
    'ZohoSign.account.READ'
  ],
  '<ZOHO_REFRESH_TOKEN>',
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
