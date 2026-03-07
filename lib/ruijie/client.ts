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
// GROUP OPERATIONS
// =============================================================================

interface RuijieGroupNode {
  id: number;
  name: string;
  devicesNum?: number;
  children?: RuijieGroupNode[];
}

interface GroupsResponse {
  code: number;
  msg?: string;
  groupTree: RuijieGroupNode;
}

/**
 * Recursively extract all group IDs from the tree
 */
function extractGroupIds(node: RuijieGroupNode): number[] {
  const ids: number[] = [];
  // Skip the root "dumy" node
  if (node.id && node.name !== 'dumy') {
    ids.push(node.id);
  }
  if (node.children) {
    for (const child of node.children) {
      ids.push(...extractGroupIds(child));
    }
  }
  return ids;
}

/**
 * Get all network groups
 * Endpoint: /service/api/maint/groups
 */
export async function getAllGroups(): Promise<number[]> {
  if (MOCK_MODE) {
    return [1, 2]; // Mock group IDs
  }

  try {
    const response = await ruijieFetch<GroupsResponse>('/maint/groups');
    if (response.code === 0 && response.groupTree) {
      return extractGroupIds(response.groupTree);
    }
  } catch (error) {
    console.error('[Ruijie] Failed to fetch groups:', error);
  }
  return [];
}

// =============================================================================
// DEVICE OPERATIONS
// =============================================================================

/**
 * Get all devices from Ruijie Cloud
 * Fetches from all groups and deduplicates by serial number
 */
export async function getAllDevices(groupId?: number): Promise<RuijieDevice[]> {
  if (MOCK_MODE) {
    return getMockDevices();
  }

  const deviceMap = new Map<string, RuijieDevice>();

  // If specific group provided, fetch from that group only
  const groupIds = groupId ? [groupId] : await getAllGroups();

  if (groupIds.length === 0) {
    console.warn('[Ruijie] No groups found, cannot fetch devices');
    return [];
  }

  // Fetch devices from each group
  for (const gid of groupIds) {
    try {
      const params = new URLSearchParams({
        group_id: String(gid),
        page: '0',
        per_page: '500',
      });

      const response = await ruijieFetch<DeviceListResponse>(`/maint/devices?${params}`);

      if (response.code === 0 && response.deviceList) {
        for (const device of response.deviceList) {
          // Deduplicate by serial number (devices appear in parent and child groups)
          if (!deviceMap.has(device.serialNumber)) {
            deviceMap.set(device.serialNumber, mapApiDevice(device));
          }
        }
      }
    } catch (error) {
      console.error(`[Ruijie] Failed to fetch devices from group ${gid}:`, error);
    }
  }

  return Array.from(deviceMap.values());
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
