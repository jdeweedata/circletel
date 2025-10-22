-- =====================================================
-- Add Corrected Products to Database
-- Created: 2025-10-21
-- Purpose: Add correct products based on official documentation
-- Replaces: 20251021000007_add_mtn_products.sql (INCORRECT)
-- =====================================================

-- =====================================================
-- SECTION 1: HOMEFIBRE CONNECT (MTN Wholesale FTTH)
-- Source: docs/products/01_ACTIVE_PRODUCTS/HomeFibreConnect/homefibre-connect-product-doc.md
-- Provider: MTN
-- =====================================================

INSERT INTO service_packages (
  name,
  service_type,
  product_category,
  customer_type,
  speed_down,
  speed_up,
  price,
  currency,
  billing_cycle,
  data_cap,
  compatible_providers,
  provider_specific_config,
  active,
  featured,
  description
) VALUES
  -- HomeFibre Starter (20 Mbps @ R799)
  (
    'HomeFibre Starter',
    'fibre',
    'HomeFibreConnect',
    'consumer',
    20,
    20,
    799.00,
    'ZAR',
    'monthly',
    'Uncapped',
    ARRAY['mtn'],
    '{
      "provider": "MTN",
      "provider_service_name": "MTN Wholesale FTTH 20Mbps",
      "wholesale_cost": 412,
      "installation_fee": 2876,
      "router_model": "Reyee RG-EW1200F",
      "router_cost": 450,
      "technology": "GPON/Active Ethernet",
      "uptime_sla": "99.5%",
      "latency": "<20ms",
      "coverage_areas": 37,
      "contract_term": "24 months"
    }'::jsonb,
    true,
    false,
    'HomeFibre Starter 20Mbps - Budget-friendly uncapped fibre for basic streaming and browsing'
  ),
  -- HomeFibre Plus (50 Mbps @ R999)
  (
    'HomeFibre Plus',
    'fibre',
    'HomeFibreConnect',
    'consumer',
    50,
    50,
    999.00,
    'ZAR',
    'monthly',
    'Uncapped',
    ARRAY['mtn'],
    '{
      "provider": "MTN",
      "provider_service_name": "MTN Wholesale FTTH 50Mbps",
      "wholesale_cost": 542,
      "installation_fee": 2876,
      "router_model": "Reyee RG-EW1300G",
      "router_cost": 675,
      "technology": "GPON/Active Ethernet",
      "uptime_sla": "99.7%",
      "latency": "<15ms",
      "coverage_areas": 37,
      "contract_term": "24 months"
    }'::jsonb,
    true,
    true,
    'HomeFibre Plus 50Mbps - Perfect for families, HD streaming and work-from-home'
  ),
  -- HomeFibre Max (200 Mbps @ R1,499)
  (
    'HomeFibre Max',
    'fibre',
    'HomeFibreConnect',
    'consumer',
    200,
    200,
    1499.00,
    'ZAR',
    'monthly',
    'Uncapped',
    ARRAY['mtn'],
    '{
      "provider": "MTN",
      "provider_service_name": "MTN Wholesale FTTH 200Mbps",
      "wholesale_cost": 737,
      "installation_fee": 2876,
      "router_model": "Reyee RG-EW1800GX",
      "router_cost": 1050,
      "technology": "GPON/Active Ethernet",
      "uptime_sla": "99.9%",
      "latency": "<10ms",
      "coverage_areas": 37,
      "contract_term": "24 months"
    }'::jsonb,
    true,
    true,
    'HomeFibre Max 200Mbps - For power users, 4K streaming and online gaming'
  ),
  -- HomeFibre Ultra (500 Mbps @ R1,999)
  (
    'HomeFibre Ultra',
    'fibre',
    'HomeFibreConnect',
    'consumer',
    500,
    500,
    1999.00,
    'ZAR',
    'monthly',
    'Uncapped',
    ARRAY['mtn'],
    '{
      "provider": "MTN",
      "provider_service_name": "MTN Wholesale FTTH 500Mbps",
      "wholesale_cost": 837,
      "installation_fee": 2876,
      "router_model": "Reyee RG-EW3000GX",
      "router_cost": 1750,
      "technology": "GPON/Active Ethernet",
      "uptime_sla": "99.9%",
      "latency": "<5ms",
      "coverage_areas": 37,
      "contract_term": "24 months"
    }'::jsonb,
    true,
    true,
    'HomeFibre Ultra 500Mbps - Premium tier for multiple 4K streams and content creators'
  )
