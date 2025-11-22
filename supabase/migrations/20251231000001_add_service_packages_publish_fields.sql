-- Migration: Add publish-related fields to service_packages
-- Date: 2025-12-31
-- Purpose: Support admin_products -> service_packages publish pipeline

-- Add linkage back to admin_products
ALTER TABLE service_packages
  ADD COLUMN IF NOT EXISTS source_admin_product_id UUID REFERENCES admin_products(id);

-- Add lifecycle window for offers
ALTER TABLE service_packages
  ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ;

ALTER TABLE service_packages
  ADD COLUMN IF NOT EXISTS valid_to TIMESTAMPTZ;

-- Add simple eligibility / segmentation fields
ALTER TABLE service_packages
  ADD COLUMN IF NOT EXISTS market_segment TEXT;

ALTER TABLE service_packages
  ADD COLUMN IF NOT EXISTS provider TEXT;

-- Logical key to group versions of the same offering (e.g. sku:term:segment)
ALTER TABLE service_packages
  ADD COLUMN IF NOT EXISTS logical_key TEXT;

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_service_packages_source_admin_product_id
  ON service_packages(source_admin_product_id);

CREATE INDEX IF NOT EXISTS idx_service_packages_market_segment
  ON service_packages(market_segment);

CREATE INDEX IF NOT EXISTS idx_service_packages_provider
  ON service_packages(provider);

CREATE INDEX IF NOT EXISTS idx_service_packages_logical_key
  ON service_packages(logical_key);

-- Optional: index on lifecycle window for scheduled offers
CREATE INDEX IF NOT EXISTS idx_service_packages_valid_window
  ON service_packages(valid_from, valid_to);

COMMENT ON COLUMN service_packages.source_admin_product_id IS 'Admin product (admin_products.id) that this service package was published from';
COMMENT ON COLUMN service_packages.market_segment IS 'Target market segment for this package (e.g. b2c, b2b, partner)';
COMMENT ON COLUMN service_packages.provider IS 'Underlying network/provider for this package (e.g. mtn, dfa, supersonic)';
COMMENT ON COLUMN service_packages.logical_key IS 'Stable logical key used to group versions of the same offering (e.g. sku:term:segment)';
