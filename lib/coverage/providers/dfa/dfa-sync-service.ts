/**
 * DFA (Dark Fibre Africa) Building Sync Service
 *
 * Fetches all buildings from DFA public ArcGIS FeatureServer and caches them in Supabase.
 * Pattern: Mirrors tarana-sync approach with step-based Inngest integration.
 *
 * Data Sources:
 * - FeatureServer/2: Connected buildings (active fiber)
 * - FeatureServer/1: Near-net buildings (within 200m of fiber)
 *
 * @see https://dfafrica.maps.arcgis.com
 */

import axios from 'axios';
import { createClient } from '@/lib/supabase/server';
import {
  DFAConnectedBuilding,
  DFANearNetBuilding,
  ArcGISQueryResponse,
} from './types';
import { calculatePolygonCentroid } from './coordinate-utils';

// =============================================================================
// CONFIGURATION
// =============================================================================

const DFA_API_BASE =
  'https://utility.arcgis.com/usrsvcs/servers/044304ebfe2140b18e6e50d1af16e9e0/rest/services/Hosted/PublicCoverage/FeatureServer';

const PAGE_SIZE = 2000;
const MAX_RETRIES = 3;
const TIMEOUT_MS = 30000;

// =============================================================================
// TYPES
// =============================================================================

export interface DFASyncResult {
  success: boolean;
  connectedCount: number;
  nearNetCount: number;
  recordsInserted: number;
  recordsUpdated: number;
  errors: string[];
  durationMs: number;
}

export interface DFABuildingRecord {
  object_id: number;
  building_id: string | null;
  building_name: string | null;
  street_address: string | null;
  latitude: number;
  longitude: number;
  coverage_type: 'connected' | 'near-net';
  ftth: string | null;
  broadband: string | null;
  precinct: string | null;
  promotion: string | null;
  property_owner: string | null;
  last_synced_at: string;
}

// =============================================================================
// DFA SYNC SERVICE
// =============================================================================

