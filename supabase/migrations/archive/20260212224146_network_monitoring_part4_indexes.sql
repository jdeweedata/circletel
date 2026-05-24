-- Part 4: Indexes and Triggers (Run Fourth)

-- Incident number generator
CREATE OR REPLACE FUNCTION generate_incident_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(incident_number FROM 'INC-\d{4}-(\d+)') AS INTEGER)), 0) + 1
  INTO seq_num
  FROM outage_incidents
  WHERE incident_number LIKE 'INC-' || year_part || '-%';
  NEW.incident_number := 'INC-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_incident_number ON outage_incidents;
CREATE TRIGGER set_incident_number
  BEFORE INSERT ON outage_incidents
  FOR EACH ROW
  WHEN (NEW.incident_number IS NULL)
  EXECUTE FUNCTION generate_incident_number();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_provider_status_checked ON provider_status_logs(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_status_name_time ON provider_status_logs(provider_name, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_connection_logs_customer ON customer_connection_logs(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connection_logs_session ON customer_connection_logs(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_connection_logs_event ON customer_connection_logs(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outage_status ON outage_incidents(status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_outage_severity ON outage_incidents(severity, status);
CREATE INDEX IF NOT EXISTS idx_sla_violations_customer ON sla_violations(customer_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_sla_violations_period ON sla_violations(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_health_checks_time ON network_health_checks(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_checks_target ON network_health_checks(target, checked_at DESC);

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_outage_incidents_updated_at ON outage_incidents;
CREATE TRIGGER update_outage_incidents_updated_at
  BEFORE UPDATE ON outage_incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sla_definitions_updated_at ON sla_definitions;
CREATE TRIGGER update_sla_definitions_updated_at
  BEFORE UPDATE ON sla_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sla_violations_updated_at ON sla_violations;
CREATE TRIGGER update_sla_violations_updated_at
  BEFORE UPDATE ON sla_violations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for current provider health
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
