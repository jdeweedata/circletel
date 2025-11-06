-- =====================================================================
-- Fix SkyFibre Product Category Mismatch
-- =====================================================================
-- Description: Update SkyFibre packages from 'connectivity' to 'wireless'
--              to match service_type_mapping configuration
-- Issue: SkyFibre Home Lite and Home Plus not showing on packages page
--        because product_category doesn't match the mapping
-- =====================================================================

-- Root Cause Analysis:
-- 1. MTN coverage check returns technical service types: ['5g', 'uncapped_wireless']
-- 2. service_type_mapping maps 'uncapped_wireless' → 'wireless' product_category
-- 3. API filters packages WHERE product_category IN ('wireless')
-- 4. But some SkyFibre packages have product_category = 'connectivity' (not mapped!)
-- 5. Result: Only packages with product_category='wireless' are returned

-- Log current state for audit trail
DO $$
DECLARE
  connectivity_count INTEGER;
  wireless_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO connectivity_count
  FROM service_packages
  WHERE service_type = 'SkyFibre'
    AND product_category = 'connectivity'
    AND customer_type = 'consumer';

  SELECT COUNT(*) INTO wireless_count
  FROM service_packages
  WHERE service_type = 'SkyFibre'
    AND product_category = 'wireless'
    AND customer_type = 'consumer';

  RAISE NOTICE 'Before fix: % SkyFibre packages with connectivity, % with wireless',
    connectivity_count, wireless_count;
END $$;

-- Update all SkyFibre consumer packages to use 'wireless' category
UPDATE service_packages
SET
  product_category = 'wireless',
  updated_at = NOW()
WHERE service_type = 'SkyFibre'
  AND product_category = 'connectivity'
  AND customer_type = 'consumer';

-- Also update any business SkyFibre packages for consistency
UPDATE service_packages
SET
  product_category = 'wireless',
  updated_at = NOW()
WHERE service_type = 'SkyFibre'
  AND product_category = 'connectivity'
  AND customer_type = 'business';

-- Verify the fix
DO $$
DECLARE
  total_skyfibre INTEGER;
  wireless_skyfibre INTEGER;
  consumer_skyfibre INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_skyfibre
  FROM service_packages
  WHERE service_type = 'SkyFibre';

  SELECT COUNT(*) INTO wireless_skyfibre
  FROM service_packages
  WHERE service_type = 'SkyFibre'
    AND product_category = 'wireless';

  SELECT COUNT(*) INTO consumer_skyfibre
  FROM service_packages
  WHERE service_type = 'SkyFibre'
    AND product_category = 'wireless'
    AND customer_type = 'consumer'
    AND active = true;

  RAISE NOTICE 'After fix: % total SkyFibre packages, % with wireless category, % active consumer packages',
    total_skyfibre, wireless_skyfibre, consumer_skyfibre;
END $$;

-- Add comment explaining the fix
COMMENT ON TABLE service_packages IS 'Product packages. For SkyFibre: product_category must be "wireless" to match service_type_mapping (uncapped_wireless → wireless)';
