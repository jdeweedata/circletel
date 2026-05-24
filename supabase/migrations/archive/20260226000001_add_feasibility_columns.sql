-- Migration: Add feasibility columns to coverage_leads
-- Enables async coverage checks with requirements and results persistence

-- Requirements column: stores speed/budget/contention preferences
ALTER TABLE coverage_leads ADD COLUMN IF NOT EXISTS
  requirements JSONB DEFAULT '{}';

-- Coverage results column: persisted provider check results
ALTER TABLE coverage_leads ADD COLUMN IF NOT EXISTS
  coverage_results JSONB DEFAULT '[]';

-- Coverage check status for async tracking
ALTER TABLE coverage_leads ADD COLUMN IF NOT EXISTS
  coverage_check_status VARCHAR(20) DEFAULT 'pending';

-- Add check constraint for valid statuses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'coverage_leads_check_status_check'
  ) THEN
    ALTER TABLE coverage_leads ADD CONSTRAINT coverage_leads_check_status_check
    CHECK (coverage_check_status IN ('pending', 'checking', 'complete', 'failed'));
  END IF;
END $$;

-- Index for filtering by check status
CREATE INDEX IF NOT EXISTS idx_coverage_leads_check_status
ON coverage_leads(coverage_check_status);

-- Index for finding stuck/old checks
CREATE INDEX IF NOT EXISTS idx_coverage_leads_check_status_updated
ON coverage_leads(coverage_check_status, updated_at)
WHERE coverage_check_status IN ('pending', 'checking');

-- Comment for documentation
COMMENT ON COLUMN coverage_leads.requirements IS 'JSONB: {bandwidth_mbps, budget_max, contention, failover_needed, sla_required}';
COMMENT ON COLUMN coverage_leads.coverage_results IS 'JSONB array: [{technology, provider, is_feasible, confidence, checked_at}]';
COMMENT ON COLUMN coverage_leads.coverage_check_status IS 'Async check status: pending, checking, complete, failed';