ON CONFLICT (name) DO UPDATE SET
  service_type = EXCLUDED.service_type,
  product_category = EXCLUDED.product_category,
  customer_type = EXCLUDED.customer_type,
  speed_down = EXCLUDED.speed_down,
  speed_up = EXCLUDED.speed_up,
  price = EXCLUDED.price,
  data_cap = EXCLUDED.data_cap,
  compatible_providers = EXCLUDED.compatible_providers,
  provider_specific_config = EXCLUDED.provider_specific_config,
  description = EXCLUDED.description,
  updated_at = NOW();

-- =====================================================
-- SECTION 2: BIZFIBRE CONNECT (DFA Wholesale BIA)
-- Source: docs/products/01_ACTIVE_PRODUCTS/BizFibreConnect/bizfibre-connect-product-doc-v2.md
-- Provider: DFA (Dark Fibre Africa) - NOT MTN!
-- =====================================================

INSERT INTO service_packages (
  name,
  service_type,
  product_category,
  customer_type,
  speed_down,
  speed_up,
  price,
  currency,
  billing_cycle,
  data_cap,
  compatible_providers,
  provider_specific_config,
  active,
  featured,
  description
) VALUES
  -- BizFibre Connect Lite (10 Mbps @ R1,699)
  (
    'BizFibre Connect Lite',
    'fibre',
    'BizFibreConnect',
    'business',
    10,
    10,
    1699.00,
    'ZAR',
    'monthly',
    'Uncapped',
    ARRAY['dfa'],
    '{
      "provider": "DFA",
      "provider_service_name": "DFA BIA 10Mbps",
      "wholesale_cost": 999,
      "router_model": "Reyee RG-EW1300G",
      "router_included": true,
      "technology": "Active Ethernet FTTB",
      "uptime_sla": "99.5%",
      "contention_ratio": "1:10",
      "latency": "<5ms metro",
      "contract_term": "24 months",
      "support_level": "business"
    }'::jsonb,
    true,
    false,
    'DFA BizFibre Connect Lite 10Mbps - Micro businesses and home offices with enterprise-grade connectivity'
  ),
  -- BizFibre Connect Starter (25 Mbps @ R1,899)
  (
    'BizFibre Connect Starter',
    'fibre',
    'BizFibreConnect',
    'business',
    25,
    25,
    1899.00,
    'ZAR',
    'monthly',
    'Uncapped',
    ARRAY['dfa'],
    '{
      "provider": "DFA",
      "provider_service_name": "DFA BIA 25Mbps",
      "wholesale_cost": 999,
      "router_model": "Reyee RG-EG105G",
      "hardware_contribution": 500,
      "technology": "Active Ethernet FTTB",
      "uptime_sla": "99.5%",
      "contention_ratio": "1:10",
      "latency": "<5ms metro",
      "contract_term": "24 months",
      "support_level": "business"
    }'::jsonb,
    true,
    false,
    'DFA BizFibre Connect Starter 25Mbps - Small offices and retail stores with guaranteed business SLA'
  ),
  -- BizFibre Connect Plus (50 Mbps @ R2,499)
  (
    'BizFibre Connect Plus',
    'fibre',
    'BizFibreConnect',
    'business',
    50,
    50,
    2499.00,
    'ZAR',
    'monthly',
    'Uncapped',
    ARRAY['dfa'],
    '{
      "provider": "DFA",
      "provider_service_name": "DFA BIA 50Mbps",
      "wholesale_cost": 1422,
      "router_model": "Reyee RG-EG105G-P",
      "router_features": "PoE support",
      "hardware_contribution": 500,
      "technology": "Active Ethernet FTTB",
      "uptime_sla": "99.5%",
      "contention_ratio": "1:10",
      "latency": "<5ms metro",
      "contract_term": "24 months",
      "support_level": "business"
    }'::jsonb,
    true,
    true,
    'DFA BizFibre Connect Plus 50Mbps - Growing SMEs and multi-user offices with PoE support'
  ),
  -- BizFibre Connect Pro (100 Mbps @ R2,999)
  (
    'BizFibre Connect Pro',
    'fibre',
    'BizFibreConnect',
    'business',
    100,
    100,
    2999.00,
    'ZAR',
    'monthly',
    'Uncapped',
    ARRAY['dfa'],
    '{
      "provider": "DFA",
      "provider_service_name": "DFA BIA 100Mbps",
      "wholesale_cost": 1731,
      "router_model": "Reyee RG-EG305GH-P-E",
      "router_rental": 99,
      "router_features": "VPN, PoE, Multi-WAN",
      "technology": "Active Ethernet FTTB",
      "uptime_sla": "99.5%",
      "contention_ratio": "1:10",
      "latency": "<5ms metro",
      "contract_term": "24 months",
      "support_level": "business"
    }'::jsonb,
    true,
    true,
    'DFA BizFibre Connect Pro 100Mbps - Medium businesses with heavy cloud usage and VPN requirements'
  ),
  -- BizFibre Connect Ultra (200 Mbps @ R4,373)
  (
    'BizFibre Connect Ultra',
    'fibre',
    'BizFibreConnect',
    'business',
    200,
    200,
    4373.00,
    'ZAR',
    'monthly',
    'Uncapped',
    ARRAY['dfa'],
    '{
      "provider": "DFA",
      "provider_service_name": "DFA BIA 200Mbps",
      "wholesale_cost": 2875,
      "router_model": "Reyee RG-EG310GH-P-E",
      "router_rental": 149,
      "router_features": "Enterprise gateway, 10 ports, PoE",
      "technology": "Active Ethernet FTTB",
      "uptime_sla": "99.5%",
      "contention_ratio": "1:10",
      "latency": "<5ms metro",
      "contract_term": "24 months",
      "support_level": "enterprise"
    }'::jsonb,
    true,
    true,
    'DFA BizFibre Connect Ultra 200Mbps - Large offices and mission-critical operations'
  )
