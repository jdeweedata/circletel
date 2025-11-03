-- Migration: Enhance service_packages table to be the single source of truth (V2 - Fixed)
-- This adds missing fields from products table to service_packages
-- Created: 2025-10-30 (Fixed duplicate slug issue)

-- =====================================================
-- PHASE 1: Add Missing Columns
-- =====================================================

-- Add pricing JSONB object for detailed pricing (setup fees, speeds, etc.)
ALTER TABLE service_packages
  ADD COLUMN IF NOT EXISTS pricing JSONB;

-- Add slug for SEO-friendly URLs (temporarily nullable)
ALTER TABLE service_packages
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Add SKU for inventory tracking
ALTER TABLE service_packages
  ADD COLUMN IF NOT EXISTS sku TEXT;

-- Add metadata JSONB for flexible extensibility
ALTER TABLE service_packages
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add featured/popular flags for homepage display
ALTER TABLE service_packages
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

ALTER TABLE service_packages
  ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;

-- Add status field (replaces 'active' boolean eventually)
-- Values: active, inactive, archived, draft
ALTER TABLE service_packages
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add bundle_components for product bundles
ALTER TABLE service_packages
  ADD COLUMN IF NOT EXISTS bundle_components JSONB DEFAULT '[]'::jsonb;

-- Add cost tracking fields
ALTER TABLE service_packages
  ADD COLUMN IF NOT EXISTS base_price_zar NUMERIC(10,2);

ALTER TABLE service_packages
  ADD COLUMN IF NOT EXISTS cost_price_zar NUMERIC(10,2);

COMMENT ON COLUMN service_packages.pricing IS 'JSONB object: {monthly, setup, download_speed, upload_speed}';
COMMENT ON COLUMN service_packages.metadata IS 'JSONB object for flexible data: {contract_months, installation_days, etc}';
COMMENT ON COLUMN service_packages.bundle_components IS 'Array of product IDs included in bundle';
COMMENT ON COLUMN service_packages.base_price_zar IS 'Monthly recurring fee (synced with pricing.monthly)';
COMMENT ON COLUMN service_packages.cost_price_zar IS 'One-time setup/installation fee (synced with pricing.setup)';

-- =====================================================
-- PHASE 2: Migrate Existing Data with Unique Slugs
-- =====================================================

-- Generate unique slugs by appending row number when duplicates exist
WITH numbered_packages AS (
  SELECT
    id,
    name,
    LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      )
    ) as base_slug,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(
        REGEXP_REPLACE(
          REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'),
          '\s+', '-', 'g'
        )
      )
      ORDER BY created_at, id
    ) as slug_counter
  FROM service_packages
  WHERE slug IS NULL
)
UPDATE service_packages sp
SET slug = CASE
  WHEN np.slug_counter = 1 THEN np.base_slug
  ELSE np.base_slug || '-' || np.slug_counter
END
FROM numbered_packages np
WHERE sp.id = np.id;

-- Build pricing JSONB object from existing price and speed fields
UPDATE service_packages
SET pricing = jsonb_build_object(
  'monthly', COALESCE(price, 0),
  'setup', 0, -- Default setup fee to 0 for existing records
  'download_speed', COALESCE(speed_down, 0),
  'upload_speed', COALESCE(speed_up, 0)
)
WHERE pricing IS NULL;

-- Sync base_price_zar from price field
UPDATE service_packages
SET base_price_zar = price
WHERE base_price_zar IS NULL AND price IS NOT NULL;

-- Set cost_price_zar to 0 for existing records (can be updated manually)
UPDATE service_packages
SET cost_price_zar = 0
WHERE cost_price_zar IS NULL;

-- Sync status from active boolean
UPDATE service_packages
SET status = CASE
  WHEN active = true THEN 'active'
  WHEN active = false THEN 'inactive'
  ELSE 'active'
END
WHERE status = 'active'; -- Only update if still at default

-- =====================================================
-- PHASE 3: Add Constraints and Indexes
-- =====================================================

-- Now add unique constraint on slug (after ensuring uniqueness)
ALTER TABLE service_packages
  DROP CONSTRAINT IF EXISTS service_packages_slug_unique;

ALTER TABLE service_packages
  ADD CONSTRAINT service_packages_slug_unique UNIQUE (slug);

-- Status check constraint
ALTER TABLE service_packages
  DROP CONSTRAINT IF EXISTS service_packages_status_check;

ALTER TABLE service_packages
  ADD CONSTRAINT service_packages_status_check
  CHECK (status IN ('active', 'inactive', 'archived', 'draft'));

-- Pricing validation: ensure pricing object has required fields
ALTER TABLE service_packages
  DROP CONSTRAINT IF EXISTS service_packages_pricing_structure_check;

