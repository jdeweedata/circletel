-- Create coverage_maps table for storing uploaded KML/KMZ/GeoJSON files
CREATE TABLE IF NOT EXISTS coverage_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('kml', 'kmz', 'geojson')),
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  coverage_area VARCHAR(255) NOT NULL,
  features_count INTEGER DEFAULT 0,
  bounds JSONB,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on provider for faster filtering
CREATE INDEX IF NOT EXISTS idx_coverage_maps_provider ON coverage_maps(provider);

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_coverage_maps_status ON coverage_maps(status);

-- Create index on file_type
CREATE INDEX IF NOT EXISTS idx_coverage_maps_file_type ON coverage_maps(file_type);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_coverage_maps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_coverage_maps_updated_at
  BEFORE UPDATE ON coverage_maps
  FOR EACH ROW
  EXECUTE FUNCTION update_coverage_maps_updated_at();

-- Add RLS policies
ALTER TABLE coverage_maps ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (admin panel)
CREATE POLICY "Allow all operations for authenticated users"
  ON coverage_maps
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow read access for anonymous users (public coverage checker)
CREATE POLICY "Allow read for anonymous users"
  ON coverage_maps
  FOR SELECT
  TO anon
  USING (status = 'active');