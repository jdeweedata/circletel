# Tarana Portal API Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate the Tarana TCS Portal API to provide real-time base station data for SkyFibre coverage validation, replacing static Excel imports with live API sync.

**Architecture:** Create a Tarana API client that authenticates via AWS Cognito, fetches radio (BN/RN) data from the portal, syncs to `tarana_base_stations` table via cron, and enhances the feasibility page with live device status and proximity data.

**Tech Stack:** Next.js 15, TypeScript, Supabase (PostGIS), AWS Cognito JWT auth, Tarana TCS API v1/v2

---

## Task 1: Create Tarana API Types

**Files:**
- Create: `lib/tarana/types.ts`

**Step 1: Create the types file**

```typescript
/**
 * Tarana TCS Portal API Types
 * Based on API discovery from portal.tcs.taranawireless.com
 */

// Authentication
export interface TaranaAuthRequest {
  username: string;
  password: string;
}

export interface TaranaAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface TaranaUser {
  id: string;
  name: string;
  email: string;
  retailerId: number;
  retailerName: string;
  operatorId: number;
  operatorName: string;
  roleId: number;
  roleName: string;
}

// Network Hierarchy
export interface TaranaRegion {
  id: number;
  name: string;
  operatorId: number;
}

export interface TaranaMarket {
  id: number;
  name: string;
  regionId: number;
}

export interface TaranaSite {
  id: number;
  name: string;
  marketId: number;
  latitude?: number;
  longitude?: number;
}

// Radio/Device Data
export interface TaranaRadioSearchQuery {
  deviceType: 'BN' | 'RN';
  pagination: {
    offset: number;
    limit: number;
  };
  sort?: Array<{
    field: string;
    direction: 'ASC' | 'DESC';
  }>;
  conditions?: Array<{
    logicalOperator: 'AND' | 'OR';
    conditions: Array<{
      type: 'hierarchy' | 'field';
      conditions?: Array<{
        field: string;
        operation: 'EXIST' | 'EQ' | 'IN';
        values: any[];
      }>;
    }>;
  }>;
}

export interface TaranaRadioOutputSchema {
  deviceFields: string[];
}

export interface TaranaRadio {
  serialNumber: string;
  deviceId: string;
  deviceType: 'BN' | 'RN';
  regionId: number;
  regionName: string;
  marketId: number;
  marketName: string;
  siteId: number;
  siteName: string;
  cellId?: number;
  cellName?: string;
  sectorId?: number;
  sectorName?: string;
  latitude: number;
  longitude: number;
  height?: number;
  azimuth?: number;
  band?: string;
  deviceStatus: number; // 1 = connected
  lastSeen?: string;
}

export interface TaranaRadioSearchResponse {
  radios: TaranaRadio[];
  totalCount: number;
  pagination: {
    offset: number;
    limit: number;
  };
}

// Device Counts
export interface TaranaDeviceCount {
  connected: number;
  disconnected: number;
  spectrumUnassigned: number;
  newInstalls30Days: number;
  total: number;
}

// API Error
export interface TaranaApiError {
  code: string;
  message: string;
  details?: any;
}
```

**Step 2: Commit**

```bash
git add lib/tarana/types.ts
git commit -m "feat(tarana): add Tarana Portal API types"
```

---

## Task 2: Create Tarana Authentication Client

**Files:**
- Create: `lib/tarana/auth.ts`

**Step 1: Create the authentication module**

