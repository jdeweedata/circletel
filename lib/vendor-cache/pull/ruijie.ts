/**
 * Pull Ruijie devices into SQLite staging
 */

import type Database from 'better-sqlite3';
import {
  getAllDevices,
  enrichDevicesWithLiveMetrics,
  filterActiveDevices,
  RUIJIE_ACTIVE_WINDOW_DAYS,
  isMockMode,
  isCacheEmpty,
  seedMockData,
  type RuijieDevice,
} from '@/lib/ruijie';

export interface RuijiePullResult {
  fetched: number;
  active: number;
  errors: string[];
}

/**
 * Fetch Ruijie devices, filter active window, enrich metrics, replace stage table.
 */
export async function pullRuijieToStage(
  db: Database.Database
): Promise<RuijiePullResult> {
  const errors: string[] = [];

  if (isMockMode()) {
    const empty = await isCacheEmpty();
    if (empty) {
      console.log('[VendorCache:Ruijie] Mock mode, cache empty — seeding Supabase mock first');
      await seedMockData();
    }
  }

  console.log('[VendorCache:Ruijie] Fetching devices…');
  const devices = await getAllDevices();
  console.log(`[VendorCache:Ruijie] Fetched ${devices.length}`);

  const active = filterActiveDevices(devices as RuijieDevice[]);
  console.log(
    `[VendorCache:Ruijie] Active window ${RUIJIE_ACTIVE_WINDOW_DAYS}d: ${active.length}/${devices.length}`
  );

  console.log('[VendorCache:Ruijie] Enriching live metrics…');
  const enriched = await enrichDevicesWithLiveMetrics(active);
  const fetchedAt = new Date().toISOString();

  const replace = db.transaction((rows: RuijieDevice[]) => {
    db.prepare('DELETE FROM stage_ruijie_devices').run();
    const insert = db.prepare(
      `INSERT INTO stage_ruijie_devices (sn, payload_json, fetched_at, published_at)
       VALUES (?, ?, ?, NULL)`
    );
    for (const device of rows) {
      if (!device.sn) {
        errors.push('Skipping device with missing sn');
        continue;
      }
      insert.run(device.sn, JSON.stringify(device), fetchedAt);
    }
  });

  replace(enriched);

  const count = (
    db.prepare('SELECT COUNT(*) AS c FROM stage_ruijie_devices').get() as {
      c: number;
    }
  ).c;

  return { fetched: count, active: count, errors };
}
