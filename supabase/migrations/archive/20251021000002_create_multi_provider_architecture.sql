-- =====================================================
-- Migration: Create Multi-Provider Architecture
-- Created: 2025-10-21
-- Purpose: Enable multiple coverage providers (MTN, MetroFibre, Openserve, DFA, Vumatel)
-- =====================================================

-- 1. Enhance fttb_network_providers table
-- Add provider_code for unique identification
-- Add service_offerings to track what services each provider offers
-- Add coverage_source to indicate how coverage data is obtained
ALTER TABLE fttb_network_providers
ADD COLUMN IF NOT EXISTS provider_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS service_offerings JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS api_version TEXT,
ADD COLUMN IF NOT EXISTS api_documentation_url TEXT,
ADD COLUMN IF NOT EXISTS coverage_source TEXT CHECK (coverage_source IN ('api', 'static_file', 'postgis', 'hybrid'));

-- Add comment to explain the table structure
COMMENT ON COLUMN fttb_network_providers.provider_code IS 'Unique code for provider (e.g., mtn, metrofibre, openserve, dfa, vumatel)';
COMMENT ON COLUMN fttb_network_providers.service_offerings IS 'Array of service types offered: ["fibre", "wireless", "5g", "lte"]';
COMMENT ON COLUMN fttb_network_providers.coverage_source IS 'How coverage data is obtained: api, static_file, postgis, or hybrid';

-- 2. Enhance service_packages table
-- Add compatible_providers to support multi-provider products
-- Add provider_specific_config for provider-specific settings
ALTER TABLE service_packages
ADD COLUMN IF NOT EXISTS compatible_providers TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS provider_specific_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS provider_priority INTEGER DEFAULT 1;

-- Add comments
COMMENT ON COLUMN service_packages.compatible_providers IS 'Array of provider codes that can deliver this product';
COMMENT ON COLUMN service_packages.provider_specific_config IS 'Provider-specific configuration (JSONB)';
COMMENT ON COLUMN service_packages.provider_priority IS 'Default provider priority for this product';

-- 3. Create provider_product_mappings table
-- Maps provider service types to CircleTel products
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

-- Add foreign key constraint
ALTER TABLE provider_product_mappings
ADD CONSTRAINT fk_provider_code
FOREIGN KEY (provider_code) REFERENCES fttb_network_providers(provider_code)
ON DELETE CASCADE;

ALTER TABLE provider_product_mappings
ADD CONSTRAINT fk_circletel_product
FOREIGN KEY (circletel_product_id) REFERENCES service_packages(id)
ON DELETE CASCADE;

-- Add comments
COMMENT ON TABLE provider_product_mappings IS 'Maps provider service types to CircleTel products with transformation rules';
COMMENT ON COLUMN provider_product_mappings.provider_service_type IS 'Provider''s API service name (e.g., "FTTH 100Mbps", "Fixed Wireless Broadband")';
COMMENT ON COLUMN provider_product_mappings.mapping_config IS 'Transformation rules and configuration (JSONB)';

-- 4. Update MTN providers with provider_code
-- Set MTN as the first fully-integrated provider
UPDATE fttb_network_providers
SET
  provider_code = 'mtn',
  service_offerings = '["fibre", "wireless", "5g", "lte"]'::jsonb,
  coverage_source = 'api',
  api_version = 'v1',
  api_documentation_url = 'https://mtnbusiness.co.za/api-docs'
WHERE name ILIKE '%mtn%' AND provider_code IS NULL;

-- 5. Add placeholder providers for future integration
-- These are disabled by default and will be enabled when implemented
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
ON CONFLICT (name) DO NOTHING;

-- 6. Create indexes for performance
-- Index on provider_code for fast lookup
CREATE INDEX IF NOT EXISTS idx_fttb_network_providers_code
ON fttb_network_providers(provider_code)
WHERE provider_code IS NOT NULL;

-- Index on enabled providers
CREATE INDEX IF NOT EXISTS idx_fttb_network_providers_enabled
ON fttb_network_providers(enabled)
WHERE enabled = true;

-- GIN index on compatible_providers for array containment queries
CREATE INDEX IF NOT EXISTS idx_service_packages_providers
ON service_packages USING GIN(compatible_providers)
WHERE compatible_providers IS NOT NULL AND array_length(compatible_providers, 1) > 0;

-- Index on provider_product_mappings for fast lookups
CREATE INDEX IF NOT EXISTS idx_provider_product_mappings_provider
ON provider_product_mappings(provider_code)
WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_provider_product_mappings_product
ON provider_product_mappings(circletel_product_id)
WHERE active = true;

