-- Migration: Migrate Zoho OAuth tokens from environment variables to integration_oauth_tokens
-- Purpose: Move Zoho refresh tokens from env vars to centralized OAuth token management
-- Date: 2025-11-16
-- Prerequisite: Must run after 20251116120000_create_integration_management_system.sql

-- ============================================================================
-- MANUAL STEP REQUIRED AFTER THIS MIGRATION:
-- ============================================================================
-- After running this migration, you must manually insert OAuth tokens using:
--
-- INSERT INTO integration_oauth_tokens (
--   integration_slug,
--   client_id,
--   client_secret,
--   auth_url,
--   token_url,
--   scopes,
--   refresh_token,
--   is_active,
--   created_by
-- )
-- VALUES (
--   'zoho-crm',
--   '<ZOHO_CLIENT_ID>',  -- From env var
--   '<ZOHO_CLIENT_SECRET>',  -- From env var (will be encrypted in app)
--   'https://accounts.zoho.com/oauth/v2/auth',
--   'https://accounts.zoho.com/oauth/v2/token',
--   ARRAY['ZohoCRM.modules.ALL', 'ZohoCRM.users.READ'],
--   '<ZOHO_REFRESH_TOKEN>',  -- From env var (will be encrypted in app)
--   true,
--   NULL  -- Will be set by service role
-- );
--
-- INSERT INTO integration_oauth_tokens (
--   integration_slug,
--   client_id,
--   client_secret,
--   auth_url,
--   token_url,
--   scopes,
--   refresh_token,
--   is_active,
--   created_by
-- )
-- VALUES (
--   'zoho-billing',
--   '<ZOHO_CLIENT_ID>',  -- Same client for all Zoho services
--   '<ZOHO_CLIENT_SECRET>',
--   'https://accounts.zoho.com/oauth/v2/auth',
--   'https://accounts.zoho.com/oauth/v2/token',
--   ARRAY['ZohoSubscriptions.subscriptions.ALL', 'ZohoSubscriptions.invoices.ALL'],
--   '<ZOHO_REFRESH_TOKEN>',  -- Same token for all Zoho services
--   true,
--   NULL
-- );
--
-- INSERT INTO integration_oauth_tokens (
--   integration_slug,
--   client_id,
--   client_secret,
--   auth_url,
--   token_url,
--   scopes,
--   refresh_token,
--   is_active,
--   created_by
-- )
-- VALUES (
--   'zoho-sign',
--   '<ZOHO_CLIENT_ID>',
--   '<ZOHO_CLIENT_SECRET>',
--   'https://accounts.zoho.com/oauth/v2/auth',
--   'https://accounts.zoho.com/oauth/v2/token',
--   ARRAY['ZohoSign.documents.ALL', 'ZohoSign.templates.ALL'],
--   '<ZOHO_REFRESH_TOKEN>',
--   true,
--   NULL
-- );
-- ============================================================================

