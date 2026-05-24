-- =============================================================================
-- DEVICE HEALTH TRACKING FOR PROACTIVE MONITORING
-- Migration: 20260308000003_device_health_tracking.sql
-- Task 3.1: Proactive Monitoring System
-- =============================================================================

-- Device health snapshots (captured after each sync)
CREATE TABLE IF NOT EXISTS device_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_sn TEXT NOT NULL REFERENCES ruijie_device_cache(sn) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metrics from device
  online_clients INTEGER,
  status TEXT, -- online/offline
  cpu_usage INTEGER,
  memory_usage INTEGER,

  -- Derived health indicators
  health_score INTEGER, -- 0-100
  anomaly_detected BOOLEAN DEFAULT FALSE,
  anomaly_type TEXT, -- client_spike, client_drop, offline_flap, etc.

  -- Unique constraint on device + time
  CONSTRAINT device_health_snapshots_device_sn_captured_at_key UNIQUE (device_sn, captured_at)
);

-- Indexes for efficient queries
CREATE INDEX idx_device_health_snapshots_device ON device_health_snapshots(device_sn);
CREATE INDEX idx_device_health_snapshots_time ON device_health_snapshots(captured_at DESC);
CREATE INDEX idx_device_health_snapshots_anomaly ON device_health_snapshots(anomaly_detected) WHERE anomaly_detected = true;
CREATE INDEX idx_device_health_snapshots_device_time ON device_health_snapshots(device_sn, captured_at DESC);

-- Network health alerts table
CREATE TABLE IF NOT EXISTS network_health_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_sn TEXT NOT NULL REFERENCES ruijie_device_cache(sn) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- client_spike, client_drop, offline_flap, low_health_score
  severity TEXT NOT NULL DEFAULT 'warning', -- info, warning, critical
  message TEXT NOT NULL,
  metadata JSONB,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES admin_users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for alerts
CREATE INDEX idx_network_health_alerts_device ON network_health_alerts(device_sn);
CREATE INDEX idx_network_health_alerts_unack ON network_health_alerts(acknowledged) WHERE acknowledged = false;
CREATE INDEX idx_network_health_alerts_created ON network_health_alerts(created_at DESC);
CREATE INDEX idx_network_health_alerts_severity ON network_health_alerts(severity);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE device_health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_health_alerts ENABLE ROW LEVEL SECURITY;

-- Health snapshots: admin read, service_role write
CREATE POLICY "Admin users can read health snapshots" ON device_health_snapshots
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email')
  );

-- Alerts: admin read/write
CREATE POLICY "Admin users can manage health alerts" ON network_health_alerts
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email')
  );

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE device_health_snapshots IS 'Point-in-time health metrics for devices, captured after each sync';
COMMENT ON COLUMN device_health_snapshots.health_score IS 'Calculated health score 0-100 based on stability and metrics';
COMMENT ON COLUMN device_health_snapshots.anomaly_type IS 'Type of anomaly: client_spike, client_drop, offline_flap, high_resource';
COMMENT ON TABLE network_health_alerts IS 'Proactive alerts for device health issues';
COMMENT ON COLUMN network_health_alerts.alert_type IS 'Alert category: client_spike, client_drop, offline_flap, low_health_score';
COMMENT ON COLUMN network_health_alerts.severity IS 'Alert severity: info, warning, critical';
