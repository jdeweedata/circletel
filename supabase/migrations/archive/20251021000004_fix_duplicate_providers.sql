-- =====================================================
-- Fix Duplicate Provider Codes
-- Created: 2025-10-21
-- Purpose: Clean up duplicate provider_code values before adding unique constraint
-- =====================================================

-- Step 1: Check current state and identify duplicates
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT provider_code, COUNT(*) as cnt
    FROM fttb_network_providers
    WHERE provider_code IS NOT NULL
    GROUP BY provider_code
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE NOTICE 'Found % duplicate provider codes', duplicate_count;
  ELSE
    RAISE NOTICE 'No duplicate provider codes found';
  END IF;
END $$;

-- Step 2: For MTN providers, only keep the first one and clear others
UPDATE fttb_network_providers
SET provider_code = NULL
WHERE id NOT IN (
  SELECT MIN(id)
  FROM fttb_network_providers
  WHERE provider_code = 'mtn'
  GROUP BY provider_code
)
AND provider_code = 'mtn';

-- Step 3: Now update MTN providers that don't have provider_code set
UPDATE fttb_network_providers
SET
  provider_code = 'mtn',
  service_offerings = COALESCE(service_offerings, '["fibre", "wireless", "5g", "lte"]'::jsonb),
  coverage_source = COALESCE(coverage_source, 'api'),
  api_version = COALESCE(api_version, 'v1'),
  api_documentation_url = COALESCE(api_documentation_url, 'https://mtnbusiness.co.za/api-docs')
WHERE name ILIKE '%mtn%'
  AND provider_code IS NULL;

-- Step 4: Add other missing columns if they don't exist
DO $$
BEGIN
    -- Add service_offerings column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fttb_network_providers' AND column_name = 'service_offerings'
    ) THEN
        ALTER TABLE fttb_network_providers ADD COLUMN service_offerings JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Add api_version column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fttb_network_providers' AND column_name = 'api_version'
    ) THEN
        ALTER TABLE fttb_network_providers ADD COLUMN api_version TEXT;
    END IF;

    -- Add api_documentation_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fttb_network_providers' AND column_name = 'api_documentation_url'
    ) THEN
        ALTER TABLE fttb_network_providers ADD COLUMN api_documentation_url TEXT;
    END IF;

    -- Add coverage_source column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fttb_network_providers' AND column_name = 'coverage_source'
    ) THEN
        ALTER TABLE fttb_network_providers ADD COLUMN coverage_source TEXT;
    END IF;
END $$;

-- Step 5: Drop existing unique constraint if it exists
ALTER TABLE fttb_network_providers DROP CONSTRAINT IF EXISTS fttb_network_providers_provider_code_key;

-- Step 6: Now add the unique constraint (will only succeed if no duplicates)
ALTER TABLE fttb_network_providers
ADD CONSTRAINT fttb_network_providers_provider_code_key UNIQUE (provider_code);

-- Step 7: Add check constraint for coverage_source
ALTER TABLE fttb_network_providers DROP CONSTRAINT IF EXISTS fttb_network_providers_coverage_source_check;
ALTER TABLE fttb_network_providers
ADD CONSTRAINT fttb_network_providers_coverage_source_check
CHECK (coverage_source IN ('api', 'static_file', 'postgis', 'hybrid'));

-- Step 8: Enhance service_packages table
ALTER TABLE service_packages
ADD COLUMN IF NOT EXISTS compatible_providers TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS provider_specific_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS provider_priority INTEGER DEFAULT 1;

-- Step 9: Create provider_product_mappings table
CREATE TABLE IF NOT EXISTS provider_product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_code TEXT NOT NULL,
  provider_service_type TEXT NOT NULL,
  circletel_product_id UUID,
  mapping_config JSONB DEFAULT '{}'::jsonb,
  priority INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_code, provider_service_type, circletel_product_id)
);

