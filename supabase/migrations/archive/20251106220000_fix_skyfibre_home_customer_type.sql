-- =====================================================================
-- Fix SkyFibre Home Packages Customer Type
-- =====================================================================
-- Description: Update customer_type from 'business' to 'consumer' for
--              residential SkyFibre packages
-- Issue: SkyFibre Home packages not showing on residential packages page
-- =====================================================================

-- First, let's see what we're fixing (for logging purposes)
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO affected_count
  FROM service_packages
  WHERE name ILIKE '%SkyFibre Home%'
    AND customer_type = 'business';

  RAISE NOTICE 'Found % SkyFibre Home packages with customer_type = business', affected_count;
END $$;

-- Update SkyFibre Home packages to consumer
UPDATE service_packages
SET
  customer_type = 'consumer',
  updated_at = NOW()
WHERE name ILIKE '%SkyFibre Home%'
  AND customer_type = 'business';

-- Also update other residential-named packages
UPDATE service_packages
SET
  customer_type = 'consumer',
  updated_at = NOW()
WHERE (
    name ILIKE '%Residential%'
    OR name ILIKE '%Home%'
    OR name ILIKE '%Household%'
    OR name ILIKE '%Domestic%'
  )
  AND customer_type = 'business'
  AND name NOT ILIKE '%Business%'
  AND name NOT ILIKE '%SME%'
  AND name NOT ILIKE '%Enterprise%'
  AND name NOT ILIKE '%Corporate%';

-- Verify the changes
DO $$
DECLARE
  consumer_count INTEGER;
  business_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO consumer_count
  FROM service_packages
  WHERE name ILIKE '%SkyFibre Home%'
    AND customer_type = 'consumer';

  SELECT COUNT(*) INTO business_count
  FROM service_packages
  WHERE name ILIKE '%SkyFibre Home%'
    AND customer_type = 'business';

  RAISE NOTICE 'After update: % consumer SkyFibre Home packages, % business',
    consumer_count, business_count;
END $$;

-- Add comment explaining the fix
COMMENT ON TABLE service_packages IS 'Product packages. Customer_type: "consumer" for residential/home, "business" for SME/Enterprise';
