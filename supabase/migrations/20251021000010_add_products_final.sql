-- =====================================================
-- Add Corrected Products to Database - FINAL VERSION
-- Created: 2025-10-21
-- Purpose: Add 15 products based on official documentation
-- Schema: Compatible with existing service_packages table
-- =====================================================

-- Clean up any existing test products first (optional)
-- DELETE FROM service_packages WHERE name LIKE 'HomeFibre%' OR name LIKE 'BizFibre%' OR name LIKE 'SkyFibre%' OR name LIKE 'MTN Business%';

-- =====================================================
-- SECTION 1: HOMEFIBRE CONNECT (MTN Wholesale FTTH) - 4 Products
-- =====================================================

INSERT INTO service_packages (
  name, service_type, product_category, customer_type,
  speed_down, speed_up, price,
  compatible_providers, provider_specific_config,
  active, description, requires_fttb_coverage
) VALUES
  ('HomeFibre Starter', 'fibre', 'HomeFibreConnect', 'consumer', 20, 20, 799.00, ARRAY['mtn'],
   '{"provider":"MTN","wholesale_cost":412,"installation_fee":2876,"router_model":"Reyee RG-EW1200F","data_cap":"Uncapped"}'::jsonb,
   true, 'HomeFibre Starter 20Mbps - Budget-friendly uncapped fibre', true),

  ('HomeFibre Plus', 'fibre', 'HomeFibreConnect', 'consumer', 50, 50, 999.00, ARRAY['mtn'],
   '{"provider":"MTN","wholesale_cost":542,"installation_fee":2876,"router_model":"Reyee RG-EW1300G","data_cap":"Uncapped"}'::jsonb,
   true, 'HomeFibre Plus 50Mbps - Perfect for families and work-from-home', true),

  ('HomeFibre Max', 'fibre', 'HomeFibreConnect', 'consumer', 200, 200, 1499.00, ARRAY['mtn'],
   '{"provider":"MTN","wholesale_cost":737,"installation_fee":2876,"router_model":"Reyee RG-EW1800GX","data_cap":"Uncapped"}'::jsonb,
   true, 'HomeFibre Max 200Mbps - For power users and 4K streaming', true),

  ('HomeFibre Ultra', 'fibre', 'HomeFibreConnect', 'consumer', 500, 500, 1999.00, ARRAY['mtn'],
   '{"provider":"MTN","wholesale_cost":837,"installation_fee":2876,"router_model":"Reyee RG-EW3000GX","data_cap":"Uncapped"}'::jsonb,
   true, 'HomeFibre Ultra 500Mbps - Premium tier for content creators', true);

-- =====================================================
-- SECTION 2: BIZFIBRE CONNECT (DFA Business Internet) - 5 Products
-- =====================================================

INSERT INTO service_packages (
  name, service_type, product_category, customer_type,
  speed_down, speed_up, price,
  compatible_providers, provider_specific_config,
  active, description, requires_fttb_coverage
) VALUES
  ('BizFibre Connect Lite', 'fibre', 'BizFibreConnect', 'business', 10, 10, 1699.00, ARRAY['dfa'],
   '{"provider":"DFA","wholesale_cost":999,"router_model":"Reyee RG-EW1300G","sla":"99.5%","data_cap":"Uncapped"}'::jsonb,
   true, 'DFA BizFibre Connect Lite 10Mbps - Micro businesses with enterprise-grade SLA', true),

  ('BizFibre Connect Starter', 'fibre', 'BizFibreConnect', 'business', 25, 25, 1899.00, ARRAY['dfa'],
   '{"provider":"DFA","wholesale_cost":999,"router_model":"Reyee RG-EG105G","hardware_contribution":500,"sla":"99.5%","data_cap":"Uncapped"}'::jsonb,
   true, 'DFA BizFibre Connect Starter 25Mbps - Small offices and retail stores', true),

  ('BizFibre Connect Plus', 'fibre', 'BizFibreConnect', 'business', 50, 50, 2499.00, ARRAY['dfa'],
   '{"provider":"DFA","wholesale_cost":1422,"router_model":"Reyee RG-EG105G-P","sla":"99.5%","data_cap":"Uncapped"}'::jsonb,
   true, 'DFA BizFibre Connect Plus 50Mbps - Growing SMEs with PoE support', true),

  ('BizFibre Connect Pro', 'fibre', 'BizFibreConnect', 'business', 100, 100, 2999.00, ARRAY['dfa'],
   '{"provider":"DFA","wholesale_cost":1731,"router_model":"Reyee RG-EG305GH-P-E","router_rental":99,"sla":"99.5%","data_cap":"Uncapped"}'::jsonb,
   true, 'DFA BizFibre Connect Pro 100Mbps - Medium businesses with VPN requirements', true),

  ('BizFibre Connect Ultra', 'fibre', 'BizFibreConnect', 'business', 200, 200, 4373.00, ARRAY['dfa'],
   '{"provider":"DFA","wholesale_cost":2875,"router_model":"Reyee RG-EG310GH-P-E","router_rental":149,"sla":"99.5%","data_cap":"Uncapped"}'::jsonb,
   true, 'DFA BizFibre Connect Ultra 200Mbps - Large offices and mission-critical operations', true);