```typescript
/**
 * Tarana TCS Portal Authentication
 * Uses AWS Cognito for JWT-based authentication
 */

import { TaranaAuthResponse, TaranaUser } from './types';

const TARANA_API_BASE = 'https://portal.tcs.taranawireless.com';

// Credentials from environment
const TARANA_USERNAME = process.env.TARANA_USERNAME || '';
const TARANA_PASSWORD = process.env.TARANA_PASSWORD || '';

interface TokenCache {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: TaranaUser | null;
}

let tokenCache: TokenCache | null = null;

/**
 * Authenticate with Tarana Portal and get JWT tokens
 */
export async function authenticateTarana(
  username?: string,
  password?: string
): Promise<TaranaAuthResponse> {
  const user = username || TARANA_USERNAME;
  const pass = password || TARANA_PASSWORD;

  if (!user || !pass) {
    throw new Error('Tarana credentials not configured. Set TARANA_USERNAME and TARANA_PASSWORD environment variables.');
  }

  const response = await fetch(`${TARANA_API_BASE}/api/tcs/v1/user-auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ username: user, password: pass }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tarana authentication failed: ${response.status} - ${error}`);
  }

  const data = await response.json();

  // Cache the tokens
  tokenCache = {
    accessToken: data.accessToken || data.access_token,
    refreshToken: data.refreshToken || data.refresh_token,
    expiresAt: Date.now() + ((data.expiresIn || 3600) * 1000) - 60000, // 1 min buffer
    user: null,
  };

  return {
    accessToken: tokenCache.accessToken,
    refreshToken: tokenCache.refreshToken,
    expiresIn: data.expiresIn || 3600,
    tokenType: data.tokenType || 'Bearer',
  };
}

/**
 * Get valid access token, refreshing if needed
 */
export async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  // Token expired or not cached, re-authenticate
  const auth = await authenticateTarana();
  return auth.accessToken;
}

/**
 * Get current user info
 */
export async function getTaranaUser(): Promise<TaranaUser> {
  const token = await getAccessToken();

  const response = await fetch(`${TARANA_API_BASE}/api/tcs/v1/users`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get user info: ${response.status}`);
  }

  const data = await response.json();

  if (tokenCache) {
    tokenCache.user = data;
  }

  return data;
}

/**
 * Clear cached tokens (for logout or re-auth)
 */
export function clearTaranaAuth(): void {
  tokenCache = null;
}

/**
 * Check if we have valid cached credentials
 */
export function hasTaranaAuth(): boolean {
  return tokenCache !== null && tokenCache.expiresAt > Date.now();
}
```

**Step 2: Commit**

```bash
git add lib/tarana/auth.ts
git commit -m "feat(tarana): add Tarana Portal authentication client"
```

---

## Task 3: Create Tarana API Client

**Files:**
- Create: `lib/tarana/client.ts`

**Step 1: Create the API client**

```typescript
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
```

**Step 2: Commit**

```bash
git add lib/tarana/client.ts
git commit -m "feat(tarana): add Tarana Portal API client for radios and network data"
```

---

## Task 4: Create Tarana Index Export

**Files:**
- Create: `lib/tarana/index.ts`

**Step 1: Create the index file**

```typescript
/**
 * Tarana TCS Portal Integration
 *
 * Provides access to the Tarana wireless portal for:
 * - Base station (BN) locations and status
 * - Remote node (RN) data
 * - Network hierarchy (regions, markets, sites)
 * - Real-time device metrics
 */

export * from './types';
export * from './auth';
export * from './client';
```

**Step 2: Commit**

```bash
git add lib/tarana/index.ts
git commit -m "feat(tarana): add module exports"
```

---

## Task 5: Create Tarana Sync Service

**Files:**
- Create: `lib/tarana/sync-service.ts`

**Step 1: Create the sync service**

```typescript
/**
 * Tarana Base Station Sync Service
 * Syncs BN data from Tarana Portal API to tarana_base_stations table
 */

import { createClient } from '@/lib/supabase/server';
import { getAllBaseNodes } from './client';
import { TaranaRadio } from './types';

export interface SyncResult {
  success: boolean;
  inserted: number;
  updated: number;
  deleted: number;
  errors: string[];
  duration: number;
  syncedAt: string;
}

/**
 * Sync base stations from Tarana API to database
 */
