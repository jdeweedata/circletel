-- Migration: Network Monitoring System
-- Created: 2026-02-12
-- Purpose: Foundation for network health tracking, SLA management, and outage visibility
--
-- Tables:
--   - provider_status_logs: Track provider health over time
--   - customer_connection_logs: Per-customer connection events
--   - outage_incidents: Declared outages with RCA
--   - sla_definitions: SLA tier configurations
--   - sla_violations: Breach records for auto-crediting
--   - network_health_checks: Periodic health pings

-- ============================================================================
-- Provider Health Status
-- ============================================================================

CREATE TABLE IF NOT EXISTS provider_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL, -- 'interstellio', 'mtn', 'telkom', 'openserve'
  status TEXT NOT NULL CHECK (status IN ('up', 'degraded', 'down', 'maintenance')),
  latency_ms INTEGER,
  packet_loss_percent DECIMAL(5,2),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_source TEXT DEFAULT 'cron', -- 'cron', 'webhook', 'manual'
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE provider_status_logs IS 'Historical provider health status from periodic checks';
COMMENT ON COLUMN provider_status_logs.provider_name IS 'Provider identifier: interstellio, mtn, telkom, openserve';
COMMENT ON COLUMN provider_status_logs.status IS 'Current status: up, degraded, down, maintenance';

-- ============================================================================
-- Customer Connection Events
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_connection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_service_id UUID REFERENCES customer_services(id) ON DELETE SET NULL,
  session_id TEXT, -- Interstellio session UUID
  event_type TEXT NOT NULL CHECK (event_type IN ('connected', 'disconnected', 'reconnected', 'failed')),
  terminate_cause TEXT, -- From CDR: 'Lost-Carrier', 'User-Request', 'Idle-Timeout', etc.
  ip_address INET,
  nas_ip_address INET,
  session_duration_seconds INTEGER,
  source TEXT DEFAULT 'webhook', -- 'webhook', 'cron', 'api_poll'
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE customer_connection_logs IS 'PPPoE/RADIUS session events per customer';
COMMENT ON COLUMN customer_connection_logs.terminate_cause IS 'RADIUS terminate cause from CDR records';

-- ============================================================================
-- Outage Incidents
-- ============================================================================

CREATE TABLE IF NOT EXISTS outage_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number TEXT UNIQUE, -- INC-2026-0001
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'major', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')) DEFAULT 'investigating',
  affected_providers TEXT[] DEFAULT '{}',
  affected_regions TEXT[] DEFAULT '{}',
  affected_customer_count INTEGER DEFAULT 0,
  root_cause TEXT,
  resolution_notes TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  identified_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_by UUID REFERENCES admin_users(id),
  updated_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE outage_incidents IS 'Declared network outages with timeline and RCA';
COMMENT ON COLUMN outage_incidents.incident_number IS 'Human-readable incident ID: INC-YYYY-NNNN';

-- Generate incident number
CREATE OR REPLACE FUNCTION generate_incident_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(incident_number FROM 'INC-\d{4}-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM outage_incidents
  WHERE incident_number LIKE 'INC-' || year_part || '-%';

  NEW.incident_number := 'INC-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_incident_number
  BEFORE INSERT ON outage_incidents
  FOR EACH ROW
  WHEN (NEW.incident_number IS NULL)
  EXECUTE FUNCTION generate_incident_number();

-- ============================================================================
-- Outage Updates (Timeline)
-- ============================================================================

CREATE TABLE IF NOT EXISTS outage_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES outage_incidents(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  message TEXT NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE outage_updates IS 'Timeline updates for outage incidents';

-- ============================================================================
-- SLA Definitions
-- ============================================================================

CREATE TABLE IF NOT EXISTS sla_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'Standard', 'Business', 'Enterprise'
  description TEXT,
  uptime_target DECIMAL(5,2) NOT NULL, -- 99.50, 99.90, 99.99
  measurement_period TEXT DEFAULT 'monthly', -- 'monthly', 'quarterly', 'annual'
  credit_rate_per_percent DECIMAL(5,2) NOT NULL DEFAULT 5.00, -- % credit per % below target
  max_credit_percent DECIMAL(5,2) DEFAULT 100.00, -- Maximum credit as % of monthly fee
  exclusions TEXT[], -- Scheduled maintenance, force majeure, etc.
  applies_to_package_types TEXT[] DEFAULT '{}', -- 'fibre', 'lte', 'business'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sla_definitions IS 'SLA tier configurations with uptime targets and credit rates';

-- Insert default SLA tiers
INSERT INTO sla_definitions (name, description, uptime_target, credit_rate_per_percent, applies_to_package_types) VALUES
  ('Standard', 'Residential service level', 99.00, 5.00, ARRAY['fibre', 'lte']),
  ('Business', 'Business service level with faster response', 99.50, 10.00, ARRAY['business']),
  ('Enterprise', 'Enterprise SLA with priority support', 99.90, 15.00, ARRAY['enterprise'])
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SLA Violations
-- ============================================================================

CREATE TABLE IF NOT EXISTS sla_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_service_id UUID REFERENCES customer_services(id) ON DELETE SET NULL,
  sla_id UUID NOT NULL REFERENCES sla_definitions(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  uptime_target DECIMAL(5,2) NOT NULL, -- Snapshot from SLA at time of violation
  uptime_achieved DECIMAL(5,2) NOT NULL,
  downtime_minutes INTEGER NOT NULL,
  downtime_incidents INTEGER DEFAULT 0, -- Number of separate outages
  credit_amount DECIMAL(10,2),
  credit_percent DECIMAL(5,2),
  credit_note_id UUID, -- Reference to credit_notes table when applied
  credit_applied BOOLEAN DEFAULT FALSE,
  credit_applied_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_customer_sla_period UNIQUE (customer_id, sla_id, period_start, period_end)
);

COMMENT ON TABLE sla_violations IS 'SLA breach records for automated credit generation';
COMMENT ON COLUMN sla_violations.credit_amount IS 'Calculated credit in ZAR';

-- ============================================================================
-- Network Health Checks (Periodic Pings)
-- ============================================================================

CREATE TABLE IF NOT EXISTS network_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type TEXT NOT NULL, -- 'provider_api', 'dns', 'gateway', 'service'
  target TEXT NOT NULL, -- URL, IP, or service name
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'timeout')),
  response_time_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

