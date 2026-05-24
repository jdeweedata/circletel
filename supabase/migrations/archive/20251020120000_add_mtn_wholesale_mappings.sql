-- Migration: Add MTN Wholesale Product Mappings
-- Created: 2025-10-20
-- Purpose: Map MTN Wholesale API products to CircleTel product categories

-- Add MTN Consumer Coverage mappings (verify/ensure they exist)
INSERT INTO service_type_mapping (technical_type, provider, product_category, priority, active, notes)
VALUES
  ('5G', 'mtn', '5g', 1, true, 'MTN 5G Coverage from Consumer API'),
  ('LTE', 'mtn', 'lte', 2, true, 'MTN LTE Coverage from Consumer API'),
  ('FixedLTE', 'mtn', 'fixed_lte', 3, true, 'MTN Fixed LTE Coverage from Consumer API')
ON CONFLICT (technical_type, provider, product_category) DO NOTHING;

-- Add MTN Wholesale Business Product mappings
-- These map wholesale products to CircleTel categories
INSERT INTO service_type_mapping (technical_type, provider, product_category, priority, active, notes)
VALUES
  -- Fixed Wireless Broadband → Wireless (SkyFibre products)
  ('Fixed Wireless Broadband', 'mtn', 'wireless', 1, true, 'MTN Wholesale Fixed Wireless - maps to SkyFibre/uncapped wireless products'),

  -- FTTH Products → Fibre Consumer (FTTH = Fibre to the Home)
  ('Wholesale FTTH FNO', 'mtn', 'fibre', 1, true, 'MTN Wholesale FTTH FNO - Fibre to the Home for consumers'),
  ('Wholesale FTTH (MNS)', 'mtn', 'fibre', 2, true, 'MTN Wholesale FTTH MNS - Managed fibre to the home'),

  -- Connectivity Products → Connectivity category (business point-to-point)
  ('Wholesale Cloud Connect', 'mtn', 'connectivity', 1, true, 'MTN Wholesale Cloud Connect - enterprise connectivity'),
  ('Wholesale Access Connect', 'mtn', 'connectivity', 2, true, 'MTN Wholesale Access Connect - last-mile connectivity'),
  ('Wholesale Ethernet Wave Leased Line', 'mtn', 'connectivity', 3, true, 'MTN Wholesale Ethernet Wave - leased lines'),
  ('Wholesale Cloud Connect Lite', 'mtn', 'connectivity', 4, true, 'MTN Wholesale Cloud Connect Lite - light connectivity')
ON CONFLICT (technical_type, provider, product_category) DO NOTHING;

-- Add comment explaining the mapping strategy
COMMENT ON TABLE service_type_mapping IS
  'Maps technical service types from provider APIs to CircleTel product categories.
   MTN Consumer API returns: 5G, LTE, FixedLTE
   MTN Wholesale API returns: Fixed Wireless Broadband, Wholesale FTTH FNO, Wholesale FTTH (MNS), Wholesale Cloud Connect, Wholesale Access Connect, Wholesale Ethernet Wave Leased Line, Wholesale Cloud Connect Lite';
