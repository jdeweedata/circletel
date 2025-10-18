-- Fix product category mapping inconsistency
-- Issue: service_type_mapping uses uppercase (SkyFibre, LTE, 5G) but service_packages uses lowercase (wireless, lte, 5g)

-- Drop old constraint
ALTER TABLE service_type_mapping DROP CONSTRAINT IF EXISTS service_type_mapping_product_category_check;

-- Add new constraint with both uppercase and lowercase categories
ALTER TABLE service_type_mapping ADD CONSTRAINT service_type_mapping_product_category_check
CHECK (product_category IN (
  -- Uppercase (legacy)
  'SkyFibre', 'HomeFibreConnect', 'BizFibreConnect', 'LTE', '5G',
  -- Lowercase (new system)
  'wireless', 'fibre_consumer', 'fibre_business', 'lte', '5g'
));

-- Update existing mappings to use lowercase categories to match service_packages
UPDATE service_type_mapping SET product_category = 'wireless' WHERE product_category = 'SkyFibre';
UPDATE service_type_mapping SET product_category = 'fibre_consumer' WHERE product_category = 'HomeFibreConnect';
UPDATE service_type_mapping SET product_category = 'fibre_business' WHERE product_category = 'BizFibreConnect';
UPDATE service_type_mapping SET product_category = 'lte' WHERE product_category = 'LTE';
UPDATE service_type_mapping SET product_category = '5g' WHERE product_category = '5G';

-- Verify mappings
COMMENT ON TABLE service_type_mapping IS 'Maps technical service types from providers to CircleTel product categories (lowercase: wireless, fibre_consumer, fibre_business, lte, 5g)';
