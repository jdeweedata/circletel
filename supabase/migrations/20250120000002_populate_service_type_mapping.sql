-- Populate service_type_mapping table with MTN service mappings
-- This maps technical service types from MTN API to product categories in service_packages

INSERT INTO service_type_mapping (technical_type, provider, product_category, priority, active, notes)
VALUES
  -- SkyFibre maps to wireless, 5G, and LTE packages
  ('SkyFibre', 'mtn', 'wireless', 1, true, 'SkyFibre Fixed Wireless Access packages'),
  ('SkyFibre', 'mtn', '5g', 2, true, 'SkyFibre 5G packages'),
  ('SkyFibre', 'mtn', 'lte', 3, true, 'SkyFibre LTE packages'),

  -- HomeFibreConnect maps to consumer fibre packages
  ('HomeFibreConnect', 'mtn', 'fibre_consumer', 1, true, 'Home Fibre consumer packages'),

  -- BizFibreConnect maps to business fibre and connectivity packages
  ('BizFibreConnect', 'mtn', 'fibre_business', 1, true, 'Business Fibre packages'),
  ('BizFibreConnect', 'mtn', 'connectivity', 2, true, 'Business connectivity packages')
ON CONFLICT (technical_type, provider, product_category) DO NOTHING;

-- Verify mappings were created
SELECT technical_type, product_category, priority, active
FROM service_type_mapping
ORDER BY technical_type, priority;