ON CONFLICT (name) DO UPDATE SET
  service_type = EXCLUDED.service_type,
  product_category = EXCLUDED.product_category,
  customer_type = EXCLUDED.customer_type,
  speed_down = EXCLUDED.speed_down,
  speed_up = EXCLUDED.speed_up,
  price = EXCLUDED.price,
  data_cap = EXCLUDED.data_cap,
  compatible_providers = EXCLUDED.compatible_providers,
  provider_specific_config = EXCLUDED.provider_specific_config,
  description = EXCLUDED.description,
  updated_at = NOW();

-- =====================================================
-- SECTION 3: SKYFIBRE RESIDENTIAL (MTN Tarana Wireless)
-- Source: docs/products/01_ACTIVE_PRODUCTS/SkyFibre/Residential/skyfibre-residential-product-doc-v7.md
-- Provider: MTN
-- =====================================================

INSERT INTO service_packages (
  name,
  service_type,
  product_category,
  customer_type,
  speed_down,
  speed_up,
  price,
  currency,
  billing_cycle,
  data_cap,
  compatible_providers,
  provider_specific_config,
  active,
  featured,
  description
) VALUES
  -- SkyFibre Starter (50 Mbps @ R799)
  (
    'SkyFibre Starter',
    'wireless',
    'SkyFibre',
    'consumer',
    50,
    50,
    799.00,
    'ZAR',
    'monthly',
    'Uncapped',
    ARRAY['mtn'],
    '{
      "provider": "MTN",
      "provider_service_name": "MTN Tarana FWB 50Mbps",
      "wholesale_cost": 499,
      "installation_fee": 2550,
      "installation_special": 900,
      "router_model": "Reyee RG-EW1200",
      "router_cost": 395,
      "technology": "Tarana G1 Beamforming",
      "uptime_sla": "99.5%",
      "latency": "<5ms",
      "coverage": "6 million homes",
      "contract_term": "month-to-month"
    }'::jsonb,
    true,
    false,
    'SkyFibre Starter 50Mbps - Fixed wireless with sub-5ms latency, ideal for households and small offices'
  ),
  -- SkyFibre Plus (100 Mbps @ R899)
  (
    'SkyFibre Plus',
    'wireless',
    'SkyFibre',
    'consumer',
    100,
    100,
    899.00,
    'ZAR',
    'monthly',
    'Uncapped',
    ARRAY['mtn'],
    '{
      "provider": "MTN",
      "provider_service_name": "MTN Tarana FWB 100Mbps",
      "wholesale_cost": 599,
      "installation_fee": 2550,
      "installation_special": 900,
      "router_model": "Reyee RG-EW1300G",
      "router_cost": 595,
      "technology": "Tarana G1 Beamforming",
      "uptime_sla": "99.5%",
      "latency": "<5ms",
      "coverage": "6 million homes",
      "contract_term": "month-to-month"
    }'::jsonb,
    true,
    true,
    'SkyFibre Plus 100Mbps - Premium wireless with fibre-equivalent performance and zero throttling'
  ),
  -- SkyFibre Pro (200 Mbps @ R1,099)
  (
    'SkyFibre Pro',
    'wireless',
    'SkyFibre',
    'consumer',
    200,
    200,
    1099.00,
    'ZAR',
    'monthly',
    'Uncapped',
    ARRAY['mtn'],
    '{
      "provider": "MTN",
      "provider_service_name": "MTN Tarana FWB 200Mbps",
      "wholesale_cost": 699,
      "installation_fee": 2550,
      "installation_special": 900,
      "router_model": "Reyee RG-EW3000GX",
      "router_cost": 875,
      "technology": "Tarana G1 Beamforming",
      "uptime_sla": "99.5%",
      "latency": "<5ms",
      "coverage": "6 million homes",
      "contract_term": "month-to-month"
    }'::jsonb,
    true,
    true,
    'SkyFibre Pro 200Mbps - Top-tier wireless with WiFi 6 router, gaming-ready latency'
  )
