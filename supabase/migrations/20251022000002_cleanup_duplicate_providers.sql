-- =====================================================
-- Cleanup Duplicate Provider Entries
-- Created: 2025-10-22
-- Purpose: Remove duplicate DFA entry and fix NULL provider_codes
-- =====================================================

-- Step 1: Delete duplicate DFA entry (the one with priority 99)
DELETE FROM fttb_network_providers
WHERE display_name = 'Dark Fibre Africa'
  AND (priority = 99 OR provider_code IS NULL);

-- Step 2: Update MTN providers to have proper provider_codes
-- MTN Business (WMS)
UPDATE fttb_network_providers
SET
  provider_code = 'mtn_business',
  service_offerings = '["fibre","wireless"]'::jsonb,
  updated_at = NOW()
WHERE display_name = 'MTN Business (WMS)'
  AND provider_code IS NULL;

-- MTN Consumer
UPDATE fttb_network_providers
SET
  provider_code = 'mtn_consumer',
  service_offerings = '["fibre","wireless","5g","lte"]'::jsonb,
  updated_at = NOW()
WHERE display_name = 'MTN Consumer'
  AND provider_code IS NULL;

-- Step 3: Verify cleanup
SELECT
  provider_code,
  display_name,
  active,
  priority,
  service_offerings,
  coverage_source,
  coverage_api_type
FROM fttb_network_providers
WHERE active = true
ORDER BY priority;

-- Step 4: Verify no NULL provider_codes remain
SELECT
  COUNT(*) as null_provider_codes
FROM fttb_network_providers
WHERE provider_code IS NULL;
