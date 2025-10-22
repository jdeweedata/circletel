-- =====================================================
-- Add MTN Products to Database
-- Created: 2025-10-21
-- Purpose: Add 13 MTN products (HomeFibreConnect, BizFibreConnect, 5G/LTE)
-- Task: 1A.2
-- =====================================================

-- STEP 1: Insert Consumer HomeFibreConnect Products (4 products)
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
  -- HomeFibreConnect 50Mbps
  (
    'HomeFibreConnect 50Mbps',
    'fibre',
    'HomeFibreConnect',
    'consumer',
    50,
    50,
    899.00,
    'ZAR',
    'monthly',
    'Uncapped',
    ARRAY['mtn'],
    '{"provider_service_name": "FTTH 50Mbps", "installation_fee": 0, "router_included": true}'::jsonb,
    true,
    false,
    'MTN HomeFibreConnect 50Mbps fibre internet - uncapped data, symmetric speeds'
  ),
  -- HomeFibreConnect 100Mbps
  (
    'HomeFibreConnect 100Mbps',
    'fibre',
    'HomeFibreConnect',
    'consumer',
    100,
    100,
    1399.00,
    'ZAR',
    'monthly',
    'Uncapped',
    ARRAY['mtn'],
    '{"provider_service_name": "FTTH 100Mbps", "installation_fee": 0, "router_included": true}'::jsonb,
    true,
    true,
    'MTN HomeFibreConnect 100Mbps fibre internet - uncapped data, symmetric speeds'
  ),
  -- HomeFibreConnect 200Mbps
  (
    'HomeFibreConnect 200Mbps',
    'fibre',
    'HomeFibreConnect',
    'consumer',
    200,
    200,
    1799.00,
    'ZAR',
    'monthly',
    'Uncapped',
    ARRAY['mtn'],
    '{"provider_service_name": "FTTH 200Mbps", "installation_fee": 0, "router_included": true}'::jsonb,
    true,
    true,
    'MTN HomeFibreConnect 200Mbps fibre internet - uncapped data, symmetric speeds'
  ),
  -- HomeFibreConnect 1Gbps
  (
    'HomeFibreConnect 1Gbps',
    'fibre',
    'HomeFibreConnect',
    'consumer',
    1000,
    1000,
    2299.00,
    'ZAR',
    'monthly',
    'Uncapped',
    ARRAY['mtn'],
    '{"provider_service_name": "FTTH 1Gbps", "installation_fee": 0, "router_included": true}'::jsonb,
    true,
    true,
    'MTN HomeFibreConnect 1Gbps fibre internet - uncapped data, symmetric speeds, premium tier'
  )
ON CONFLICT (name) DO UPDATE SET
  service_type = EXCLUDED.service_type,
  product_category = EXCLUDED.product_category,
  customer_type = EXCLUDED.customer_type,
  speed_down = EXCLUDED.speed_down,
  speed_up = EXCLUDED.speed_up,
  price = EXCLUDED.price,
  compatible_providers = EXCLUDED.compatible_providers,
  provider_specific_config = EXCLUDED.provider_specific_config,
  description = EXCLUDED.description;

-- STEP 2: Insert Business BizFibreConnect Products (3 products)
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
  -- BizFibreConnect 100Mbps
  (
    'BizFibreConnect 100Mbps',
    'fibre',
    'BizFibreConnect',
    'business',
    100,
    100,
    1899.00,
    'ZAR',
    'monthly',
    'Uncapped',
    ARRAY['mtn'],
    '{"provider_service_name": "Business FTTH 100Mbps", "installation_fee": 0, "router_included": true, "sla": "99.5%", "support_level": "business"}'::jsonb,
    true,
    false,
    'MTN BizFibreConnect 100Mbps - business-grade fibre with SLA and priority support'
  ),
  -- BizFibreConnect 200Mbps
  (
    'BizFibreConnect 200Mbps',
    'fibre',
    'BizFibreConnect',
    'business',
    200,
    200,
    2799.00,
    'ZAR',
    'monthly',
    'Uncapped',
    ARRAY['mtn'],
    '{"provider_service_name": "Business FTTH 200Mbps", "installation_fee": 0, "router_included": true, "sla": "99.5%", "support_level": "business"}'::jsonb,
    true,
    true,
    'MTN BizFibreConnect 200Mbps - business-grade fibre with SLA and priority support'
  ),
  -- BizFibreConnect 1Gbps
  (
    'BizFibreConnect 1Gbps',
    'fibre',
    'BizFibreConnect',
    'business',
    1000,
    1000,
    4999.00,
    'ZAR',
    'monthly',
    'Uncapped',
    ARRAY['mtn'],
    '{"provider_service_name": "Business FTTH 1Gbps", "installation_fee": 0, "router_included": true, "sla": "99.9%", "support_level": "enterprise"}'::jsonb,
    true,
    true,
    'MTN BizFibreConnect 1Gbps - enterprise-grade fibre with 99.9% SLA and 24/7 support'
  )
ON CONFLICT (name) DO UPDATE SET
  service_type = EXCLUDED.service_type,
  product_category = EXCLUDED.product_category,
  customer_type = EXCLUDED.customer_type,
  speed_down = EXCLUDED.speed_down,
  speed_up = EXCLUDED.speed_up,
  price = EXCLUDED.price,
  compatible_providers = EXCLUDED.compatible_providers,
  provider_specific_config = EXCLUDED.provider_specific_config,
  description = EXCLUDED.description;