ON CONFLICT (name) DO UPDATE SET
  service_type = EXCLUDED.service_type,
  product_category = EXCLUDED.product_category,
  customer_type = EXCLUDED.customer_type,
  speed_down = EXCLUDED.speed_down,
  speed_up = EXCLUDED.speed_up,
  price = EXCLUDED.price,
  data_cap = EXCLUDED.data_cap,
  compatible_providers = EXCLUDED.compatible_providers,
  provider_specific_config = EXCLUDED.provider_specific_config,
  description = EXCLUDED.description,
  updated_at = NOW();

-- =====================================================
-- SECTION 4: MTN BUSINESS 5G (MTN EBU)
-- Source: docs/products/01_ACTIVE_PRODUCTS/MTN 5G-LTE/mtn-5g-product-doc.md
-- Provider: MTN
-- Note: These are monthly promotional deals, updated by 25th of each month
-- =====================================================

INSERT INTO service_packages (
  name,
  service_type,
  product_category,
  customer_type,
  speed_down,
  speed_up,
  price,
  currency,
  billing_cycle,
  data_cap,
  compatible_providers,
  provider_specific_config,
  active,
  featured,
  description
) VALUES
  -- MTN Business 5G Essential (35 Mbps @ R449 incl VAT)
  (
    'MTN Business 5G Essential',
    '5g',
    'MTN 5G Business',
    'business',
    35,
    10,
    449.00,
    'ZAR',
    'monthly',
    '500GB',
    ARRAY['mtn'],
    '{
      "provider": "MTN",
      "provider_service_name": "MTN EBU 5G 35Mbps",
      "deal_code_sim": "202501EBU2013",
      "deal_code_router": "202504EBU9916",
      "fup_data": "500GB",
      "post_fup_speed": "2 Mbps",
      "latency": "20-30ms",
      "uptime_sla": "99.5%",
      "static_ip": "free",
      "contract_term": "24 months",
      "support_level": "business hours"
    }'::jsonb,
    true,
    false,
    'MTN Business 5G Essential 35Mbps - Small offices with 500GB FUP, guaranteed speeds'
  ),
  -- MTN Business 5G Professional (60 Mbps @ R649 incl VAT)
  (
    'MTN Business 5G Professional',
    '5g',
    'MTN 5G Business',
    'business',
    60,
    15,
    649.00,
    'ZAR',
    'monthly',
    '800GB',
    ARRAY['mtn'],
    '{
      "provider": "MTN",
      "provider_service_name": "MTN EBU 5G 60Mbps",
      "deal_code_sim": "202501EBU2012",
      "deal_code_router": "202504EBU9918",
      "fup_data": "800GB",
      "post_fup_speed": "2 Mbps",
      "latency": "15-25ms",
      "uptime_sla": "99.5%",
      "static_ip": "free",
      "contract_term": "24 months",
      "support_level": "business hours"
    }'::jsonb,
    true,
    true,
    'MTN Business 5G Professional 60Mbps - Medium businesses with 800GB FUP, cloud-ready'
  ),
  -- MTN Business 5G Enterprise (Best Effort @ R949 incl VAT)
  (
    'MTN Business 5G Enterprise',
    '5g',
    'MTN 5G Business',
    'business',
    100,
    20,
    949.00,
    'ZAR',
    'monthly',
    '1.5TB',
    ARRAY['mtn'],
    '{
      "provider": "MTN",
      "provider_service_name": "MTN EBU 5G Best Effort",
      "deal_code_sim": "202501EBU2014",
      "deal_code_router": "202504EBU9919",
      "speed_note": "Best effort 100-300 Mbps",
      "fup_data": "1.5TB",
      "post_fup_speed": "5 Mbps",
      "latency": "10-20ms",
      "uptime_sla": "99.5%",
      "static_ip": "free",
      "contract_term": "24 months",
      "support_level": "priority business"
    }'::jsonb,
    true,
    true,
    'MTN Business 5G Enterprise - Large offices with 1.5TB FUP, best-effort speeds up to 300 Mbps'
  )
