/**
 * SQLite DDL for vendor staging cache
 */

export const VENDOR_CACHE_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS sync_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL,
  fetched INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 0,
  errors_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS stage_ruijie_devices (
  sn TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS stage_tarana_devices (
  serial_number TEXT PRIMARY KEY,
  device_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS stage_tarana_meta (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stage_interstellio_subscribers (
  id TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS stage_interstellio_usage (
  subscriber_id TEXT NOT NULL,
  date TEXT NOT NULL,
  upload_mb REAL NOT NULL DEFAULT 0,
  download_mb REAL NOT NULL DEFAULT 0,
  fetched_at TEXT NOT NULL,
  published_at TEXT,
  PRIMARY KEY (subscriber_id, date)
);

CREATE INDEX IF NOT EXISTS idx_sync_runs_vendor_started
  ON sync_runs(vendor, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_stage_ruijie_unpublished
  ON stage_ruijie_devices(published_at);

CREATE INDEX IF NOT EXISTS idx_stage_tarana_unpublished
  ON stage_tarana_devices(published_at);

CREATE INDEX IF NOT EXISTS idx_stage_interstellio_sub_unpublished
  ON stage_interstellio_subscribers(published_at);

CREATE INDEX IF NOT EXISTS idx_stage_interstellio_usage_unpublished
  ON stage_interstellio_usage(published_at);
`;