-- STEP 3: Insert Consumer 5G/LTE Products (3 products)
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
  -- MTN 5G 100GB Consumer
  (
    'MTN 5G 100GB',
    '5g',
    'MTN 5G Consumer',
    'consumer',
    100,
    20,
    349.00,
    'ZAR',
    'monthly',
    '100GB',
    ARRAY['mtn'],
    '{"provider_service_name": "5G 100GB", "router_required": true, "sim_included": true}'::jsonb,
    true,
    false,
    'MTN 5G wireless internet - 100GB monthly data, high-speed 5G where available'
  ),
  -- MTN 5G 200GB Consumer
  (
    'MTN 5G 200GB',
    '5g',
    'MTN 5G Consumer',
    'consumer',
    100,
    20,
    599.00,
    'ZAR',
    'monthly',
    '200GB',
    ARRAY['mtn'],
    '{"provider_service_name": "5G 200GB", "router_required": true, "sim_included": true}'::jsonb,
    true,
    true,
    'MTN 5G wireless internet - 200GB monthly data, high-speed 5G where available'
  ),
  -- MTN LTE Uncapped Consumer
  (
    'MTN LTE Uncapped',
    'lte',
    'MTN LTE Consumer',
    'consumer',
    20,
    5,
    699.00,
    'ZAR',
    'monthly',
    'Uncapped',
    ARRAY['mtn'],
    '{"provider_service_name": "LTE Uncapped", "router_required": true, "sim_included": true, "fair_usage_policy": "1TB soft cap"}'::jsonb,
    true,
    true,
    'MTN LTE wireless internet - uncapped data with 1TB fair usage policy'
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
  description = EXCLUDED.description;

-- STEP 4: Insert Business 5G/LTE Products (3 products)
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
  -- MTN 5G 200GB Business
  (
    'MTN 5G 200GB Business',
    '5g',
    'MTN 5G Business',
    'business',
    100,
    20,
    499.00,
    'ZAR',
    'monthly',
    '200GB',
    ARRAY['mtn'],
    '{"provider_service_name": "Business 5G 200GB", "router_required": true, "sim_included": true, "support_level": "business"}'::jsonb,
    true,
    false,
    'MTN Business 5G - 200GB monthly data, priority network access, business support'
  ),
  -- MTN 5G 500GB Business
  (
    'MTN 5G 500GB Business',
    '5g',
    'MTN 5G Business',
    'business',
    100,
    20,
    799.00,
    'ZAR',
    'monthly',
    '500GB',
    ARRAY['mtn'],
    '{"provider_service_name": "Business 5G 500GB", "router_required": true, "sim_included": true, "support_level": "business"}'::jsonb,
    true,
    true,
    'MTN Business 5G - 500GB monthly data, priority network access, business support'
  ),
  -- MTN LTE Uncapped Business
  (
    'MTN LTE Uncapped Business',
    'lte',
    'MTN LTE Business',
    'business',
    20,
    5,
    1099.00,
    'ZAR',
    'monthly',
    'Uncapped',
    ARRAY['mtn'],
    '{"provider_service_name": "Business LTE Uncapped", "router_required": true, "sim_included": true, "fair_usage_policy": "2TB soft cap", "support_level": "business"}'::jsonb,
    true,
    true,
    'MTN Business LTE - uncapped data with 2TB fair usage, priority support'
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
  description = EXCLUDED.description;

-- STEP 5: Verification and Summary
DO $$
DECLARE
  homefibre_count INTEGER;
  bizfibre_count INTEGER;
  consumer_wireless_count INTEGER;
  business_wireless_count INTEGER;
  total_mtn_products INTEGER;
BEGIN
  SELECT COUNT(*) INTO homefibre_count
  FROM service_packages
  WHERE product_category = 'HomeFibreConnect' AND 'mtn' = ANY(compatible_providers);

  SELECT COUNT(*) INTO bizfibre_count
  FROM service_packages
  WHERE product_category = 'BizFibreConnect' AND 'mtn' = ANY(compatible_providers);

  SELECT COUNT(*) INTO consumer_wireless_count
  FROM service_packages
  WHERE customer_type = 'consumer'
    AND service_type IN ('5g', 'lte')
    AND 'mtn' = ANY(compatible_providers);

  SELECT COUNT(*) INTO business_wireless_count
  FROM service_packages
  WHERE customer_type = 'business'
    AND service_type IN ('5g', 'lte')
    AND 'mtn' = ANY(compatible_providers);

  SELECT COUNT(*) INTO total_mtn_products
  FROM service_packages
  WHERE 'mtn' = ANY(compatible_providers);

  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'MTN Products Added Successfully';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Product Breakdown:';
  RAISE NOTICE '  ✓ HomeFibreConnect (Consumer): % products', homefibre_count;
  RAISE NOTICE '  ✓ BizFibreConnect (Business): % products', bizfibre_count;
  RAISE NOTICE '  ✓ 5G/LTE (Consumer): % products', consumer_wireless_count;
  RAISE NOTICE '  ✓ 5G/LTE (Business): % products', business_wireless_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Total MTN Products: %', total_mtn_products;
  RAISE NOTICE '';
  IF total_mtn_products = 13 THEN
    RAISE NOTICE '✓ All 13 MTN products successfully added!';
  ELSE
    RAISE WARNING '⚠ Expected 13 MTN products, found %', total_mtn_products;
  END IF;
  RAISE NOTICE '';
  RAISE NOTICE 'Ready for Task 1A.3: Provider Mapping Interface';
  RAISE NOTICE '================================================';
END $$;

-- =====================================================
-- Migration Complete
-- =====================================================
