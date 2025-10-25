-- Update BizFibreConnect packages to match new pricing and specifications
-- Migration: 20250125_update_bizfibre_packages.sql
-- Date: January 25, 2025

BEGIN;

-- First, deactivate old BizFibre packages
UPDATE service_packages
SET active = false
WHERE service_type = 'BizFibreConnect'
  AND customer_type = 'business';

-- Insert new BizFibreConnect packages with correct pricing and speeds
-- All packages are symmetric (same upload/download speeds)

-- 1. BizFibre Connect Lite - 10/10 Mbps - R1,699
INSERT INTO service_packages (
  name,
  service_type,
  product_category,
  customer_type,
  speed_down,
  speed_up,
  price,
  promotion_price,
  promotion_months,
  description,
  features,
  compatible_providers,
  active,
  created_at,
  updated_at
) VALUES (
  'BizFibre Connect Lite',
  'BizFibreConnect',
  'fibre_business',
  'business',
  10,
  10,
  1699.00,
  NULL,
  NULL,
  'Perfect for micro businesses and home offices requiring reliable connectivity',
  ARRAY[
    'Uncapped data',
    'Symmetric 10/10 Mbps speeds',
    'DFA Business Broadband',
    'Active Ethernet delivery',
    'Enterprise-grade routing',
    '24-month contract',
    'SLA included'
  ]::text[],
  ARRAY['dfa']::text[],
  true,
  NOW(),
  NOW()
);

-- 2. BizFibre Connect Starter - 25/25 Mbps - R1,899
INSERT INTO service_packages (
  name,
  service_type,
  product_category,
  customer_type,
  speed_down,
  speed_up,
  price,
  promotion_price,
  promotion_months,
  description,
  features,
  compatible_providers,
  active,
  created_at,
  updated_at
) VALUES (
  'BizFibre Connect Starter',
  'BizFibreConnect',
  'fibre_business',
  'business',
  25,
  25,
  1899.00,
  NULL,
  NULL,
  'Ideal for small offices and retail stores with multiple users',
  ARRAY[
    'Uncapped data',
    'Symmetric 25/25 Mbps speeds',
    'DFA Business Broadband',
    'Active Ethernet delivery',
    'Enterprise-grade routing',
    '24-month contract',
    'SLA included',
    'Priority support'
  ]::text[],
  ARRAY['dfa']::text[],
  true,
  NOW(),
  NOW()
);

-- 3. BizFibre Connect Plus - 50/50 Mbps - R2,499
INSERT INTO service_packages (
  name,
  service_type,
  product_category,
  customer_type,
  speed_down,
  speed_up,
  price,
  promotion_price,
  promotion_months,
  description,
  features,
  compatible_providers,
  active,
  created_at,
  updated_at
) VALUES (
  'BizFibre Connect Plus',
  'BizFibreConnect',
  'fibre_business',
  'business',
  50,
  50,
  2499.00,
  NULL,
  NULL,
  'Perfect for growing SMEs and multi-user offices',
  ARRAY[
    'Uncapped data',
    'Symmetric 50/50 Mbps speeds',
    'DFA Business Broadband',
    'Active Ethernet delivery',
    'Enterprise-grade routing',
    '24-month contract',
    'SLA included',
    'Priority support',
    'Cloud-ready performance'
  ]::text[],
  ARRAY['dfa']::text[],
  true,
  NOW(),
  NOW()
);

-- 4. BizFibre Connect Pro - 100/100 Mbps - R2,999
INSERT INTO service_packages (
  name,
  service_type,
  product_category,
  customer_type,
  speed_down,
  speed_up,
  price,
  promotion_price,
  promotion_months,
  description,
  features,
  compatible_providers,
  active,
  created_at,
  updated_at
) VALUES (
  'BizFibre Connect Pro',
  'BizFibreConnect',
  'fibre_business',
  'business',
  100,
  100,
  2999.00,
  NULL,
  NULL,
  'Designed for medium businesses with heavy cloud usage',
  ARRAY[
    'Uncapped data',
    'Symmetric 100/100 Mbps speeds',
    'DFA Business Broadband',
    'Active Ethernet delivery',
    'Enterprise-grade routing',
    '24-month contract',
    'SLA included',
    'Priority support',
    'Cloud-optimized',
    'VoIP ready'
  ]::text[],
  ARRAY['dfa']::text[],
  true,
  NOW(),
  NOW()
);

-- 5. BizFibre Connect Ultra - 200/200 Mbps - R4,373
INSERT INTO service_packages (
  name,
  service_type,
  product_category,
  customer_type,
  speed_down,
  speed_up,
  price,
  promotion_price,
  promotion_months,
  description,
  features,
  compatible_providers,
  active,
  created_at,
  updated_at
) VALUES (
  'BizFibre Connect Ultra',
  'BizFibreConnect',
  'fibre_business',
  'business',
  200,
  200,
  4373.00,
  NULL,
  NULL,
  'Enterprise-grade connectivity for large offices and mission-critical operations',
  ARRAY[
    'Uncapped data',
    'Symmetric 200/200 Mbps speeds',
    'DFA Business Broadband',
    'Active Ethernet delivery',
    'Enterprise-grade routing',
    '24-month contract',
    'Premium SLA',
    '24/7 priority support',
    'Mission-critical ready',
    'Multi-site capable',
    'Advanced QoS'
  ]::text[],
  ARRAY['dfa']::text[],
  true,
  NOW(),
  NOW()
);

-- Provider insert intentionally omitted: managed by later migrations (20251021*)

-- Service type mapping insert omitted; managed by service_type_mapping migrations

COMMIT;

-- Verify the changes
SELECT 
  name,
  speed_down || '/' || speed_up || ' Mbps' as speeds,
  'R' || price::text as monthly_price,
  customer_type,
  active
FROM service_packages
WHERE service_type = 'BizFibreConnect'
  AND customer_type = 'business'
ORDER BY price ASC;
