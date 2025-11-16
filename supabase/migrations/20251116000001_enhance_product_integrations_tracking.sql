-- Migration: Enhance product_integrations with separate CRM/Billing tracking
-- Date: 2025-11-16
-- Epic: 4.4 - Automated Daily Reconciliation (Phase 3)
--
-- Purpose:
-- - Add separate sync status tracking for CRM and Billing
-- - Add rate limit monitoring
-- - Add hardware item tracking for Billing
-- - Migrate existing data from legacy columns
-- - Maintain backward compatibility

-- ============================================================================
-- STEP 1: Add new columns
-- ============================================================================

-- Separate CRM sync tracking
ALTER TABLE product_integrations
  ADD COLUMN IF NOT EXISTS zoho_crm_sync_status TEXT
    CHECK (zoho_crm_sync_status IN ('pending', 'ok', 'failed')),
  ADD COLUMN IF NOT EXISTS zoho_crm_last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS zoho_crm_last_sync_error TEXT;

-- Separate Billing sync tracking
ALTER TABLE product_integrations
  ADD COLUMN IF NOT EXISTS zoho_billing_sync_status TEXT
    CHECK (zoho_billing_sync_status IN ('pending', 'ok', 'failed')),
  ADD COLUMN IF NOT EXISTS zoho_billing_last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS zoho_billing_last_sync_error TEXT;

-- Hardware item ID (separate from installation item)
ALTER TABLE product_integrations
  ADD COLUMN IF NOT EXISTS zoho_billing_hardware_item_id TEXT;

-- Rate limit tracking
ALTER TABLE product_integrations
  ADD COLUMN IF NOT EXISTS rate_limit_hits JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_rate_limit_at TIMESTAMPTZ;

-- ============================================================================
-- STEP 2: Migrate existing data from legacy columns
-- ============================================================================

-- Copy sync_status to both CRM and Billing status
-- Only update if the new columns are NULL (preserve any existing data)
UPDATE product_integrations
SET
  zoho_crm_sync_status = COALESCE(zoho_crm_sync_status, sync_status),
  zoho_billing_sync_status = COALESCE(zoho_billing_sync_status, sync_status),
  zoho_crm_last_synced_at = COALESCE(zoho_crm_last_synced_at, last_synced_at),
  zoho_billing_last_synced_at = COALESCE(zoho_billing_last_synced_at, last_synced_at),
  zoho_crm_last_sync_error = COALESCE(zoho_crm_last_sync_error, last_sync_error),
  zoho_billing_last_sync_error = COALESCE(zoho_billing_last_sync_error, last_sync_error)
WHERE
  sync_status IS NOT NULL
  OR last_synced_at IS NOT NULL
  OR last_sync_error IS NOT NULL;

-- ============================================================================
-- STEP 3: Add indexes for new columns
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_product_integrations_crm_sync_status
  ON product_integrations(zoho_crm_sync_status);

CREATE INDEX IF NOT EXISTS idx_product_integrations_billing_sync_status
  ON product_integrations(zoho_billing_sync_status);

