-- Create tarana_sync_logs table for tracking Inngest sync job executions
-- This provides an audit trail of all Tarana base station sync operations

CREATE TABLE IF NOT EXISTS tarana_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  trigger_type TEXT NOT NULL DEFAULT 'cron' CHECK (trigger_type IN ('cron', 'manual')),
  triggered_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,

  -- Sync statistics
  stations_fetched INTEGER DEFAULT 0,
  inserted INTEGER DEFAULT 0,
  updated INTEGER DEFAULT 0,
  deleted INTEGER DEFAULT 0,

  -- Error tracking
  errors JSONB DEFAULT '[]'::jsonb,

  -- Retry tracking
  attempt INTEGER DEFAULT 1,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE tarana_sync_logs IS 'Audit trail for Tarana base station sync operations via Inngest';

-- Index for querying recent sync logs (most common access pattern)
CREATE INDEX idx_tarana_sync_logs_created ON tarana_sync_logs(created_at DESC);

-- Partial index for active/pending syncs (used for concurrency checks)
CREATE INDEX idx_tarana_sync_logs_status ON tarana_sync_logs(status)
  WHERE status IN ('pending', 'running');

-- Enable Row Level Security
ALTER TABLE tarana_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admin users have full access
DROP POLICY IF EXISTS "Admin full access" ON tarana_sync_logs;
CREATE POLICY "Admin full access" ON tarana_sync_logs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Policy: Service role has full access (for Inngest functions)
DROP POLICY IF EXISTS "Service role access" ON tarana_sync_logs;
CREATE POLICY "Service role access" ON tarana_sync_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
