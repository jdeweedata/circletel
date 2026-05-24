-- FTTB (Fibre-to-the-Business) Network Providers System
-- Phase 2: Business Journey - Multi-provider FTTB infrastructure

-- Create FTTB network providers table
CREATE TABLE IF NOT EXISTS fttb_network_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  provider_type VARCHAR(50) NOT NULL CHECK (
    provider_type IN ('wholesale', 'retail', 'hybrid')
  ),
  technology VARCHAR(50) NOT NULL CHECK (
    technology IN ('FTTB', 'FTTH', 'FTTC', 'Ethernet', 'Mixed')
  ),
  coverage_api_url TEXT,
  coverage_api_type VARCHAR(50) CHECK (
    coverage_api_type IN ('arcgis', 'rest', 'graphql', 'manual', null)
  ),
  api_credentials JSONB, -- Encrypted API keys/tokens
  service_areas TEXT[], -- List of cities/provinces covered
  active BOOLEAN DEFAULT true,

  -- Coverage metadata
  total_buildings INTEGER DEFAULT 0,
  last_coverage_update TIMESTAMPTZ,

  -- Business metrics
  average_activation_days INTEGER DEFAULT 7,
  sla_uptime_percentage DECIMAL(5, 2) DEFAULT 99.5,

  -- Contact information
  sales_contact VARCHAR(255),
  support_contact VARCHAR(255),
  support_phone VARCHAR(50),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create FTTB coverage areas table (for caching and offline fallback)
CREATE TABLE IF NOT EXISTS fttb_coverage_areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES fttb_network_providers(id) ON DELETE CASCADE,

  -- Location data
  building_id VARCHAR(100), -- Provider's building identifier
  building_name VARCHAR(255),
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  geolocation GEOGRAPHY(POINT, 4326), -- PostGIS spatial data

  -- Coverage details
  connection_type VARCHAR(50) NOT NULL CHECK (
    connection_type IN ('Direct', 'Third Party', 'Planned', 'Unavailable')
  ),
  technology VARCHAR(50),
  max_speed_down INTEGER, -- Maximum download speed in Mbps
  max_speed_up INTEGER,   -- Maximum upload speed in Mbps

  -- Business flags
  is_promotion BOOLEAN DEFAULT false,
  requires_third_party BOOLEAN DEFAULT false,
  estimated_activation_days INTEGER DEFAULT 7,

  -- Metadata
  precinct VARCHAR(255),
  last_verified TIMESTAMPTZ DEFAULT NOW(),
  active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add network_provider_id to service_packages
ALTER TABLE service_packages
ADD COLUMN IF NOT EXISTS network_provider_id UUID REFERENCES fttb_network_providers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS requires_fttb_coverage BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS product_category VARCHAR(50) CHECK (
  product_category IN ('wireless', 'fibre_consumer', 'fibre_business', 'lte', '5g', null)
);

-- Create indexes for spatial queries
CREATE INDEX IF NOT EXISTS idx_fttb_coverage_geolocation
ON fttb_coverage_areas USING GIST(geolocation);

CREATE INDEX IF NOT EXISTS idx_fttb_coverage_provider
ON fttb_coverage_areas(provider_id, active) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_fttb_coverage_coordinates
ON fttb_coverage_areas(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_service_packages_provider
ON service_packages(network_provider_id, active) WHERE active = true;

-- Insert DFA as primary FTTB provider
INSERT INTO fttb_network_providers (
  name,
  display_name,
  provider_type,
  technology,
  coverage_api_url,
  coverage_api_type,
  service_areas,
  active,
  average_activation_days,
  sla_uptime_percentage,
  support_contact,
  support_phone
) VALUES (
  'DFA',
  'Dark Fibre Africa',
  'wholesale',
  'FTTB',
  'https://gisportal.dfafrica.co.za/server/rest/services/API/DFA_Connected_Buildings/MapServer/0/query',
  'arcgis',
  ARRAY['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'East London'],
  true,
  7,
  99.5,
  'support@dfafrica.co.za',
  '0860 332 000'
) ON CONFLICT (name) DO NOTHING;

-- Insert placeholder for future providers
INSERT INTO fttb_network_providers (
  name,
  display_name,
  provider_type,
  technology,
  service_areas,
  active
) VALUES
('Openserve', 'Openserve Business', 'wholesale', 'FTTB', ARRAY['National'], false),
('Vumatel', 'Vumatel Business', 'wholesale', 'FTTB', ARRAY['Cape Town', 'Johannesburg'], false),
('Frogfoot', 'Frogfoot Networks', 'wholesale', 'FTTH', ARRAY['Cape Town', 'Port Elizabeth'], false)
ON CONFLICT (name) DO NOTHING;

-- Update BizFibreConnect packages to link with DFA provider and mark as requiring FTTB coverage
UPDATE service_packages
SET
  network_provider_id = (SELECT id FROM fttb_network_providers WHERE name = 'DFA'),
  requires_fttb_coverage = true,
  product_category = 'fibre_business'
WHERE service_type = 'BizFibreConnect';

-- Update HomeFibreConnect packages to be consumer fibre (no FTTB requirement)
UPDATE service_packages
SET
  product_category = 'fibre_consumer',
  requires_fttb_coverage = false
WHERE service_type = 'HomeFibreConnect';

-- Update SkyFibre packages as wireless
UPDATE service_packages
SET
  product_category = 'wireless',
  requires_fttb_coverage = false
WHERE service_type = 'SkyFibre';

-- Update MTN packages as business LTE/5G
UPDATE service_packages
SET
  product_category = CASE
    WHEN service_type = '5g' THEN '5g'
    ELSE 'lte'
  END,
  requires_fttb_coverage = false
WHERE service_type IN ('5g', 'lte');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fttb_providers_updated_at
  BEFORE UPDATE ON fttb_network_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fttb_coverage_updated_at
  BEFORE UPDATE ON fttb_coverage_areas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE fttb_network_providers IS 'FTTB (Fibre-to-the-Business) network provider registry supporting multi-provider architecture';
COMMENT ON TABLE fttb_coverage_areas IS 'Cached FTTB coverage data from network providers for fast lookups and offline fallback';
COMMENT ON COLUMN service_packages.network_provider_id IS 'Links package to specific network provider (null for provider-agnostic packages)';
COMMENT ON COLUMN service_packages.requires_fttb_coverage IS 'Whether package requires FTTB coverage check before display';
COMMENT ON COLUMN service_packages.product_category IS 'Product category for filtering: wireless, fibre_consumer, fibre_business, lte, 5g';
