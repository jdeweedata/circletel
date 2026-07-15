-- WorkConnect (customer_type='soho', product_category='soho') rides MTN Fixed
-- Wireless Broadband. Map FWB technical types to the 'soho' product category so
-- /api/coverage/packages includes WorkConnect wherever FWB coverage exists.
-- Live code filters by customer_type, so these rows only surface packages for
-- the new 'wfh' segment.

-- 1) The product_category CHECK constraint predates SOHO products; widen it.
ALTER TABLE service_type_mapping
  DROP CONSTRAINT IF EXISTS service_type_mapping_product_category_check;
ALTER TABLE service_type_mapping
  ADD CONSTRAINT service_type_mapping_product_category_check
  CHECK ((product_category)::text = ANY (ARRAY[
    'SkyFibre', 'HomeFibreConnect', 'BizFibreConnect', 'LTE', '5G', 'wireless',
    'fibre_consumer', 'fibre_business', 'lte', '5g', 'fibre', 'connectivity',
    'soho'
  ]::text[]));

-- 2) Map MTN FWB technical types to the soho product category (idempotent).
INSERT INTO service_type_mapping (technical_type, provider, product_category, priority, active, notes)
SELECT v.technical_type, v.provider, v.product_category, v.priority, v.active, v.notes
FROM (VALUES
  ('Fixed Wireless Broadband', 'mtn', 'soho', 6, true, 'WorkConnect SOHO packages over MTN FWB'),
  ('uncapped_wireless', 'mtn', 'soho', 6, true, 'WorkConnect SOHO packages over MTN FWB')
) AS v(technical_type, provider, product_category, priority, active, notes)
WHERE NOT EXISTS (
  SELECT 1 FROM service_type_mapping m
  WHERE m.technical_type = v.technical_type
    AND m.product_category = v.product_category
);
