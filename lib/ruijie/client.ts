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
// DEVICE METRICS
// =============================================================================

/**
 * Online STA (station/client) response from Ruijie Cloud
 * Endpoint: /logbizagent/logbiz/api/sta/sta_users
 */
interface StaUsersResponse {
  code: number;
  msg?: string;
  list?: Array<{
    mac: string;
    userIp: string;
    ssid: string;
    rssi: string;
    band: string;
    channel: string;
    sn: string; // AP serial number
  }>;
  count?: number;
}

export interface DeviceMetrics {
  cpu_usage: number | null;
  memory_usage: number | null;
  uptime_seconds: number | null;
  online_clients: number;
  radio_2g_channel: number | null;
  radio_5g_channel: number | null;
  radio_2g_utilization: number | null;
  radio_5g_utilization: number | null;
}

/**
 * Get device metrics (client count from STA API)
 *
 * NOTE: Ruijie Cloud API limitations:
 * - CPU/memory metrics are only available at network level, not per-device
 * - Uptime is not exposed via API
 * - Radio channel/utilization requires eWeb tunnel access
 * - Only online_clients can be derived from the STA (station) API
 *
 * Per-device performance data requires direct eWeb tunnel access.
 */
export async function getDeviceMetrics(sn: string, groupId?: string): Promise<DeviceMetrics> {
  const metrics = getEmptyMetrics();

  // Get online client count from STA API
  if (groupId) {
    try {
      const response = await ruijieFetch<StaUsersResponse>(
        '/logbizagent/logbiz/api/sta/sta_users',
        {
          method: 'POST',
          body: JSON.stringify({
            groupId: parseInt(groupId, 10),
            pageIndex: 0,
          }),
        }
      );

      if (response.code === 0 && response.list) {
        // Count clients connected to this specific AP
        metrics.online_clients = response.list.filter(sta => sta.sn === sn).length;
      }
    } catch (error) {
      console.error(`[Ruijie] Failed to fetch STA list for ${sn}:`, error);
    }
  }

  return metrics;
}

function getEmptyMetrics(): DeviceMetrics {
  return {
    cpu_usage: null,
    memory_usage: null,
    uptime_seconds: null,
    online_clients: 0,
    radio_2g_channel: null,
    radio_5g_channel: null,
    radio_2g_utilization: null,
    radio_5g_utilization: null,
  };
}

// =============================================================================
// CONNECTED CLIENTS (STA API)
// =============================================================================

/**
 * Client/Station information from Ruijie STA API
 */