export async function syncBaseStations(options: {
  deleteStale?: boolean;
  dryRun?: boolean;
} = {}): Promise<SyncResult> {
  const { deleteStale = false, dryRun = false } = options;
  const startTime = Date.now();
  const errors: string[] = [];
  let inserted = 0;
  let updated = 0;
  let deleted = 0;

  const supabase = await createClient();

  try {
    // Fetch all BNs from Tarana API
    console.log('[TaranaSync] Fetching base nodes from API...');
    const baseNodes = await getAllBaseNodes();
    console.log(`[TaranaSync] Fetched ${baseNodes.length} base nodes`);

    if (dryRun) {
      console.log('[TaranaSync] DRY RUN - no changes will be made');
      return {
        success: true,
        inserted: baseNodes.length,
        updated: 0,
        deleted: 0,
        errors: [],
        duration: Date.now() - startTime,
        syncedAt: new Date().toISOString(),
      };
    }

    // Get existing serial numbers
    const { data: existing } = await supabase
      .from('tarana_base_stations')
      .select('serial_number');

    const existingSerials = new Set(existing?.map(e => e.serial_number) || []);
    const apiSerials = new Set<string>();

    // Process each base node
    for (const bn of baseNodes) {
      if (!bn.serialNumber || !bn.latitude || !bn.longitude) {
        errors.push(`Skipping BN with missing data: ${bn.serialNumber || 'unknown'}`);
        continue;
      }

      apiSerials.add(bn.serialNumber);

      const record = {
        serial_number: bn.serialNumber,
        hostname: bn.deviceId || bn.serialNumber,
        site_name: bn.siteName || 'Unknown Site',
        active_connections: 0, // Will be updated separately if needed
        market: bn.marketName || 'Unknown',
        lat: bn.latitude,
        lng: bn.longitude,
        region: bn.regionName || 'South Africa',
        last_updated: new Date().toISOString(),
      };

      if (existingSerials.has(bn.serialNumber)) {
        // Update existing
        const { error } = await supabase
          .from('tarana_base_stations')
          .update(record)
          .eq('serial_number', bn.serialNumber);

        if (error) {
          errors.push(`Update failed for ${bn.serialNumber}: ${error.message}`);
        } else {
          updated++;
        }
      } else {
        // Insert new
        const { error } = await supabase
          .from('tarana_base_stations')
          .insert(record);

        if (error) {
          errors.push(`Insert failed for ${bn.serialNumber}: ${error.message}`);
        } else {
          inserted++;
        }
      }
    }

    // Optionally delete stale records
    if (deleteStale) {
      const staleSerials = [...existingSerials].filter(s => !apiSerials.has(s));
      if (staleSerials.length > 0) {
        const { error } = await supabase
          .from('tarana_base_stations')
          .delete()
          .in('serial_number', staleSerials);

        if (error) {
          errors.push(`Delete failed: ${error.message}`);
        } else {
          deleted = staleSerials.length;
        }
      }
    }

    console.log(`[TaranaSync] Complete: ${inserted} inserted, ${updated} updated, ${deleted} deleted`);

    return {
      success: errors.length === 0,
      inserted,
      updated,
      deleted,
      errors,
      duration: Date.now() - startTime,
      syncedAt: new Date().toISOString(),
    };

  } catch (error) {
    console.error('[TaranaSync] Sync failed:', error);
    return {
      success: false,
      inserted,
      updated,
      deleted,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      duration: Date.now() - startTime,
      syncedAt: new Date().toISOString(),
    };
  }
}
```

**Step 2: Commit**

```bash
git add lib/tarana/sync-service.ts
git commit -m "feat(tarana): add sync service for base station data"
```

---

## Task 6: Create Tarana Sync Cron Endpoint

**Files:**
- Create: `app/api/cron/tarana-sync/route.ts`

**Step 1: Create the cron API route**

```typescript
/**
 * Tarana Base Station Sync Cron Job
 *
 * Syncs base station data from Tarana Portal API to database.
 * Run daily at 2:00 AM SAST or on-demand via POST.
 *
 * POST /api/cron/tarana-sync
 * Body: { "dryRun": true } for testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncBaseStations, SyncResult } from '@/lib/tarana/sync-service';
import { cronLogger } from '@/lib/logging';

// Verify cron secret for Vercel Cron
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest): Promise<NextResponse<SyncResult>> {
  try {
    // Verify cron authorization
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      cronLogger.warn('Tarana sync: unauthorized request');
      return NextResponse.json(
        {
          success: false,
          inserted: 0,
          updated: 0,
          deleted: 0,
          errors: ['Unauthorized'],
          duration: 0,
          syncedAt: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // Parse options from body
    let dryRun = false;
    let deleteStale = false;

    try {
      const body = await request.json();
      dryRun = body.dryRun === true;
      deleteStale = body.deleteStale === true;
    } catch {
      // No body or invalid JSON, use defaults
    }

    cronLogger.info('Starting Tarana base station sync', { dryRun, deleteStale });

    const result = await syncBaseStations({ dryRun, deleteStale });

    if (result.success) {
      cronLogger.info('Tarana sync completed successfully', {
        inserted: result.inserted,
        updated: result.updated,
        deleted: result.deleted,
        duration: result.duration,
      });
    } else {
      cronLogger.error('Tarana sync completed with errors', {
        errors: result.errors,
        duration: result.duration,
      });
    }

    return NextResponse.json(result);

  } catch (error) {
    cronLogger.error('Tarana sync failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        success: false,
        inserted: 0,
        updated: 0,
        deleted: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration: 0,
        syncedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET for health check
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/cron/tarana-sync',
    description: 'Tarana base station sync cron job',
    usage: 'POST with optional { "dryRun": true, "deleteStale": true }',
  });
}
```

**Step 2: Update vercel.json to add cron schedule**

Add to `vercel.json` crons array:

```json
{
  "crons": [
    {
      "path": "/api/cron/tarana-sync",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Step 3: Commit**

```bash
git add app/api/cron/tarana-sync/route.ts
git commit -m "feat(tarana): add cron endpoint for base station sync"
```

---

## Task 7: Update Base Station Service with Live API Option

**Files:**
- Modify: `lib/coverage/mtn/base-station-service.ts`

**Step 1: Add live API fallback to checkBaseStationProximity**

Add import at top:
```typescript
import { searchRadios } from '@/lib/tarana/client';
import { hasTaranaAuth } from '@/lib/tarana/auth';
```

Add new function after existing checkBaseStationProximity:

```typescript
/**
 * Check base station proximity using live Tarana API
 * Falls back to database if API is unavailable
 */