ALTER TABLE service_packages
  ADD CONSTRAINT service_packages_pricing_structure_check
  CHECK (
    pricing IS NULL OR
    (pricing ? 'monthly' AND pricing ? 'setup')
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_service_packages_slug
  ON service_packages(slug);

CREATE INDEX IF NOT EXISTS idx_service_packages_status
  ON service_packages(status);

CREATE INDEX IF NOT EXISTS idx_service_packages_is_featured
  ON service_packages(is_featured)
  WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_service_packages_is_popular
  ON service_packages(is_popular)
  WHERE is_popular = true;

CREATE INDEX IF NOT EXISTS idx_service_packages_pricing
  ON service_packages USING GIN(pricing);

CREATE INDEX IF NOT EXISTS idx_service_packages_metadata
  ON service_packages USING GIN(metadata);

-- =====================================================
-- PHASE 4: Create Trigger for Auto-Sync
-- =====================================================

-- Function to sync pricing fields when updated
CREATE OR REPLACE FUNCTION sync_service_package_pricing()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  slug_counter INTEGER;
BEGIN
  -- If pricing object is updated, sync to root-level fields
  IF NEW.pricing IS NOT NULL THEN
    NEW.base_price_zar := (NEW.pricing->>'monthly')::numeric;
    NEW.cost_price_zar := COALESCE((NEW.pricing->>'setup')::numeric, 0);
    NEW.price := (NEW.pricing->>'monthly')::numeric; -- Keep legacy price field in sync
    NEW.speed_down := COALESCE((NEW.pricing->>'download_speed')::integer, 0);
    NEW.speed_up := COALESCE((NEW.pricing->>'upload_speed')::integer, 0);
  END IF;

  -- If root-level fields are updated, sync to pricing object
  IF NEW.base_price_zar IS NOT NULL OR NEW.cost_price_zar IS NOT NULL THEN
    NEW.pricing := jsonb_build_object(
      'monthly', COALESCE(NEW.base_price_zar, NEW.price, 0),
      'setup', COALESCE(NEW.cost_price_zar, 0),
      'download_speed', COALESCE(NEW.speed_down, 0),
      'upload_speed', COALESCE(NEW.speed_up, 0)
    );
  END IF;

  -- Auto-generate unique slug if not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      )
    );

    -- Check if slug exists and append counter if needed
    SELECT COUNT(*) + 1 INTO slug_counter
    FROM service_packages
    WHERE slug LIKE base_slug || '%'
      AND (TG_OP = 'INSERT' OR id != NEW.id);

    IF slug_counter > 1 THEN
      NEW.slug := base_slug || '-' || slug_counter;
    ELSE
      NEW.slug := base_slug;
    END IF;
  END IF;

  -- Sync status to active boolean (for backward compatibility)
  NEW.active := (NEW.status = 'active');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS sync_service_package_pricing_trigger ON service_packages;
CREATE TRIGGER sync_service_package_pricing_trigger
  BEFORE INSERT OR UPDATE ON service_packages
  FOR EACH ROW
  EXECUTE FUNCTION sync_service_package_pricing();

-- =====================================================
-- PHASE 5: Add Audit Trail
-- =====================================================

-- Create audit log table for service_packages
CREATE TABLE IF NOT EXISTS service_packages_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'activated', 'deactivated'
  changed_by_email TEXT,
  changed_by_name TEXT,
  change_reason TEXT,
  old_values JSONB,
  new_values JSONB,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_service_packages_audit_logs_package_id
  ON service_packages_audit_logs(package_id);

CREATE INDEX IF NOT EXISTS idx_service_packages_audit_logs_changed_at
  ON service_packages_audit_logs(changed_at DESC);

-- Audit trigger function
CREATE OR REPLACE FUNCTION log_service_package_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO service_packages_audit_logs (package_id, action, new_values)
    VALUES (NEW.id, 'created', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO service_packages_audit_logs (package_id, action, old_values, new_values)
    VALUES (NEW.id, 'updated', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO service_packages_audit_logs (package_id, action, old_values)
    VALUES (OLD.id, 'deleted', to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create audit trigger
DROP TRIGGER IF EXISTS service_packages_audit_trigger ON service_packages;
CREATE TRIGGER service_packages_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON service_packages
  FOR EACH ROW
  EXECUTE FUNCTION log_service_package_changes();

-- =====================================================
-- PHASE 6: Add Helper Views
-- =====================================================

-- View for active packages with all relevant fields
CREATE OR REPLACE VIEW v_active_service_packages AS
SELECT
  id,
  name,
  slug,
  sku,
  service_type,
  product_category,
  customer_type,
  description,
  features,
  pricing,
  base_price_zar,
  cost_price_zar,
  price, -- Legacy field
  speed_down,
  speed_up,
  promotion_price,
  promotion_months,
  is_featured,
  is_popular,
  compatible_providers,
  network_provider_id,
  metadata,
  created_at,
  updated_at
FROM service_packages
WHERE status = 'active' AND active = true;

COMMENT ON VIEW v_active_service_packages IS 'Active service packages with all fields for frontend display';

-- =====================================================
-- COMPLETE
-- =====================================================

-- Summary comment
COMMENT ON TABLE service_packages IS
  'Enhanced service packages table - single source of truth for all products.
   Includes pricing JSONB, SEO slugs, metadata, audit trail, and auto-sync triggers.
   Migration date: 2025-10-30 (V2 - Fixed duplicate slugs)';
