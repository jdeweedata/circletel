-- =====================================================
-- Cleanup Duplicates and Complete Multi-Provider Migration (FIXED)
-- Created: 2025-10-21
-- Purpose: Aggressively clean duplicates then complete migration
-- Fixed: Removed ON CONFLICT clause (no unique constraint on name)
-- =====================================================

-- STEP 1: Add columns if they don't exist
ALTER TABLE fttb_network_providers ADD COLUMN IF NOT EXISTS provider_code TEXT;
ALTER TABLE fttb_network_providers ADD COLUMN IF NOT EXISTS service_offerings JSONB DEFAULT '[]'::jsonb;
ALTER TABLE fttb_network_providers ADD COLUMN IF NOT EXISTS api_version TEXT;
ALTER TABLE fttb_network_providers ADD COLUMN IF NOT EXISTS api_documentation_url TEXT;
ALTER TABLE fttb_network_providers ADD COLUMN IF NOT EXISTS coverage_source TEXT;

-- STEP 2: Show current state
DO $$
DECLARE
  mtn_with_code INTEGER;
  mtn_total INTEGER;
BEGIN
  SELECT COUNT(*) INTO mtn_with_code
  FROM fttb_network_providers
  WHERE provider_code = 'mtn';

  SELECT COUNT(*) INTO mtn_total
  FROM fttb_network_providers
  WHERE name ILIKE '%mtn%';

  RAISE NOTICE 'Current state:';
  RAISE NOTICE '  MTN providers with provider_code=mtn: %', mtn_with_code;
  RAISE NOTICE '  Total MTN providers: %', mtn_total;
END $$;

-- STEP 3: Clear ALL provider_code values to start fresh
UPDATE fttb_network_providers
SET provider_code = NULL
WHERE provider_code IS NOT NULL;

-- STEP 4: Now set provider_code='mtn' for the FIRST MTN provider only
UPDATE fttb_network_providers
SET
  provider_code = 'mtn',
  service_offerings = '["fibre", "wireless", "5g", "lte"]'::jsonb,
  coverage_source = 'api',
  api_version = 'v1',
  api_documentation_url = 'https://mtnbusiness.co.za/api-docs'
WHERE id = (
  SELECT id
  FROM fttb_network_providers
  WHERE name ILIKE '%mtn%'
  ORDER BY created_at ASC, id ASC
  LIMIT 1
);

-- STEP 5: Verify only one MTN provider has the code
DO $$
DECLARE
  mtn_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mtn_count
  FROM fttb_network_providers
  WHERE provider_code = 'mtn';

  IF mtn_count = 1 THEN
    RAISE NOTICE '✓ Exactly 1 MTN provider has provider_code set';
  ELSIF mtn_count = 0 THEN
    RAISE EXCEPTION 'ERROR: No MTN providers found!';
  ELSE
    RAISE EXCEPTION 'ERROR: Still have % MTN providers with provider_code', mtn_count;
  END IF;
END $$;

-- STEP 6: Now add the unique constraint (should work now)
ALTER TABLE fttb_network_providers DROP CONSTRAINT IF EXISTS fttb_network_providers_provider_code_key;
ALTER TABLE fttb_network_providers
ADD CONSTRAINT fttb_network_providers_provider_code_key UNIQUE (provider_code);

-- STEP 7: Add check constraint for coverage_source
ALTER TABLE fttb_network_providers DROP CONSTRAINT IF EXISTS fttb_network_providers_coverage_source_check;
ALTER TABLE fttb_network_providers
ADD CONSTRAINT fttb_network_providers_coverage_source_check
CHECK (coverage_source IN ('api', 'static_file', 'postgis', 'hybrid'));

-- STEP 8: Enhance service_packages table
ALTER TABLE service_packages
ADD COLUMN IF NOT EXISTS compatible_providers TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS provider_specific_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS provider_priority INTEGER DEFAULT 1;

-- STEP 9: Create provider_product_mappings table
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

