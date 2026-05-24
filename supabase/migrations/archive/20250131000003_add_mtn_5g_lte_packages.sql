-- Add MTN 5G and LTE packages to service_packages table
-- Based on docs/products/active/MTN 5G-LTE/mtn-5g-product-doc.md and mtn-broadband-lte-product-doc.md

-- First, ensure product_category column exists (should already exist from previous migration)
ALTER TABLE service_packages ADD COLUMN IF NOT EXISTS product_category VARCHAR(50);

-- Update the service_type check constraint to allow 5g and lte values
ALTER TABLE service_packages DROP CONSTRAINT IF EXISTS service_packages_service_type_check;
ALTER TABLE service_packages ADD CONSTRAINT service_packages_service_type_check
CHECK (service_type IN ('SkyFibre', 'HomeFibreConnect', 'BizFibreConnect', 'All', '5g', 'lte', 'fixed_lte', 'fibre', 'uncapped_wireless'));

-- MTN 5G Packages (3 products)
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
  active,
  sort_order
) VALUES
-- 5G Essential (35Mbps)
(
  'MTN Business Uncapped 5G 35Mbps',
  '5g',
  '5G',
  35,
  35,
  449.00,
  NULL,
  NULL,
  'MTN Business 5G Essential - Guaranteed 35Mbps with 500GB Fair Usage Policy',
  ARRAY[
    'Guaranteed 35 Mbps speed',
    '500GB Fair Usage Policy',
    'Speeds reduced to 2 Mbps after FUP',
    'Static IP included',
    '24-month contract',
    'Work Express priority data',
    'BYOD or Huawei H155-382 5G CPE available',
    'Promotion valid Feb 1 - Sept 7, 2025',
    'Deal Code: 202501EBU2013 (SIM) / 202504EBU9916 (Router)'
  ],
  true,
  1
),
-- 5G Professional (60Mbps)
(
  'MTN Business Uncapped 5G 60Mbps',
  '5g',
  '5G',
  60,
  60,
  649.00,
  NULL,
  NULL,
  'MTN Business 5G Professional - Guaranteed 60Mbps with 800GB Fair Usage Policy',
  ARRAY[
    'Guaranteed 60 Mbps speed',
    '800GB Fair Usage Policy',
    'Speeds reduced to 2 Mbps after FUP',
    'Static IP included',
    '24-month contract',
    'Work Express priority data',
    'BYOD or Huawei H155-382 5G CPE available',
    'Promotion valid Feb 1 - Sept 7, 2025',
    'Deal Code: 202501EBU2012 (SIM) / 202504EBU9918 (Router)'
  ],
  true,
  2
),
-- 5G Enterprise (Best Effort)
(
  'MTN Business Uncapped 5G Best Effort',
  '5g',
  '5G',
  150,
  150,
  949.00,
  NULL,
  NULL,
  'MTN Business 5G Enterprise - Best Effort speeds (100-300 Mbps typical) with 1.5TB Fair Usage Policy',
  ARRAY[
    'Best Effort 100-300 Mbps typical speed',
    '1.5TB Fair Usage Policy',
    'Speeds reduced to 5 Mbps after FUP',
    'Static IP included',
    '24-month contract',
    'Work Express priority data',
    'BYOD or Huawei H155-382 5G CPE available',
    'Promotion valid Feb 1 - Sept 7, 2025',
    'Deal Code: 202501EBU2014 (SIM) / 202504EBU9919 (Router)'
  ],
  true,
  3
);

