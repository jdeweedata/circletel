-- Quick fix for get_sync_candidates function type mismatch
-- Run this in Supabase SQL Editor to fix the function

-- Drop the existing function first (required when changing return type)
DROP FUNCTION IF EXISTS get_sync_candidates(integer);

-- Recreate with correct return type
CREATE OR REPLACE FUNCTION get_sync_candidates(max_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  sku TEXT,
  name VARCHAR(100),  -- Fixed: Changed from TEXT to VARCHAR(100)
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

-- Test the function
SELECT sku, name, zoho_crm_sync_status, zoho_billing_sync_status
FROM get_sync_candidates(5);
