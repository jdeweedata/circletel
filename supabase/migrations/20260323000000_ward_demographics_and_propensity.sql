-- =============================================================================
-- Ward Demographics & Propensity Score System
-- Adds Stats SA Census 2022 ward-level demographic data for zone targeting.
-- =============================================================================

-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================================================
-- 1. Ward Demographics Table (~4,400 wards in South Africa)
-- =============================================================================

CREATE TABLE IF NOT EXISTS ward_demographics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_code TEXT UNIQUE NOT NULL,
  ward_name TEXT,
  municipality TEXT,
  province TEXT NOT NULL,

  -- Spatial: ward polygon boundary
  boundary GEOGRAPHY(MULTIPOLYGON, 4326),
  centroid_lat DOUBLE PRECISION,
  centroid_lng DOUBLE PRECISION,

  -- Population
  total_population INTEGER DEFAULT 0,
  total_households INTEGER DEFAULT 0,

  -- Income distribution (% of households)
  pct_income_above_r12800 DECIMAL(5,2) DEFAULT 0,
  pct_income_r6400_12800 DECIMAL(5,2) DEFAULT 0,

  -- Internet access (% of households)
  pct_no_internet DECIMAL(5,2) DEFAULT 0,
  pct_cellphone_internet DECIMAL(5,2) DEFAULT 0,
  pct_fixed_internet DECIMAL(5,2) DEFAULT 0,

  -- Employment & housing
  pct_employed DECIMAL(5,2) DEFAULT 0,
  pct_formal_dwelling DECIMAL(5,2) DEFAULT 0,

  -- POI counts (populated by OSM import - Phase 5)
  business_poi_count INTEGER DEFAULT 0,
  office_poi_count INTEGER DEFAULT 0,
  healthcare_poi_count INTEGER DEFAULT 0,

  -- Computed demographic fit score (0-100)
  demographic_fit_score DECIMAL(5,2) DEFAULT 0,

  -- Metadata
  data_source TEXT DEFAULT 'stats_sa_census_2022',
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ward_demographics_boundary
  ON ward_demographics USING GIST (boundary);
CREATE INDEX IF NOT EXISTS idx_ward_demographics_province
  ON ward_demographics (province);
CREATE INDEX IF NOT EXISTS idx_ward_demographics_fit_score
  ON ward_demographics (demographic_fit_score DESC);
CREATE INDEX IF NOT EXISTS idx_ward_demographics_ward_code
  ON ward_demographics (ward_code);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_ward_demographics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ward_demographics_updated_at
  BEFORE UPDATE ON ward_demographics
  FOR EACH ROW
  EXECUTE FUNCTION update_ward_demographics_updated_at();

