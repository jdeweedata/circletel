-- Add customer_type column to service_packages table for B2B/B2C filtering
-- Phase 2: Business journey completion - B2B package filtering

-- Add customer_type column with constraint
ALTER TABLE service_packages
ADD COLUMN IF NOT EXISTS customer_type VARCHAR(20) DEFAULT 'consumer'
CHECK (customer_type IN ('consumer', 'business', 'both'));

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_service_packages_customer_type_active
ON service_packages(customer_type, active) WHERE active = true;

-- Update MTN 5G and LTE packages to be business-only (they all have Work Express and Static IP features)
UPDATE service_packages
SET customer_type = 'business'
WHERE service_type IN ('5g', 'lte')
  AND (
    features @> ARRAY['Work Express priority data']
    OR features @> ARRAY['Static IP available']
    OR features @> ARRAY['Static IP included']
  );

-- Mark BizFibreConnect packages as business-only
UPDATE service_packages
SET customer_type = 'business'
WHERE service_type = 'BizFibreConnect';

-- Mark SkyFibre and HomeFibreConnect as available for both (default consumer, but can be used by business)
UPDATE service_packages
SET customer_type = 'both'
WHERE service_type IN ('SkyFibre', 'HomeFibreConnect');

-- Add comment for documentation
COMMENT ON COLUMN service_packages.customer_type IS 'Target customer segment: consumer (B2C), business (B2B), or both';
