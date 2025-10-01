-- Service Type Mapping: Links technical coverage types to CircleTel products
-- This allows us to map MTN/DFA coverage results to actual packages we sell

CREATE TABLE IF NOT EXISTS service_type_mapping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Technical service type from coverage providers (MTN, DFA, etc.)
  technical_type VARCHAR(50) NOT NULL CHECK (
    technical_type IN (
      'fibre',              -- FTTB/FTTH from DFA, Openserve
      'fixed_lte',          -- Fixed LTE from MTN
      'uncapped_wireless',  -- Tarana Wireless (SkyFibre) from MTN
      'licensed_wireless',  -- PMP wireless
      '5g',                 -- MTN 5G
      'lte',                -- MTN LTE
      '3g_900',             -- MTN 3G 900MHz
      '3g_2100',            -- MTN 3G 2100MHz
      '2g'                  -- MTN 2G (fallback)
    )
  ),

  -- Coverage provider
  provider VARCHAR(50) NOT NULL CHECK (
    provider IN ('mtn', 'dfa', 'openserve', 'vodacom', 'telkom', 'cell_c')
  ),

  -- CircleTel product category
  product_category VARCHAR(100) NOT NULL CHECK (
    product_category IN ('SkyFibre', 'HomeFibreConnect', 'BizFibreConnect', 'LTE', '5G')
  ),

  -- Optional: Specific product name if mapping is product-specific
  product_name VARCHAR(200),

  -- Priority for selecting products when multiple services available
  priority INTEGER DEFAULT 0,

  -- Whether this mapping is currently active
  active BOOLEAN DEFAULT true,

  -- Additional metadata
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique combinations
  UNIQUE(technical_type, provider, product_category)
);

-- Insert default mappings for CircleTel products

-- MTN Tarana Wireless (SkyFibre)
INSERT INTO service_type_mapping (technical_type, provider, product_category, priority, notes) VALUES
('uncapped_wireless', 'mtn', 'SkyFibre', 1, 'MTN Tarana Wireless G1 technology - branded as SkyFibre');

-- MTN LTE Products
INSERT INTO service_type_mapping (technical_type, provider, product_category, priority, notes) VALUES
('fixed_lte', 'mtn', 'LTE', 2, 'MTN Fixed LTE service'),
('lte', 'mtn', 'LTE', 3, 'MTN mobile LTE service');

-- MTN 5G Products
INSERT INTO service_type_mapping (technical_type, provider, product_category, priority, notes) VALUES
('5g', 'mtn', '5G', 1, 'MTN 5G service');

-- DFA Fibre Products (Home)
INSERT INTO service_type_mapping (technical_type, provider, product_category, priority, notes) VALUES
('fibre', 'dfa', 'HomeFibreConnect', 1, 'DFA Dark Fibre Africa - Residential fibre');

-- DFA Fibre Products (Business)
INSERT INTO service_type_mapping (technical_type, provider, product_category, priority, notes) VALUES
('fibre', 'dfa', 'BizFibreConnect', 2, 'DFA Dark Fibre Africa - Business fibre with SLA');

-- Openserve Fibre (alternative provider)
INSERT INTO service_type_mapping (technical_type, provider, product_category, priority, notes) VALUES
('fibre', 'openserve', 'HomeFibreConnect', 3, 'Openserve FTTB - Residential fibre'),
('fibre', 'openserve', 'BizFibreConnect', 4, 'Openserve FTTB - Business fibre');

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_service_type_mapping_lookup
ON service_type_mapping(technical_type, provider, active);

CREATE INDEX IF NOT EXISTS idx_service_type_mapping_category
ON service_type_mapping(product_category, active);

-- Function to get product categories from technical service types
CREATE OR REPLACE FUNCTION get_product_categories_from_services(
  service_types TEXT[],
  provider_name VARCHAR DEFAULT NULL
)
RETURNS TABLE(
  product_category VARCHAR,
  technical_type VARCHAR,
  provider VARCHAR,
  priority INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    stm.product_category,
    stm.technical_type,
    stm.provider,
    stm.priority
  FROM service_type_mapping stm
  WHERE stm.technical_type = ANY(service_types)
    AND stm.active = true
    AND (provider_name IS NULL OR stm.provider = provider_name)
  ORDER BY stm.priority ASC;
END;
$$ LANGUAGE plpgsql;

-- Update service_packages table to use product_category instead of service_type
-- Keep service_type for backwards compatibility but add product_category
ALTER TABLE service_packages
ADD COLUMN IF NOT EXISTS product_category VARCHAR(50);

-- Migrate existing data
UPDATE service_packages
SET product_category = service_type
WHERE product_category IS NULL;

-- Add index for product_category
CREATE INDEX IF NOT EXISTS idx_service_packages_product_category
ON service_packages(product_category, active);

-- Trigger for updated_at
CREATE TRIGGER update_service_type_mapping_updated_at
BEFORE UPDATE ON service_type_mapping
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE service_type_mapping IS 'Maps technical service types from providers (MTN, DFA) to CircleTel product categories';
COMMENT ON COLUMN service_type_mapping.technical_type IS 'Technical service type from coverage API (e.g., uncapped_wireless, fibre, 5g)';
COMMENT ON COLUMN service_type_mapping.provider IS 'Coverage provider (mtn, dfa, openserve, etc.)';
COMMENT ON COLUMN service_type_mapping.product_category IS 'CircleTel product category (SkyFibre, HomeFibreConnect, BizFibreConnect, LTE, 5G)';
COMMENT ON COLUMN service_type_mapping.priority IS 'Priority for product selection when multiple services available (lower = higher priority)';
