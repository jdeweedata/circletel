/**
 * Tarana TCS Portal API Client
 * Fetches radio data, network hierarchy, and device metrics
 */

import { getAccessToken } from './auth';
import {
  TaranaRegion,
  TaranaMarket,
  TaranaSite,
  TaranaRadio,
  TaranaRadioSearchQuery,
  TaranaRadioSearchResponse,
  TaranaDeviceCount,
} from './types';

const TARANA_API_BASE = 'https://portal.tcs.taranawireless.com';

// MTN Operator ID (discovered from portal)
const MTN_OPERATOR_ID = 219;
// South Africa Region IDs
const SA_REGION_IDS = [1073, 1071];

/**
 * Make authenticated API request
 */
async function taranaFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();

  const response = await fetch(`${TARANA_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
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
        '/connections/connection/system/install/state/latitude',
        '/connections/connection/system/install/state/longitude',
        '/connections/connection/system/install/state/height',
        '/connections/connection/system/install/state/azimuth',
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
    latitude: r.latitude || r.deviceFields?.latitude,
    longitude: r.longitude || r.deviceFields?.longitude,
    height: r.deviceFields?.height,
    azimuth: r.deviceFields?.azimuth,
    band: r.band,
    deviceStatus: r.deviceStatus,
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
