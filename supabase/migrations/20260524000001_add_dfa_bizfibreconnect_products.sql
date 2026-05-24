-- Add DFA BizFibreConnect products to service_packages
-- Source: products/wholesale/dfa/CircleTel_BizFibreConnect__Business_Fibre_Product_Portfolio_-_DFA_Based.md
-- 4 tiers: 25/50/100/200 Mbps symmetrical, DFA-only (compatible_providers = ['dfa'])
-- Cost stack per customer: R127.34/mo infrastructure + DFA wholesale MRC

-- STEP 1: Insert 4 DFA BizFibreConnect products
INSERT INTO service_packages (
  name,
  slug,
  sku,
  service_type,
  product_category,
  customer_type,
  speed_down,
  speed_up,
  price,
  cost_price_zar,
  compatible_providers,
  provider,
  provider_specific_config,
  pricing,
  features,
  active,
  is_featured,
  is_popular,
  status,
  sort_order,
  market_segment,
  description,
  metadata
) VALUES
  (
    'DFA BizFibreConnect 25Mbps',
    'dfa-bizfibreconnect-25',
    'DFA-BFC-025',
    'BizFibreConnect',
    'fibre_business',
    'business',
    25,
    25,
    1899.00,
    1287.34,
    ARRAY['dfa'],
    'dfa',
    '{"provider_service_name": "Magellan Business Broadband 25Mbps", "installation_fee": 1500, "router_included": false, "sla": "99.5%", "support_level": "business", "wholesale_mrc": 1160.00, "infrastructure_cost": 127.34}'::jsonb,
    '{"monthly": 1899.00, "setup": 1500.00, "download_speed": 25, "upload_speed": 25}'::jsonb,
    ARRAY['25Mbps symmetrical fibre', 'Uncapped data', 'Business-grade SLA 99.5%', 'Priority support', 'Static IP included'],
    true,
    false,
    false,
    'active',
    10,
    'smme',
    'DFA BizFibreConnect 25Mbps - symmetrical business fibre via Dark Fibre Africa network',
    '{"contract_months": 24, "installation_days_connected": 10, "installation_days_nearnet": 20, "margin_percent": 32.2, "wholesale_provider": "dfa", "fibre_network": "DFA"}'::jsonb
  ),
  (
    'DFA BizFibreConnect 50Mbps',
    'dfa-bizfibreconnect-50',
    'DFA-BFC-050',
    'BizFibreConnect',
    'fibre_business',
    'business',
    50,
    50,
    2499.00,
    1755.34,
    ARRAY['dfa'],
    'dfa',
    '{"provider_service_name": "Magellan Business Broadband 50Mbps", "installation_fee": 1500, "router_included": false, "sla": "99.5%", "support_level": "business", "wholesale_mrc": 1628.00, "infrastructure_cost": 127.34}'::jsonb,
    '{"monthly": 2499.00, "setup": 1500.00, "download_speed": 50, "upload_speed": 50}'::jsonb,
    ARRAY['50Mbps symmetrical fibre', 'Uncapped data', 'Business-grade SLA 99.5%', 'Priority support', 'Static IP included'],
    true,
    false,
    true,
    'active',
    20,
    'smme',
    'DFA BizFibreConnect 50Mbps - symmetrical business fibre via Dark Fibre Africa network',
    '{"contract_months": 24, "installation_days_connected": 10, "installation_days_nearnet": 20, "margin_percent": 29.8, "wholesale_provider": "dfa", "fibre_network": "DFA"}'::jsonb
  ),
  (
    'DFA BizFibreConnect 100Mbps',
    'dfa-bizfibreconnect-100',
    'DFA-BFC-100',
    'BizFibreConnect',
    'fibre_business',
    'business',
    100,
    100,
    2999.00,
    2109.34,
    ARRAY['dfa'],
    'dfa',
    '{"provider_service_name": "Magellan Business Broadband 100Mbps", "installation_fee": 1500, "router_included": false, "sla": "99.5%", "support_level": "business", "wholesale_mrc": 1982.00, "infrastructure_cost": 127.34}'::jsonb,
    '{"monthly": 2999.00, "setup": 1500.00, "download_speed": 100, "upload_speed": 100}'::jsonb,
    ARRAY['100Mbps symmetrical fibre', 'Uncapped data', 'Business-grade SLA 99.5%', 'Priority support', 'Static IP included'],
    true,
    true,
    true,
    'active',
    30,
    'smme',
    'DFA BizFibreConnect 100Mbps - symmetrical business fibre via Dark Fibre Africa network',
    '{"contract_months": 24, "installation_days_connected": 10, "installation_days_nearnet": 20, "margin_percent": 29.7, "wholesale_provider": "dfa", "fibre_network": "DFA"}'::jsonb
  ),
  (
    'DFA BizFibreConnect 200Mbps',
    'dfa-bizfibreconnect-200',
    'DFA-BFC-200',
    'BizFibreConnect',
    'fibre_business',
    'business',
    200,
    200,
    4373.00,
    3420.34,
    ARRAY['dfa'],
    'dfa',
    '{"provider_service_name": "Magellan Business Broadband 200Mbps", "installation_fee": 1500, "router_included": false, "sla": "99.5%", "support_level": "business", "wholesale_mrc": 3293.00, "infrastructure_cost": 127.34}'::jsonb,
    '{"monthly": 4373.00, "setup": 1500.00, "download_speed": 200, "upload_speed": 200}'::jsonb,
    ARRAY['200Mbps symmetrical fibre', 'Uncapped data', 'Business-grade SLA 99.5%', 'Priority support', 'Static IP included'],
    true,
    false,
    false,
    'active',
    40,
    'enterprise',
    'DFA BizFibreConnect 200Mbps - high-capacity symmetrical business fibre via Dark Fibre Africa network',
    '{"contract_months": 24, "installation_days_connected": 10, "installation_days_nearnet": 20, "margin_percent": 21.8, "wholesale_provider": "dfa", "fibre_network": "DFA"}'::jsonb
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  service_type = EXCLUDED.service_type,
  product_category = EXCLUDED.product_category,
  customer_type = EXCLUDED.customer_type,
  speed_down = EXCLUDED.speed_down,
  speed_up = EXCLUDED.speed_up,
  price = EXCLUDED.price,
  cost_price_zar = EXCLUDED.cost_price_zar,
  compatible_providers = EXCLUDED.compatible_providers,
  provider = EXCLUDED.provider,
  provider_specific_config = EXCLUDED.provider_specific_config,
  pricing = EXCLUDED.pricing,
  features = EXCLUDED.features,
  metadata = EXCLUDED.metadata,
  description = EXCLUDED.description;

-- STEP 2: service_type_mapping already has ('fibre', 'dfa', 'fibre_business') — no insert needed
-- The existing mapping covers DFA BizFibreConnect products via the fibre_business category

-- STEP 3: Verify
DO $$
DECLARE
  dfa_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dfa_count FROM service_packages
  WHERE 'dfa' = ANY(compatible_providers) AND active = true;
  RAISE NOTICE '[DFA Products] % active DFA BizFibreConnect products seeded', dfa_count;
END $$;
