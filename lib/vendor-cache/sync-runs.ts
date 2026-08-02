/**
 * sync_runs helpers for vendor-cache SQLite
 */

import type Database from 'better-sqlite3';
import type { SyncRunStatus, VendorName } from './types';

export function startSyncRun(
  db: Database.Database,
  vendor: VendorName
): number {
  const result = db
    .prepare(
      `INSERT INTO sync_runs (vendor, started_at, status, fetched, published, errors_json)
       VALUES (?, ?, 'running', 0, 0, '[]')`
    )
    .run(vendor, new Date().toISOString());
  return Number(result.lastInsertRowid);
}

export function finishSyncRun(
  db: Database.Database,
  id: number,
  input: {
    status: SyncRunStatus;
    fetched: number;
    published: number;
    errors: string[];
  }
): void {
  db.prepare(
    `UPDATE sync_runs
     SET finished_at = ?, status = ?, fetched = ?, published = ?, errors_json = ?
     WHERE id = ?`
  ).run(
    new Date().toISOString(),
    input.status,
    input.fetched,
    input.published,
    JSON.stringify(input.errors.slice(0, 50)),
    id
  );
}
