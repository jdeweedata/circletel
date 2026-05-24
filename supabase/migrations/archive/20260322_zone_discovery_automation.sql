-- =============================================================================
-- Zone Discovery Automation
-- Automates zone creation by discovering high-potential wards from demographics,
-- coverage infrastructure, and execution milestone alignment.
-- =============================================================================

-- Zone discovery candidates table
-- Persists discovery run results for async admin review
CREATE TABLE IF NOT EXISTS zone_discovery_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source ward reference
  ward_code TEXT NOT NULL,
  ward_name TEXT,
  municipality TEXT,
  province TEXT NOT NULL,

  -- Spatial center (ward centroid)
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,

  -- Discovery scores (computed at scan time)
  demographic_fit_score DECIMAL(5,2) DEFAULT 0,
  coverage_score DECIMAL(5,2) DEFAULT 0,
  product_alignment_score DECIMAL(5,2) DEFAULT 0,
  market_opportunity_score DECIMAL(5,2) DEFAULT 0,
  composite_score DECIMAL(5,2) DEFAULT 0,

  -- Coverage infrastructure counts
  base_station_count INTEGER DEFAULT 0,
  base_station_connections INTEGER DEFAULT 0,
  dfa_connected_count INTEGER DEFAULT 0,
  dfa_near_net_count INTEGER DEFAULT 0,

  -- POI composition (determines suggested zone_type)
  business_poi_count INTEGER DEFAULT 0,
  office_poi_count INTEGER DEFAULT 0,
  healthcare_poi_count INTEGER DEFAULT 0,

  -- Ward demographics snapshot
  total_population INTEGER DEFAULT 0,
  total_households INTEGER DEFAULT 0,
  pct_no_internet DECIMAL(5,2) DEFAULT 0,
  pct_income_above_r12800 DECIMAL(5,2) DEFAULT 0,

  -- Suggestions
  suggested_zone_type TEXT NOT NULL CHECK (suggested_zone_type IN (
    'office_park', 'commercial_strip', 'clinic_cluster', 'residential_estate', 'mixed'
  )),
  suggested_zone_name TEXT NOT NULL,
  eligible_products TEXT[] NOT NULL DEFAULT '{}',

  -- Execution alignment
  milestone_month INTEGER,
  milestone_target_products TEXT[] DEFAULT '{}',

  -- Admin workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'expired'
  )),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_zone_id UUID REFERENCES sales_zones(id),
  rejection_reason TEXT,

  -- Discovery batch
  discovery_batch_id TEXT NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_zdc_status ON zone_discovery_candidates(status);
