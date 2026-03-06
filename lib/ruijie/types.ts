/**
 * Ruijie Cloud API Types
 * Based on Ruijie Cloud API V2.0.3
 */

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface RuijieDevice {
  sn: string;
  deviceName: string;
  model: string;
  groupId: string;
  groupName: string;
  managementIp: string;
  wanIp: string;
  egressIp: string;
  onlineClients: number;
  status: 'online' | 'offline' | 'unknown';
  configStatus: 'Synced' | 'Failed' | 'Pending';
  firmwareVersion: string;
  macAddress: string;
  cpuUsage: number;
  memoryUsage: number;
  uptimeSeconds: number;
  radio2gChannel: number;
  radio5gChannel: number;
  radio2gUtilization: number;
  radio5gUtilization: number;
  projectId: string;
  lastSeenAt: string;
}

export interface RuijieTunnel {
  tunnelId: string;
  deviceSn: string;
  openDomainUrl: string;
  openIpUrl: string;
  expiresAt: string;
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
