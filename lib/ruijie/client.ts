/**
 * Ruijie Cloud API Client
 * Wraps all API calls with mock mode support
 *
 * Pattern mirrors lib/tarana/client.ts
 *
 * IMPORTANT: Ruijie API uses access_token as query param, NOT Bearer header
 */

import { getAccessToken } from './auth';
import { getMockDevices, getMockDevice, createMockTunnel } from './mock';
import { RuijieDevice, RuijieTunnel } from './types';

const RUIJIE_BASE_URL = process.env.RUIJIE_BASE_URL || 'https://cloud.ruijienetworks.com/service/api';
const MOCK_MODE = process.env.RUIJIE_MOCK_MODE === 'true';

// =============================================================================
// API FETCH HELPER
// =============================================================================

/**
 * Make authenticated API request to Ruijie Cloud
 * Note: Ruijie uses access_token as query param, not Authorization header
 */
async function ruijieFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();

  // Ruijie API uses query param for auth, not header
  const url = new URL(`${RUIJIE_BASE_URL}${endpoint}`);
  url.searchParams.set('access_token', token);

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ruijie API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// =============================================================================
// API RESPONSE TYPES (from Ruijie Cloud API v2.0.3)
// =============================================================================

interface RuijieApiDevice {
  serialNumber: string;
  productClass: string;
  productType: string;
  hardwareVersion: string;
  softwareVersion: string;
  onlineStatus: 'ON' | 'OFF' | 'NEVER_ONLINE';
  offlineReason?: string;
  name: string;
  aliasName: string;
  groupId: number;
  groupName: string;
  timezone: string;
  parentGroupName: string;
  remark: string;
  localIp: string;
  cpeIp: string;
  lastOnline: number;
  createTime: number;
  mac: string;
  confSyncType: string;
  confSyncTypeDesc: string;
  apModeChange?: string;
  apMode?: string;
  devMode?: string;
  commonType: string;
}

interface DeviceListResponse {
  code: number;
  msg?: string;
  deviceList: RuijieApiDevice[];
  totalCount: number;
}

interface DeviceDetailResponse {
  code: number;
  msg?: string;
  groupId: number;
  localIp: string;
  productClass: string;
  productType: string;
  softwareVersion: string;
  onlineStatus: 'ON' | 'OFF' | 'NEVER_ONLINE';
  hardwareVersion: string;
  mac: string;
  serialNumber: string;
  name: string;
}

/**
 * Map Ruijie API device to our internal format
 */
function mapApiDevice(api: RuijieApiDevice): RuijieDevice {
  return {
    sn: api.serialNumber,
    device_name: api.aliasName || api.name || api.serialNumber,
    model: api.productClass,
    group_id: String(api.groupId),
    group_name: api.groupName,
    management_ip: api.localIp,
    wan_ip: api.cpeIp,
    egress_ip: api.cpeIp,
    online_clients: 0, // Not in list response, need separate API
    status: api.onlineStatus === 'ON' ? 'online' : 'offline',
    config_status: api.confSyncType,
    firmware_version: api.softwareVersion,
    mac_address: api.mac,
    cpu_usage: undefined,
    memory_usage: undefined,
    uptime_seconds: undefined,
    radio_2g_channel: undefined,
    radio_5g_channel: undefined,
    radio_2g_utilization: undefined,
    radio_5g_utilization: undefined,
    project_id: String(api.groupId),
    last_seen_at: api.lastOnline ? new Date(api.lastOnline).toISOString() : undefined,
  };
}

// =============================================================================
// DEVICE OPERATIONS
// =============================================================================

/**
 * Get all devices from Ruijie Cloud
 * Endpoint: /service/api/maint/devices (v2.0.3)
 *
 * Note: Requires group_id. We fetch all device types (AP, Switch, Gateway).
 * In production, you may want to get group_id from account info first.
 */
export async function getAllDevices(groupId?: number): Promise<RuijieDevice[]> {
  if (MOCK_MODE) {
    return getMockDevices();
  }

  const devices: RuijieDevice[] = [];
  const deviceTypes = ['AP', 'Switch', 'Gateway'];

  for (const commonType of deviceTypes) {
    try {
      // Pagination: get up to 500 devices per type
      const params = new URLSearchParams({
        common_type: commonType,
        page: '0',
        per_page: '500',
      });
      if (groupId) {
        params.set('group_id', String(groupId));
      }

      const response = await ruijieFetch<DeviceListResponse>(`/maint/devices?${params}`);

      if (response.code === 0 && response.deviceList) {
        devices.push(...response.deviceList.map(mapApiDevice));
      }
    } catch (error) {
      console.error(`Failed to fetch ${commonType} devices:`, error);
    }
  }

  return devices;
}

/**
 * Get single device by serial number
 * Endpoint: /service/api/device/{sn} (v2.0.3)
 */
export async function getDevice(sn: string): Promise<RuijieDevice> {
  if (MOCK_MODE) {
    return getMockDevice(sn);
  }

  const response = await ruijieFetch<DeviceDetailResponse>(`/device/${sn}`);

  if (response.code !== 0) {
    throw new Error(`Device not found: ${response.msg}`);
  }

  return {
    sn: response.serialNumber,
    device_name: response.name || response.serialNumber,
    model: response.productClass,
    group_id: String(response.groupId),
    group_name: undefined,
    management_ip: response.localIp,
    wan_ip: undefined,
    egress_ip: undefined,
    online_clients: 0,
    status: response.onlineStatus === 'ON' ? 'online' : 'offline',
    config_status: undefined,
    firmware_version: response.softwareVersion,
    mac_address: response.mac,
    cpu_usage: undefined,
    memory_usage: undefined,
    uptime_seconds: undefined,
    radio_2g_channel: undefined,
    radio_5g_channel: undefined,
    radio_2g_utilization: undefined,
    radio_5g_utilization: undefined,
    project_id: String(response.groupId),
    last_seen_at: undefined,
  };
}

// =============================================================================
// TUNNEL OPERATIONS
// =============================================================================

/**
 * Create eWeb tunnel for device
 */
export async function createTunnel(
  sn: string,
  type: 'eweb' | 'ssh' | 'webcli' = 'eweb'
): Promise<RuijieTunnel> {
  if (MOCK_MODE) {
    return createMockTunnel(sn, type);
  }

  const response = await ruijieFetch<{ data: RuijieTunnel }>('/tunnel/create', {
    method: 'POST',
    body: JSON.stringify({ sn, type }),
  });
  return response.data;
}

/**
 * Delete/close tunnel for device
 */
export async function deleteTunnel(sn: string): Promise<void> {
  if (MOCK_MODE) {
    return; // No-op in mock mode
  }

  await ruijieFetch(`/tunnel/${sn}`, { method: 'DELETE' });
}

// =============================================================================
// DEVICE CONTROL
// =============================================================================

/**
 * Reboot device remotely
 */
export async function rebootDevice(sn: string): Promise<{ success: boolean }> {
  if (MOCK_MODE) {
    // Simulate slight delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  }

  const response = await ruijieFetch<{ success: boolean }>(`/device/${sn}/reboot`, {
    method: 'POST',
  });
  return response;
}

// =============================================================================
// UTILITY
// =============================================================================

/**
 * Check if mock mode is enabled
 */
export function isMockMode(): boolean {
  return MOCK_MODE;
}
