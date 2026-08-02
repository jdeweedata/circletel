/**
 * Vendor cache SQLite opener (WAL mode)
 *
 * Path: VENDOR_CACHE_DB_PATH or data/vendor-cache/vendor-cache.db
 * File mode: 0600 after open
 */

import Database from 'better-sqlite3';
import { chmodSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { VENDOR_CACHE_SCHEMA_SQL } from './schema';

let dbInstance: Database.Database | null = null;

export function getVendorCacheDbPath(): string {
  const fromEnv = process.env.VENDOR_CACHE_DB_PATH?.trim();
  if (fromEnv) {
    return resolve(fromEnv);
  }
  return resolve(process.cwd(), 'data/vendor-cache/vendor-cache.db');
}

/**
 * Open (or return) the shared vendor-cache database.
 * Creates parent directory, applies schema, enables WAL.
 */
export function getVendorCacheDb(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = getVendorCacheDbPath();
  mkdirSync(dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(VENDOR_CACHE_SCHEMA_SQL);

  try {
    chmodSync(dbPath, 0o600);
  } catch {
    // Non-fatal on platforms that ignore chmod
  }

  dbInstance = db;
  return db;
}

/** Close the shared connection (tests / process exit). */
export function closeVendorCacheDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
