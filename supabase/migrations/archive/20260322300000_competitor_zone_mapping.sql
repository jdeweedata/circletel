-- Competitor zone coverage mapping
-- Tracks which competitors have coverage in each sales zone
-- Used to auto-compute competitor_weakness_score per zone

CREATE TABLE IF NOT EXISTS competitor_zone_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES sales_zones(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  has_coverage BOOLEAN DEFAULT false,
  coverage_type TEXT, -- 'fibre', 'lte', '5g', 'fwa', 'dsl'
  confidence TEXT DEFAULT 'inferred' CHECK (confidence IN ('confirmed', 'inferred', 'scraped')),
  source TEXT, -- 'dfa_proxy', 'firecrawl', 'manual'
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(zone_id, competitor_name)
);

CREATE INDEX IF NOT EXISTS idx_czc_zone ON competitor_zone_coverage(zone_id);
CREATE INDEX IF NOT EXISTS idx_czc_competitor ON competitor_zone_coverage(competitor_name);

-- Function to auto-compute competitor_weakness_score from coverage count
-- Each competitor with coverage deducts 15 points from a base of 100
CREATE OR REPLACE FUNCTION compute_competitor_weakness_score(p_zone_id UUID)
RETURNS INTEGER
LANGUAGE sql STABLE AS $$
  SELECT GREATEST(0, LEAST(100,
    100 - (COUNT(*) FILTER (WHERE has_coverage = true) * 15)::INTEGER
  ))
  FROM competitor_zone_coverage
  WHERE zone_id = p_zone_id;
$$;
