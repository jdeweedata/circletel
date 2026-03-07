/**
 * MikroTik Router Management System
 *
 * Tables for managing MikroTik routers deployed at Unjani clinic sites.
 * Integrates with L2TP tunnel network (10.125.0.0/24) via edge proxy.
 *
 * @migration 20260307000001_create_mikrotik_router_management
 */

-- =============================================================================
-- MIKROTIK ROUTERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS mikrotik_routers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  identity TEXT NOT NULL,                    -- e.g., TDX-CIRCL-UNJAN-SOWET-JABULANI-ND-1
  serial_number TEXT UNIQUE,                 -- Router serial number
  mac_address TEXT NOT NULL,                 -- ether1 MAC address
  model TEXT,                                -- e.g., hAP ax3, RB5009

  -- Clinic link
  clinic_audit_id UUID REFERENCES unjani_contract_audits(id) ON DELETE SET NULL,
  clinic_name TEXT,
  province TEXT,

  -- Connection
  management_ip INET NOT NULL,               -- L2TP tunnel IP (10.125.x.x)
  pppoe_username TEXT NOT NULL,              -- e.g., CT-UNJ-015@circletel.co.za
  pppoe_password_encrypted TEXT NOT NULL,    -- AES-256-GCM encrypted
  pppoe_password_iv TEXT NOT NULL,           -- Initialization vector
  pppoe_password_auth_tag TEXT NOT NULL,     -- Authentication tag
  router_username TEXT DEFAULT 'thinkadmin',
  router_password_encrypted TEXT NOT NULL,   -- AES-256-GCM encrypted
  router_password_iv TEXT NOT NULL,          -- Initialization vector
  router_password_auth_tag TEXT NOT NULL,    -- Authentication tag

  -- Status (synced from router)
  status TEXT DEFAULT 'unknown' CHECK (status IN ('online', 'offline', 'unknown')),
  firmware_version TEXT,
  uptime_seconds BIGINT,
  cpu_usage INT CHECK (cpu_usage >= 0 AND cpu_usage <= 100),
  memory_usage INT CHECK (memory_usage >= 0 AND memory_usage <= 100),
  last_seen_at TIMESTAMPTZ,

  -- WiFi config cache
  wifi_ssid_staff TEXT,                      -- VLAN 10 SSID (Clinic Staff)
  wifi_password_staff_encrypted TEXT,        -- AES-256-GCM encrypted
  wifi_password_staff_iv TEXT,
  wifi_password_staff_auth_tag TEXT,
  wifi_ssid_hotspot TEXT,                    -- VLAN 20 SSID (if applicable)

  -- Config backup
  synced_at TIMESTAMPTZ,
  config_backup_url TEXT,                    -- Supabase storage URL
  config_backup_at TIMESTAMPTZ,
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mikrotik_routers_identity ON mikrotik_routers(identity);
CREATE INDEX IF NOT EXISTS idx_mikrotik_routers_clinic_audit_id ON mikrotik_routers(clinic_audit_id);
CREATE INDEX IF NOT EXISTS idx_mikrotik_routers_status ON mikrotik_routers(status);
CREATE INDEX IF NOT EXISTS idx_mikrotik_routers_province ON mikrotik_routers(province);
CREATE INDEX IF NOT EXISTS idx_mikrotik_routers_management_ip ON mikrotik_routers(management_ip);

-- =============================================================================
-- MIKROTIK SYNC LOGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS mikrotik_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INT,
  routers_checked INT DEFAULT 0,
  routers_online INT DEFAULT 0,
  routers_offline INT DEFAULT 0,
  routers_failed INT DEFAULT 0,
  error_message TEXT,
  triggered_by TEXT DEFAULT 'cron' CHECK (triggered_by IN ('cron', 'manual', 'webhook')),
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for recent logs
CREATE INDEX IF NOT EXISTS idx_mikrotik_sync_logs_started_at ON mikrotik_sync_logs(started_at DESC);

-- =============================================================================
-- MIKROTIK AUDIT LOG TABLE (IMMUTABLE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS mikrotik_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  router_id UUID REFERENCES mikrotik_routers(id) ON DELETE CASCADE,
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN (
    'router_created',
    'router_updated',
    'router_deleted',
    'wifi_password_changed',
    'config_exported',
    'config_restored',
    'reboot_requested',
    'sync_status',
    'connection_test'
  )),
  action_detail JSONB,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mikrotik_audit_log_router_id ON mikrotik_audit_log(router_id);
CREATE INDEX IF NOT EXISTS idx_mikrotik_audit_log_action ON mikrotik_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_mikrotik_audit_log_created_at ON mikrotik_audit_log(created_at DESC);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE mikrotik_routers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mikrotik_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mikrotik_audit_log ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for Inngest and API routes)
CREATE POLICY "mikrotik_routers_service_role"
  ON mikrotik_routers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "mikrotik_sync_logs_service_role"
  ON mikrotik_sync_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "mikrotik_audit_log_service_role"
  ON mikrotik_audit_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_mikrotik_routers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mikrotik_routers_updated_at
  BEFORE UPDATE ON mikrotik_routers
  FOR EACH ROW
  EXECUTE FUNCTION update_mikrotik_routers_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE mikrotik_routers IS 'MikroTik routers deployed at Unjani clinic sites';
COMMENT ON TABLE mikrotik_sync_logs IS 'Sync job history for MikroTik router status polling';
COMMENT ON TABLE mikrotik_audit_log IS 'Immutable audit trail for all MikroTik management actions';

COMMENT ON COLUMN mikrotik_routers.identity IS 'Router identity name (e.g., TDX-CIRCL-UNJAN-SOWET-JABULANI-ND-1)';
COMMENT ON COLUMN mikrotik_routers.management_ip IS 'L2TP tunnel IP address in 10.125.x.x range';
COMMENT ON COLUMN mikrotik_routers.pppoe_password_encrypted IS 'AES-256-GCM encrypted PPPoE password';
COMMENT ON COLUMN mikrotik_routers.router_password_encrypted IS 'AES-256-GCM encrypted router admin password';
