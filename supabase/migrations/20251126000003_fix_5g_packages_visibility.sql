-- Migration: Fix 5G packages visibility on frontend coverage check
-- Issue: 5G packages not showing when coverage check returns 5G availability
-- Also: Remove MTN Wholesale (MNS) packages from consumer-facing display

-- ============================================================================
-- DIAGNOSTIC: Check current state (run these SELECT queries first in SQL Editor)
-- ============================================================================

-- Check current service_type_mapping for 5G
-- SELECT * FROM service_type_mapping WHERE technical_type ILIKE '%5g%' OR product_category ILIKE '%5g%';

-- Check current 5G packages
-- SELECT id, name, service_type, product_category, customer_type, active, price FROM service_packages WHERE service_type ILIKE '%5g%' OR product_category ILIKE '%5g%' OR name ILIKE '%5g%';

-- Check packages with MNS in name (to be hidden)
-- SELECT id, name, service_type, product_category, active FROM service_packages WHERE name ILIKE '%MNS%' OR name ILIKE '%Wholesale%';

-- ============================================================================
-- FIX 1: Ensure 5G service type mapping exists and is correct
-- ============================================================================

-- The MTN Coverage API returns '5G' (uppercase), map it to '5g' product_category
INSERT INTO service_type_mapping (technical_type, provider, product_category, priority, active, notes)
VALUES
  ('5G', 'mtn', '5g', 1, true, 'MTN 5G Coverage - maps to 5g product category'),
  ('5g', 'mtn', '5g', 1, true, 'MTN 5G Coverage (lowercase) - maps to 5g product category')
ON CONFLICT (technical_type, provider, product_category) DO UPDATE SET
  active = true,
  priority = 1;

-- ============================================================================
-- FIX 2: Update 5G packages to have correct product_category
-- ============================================================================

-- Ensure all 5G packages have product_category = '5g' (lowercase, matching the mapping)
UPDATE service_packages
SET product_category = '5g'
WHERE (
  service_type ILIKE '%5g%' 
  OR name ILIKE '%5g%'
)
AND (product_category IS NULL OR product_category NOT IN ('5g', '5G'));

-- ============================================================================
-- FIX 3: Ensure 5G packages are active
-- ============================================================================

-- Activate 5G packages that should be visible
UPDATE service_packages
SET 
  active = true,
  status = 'active'
WHERE (
  service_type ILIKE '%5g%' 
  OR product_category = '5g'
  OR name ILIKE '%5g%'
)
AND name NOT ILIKE '%MNS%'
AND name NOT ILIKE '%Wholesale%'
AND active = false;

-- ============================================================================
-- FIX 4: Hide MTN Wholesale (MNS) packages from consumer display
-- ============================================================================

-- Option A: Deactivate MNS/Wholesale packages (they won't show on frontend)
UPDATE service_packages
SET 
  active = false,
  status = 'inactive'
WHERE 
  name ILIKE '%MNS%' 
  OR name ILIKE '%Wholesale%'
  OR (metadata->>'source' = 'mtn_wholesale');

-- Option B: Alternative - Mark as business-only (won't show for consumer coverage checks)
-- UPDATE service_packages
-- SET customer_type = 'business'
-- WHERE name ILIKE '%MNS%' OR name ILIKE '%Wholesale%';

-- ============================================================================
-- FIX 5: Ensure consumer 5G packages have correct customer_type
-- ============================================================================

-- Consumer 5G packages should have customer_type = 'consumer'
UPDATE service_packages
SET customer_type = 'consumer'
WHERE (
  name ILIKE '%Home%5g%'
  OR name ILIKE '%Premium%5g%'
  OR name ILIKE '%Essential%5g%'
)
AND customer_type != 'consumer';

-- ============================================================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================================================

-- Verify 5G mappings
-- SELECT * FROM service_type_mapping WHERE product_category = '5g' AND active = true;

-- Verify active 5G packages
-- SELECT id, name, service_type, product_category, customer_type, active, price 
-- FROM service_packages 
-- WHERE product_category = '5g' AND active = true 
-- ORDER BY price;

-- Verify MNS packages are hidden
-- SELECT id, name, active FROM service_packages WHERE name ILIKE '%MNS%' OR name ILIKE '%Wholesale%';
