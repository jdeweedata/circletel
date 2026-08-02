-- Per-device Ruijie flow rollups (#702)
--
-- `ruijie_traffic_rollups` was keyed by group_id alone, so only one device per
-- group per hour could be stored. The collector picked one representative AP
-- (pickFlowDeviceSn -> pool[0] in an all-AP fleet) and its flow was reported as
-- the whole group's — and, downstream, as each member site's own traffic.
-- Verified in production: 20 Unjani sites resolve to 2 groups.
--
-- The device SN was already being recorded in raw_summary->>'flowSn'; this
-- promotes it to a real dimension so a site can be attributed its own device.
--
-- Safe to run against existing data: the column is added nullable, backfilled
-- from raw_summary, and the unique key is only widened — no row is deleted and
-- no existing (group_id, captured_at, hours_window) tuple becomes ambiguous.

BEGIN;

ALTER TABLE public.ruijie_traffic_rollups
  ADD COLUMN IF NOT EXISTS device_sn text;

-- Existing rows already carry their source SN in raw_summary.
UPDATE public.ruijie_traffic_rollups
SET device_sn = raw_summary->>'flowSn'
WHERE device_sn IS NULL
  AND raw_summary ? 'flowSn';

COMMENT ON COLUMN public.ruijie_traffic_rollups.device_sn IS
  'Ruijie device serial this hourly flow belongs to. Group totals are the SUM across device_sn (#702). Null only for legacy rows predating per-device collection.';

-- Widen the uniqueness so every device in a group can hold its own hour.
ALTER TABLE public.ruijie_traffic_rollups
  DROP CONSTRAINT IF EXISTS ruijie_traffic_rollups_group_captured_window_key;

-- device_sn participates in the key, so it must be non-null going forward.
-- Legacy rows without a flowSn get a sentinel rather than being deleted.
UPDATE public.ruijie_traffic_rollups
SET device_sn = '__legacy_group__'
WHERE device_sn IS NULL;

ALTER TABLE public.ruijie_traffic_rollups
  ALTER COLUMN device_sn SET NOT NULL;

ALTER TABLE public.ruijie_traffic_rollups
  ADD CONSTRAINT ruijie_traffic_rollups_group_device_captured_window_key
  UNIQUE (group_id, device_sn, captured_at, hours_window);

-- Usage reports read one site's device across a window.
CREATE INDEX IF NOT EXISTS idx_ruijie_traffic_rollups_device_time
  ON public.ruijie_traffic_rollups USING btree (device_sn, captured_at DESC);

COMMIT;
