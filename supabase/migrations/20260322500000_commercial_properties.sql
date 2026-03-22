-- Commercial property intelligence from REIT portfolio scraping
CREATE TABLE IF NOT EXISTS commercial_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  suburb TEXT,
  city TEXT,
  province TEXT,
  property_type TEXT CHECK (property_type IN ('office_park', 'retail_centre', 'industrial_park', 'mixed_use', 'other')),
  sector TEXT, -- raw sector from source (e.g. 'Office', 'Retail', 'Industrial')
  gla_sqm INTEGER, -- Gross Lettable Area in square meters
  grade TEXT, -- e.g. 'A Grade', 'P Grade'
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  source TEXT NOT NULL, -- 'redefine', 'growthpoint', 'attacq'
  source_url TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commercial_props_suburb ON commercial_properties(suburb);
CREATE INDEX IF NOT EXISTS idx_commercial_props_province ON commercial_properties(province);
CREATE INDEX IF NOT EXISTS idx_commercial_props_type ON commercial_properties(property_type);
CREATE INDEX IF NOT EXISTS idx_commercial_props_source ON commercial_properties(source);
CREATE UNIQUE INDEX IF NOT EXISTS idx_commercial_props_source_url ON commercial_properties(source_url) WHERE source_url IS NOT NULL;

-- Add commercial_property_count to sales_zones
ALTER TABLE sales_zones ADD COLUMN IF NOT EXISTS commercial_property_count INTEGER NOT NULL DEFAULT 0;
