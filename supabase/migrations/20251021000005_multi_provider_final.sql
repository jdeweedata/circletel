-- =====================================================
-- Multi-Provider Architecture Migration (Final Version)
-- Created: 2025-10-21
-- Purpose: Add multi-provider support with proper column creation order
-- =====================================================

-- STEP 1: Add all missing columns first
DO $$
BEGIN
    -- Add provider_code column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fttb_network_providers' AND column_name = 'provider_code'
    ) THEN
        ALTER TABLE fttb_network_providers ADD COLUMN provider_code TEXT;
        RAISE NOTICE '✓ Added provider_code column';
    ELSE
        RAISE NOTICE '⊙ provider_code column already exists';
    END IF;

    -- Add service_offerings column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fttb_network_providers' AND column_name = 'service_offerings'
    ) THEN
        ALTER TABLE fttb_network_providers ADD COLUMN service_offerings JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE '✓ Added service_offerings column';
    ELSE
        RAISE NOTICE '⊙ service_offerings column already exists';
    END IF;

    -- Add api_version column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fttb_network_providers' AND column_name = 'api_version'
    ) THEN
        ALTER TABLE fttb_network_providers ADD COLUMN api_version TEXT;
        RAISE NOTICE '✓ Added api_version column';
    ELSE
        RAISE NOTICE '⊙ api_version column already exists';
    END IF;

    -- Add api_documentation_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fttb_network_providers' AND column_name = 'api_documentation_url'
    ) THEN
        ALTER TABLE fttb_network_providers ADD COLUMN api_documentation_url TEXT;
        RAISE NOTICE '✓ Added api_documentation_url column';
    ELSE
        RAISE NOTICE '⊙ api_documentation_url column already exists';
    END IF;

    -- Add coverage_source column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fttb_network_providers' AND column_name = 'coverage_source'
    ) THEN
        ALTER TABLE fttb_network_providers ADD COLUMN coverage_source TEXT;
        RAISE NOTICE '✓ Added coverage_source column';
    ELSE
        RAISE NOTICE '⊙ coverage_source column already exists';
    END IF;
END $$;

-- STEP 2: Check for and clean up any duplicate provider_code values
DO $$
DECLARE
  duplicate_count INTEGER;
  mtn_providers_count INTEGER;
BEGIN
  -- Count MTN providers
  SELECT COUNT(*) INTO mtn_providers_count
  FROM fttb_network_providers
  WHERE name ILIKE '%mtn%';

  RAISE NOTICE '⊙ Found % MTN provider(s)', mtn_providers_count;

  -- Check for duplicates if provider_code has been set
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT provider_code, COUNT(*) as cnt
    FROM fttb_network_providers
    WHERE provider_code IS NOT NULL AND provider_code != ''
    GROUP BY provider_code
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE NOTICE '⚠ Found % duplicate provider code(s), cleaning up...', duplicate_count;

    -- For each duplicate provider_code, keep only the first one (by id)
    UPDATE fttb_network_providers
    SET provider_code = NULL
    WHERE id NOT IN (
      SELECT MIN(id)
      FROM fttb_network_providers
      WHERE provider_code IS NOT NULL AND provider_code != ''
      GROUP BY provider_code
    )
    AND provider_code IS NOT NULL AND provider_code != '';

    RAISE NOTICE '✓ Cleaned up duplicate provider codes';
  ELSE
    RAISE NOTICE '✓ No duplicate provider codes found';
  END IF;
END $$;

-- STEP 3: Update MTN providers with provider_code='mtn'
-- Only update providers that don't already have provider_code set
UPDATE fttb_network_providers
SET
  provider_code = 'mtn',
  service_offerings = COALESCE(service_offerings, '["fibre", "wireless", "5g", "lte"]'::jsonb),
  coverage_source = COALESCE(coverage_source, 'api'),
  api_version = COALESCE(api_version, 'v1'),
  api_documentation_url = COALESCE(api_documentation_url, 'https://mtnbusiness.co.za/api-docs')
WHERE name ILIKE '%mtn%'
  AND (provider_code IS NULL OR provider_code = '');

-- STEP 4: Add unique constraint on provider_code
ALTER TABLE fttb_network_providers DROP CONSTRAINT IF EXISTS fttb_network_providers_provider_code_key;
ALTER TABLE fttb_network_providers
ADD CONSTRAINT fttb_network_providers_provider_code_key UNIQUE (provider_code);

-- STEP 5: Add check constraint for coverage_source
ALTER TABLE fttb_network_providers DROP CONSTRAINT IF EXISTS fttb_network_providers_coverage_source_check;
ALTER TABLE fttb_network_providers
ADD CONSTRAINT fttb_network_providers_coverage_source_check
CHECK (coverage_source IN ('api', 'static_file', 'postgis', 'hybrid'));

-- STEP 6: Enhance service_packages table
ALTER TABLE service_packages
ADD COLUMN IF NOT EXISTS compatible_providers TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS provider_specific_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS provider_priority INTEGER DEFAULT 1;

-- STEP 7: Create provider_product_mappings table
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

-- STEP 8: Insert placeholder providers (MetroFibre, Openserve, DFA, Vumatel)
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

-- STEP 9: Create indexes for performance
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

-- STEP 10: Create updated_at trigger function for provider_product_mappings
CREATE OR REPLACE FUNCTION update_provider_product_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_provider_product_mappings_timestamp ON provider_product_mappings;

CREATE TRIGGER trigger_update_provider_product_mappings_timestamp
BEFORE UPDATE ON provider_product_mappings
FOR EACH ROW
EXECUTE FUNCTION update_provider_product_mappings_updated_at();

-- STEP 11: Create helpful views
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

-- STEP 12: Final verification and summary
DO $$
DECLARE
  mtn_count INTEGER;
  total_providers INTEGER;
  placeholder_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mtn_count
  FROM fttb_network_providers
  WHERE provider_code = 'mtn';

  SELECT COUNT(*) INTO total_providers
  FROM fttb_network_providers
  WHERE provider_code IS NOT NULL;

  SELECT COUNT(*) INTO placeholder_count
  FROM fttb_network_providers
  WHERE provider_code IN ('metrofibre', 'openserve', 'dfa', 'vumatel');

  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Multi-Provider Architecture Migration Complete';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Results:';
  RAISE NOTICE '  ✓ MTN providers: %', mtn_count;
  RAISE NOTICE '  ✓ Placeholder providers: %', placeholder_count;
  RAISE NOTICE '  ✓ Total providers with codes: %', total_providers;
  RAISE NOTICE '';
  RAISE NOTICE 'Tables Created/Enhanced:';
  RAISE NOTICE '  ✓ fttb_network_providers (enhanced)';
  RAISE NOTICE '  ✓ service_packages (enhanced)';
  RAISE NOTICE '  ✓ provider_product_mappings (new)';
  RAISE NOTICE '';
  RAISE NOTICE 'Views Created:';
  RAISE NOTICE '  ✓ v_active_providers';
  RAISE NOTICE '  ✓ v_products_with_providers';
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
END $$;

-- =====================================================
-- Migration Complete
-- =====================================================
