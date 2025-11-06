-- =====================================================================
-- Deactivate Duplicate SkyFibre Starter Package
-- =====================================================================
-- Description: Deactivate SkyFibre Starter (duplicate of SkyFibre Home Lite)
-- Issue: Two identical R799 packages showing (same specs: 50/25 Mbps)
-- Keep: SkyFibre Home Lite (newer, created 2025-10-26)
-- Remove: SkyFibre Starter (older, created 2025-09-28)
-- =====================================================================

-- Log the duplicate packages before deactivation
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM service_packages
  WHERE service_type = 'SkyFibre'
    AND price = 799
    AND customer_type = 'consumer'
    AND active = true;

  RAISE NOTICE 'Found % active R799 SkyFibre consumer packages (should be 1)', duplicate_count;
END $$;

-- Deactivate the older SkyFibre Starter package
UPDATE service_packages
SET
  active = false,
  status = 'inactive',
  updated_at = NOW()
WHERE id = '5c0b986a-2f42-4977-86c2-8a242cfce295'
  AND name = 'SkyFibre Starter';

-- Verify only one R799 package remains active
DO $$
DECLARE
  remaining_count INTEGER;
  remaining_name TEXT;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM service_packages
  WHERE service_type = 'SkyFibre'
    AND price = 799
    AND customer_type = 'consumer'
    AND active = true;

  SELECT name INTO remaining_name
  FROM service_packages
  WHERE service_type = 'SkyFibre'
    AND price = 799
    AND customer_type = 'consumer'
    AND active = true
  LIMIT 1;

  RAISE NOTICE 'After deactivation: % active R799 package: %', remaining_count, remaining_name;
END $$;

-- Add comment
COMMENT ON COLUMN service_packages.active IS 'Active flag. SkyFibre Starter deactivated (duplicate of SkyFibre Home Lite)';
