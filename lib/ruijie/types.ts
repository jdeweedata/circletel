/**
 * Ruijie Cloud API Types
 * Based on Ruijie Cloud API V2.0.3
 */

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * RuijieDevice - Internal format using snake_case to match DB schema
 * All optional fields may be undefined when fetched from list vs detail APIs
 */
export interface RuijieDevice {
  sn: string;
  device_name: string;
  model: string | undefined;
  group_id: string | undefined;
  group_name: string | undefined;
  management_ip: string | undefined;
  wan_ip: string | undefined;
  egress_ip: string | undefined;
  online_clients: number;
  status: 'online' | 'offline' | 'unknown';
  config_status: string | undefined;
  firmware_version: string | undefined;
  mac_address: string | undefined;
  cpu_usage: number | undefined;
  memory_usage: number | undefined;
  uptime_seconds: number | undefined;
  radio_2g_channel: number | undefined;
  radio_5g_channel: number | undefined;
  radio_2g_utilization: number | undefined;
  radio_5g_utilization: number | undefined;
  project_id: string | undefined;
  last_seen_at: string | undefined;
}

export interface RuijieTunnel {
  tunnel_id: string;
  device_sn: string;
  open_domain_url: string;
  open_ip_url: string;
  expires_at: string;
}

export interface RuijieAuthResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface RuijieApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// SYNC TYPES
// =============================================================================

export interface SyncResult {
  updated: number;
  added: number;
  errors: string[];
}

export interface RuijieAuditEntry {
  id: string;
  adminUserId: string;
  adminName?: string;
  deviceSn: string;
  action: 'reboot' | 'tunnel_create' | 'tunnel_close' | 'refresh';
  actionDetail: Record<string, unknown>;
  ipAddress: string;
  status: 'success' | 'failed';
  errorMessage?: string;
  createdAt: string;
}

// =============================================================================
// DATABASE ROW TYPES (snake_case for Supabase)
// =============================================================================

export interface RuijieDeviceCacheRow {
  sn: string;
  device_name: string;
  model: string | null;
  group_id: string | null;
  group_name: string | null;
  management_ip: string | null;
  wan_ip: string | null;
  egress_ip: string | null;
  online_clients: number;
  status: string;
  config_status: string | null;
  firmware_version: string | null;
  mac_address: string | null;
  cpu_usage: number | null;
  memory_usage: number | null;
  uptime_seconds: number | null;
  radio_2g_channel: number | null;
  radio_5g_channel: number | null;
  radio_2g_utilization: number | null;
  radio_5g_utilization: number | null;
  project_id: string | null;
  last_seen_at: string | null;
  synced_at: string;
  raw_json: Record<string, unknown> | null;
  mock_data: boolean;
  created_at: string;
  updated_at: string;
  // Customer linking (Phase 1 - Task 1.1)
  customer_order_id: string | null;
  corporate_site_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  support_notes: string | null;
  support_notes_updated_at: string | null;
  support_notes_updated_by: string | null;
}

export interface RuijieTunnelRow {
  id: string;
  device_sn: string;
  tunnel_type: string;
  tunnel_url: string | null;
  open_domain_url: string | null;
  open_ip_url: string | null;
  status: string;
  created_at: string;
  expires_at: string;
  created_by: string | null;
  closed_at: string | null;
  closed_by: string | null;
}

export interface RuijieSyncLogRow {
  id: string;
  status: string;
  devices_fetched: number;
  devices_updated: number;
  devices_added: number;
  errors: string[] | null;
  error_message: string | null;
  triggered_by: string;
  triggered_by_user_id: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
}

export interface RuijieAuditLogRow {
  id: string;
  admin_user_id: string;
  device_sn: string | null;
  action: string;
  action_detail: Record<string, unknown> | null;
  ip_address: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}
