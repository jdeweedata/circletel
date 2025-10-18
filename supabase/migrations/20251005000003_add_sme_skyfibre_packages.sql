-- SME SkyFibre Packages
-- Product Specification: ProductSpec_SkyFibre-SME_v2.0_2025-01-10_19
-- MTN Tarana G1 Fixed Wireless for Small to Medium Businesses

-- Insert SME SkyFibre packages
INSERT INTO service_packages (
  name,
  service_type,
  speed_down,
  speed_up,
  price,
  promotion_price,
  promotion_months,
  description,
  features,
  active,
  sort_order,
  customer_type,
  product_category,
  requires_fttb_coverage,
  network_provider_id
) VALUES

-- SME Essential: 50 Mbps
(
  'SkyFibre SME Essential',
  'SkyFibre',
  50,
  50, -- Symmetrical speeds
  999,
  NULL, -- No promotion pricing
  0,
  'Affordable Fixed Wireless for small businesses (5-15 employees)',
  ARRAY[
    '50 Mbps Symmetrical Speed',
    '1 TB Monthly Data (1000 GB)',
    'Business Hours: 400 GB',
    'After Hours: 600 GB',
    '1 Static IP Included',
    'Router Rental: R99/month',
    'Business Support (07:00-18:00)',
    '98.5% Uptime SLA',
    '8 Hour Response Time',
    '12 Month Contract',
    'R999 Setup Fee'
  ],
  true,
  20, -- Sort after consumer SkyFibre
  'business',
  'wireless',
  false,
  NULL -- MTN provider (to be linked when MTN provider is added)
),

-- SME Professional: 100 Mbps
(
  'SkyFibre SME Professional',
  'SkyFibre',
  100,
  100, -- Symmetrical speeds
  1499,
  NULL,
  0,
  'Professional Fixed Wireless for growing businesses (15-30 employees)',
  ARRAY[
    '100 Mbps Symmetrical Speed',
    '1.5 TB Monthly Data (1500 GB)',
    'Business Hours: 600 GB',
    'After Hours: 900 GB',
    '1 Static IP Included',
    'Router Rental: R99/month',
    'Priority Business Support',
    '99.0% Uptime SLA',
    '4 Hour Response Time',
    '12 Month Contract',
    'R999 Setup Fee'
  ],
  true,
  21,
  'business',
  'wireless',
  false,
  NULL
),

-- SME Premium: 200 Mbps
(
  'SkyFibre SME Premium',
  'SkyFibre',
  200,
  200, -- Symmetrical speeds
  2299,
  NULL,
  0,
  'Premium Fixed Wireless for established businesses (30-50 employees)',
  ARRAY[
    '200 Mbps Symmetrical Speed',
    '2 TB Monthly Data (2000 GB)',
    'Business Hours: 800 GB',
    'After Hours: 1200 GB',
    '2 Static IPs Included',
    'Router Included (No Rental)',
    'Premium Business Support',
    '99.5% Uptime SLA',
    '2 Hour Response Time',
    '12 Month Contract',
    'R999 Setup Fee'
  ],
  true,
  22,
  'business',
  'wireless',
  false,
  NULL
);

-- Add comments for documentation
COMMENT ON TABLE service_packages IS 'Service packages including consumer, business (FTTB), and SME wireless packages';

-- Create view for SME packages only
CREATE OR REPLACE VIEW sme_packages AS
SELECT
  id,
  name,
  service_type,
  speed_down,
  speed_up,
  price,
  promotion_price,
  description,
  features,
  customer_type,
  product_category,
  active,
  created_at
FROM service_packages
WHERE name LIKE '%SME%'
  AND customer_type = 'business'
  AND product_category = 'wireless'
  AND active = true
ORDER BY price ASC;

COMMENT ON VIEW sme_packages IS 'SME SkyFibre wireless packages for small to medium businesses (5-50 employees)';
