-- Migration: Fix SkyFibre Pricing - Deactivate Mock Data and Update SME Pricing
-- Created: 2025-01-20
-- Purpose: Fix customer-facing pricing by deactivating mock products and updating SME prices
-- Related: docs/testing/PRICING_FIX_IMPLEMENTATION_2025-01-20.md

-- ============================================================================
-- STEP 1: Deactivate Mock SkyFibre Products
-- ============================================================================
-- These are the incorrect mock products showing prices 30-55% lower than reality
-- Deactivating them will cause the API to return the correct products instead

UPDATE service_packages
SET active = false
WHERE name IN (
  'SkyFibre Essential 50Mbps',    -- Was R399/R299 (should be R799)
  'SkyFibre Standard 100Mbps',    -- Was R599/R449 (should be R899)
  'SkyFibre Premium 200Mbps',     -- Was R899/R699 (should be R1099)
  'SkyFibre Business 200Mbps'     -- Was R1199/R999 (should be R1299-R4999)
);

-- Verify Step 1: Check that 4 products were deactivated
DO $$
DECLARE
  deactivated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO deactivated_count
  FROM service_packages
  WHERE name IN (
    'SkyFibre Essential 50Mbps',
    'SkyFibre Standard 100Mbps',
    'SkyFibre Premium 200Mbps',
    'SkyFibre Business 200Mbps'
  )
  AND active = false;

  IF deactivated_count != 4 THEN
    RAISE EXCEPTION 'Expected 4 deactivated products, found %', deactivated_count;
  END IF;

  RAISE NOTICE 'Step 1 Complete: Deactivated % mock products', deactivated_count;
END $$;

-- ============================================================================
-- STEP 2: Update SME Pricing to Match Excel Sources
-- ============================================================================
-- Update SME products to match promotional pricing from Excel workbook
-- Source: docs/products/01_ACTIVE_PRODUCTS/SkyFibre/SME/SkyFibre SME Products - Budget Pricing - September 2025.xlsx

-- Update SkyFibre SME Essential (was R999, should be R1,299 promotional)
UPDATE service_packages
SET price = 1299
WHERE name = 'SkyFibre SME Essential';

-- Update SkyFibre SME Professional (was R1,499, should be R1,899 promotional)
UPDATE service_packages
SET price = 1899
WHERE name = 'SkyFibre SME Professional';

-- Update SkyFibre SME Premium (was R2,299, should be R2,899 promotional)
UPDATE service_packages
SET price = 2899
WHERE name = 'SkyFibre SME Premium';

-- Verify Step 2: Check that 3 products were updated
DO $$
DECLARE
  essential_price INTEGER;
  professional_price INTEGER;
  premium_price INTEGER;
BEGIN
  SELECT price INTO essential_price FROM service_packages WHERE name = 'SkyFibre SME Essential';
  SELECT price INTO professional_price FROM service_packages WHERE name = 'SkyFibre SME Professional';
  SELECT price INTO premium_price FROM service_packages WHERE name = 'SkyFibre SME Premium';

  IF essential_price != 1299 THEN
    RAISE EXCEPTION 'SME Essential price incorrect: expected 1299, got %', essential_price;
  END IF;

  IF professional_price != 1899 THEN
    RAISE EXCEPTION 'SME Professional price incorrect: expected 1899, got %', professional_price;
  END IF;

  IF premium_price != 2899 THEN
    RAISE EXCEPTION 'SME Premium price incorrect: expected 2899, got %', premium_price;
  END IF;

  RAISE NOTICE 'Step 2 Complete: Updated SME pricing (R1299, R1899, R2899)';
END $$;

-- ============================================================================
-- STEP 3: Add Missing SkyFibre SME Enterprise Product
-- ============================================================================
-- Add the top-tier SME product missing from the current catalog
-- Source: docs/products/01_ACTIVE_PRODUCTS/SkyFibre/SME/SkyFibre SME Products - Budget Pricing - September 2025.xlsx

-- Check if product already exists (idempotency)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM service_packages WHERE name = 'SkyFibre SME Enterprise'
  ) THEN
    INSERT INTO service_packages (
      name,
      service_type,
      product_category,
      speed_down,
      speed_up,
      price,
      promotion_price,
      promotion_months,
      description,
      features,
      active
    ) VALUES (
      'SkyFibre SME Enterprise',
      'SkyFibre',
      'connectivity',
      200,
      200,
      4999,
      null,
      null,
      'Enterprise-grade connectivity with dedicated support. Maximum reliability for mission-critical operations.',
      ARRAY['200Mbps symmetrical', 'Static IP included', 'Unlimited business emails', 'Unlimited cloud backup', 'Enterprise router', 'VPN service (25 users)', '24/7 priority support', '99.8% uptime SLA', 'Dedicated account manager'],
      true
    );
    RAISE NOTICE 'Step 3 Complete: Added SkyFibre SME Enterprise (R4999)';
  ELSE
    RAISE NOTICE 'Step 3 Skipped: SkyFibre SME Enterprise already exists';
  END IF;
END $$;

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

-- Count active vs inactive SkyFibre products
DO $$
DECLARE
  active_count INTEGER;
  inactive_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM service_packages
  WHERE service_type = 'SkyFibre' AND active = true;

  SELECT COUNT(*) INTO inactive_count
  FROM service_packages
  WHERE service_type = 'SkyFibre' AND active = false;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Active SkyFibre products: %', active_count;
  RAISE NOTICE 'Inactive SkyFibre products: %', inactive_count;
  RAISE NOTICE '========================================';

  IF active_count != 7 THEN
    RAISE WARNING 'Expected 7 active SkyFibre products, found %', active_count;
  END IF;

  IF inactive_count != 4 THEN
    RAISE WARNING 'Expected 4 inactive SkyFibre products, found %', inactive_count;
  END IF;
END $$;

-- Display final active products for verification
SELECT
  name,
  price,
  speed_down || '/' || speed_up AS speeds,
  active
FROM service_packages
WHERE service_type = 'SkyFibre'
ORDER BY
  CASE
    WHEN name LIKE '%SME%' THEN 2
    ELSE 1
  END,
  price;

-- Expected results:
-- Active (7 products):
--   1. SkyFibre Starter           R799    50/50   true
--   2. SkyFibre Plus              R899    100/100 true
--   3. SkyFibre Pro               R1099   200/200 true
--   4. SkyFibre SME Essential     R1299   50/50   true
--   5. SkyFibre SME Professional  R1899   100/100 true
--   6. SkyFibre SME Premium       R2899   200/200 true
--   7. SkyFibre SME Enterprise    R4999   200/200 true
--
-- Inactive (4 products):
--   1. SkyFibre Essential 50Mbps  R399    50/25   false
--   2. SkyFibre Standard 100Mbps  R599    100/50  false
--   3. SkyFibre Premium 200Mbps   R899    200/100 false
--   4. SkyFibre Business 200Mbps  R1199   200/200 false
