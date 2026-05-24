-- =============================================================================
-- Sniper Engine Phase 1: Campaign Tags, Demand Signals, Auto-Decision Tracking
--
-- Extends the sales engine schema with:
--   1. Campaign tagging and routing columns on sales_zones
--   2. Auto-decision and campaign columns on zone_discovery_candidates
--   3. New coverage_demand_signals table for ward-level demand aggregation
--   4. Location index on coverage_check_logs for spatial queries
--   5. PostGIS function aggregate_demand_by_ward() for demand scoring
-- =============================================================================

-- =============================================================================
-- 1. Add columns to sales_zones
-- =============================================================================
ALTER TABLE sales_zones ADD COLUMN IF NOT EXISTS campaign_tag TEXT;
ALTER TABLE sales_zones ADD COLUMN IF NOT EXISTS campaign_tagged_at TIMESTAMPTZ;
ALTER TABLE sales_zones ADD COLUMN IF NOT EXISTS arlan_routing TEXT
  CHECK (arlan_routing IN ('tarana_primary', 'arlan_primary', 'dual_funnel'))
  DEFAULT 'dual_funnel';
ALTER TABLE sales_zones ADD COLUMN IF NOT EXISTS seo_slug TEXT;
ALTER TABLE sales_zones ADD COLUMN IF NOT EXISTS demand_signal_count INTEGER NOT NULL DEFAULT 0;

-- Unique partial index on seo_slug (only non-null values must be unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_zones_seo_slug
  ON sales_zones(seo_slug)
  WHERE seo_slug IS NOT NULL;

-- Partial index on campaign_tag for fast campaign lookups
CREATE INDEX IF NOT EXISTS idx_sales_zones_campaign
  ON sales_zones(campaign_tag)
  WHERE campaign_tag IS NOT NULL;

-- Index on arlan_routing for routing queries
CREATE INDEX IF NOT EXISTS idx_sales_zones_arlan_routing
  ON sales_zones(arlan_routing);

-- =============================================================================
-- 2. Add columns to zone_discovery_candidates
-- =============================================================================
ALTER TABLE zone_discovery_candidates ADD COLUMN IF NOT EXISTS auto_decision TEXT
  CHECK (auto_decision IN ('auto_approved_high', 'auto_approved_passive', 'rejected'));
ALTER TABLE zone_discovery_candidates ADD COLUMN IF NOT EXISTS auto_decided_at TIMESTAMPTZ;
ALTER TABLE zone_discovery_candidates ADD COLUMN IF NOT EXISTS campaign_tag TEXT;
ALTER TABLE zone_discovery_candidates ADD COLUMN IF NOT EXISTS arlan_only_zone BOOLEAN NOT NULL DEFAULT FALSE;

-- =============================================================================
-- 3. Create coverage_demand_signals table
-- =============================================================================
CREATE TABLE IF NOT EXISTS coverage_demand_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_code TEXT NOT NULL,
  week_start DATE NOT NULL,
  check_count INTEGER DEFAULT 0,
  checks_with_coverage INTEGER DEFAULT 0,
  checks_no_coverage INTEGER DEFAULT 0,
  unique_sessions INTEGER DEFAULT 0,
  demand_score DECIMAL(5,2) GENERATED ALWAYS AS (
    LEAST(100, (check_count * 5.0) + (checks_no_coverage * 3.0))
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ward_code, week_start)
);

CREATE INDEX IF NOT EXISTS idx_demand_signals_ward_code
  ON coverage_demand_signals(ward_code);

CREATE INDEX IF NOT EXISTS idx_demand_signals_week_start
  ON coverage_demand_signals(week_start DESC);

CREATE INDEX IF NOT EXISTS idx_demand_signals_score
  ON coverage_demand_signals(demand_score DESC);

-- =============================================================================
-- 4. Add location index to coverage_check_logs
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_ccl_lat_lng
  ON coverage_check_logs(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- =============================================================================
-- 5. PostGIS function: aggregate_demand_by_ward
--    Joins coverage_check_logs to the nearest ward in ward_demographics
--    using ST_Distance on geography types, grouped by ward_code.
-- =============================================================================
CREATE OR REPLACE FUNCTION aggregate_demand_by_ward(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  ward_code TEXT,
  check_count BIGINT,
  checks_with_coverage BIGINT,
  checks_no_coverage BIGINT,
  unique_sessions BIGINT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    nearest_ward.ward_code,
    COUNT(*)::BIGINT AS check_count,
    COUNT(*) FILTER (WHERE ccl.has_coverage = TRUE)::BIGINT AS checks_with_coverage,
    COUNT(*) FILTER (WHERE ccl.has_coverage = FALSE)::BIGINT AS checks_no_coverage,
    COUNT(DISTINCT ccl.session_id)::BIGINT AS unique_sessions
  FROM coverage_check_logs ccl
  CROSS JOIN LATERAL (
    SELECT wd.ward_code
    FROM ward_demographics wd
    WHERE wd.centroid_lat IS NOT NULL
      AND wd.centroid_lng IS NOT NULL
    ORDER BY ST_Distance(
      ST_SetSRID(ST_MakePoint(ccl.longitude, ccl.latitude), 4326)::GEOGRAPHY,
      ST_SetSRID(ST_MakePoint(wd.centroid_lng, wd.centroid_lat), 4326)::GEOGRAPHY
    )
    LIMIT 1
  ) nearest_ward
  WHERE ccl.latitude IS NOT NULL
    AND ccl.longitude IS NOT NULL
    AND ccl.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY nearest_ward.ward_code;
$$;
