-- Migration: Deactivate Duplicate SkyFibre Pro Products
-- Purpose: Consolidate product portfolio by removing Pro variants
-- The Pro features (Static IP, Extended Support) are now available as add-ons
--
-- Products being deactivated:
-- - SkyFibre Home Pro 50 (R999) → Use SkyFibre Home Plus (R799) + add-ons
-- - SkyFibre Home Pro 100 (R1,199) → Use SkyFibre Home Max (R999) + add-ons
-- - SkyFibre Home Pro 200 (R1,499) → Use SkyFibre Home Ultra (R1,299) + add-ons

-- Deactivate Pro variants (keep base products active)
-- Using explicit IDs for reliability
UPDATE service_packages
SET
  active = false,
  updated_at = NOW()
WHERE id IN (
  '03b5c331-006a-4f82-952e-0d877025bea3',  -- SkyFibre Home Pro 50
  '85a2784c-97c1-4e8a-81f7-9c93c5142e27',  -- SkyFibre Home Pro 100
  '32237aa5-8de1-4304-881f-3c7cd1f388e9'   -- SkyFibre Home Pro 200
);

-- Log the change for audit purposes
DO $$
BEGIN
  -- Check if audit_log table exists before inserting
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log' AND table_schema = 'public') THEN
    INSERT INTO audit_log (action, table_name, details, performed_by)
    VALUES (
      'DEACTIVATE_DUPLICATE_PRODUCTS',
      'service_packages',
      jsonb_build_object(
        'reason', 'Consolidated into base products + add-ons system',
        'products_deactivated', ARRAY['SkyFibre Home Pro 50', 'SkyFibre Home Pro 100', 'SkyFibre Home Pro 200'],
        'alternative', 'Customers can now add Static IP and Extended Support as add-ons to base products',
        'migration', '20260308000005_deactivate_duplicate_skyfibre.sql'
      ),
      'migration'
    );
  END IF;
END $$;

-- Verify the changes
DO $$
DECLARE
  deactivated_count INT;
  remaining_active_count INT;
BEGIN
  SELECT COUNT(*) INTO deactivated_count
  FROM service_packages
  WHERE name LIKE 'SkyFibre Home Pro%' AND active = false;

  SELECT COUNT(*) INTO remaining_active_count
  FROM service_packages
  WHERE name LIKE 'SkyFibre Home%' AND active = true;

  RAISE NOTICE 'Deactivated % Pro variants, % base products remain active', deactivated_count, remaining_active_count;
END $$;
