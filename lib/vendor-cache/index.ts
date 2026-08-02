/**
 * Vendor SQLite staging cache
 *
 * VPS-local pull → SQLite stage → Supabase publish for Ruijie, Tarana, Interstellio.
 */

export { getVendorCacheDb, getVendorCacheDbPath, closeVendorCacheDb } from './db';
export { syncVendor, syncVendors } from './sync';
export type {
  VendorName,
  SyncOptions,
  SyncRunResult,
  SyncRunStatus,
} from './types';
