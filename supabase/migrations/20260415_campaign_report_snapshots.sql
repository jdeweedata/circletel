-- Campaign report daily snapshots
-- Stores one row per report date with aggregated WhatsApp lead metrics

CREATE TABLE IF NOT EXISTS campaign_report_snapshots (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date           date UNIQUE NOT NULL,
  generated_at          timestamptz NOT NULL DEFAULT now(),
  new_leads_today       int NOT NULL DEFAULT 0,
  cumulative_leads      int NOT NULL DEFAULT 0,
  open_tickets          int NOT NULL DEFAULT 0,
  closed_tickets        int NOT NULL DEFAULT 0,
  unassigned_tickets    int NOT NULL DEFAULT 0,
  conversion_rate       numeric(5,2) NOT NULL DEFAULT 0,
  avg_first_response_ms bigint,
  agent_breakdown       jsonb NOT NULL DEFAULT '{}',
  conversions_today     int NOT NULL DEFAULT 0,
  pipeline_breakdown    jsonb NOT NULL DEFAULT '{}',
  raw_snapshot          jsonb
);