COMMENT ON TABLE network_health_checks IS 'Results from periodic health check pings';

-- Partition by month for performance (optional, can enable later)
-- CREATE TABLE network_health_checks_2026_02 PARTITION OF network_health_checks
--   FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- ============================================================================
-- Customer SLA Summary View
-- ============================================================================

CREATE OR REPLACE VIEW customer_sla_summary AS
SELECT
  c.id AS customer_id,
  c.full_name,
  c.account_number,
  sd.name AS sla_tier,
  sd.uptime_target,
  COALESCE(
    (SELECT AVG(uptime_achieved)
     FROM sla_violations sv
     WHERE sv.customer_id = c.id
     AND sv.period_start >= DATE_TRUNC('year', NOW())),
    sd.uptime_target
  ) AS avg_uptime_ytd,
  COALESCE(
    (SELECT SUM(credit_amount)
     FROM sla_violations sv
     WHERE sv.customer_id = c.id
     AND sv.credit_applied = TRUE
     AND sv.period_start >= DATE_TRUNC('year', NOW())),
    0
  ) AS total_credits_ytd,
  (SELECT COUNT(*)
   FROM sla_violations sv
   WHERE sv.customer_id = c.id
   AND sv.period_start >= DATE_TRUNC('year', NOW())) AS violations_ytd
FROM customers c
LEFT JOIN customer_services cs ON cs.customer_id = c.id AND cs.status = 'active'
LEFT JOIN sla_definitions sd ON sd.applies_to_package_types && ARRAY[cs.service_type]
WHERE c.status = 'active';

COMMENT ON VIEW customer_sla_summary IS 'Customer SLA performance summary for dashboard';

-- ============================================================================
-- Provider Health Summary View
-- ============================================================================

CREATE OR REPLACE VIEW provider_health_current AS
SELECT DISTINCT ON (provider_name)
  provider_name,
  status,
  latency_ms,
  packet_loss_percent,
  checked_at,
  CASE
    WHEN status = 'up' THEN 'healthy'
    WHEN status = 'degraded' THEN 'warning'
    WHEN status = 'maintenance' THEN 'info'
    ELSE 'critical'
  END AS health_level
FROM provider_status_logs
ORDER BY provider_name, checked_at DESC;

COMMENT ON VIEW provider_health_current IS 'Latest health status per provider';

-- ============================================================================
-- Indexes
-- ============================================================================

-- Provider status - time-series queries
CREATE INDEX idx_provider_status_checked ON provider_status_logs(checked_at DESC);
CREATE INDEX idx_provider_status_name_time ON provider_status_logs(provider_name, checked_at DESC);

-- Connection logs - customer queries
CREATE INDEX idx_connection_logs_customer ON customer_connection_logs(customer_id, created_at DESC);
CREATE INDEX idx_connection_logs_session ON customer_connection_logs(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_connection_logs_event ON customer_connection_logs(event_type, created_at DESC);

-- Outages - status queries
CREATE INDEX idx_outage_status ON outage_incidents(status, started_at DESC);
CREATE INDEX idx_outage_severity ON outage_incidents(severity, status);
CREATE INDEX idx_outage_dates ON outage_incidents(started_at DESC, resolved_at);

-- SLA violations - reporting
CREATE INDEX idx_sla_violations_customer ON sla_violations(customer_id, period_start DESC);
CREATE INDEX idx_sla_violations_period ON sla_violations(period_start, period_end);
CREATE INDEX idx_sla_violations_pending ON sla_violations(credit_applied, created_at) WHERE credit_applied = FALSE;

-- Health checks - time-series
CREATE INDEX idx_health_checks_time ON network_health_checks(checked_at DESC);
CREATE INDEX idx_health_checks_target ON network_health_checks(target, checked_at DESC);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Provider status - admin only
ALTER TABLE provider_status_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read provider status" ON provider_status_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Connection logs - customer can see own, admin can see all
ALTER TABLE customer_connection_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read own connection logs" ON customer_connection_logs
  FOR SELECT TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admin read all connection logs" ON customer_connection_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Outages - public read, admin write
ALTER TABLE outage_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read outages" ON outage_incidents
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "Admin manage outages" ON outage_incidents
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Outage updates - public read, admin write
ALTER TABLE outage_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read outage updates" ON outage_updates
  FOR SELECT TO authenticated
  USING (is_public = TRUE);

CREATE POLICY "Admin manage outage updates" ON outage_updates
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE auth_user_id = auth.uid()
    )
  );

-- SLA definitions - public read
ALTER TABLE sla_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read SLA definitions" ON sla_definitions
  FOR SELECT TO authenticated
  USING (is_active = TRUE);

-- SLA violations - customer can see own, admin can see all
ALTER TABLE sla_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read own SLA violations" ON sla_violations
  FOR SELECT TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admin manage SLA violations" ON sla_violations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Health checks - admin only
ALTER TABLE network_health_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read health checks" ON network_health_checks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

CREATE TRIGGER update_outage_incidents_updated_at
  BEFORE UPDATE ON outage_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sla_definitions_updated_at
  BEFORE UPDATE ON sla_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sla_violations_updated_at
  BEFORE UPDATE ON sla_violations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
