/**
 * Pull Tarana TCS NQS devices into SQLite staging
 */

import type Database from 'better-sqlite3';
import { getAllDevicesNqs, type NqsDeviceData } from '@/lib/tarana/client';
export interface TaranaPullResult {
  fetched: number;
  bnCount: number;
  errors: string[];
}

/**
 * Fetch all devices via NQS v1 and replace stage_tarana_devices + meta.
 */
export async function pullTaranaToStage(
  db: Database.Database
): Promise<TaranaPullResult> {
  const errors: string[] = [];

  console.log('[VendorCache:Tarana] Fetching devices via NQS v1…');
  const data: NqsDeviceData = await getAllDevicesNqs();
  console.log(
    `[VendorCache:Tarana] ${data.baseNodes.length} BNs | ` +
      `${data.deviceCounts.rn.total} RNs (${data.deviceCounts.rn.connected} online)`
  );

  const fetchedAt = new Date().toISOString();

  const replace = db.transaction((nqs: NqsDeviceData) => {
    db.prepare('DELETE FROM stage_tarana_devices').run();
    db.prepare('DELETE FROM stage_tarana_meta').run();

    const insertDevice = db.prepare(
      `INSERT INTO stage_tarana_devices
         (serial_number, device_type, payload_json, fetched_at, published_at)
       VALUES (?, ?, ?, ?, NULL)`
    );

    for (const bn of nqs.baseNodes) {
      if (!bn.serialNumber) {
        errors.push('Skipping BN with missing serialNumber');
        continue;
      }
      insertDevice.run(
        bn.serialNumber,
        'BN',
        JSON.stringify(bn),
        fetchedAt
      );
    }

    const insertMeta = db.prepare(
      `INSERT INTO stage_tarana_meta (key, value_json, fetched_at)
       VALUES (?, ?, ?)`
    );
    insertMeta.run('rnCountsBySite', JSON.stringify(nqs.rnCountsBySite), fetchedAt);
    insertMeta.run('deviceCounts', JSON.stringify(nqs.deviceCounts), fetchedAt);
  });

  replace(data);

  const count = (
    db.prepare(
      `SELECT COUNT(*) AS c FROM stage_tarana_devices WHERE device_type = 'BN'`
    ).get() as { c: number }
  ).c;

  return { fetched: count, bnCount: count, errors };
}