CREATE INDEX IF NOT EXISTS idx_product_integrations_crm_last_synced
  ON product_integrations(zoho_crm_last_synced_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_integrations_billing_last_synced
  ON product_integrations(zoho_billing_last_synced_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_integrations_last_rate_limit
  ON product_integrations(last_rate_limit_at DESC);

-- ============================================================================
-- STEP 4: Add helper functions
-- ============================================================================

-- Function to record rate limit hits
CREATE OR REPLACE FUNCTION record_rate_limit_hit(
  p_service_package_id UUID,
  p_api_type TEXT,  -- 'oauth', 'crm', or 'billing'
  p_error_message TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_hit_record JSONB;
BEGIN
  -- Build hit record
  v_hit_record := jsonb_build_object(
    'timestamp', NOW(),
    'api_type', p_api_type,
    'error_message', p_error_message
  );

  -- Update product_integrations
  UPDATE product_integrations
  SET
    rate_limit_hits = COALESCE(rate_limit_hits, '[]'::jsonb) || v_hit_record,
    last_rate_limit_at = NOW()
  WHERE service_package_id = p_service_package_id;

  -- Log to zoho_sync_logs if table exists
  BEGIN
    INSERT INTO zoho_sync_logs (
      entity_type,
      entity_id,
      status,
      error_message,
      metadata
    ) VALUES (
      'service_package',
      p_service_package_id,
      'rate_limit',
      p_error_message,
      jsonb_build_object(
        'api_type', p_api_type,
        'hit_at', NOW()
      )
    );
  EXCEPTION
    WHEN undefined_table THEN
      NULL; -- zoho_sync_logs table doesn't exist yet
  END;
END;
$$;

-- Function to get products needing sync (used by daily sync RPC)
CREATE OR REPLACE FUNCTION get_sync_candidates(max_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  sku TEXT,
  name VARCHAR(100),  -- Changed from TEXT to match service_packages.name type
  status TEXT,
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT,
  zoho_crm_product_id TEXT,
  zoho_billing_plan_id TEXT,
  zoho_billing_item_id TEXT,
  zoho_crm_sync_status TEXT,
  zoho_billing_sync_status TEXT,
  zoho_crm_last_synced_at TIMESTAMPTZ,
  zoho_billing_last_synced_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_candidates AS (
    SELECT
      sp.id,
      sp.sku,
      sp.name,
      sp.status,
      pi.last_synced_at,
      pi.sync_status,
      pi.zoho_crm_product_id,
      pi.zoho_billing_plan_id,
      pi.zoho_billing_item_id,
      pi.zoho_crm_sync_status,
      pi.zoho_billing_sync_status,
      pi.zoho_crm_last_synced_at,
      pi.zoho_billing_last_synced_at,
      -- Priority scoring (lower = higher priority)
      CASE
        -- Failed syncs (CRM or Billing)
        WHEN pi.zoho_crm_sync_status = 'failed' OR pi.zoho_billing_sync_status = 'failed' THEN 1
        -- Never synced (no integration record)
        WHEN pi.id IS NULL THEN 2
        -- Stale CRM sync (> 24 hours)
        WHEN pi.zoho_crm_last_synced_at IS NOT NULL
          AND pi.zoho_crm_last_synced_at < NOW() - INTERVAL '24 hours' THEN 3
        -- Stale Billing sync (> 24 hours)
        WHEN pi.zoho_billing_last_synced_at IS NOT NULL
          AND pi.zoho_billing_last_synced_at < NOW() - INTERVAL '24 hours' THEN 3
        -- Legacy: Check old last_synced_at if new columns are NULL
        WHEN pi.last_synced_at IS NOT NULL
          AND pi.last_synced_at < NOW() - INTERVAL '24 hours' THEN 3
        ELSE 999 -- Not a candidate
      END AS priority
    FROM service_packages sp
    LEFT JOIN product_integrations pi ON pi.service_package_id = sp.id
    WHERE sp.status = 'active'
  )
  SELECT
    rc.id,
    rc.sku,
    rc.name,
    rc.status,
    rc.last_synced_at,
    rc.sync_status,
    rc.zoho_crm_product_id,
    rc.zoho_billing_plan_id,
    rc.zoho_billing_item_id,
    rc.zoho_crm_sync_status,
    rc.zoho_billing_sync_status,
    rc.zoho_crm_last_synced_at,
    rc.zoho_billing_last_synced_at
  FROM ranked_candidates rc
  WHERE rc.priority < 999
  ORDER BY rc.priority ASC, rc.id ASC
  LIMIT max_limit;
END;
$$;

-- ============================================================================
-- STEP 5: Add comments for new columns
-- ============================================================================

COMMENT ON COLUMN product_integrations.zoho_crm_sync_status IS 'Zoho CRM sync status: pending, ok, or failed';
COMMENT ON COLUMN product_integrations.zoho_crm_last_synced_at IS 'Timestamp of last CRM sync attempt';
COMMENT ON COLUMN product_integrations.zoho_crm_last_sync_error IS 'Last CRM sync error message, if any';

COMMENT ON COLUMN product_integrations.zoho_billing_sync_status IS 'Zoho Billing sync status: pending, ok, or failed';
COMMENT ON COLUMN product_integrations.zoho_billing_last_synced_at IS 'Timestamp of last Billing sync attempt';
COMMENT ON COLUMN product_integrations.zoho_billing_last_sync_error IS 'Last Billing sync error message, if any';

COMMENT ON COLUMN product_integrations.zoho_billing_hardware_item_id IS 'Zoho Billing Hardware Item ID (separate from installation item)';

COMMENT ON COLUMN product_integrations.rate_limit_hits IS 'Array of rate limit hit records with timestamp and API type';
COMMENT ON COLUMN product_integrations.last_rate_limit_at IS 'Timestamp of most recent rate limit hit';

-- ============================================================================
-- STEP 6: Deprecation notice for legacy columns
-- ============================================================================

-- Add comments to mark legacy columns as deprecated
COMMENT ON COLUMN product_integrations.sync_status IS 'DEPRECATED: Use zoho_crm_sync_status and zoho_billing_sync_status instead. Kept for backward compatibility.';
COMMENT ON COLUMN product_integrations.last_synced_at IS 'DEPRECATED: Use zoho_crm_last_synced_at and zoho_billing_last_synced_at instead. Kept for backward compatibility.';
COMMENT ON COLUMN product_integrations.last_sync_error IS 'DEPRECATED: Use zoho_crm_last_sync_error and zoho_billing_last_sync_error instead. Kept for backward compatibility.';

-- ============================================================================
-- Migration complete
-- ============================================================================
-- Next steps:
-- 1. Update sync services to use new columns
-- 2. Update daily-sync-service.ts to check both CRM and Billing status
-- 3. Test with existing data
-- 4. In future migration: Remove deprecated columns (sync_status, last_synced_at, last_sync_error)
