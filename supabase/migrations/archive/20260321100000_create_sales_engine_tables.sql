-- =============================================================================
-- Sales Engine: Data-Driven Sales Strategy Tables
-- 5 tables: sales_zones, lead_scores, sales_pipeline_stages, zone_metrics, msc_tracking
-- =============================================================================

-- Ensure PostGIS is available (already enabled but safe to re-run)
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================================================
-- Table 1: sales_zones — Territory Intelligence (Layer 1)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sales_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  zone_type TEXT NOT NULL CHECK (zone_type IN ('office_park', 'commercial_strip', 'clinic_cluster', 'residential_estate', 'mixed')),
  description TEXT,
  boundary GEOGRAPHY(POLYGON, 4326),
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,

  -- Scoring inputs (Layer 1 formula)
  sme_density_score INTEGER DEFAULT 0 CHECK (sme_density_score BETWEEN 0 AND 100),
  penetration_rate DECIMAL(5,2) DEFAULT 0,
  competitor_weakness_score INTEGER DEFAULT 0 CHECK (competitor_weakness_score BETWEEN 0 AND 100),
  serviceable_addresses INTEGER DEFAULT 0,
  active_customers INTEGER DEFAULT 0,

  -- Computed zone score: (SME * 0.4) + ((100 - penetration) * 0.4) + (competitor_weakness * 0.2)
  zone_score DECIMAL(5,2) GENERATED ALWAYS AS (
    (sme_density_score * 0.4) + ((100 - LEAST(penetration_rate, 100)) * 0.4) + (competitor_weakness_score * 0.2)
  ) STORED,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'parked', 'saturated')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),

  -- Metadata
  province TEXT DEFAULT 'Gauteng',
  suburb TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Table 2: lead_scores — Address-Level Lead Scoring (Layer 2)