-- MTN LTE Packages (11 products)
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
  active,
  sort_order
) VALUES
-- 10GB Package
(
  'MTN Business Broadband LTE 10GB',
  'lte',
  'LTE',
  10,
  5,
  85.00,
  NULL,
  NULL,
  'MTN Business LTE 10GB - Includes 5GB Work Express priority data',
  ARRAY[
    '10GB Anytime Data',
    '5GB Work Express Data (Priority 06:00-18:00 Mon-Fri)',
    '15GB Total Data',
    '24-month contract',
    'Static IP available',
    'BYOD or Vida Technologies CPE 4000 Plus available',
    'Promotion valid Feb 1 - Sept 7, 2025'
  ],
  true,
  10
),
-- 15GB Package
(
  'MTN Business Broadband LTE 15GB',
  'lte',
  'LTE',
  15,
  7,
  109.00,
  NULL,
  NULL,
  'MTN Business LTE 15GB - Includes 10GB Work Express priority data',
  ARRAY[
    '15GB Anytime Data',
    '10GB Work Express Data (Priority 06:00-18:00 Mon-Fri)',
    '25GB Total Data',
    '24-month contract',
    'Static IP available',
    'BYOD or Vida Technologies CPE 4000 Plus available',
    'Promotion valid Feb 1 - Sept 7, 2025'
  ],
  true,
  11
),
-- 30GB Package
(
  'MTN Business Broadband LTE 30GB',
  'lte',
  'LTE',
  20,
  10,
  179.00,
  NULL,
  NULL,
  'MTN Business LTE 30GB - Includes 30GB Work Express priority data',
  ARRAY[
    '30GB Anytime Data',
    '30GB Work Express Data (Priority 06:00-18:00 Mon-Fri)',
    '60GB Total Data',
    '24-month contract',
    'Static IP available',
    'BYOD or Vida Technologies CPE 4000 Plus available',
    'Promotion valid Feb 1 - Sept 7, 2025'
  ],
  true,
  12
),
-- 60GB Package
(
  'MTN Business Broadband LTE 60GB',
  'lte',
  'LTE',
  25,
  12,
  269.00,
  NULL,
  NULL,
  'MTN Business LTE 60GB - Includes 60GB Work Express priority data',
  ARRAY[
    '60GB Anytime Data',
    '60GB Work Express Data (Priority 06:00-18:00 Mon-Fri)',
    '120GB Total Data',
    '24-month contract',
    'Static IP available',
    'BYOD or Vida Technologies CPE 4000 Plus available',
    'Promotion valid Feb 1 - Sept 7, 2025'
  ],
  true,
  13
),
-- 60GB + 30GB Bonus Package
(
  'MTN Business Broadband LTE 60GB + 30GB Bonus',
  'lte',
  'LTE',
  30,
  15,
  289.00,
  NULL,
  NULL,
  'MTN Business LTE 60GB with 30GB Bonus - Includes 60GB Work Express priority data',
  ARRAY[
    '60GB Anytime Data',
    '30GB Bonus Data',
    '60GB Work Express Data (Priority 06:00-18:00 Mon-Fri)',
    '150GB Total Data',
    '24-month contract',
    'Static IP available',
    'BYOD or Vida Technologies CPE 4000 Plus available',
    'Promotion valid Feb 1 - Sept 7, 2025'
  ],
  true,
  14
),
-- 110GB Package
(
  'MTN Business Broadband LTE 110GB',
  'lte',
  'LTE',
  35,
  17,
  369.00,
  NULL,
  NULL,
  'MTN Business LTE 110GB - Includes 110GB Work Express priority data',
  ARRAY[
    '110GB Anytime Data',
    '110GB Work Express Data (Priority 06:00-18:00 Mon-Fri)',
    '220GB Total Data',
    '24-month contract',
    'Static IP available',
    'BYOD or Vida Technologies CPE 4000 Plus available',
    'Promotion valid Feb 1 - Sept 7, 2025'
  ],
  true,
  15
),
-- 170GB Package
(
  'MTN Business Broadband LTE 170GB',
  'lte',
  'LTE',
  40,
  20,
  329.00,
  NULL,
  NULL,
  'MTN Business LTE 170GB - Includes 100GB Work Express priority data',
  ARRAY[
    '170GB Anytime Data',
    '100GB Work Express Data (Priority 06:00-18:00 Mon-Fri)',
    '270GB Total Data',
    '24-month contract',
    'Static IP available',
    'BYOD or Vida Technologies CPE 4000 Plus available',
    'Promotion valid Feb 1 - Sept 7, 2025'
  ],
  true,
  16
),
-- 230GB Package
(
  'MTN Business Broadband LTE 230GB',
  'lte',
  'LTE',
  45,
  22,
  519.00,
  NULL,
  NULL,
  'MTN Business LTE 230GB - Includes 120GB Work Express priority data',
  ARRAY[
    '230GB Anytime Data',
    '120GB Work Express Data (Priority 06:00-18:00 Mon-Fri)',
    '350GB Total Data',
    '24-month contract',
    'Static IP available',
    'BYOD or Vida Technologies CPE 4000 Plus available',
    'Promotion valid Feb 1 - Sept 7, 2025'
  ],
  true,
  17
),
-- 230GB + 150GB Bonus Package
(
  'MTN Business Broadband LTE 230GB + 150GB Bonus',
  'lte',
  'LTE',
  50,
  25,
  619.00,
  NULL,
  NULL,
  'MTN Business LTE 230GB with 150GB Bonus - Includes 120GB Work Express priority data',
  ARRAY[
    '230GB Anytime Data',
    '150GB Bonus Data',
    '120GB Work Express Data (Priority 06:00-18:00 Mon-Fri)',
    '500GB Total Data',
    '24-month contract',
    'Static IP available',
    'BYOD or Vida Technologies CPE 4000 Plus available',
    'Promotion valid Feb 1 - Sept 7, 2025'
  ],
  true,
  18
),
-- 380GB Package
(
  'MTN Business Broadband LTE 380GB',
  'lte',
  'LTE',
  55,
  27,
  649.00,
  NULL,
  NULL,
  'MTN Business LTE 380GB - Includes 200GB Work Express priority data',
  ARRAY[
    '380GB Anytime Data',
    '200GB Work Express Data (Priority 06:00-18:00 Mon-Fri)',
    '580GB Total Data',
    '24-month contract',
    'Static IP available',
    'BYOD or Vida Technologies CPE 4000 Plus available',
    'Promotion valid Feb 1 - Sept 7, 2025'
  ],
  true,
  19
),
-- 1TB Package
(
  'MTN Business Broadband LTE 1TB',
  'lte',
  'LTE',
  60,
  30,
  599.00,
  NULL,
  NULL,
  'MTN Business LTE 1TB - Pure anytime data, no Work Express',
  ARRAY[
    '1024GB Anytime Data',
    'No Work Express (Pure anytime data)',
    '24-month contract',
    'Static IP available',
    'BYOD or Vida Technologies CPE 4000 Plus available',
    'Promotion valid Feb 1 - Sept 7, 2025'
  ],
  true,
  20
);

-- Update service_type_mapping to include 5G and LTE mappings if not already present
INSERT INTO service_type_mapping (technical_type, provider, product_category, priority, notes)
VALUES
  ('5g', 'mtn', '5G', 1, 'MTN 5G service with guaranteed speeds and FUP')
ON CONFLICT (technical_type, provider, product_category) DO NOTHING;

INSERT INTO service_type_mapping (technical_type, provider, product_category, priority, notes)
VALUES
  ('lte', 'mtn', 'LTE', 3, 'MTN LTE capped data packages with Work Express')
ON CONFLICT (technical_type, provider, product_category) DO NOTHING;

-- Add index on product_category for faster filtering
CREATE INDEX IF NOT EXISTS idx_service_packages_product_category_active
ON service_packages(product_category, active) WHERE active = true;

-- Add comments for documentation
COMMENT ON COLUMN service_packages.product_category IS 'Product category (SkyFibre, HomeFibreConnect, BizFibreConnect, LTE, 5G) - maps to CircleTel product lines';
