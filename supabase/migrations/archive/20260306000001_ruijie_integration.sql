-- =============================================================================
-- RUIJIE CLOUD INTEGRATION SCHEMA
-- Migration: 20260306000001_ruijie_integration.sql
-- =============================================================================

-- Device cache (synced every 5 mins from Ruijie Cloud API)
CREATE TABLE ruijie_device_cache (
  sn TEXT PRIMARY KEY,
  device_name TEXT NOT NULL,
  model TEXT,
  group_id TEXT,
  group_name TEXT,
  management_ip TEXT,
  wan_ip TEXT,
  egress_ip TEXT,
  online_clients INT DEFAULT 0,
  status TEXT DEFAULT 'unknown',
  config_status TEXT,
  firmware_version TEXT,
  mac_address TEXT,
  cpu_usage INT,
  memory_usage INT,
  uptime_seconds BIGINT,
  radio_2g_channel INT,
  radio_5g_channel INT,
  radio_2g_utilization INT,
  radio_5g_utilization INT,
  project_id TEXT,
  last_seen_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT now(),
  raw_json JSONB,
  mock_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Active eWeb tunnels (10 max per tenant, 3-hour expiry)
CREATE TABLE ruijie_tunnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_sn TEXT NOT NULL REFERENCES ruijie_device_cache(sn) ON DELETE CASCADE,
  tunnel_type TEXT DEFAULT 'eweb',
  tunnel_url TEXT,
  open_domain_url TEXT,
  open_ip_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES admin_users(id),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES admin_users(id)
);

-- Sync history (mirrors tarana_sync_logs pattern)
CREATE TABLE ruijie_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL,
  devices_fetched INT DEFAULT 0,
  devices_updated INT DEFAULT 0,
  devices_added INT DEFAULT 0,
  errors TEXT[],
  error_message TEXT,
  triggered_by TEXT DEFAULT 'cron',
  triggered_by_user_id UUID REFERENCES admin_users(id),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INT
);

-- Immutable audit log for device actions
CREATE TABLE ruijie_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id),
  device_sn TEXT,
  action TEXT NOT NULL,
  action_detail JSONB,
  ip_address TEXT,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_ruijie_device_cache_status ON ruijie_device_cache(status);
CREATE INDEX idx_ruijie_device_cache_group ON ruijie_device_cache(group_name);
CREATE INDEX idx_ruijie_device_cache_model ON ruijie_device_cache(model);
CREATE INDEX idx_ruijie_device_cache_synced ON ruijie_device_cache(synced_at);
CREATE INDEX idx_ruijie_tunnels_sn_status ON ruijie_tunnels(device_sn, status);
CREATE INDEX idx_ruijie_tunnels_expires ON ruijie_tunnels(expires_at) WHERE status = 'active';
CREATE INDEX idx_ruijie_audit_log_device ON ruijie_audit_log(device_sn);
CREATE INDEX idx_ruijie_audit_log_admin ON ruijie_audit_log(admin_user_id);
CREATE INDEX idx_ruijie_audit_log_created ON ruijie_audit_log(created_at DESC);

-- =============================================================================
-- TRIGGER (reuse existing update_updated_at_column function)
-- =============================================================================

CREATE TRIGGER update_ruijie_device_cache_updated_at
  BEFORE UPDATE ON ruijie_device_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE ruijie_device_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruijie_tunnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruijie_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruijie_audit_log ENABLE ROW LEVEL SECURITY;

-- Device cache: admin read, service_role write
CREATE POLICY "Admin users can read device cache" ON ruijie_device_cache
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email')
  );

-- Tunnels: admin read/write
CREATE POLICY "Admin users can manage tunnels" ON ruijie_tunnels
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email')
  );

-- Sync logs: admin read
CREATE POLICY "Admin users can read sync logs" ON ruijie_sync_logs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email')
  );

-- Audit log: admin read + insert (immutable - no update/delete)
CREATE POLICY "Admin users can read audit log" ON ruijie_audit_log
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Admin users can insert audit log" ON ruijie_audit_log
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.jwt()->>'email')
  );

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE ruijie_device_cache IS 'Cache of Ruijie Cloud devices, synced every 5 minutes via Inngest';
COMMENT ON TABLE ruijie_tunnels IS 'Active eWeb/SSH tunnels with 3-hour expiry, 10 max per tenant';
COMMENT ON TABLE ruijie_sync_logs IS 'History of device sync operations from Ruijie Cloud API';
COMMENT ON TABLE ruijie_audit_log IS 'Immutable audit trail for device actions (reboot, tunnel, etc)';
