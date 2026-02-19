/**
 * Tarana Base Station Sync Service
 * Syncs BN data from Tarana Portal API to tarana_base_stations table
 */

import { createClient } from '@/lib/supabase/server';
import { getAllBaseNodes } from './client';

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
