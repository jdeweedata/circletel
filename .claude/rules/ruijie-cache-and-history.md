Rule: ruijie-cache-and-history  
Loaded by: CLAUDE.md  
Scope: Ruijie Cloud → Supabase cache, historic retention, admin Network UI

---

## Principle

**Supabase is the display source of truth for admin Network pages.**  
Ruijie Cloud is the origin system. Pull what Ruijie can provide, upsert into Supabase, and render from cache. Live Ruijie calls are opt-in (diagnostics), not the default page load.

## NEVER

```
NEVER prune/delete ruijie_device_cache when a Ruijie fetch returns 0 devices
NEVER prune device cache after a partial group fetch failure
NEVER make /admin/network/devices or analytics depend on live Ruijie for first paint
NEVER invent traffic, radio util, SSID bytes, or dBm density when Ruijie/cache has no data
NEVER wipe historic ruijie_traffic_rollups because a single sync failed
```

Use `shouldSkipDevicePrune()` / empty-keep guards in sync. Prefer failing the sync step (Inngest retry) over deleting fleet rows.

## Cache tables (display)

| Data | Supabase table | Populated by | Historic? |
|------|----------------|--------------|-----------|
| Fleet inventory + radio util | `ruijie_device_cache` | `ruijie-sync` (cron + manual) | Current snapshot only (Ruijie list API has no deep history) |
| Hourly group traffic | `ruijie_traffic_rollups` (`hours_window=1`) | `ruijie-traffic-rollup` after sync | Yes — upsert Ruijie `flow/show/hour` points (up to API window, retain 14d) |
| Health scores / anomalies | `device_health_snapshots` | `ruijie-health-monitor` | Yes — accumulates over time |
| Sync audit | `ruijie_sync_logs` | sync function | Operational history |

## Pull → cache → display

1. **Sync devices** from Ruijie → upsert `ruijie_device_cache` (preserve customer links / prior metrics when live enrich returns null).
2. **Roll up traffic** per group via representative EG/gateway SN → `getNetworkTraffic({ sn, hours })` → `buildHourlyRollupUpserts` → upsert `ruijie_traffic_rollups`.
3. **Admin UI defaults to Cached**:
   - Devices → `/api/ruijie/devices` (cache)
   - Analytics → `/api/admin/network/analytics` without `live=true` (rollups + cache)
4. **Live** (`?live=true` / Live toggle) is optional and must use fetch timeouts; do not auto-refresh Live on a timer.

## Historic backfill rules

- On every successful sync completion, traffic rollup must **re-pull the longest practical Ruijie hourly window** (currently up to **168 hours / 7 days**) and upsert all points — not only the last 24h blob.
- Upserts are idempotent on `(group_id, captured_at, hours_window)`.
- Retention prune of rollups only deletes rows older than retention (14 days); never truncate the table.
- If Ruijie returns no points for a group, leave existing rollup rows for that group intact.
- Device list history cannot be reconstructed beyond what we have already stored — do not fake past inventory.

## Auth

Ruijie admin APIs must use `authenticateAdmin()` (email / admin claim), not brittle `admin_users.id = auth.uid` only.

## Related code

- Sync: `lib/inngest/functions/ruijie-sync.ts`, `lib/ruijie/sync-service.ts`
- Traffic rollup: `lib/inngest/functions/ruijie-traffic-rollup.ts`
- Aggregates: `lib/network/analytics-aggregates.ts` (`buildHourlyRollupUpserts`, `HOURLY_ROLLUP_WINDOW`)
- Analytics API: `app/api/admin/network/analytics/route.ts`
- Devices API: `app/api/ruijie/devices/route.ts`
