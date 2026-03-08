/**
 * Ruijie Sync Service
 * Database helpers for Inngest sync operations
 *
 * Pattern mirrors lib/tarana/sync-service.ts
 */

import { createClient } from '@/lib/supabase/server';
import { RuijieDevice, SyncResult } from './types';
import { getMockDevicesForSeeding } from './mock';

/**
 * Sync-only fields - excludes customer linking fields which are managed separately
 * This prevents sync from overwriting customer links
 */
type RuijieSyncRow = {
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
};

// =============================================================================
// DEVICE TO ROW CONVERSION
// =============================================================================

/**
 * Convert API device to database row format
 * NOTE: Excludes customer linking fields to prevent sync from overwriting them
 */
function deviceToRow(
  device: RuijieDevice,
  mockData: boolean = false
): RuijieSyncRow {
  return {
    sn: device.sn,
    device_name: device.device_name,
    model: device.model ?? null,
    group_id: device.group_id ?? null,
    group_name: device.group_name ?? null,
    management_ip: device.management_ip ?? null,
    wan_ip: device.wan_ip ?? null,
    egress_ip: device.egress_ip ?? null,
    online_clients: device.online_clients,
    status: device.status,
    config_status: device.config_status ?? null,
    firmware_version: device.firmware_version ?? null,
    mac_address: device.mac_address ?? null,
    cpu_usage: device.cpu_usage ?? null,
    memory_usage: device.memory_usage ?? null,
    uptime_seconds: device.uptime_seconds ?? null,
    radio_2g_channel: device.radio_2g_channel ?? null,
    radio_5g_channel: device.radio_5g_channel ?? null,
    radio_2g_utilization: device.radio_2g_utilization ?? null,
    radio_5g_utilization: device.radio_5g_utilization ?? null,
    project_id: device.project_id ?? null,
    last_seen_at: device.last_seen_at ?? null,
    synced_at: new Date().toISOString(),
    raw_json: device as unknown as Record<string, unknown>,
    mock_data: mockData,
  };
}

// =============================================================================
// UPSERT OPERATIONS
// =============================================================================

/**
 * Bulk upsert devices to cache
 */
export async function upsertDevices(
  devices: RuijieDevice[],
  mockData: boolean = false
): Promise<SyncResult> {
  const supabase = await createClient();
  const result: SyncResult = { updated: 0, added: 0, errors: [] };

  // Get existing SNs to determine added vs updated
  const { data: existing } = await supabase
    .from('ruijie_device_cache')
    .select('sn');

  const existingSnSet = new Set(existing?.map(e => e.sn) || []);

  // Convert to rows
  const rows = devices.map(d => deviceToRow(d, mockData));

  // Upsert all at once
  const { error } = await supabase
    .from('ruijie_device_cache')
    .upsert(rows, { onConflict: 'sn' });

  if (error) {
    result.errors.push(`Upsert failed: ${error.message}`);
    return result;
  }

  // Count added vs updated
  for (const device of devices) {
    if (existingSnSet.has(device.sn)) {
      result.updated++;
    } else {
      result.added++;
    }
  }

  return result;
}

// =============================================================================
// SYNC LOG OPERATIONS
// =============================================================================

/**
 * Create initial sync log entry
 */
export async function createSyncLog(
  triggeredBy: 'cron' | 'manual',
  triggeredByUserId?: string
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ruijie_sync_logs')
    .insert({
      status: 'running',
      triggered_by: triggeredBy,
      triggered_by_user_id: triggeredByUserId || null,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('[RuijieSync] Failed to create sync log:', error);
    return '';
  }

  return data?.id || '';
}

/**
 * Log sync run to ruijie_sync_logs
 */
export async function logSyncRun(
  result: SyncResult & { devicesFetched: number; durationMs: number },
  triggeredBy: 'cron' | 'manual',
  triggeredByUserId?: string,
  syncLogId?: string
): Promise<string> {
  const supabase = await createClient();

  const logEntry = {
    status: result.errors.length > 0 ? 'completed_with_errors' : 'completed',
    devices_fetched: result.devicesFetched,
    devices_updated: result.updated,
    devices_added: result.added,
    errors: result.errors.length > 0 ? result.errors : null,
    error_message: result.errors.length > 0 ? result.errors.slice(0, 3).join('; ') : null,
    triggered_by: triggeredBy,
    triggered_by_user_id: triggeredByUserId || null,
    completed_at: new Date().toISOString(),
    duration_ms: result.durationMs,
  };

  if (syncLogId) {
    // Update existing log
    await supabase
      .from('ruijie_sync_logs')
      .update(logEntry)
      .eq('id', syncLogId);
    return syncLogId;
  }

  // Create new log
  const { data, error } = await supabase
    .from('ruijie_sync_logs')
    .insert({ ...logEntry, started_at: new Date().toISOString() })
    .select('id')
    .single();

  if (error) {
    console.error('[RuijieSync] Failed to log sync run:', error);
    return '';
  }

  return data?.id || '';
}

// =============================================================================
// TUNNEL OPERATIONS
// =============================================================================

/**
 * Get count of active tunnels (for 10-tunnel limit guard)
 */
export async function getActiveTunnelCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('ruijie_tunnels')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString());

  if (error) {
    console.error('[RuijieSync] Failed to count active tunnels:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Mark expired tunnels as 'expired'
 * Called by ruijie-tunnel-cleanup Inngest cron
 */
export async function expireStaleTunnels(): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ruijie_tunnels')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString())
    .select('id');

  if (error) {
    console.error('[RuijieSync] Failed to expire stale tunnels:', error);
    return 0;
  }

  return data?.length || 0;
}

// =============================================================================
// MOCK DATA SEEDING
// =============================================================================

/**
 * Check if cache is empty
 */
export async function isCacheEmpty(): Promise<boolean> {
  const supabase = await createClient();

  const { count } = await supabase
    .from('ruijie_device_cache')
    .select('sn', { count: 'exact', head: true });

  return !count || count === 0;
}

/**
 * Seed mock data on first run (when cache is empty)
 * Called by Inngest sync when RUIJIE_MOCK_MODE=true and cache is empty
 */
export async function seedMockData(): Promise<boolean> {
  const supabase = await createClient();

  // Check if cache is empty
  const { count } = await supabase
    .from('ruijie_device_cache')
    .select('sn', { count: 'exact', head: true });

  if (count && count > 0) {
    console.log('[RuijieSync] Cache not empty, skipping mock seed');
    return false;
  }

  // Seed with mock data
  const mockDevices = getMockDevicesForSeeding();
  const result = await upsertDevices(mockDevices, true);

  console.log(`[RuijieSync] Seeded ${result.added} mock devices`);
  return true;
}