export async function checkBaseStationProximityLive(
  coordinates: Coordinates,
  options: { limit?: number; useLiveApi?: boolean } = {}
): Promise<BaseStationProximityResult> {
  const { limit = 5, useLiveApi = false } = options;

  // Try live API if requested and authenticated
  if (useLiveApi && hasTaranaAuth()) {
    try {
      console.log('[BaseStationService] Using live Tarana API');
      const result = await searchRadios('BN', { limit: 100 });

      // Calculate distances and find nearest
      const stationsWithDistance = result.radios
        .filter(bn => bn.latitude && bn.longitude)
        .map(bn => ({
          id: bn.serialNumber,
          serial_number: bn.serialNumber,
          hostname: bn.deviceId,
          site_name: bn.siteName,
          active_connections: 0, // Not available in search
          market: bn.marketName,
          lat: bn.latitude,
          lng: bn.longitude,
          distance_km: calculateDistance(coordinates, { lat: bn.latitude, lng: bn.longitude }),
          device_status: bn.deviceStatus,
        }))
        .sort((a, b) => a.distance_km - b.distance_km)
        .slice(0, limit);

      if (stationsWithDistance.length > 0) {
        return buildProximityResult(coordinates, stationsWithDistance);
      }
    } catch (error) {
      console.error('[BaseStationService] Live API failed, falling back to database:', error);
    }
  }

  // Fall back to database
  return checkBaseStationProximity(coordinates, options);
}

/**
 * Calculate distance between two coordinates in km (Haversine formula)
 */
function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Build proximity result from stations with distance
 */
