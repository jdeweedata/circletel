/**
 * Vendor SQLite staging cache — shared types
 */

export type VendorName = 'ruijie' | 'tarana' | 'interstellio';

export type SyncRunStatus = 'running' | 'completed' | 'failed' | 'dry_run';

export interface SyncOptions {
  /** Stage only; skip Supabase upserts */
  dryRun?: boolean;
  /** Skip vendor pull; publish existing staged rows */
  publishOnly?: boolean;
  /** Tarana: delete BNs missing from API */
  deleteStale?: boolean;
  /** Interstellio: number of trailing days of daily usage to refresh */
  usageDays?: number;
}

export interface SyncRunResult {
  vendor: VendorName;
  success: boolean;
  dryRun: boolean;
  publishOnly: boolean;
  syncRunId: number;
  fetched: number;
  published: number;
  skipped: number;
  errors: string[];
  durationMs: number;
  details?: Record<string, unknown>;
}

export interface StageRuijieDeviceRow {
  sn: string;
  payload_json: string;
  fetched_at: string;
  published_at: string | null;
}

export interface StageTaranaDeviceRow {
  serial_number: string;
  device_type: string;
  payload_json: string;
  fetched_at: string;
  published_at: string | null;
}

export interface StageInterstellioSubscriberRow {
  id: string;
  payload_json: string;
  fetched_at: string;
  published_at: string | null;
}

export interface StageInterstellioUsageRow {
  subscriber_id: string;
  date: string;
  upload_mb: number;
  download_mb: number;
  fetched_at: string;
  published_at: string | null;
}
