-- =====================================================================
-- Fix SkyFibre Product Category for Coverage Check Display
-- =====================================================================
-- Issue: SkyFibre packages (Home and SME) not showing on coverage check
--        when customer has MTN uncapped_wireless coverage
-- 
-- Root Cause:
--   1. MTN coverage API returns technical types: 'uncapped_wireless', '5G', 'LTE'
--   2. service_type_mapping maps 'uncapped_wireless' → 'wireless' product_category
--   3. Packages API queries: WHERE product_category IN ('wireless')
--   4. But SkyFibre packages have product_category = 'connectivity'
--   5. Result: SkyFibre packages don't appear in coverage results
--
-- Solution:
--   Add mapping: 'uncapped_wireless' → 'connectivity' for SkyFibre products
--   This allows both 'wireless' and 'connectivity' categories to show
--   when uncapped_wireless coverage is detected
-- =====================================================================

-- ============================================================================
-- STEP 1: Expand service_type_mapping constraints
-- ============================================================================

-- Drop the existing product_category constraint if it exists
ALTER TABLE service_type_mapping 
DROP CONSTRAINT IF EXISTS service_type_mapping_product_category_check;

-- Add expanded constraint with 'connectivity' category
ALTER TABLE service_type_mapping 
ADD CONSTRAINT service_type_mapping_product_category_check
CHECK (product_category IN (
  -- Original uppercase values (legacy)
  'SkyFibre', 'HomeFibreConnect', 'BizFibreConnect', 'LTE', '5G',
  -- Lowercase values (current system)
  'wireless', 'fibre_consumer', 'fibre_business', 'lte', '5g', 'fibre',
  -- Connectivity category for SkyFibre products
  'connectivity'
));

-- Drop the existing technical_type constraint if it exists
ALTER TABLE service_type_mapping 
DROP CONSTRAINT IF EXISTS service_type_mapping_technical_type_check;

-- Add expanded constraint with MTN Wholesale API values
ALTER TABLE service_type_mapping 
ADD CONSTRAINT service_type_mapping_technical_type_check
CHECK (technical_type IN (
  -- Original values from MTN Consumer API
  'fibre', 'fixed_lte', 'uncapped_wireless', 'licensed_wireless',
  '5g', 'lte', '3g_900', '3g_2100', '2g',
  -- MTN Consumer API uppercase variants
  '5G', 'LTE', 'FixedLTE',
  -- MTN Wholesale API values
  'Fixed Wireless Broadband', 'Wholesale FTTH FNO', 'Wholesale FTTH (MNS)',
  'Wholesale Cloud Connect', 'Wholesale Access Connect', 
  'Wholesale Ethernet Wave Leased Line', 'Wholesale Cloud Connect Lite'
));

-- ============================================================================
-- STEP 2: Add mapping for uncapped_wireless → connectivity
-- ============================================================================
-- This ensures SkyFibre packages with product_category='connectivity' 
-- are returned when MTN coverage shows uncapped_wireless availability

INSERT INTO service_type_mapping (technical_type, provider, product_category, priority, active, notes)
VALUES
  -- Map uncapped_wireless to connectivity for SkyFibre products
  ('uncapped_wireless', 'mtn', 'connectivity', 2, true, 
   'MTN Tarana Wireless (SkyFibre) - maps to connectivity category for SkyFibre Home and SME products')
ON CONFLICT (technical_type, provider, product_category) DO UPDATE SET
  active = true,
  priority = EXCLUDED.priority,
  notes = EXCLUDED.notes;

-- Add Fixed Wireless Broadband → connectivity mapping (MTN Wholesale)
INSERT INTO service_type_mapping (technical_type, provider, product_category, priority, active, notes)
VALUES
  ('Fixed Wireless Broadband', 'mtn', 'connectivity', 2, true,
   'MTN Wholesale Fixed Wireless - maps to connectivity category for business SkyFibre products')
ON CONFLICT (technical_type, provider, product_category) DO UPDATE SET
  active = true,
  priority = EXCLUDED.priority,
  notes = EXCLUDED.notes;