export interface RuijieClient {
  mac: string;
  userIp: string;
  ssid: string;
  rssi: number;
  band: string;
  channel: number;
  sn: string; // AP serial number this client is connected to
  signalQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * Get RSSI quality classification
 * Based on industry standards:
 * - Excellent: > -50 dBm
 * - Good: -50 to -60 dBm
 * - Fair: -60 to -70 dBm
 * - Poor: < -70 dBm
 */
function getSignalQuality(rssi: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (rssi > -50) return 'excellent';
  if (rssi > -60) return 'good';
  if (rssi > -70) return 'fair';
  return 'poor';
}

/**
 * Get connected clients for a specific device
 * Calls the STA (station) API and filters by device serial number
 *
 * @param sn - Device serial number
 * @param groupId - Group ID (required for STA API)
 * @returns Array of connected clients with signal quality
 */
export async function getDeviceClients(sn: string, groupId: string): Promise<RuijieClient[]> {
  if (MOCK_MODE) {
    // Return mock clients for testing
    return [
      {
        mac: '00:1A:2B:3C:4D:5E',
        userIp: '192.168.1.101',
        ssid: 'CircleTel-WiFi',
        rssi: -45,
        band: '5G',
        channel: 36,
        sn,
        signalQuality: 'excellent',
      },
      {
        mac: '00:1A:2B:3C:4D:5F',
        userIp: '192.168.1.102',
        ssid: 'CircleTel-WiFi',
        rssi: -58,
        band: '5G',
        channel: 36,
        sn,
        signalQuality: 'good',
      },
      {
        mac: 'AA:BB:CC:DD:EE:FF',
        userIp: '192.168.1.103',
        ssid: 'CircleTel-Guest',
        rssi: -67,
        band: '2.4G',
        channel: 6,
        sn,
        signalQuality: 'fair',
      },
    ];
  }

  try {
    const response = await ruijieFetch<StaUsersResponse>(
      '/logbizagent/logbiz/api/sta/sta_users',
      {
        method: 'POST',
        body: JSON.stringify({
          groupId: parseInt(groupId, 10),
          pageIndex: 0,
        }),
      }
    );

    if (response.code !== 0 || !response.list) {
      return [];
    }

    // Filter clients connected to this specific AP and transform
    return response.list
      .filter(sta => sta.sn === sn)
      .map(sta => {
        const rssi = parseInt(sta.rssi, 10) || -80;
        return {
          mac: sta.mac,
          userIp: sta.userIp,
          ssid: sta.ssid,
          rssi,
          band: sta.band,
          channel: parseInt(sta.channel, 10) || 0,
          sn: sta.sn,
          signalQuality: getSignalQuality(rssi),
        };
      });
  } catch (error) {
    console.error(`[Ruijie] Failed to fetch clients for ${sn}:`, error);
    return [];
  }
}

// =============================================================================
// DEVICE LOGS (AP Management Logs)
// =============================================================================

/**
 * Log entry from Ruijie AP Management Logs API
 */
export interface RuijieLogEntry {
  id: number;
  sn: string;
  logType: 'reboot' | 'onoffline' | 'config' | string;
  logDetail: string;
  operateTime: number; // timestamp in milliseconds
}

/**
 * API response for device management logs
 */
interface DeviceLogsResponse {
  code: number;
  msg?: string;
  data?: {
    count: number;
    list: Array<{
      id: number;
      sn: string;
      logType: string;
      logDetail: string;
      operateTime: number;
    }>;
  };
}

/**
 * Get AP management logs (reboots, online/offline events, config changes)
 * Endpoint: /service/api/apmgt/apinfo/{sn}/devicemgtlogs
 *
 * @param sn - Device serial number
 * @returns Array of log entries
 */
export async function getDeviceLogs(sn: string): Promise<RuijieLogEntry[]> {
  if (MOCK_MODE) {
    const now = Date.now();
    return [
      {
        id: 1,
        sn,
        logType: 'onoffline',
        logDetail: 'Device online',
        operateTime: now - 1000 * 60 * 30, // 30 min ago
      },
      {
        id: 2,
        sn,
        logType: 'config',
        logDetail: 'Configuration synchronized',
        operateTime: now - 1000 * 60 * 60 * 2, // 2 hours ago
      },
      {
        id: 3,
        sn,
        logType: 'reboot',
        logDetail: 'Device restart',
        operateTime: now - 1000 * 60 * 60 * 24, // 1 day ago
      },
      {
        id: 4,
        sn,
        logType: 'onoffline',
        logDetail: 'Device offline',
        operateTime: now - 1000 * 60 * 60 * 24 - 1000 * 60 * 5, // 1 day + 5 min ago
      },
      {
        id: 5,
        sn,
        logType: 'onoffline',
        logDetail: 'Device online',
        operateTime: now - 1000 * 60 * 60 * 48, // 2 days ago
      },
    ];
  }

  try {
    const response = await ruijieFetch<DeviceLogsResponse>(
      `/apmgt/apinfo/${sn}/devicemgtlogs`
    );

    if (response.code !== 0 || !response.data?.list) {
      console.error(`[Ruijie] Failed to fetch logs for ${sn}:`, response.msg);
      return [];
    }

    return response.data.list.map((log) => ({
      id: log.id,
      sn: log.sn,
      logType: log.logType,
      logDetail: log.logDetail,
      operateTime: log.operateTime,
    }));
  } catch (error) {
    console.error(`[Ruijie] Failed to fetch device logs for ${sn}:`, error);
    return [];
  }
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
// TRAFFIC / BANDWIDTH ANALYTICS
// =============================================================================

/**
 * Traffic data point from Ruijie hourly flow API
 */
export interface TrafficDataPoint {
  timestamp: number;       // Unix timestamp in milliseconds
  timeString: string;      // Human readable: "2021-09-23 03:30:00"
  rxBytes: number;         // Download bytes
  txBytes: number;         // Upload bytes
  rxPkts: number;          // Download packets
  txPkts: number;          // Upload packets
  buildingId: number;      // Group/building ID
}

/**
 * Application flow data from Ruijie App Flow API
 */
export interface AppFlowData {
  appGroupName: string;    // e.g., "Streaming", "Social", "Other"
  appName: string;         // e.g., "TikTok", "YouTube"
  downFlow: number;        // Download bytes
  upFlow: number;          // Upload bytes
  upDownFlow: number;      // Total bytes
}

/**
 * Aggregated traffic summary
 */
export interface TrafficSummary {
  totalRxBytes: number;
  totalTxBytes: number;
  totalBytes: number;
  avgRxRate: number;       // Average download rate in bps
  avgTxRate: number;       // Average upload rate in bps
  peakRxBytes: number;     // Highest hourly download
  peakTxBytes: number;     // Highest hourly upload
  dataPoints: TrafficDataPoint[];
}

/**
 * API response for hourly traffic
 * Endpoint: /logbizagent/logbiz/api/flow/show/hour
 */
interface HourlyTrafficResponse {
  code: number;
  msg?: string;
  count?: number;
  list?: Array<{
    buildingId: number;
    rxBytes: number;
    rxPkts: number;
    txBytes: number;
    txPkts: number;
    timeString: string;
    timeStamp: number;
  }>;
}

/**
 * API response for application flow
 * Endpoint: /logbizagent/logbiz/api/flow/app
 */
interface AppFlowResponse {
  code: number;
  msg?: string;
  totalCount?: number;
  list?: Array<{
    appGroupName: string;
    appName: string;
    downFlow: number;
    upFlow: number;
    upDownFlow: number;
  }>;
}

/**
 * Generate mock traffic data for testing
 */
function generateMockTrafficData(hours: number): TrafficDataPoint[] {
  const now = Date.now();
  const dataPoints: TrafficDataPoint[] = [];

  for (let i = hours; i >= 0; i--) {
    const timestamp = now - (i * 60 * 60 * 1000);
    const date = new Date(timestamp);
    const hour = date.getHours();

    // Simulate realistic traffic patterns (higher during business hours)
    const baseMultiplier = (hour >= 8 && hour <= 18) ? 1.5 : 0.7;
    const randomFactor = 0.8 + Math.random() * 0.4;

    dataPoints.push({
      timestamp,
      timeString: date.toISOString().replace('T', ' ').substring(0, 19),
      rxBytes: Math.floor(50_000_000 * baseMultiplier * randomFactor),  // ~50MB base
      txBytes: Math.floor(15_000_000 * baseMultiplier * randomFactor),  // ~15MB base (asymmetric)
      rxPkts: Math.floor(50000 * baseMultiplier * randomFactor),
      txPkts: Math.floor(15000 * baseMultiplier * randomFactor),
      buildingId: 1,
    });
  }

  return dataPoints;
}

/**
 * Generate mock app flow data for testing
 */
function generateMockAppFlowData(): AppFlowData[] {
  const apps = [
    { appGroupName: 'Streaming', appName: 'YouTube', factor: 0.25 },
    { appGroupName: 'Streaming', appName: 'Netflix', factor: 0.15 },
    { appGroupName: 'Social', appName: 'TikTok', factor: 0.12 },
    { appGroupName: 'Social', appName: 'WhatsApp', factor: 0.08 },
    { appGroupName: 'Social', appName: 'Facebook', factor: 0.07 },
    { appGroupName: 'Work', appName: 'Microsoft Teams', factor: 0.10 },
    { appGroupName: 'Work', appName: 'Google Meet', factor: 0.05 },
    { appGroupName: 'Gaming', appName: 'Steam', factor: 0.08 },
    { appGroupName: 'Other', appName: 'System Updates', factor: 0.06 },
    { appGroupName: 'Other', appName: 'Unknown', factor: 0.04 },
  ];

  const totalTraffic = 500_000_000; // 500MB total

  return apps.map(app => {
    const total = Math.floor(totalTraffic * app.factor);
    const down = Math.floor(total * 0.75); // 75% download
    return {
      appGroupName: app.appGroupName,
      appName: app.appName,
      downFlow: down,
      upFlow: total - down,
      upDownFlow: total,
    };
  });
}

/**
 * Get network-wide traffic data (hourly)
 *
 * @param groupId - Network group ID
 * @param hours - Number of hours of data to fetch (default 24)
 * @returns Traffic summary with data points
 */
export async function getNetworkTraffic(groupId: string, hours: number = 24): Promise<TrafficSummary> {
  if (MOCK_MODE) {
    const dataPoints = generateMockTrafficData(hours);
    return calculateTrafficSummary(dataPoints);
  }

  try {
    const response = await ruijieFetch<HourlyTrafficResponse>(
      '/logbizagent/logbiz/api/flow/show/hour',
      {
        method: 'POST',
        body: JSON.stringify({
          groupId: parseInt(groupId, 10),
        }),
      }
    );

    if (response.code !== 0 || !response.list) {
      console.error(`[Ruijie] Failed to fetch traffic data:`, response.msg);
      return getEmptyTrafficSummary();
    }

    // Filter to requested time range
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    const filteredData = response.list
      .filter(item => item.timeStamp >= cutoffTime)
      .map(item => ({
        timestamp: item.timeStamp,
        timeString: item.timeString,
        rxBytes: item.rxBytes,
        txBytes: item.txBytes,
        rxPkts: item.rxPkts,
        txPkts: item.txPkts,
        buildingId: item.buildingId,
      }));

    return calculateTrafficSummary(filteredData);
  } catch (error) {
    console.error(`[Ruijie] Error fetching network traffic:`, error);
    return getEmptyTrafficSummary();
  }
}

/**
 * Get application flow breakdown
 *
 * @param groupId - Network group ID
 * @returns Array of application flow data
 */
export async function getAppFlow(groupId: string): Promise<AppFlowData[]> {
  if (MOCK_MODE) {
    return generateMockAppFlowData();
  }

  try {
    const response = await ruijieFetch<AppFlowResponse>(
      '/logbizagent/logbiz/api/flow/app',
      {
        method: 'POST',
        body: JSON.stringify({
          groupId: parseInt(groupId, 10),
        }),
      }
    );

    if (response.code !== 0 || !response.list) {
      console.error(`[Ruijie] Failed to fetch app flow data:`, response.msg);
      return [];
    }

    return response.list.map(item => ({
      appGroupName: item.appGroupName,
      appName: item.appName,
      downFlow: item.downFlow,
      upFlow: item.upFlow,
      upDownFlow: item.upDownFlow,
    }));
  } catch (error) {
    console.error(`[Ruijie] Error fetching app flow:`, error);
    return [];
  }
}

/**
 * Calculate traffic summary from data points
 */
function calculateTrafficSummary(dataPoints: TrafficDataPoint[]): TrafficSummary {
  if (dataPoints.length === 0) {
    return getEmptyTrafficSummary();
  }

  let totalRxBytes = 0;
  let totalTxBytes = 0;
  let peakRxBytes = 0;
  let peakTxBytes = 0;

  for (const point of dataPoints) {
    totalRxBytes += point.rxBytes;
    totalTxBytes += point.txBytes;
    if (point.rxBytes > peakRxBytes) peakRxBytes = point.rxBytes;
    if (point.txBytes > peakTxBytes) peakTxBytes = point.txBytes;
  }

  // Calculate average rate (bytes per second)
  const timeSpanSeconds = dataPoints.length * 60 * 60; // hours to seconds
  const avgRxRate = timeSpanSeconds > 0 ? (totalRxBytes * 8) / timeSpanSeconds : 0; // bps
  const avgTxRate = timeSpanSeconds > 0 ? (totalTxBytes * 8) / timeSpanSeconds : 0;

  return {
    totalRxBytes,
    totalTxBytes,
    totalBytes: totalRxBytes + totalTxBytes,
    avgRxRate,
    avgTxRate,
    peakRxBytes,
    peakTxBytes,
    dataPoints: dataPoints.sort((a, b) => a.timestamp - b.timestamp),
  };
}

/**
 * Get empty traffic summary
 */
function getEmptyTrafficSummary(): TrafficSummary {
  return {
    totalRxBytes: 0,
    totalTxBytes: 0,
    totalBytes: 0,
    avgRxRate: 0,
    avgTxRate: 0,
    peakRxBytes: 0,
    peakTxBytes: 0,
    dataPoints: [],
  };
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
