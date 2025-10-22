-- =====================================================
-- Multi-Provider Architecture Migration (Clean Version)
-- Created: 2025-10-21
-- =====================================================

-- 1. Enhance fttb_network_providers table
ALTER TABLE fttb_network_providers
ADD COLUMN IF NOT EXISTS provider_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS service_offerings JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS api_version TEXT,
ADD COLUMN IF NOT EXISTS api_documentation_url TEXT,
ADD COLUMN IF NOT EXISTS coverage_source TEXT;

-- Add check constraint for coverage_source
ALTER TABLE fttb_network_providers
DROP CONSTRAINT IF EXISTS fttb_network_providers_coverage_source_check;

ALTER TABLE fttb_network_providers
ADD CONSTRAINT fttb_network_providers_coverage_source_check
CHECK (coverage_source IN ('api', 'static_file', 'postgis', 'hybrid'));

-- 2. Enhance service_packages table
ALTER TABLE service_packages
ADD COLUMN IF NOT EXISTS compatible_providers TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS provider_specific_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS provider_priority INTEGER DEFAULT 1;

-- 3. Create provider_product_mappings table
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

-- 4. Update MTN providers
UPDATE fttb_network_providers
SET
  provider_code = 'mtn',
  service_offerings = '["fibre", "wireless", "5g", "lte"]'::jsonb,
  coverage_source = 'api',
  api_version = 'v1',
  api_documentation_url = 'https://mtnbusiness.co.za/api-docs'
WHERE name ILIKE '%mtn%' AND provider_code IS NULL;

-- 5. Add placeholder providers
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

-- 6. Create indexes
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

-- 7. Create updated_at trigger function
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

-- 8. Create views
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