function buildProximityResult(
  coordinates: Coordinates,
  stations: any[]
): BaseStationProximityResult {
  const nearest = stations[0];

  // Determine coverage confidence based on distance
  let confidence: CoverageConfidence = 'none';
  let requiresElevatedInstall = false;
  let installationNote: string | null = null;

  if (nearest) {
    if (nearest.distance_km <= COVERAGE_THRESHOLD_HIGH) {
      confidence = 'high';
    } else if (nearest.distance_km <= COVERAGE_THRESHOLD_MAX) {
      confidence = 'medium';
      requiresElevatedInstall = true;
      installationNote = 'Elevated installation (10m+) may be required for optimal signal.';
    }
  }

  return {
    hasCoverage: confidence !== 'none',
    confidence,
    requiresElevatedInstall,
    installationNote,
    nearestStation: nearest ? {
      siteName: nearest.site_name,
      hostname: nearest.hostname,
      distanceKm: nearest.distance_km,
      activeConnections: nearest.active_connections,
      market: nearest.market,
    } : null,
    allNearbyStations: stations,
    metadata: {
      checkedAt: new Date().toISOString(),
      coordinatesUsed: coordinates,
      stationsChecked: stations.length,
    },
  };
}
```

**Step 2: Commit**

```bash
git add lib/coverage/mtn/base-station-service.ts
git commit -m "feat(coverage): add live Tarana API option to base station service"
```

---

## Task 8: Update Feasibility Page with Enhanced Tarana Data

**Files:**
- Modify: `app/admin/sales/feasibility/page.tsx`

**Step 1: Update DetailedCoverage type to include Tarana BN proximity**

Find the `DetailedCoverage` interface and update the `tarana` field:

```typescript
interface CoverageDetail {
  available: boolean;
  provider?: string;
  details?: string;
  siteId?: string;
  cellId?: string;
  technology?: string;
  speed?: number;
  confidence?: string;
  // Enhanced Tarana data
  nearestStation?: {
    siteName: string;
    distanceKm: number;
    market: string;
    status?: 'connected' | 'disconnected';
  };
}
```

**Step 2: Update coverage API call to request Tarana proximity data**

In the `checkFeasibility` function, update the aggregate API call to include enhanced options:

```typescript
// Call aggregate coverage API for detailed results
const response = await fetch('/api/coverage/aggregate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    address: address || undefined,
    coordinates: coordinates || undefined,
    providers: ['mtn', 'dfa'],
    serviceTypes: ['fibre', 'uncapped_wireless', '5g', 'fixed_lte', 'lte'],
    includeAlternatives: true,
    // Request enhanced Tarana data
    includeTaranaProximity: true
  })
});
```

**Step 3: Update DetailedCoverageTable to show Tarana BN info**

In the DetailedCoverageTable component, update the Tarana row to show BN proximity:

```typescript
// In the coverageRows definition, update the Tarana entry:
{
  key: 'tarana',
  label: 'Tarana/SkyFibre',
  data: coverage.tarana,
  techFilter: 'skyfibre',
  // Show enhanced details
  renderDetails: (data: CoverageDetail) => {
    if (!data.available) return '—';
    if (data.nearestStation) {
      return `${data.nearestStation.siteName} (${data.nearestStation.distanceKm}km) - ${data.nearestStation.market}`;
    }
    return data.details || 'Available';
  }
},
```

**Step 4: Commit**

```bash
git add app/admin/sales/feasibility/page.tsx
git commit -m "feat(feasibility): display Tarana base station proximity in coverage table"
```

---

## Task 9: Add Environment Variables

**Files:**
- Modify: `.env.example`

**Step 1: Add Tarana credentials to .env.example**

```env
# Tarana Portal API
TARANA_USERNAME=your-email@circletel.co.za
TARANA_PASSWORD=your-password
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add Tarana API environment variables to example"
```

---

## Task 10: Test the Integration

**Step 1: Add credentials to .env.local**

```env
TARANA_USERNAME=mmathabo.setoaba@circletel.co.za
TARANA_PASSWORD=rLa!46Tnk3#m84R
```

**Step 2: Test sync endpoint (dry run)**

```bash
curl -X POST http://localhost:3000/api/cron/tarana-sync \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'
```

Expected: Response with count of stations that would be synced

**Step 3: Test actual sync**

```bash
curl -X POST http://localhost:3000/api/cron/tarana-sync \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}'
```

Expected: Response with inserted/updated counts

**Step 4: Test feasibility page**

1. Navigate to `/admin/sales/feasibility`
2. Enter "20 Krige Street, Stellenbosch"
3. Click "Check Feasibility"
4. Verify Tarana row shows nearest BN site name and distance

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat(tarana): complete Tarana Portal API integration

- Add Tarana API types, auth, and client
- Add sync service and cron endpoint
- Update base station service with live API option
- Enhance feasibility page with BN proximity data

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Summary

| Task | Description | Estimated Time |
|------|-------------|----------------|
| 1 | Create Tarana API types | 10 min |
| 2 | Create authentication client | 15 min |
| 3 | Create API client | 20 min |
| 4 | Create index export | 5 min |
| 5 | Create sync service | 20 min |
| 6 | Create cron endpoint | 15 min |
| 7 | Update base station service | 15 min |
| 8 | Update feasibility page | 20 min |
| 9 | Add environment variables | 5 min |
| 10 | Test integration | 15 min |

**Total Estimated Time:** ~2.5 hours

**Files Created:**
- `lib/tarana/types.ts`
- `lib/tarana/auth.ts`
- `lib/tarana/client.ts`
- `lib/tarana/index.ts`
- `lib/tarana/sync-service.ts`
- `app/api/cron/tarana-sync/route.ts`

**Files Modified:**
- `lib/coverage/mtn/base-station-service.ts`
- `app/admin/sales/feasibility/page.tsx`
- `.env.example`
