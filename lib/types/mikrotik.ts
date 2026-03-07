/**
 * MikroTik Router Management Types
 *
 * Types for the MikroTik router management system.
 * Used across API routes, services, and UI components.
 *
 * @module lib/types/mikrotik
 */

// =============================================================================
// DATABASE TYPES
// =============================================================================

/**
 * Router status values
 */
export type MikrotikRouterStatus = 'online' | 'offline' | 'unknown';

/**
 * Audit action types
 */
export type MikrotikAuditAction =
  | 'router_created'
  | 'router_updated'
  | 'router_deleted'
  | 'wifi_password_changed'
  | 'config_exported'
  | 'config_restored'
  | 'reboot_requested'
  | 'sync_status'
  | 'connection_test';

/**
 * Sync trigger types
 */
export type MikrotikSyncTrigger = 'cron' | 'manual' | 'webhook';

/**
 * Router record from database (without encrypted fields)
 */
export interface MikrotikRouter {
  id: string;
  identity: string;
  serial_number: string | null;
  mac_address: string;
  model: string | null;
  clinic_audit_id: string | null;
  clinic_name: string | null;
  province: string | null;
  management_ip: string;
  pppoe_username: string;
  router_username: string;
  status: MikrotikRouterStatus;
  firmware_version: string | null;
  uptime_seconds: number | null;
  cpu_usage: number | null;
  memory_usage: number | null;
  last_seen_at: string | null;
  wifi_ssid_staff: string | null;
  wifi_ssid_hotspot: string | null;
  synced_at: string | null;
  config_backup_url: string | null;
  config_backup_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/**
 * Router with clinic details (joined)
 */
export interface MikrotikRouterWithClinic extends MikrotikRouter {
  clinic?: {
    id: string;
    clinic_name: string;
    province: string;
    region: string;
    address: string;
  } | null;
}

/**
 * Sync log record
 */
export interface MikrotikSyncLog {
  id: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  routers_checked: number;
  routers_online: number;
  routers_offline: number;
  routers_failed: number;
  error_message: string | null;
  triggered_by: MikrotikSyncTrigger;
  admin_user_id: string | null;
  created_at: string;
}

/**
 * Audit log record
 */
export interface MikrotikAuditLog {
  id: string;
  router_id: string | null;
  admin_user_id: string | null;
  action: MikrotikAuditAction;
  action_detail: Record<string, unknown> | null;
  status: 'success' | 'failed' | 'pending';
  error_message: string | null;
  ip_address: string | null;
  created_at: string;
}

// =============================================================================
// CREATE/UPDATE TYPES
// =============================================================================

/**
 * Input for creating a new router
 */
export interface MikrotikRouterCreate {
  identity: string;
  mac_address: string;
  management_ip: string;
  pppoe_username: string;
  pppoe_password: string;          // Plaintext, encrypted before storage
  router_password: string;         // Plaintext, encrypted before storage
  clinic_audit_id?: string;
  clinic_name?: string;
  province?: string;
  model?: string;
  serial_number?: string;
  router_username?: string;
  wifi_ssid_staff?: string;
  wifi_ssid_hotspot?: string;
  notes?: string;
}

/**
 * Input for updating a router
 */
export interface MikrotikRouterUpdate {
  identity?: string;
  mac_address?: string;
  management_ip?: string;
  pppoe_username?: string;
  pppoe_password?: string;         // Plaintext if changing, encrypted before storage
  router_password?: string;        // Plaintext if changing, encrypted before storage
  clinic_audit_id?: string | null;
  clinic_name?: string;
  province?: string;
  model?: string;
  serial_number?: string;
  router_username?: string;
  wifi_ssid_staff?: string;
  wifi_ssid_hotspot?: string;
  notes?: string;
}

// =============================================================================
// PROXY API TYPES (Communication with Edge Proxy)
// =============================================================================

/**
 * WiFi configuration for a VLAN
 */
export interface MikrotikWifiConfig {
  interface_name: string;
  ssid: string;
  password?: string;               // Only returned when explicitly requested
  security: 'wpa2' | 'wpa3' | 'wpa2-wpa3';
  vlan_id: number;
  band: '2.4ghz' | '5ghz' | 'dual';
  channel: number | 'auto';
  disabled: boolean;
}

/**
 * Network interface status
 */
export interface MikrotikInterface {
  name: string;
  type: 'ether' | 'wlan' | 'bridge' | 'vlan' | 'pppoe' | 'l2tp' | 'other';
  mac_address?: string;
  running: boolean;
  disabled: boolean;
  tx_bytes: number;
  rx_bytes: number;
  tx_packets: number;
  rx_packets: number;
  last_link_up?: string;
}

/**
 * Router status from proxy
 */
export interface MikrotikProxyStatus {
  identity: string;
  model: string;
  serial_number: string;
  version: string;
  uptime: string;
  uptime_seconds: number;
  cpu_load: number;
  cpu_count: number;
  free_memory: number;
  total_memory: number;
  free_hdd_space: number;
  total_hdd_space: number;
  architecture_name: string;
  board_name: string;
}

/**
 * Full router status response
 */
export interface MikrotikStatusResponse {
  status: MikrotikProxyStatus;
  interfaces: MikrotikInterface[];
  wifi_configs: MikrotikWifiConfig[];
  timestamp: string;
}

/**
 * WiFi password update request
 */
export interface MikrotikWifiPasswordUpdate {
  vlan_id: number;
  ssid?: string;
  password: string;
  security?: 'wpa2' | 'wpa3' | 'wpa2-wpa3';
}

/**
 * Config backup response
 */
export interface MikrotikConfigBackup {
  config: string;                  // RouterOS export output
  timestamp: string;
  version: string;
  identity: string;
}

// =============================================================================
// SERVICE TYPES
// =============================================================================

/**
 * Router list filters
 */
export interface MikrotikRouterFilters {
  search?: string;
  status?: MikrotikRouterStatus;
  province?: string;
  clinic_audit_id?: string;
}

/**
 * Sync result
 */
export interface MikrotikSyncResult {
  online: number;
  offline: number;
  failed: number;
  errors: Array<{ router_id: string; identity: string; error: string }>;
  duration_ms: number;
}

/**
 * Connection test result
 */
export interface MikrotikConnectionTestResult {
  success: boolean;
  router_ip: string;
  version?: string;
  identity?: string;
  error?: string;
  latency_ms?: number;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * List routers response
 */
export interface MikrotikRoutersListResponse {
  success: boolean;
  data: {
    routers: MikrotikRouter[];
    total: number;
    filters: {
      provinces: string[];
      models: string[];
    };
  };
  error?: string;
}

/**
 * Single router response
 */
export interface MikrotikRouterResponse {
  success: boolean;
  data?: MikrotikRouterWithClinic;
  error?: string;
}

/**
 * Sync logs response
 */
export interface MikrotikSyncLogsResponse {
  success: boolean;
  data: {
    logs: MikrotikSyncLog[];
    total: number;
  };
  error?: string;
}

/**
 * Generic action response
 */
export interface MikrotikActionResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
}