-- =============================================================================
-- 2. RPC: get_demographics_in_radius
-- Returns aggregated ward demographics within a circle around a point.
-- Used by enrichZoneDemographics() to compute zone-level scores.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_demographics_in_radius(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION DEFAULT 3.0
)
RETURNS TABLE (
  ward_count INTEGER,
  total_population BIGINT,
  total_households BIGINT,
  avg_pct_no_internet DECIMAL(5,2),
  avg_pct_cellphone_internet DECIMAL(5,2),
  avg_pct_fixed_internet DECIMAL(5,2),
  avg_pct_income_above_r12800 DECIMAL(5,2),
  avg_pct_income_r6400_12800 DECIMAL(5,2),
  avg_pct_employed DECIMAL(5,2),
  avg_pct_formal_dwelling DECIMAL(5,2),
  total_business_pois BIGINT,
  total_office_pois BIGINT,
  total_healthcare_pois BIGINT,
  avg_demographic_fit_score DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  search_point GEOGRAPHY;
BEGIN
  -- Create point from coordinates
  search_point := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::GEOGRAPHY;

  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS ward_count,
    COALESCE(SUM(wd.total_population), 0)::BIGINT AS total_population,
    COALESCE(SUM(wd.total_households), 0)::BIGINT AS total_households,
    COALESCE(AVG(wd.pct_no_internet), 0)::DECIMAL(5,2) AS avg_pct_no_internet,
    COALESCE(AVG(wd.pct_cellphone_internet), 0)::DECIMAL(5,2) AS avg_pct_cellphone_internet,
    COALESCE(AVG(wd.pct_fixed_internet), 0)::DECIMAL(5,2) AS avg_pct_fixed_internet,
    COALESCE(AVG(wd.pct_income_above_r12800), 0)::DECIMAL(5,2) AS avg_pct_income_above_r12800,
    COALESCE(AVG(wd.pct_income_r6400_12800), 0)::DECIMAL(5,2) AS avg_pct_income_r6400_12800,
    COALESCE(AVG(wd.pct_employed), 0)::DECIMAL(5,2) AS avg_pct_employed,
    COALESCE(AVG(wd.pct_formal_dwelling), 0)::DECIMAL(5,2) AS avg_pct_formal_dwelling,
    COALESCE(SUM(wd.business_poi_count), 0)::BIGINT AS total_business_pois,
    COALESCE(SUM(wd.office_poi_count), 0)::BIGINT AS total_office_pois,
    COALESCE(SUM(wd.healthcare_poi_count), 0)::BIGINT AS total_healthcare_pois,
    COALESCE(AVG(wd.demographic_fit_score), 0)::DECIMAL(5,2) AS avg_demographic_fit_score
  FROM ward_demographics wd
  WHERE wd.boundary IS NOT NULL
    AND ST_DWithin(wd.boundary, search_point, p_radius_km * 1000);
    -- ST_DWithin with GEOGRAPHY type uses meters, so multiply km by 1000
END;
$$;

-- =============================================================================
-- 3. ALTER sales_zones — add demographic + propensity columns
-- =============================================================================

ALTER TABLE sales_zones ADD COLUMN IF NOT EXISTS demographic_fit_score DECIMAL(5,2) DEFAULT 0;
ALTER TABLE sales_zones ADD COLUMN IF NOT EXISTS business_poi_density INTEGER DEFAULT 0;
ALTER TABLE sales_zones ADD COLUMN IF NOT EXISTS pct_no_internet DECIMAL(5,2) DEFAULT 0;
ALTER TABLE sales_zones ADD COLUMN IF NOT EXISTS pct_income_target DECIMAL(5,2) DEFAULT 0;
ALTER TABLE sales_zones ADD COLUMN IF NOT EXISTS propensity_score DECIMAL(5,2) DEFAULT 0;
ALTER TABLE sales_zones ADD COLUMN IF NOT EXISTS demographic_enriched_at TIMESTAMPTZ;

-- =============================================================================
-- 4. RLS Policies for ward_demographics
-- =============================================================================

ALTER TABLE ward_demographics ENABLE ROW LEVEL SECURITY;

-- Admin users can read/write (service role bypasses RLS anyway)
CREATE POLICY "Admin users can manage ward demographics"
  ON ward_demographics
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 5. RPC: suggest_zones_from_demographics
-- Finds wards with high demographic fit that overlap with coverage infrastructure.
-- Used by ZoneSuggestionPanel to auto-suggest new zones.
-- =============================================================================

CREATE OR REPLACE FUNCTION suggest_zones_from_demographics(
  p_min_fit_score DECIMAL DEFAULT 50,
  p_province TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
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
  total_population INTEGER,
  total_households INTEGER,
  business_poi_count INTEGER,
  nearby_base_stations BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
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
    wd.total_population,
    wd.total_households,
    wd.business_poi_count,
    (
      SELECT COUNT(*)
      FROM tarana_base_stations tbs
      WHERE wd.centroid_lat IS NOT NULL
        AND wd.centroid_lng IS NOT NULL
        AND ST_DWithin(
          tbs.location::GEOGRAPHY,
          ST_SetSRID(ST_MakePoint(wd.centroid_lng, wd.centroid_lat), 4326)::GEOGRAPHY,
          5000  -- 5km radius
        )
    ) AS nearby_base_stations
  FROM ward_demographics wd
  WHERE wd.demographic_fit_score >= p_min_fit_score
    AND (p_province IS NULL OR wd.province = p_province)
    AND wd.centroid_lat IS NOT NULL
    AND wd.centroid_lng IS NOT NULL
  ORDER BY wd.demographic_fit_score DESC
  LIMIT p_limit;
END;
$$;