-- Function: Get integration OAuth token for a specific integration
-- Usage: SELECT * FROM get_integration_oauth_token('zoho-crm');
CREATE OR REPLACE FUNCTION get_integration_oauth_token(p_integration_slug TEXT)
RETURNS TABLE (
  id UUID,
  integration_slug TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    iot.id,
    iot.integration_slug,
    iot.access_token,
    iot.refresh_token,
    iot.expires_at,
    iot.is_active
  FROM integration_oauth_tokens iot
  WHERE iot.integration_slug = p_integration_slug
  AND iot.is_active = true
  ORDER BY iot.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update OAuth access token after refresh
-- Usage: SELECT update_oauth_access_token('zoho-crm', 'new_access_token', NOW() + INTERVAL '1 hour');
CREATE OR REPLACE FUNCTION update_oauth_access_token(
  p_integration_slug TEXT,
  p_access_token TEXT,
  p_expires_at TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  UPDATE integration_oauth_tokens
  SET
    access_token = p_access_token,
    expires_at = p_expires_at,
    last_refreshed_at = NOW(),
    refresh_count = refresh_count + 1,
    consecutive_failures = 0,  -- Reset failures on success
    last_error = NULL,
    last_error_at = NULL,
    updated_at = NOW()
  WHERE integration_slug = p_integration_slug
  AND is_active = true;

  v_updated := FOUND;

  -- Log activity
  IF v_updated THEN
    PERFORM log_integration_activity(
      p_integration_slug,
      'oauth_token_refreshed',
      'Access token refreshed successfully',
      NULL,  -- System action
      'success',
      NULL
    );
  END IF;

  RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Record OAuth token refresh failure
-- Usage: SELECT record_oauth_failure('zoho-crm', 'Token refresh failed: invalid_grant');
CREATE OR REPLACE FUNCTION record_oauth_failure(
  p_integration_slug TEXT,
  p_error_message TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN;
  v_consecutive_failures INTEGER;
BEGIN
  UPDATE integration_oauth_tokens
  SET
    last_error = p_error_message,
    last_error_at = NOW(),
    consecutive_failures = consecutive_failures + 1,
    updated_at = NOW()
  WHERE integration_slug = p_integration_slug
  AND is_active = true
  RETURNING consecutive_failures INTO v_consecutive_failures;

  v_updated := FOUND;

  -- Log activity
  IF v_updated THEN
    PERFORM log_integration_activity(
      p_integration_slug,
      'oauth_token_refreshed',
      format('Access token refresh failed (attempt %s)', v_consecutive_failures),
      NULL,  -- System action
      'failed',
      p_error_message
    );

    -- Update integration health if too many failures
    IF v_consecutive_failures >= 3 THEN
      UPDATE integration_registry
      SET
        health_status = 'down',
        last_health_check_at = NOW()
      WHERE slug = p_integration_slug;
    END IF;
  END IF;

  RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Record rate limit hit with cooldown
-- Usage: SELECT record_oauth_rate_limit('zoho-crm', INTERVAL '5 minutes');
CREATE OR REPLACE FUNCTION record_oauth_rate_limit(
  p_integration_slug TEXT,
  p_cooldown_duration INTERVAL DEFAULT INTERVAL '5 minutes'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN;
  v_cooldown_until TIMESTAMPTZ;
BEGIN
  v_cooldown_until := NOW() + p_cooldown_duration;

  UPDATE integration_oauth_tokens
  SET
    rate_limit_cooldown_until = v_cooldown_until,
    rate_limit_hits = rate_limit_hits || jsonb_build_object('timestamp', NOW()),
    updated_at = NOW()
  WHERE integration_slug = p_integration_slug
  AND is_active = true;

  v_updated := FOUND;

  -- Log activity
  IF v_updated THEN
    PERFORM log_integration_activity(
      p_integration_slug,
      'oauth_token_refreshed',
      format('Rate limit hit. Cooldown until %s', v_cooldown_until),
      NULL,
      'partial',
      'Too many OAuth refresh requests'
    );

    -- Update integration health
    UPDATE integration_registry
    SET
      health_status = 'degraded',
      last_health_check_at = NOW()
    WHERE slug = p_integration_slug;
  END IF;

  RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- POST-MIGRATION CHECKLIST
-- ============================================================================
-- 1. Run the INSERT statements above with your actual Zoho credentials
-- 2. Verify tokens exist: SELECT * FROM integration_oauth_tokens;
-- 3. Update lib/integrations/zoho/auth-service.ts to use new table
-- 4. Remove ZOHO_REFRESH_TOKEN from environment variables (keep as backup)
-- 5. Test OAuth token refresh flow
-- ============================================================================

COMMENT ON FUNCTION get_integration_oauth_token IS 'Retrieve active OAuth token for an integration';
COMMENT ON FUNCTION update_oauth_access_token IS 'Update access token after successful OAuth refresh';
COMMENT ON FUNCTION record_oauth_failure IS 'Record OAuth token refresh failure and update health status';
COMMENT ON FUNCTION record_oauth_rate_limit IS 'Record rate limit hit with cooldown period';