ON CONFLICT (name) DO UPDATE SET
  service_type = EXCLUDED.service_type,
  product_category = EXCLUDED.product_category,
  customer_type = EXCLUDED.customer_type,
  speed_down = EXCLUDED.speed_down,
  speed_up = EXCLUDED.speed_up,
  price = EXCLUDED.price,
  data_cap = EXCLUDED.data_cap,
  compatible_providers = EXCLUDED.compatible_providers,
  provider_specific_config = EXCLUDED.provider_specific_config,
  description = EXCLUDED.description,
  updated_at = NOW();

-- =====================================================
-- VERIFICATION AND SUMMARY
-- =====================================================

DO $$
DECLARE
  homefibre_count INTEGER;
  bizfibre_count INTEGER;
  skyfibre_count INTEGER;
  mtn_5g_count INTEGER;
  mtn_products INTEGER;
  dfa_products INTEGER;
  total_products INTEGER;
BEGIN
  -- Count products by category
  SELECT COUNT(*) INTO homefibre_count
  FROM service_packages
  WHERE product_category = 'HomeFibreConnect';

  SELECT COUNT(*) INTO bizfibre_count
  FROM service_packages
  WHERE product_category = 'BizFibreConnect';

  SELECT COUNT(*) INTO skyfibre_count
  FROM service_packages
  WHERE product_category = 'SkyFibre';

  SELECT COUNT(*) INTO mtn_5g_count
  FROM service_packages
  WHERE product_category = 'MTN 5G Business';

  -- Count products by provider
  SELECT COUNT(*) INTO mtn_products
  FROM service_packages
  WHERE 'mtn' = ANY(compatible_providers);

  SELECT COUNT(*) INTO dfa_products
  FROM service_packages
  WHERE 'dfa' = ANY(compatible_providers);

  SELECT COUNT(*) INTO total_products
  FROM service_packages
  WHERE 'mtn' = ANY(compatible_providers) OR 'dfa' = ANY(compatible_providers);

  -- Display results
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Corrected Products Migration Complete';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Products by Category:';
  RAISE NOTICE '  ✓ HomeFibreConnect (MTN FTTH): % products', homefibre_count;
  RAISE NOTICE '  ✓ BizFibreConnect (DFA): % products', bizfibre_count;
  RAISE NOTICE '  ✓ SkyFibre (MTN Tarana): % products', skyfibre_count;
  RAISE NOTICE '  ✓ MTN Business 5G: % products', mtn_5g_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Products by Provider:';
  RAISE NOTICE '  ✓ MTN products: %', mtn_products;
  RAISE NOTICE '  ✓ DFA products: %', dfa_products;
  RAISE NOTICE '';
  RAISE NOTICE 'Total Products Added: %', total_products;
  RAISE NOTICE '';

  IF total_products = 15 THEN
    RAISE NOTICE '✓✓✓ All 15 products successfully added!';
    RAISE NOTICE '';
    RAISE NOTICE 'Breakdown:';
    RAISE NOTICE '  - 4 HomeFibre (20/50/200/500 Mbps) - MTN FTTH';
    RAISE NOTICE '  - 5 BizFibre (10/25/50/100/200 Mbps) - DFA BIA';
    RAISE NOTICE '  - 3 SkyFibre (50/100/200 Mbps) - MTN Tarana';
    RAISE NOTICE '  - 3 MTN Business 5G (35/60/Best Effort) - MTN EBU';
  ELSE
    RAISE WARNING '⚠ Expected 15 products, found %', total_products;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Ready for frontend integration and testing!';
  RAISE NOTICE '================================================';
END $$;

-- =====================================================
-- Migration Complete
-- =====================================================
