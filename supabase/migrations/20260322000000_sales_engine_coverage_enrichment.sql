-- =============================================================================
-- Sales Engine: Coverage Data Integration
-- Adds coverage enrichment columns to sales_zones and lead_scores,
-- plus PostGIS functions for spatial aggregation against
-- tarana_base_stations and dfa_buildings tables.
-- =============================================================================

-- =============================================================================
-- 1. New columns on sales_zones for coverage enrichment
-- =============================================================================
ALTER TABLE sales_zones ADD COLUMN IF NOT EXISTS base_station_count INTEGER DEFAULT 0;
ALTER TABLE sales_zones ADD COLUMN IF NOT EXISTS base_station_connections INTEGER DEFAULT 0;
ALTER TABLE sales_zones ADD COLUMN IF NOT EXISTS dfa_connected_count INTEGER DEFAULT 0;
ALTER TABLE sales_zones ADD COLUMN IF NOT EXISTS dfa_near_net_count INTEGER DEFAULT 0;
ALTER TABLE sales_zones ADD COLUMN IF NOT EXISTS coverage_confidence TEXT CHECK (coverage_confidence IN ('high', 'medium', 'low', 'none'));
ALTER TABLE sales_zones ADD COLUMN IF NOT EXISTS coverage_enriched_at TIMESTAMPTZ;
ALTER TABLE sales_zones ADD COLUMN IF NOT EXISTS radius_km DOUBLE PRECISION DEFAULT 3.0;
ALTER TABLE sales_zones ADD COLUMN IF NOT EXISTS coverage_score DECIMAL(5,2) DEFAULT 0;
ALTER TABLE sales_zones ADD COLUMN IF NOT EXISTS enriched_zone_score DECIMAL(5,2) DEFAULT 0;

-- =============================================================================
-- 2. New columns on lead_scores for per-lead coverage data
-- =============================================================================
ALTER TABLE lead_scores ADD COLUMN IF NOT EXISTS nearest_base_station_km DOUBLE PRECISION;
ALTER TABLE lead_scores ADD COLUMN IF NOT EXISTS skyfibre_confidence TEXT CHECK (skyfibre_confidence IN ('high', 'medium', 'low', 'none'));
ALTER TABLE lead_scores ADD COLUMN IF NOT EXISTS nearest_dfa_building_km DOUBLE PRECISION;
ALTER TABLE lead_scores ADD COLUMN IF NOT EXISTS dfa_coverage_type TEXT CHECK (dfa_coverage_type IN ('connected', 'near-net', 'none'));
ALTER TABLE lead_scores ADD COLUMN IF NOT EXISTS coverage_product_eligible TEXT[];

-- =============================================================================
-- 3. PostGIS function: Count base stations within radius of a point
-- Reuses existing idx_tarana_base_stations_geography GIST index
-- =============================================================================
CREATE OR REPLACE FUNCTION count_base_stations_in_radius(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION
)
RETURNS TABLE (
  station_count INTEGER,
  total_connections INTEGER
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COUNT(*)::INTEGER AS station_count,
    COALESCE(SUM(t.active_connections), 0)::INTEGER AS total_connections
  FROM tarana_base_stations t
  WHERE ST_DWithin(
    ST_SetSRID(ST_MakePoint(t.lng, t.lat), 4326)::geography,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    p_radius_km * 1000  -- ST_DWithin uses meters for geography
  );
$$;

-- =============================================================================
-- 4. PostGIS function: Count DFA buildings within radius of a point
-- Reuses existing idx_dfa_buildings_location GIST index
-- =============================================================================
CREATE OR REPLACE FUNCTION count_dfa_buildings_in_radius(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION
)
RETURNS TABLE (
  connected_count INTEGER,
  near_net_count INTEGER
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    COUNT(*) FILTER (WHERE d.coverage_type = 'connected')::INTEGER AS connected_count,
    COUNT(*) FILTER (WHERE d.coverage_type = 'near-net')::INTEGER AS near_net_count
  FROM dfa_buildings d
  WHERE ST_DWithin(
    ST_SetSRID(ST_MakePoint(d.longitude, d.latitude), 4326)::geography,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    p_radius_km * 1000
  );
$$;

-- =============================================================================
-- 5. PostGIS function: Find nearest DFA building to a point
-- Mirrors find_nearest_tarana_base_station pattern
-- =============================================================================
CREATE OR REPLACE FUNCTION find_nearest_dfa_building(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  building_name TEXT,
  building_id TEXT,
  street_address TEXT,
  coverage_type TEXT,
  ftth TEXT,
  precinct TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_km NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    d.id,
    d.building_name,
    d.building_id,
    d.street_address,
    d.coverage_type,
    d.ftth,
    d.precinct,
    d.latitude,
    d.longitude,
    ROUND(
      (ST_Distance(
        ST_SetSRID(ST_MakePoint(d.longitude, d.latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
      ) / 1000)::numeric,
      2
    ) AS distance_km
  FROM dfa_buildings d
  ORDER BY ST_SetSRID(ST_MakePoint(d.longitude, d.latitude), 4326)::geography <->
           ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  LIMIT p_limit;
$$;

-- =============================================================================
-- 6. Indexes for the new columns
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_sales_zones_coverage_confidence ON sales_zones(coverage_confidence);
CREATE INDEX IF NOT EXISTS idx_sales_zones_enriched_score ON sales_zones(enriched_zone_score DESC);
CREATE INDEX IF NOT EXISTS idx_lead_scores_skyfibre ON lead_scores(skyfibre_confidence);
CREATE INDEX IF NOT EXISTS idx_lead_scores_dfa_type ON lead_scores(dfa_coverage_type);

-- =============================================================================
-- 7. Grant permissions for the new functions
-- =============================================================================
GRANT EXECUTE ON FUNCTION count_base_stations_in_radius TO authenticated;
GRANT EXECUTE ON FUNCTION count_dfa_buildings_in_radius TO authenticated;
GRANT EXECUTE ON FUNCTION find_nearest_dfa_building TO authenticated;
GRANT EXECUTE ON FUNCTION count_base_stations_in_radius TO anon;
GRANT EXECUTE ON FUNCTION count_dfa_buildings_in_radius TO anon;
GRANT EXECUTE ON FUNCTION find_nearest_dfa_building TO anon;

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON FUNCTION count_base_stations_in_radius IS 'Count Tarana base stations and total connections within radius_km of a point. Used by sales engine zone enrichment.';
COMMENT ON FUNCTION count_dfa_buildings_in_radius IS 'Count DFA buildings (connected and near-net) within radius_km of a point. Used by sales engine zone enrichment.';
COMMENT ON FUNCTION find_nearest_dfa_building IS 'Find nearest DFA buildings to a point with distance. Mirrors find_nearest_tarana_base_station pattern.';
