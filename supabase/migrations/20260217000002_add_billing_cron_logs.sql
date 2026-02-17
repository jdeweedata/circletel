-- Billing cron audit log table
CREATE TABLE IF NOT EXISTS billing_cron_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cron_type TEXT NOT NULL,
  run_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  services_processed INTEGER DEFAULT 0,
  invoices_created INTEGER DEFAULT 0,
  zoho_synced INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  sms_sent INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  skipped INTEGER DEFAULT 0,
  dry_run BOOLEAN DEFAULT FALSE,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying recent runs
CREATE INDEX IF NOT EXISTS idx_billing_cron_logs_run_date
ON billing_cron_logs(run_date DESC);

CREATE INDEX IF NOT EXISTS idx_billing_cron_logs_cron_type
ON billing_cron_logs(cron_type, run_date DESC);

COMMENT ON TABLE billing_cron_logs IS 'Audit log for billing cron jobs';
