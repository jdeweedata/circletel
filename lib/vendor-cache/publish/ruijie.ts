/**
 * Publish staged Ruijie devices to Supabase + emit Inngest completed event
 */

import type Database from 'better-sqlite3';
import {
  upsertDevices,
  pruneDevicesNotInSet,
  createSyncLog,
  logSyncRun,
  isMockMode,
  type RuijieDevice,
} from '@/lib/ruijie';
import { inngest } from '@/lib/inngest/client';
import {
  ruijieSyncCompleted,
  ruijieSyncSessions,
} from '@/lib/inngest/events/ruijie';

export interface RuijiePublishResult {
  published: number;
  added: number;
  updated: number;
  pruned: number;
  syncLogId: string;
  errors: string[];
}

export async function publishRuijieFromStage(
  db: Database.Database,
  options: { durationMs?: number } = {}
): Promise<RuijiePublishResult> {
  const errors: string[] = [];
  const rows = db
    .prepare(
      `SELECT sn, payload_json FROM stage_ruijie_devices ORDER BY sn`
    )
    .all() as Array<{ sn: string; payload_json: string }>;

  const devices: RuijieDevice[] = [];
  for (const row of rows) {
    try {
      devices.push(JSON.parse(row.payload_json) as RuijieDevice);
    } catch (err) {
      errors.push(
        `Invalid JSON for sn=${row.sn}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  const syncLogId = await createSyncLog('manual');
  console.log(`[VendorCache:Ruijie] Publishing ${devices.length} devices (log=${syncLogId})`);

  const upsertResult = await upsertDevices(devices, isMockMode());
  errors.push(...upsertResult.errors);

  const keepSns = devices.map((d) => d.sn);
  const pruneResult = await pruneDevicesNotInSet(keepSns);

  const durationMs = options.durationMs ?? 0;
  await logSyncRun(
    {
      ...upsertResult,
      devicesFetched: devices.length,
      durationMs,
    },
    'manual',
    undefined,
    syncLogId
  );

  const publishedAt = new Date().toISOString();
  db.prepare(
    `UPDATE stage_ruijie_devices SET published_at = ? WHERE published_at IS NULL`
  ).run(publishedAt);

  try {
    await inngest.send(
      ruijieSyncCompleted.create(
        {
          sync_log_id: syncLogId,
          devices_fetched: devices.length,
          added: upsertResult.added,
          updated: upsertResult.updated,
          pruned: pruneResult.deleted,
          errors: upsertResult.errors.length,
          duration_ms: durationMs,
        },
        {
          meta: {
            sessions: ruijieSyncSessions(syncLogId),
          },
        }
      )
    );
    console.log('[VendorCache:Ruijie] Emitted ruijie/sync.completed');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Inngest emit failed: ${msg}`);
    console.warn(`[VendorCache:Ruijie] Inngest emit failed: ${msg}`);
  }

  return {
    published: devices.length,
    added: upsertResult.added,
    updated: upsertResult.updated,
    pruned: pruneResult.deleted,
    syncLogId,
    errors,
  };
}