-- Step 10: Insert or update placeholder providers
INSERT INTO fttb_network_providers (
  name, display_name, provider_code, type, service_offerings,
  coverage_source, priority, enabled, website, support_contact, description
) VALUES
  (
    'metrofibre',
    'MetroFibre',
    'metrofibre',
    'static',
    '["fibre"]'::jsonb,
    'static_file',
    10,
    false,
    'https://metrofibre.co.za',
    'support@circletel.co.za',
    'MetroFibre FTTH provider - Johannesburg and Cape Town metro areas'
  ),
  (
    'openserve',
    'Openserve',
    'openserve',
    'static',
    '["fibre"]'::jsonb,
    'static_file',
    11,
    false,
    'https://openserve.co.za',
    'support@circletel.co.za',
    'Telkom Openserve FTTH network - Nationwide coverage'
  ),
  (
    'dfa',
    'Dark Fibre Africa',
    'dfa',
    'api',
    '["fibre"]'::jsonb,
    'api',
    12,
    false,
    'https://dfafrica.co.za',
    'support@circletel.co.za',
    'DFA enterprise fibre provider - Business-focused solutions'
  ),
  (
    'vumatel',
    'Vumatel',
    'vumatel',
    'static',
    '["fibre"]'::jsonb,
    'static_file',
    13,
    false,
    'https://vumatel.co.za',
    'support@circletel.co.za',
    'Vumatel FTTH network - Excellent Johannesburg and Cape Town coverage'
  )
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  provider_code = EXCLUDED.provider_code,
  type = EXCLUDED.type,
  service_offerings = EXCLUDED.service_offerings,
  coverage_source = EXCLUDED.coverage_source,
  priority = EXCLUDED.priority,
  website = EXCLUDED.website,
  support_contact = EXCLUDED.support_contact,
  description = EXCLUDED.description;

-- Step 11: Create indexes
CREATE INDEX IF NOT EXISTS idx_fttb_network_providers_code
ON fttb_network_providers(provider_code)
WHERE provider_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fttb_network_providers_enabled
ON fttb_network_providers(enabled)
WHERE enabled = true;

CREATE INDEX IF NOT EXISTS idx_service_packages_providers
ON service_packages USING GIN(compatible_providers)
WHERE compatible_providers IS NOT NULL AND array_length(compatible_providers, 1) > 0;

CREATE INDEX IF NOT EXISTS idx_provider_product_mappings_provider
ON provider_product_mappings(provider_code)
WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_provider_product_mappings_product
ON provider_product_mappings(circletel_product_id)
WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_provider_product_mappings_lookup
ON provider_product_mappings(provider_code, provider_service_type)
WHERE active = true;

-- Step 12: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_provider_product_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_update_provider_product_mappings_timestamp ON provider_product_mappings;

CREATE TRIGGER trigger_update_provider_product_mappings_timestamp
BEFORE UPDATE ON provider_product_mappings
FOR EACH ROW
EXECUTE FUNCTION update_provider_product_mappings_updated_at();

-- Step 13: Create views
CREATE OR REPLACE VIEW v_active_providers AS
SELECT
  id,
  name,
  display_name,
  provider_code,
  type,
  service_offerings,
  coverage_source,
  priority,
  website,
  support_contact,
  enabled
FROM fttb_network_providers
WHERE enabled = true
ORDER BY priority ASC;

CREATE OR REPLACE VIEW v_products_with_providers AS
SELECT
  sp.id,
  sp.name,
  sp.service_type,
  sp.product_category,
  sp.customer_type,
  sp.speed_down,
  sp.speed_up,
  sp.price,
  sp.compatible_providers,
  sp.active,
  (
    SELECT json_agg(
      json_build_object(
        'provider_code', fnp.provider_code,
        'provider_name', fnp.display_name,
        'enabled', fnp.enabled,
        'priority', fnp.priority
      )
    )
    FROM fttb_network_providers fnp
    WHERE fnp.provider_code = ANY(sp.compatible_providers)
    ORDER BY fnp.priority ASC
  ) AS provider_details
FROM service_packages sp
WHERE sp.active = true
  AND sp.compatible_providers IS NOT NULL
  AND array_length(sp.compatible_providers, 1) > 0;

-- Step 14: Verify results
DO $$
DECLARE
  mtn_count INTEGER;
  total_providers INTEGER;
BEGIN
  SELECT COUNT(*) INTO mtn_count
  FROM fttb_network_providers
  WHERE provider_code = 'mtn';

  SELECT COUNT(*) INTO total_providers
  FROM fttb_network_providers
  WHERE provider_code IS NOT NULL;

  RAISE NOTICE '✓ Migration completed';
  RAISE NOTICE '  MTN providers with provider_code: %', mtn_count;
  RAISE NOTICE '  Total providers with provider_code: %', total_providers;
END $$;

-- =====================================================
-- Migration Complete
-- =====================================================