export class DFASyncService {
  /**
   * Fetch all connected buildings from DFA API
   * These are buildings with active fiber connections
   */
  async fetchConnectedBuildings(): Promise<DFAConnectedBuilding[]> {
    const allBuildings: DFAConnectedBuilding[] = [];
    let offset = 0;
    let hasMore = true;

    console.log('[DFASync] Fetching connected buildings...');

    while (hasMore) {
      const params = new URLSearchParams({
        f: 'json',
        returnGeometry: 'true',
        spatialRel: 'esriSpatialRelIntersects',
        where: "dfa_connected_y_n='Yes'",
        outFields:
          'objectid,dfa_building_id,longitude,latitude,dfa_connected_y_n,ftth,broadband,precinct,promotion',
        outSR: '4326',
        resultOffset: offset.toString(),
        resultRecordCount: PAGE_SIZE.toString(),
      });

      let retries = 0;
      let success = false;

      while (!success && retries < MAX_RETRIES) {
        try {
          const response = await axios.get<
            ArcGISQueryResponse<DFAConnectedBuilding>
          >(`${DFA_API_BASE}/2/query`, {
            params,
            timeout: TIMEOUT_MS,
          });

          if (response.data.features) {
            const buildings = response.data.features.map((f) => {
              const result = { ...f.attributes };
              // Derive lat/lng from polygon centroid when attribute fields are null
              if (
                (!result.latitude || !result.longitude) &&
                f.geometry?.rings &&
                f.geometry.rings.length > 0
              ) {
                const centroid = calculatePolygonCentroid(f.geometry.rings);
                result.latitude = centroid.latitude;
                result.longitude = centroid.longitude;
              }
              return result;
            });

            allBuildings.push(...buildings);

            // Check if there are more results
            // exceededTransferLimit=true means MORE records exist, so continue
            hasMore =
              response.data.features.length === PAGE_SIZE ||
              response.data.exceededTransferLimit === true;
            offset += PAGE_SIZE;

            console.log(`[DFASync] Connected: fetched ${allBuildings.length} buildings (offset ${offset})...`);
          } else {
            hasMore = false;
          }

          success = true;
        } catch (error) {
          retries++;
          console.warn(
            `[DFASync] Retry ${retries}/${MAX_RETRIES} for connected buildings at offset ${offset}:`,
            error
          );

          if (retries >= MAX_RETRIES) {
            throw new Error(
              `Failed to fetch connected buildings after ${MAX_RETRIES} retries`
            );
          }

          // Wait before retry
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, retries))
          );
        }
      }
    }

    console.log(
      `[DFASync] Fetched ${allBuildings.length} connected buildings`
    );
    return allBuildings;
  }

  /**
   * Fetch all near-net buildings from DFA API
   * These are buildings within ~200m of existing fiber
   */
  async fetchNearNetBuildings(): Promise<DFANearNetBuilding[]> {
    const allBuildings: DFANearNetBuilding[] = [];
    let offset = 0;
    let hasMore = true;

    console.log('[DFASync] Fetching near-net buildings...');

    while (hasMore) {
      const params = new URLSearchParams({
        f: 'json',
        returnGeometry: 'true',
        spatialRel: 'esriSpatialRelIntersects',
        where: '1=1',
        outFields:
          'objectid,dfa_building_id,building_name,street_address,latitude,longitude,promotion,precinct,ftth,broadband',
        outSR: '4326',
        resultOffset: offset.toString(),
        resultRecordCount: PAGE_SIZE.toString(),
      });

      let retries = 0;
      let success = false;

      while (!success && retries < MAX_RETRIES) {
        try {
          const response = await axios.get<
            ArcGISQueryResponse<DFANearNetBuilding>
          >(`${DFA_API_BASE}/1/query`, {
            params,
            timeout: TIMEOUT_MS,
          });

          if (response.data.features) {
            const buildings = response.data.features.map((f) => {
              const result = { ...f.attributes };
              // Derive lat/lng from polygon centroid when attribute fields are null
              if (
                (!result.latitude || !result.longitude) &&
                f.geometry?.rings &&
                f.geometry.rings.length > 0
              ) {
                const centroid = calculatePolygonCentroid(f.geometry.rings);
                result.latitude = centroid.latitude;
                result.longitude = centroid.longitude;
              }
              return result;
            });

            allBuildings.push(...buildings);

            // exceededTransferLimit=true means MORE records exist, so continue
            hasMore =
              response.data.features.length === PAGE_SIZE ||
              response.data.exceededTransferLimit === true;
            offset += PAGE_SIZE;

            console.log(`[DFASync] Near-net: fetched ${allBuildings.length} buildings (offset ${offset})...`);
          } else {
            hasMore = false;
          }

          success = true;
        } catch (error) {
          retries++;
          console.warn(
            `[DFASync] Retry ${retries}/${MAX_RETRIES} for near-net buildings at offset ${offset}:`,
            error
          );

          if (retries >= MAX_RETRIES) {
            throw new Error(
              `Failed to fetch near-net buildings after ${MAX_RETRIES} retries`
            );
          }

          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, retries))
          );
        }
      }
    }

    console.log(`[DFASync] Fetched ${allBuildings.length} near-net buildings`);
    return allBuildings;
  }

  /**
   * Transform DFA connected building to database record
   */
  transformConnectedBuilding(
    building: DFAConnectedBuilding
  ): DFABuildingRecord | null {
    if (!building.latitude || !building.longitude) {
      return null;
    }

    return {
      object_id: building.objectid,
      building_id: building.dfa_building_id || null,
      building_name: building.building_name || null,
      street_address: building.street_address || null,
      latitude: building.latitude,
      longitude: building.longitude,
      coverage_type: 'connected',
      ftth: building.ftth || null,
      broadband: building.broadband || null,
      precinct: building.precinct || null,
      promotion: building.promotion || null,
      property_owner: null,
      last_synced_at: new Date().toISOString(),
    };
  }

  /**
   * Transform DFA near-net building to database record
   */
  transformNearNetBuilding(
    building: DFANearNetBuilding
  ): DFABuildingRecord | null {
    if (!building.latitude || !building.longitude) {
      return null;
    }

    return {
      object_id: building.objectid,
      building_id: building.dfa_building_id || null,
      building_name: building.building_name || null,
      street_address: building.street_address || null,
      latitude: building.latitude,
      longitude: building.longitude,
      coverage_type: 'near-net',
      ftth: building.ftth || null,
      broadband: building.broadband || null,
      precinct: building.precinct || null,
      promotion: building.promotion || null,
      property_owner: null,
      last_synced_at: new Date().toISOString(),
    };
  }

  /**
   * Upsert buildings to database
   * Uses ON CONFLICT to update existing records
   */
  async upsertBuildings(
    buildings: DFABuildingRecord[]
  ): Promise<{ inserted: number; updated: number; errors: string[] }> {
    const supabase = await createClient();
    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];

    // Get existing records to determine insert vs update
    const { data: existing, error: fetchError } = await supabase
      .from('dfa_buildings')
      .select('object_id, coverage_type');

    if (fetchError) {
      throw new Error(`Failed to fetch existing records: ${fetchError.message}`);
    }

    const existingKeys = new Set(
      (existing || []).map((e) => `${e.object_id}-${e.coverage_type}`)
    );

    // Process in batches of 100
    const BATCH_SIZE = 100;

    for (let i = 0; i < buildings.length; i += BATCH_SIZE) {
      const batch = buildings.slice(i, i + BATCH_SIZE);

      const { error } = await supabase.from('dfa_buildings').upsert(batch, {
        onConflict: 'object_id,coverage_type',
        ignoreDuplicates: false,
      });

      if (error) {
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE)}: ${error.message}`);
        continue;
      }

      // Count inserts vs updates
      for (const building of batch) {
        const key = `${building.object_id}-${building.coverage_type}`;
        if (existingKeys.has(key)) {
          updated++;
        } else {
          inserted++;
        }
      }
    }

    return { inserted, updated, errors };
  }

  /**
   * Run full sync: fetch from API and upsert to database
   */
  async sync(options?: {
    connectedOnly?: boolean;
    nearNetOnly?: boolean;
    dryRun?: boolean;
  }): Promise<DFASyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    let connectedBuildings: DFAConnectedBuilding[] = [];
    let nearNetBuildings: DFANearNetBuilding[] = [];

    try {
      // Fetch buildings
      if (!options?.nearNetOnly) {
        connectedBuildings = await this.fetchConnectedBuildings();
      }

      if (!options?.connectedOnly) {
        nearNetBuildings = await this.fetchNearNetBuildings();
      }

      // Transform to database records
      const connectedRecords = connectedBuildings
        .map((b) => this.transformConnectedBuilding(b))
        .filter((r): r is DFABuildingRecord => r !== null);

      const nearNetRecords = nearNetBuildings
        .map((b) => this.transformNearNetBuilding(b))
        .filter((r): r is DFABuildingRecord => r !== null);

      const allRecords = [...connectedRecords, ...nearNetRecords];

      console.log(
        `[DFASync] Transformed ${connectedRecords.length} connected, ${nearNetRecords.length} near-net records`
      );

      // Dry run - return without database changes
      if (options?.dryRun) {
        return {
          success: true,
          connectedCount: connectedRecords.length,
          nearNetCount: nearNetRecords.length,
          recordsInserted: 0,
          recordsUpdated: 0,
          errors,
          durationMs: Date.now() - startTime,
        };
      }

      // Upsert to database
      const { inserted, updated, errors: upsertErrors } =
        await this.upsertBuildings(allRecords);

      errors.push(...upsertErrors);

      return {
        success: errors.length === 0,
        connectedCount: connectedRecords.length,
        nearNetCount: nearNetRecords.length,
        recordsInserted: inserted,
        recordsUpdated: updated,
        errors,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);

      return {
        success: false,
        connectedCount: connectedBuildings.length,
        nearNetCount: nearNetBuildings.length,
        recordsInserted: 0,
        recordsUpdated: 0,
        errors,
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Get distinct precincts from synced data
   */
  async getPrecincts(): Promise<{ name: string; count: number }[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('dfa_buildings')
      .select('precinct')
      .not('precinct', 'is', null);

    if (error) {
      throw new Error(`Failed to fetch precincts: ${error.message}`);
    }

    // Count by precinct
    const counts = new Map<string, number>();
    for (const row of data || []) {
      if (row.precinct) {
        counts.set(row.precinct, (counts.get(row.precinct) || 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<{
    healthy: boolean;
    connectedLayer: boolean;
    nearNetLayer: boolean;
    responseTime: number;
  }> {
    const startTime = Date.now();

    const results = await Promise.allSettled([
      axios.get(`${DFA_API_BASE}/2?f=json`, {
        timeout: 5000,
      }),
      axios.get(`${DFA_API_BASE}/1?f=json`, {
        timeout: 5000,
      }),
    ]);

    const connectedLayer = results[0].status === 'fulfilled';
    const nearNetLayer = results[1].status === 'fulfilled';

    return {
      healthy: connectedLayer && nearNetLayer,
      connectedLayer,
      nearNetLayer,
      responseTime: Date.now() - startTime,
    };
  }
}

// Export singleton instance
export const dfaSyncService = new DFASyncService();
