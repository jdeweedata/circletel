-- Migration: Partner Self-Service Feasibility Portal
-- Creates tables for partner feasibility requests with AI assistance

-- ============================================================================
-- TABLE 1: partner_feasibility_requests
-- Purpose: Track partner-submitted feasibility check requests
-- ============================================================================

CREATE TABLE IF NOT EXISTS partner_feasibility_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,

  -- Client Information
  client_company_name TEXT NOT NULL,
  client_contact_name TEXT,
  client_email TEXT,
  client_phone TEXT,

  -- Requirements
  bandwidth_required INTEGER, -- Mbps
  contention TEXT CHECK (contention IN ('best-effort', '10:1', '5:1', '2:1', 'dia')),
  sla_level TEXT CHECK (sla_level IN ('standard', 'premium', 'carrier_grade')),
  failover_required BOOLEAN DEFAULT false,
  contract_term INTEGER DEFAULT 24, -- Months

  -- Request Status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft',           -- Partner is entering data
    'checking',        -- Coverage checks in progress
    'complete',        -- All checks finished
    'quote_generated', -- Quote created
    'expired'          -- Request timed out
  )),

  -- AI Chat History
  chat_history JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE 2: partner_feasibility_sites
-- Purpose: Individual sites within a feasibility request
-- ============================================================================

CREATE TABLE IF NOT EXISTS partner_feasibility_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES partner_feasibility_requests(id) ON DELETE CASCADE,

  -- Location
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,

  -- Coverage Check Status
  coverage_status TEXT DEFAULT 'pending' CHECK (coverage_status IN (
    'pending',   -- Not yet checked
    'checking',  -- In progress
    'complete',  -- Finished
    'failed'     -- Error during check
  )),

  -- Coverage Results (from aggregation service)
  coverage_results JSONB,

  -- Selected Packages
  selected_packages JSONB DEFAULT '[]'::jsonb,

  -- Link to coverage_leads for reusing existing infrastructure
  coverage_lead_id UUID REFERENCES coverage_leads(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE 3: partner_ai_usage
-- Purpose: Track AI usage for billing and analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS partner_ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,

  -- Request Details
  request_type TEXT NOT NULL, -- 'chat', 'extraction', 'recommendation'
  model_used TEXT NOT NULL,   -- 'gemini-2.5-flash'

  -- Token Counts
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,

  -- Performance
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT true,

  -- Optional: Link to request
  request_id UUID REFERENCES partner_feasibility_requests(id) ON DELETE SET NULL,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Partner feasibility requests
CREATE INDEX IF NOT EXISTS idx_pfr_partner
  ON partner_feasibility_requests(partner_id);
CREATE INDEX IF NOT EXISTS idx_pfr_status
  ON partner_feasibility_requests(status);
CREATE INDEX IF NOT EXISTS idx_pfr_created
  ON partner_feasibility_requests(created_at DESC);

-- Partner feasibility sites
CREATE INDEX IF NOT EXISTS idx_pfs_request
  ON partner_feasibility_sites(request_id);
CREATE INDEX IF NOT EXISTS idx_pfs_coverage_status
  ON partner_feasibility_sites(coverage_status);

-- Partner AI usage
CREATE INDEX IF NOT EXISTS idx_pai_partner
  ON partner_ai_usage(partner_id);
CREATE INDEX IF NOT EXISTS idx_pai_created
  ON partner_ai_usage(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE partner_feasibility_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_feasibility_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_ai_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (for idempotency)
DROP POLICY IF EXISTS "partners_own_requests" ON partner_feasibility_requests;
DROP POLICY IF EXISTS "partners_own_sites" ON partner_feasibility_sites;
DROP POLICY IF EXISTS "partners_own_ai_usage" ON partner_ai_usage;
DROP POLICY IF EXISTS "service_role_full_access_requests" ON partner_feasibility_requests;
DROP POLICY IF EXISTS "service_role_full_access_sites" ON partner_feasibility_sites;
DROP POLICY IF EXISTS "service_role_full_access_ai_usage" ON partner_ai_usage;

-- Partner can manage their own requests
CREATE POLICY "partners_own_requests"
  ON partner_feasibility_requests
  FOR ALL
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Partner can manage their own sites (via request)
CREATE POLICY "partners_own_sites"
  ON partner_feasibility_sites
  FOR ALL
  USING (
    request_id IN (
      SELECT id FROM partner_feasibility_requests
      WHERE partner_id IN (
        SELECT id FROM partners WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    request_id IN (
      SELECT id FROM partner_feasibility_requests
      WHERE partner_id IN (
        SELECT id FROM partners WHERE user_id = auth.uid()
      )
    )
  );

-- Partner can view their own AI usage (read-only)
CREATE POLICY "partners_own_ai_usage"
  ON partner_ai_usage
  FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Service role has full access (for API routes)
CREATE POLICY "service_role_full_access_requests"
  ON partner_feasibility_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_full_access_sites"
  ON partner_feasibility_sites
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_full_access_ai_usage"
  ON partner_ai_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

-- Create trigger function if not exists
CREATE OR REPLACE FUNCTION update_partner_feasibility_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to requests table
DROP TRIGGER IF EXISTS tr_partner_feasibility_requests_updated_at
  ON partner_feasibility_requests;

CREATE TRIGGER tr_partner_feasibility_requests_updated_at
  BEFORE UPDATE ON partner_feasibility_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_feasibility_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE partner_feasibility_requests IS
  'Partner-submitted feasibility check requests with AI chat history';

COMMENT ON TABLE partner_feasibility_sites IS
  'Individual sites within a partner feasibility request';

COMMENT ON TABLE partner_ai_usage IS
  'AI usage tracking for partner feasibility assistant';

COMMENT ON COLUMN partner_feasibility_requests.chat_history IS
  'JSONB array: [{role, content, timestamp, extracted_data}]';

COMMENT ON COLUMN partner_feasibility_sites.coverage_results IS
  'JSONB: Coverage check results from aggregation service';

COMMENT ON COLUMN partner_feasibility_sites.selected_packages IS
  'JSONB array: [{package_id, technology, price}]';
