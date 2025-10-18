-- Fix consumer package visibility for business customers
-- Issue: Consumer SkyFibre and HomeFibre packages were showing for business customers

-- Update consumer SkyFibre packages to be consumer-only (not 'both')
UPDATE service_packages
SET customer_type = 'consumer'
WHERE service_type = 'SkyFibre'
  AND customer_type = 'both'
  AND product_category = 'wireless'
  AND name NOT LIKE '%SME%';

-- Update HomeFibre packages to be consumer-only (not 'both')
UPDATE service_packages
SET customer_type = 'consumer'
WHERE service_type = 'HomeFibreConnect'
  AND customer_type = 'both'
  AND product_category = 'fibre_consumer';

-- Verify final state
COMMENT ON COLUMN service_packages.customer_type IS 'Target customer segment: consumer (residential), business (SME/Enterprise), or both (flexible packages)';

-- Business customers now see:
-- - BizFibreConnect (when FTTB coverage available)
-- - SkyFibre SME (wireless fallback)
-- - MTN 5G/LTE (mobile data)

-- Consumer customers now see:
-- - HomeFibreConnect (residential fibre)
-- - SkyFibre consumer (wireless)
-- - MTN 5G/LTE (mobile data)