-- =====================================================
-- SECTION 3: SKYFIBRE RESIDENTIAL (MTN Tarana Wireless) - 3 Products
-- =====================================================

INSERT INTO service_packages (
  name, service_type, product_category, customer_type,
  speed_down, speed_up, price,
  compatible_providers, provider_specific_config,
  active, description, requires_fttb_coverage
) VALUES
  ('SkyFibre Starter', 'uncapped_wireless', 'SkyFibre', 'consumer', 50, 50, 799.00, ARRAY['mtn'],
   '{"provider":"MTN","technology":"Tarana G1","wholesale_cost":499,"installation_fee":900,"latency":"<5ms","data_cap":"Uncapped"}'::jsonb,
   true, 'SkyFibre Starter 50Mbps - Fixed wireless with sub-5ms latency', false),

  ('SkyFibre Plus', 'uncapped_wireless', 'SkyFibre', 'consumer', 100, 100, 899.00, ARRAY['mtn'],
   '{"provider":"MTN","technology":"Tarana G1","wholesale_cost":599,"installation_fee":900,"latency":"<5ms","data_cap":"Uncapped"}'::jsonb,
   true, 'SkyFibre Plus 100Mbps - Premium wireless with fibre-equivalent performance', false),

  ('SkyFibre Pro', 'uncapped_wireless', 'SkyFibre', 'consumer', 200, 200, 1099.00, ARRAY['mtn'],
   '{"provider":"MTN","technology":"Tarana G1","wholesale_cost":699,"installation_fee":900,"latency":"<5ms","data_cap":"Uncapped"}'::jsonb,
   true, 'SkyFibre Pro 200Mbps - Top-tier wireless with gaming-ready latency', false);

-- =====================================================
-- SECTION 4: MTN BUSINESS 5G (MTN EBU Deals) - 3 Products
-- =====================================================

INSERT INTO service_packages (
  name, service_type, product_category, customer_type,
  speed_down, speed_up, price,
  compatible_providers, provider_specific_config,
  active, description, requires_fttb_coverage
) VALUES
  ('MTN Business 5G Essential', '5g', 'MTN 5G Business', 'business', 35, 10, 449.00, ARRAY['mtn'],
   '{"provider":"MTN","deal_code":"202501EBU2013","fup_data":"500GB","post_fup_speed":"2 Mbps","data_cap":"500GB"}'::jsonb,
   true, 'MTN Business 5G Essential 35Mbps - Small offices with 500GB FUP', false),

  ('MTN Business 5G Professional', '5g', 'MTN 5G Business', 'business', 60, 15, 649.00, ARRAY['mtn'],
   '{"provider":"MTN","deal_code":"202501EBU2012","fup_data":"800GB","post_fup_speed":"2 Mbps","data_cap":"800GB"}'::jsonb,
   true, 'MTN Business 5G Professional 60Mbps - Medium businesses with 800GB FUP', false),

  ('MTN Business 5G Enterprise', '5g', 'MTN 5G Business', 'business', 100, 20, 949.00, ARRAY['mtn'],
   '{"provider":"MTN","deal_code":"202501EBU2014","fup_data":"1.5TB","post_fup_speed":"5 Mbps","speed_note":"Best effort 100-300 Mbps","data_cap":"1.5TB"}'::jsonb,
   true, 'MTN Business 5G Enterprise - Large offices with 1.5TB FUP, best-effort speeds', false);

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  total INTEGER;
  mtn INTEGER;
  dfa INTEGER;
BEGIN
  SELECT COUNT(*) INTO total FROM service_packages
  WHERE name IN ('HomeFibre Starter','HomeFibre Plus','HomeFibre Max','HomeFibre Ultra',
                 'BizFibre Connect Lite','BizFibre Connect Starter','BizFibre Connect Plus','BizFibre Connect Pro','BizFibre Connect Ultra',
                 'SkyFibre Starter','SkyFibre Plus','SkyFibre Pro',
                 'MTN Business 5G Essential','MTN Business 5G Professional','MTN Business 5G Enterprise');

  SELECT COUNT(*) INTO mtn FROM service_packages WHERE 'mtn' = ANY(compatible_providers);
  SELECT COUNT(*) INTO dfa FROM service_packages WHERE 'dfa' = ANY(compatible_providers);

  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✓ Products Migration Complete';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Added: % products', total;
  RAISE NOTICE 'MTN: % | DFA: %', mtn, dfa;
  RAISE NOTICE '';

  IF total = 15 THEN
    RAISE NOTICE '✓✓✓ All 15 products successfully added!';
    RAISE NOTICE '  - 4 HomeFibre (MTN)';
    RAISE NOTICE '  - 5 BizFibre (DFA)';
    RAISE NOTICE '  - 3 SkyFibre (MTN)';
    RAISE NOTICE '  - 3 MTN 5G (MTN)';
  ELSE
    RAISE WARNING 'Expected 15, found %', total;
  END IF;
  RAISE NOTICE '================================================';
END $$;