-- ============================================================================
-- STEP 3: Ensure SkyFibre Home packages have correct settings
-- ============================================================================
-- SkyFibre Home Lite and Home Plus should be:
--   - product_category = 'connectivity' (to match the new mapping)
--   - customer_type = 'consumer' (for residential customers)
--   - service_type = 'SkyFibre'
--   - active = true

UPDATE service_packages
SET
  product_category = 'connectivity',
  customer_type = 'consumer',
  updated_at = NOW()
WHERE name ILIKE '%SkyFibre Home%'
  AND (product_category != 'connectivity' OR customer_type != 'consumer');

-- ============================================================================
-- STEP 4: Ensure SkyFibre SME packages have correct settings
-- ============================================================================
-- SkyFibre SME Essential, Professional, Premium, Enterprise should be:
--   - product_category = 'connectivity' (to match the new mapping)
--   - customer_type = 'business' (for business customers)
--   - service_type = 'SkyFibre'
--   - active = true

UPDATE service_packages
SET
  product_category = 'connectivity',
  customer_type = 'business',
  updated_at = NOW()
WHERE name ILIKE '%SkyFibre SME%'
  AND (product_category != 'connectivity' OR customer_type != 'business');

-- ============================================================================
-- STEP 5: Verify the fix
-- ============================================================================

DO $$
DECLARE
  mapping_count INTEGER;
  home_consumer_count INTEGER;
  sme_business_count INTEGER;
BEGIN
  -- Check mappings
  SELECT COUNT(*) INTO mapping_count
  FROM service_type_mapping
  WHERE technical_type IN ('uncapped_wireless', 'Fixed Wireless Broadband')
    AND product_category = 'connectivity'
    AND active = true;

  -- Check SkyFibre Home packages
  SELECT COUNT(*) INTO home_consumer_count
  FROM service_packages
  WHERE name ILIKE '%SkyFibre Home%'
    AND product_category = 'connectivity'
    AND customer_type = 'consumer'
    AND active = true;

  -- Check SkyFibre SME packages
  SELECT COUNT(*) INTO sme_business_count
  FROM service_packages
  WHERE name ILIKE '%SkyFibre SME%'
    AND product_category = 'connectivity'
    AND customer_type = 'business'
    AND active = true;

  RAISE NOTICE '=== SkyFibre Connectivity Category Fix Results ===';
  RAISE NOTICE 'Mappings to connectivity: %', mapping_count;
  RAISE NOTICE 'SkyFibre Home (consumer) packages: %', home_consumer_count;
  RAISE NOTICE 'SkyFibre SME (business) packages: %', sme_business_count;
  
  IF mapping_count < 1 THEN
    RAISE WARNING 'No mappings found for uncapped_wireless → connectivity';
  END IF;
END $$;

-- ============================================================================
-- STEP 6: Add documentation
-- ============================================================================

COMMENT ON TABLE service_type_mapping IS 
'Maps technical service types from provider APIs to CircleTel product categories.

Coverage Check Flow:
1. MTN API returns: uncapped_wireless, 5G, LTE, Fixed Wireless Broadband
2. This table maps technical types to product categories
3. Packages API queries service_packages by product_category

Key Mappings for SkyFibre:
- uncapped_wireless → connectivity (SkyFibre Home/SME products)
- uncapped_wireless → wireless (legacy mapping, kept for compatibility)
- Fixed Wireless Broadband → connectivity (MTN Wholesale mapping)

Customer Type Mapping:
- SkyFibre Home* → consumer (residential packages page)
- SkyFibre SME* → business (business packages page)';

-- ============================================================================
-- Diagnostic Query (run manually to verify)
-- ============================================================================
-- SELECT 
--   sp.name,
--   sp.service_type,
--   sp.product_category,
--   sp.customer_type,
--   sp.active,
--   sp.price
-- FROM service_packages sp
-- WHERE sp.service_type = 'SkyFibre'
-- ORDER BY sp.customer_type, sp.price;

-- SELECT 
--   stm.technical_type,
--   stm.provider,
--   stm.product_category,
--   stm.priority,
--   stm.active
-- FROM service_type_mapping stm
-- WHERE stm.product_category IN ('connectivity', 'wireless')
-- ORDER BY stm.technical_type, stm.priority;