-- Compound index for common query pattern
CREATE INDEX IF NOT EXISTS idx_provider_product_mappings_lookup
ON provider_product_mappings(provider_code, provider_service_type)
WHERE active = true;

-- 7. Create updated_at trigger for provider_product_mappings
CREATE OR REPLACE FUNCTION update_provider_product_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_provider_product_mappings_timestamp
BEFORE UPDATE ON provider_product_mappings
FOR EACH ROW
EXECUTE FUNCTION update_provider_product_mappings_updated_at();

-- 8. Add helpful views for querying

-- View: Active providers with their capabilities
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

COMMENT ON VIEW v_active_providers IS 'List of currently enabled providers with their capabilities';

-- View: Products with provider availability
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

COMMENT ON VIEW v_products_with_providers IS 'Products with their compatible providers and provider details';

-- 9. Validation queries (for testing)

-- Check MTN providers have provider_code
DO $$
DECLARE
  mtn_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mtn_count
  FROM fttb_network_providers
  WHERE name ILIKE '%mtn%' AND provider_code = 'mtn';

  IF mtn_count = 0 THEN
    RAISE WARNING 'No MTN providers found with provider_code = ''mtn''. Check migration.';
  ELSE
    RAISE NOTICE '✓ MTN providers updated successfully (% rows)', mtn_count;
  END IF;
END $$;

-- Check placeholder providers created
DO $$
DECLARE
  placeholder_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO placeholder_count
  FROM fttb_network_providers
  WHERE provider_code IN ('metrofibre', 'openserve', 'dfa', 'vumatel');

  IF placeholder_count < 4 THEN
    RAISE WARNING 'Not all placeholder providers created. Expected 4, found %', placeholder_count;
  ELSE
    RAISE NOTICE '✓ Placeholder providers created successfully (% providers)', placeholder_count;
  END IF;
END $$;

-- Check indexes created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_fttb_network_providers_code'
  ) THEN
    RAISE NOTICE '✓ Index idx_fttb_network_providers_code created';
  ELSE
    RAISE WARNING 'Index idx_fttb_network_providers_code NOT created';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_service_packages_providers'
  ) THEN
    RAISE NOTICE '✓ Index idx_service_packages_providers (GIN) created';
  ELSE
    RAISE WARNING 'Index idx_service_packages_providers NOT created';
  END IF;
END $$;

-- 10. Grant permissions (if using RLS)
-- Ensure authenticated users can read provider data
GRANT SELECT ON fttb_network_providers TO authenticated;
GRANT SELECT ON provider_product_mappings TO authenticated;
GRANT SELECT ON service_packages TO authenticated;
GRANT SELECT ON v_active_providers TO authenticated;
GRANT SELECT ON v_products_with_providers TO authenticated;

-- Service role needs full access
GRANT ALL ON fttb_network_providers TO service_role;
GRANT ALL ON provider_product_mappings TO service_role;
GRANT ALL ON service_packages TO service_role;

-- =====================================================
-- Migration Complete
-- =====================================================

-- Summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Multi-Provider Architecture Migration Complete';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables Enhanced:';
  RAISE NOTICE '  ✓ fttb_network_providers (added provider_code, service_offerings, coverage_source)';
  RAISE NOTICE '  ✓ service_packages (added compatible_providers, provider_specific_config)';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  ✓ provider_product_mappings';
  RAISE NOTICE '';
  RAISE NOTICE 'Providers Ready:';
  RAISE NOTICE '  ✓ MTN (enabled, provider_code = ''mtn'')';
  RAISE NOTICE '  ✓ MetroFibre (disabled, placeholder)';
  RAISE NOTICE '  ✓ Openserve (disabled, placeholder)';
  RAISE NOTICE '  ✓ DFA (disabled, placeholder)';
  RAISE NOTICE '  ✓ Vumatel (disabled, placeholder)';
  RAISE NOTICE '';
  RAISE NOTICE 'Views Created:';
  RAISE NOTICE '  ✓ v_active_providers';
  RAISE NOTICE '  ✓ v_products_with_providers';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Add MTN products with compatible_providers = ARRAY[''mtn'', ...]';
  RAISE NOTICE '  2. Create provider registry in /lib/coverage/provider-registry.ts';
  RAISE NOTICE '  3. Implement MTN product mapper in /lib/coverage/providers/mtn/';
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
END $$;