-- STEP 10: Insert placeholder providers (FIXED - no ON CONFLICT)
-- First check if they exist, then insert only if missing
DO $$
BEGIN
  -- MetroFibre
  IF NOT EXISTS (SELECT 1 FROM fttb_network_providers WHERE name = 'metrofibre') THEN
    INSERT INTO fttb_network_providers (
      name, display_name, provider_code, provider_type, technology, service_offerings,
      coverage_source, priority, active, support_contact
    ) VALUES (
      'metrofibre',
      'MetroFibre',
      'metrofibre',
      'wholesale',
      'FTTB',
      '["fibre"]'::jsonb,
      'static_file',
      10,
      false,
      'support@circletel.co.za'
    );
  ELSE
    UPDATE fttb_network_providers SET
      display_name = 'MetroFibre',
      provider_code = 'metrofibre',
      provider_type = 'wholesale',
      technology = 'FTTB',
      service_offerings = '["fibre"]'::jsonb,
      coverage_source = 'static_file',
      priority = 10,
      support_contact = 'support@circletel.co.za'
    WHERE name = 'metrofibre';
  END IF;

  -- Openserve
  IF NOT EXISTS (SELECT 1 FROM fttb_network_providers WHERE name = 'openserve') THEN
    INSERT INTO fttb_network_providers (
      name, display_name, provider_code, provider_type, technology, service_offerings,
      coverage_source, priority, active, support_contact
    ) VALUES (
      'openserve',
      'Openserve',
      'openserve',
      'wholesale',
      'FTTB',
      '["fibre"]'::jsonb,
      'static_file',
      11,
      false,
      'support@circletel.co.za'
    );
  ELSE
    UPDATE fttb_network_providers SET
      display_name = 'Openserve',
      provider_code = 'openserve',
      provider_type = 'wholesale',
      technology = 'FTTB',
      service_offerings = '["fibre"]'::jsonb,
      coverage_source = 'static_file',
      priority = 11,
      support_contact = 'support@circletel.co.za'
    WHERE name = 'openserve';
  END IF;

  -- DFA (IMPORTANT: This is ENABLED for BizFibre products)
  IF NOT EXISTS (SELECT 1 FROM fttb_network_providers WHERE name = 'dfa') THEN
    INSERT INTO fttb_network_providers (
      name, display_name, provider_code, provider_type, technology, service_offerings,
      coverage_source, priority, active, support_contact
    ) VALUES (
      'dfa',
      'Dark Fibre Africa',
      'dfa',
      'wholesale',
      'FTTB',
      '["fibre"]'::jsonb,
      'api',
      2,
      true,
      'support@circletel.co.za'
    );
  ELSE
    UPDATE fttb_network_providers SET
      display_name = 'Dark Fibre Africa',
      provider_code = 'dfa',
      provider_type = 'wholesale',
      technology = 'FTTB',
      service_offerings = '["fibre"]'::jsonb,
      coverage_source = 'api',
      priority = 2,
      active = true,
      support_contact = 'support@circletel.co.za'
    WHERE name = 'dfa';
  END IF;

  -- Vumatel
  IF NOT EXISTS (SELECT 1 FROM fttb_network_providers WHERE name = 'vumatel') THEN
    INSERT INTO fttb_network_providers (
      name, display_name, provider_code, provider_type, technology, service_offerings,
      coverage_source, priority, active, support_contact
    ) VALUES (
      'vumatel',
      'Vumatel',
      'vumatel',
      'wholesale',
      'FTTB',
      '["fibre"]'::jsonb,
      'static_file',
      13,
      false,
      'support@circletel.co.za'
    );
  ELSE
    UPDATE fttb_network_providers SET
      display_name = 'Vumatel',
      provider_code = 'vumatel',
      provider_type = 'wholesale',
      technology = 'FTTB',
      service_offerings = '["fibre"]'::jsonb,
      coverage_source = 'static_file',
      priority = 13,
      support_contact = 'support@circletel.co.za'
    WHERE name = 'vumatel';
  END IF;
END $$;

-- STEP 11: Create indexes
CREATE INDEX IF NOT EXISTS idx_fttb_network_providers_code
ON fttb_network_providers(provider_code)
WHERE provider_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fttb_network_providers_active
ON fttb_network_providers(active)
WHERE active = true;

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

-- STEP 12: Create updated_at trigger
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

-- STEP 13: Create views
CREATE OR REPLACE VIEW v_active_providers AS
SELECT
  id,
  name,
  display_name,
  provider_code,
  provider_type,
  service_offerings,
  coverage_source,
  priority,
  support_contact,
  active
FROM fttb_network_providers
WHERE active = true
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
    SELECT json_agg(provider_info ORDER BY provider_info->>'priority')
    FROM (
      SELECT json_build_object(
        'provider_code', fnp.provider_code,
        'provider_name', fnp.display_name,
        'active', fnp.active,
        'priority', fnp.priority
      ) AS provider_info
      FROM fttb_network_providers fnp
      WHERE fnp.provider_code = ANY(sp.compatible_providers)
      ORDER BY fnp.priority ASC
    ) AS ordered_providers
  ) AS provider_details
FROM service_packages sp
WHERE sp.active = true
  AND sp.compatible_providers IS NOT NULL
  AND array_length(sp.compatible_providers, 1) > 0;

-- STEP 14: Final summary
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
  RAISE NOTICE 'Multi-Provider Architecture - COMPLETE';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Provider Summary:';
  RAISE NOTICE '  ✓ MTN providers with code: %', mtn_count;
  RAISE NOTICE '  ✓ Placeholder providers: %', placeholder_count;
  RAISE NOTICE '  ✓ Total providers with codes: %', total_providers;
  RAISE NOTICE '';
  RAISE NOTICE 'Database Objects:';
  RAISE NOTICE '  ✓ fttb_network_providers (enhanced)';
  RAISE NOTICE '  ✓ service_packages (enhanced)';
  RAISE NOTICE '  ✓ provider_product_mappings (created)';
  RAISE NOTICE '  ✓ v_active_providers (view)';
  RAISE NOTICE '  ✓ v_products_with_providers (view)';
  RAISE NOTICE '';
  RAISE NOTICE 'Ready for Task 1A.2: Add MTN Products';
  RAISE NOTICE '================================================';
END $$;
