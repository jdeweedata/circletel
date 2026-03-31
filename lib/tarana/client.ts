/**
 * Tarana TCS Portal API Client
 * Fetches radio data, network hierarchy, and device metrics
 */

import { getSessionCookies } from './auth';
import {
  TaranaRegion,
  TaranaMarket,
  TaranaSite,
  TaranaRadio,
  TaranaRadioSearchQuery,
  TaranaRadioSearchResponse,
  TaranaDeviceCount,
  TaranaDeviceState,
} from './types';

const TARANA_API_BASE = 'https://portal.tcs.taranawireless.com';

// MTN Operator ID (discovered from portal)
const MTN_OPERATOR_ID = 219;
// South Africa Region IDs
const SA_REGION_IDS = [1073, 1071];

/**
 * Make authenticated API request
 */
// Browser-like base headers required by the TCS portal (Istio gateway validates these)
const TARANA_BASE_HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Referer': 'https://portal.tcs.taranawireless.com/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'X-Caller-Name': 'operator-portal',
};

export async function taranaFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cookies = await getSessionCookies();

  const response = await fetch(`${TARANA_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...TARANA_BASE_HEADERS,
      'Content-Type': 'application/json',
      'Cookie': cookies,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tarana API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get all regions for MTN operator
 */
export async function getTaranaRegions(): Promise<TaranaRegion[]> {
  return taranaFetch<TaranaRegion[]>(
    `/api/tni/v2/operators/${MTN_OPERATOR_ID}/regions`
  );
}

/**
 * Get network hierarchy (regions, markets, sites)
 */
export async function getNetworkHierarchy(): Promise<{
  regions: TaranaRegion[];
  markets: TaranaMarket[];
  sites: TaranaSite[];
}> {
  const data = await taranaFetch<any>(
    `/api/nqs/v1/operators/${MTN_OPERATOR_ID}/network-hierarchy`
  );

  return {
    regions: data.regions || [],
    markets: data.markets || [],
    sites: data.sites || [],
  };
}

/**
 * Search for radios (BN or RN) with filters
 */
export async function searchRadios(
  deviceType: 'BN' | 'RN',
  options: {
    regionIds?: number[];
    marketIds?: number[];
    limit?: number;
    offset?: number;
  } = {}
): Promise<TaranaRadioSearchResponse> {
  const {
    regionIds = SA_REGION_IDS,
    marketIds,
    limit = 5000,
    offset = 0,
  } = options;

  const query: TaranaRadioSearchQuery = {
    deviceType,
    pagination: { offset, limit },
    sort: [{ field: 'deviceId', direction: 'ASC' }],
    conditions: [{
      logicalOperator: 'AND',
      conditions: [{
        type: 'hierarchy',
        conditions: [{
          field: 'regionId',
          operation: 'EXIST',
          values: regionIds,
        }],
      }],
    }],
  };

  // Add market filter if specified
  if (marketIds && marketIds.length > 0) {
    query.conditions![0].conditions.push({
      type: 'hierarchy',
      conditions: [{
        field: 'marketId',
        operation: 'IN',
        values: marketIds,
      }],
    });
  }

  const body = {
    query,
    outputSchema: {
      deviceFields: [
        '/system/install/state/latitude',
        '/system/install/state/longitude',
        '/system/install/state/height',
        '/system/install/state/azimuth',
        '/radios/regulatory/state/band',
        '/system/state/hostname',
        '/system/cloud/history/state/first-seen-timestamp',
      ],
    },
  };

  const response = await taranaFetch<any>(
    '/api/tmq/v1/radios/search',
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );

  // Transform response to our format
  const radios: TaranaRadio[] = (response.radios || []).map((r: any) => ({
    serialNumber: r.serialNumber,
    deviceId: r.deviceId,
    deviceType: r.deviceType,
    regionId: r.regionId,
    regionName: r.regionName,
    marketId: r.marketId,
    marketName: r.marketName,
    siteId: r.siteId,
    siteName: r.siteName,
    cellId: r.cellId,
    cellName: r.cellName,
    sectorId: r.sectorId,
    sectorName: r.sectorName,
    latitude: r.fields?.['/system/install/state/latitude'] || r.latitude,
    longitude: r.fields?.['/system/install/state/longitude'] || r.longitude,
    height: r.fields?.['/system/install/state/height'],
    azimuth: r.fields?.['/system/install/state/azimuth'],
    band: r.fields?.['/radios/regulatory/state/band'] || r.band,
    deviceStatus: r.fields?.['deviceStatus'] ?? r.deviceStatus,
    lastSeen: r.lastSeen,
  }));

  return {
    radios,
    totalCount: response.totalCount || radios.length,
    pagination: response.pagination || { offset, limit },
  };
}

/**
 * Get all Base Nodes (BN) for South Africa
 */
export async function getAllBaseNodes(): Promise<TaranaRadio[]> {
  const result = await searchRadios('BN', { limit: 5000 });
  return result.radios;
}

/**
 * Get all Remote Nodes (RN) for South Africa
 * Paginates through all results since RN fleet may exceed 5,000 devices
 */
export async function getAllRemoteNodes(): Promise<TaranaRadio[]> {
  const limit = 5000;
  let offset = 0;
  const allRadios: TaranaRadio[] = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await searchRadios('RN', { limit, offset });
    allRadios.push(...result.radios);

    // Stop if we got fewer than the limit (last page)
    if (result.radios.length < limit) {
      break;
    }

    offset += limit;
  }

  return allRadios;
}

/**
 * Get full device state for a single device by serial number.
 * Uses the NQS v1 endpoint which returns losRange, txPower, linkState, coordinates, etc.
 */
export async function getDeviceBySerial(serialNumber: string): Promise<TaranaDeviceState> {
  const raw = await taranaFetch<any>(`/api/nqs/v1/devices/${encodeURIComponent(serialNumber)}`);

  const carriers: TaranaDeviceState['carriers'] = Array.isArray(raw.carriers)
    ? raw.carriers.map((c: any) => ({
        id: c.id ?? 0,
        txPower: c.txPower ?? c['tx-power'] ?? undefined,
        rxPower: c.rxPower ?? c['rx-power'] ?? undefined,
        band: c.band ?? undefined,
      }))
    : [];

  return {
    serialNumber: raw.serialNumber ?? serialNumber,
    deviceType: raw.deviceType ?? raw.type ?? 'RN',
    deviceId: raw.deviceId ?? undefined,
    linkState: raw.linkState ?? raw['link-state'] ?? undefined,
    losRange: typeof raw.losRange === 'number' ? raw.losRange : undefined,
    sectorId: raw.sectorId ?? undefined,
    band: raw.band ?? undefined,
    carriers,
    installParams: {
      latitude: raw.installParams?.latitude ?? raw.latitude ?? undefined,
      longitude: raw.installParams?.longitude ?? raw.longitude ?? undefined,
      height: raw.installParams?.height ?? raw.height ?? undefined,
      azimuth: raw.installParams?.azimuth ?? raw.azimuth ?? undefined,
    },
    ancestry: raw.ancestry ?? undefined,
    raw,
  };
}

/**
 * Get BN devices for a given sector ID.
 * Uses TNI v2 endpoint — returns BN install params including lat/lng/height/azimuth.
 */
export async function getBnDevicesForSector(sectorId: number): Promise<TaranaDeviceState[]> {
  const raw = await taranaFetch<any>(
    `/api/tni/v2/sectors/${sectorId}/devices?type=BN`
  );

  const devices: any[] = Array.isArray(raw) ? raw : (raw.devices ?? raw.data ?? []);

  return devices.map((d: any) => ({
    serialNumber: d.serialNumber ?? d.serial_number ?? '',
    deviceType: 'BN' as const,
    deviceId: d.deviceId ?? undefined,
    linkState: d.linkState ?? undefined,
    losRange: undefined,
    sectorId,
    band: d.band ?? undefined,
    carriers: Array.isArray(d.carriers)
      ? d.carriers.map((c: any) => ({
          id: c.id ?? 0,
          txPower: c.txPower ?? undefined,
          rxPower: c.rxPower ?? undefined,
          band: c.band ?? undefined,
        }))
      : [],
    installParams: {
      latitude: d.installParams?.latitude ?? d.latitude ?? undefined,
      longitude: d.installParams?.longitude ?? d.longitude ?? undefined,
      height: d.installParams?.height ?? d.height ?? undefined,
      azimuth: d.installParams?.azimuth ?? d.azimuth ?? undefined,
    },
    ancestry: d.ancestry ?? undefined,
    raw: d,
  }));
}

/**
 * Get device counts by status
 */
export async function getDeviceCounts(): Promise<{
  bn: TaranaDeviceCount;
  rn: TaranaDeviceCount;
}> {
  const response = await taranaFetch<any>(
    '/api/tmq/v5/radios/count',
    {
      method: 'POST',
      body: JSON.stringify({
        query: {
          conditions: [{
            logicalOperator: 'AND',
            conditions: [{
              type: 'hierarchy',
              conditions: [{
                field: 'regionId',
                operation: 'EXIST',
                values: SA_REGION_IDS,
              }],
            }],
          }],
        },
      }),
    }
  );

  return {
    bn: {
      connected: response.bn?.connected || 0,
      disconnected: response.bn?.disconnected || 0,
      spectrumUnassigned: response.bn?.spectrumUnassigned || 0,
      newInstalls30Days: response.bn?.newInstalls || 0,
      total: response.bn?.total || 0,
    },
    rn: {
      connected: response.rn?.connected || 0,
      disconnected: response.rn?.disconnected || 0,
      spectrumUnassigned: response.rn?.spectrumUnassigned || 0,
      newInstalls30Days: response.rn?.newInstalls || 0,
      total: response.rn?.total || 0,
    },
  };
}