CREATE INDEX IF NOT EXISTS idx_zdc_composite_score ON zone_discovery_candidates(composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_zdc_batch ON zone_discovery_candidates(discovery_batch_id);
CREATE INDEX IF NOT EXISTS idx_zdc_ward ON zone_discovery_candidates(ward_code);
CREATE INDEX IF NOT EXISTS idx_zdc_province ON zone_discovery_candidates(province);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_zone_discovery_candidates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER zone_discovery_candidates_updated_at
  BEFORE UPDATE ON zone_discovery_candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_zone_discovery_candidates_updated_at();

-- =============================================================================
-- RPC: discover_zone_candidates
-- Finds high-potential wards that don't overlap with existing zones
-- =============================================================================
CREATE OR REPLACE FUNCTION discover_zone_candidates(
  p_min_fit_score DECIMAL DEFAULT 40,
  p_province TEXT DEFAULT NULL,
  p_max_existing_zone_distance_km DECIMAL DEFAULT 3.0,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  ward_code TEXT,
  ward_name TEXT,
  municipality TEXT,
  province TEXT,
  centroid_lat DOUBLE PRECISION,
  centroid_lng DOUBLE PRECISION,
  demographic_fit_score DECIMAL(5,2),
  pct_no_internet DECIMAL(5,2),
  pct_income_above_r12800 DECIMAL(5,2),
  pct_employed DECIMAL(5,2),
  total_population INTEGER,
  total_households INTEGER,
  business_poi_count INTEGER,
  office_poi_count INTEGER,
  healthcare_poi_count INTEGER,
  nearby_base_stations BIGINT,
  nearby_base_connections BIGINT,
  nearby_dfa_connected BIGINT,
  nearby_dfa_near_net BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wd.ward_code,
    wd.ward_name,
    wd.municipality,
    wd.province,
    wd.centroid_lat,
    wd.centroid_lng,
    wd.demographic_fit_score,
    wd.pct_no_internet,
    wd.pct_income_above_r12800,
    wd.pct_employed,
    wd.total_population,
    wd.total_households,
    wd.business_poi_count,
    wd.office_poi_count,
    wd.healthcare_poi_count,
    -- Base stations within 5km of ward centroid
    COALESCE((
      SELECT COUNT(*)
      FROM tarana_base_stations tbs
      WHERE wd.centroid_lat IS NOT NULL
        AND wd.centroid_lng IS NOT NULL
        AND ST_DWithin(
          tbs.location::GEOGRAPHY,
          ST_SetSRID(ST_MakePoint(wd.centroid_lng, wd.centroid_lat), 4326)::GEOGRAPHY,
          5000
        )
    ), 0)::BIGINT,
    -- Total active connections from nearby base stations
    COALESCE((
      SELECT SUM(tbs.active_connections)
      FROM tarana_base_stations tbs
      WHERE wd.centroid_lat IS NOT NULL
        AND wd.centroid_lng IS NOT NULL
        AND ST_DWithin(
          tbs.location::GEOGRAPHY,
          ST_SetSRID(ST_MakePoint(wd.centroid_lng, wd.centroid_lat), 4326)::GEOGRAPHY,
          5000
        )
    ), 0)::BIGINT,
    -- DFA connected buildings within 3km
    COALESCE((
      SELECT COUNT(*)
      FROM dfa_buildings db
      WHERE db.coverage_type = 'connected'
        AND wd.centroid_lat IS NOT NULL
        AND wd.centroid_lng IS NOT NULL
        AND ST_DWithin(
          db.location::GEOGRAPHY,
          ST_SetSRID(ST_MakePoint(wd.centroid_lng, wd.centroid_lat), 4326)::GEOGRAPHY,
          3000
        )
    ), 0)::BIGINT,
    -- DFA near-net buildings within 3km
    COALESCE((
      SELECT COUNT(*)
      FROM dfa_buildings db
      WHERE db.coverage_type = 'near-net'
        AND wd.centroid_lat IS NOT NULL
        AND wd.centroid_lng IS NOT NULL
        AND ST_DWithin(
          db.location::GEOGRAPHY,
          ST_SetSRID(ST_MakePoint(wd.centroid_lng, wd.centroid_lat), 4326)::GEOGRAPHY,
          3000
        )
    ), 0)::BIGINT
  FROM ward_demographics wd
  WHERE wd.demographic_fit_score >= p_min_fit_score
    AND (p_province IS NULL OR wd.province = p_province)
    AND wd.centroid_lat IS NOT NULL
    AND wd.centroid_lng IS NOT NULL
    -- Exclude wards that already overlap with active zones
    AND NOT EXISTS (
      SELECT 1 FROM sales_zones sz
      WHERE sz.status = 'active'
      AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(sz.center_lng, sz.center_lat), 4326)::GEOGRAPHY,
        ST_SetSRID(ST_MakePoint(wd.centroid_lng, wd.centroid_lat), 4326)::GEOGRAPHY,
        p_max_existing_zone_distance_km * 1000
      )
    )
    -- Exclude wards that already have pending candidates
    AND NOT EXISTS (
      SELECT 1 FROM zone_discovery_candidates zdc
      WHERE zdc.ward_code = wd.ward_code
      AND zdc.status = 'pending'
    )
  ORDER BY wd.demographic_fit_score DESC
  LIMIT p_limit;
END;
$$;