-- =============================================================================
CREATE TABLE IF NOT EXISTS lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coverage_lead_id UUID REFERENCES coverage_leads(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES sales_zones(id) ON DELETE SET NULL,

  -- 4-dimension scoring (each 0-100)
  product_fit_score INTEGER DEFAULT 0 CHECK (product_fit_score BETWEEN 0 AND 100),
  revenue_potential_score INTEGER DEFAULT 0 CHECK (revenue_potential_score BETWEEN 0 AND 100),
  competitive_vuln_score INTEGER DEFAULT 0 CHECK (competitive_vuln_score BETWEEN 0 AND 100),
  conversion_speed_score INTEGER DEFAULT 0 CHECK (conversion_speed_score BETWEEN 0 AND 100),

  -- Computed composite score (weighted average)
  composite_score DECIMAL(5,2) GENERATED ALWAYS AS (
    (product_fit_score * 0.35) + (revenue_potential_score * 0.30) +
    (competitive_vuln_score * 0.20) + (conversion_speed_score * 0.15)
  ) STORED,

  -- Scoring context
  recommended_product TEXT,
  recommended_track TEXT CHECK (recommended_track IN ('office_park', 'sme_strip', 'clinic', 'referral', 'residential')),
  estimated_mrr DECIMAL(10,2),
  competitor_identified TEXT,

  -- Status
  scoring_date TIMESTAMPTZ DEFAULT NOW(),
  scored_by TEXT DEFAULT 'system',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Table 3: sales_pipeline_stages — Zone-Aware Pipeline (Layer 3-4)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sales_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coverage_lead_id UUID REFERENCES coverage_leads(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES sales_zones(id) ON DELETE SET NULL,
  lead_score_id UUID REFERENCES lead_scores(id) ON DELETE SET NULL,

  -- Pipeline stages (7-day close cycle)
  stage TEXT NOT NULL DEFAULT 'coverage_confirmed' CHECK (stage IN (
    'coverage_confirmed',
    'contact_made',
    'site_survey_booked',
    'quote_sent',
    'objection_stage',
    'contract_signed',
    'installed_active'
  )),
  stage_entered_at TIMESTAMPTZ DEFAULT NOW(),
  day_target INTEGER,

  -- Contact tracking
  contact_method TEXT CHECK (contact_method IN ('linkedin', 'whatsapp', 'walk_in', 'referral', 'phone', 'email')),
  decision_maker_confirmed BOOLEAN DEFAULT FALSE,

  -- Quote/deal info
  quote_mrr DECIMAL(10,2),
  product_tier TEXT,
  contract_type TEXT CHECK (contract_type IN ('month_to_month', '12_month', '24_month', '36_month')),

  -- Objection tracking
  objection_category TEXT CHECK (objection_category IN ('price', 'competitor_lock_in', 'trust', 'need_to_think', 'technical', 'budget', 'timing', 'none')),

  -- Loss tracking (geo-tagged)
  outcome TEXT DEFAULT 'open' CHECK (outcome IN ('open', 'won', 'lost', 'parked')),
  loss_reason TEXT,
  loss_competitor TEXT,

  -- ZOHO sync
  zoho_deal_id TEXT,
  zoho_synced BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Table 4: zone_metrics — Weekly Scorecard (Layer 5)
-- =============================================================================
CREATE TABLE IF NOT EXISTS zone_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES sales_zones(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,

  -- Core metrics
  serviceable_addresses INTEGER DEFAULT 0,
  active_customers INTEGER DEFAULT 0,
  penetration_rate DECIMAL(5,2) DEFAULT 0,

  -- Funnel metrics
  addresses_canvassed INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  coverage_to_lead_rate DECIMAL(5,2) DEFAULT 0,
  qualified_leads INTEGER DEFAULT 0,
  closed_deals INTEGER DEFAULT 0,
  lead_to_close_rate DECIMAL(5,2) DEFAULT 0,

  -- Revenue metrics
  new_mrr_added DECIMAL(10,2) DEFAULT 0,
  total_zone_mrr DECIMAL(10,2) DEFAULT 0,
  cost_per_activation DECIMAL(10,2) DEFAULT 0,
  avg_arpu DECIMAL(10,2) DEFAULT 0,

  -- MSC tracking
  active_rns INTEGER DEFAULT 0,

  -- Outreach metrics
  linkedin_contacts INTEGER DEFAULT 0,
  whatsapp_contacts INTEGER DEFAULT 0,
  walk_ins INTEGER DEFAULT 0,
  referrals_generated INTEGER DEFAULT 0,

  -- Zone health
  conversion_rate_trend TEXT CHECK (conversion_rate_trend IN ('improving', 'stable', 'declining')),
  recommended_action TEXT CHECK (recommended_action IN ('increase_effort', 'change_message', 'park_zone', 'maintain')),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(zone_id, week_start)
);

-- =============================================================================
-- Table 5: msc_tracking — MTN Minimum Spend Commitment
-- =============================================================================
CREATE TABLE IF NOT EXISTS msc_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_label TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  msc_amount DECIMAL(10,2) NOT NULL,
  required_rns INTEGER NOT NULL,
  actual_rns INTEGER DEFAULT 0,
  actual_spend DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'met', 'at_risk', 'missed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Indexes
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_sales_zones_score ON sales_zones(zone_score DESC);
CREATE INDEX IF NOT EXISTS idx_sales_zones_status ON sales_zones(status);
CREATE INDEX IF NOT EXISTS idx_lead_scores_zone ON lead_scores(zone_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_composite ON lead_scores(composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_lead_scores_coverage_lead ON lead_scores(coverage_lead_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_zone ON sales_pipeline_stages(zone_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stage ON sales_pipeline_stages(stage);
CREATE INDEX IF NOT EXISTS idx_pipeline_outcome ON sales_pipeline_stages(outcome);
CREATE INDEX IF NOT EXISTS idx_pipeline_coverage_lead ON sales_pipeline_stages(coverage_lead_id);
CREATE INDEX IF NOT EXISTS idx_zone_metrics_week ON zone_metrics(zone_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_msc_tracking_status ON msc_tracking(status);

-- =============================================================================
-- Add zone_id and lead_score to coverage_leads for linking
-- =============================================================================
ALTER TABLE coverage_leads ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES sales_zones(id) ON DELETE SET NULL;
ALTER TABLE coverage_leads ADD COLUMN IF NOT EXISTS lead_score DECIMAL(5,2);

-- =============================================================================
-- Seed MSC tracking data (known MTN commitments)
-- =============================================================================
INSERT INTO msc_tracking (period_label, period_start, period_end, msc_amount, required_rns) VALUES
  ('Month 4-6', '2026-07-01', '2026-09-30', 14970.00, 30),
  ('Month 7-9', '2026-10-01', '2026-12-31', 29940.00, 60),
  ('Month 10-12', '2027-01-01', '2027-03-31', 49900.00, 100)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Updated_at triggers
-- =============================================================================
CREATE OR REPLACE FUNCTION update_sales_engine_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sales_zones_updated_at
  BEFORE UPDATE ON sales_zones
  FOR EACH ROW EXECUTE FUNCTION update_sales_engine_updated_at();

CREATE TRIGGER trg_lead_scores_updated_at
  BEFORE UPDATE ON lead_scores
  FOR EACH ROW EXECUTE FUNCTION update_sales_engine_updated_at();

CREATE TRIGGER trg_sales_pipeline_updated_at
  BEFORE UPDATE ON sales_pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION update_sales_engine_updated_at();

CREATE TRIGGER trg_msc_tracking_updated_at
  BEFORE UPDATE ON msc_tracking
  FOR EACH ROW EXECUTE FUNCTION update_sales_engine_updated_at();
