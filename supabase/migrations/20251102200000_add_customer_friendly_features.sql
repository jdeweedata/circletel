-- Add customer_friendly_features column to service_packages
-- This stores marketing-friendly versions of technical features

ALTER TABLE service_packages
  ADD COLUMN IF NOT EXISTS customer_friendly_features JSONB;

COMMENT ON COLUMN service_packages.customer_friendly_features IS 'Customer-friendly formatted features with emojis and marketing copy';

-- Add marketing_copy column for product descriptions
ALTER TABLE service_packages
  ADD COLUMN IF NOT EXISTS marketing_copy TEXT;

COMMENT ON COLUMN service_packages.marketing_copy IS 'Enhanced marketing description for customer-facing pages';

-- Create index for searching customer-friendly features
CREATE INDEX IF NOT EXISTS idx_service_packages_customer_features
  ON service_packages USING gin(customer_friendly_features);

-- Update trigger to sync customer_friendly_features when features change
CREATE OR REPLACE FUNCTION sync_customer_friendly_features()
RETURNS TRIGGER AS $$
BEGIN
  -- If features array exists, create customer_friendly version
  IF NEW.features IS NOT NULL AND array_length(NEW.features, 1) > 0 THEN
    -- Store features with emoji markers for frontend formatting
    NEW.customer_friendly_features := jsonb_build_object(
      'benefits', (
        SELECT jsonb_agg(feature)
        FROM unnest(NEW.features) AS feature
        WHERE lower(feature) LIKE '%free%'
           OR lower(feature) LIKE '%included%'
           OR lower(feature) LIKE '%router%'
           OR lower(feature) LIKE '%installation%'
           OR lower(feature) LIKE '%insured%'
        LIMIT 4
      ),
      'additional_info', (
        SELECT jsonb_agg(feature)
        FROM unnest(NEW.features) AS feature
        WHERE lower(feature) NOT LIKE '%free%'
          AND lower(feature) NOT LIKE '%included%'
          AND lower(feature) NOT LIKE '%router%'
          AND lower(feature) NOT LIKE '%insured%'
        LIMIT 6
      ),
      'all_features', to_jsonb(NEW.features)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS sync_customer_features_trigger ON service_packages;
CREATE TRIGGER sync_customer_features_trigger
  BEFORE INSERT OR UPDATE ON service_packages
  FOR EACH ROW
  EXECUTE FUNCTION sync_customer_friendly_features();

-- Populate customer_friendly_features for existing rows
UPDATE service_packages
SET customer_friendly_features = jsonb_build_object(
  'benefits', (
    SELECT jsonb_agg(feature)
    FROM unnest(features) AS feature
    WHERE lower(feature) LIKE '%free%'
       OR lower(feature) LIKE '%included%'
       OR lower(feature) LIKE '%router%'
       OR lower(feature) LIKE '%installation%'
       OR lower(feature) LIKE '%insured%'
    LIMIT 4
  ),
  'additional_info', (
    SELECT jsonb_agg(feature)
    FROM unnest(features) AS feature
    WHERE lower(feature) NOT LIKE '%free%'
      AND lower(feature) NOT LIKE '%included%'
      AND lower(feature) NOT LIKE '%router%'
      AND lower(feature) NOT LIKE '%insured%'
    LIMIT 6
  ),
  'all_features', to_jsonb(features)
)
WHERE features IS NOT NULL 
  AND array_length(features, 1) > 0
  AND customer_friendly_features IS NULL;
