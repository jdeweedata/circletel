-- =====================================================================
-- Update SkyFibre Product Pricing (SME + Home)
-- =====================================================================
-- Source: 
--   SME: Product Pricing Structure Version 3.0 - Latest
--   Home: Product Pricing Structure Version 4.0 - Latest
-- 
-- NOTE: Source prices are VAT INCLUSIVE (15%)
-- Database stores prices EXCLUDING VAT
-- Formula: Excl VAT = Incl VAT / 1.15
-- =====================================================================

-- ============================================================================
-- SME PRODUCTS (Business)
-- ============================================================================

-- SME Essential (50/10 Mbps - 5:1 ratio)
-- Promo (Incl VAT): R1,299.00 → Excl VAT: R1,129.57
-- Regular (Incl VAT): R1,899.00 | Installation (Incl VAT): R2,500.00
UPDATE service_packages
SET
  price = 1129.57,              -- Promo price (excl VAT: 1299/1.15)
  promotion_price = NULL,
  speed_down = 50,
  speed_up = 10,                -- 5:1 ratio (50/10)
  product_category = 'connectivity',
  customer_type = 'business',
  active = true,
  updated_at = NOW()
WHERE name = 'SkyFibre SME Essential';

-- SME Professional (100/20 Mbps - 5:1 ratio)
-- Promo (Incl VAT): R1,899.00 → Excl VAT: R1,651.30
-- Regular (Incl VAT): R2,899.00 | Installation (Incl VAT): R3,500.00
UPDATE service_packages
SET
  price = 1651.30,              -- Promo price (excl VAT: 1899/1.15)
  promotion_price = NULL,
  speed_down = 100,
  speed_up = 20,                -- 5:1 ratio (100/20)
  product_category = 'connectivity',
  customer_type = 'business',
  active = true,
  updated_at = NOW()
WHERE name = 'SkyFibre SME Professional';

-- SME Premium (200/40 Mbps - 5:1 ratio)
-- Promo (Incl VAT): R2,899.00 → Excl VAT: R2,520.87
-- Regular (Incl VAT): R4,499.00 | Installation (Incl VAT): R5,500.00
UPDATE service_packages
SET
  price = 2520.87,              -- Promo price (excl VAT: 2899/1.15)
  promotion_price = NULL,
  speed_down = 200,
  speed_up = 40,                -- 5:1 ratio (200/40)
  product_category = 'connectivity',
  customer_type = 'business',
  active = true,
  updated_at = NOW()
WHERE name = 'SkyFibre SME Premium';

-- Deactivate SME Enterprise (not in pricing sheet)
UPDATE service_packages
SET active = false, updated_at = NOW()
WHERE name = 'SkyFibre SME Enterprise';

-- ============================================================================
-- HOME PRODUCTS (Consumer)
-- ============================================================================

-- Home Lite (50/10 Mbps - 5:1 ratio)
-- Promo (Incl VAT): R799.00 → Excl VAT: R694.78
-- Regular (Incl VAT): R899.00 | Installation (Incl VAT): R900.00
UPDATE service_packages
SET
  price = 694.78,               -- Promo price (excl VAT: 799/1.15)
  promotion_price = NULL,
  speed_down = 50,
  speed_up = 10,                -- 5:1 ratio (50/10)
  product_category = 'connectivity',
  customer_type = 'consumer',
  active = true,
  updated_at = NOW()
WHERE name = 'SkyFibre Home Lite';

-- Home Plus (100/20 Mbps - 5:1 ratio)
-- Promo (Incl VAT): R899.00 → Excl VAT: R781.74
-- Regular (Incl VAT): R1,259.00 | Installation (Incl VAT): R900.00
UPDATE service_packages
SET
  price = 781.74,               -- Promo price (excl VAT: 899/1.15)
  promotion_price = NULL,
  speed_down = 100,
  speed_up = 20,                -- 5:1 ratio (100/20)
  product_category = 'connectivity',
  customer_type = 'consumer',
  active = true,
  updated_at = NOW()
WHERE name = 'SkyFibre Home Plus';

-- Home Max (200/40 Mbps - 5:1 ratio)
-- Promo (Incl VAT): R1,099.00 → Excl VAT: R955.65
-- Regular (Incl VAT): R1,449.00 | Installation (Incl VAT): R900.00
UPDATE service_packages
SET
  price = 955.65,               -- Promo price (excl VAT: 1099/1.15)
  promotion_price = NULL,
  speed_down = 200,
  speed_up = 40,                -- 5:1 ratio (200/40)
  product_category = 'connectivity',
  customer_type = 'consumer',
  active = true,
  updated_at = NOW()
WHERE name = 'SkyFibre Home Max';

-- ============================================================================
-- DEACTIVATE LEGACY PRODUCTS
-- ============================================================================

UPDATE service_packages
SET active = false, updated_at = NOW()
WHERE service_type = 'SkyFibre'
  AND name NOT IN (
    -- Active SME products
    'SkyFibre SME Essential',
    'SkyFibre SME Professional', 
    'SkyFibre SME Premium',
    -- Active Home products
    'SkyFibre Home Lite',
    'SkyFibre Home Plus',
    'SkyFibre Home Max'
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  sme_count INTEGER;
  home_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sme_count
  FROM service_packages
  WHERE service_type = 'SkyFibre' AND customer_type = 'business' AND active = true;

  SELECT COUNT(*) INTO home_count
  FROM service_packages
  WHERE service_type = 'SkyFibre' AND customer_type = 'consumer' AND active = true;

  RAISE NOTICE '=== SkyFibre Pricing Update Complete ===';
  RAISE NOTICE 'Active SME (business): % packages', sme_count;
  RAISE NOTICE 'Active Home (consumer): % packages', home_count;
  RAISE NOTICE 'Total active SkyFibre: % packages', sme_count + home_count;
END $$;

-- ============================================================================
-- Expected Result (prices excl VAT, displays as incl VAT on frontend):
-- SME Essential:     R1,129.57 (→ R1,299 incl) | 50/10 Mbps  | business
-- SME Professional:  R1,651.30 (→ R1,899 incl) | 100/20 Mbps | business
-- SME Premium:       R2,520.87 (→ R2,899 incl) | 200/40 Mbps | business
-- Home Lite:         R694.78   (→ R799 incl)   | 50/10 Mbps  | consumer
-- Home Plus:         R781.74   (→ R899 incl)   | 100/20 Mbps | consumer
-- Home Max:          R955.65   (→ R1,099 incl) | 200/40 Mbps | consumer
-- ============================================================================
