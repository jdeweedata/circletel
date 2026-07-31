# Site Network Usage Report — CircleTel telemetry capability

**Date:** 2026-07-31  
**Ticket:** [#662](https://github.com/jdeweedata/circletel/issues/662) (parent [#661](https://github.com/jdeweedata/circletel/issues/661))  
**Scope:** What metrics and time grain we can **reliably** produce for an active-service site over weekly / monthly / 60-day / custom (≤90d), from primary sources in this repo only.  
**Branch:** `research/site-usage-circletel-telemetry`

---

## Verdict (short)

| Period | Reliable from CircleTel-persisted Ruijie rollups? | Reliable alternate for BNG sites? |
|--------|---------------------------------------------------|-----------------------------------|
| **Weekly (~7d)** | **Yes** — hourly `hours_window=1` series, API already caps cache queries at 168h | Interstellio daily/hourly also OK |
| **Monthly (~30d)** | **No** — rollups pruned at **14 days** | **Yes if** site has Interstellio subscriber mapping (API already allows ≤90d) |
| **60-day** | **No** | **Yes if** Interstellio-mapped (≤90d) |
| **Custom ≤90d** | **No** beyond ~14d of rollups / ~7d of analytics API window | **Yes if** Interstellio-mapped |

CircleTel’s first-party Wi‑Fi traffic store (`ruijie_traffic_rollups`) is a **group-scoped hourly series with 14-day retention**. It cannot alone back monthly / 60d / 90d site usage reports. For PPPoE / Interstellio sites, **subscriber usage from NebularStack** is the only in-repo path that already supports those longer windows.

---

## Primary sources examined

| Source | Path |
|--------|------|
| Rollup schema | `supabase/migrations/20260725151606_ruijie_traffic_rollups.sql` |
| Rollup Inngest job | `lib/inngest/functions/ruijie-traffic-rollup.ts` |
| Analytics API | `app/api/admin/network/analytics/route.ts` |
| Aggregate helpers | `lib/network/analytics-aggregates.ts` |
| Ruijie live flow | `lib/ruijie/client.ts` (`getNetworkTraffic`), `lib/ruijie/performance-metrics.ts` (`buildHourlyFlowRequest`, `pickFlowDeviceSn`) |
| Device ↔ site link | `supabase/migrations/archive/20260308000001_device_customer_linking.sql`, `app/api/ruijie/devices/[sn]/link/route.ts` |
| Site hardware / BNG IDs | `supabase/migrations/archive/20260307000003_add_unjani_network_columns.sql` |
| Service identifier map | `supabase/migrations/20260709160000_create_service_network_identifiers.sql` |
| Interstellio usage API | `app/api/admin/integrations/interstellio/subscribers/[id]/usage/route.ts`, `lib/interstellio/client.ts`, `lib/interstellio/types.ts` |
| Portal site health | `app/api/portal/sites/[id]/health/route.ts` |
| Health snapshots schema | `supabase/migrations/archive/20260308000003_device_health_tracking.sql` (+ baseline squash) |
| MikroTik registry | `mikrotik_routers` in `supabase/migrations/20260523000000_baseline_squash.sql` |
| Topology / bridges | `docs/architecture/NETWORK_VISIBILITY_BRIDGES.md` |

---

## What metrics exist

### A. Ruijie traffic rollups (persisted, group-level)

Schema (`ruijie_traffic_rollups`):

- **Grain:** one row per `(group_id, captured_at, hours_window)` with preferred `hours_window = 1` (true hourly buckets, UTC hour via `hourBucketIso`).
- **Metrics per hour:** `total_rx_bytes`, `total_tx_bytes`, `avg_rx_bps`, `avg_tx_bps`, `peak_rx_bps`, `peak_tx_bps`, optional `raw_summary` (`flowSn`, `source: hourly_flow`).
- **Derived (analytics API):** summed RX/TX/total bytes over window, average rates → Mbps, peak hourly bytes, time series of points.

Written by `ruijie-traffic-rollup` after `ruijie/sync.completed`:

1. Distinct `group_id`s from `ruijie_device_cache`.
2. Pick a flow device SN (`pickFlowDeviceSn` — prefers online gateway/EG).
3. Live Ruijie hourly flow for **24h** (`HOURS_WINDOW = 24`), bucket into hourly upserts.
4. **Prune** rows with `captured_at` older than **`RETENTION_DAYS = 14`**.

### B. `/api/admin/network/analytics` (group-scoped read path)

Query: `groupId` (optional), `hours` (default 24, **max 168**), `live`, `includeApps`.

**Cache-first (`live` false):**

- Traffic KPIs + series from `ruijie_traffic_rollups` (`hours_window=1`), falling back to legacy window blobs (newest per group only).
- Radio util from `ruijie_device_cache` (2g/5g util + channels) — **point-in-time device cache**, not a historical usage series.
- No live Ruijie calls.

**Live (`live=true`):**

- Same group cards from rollups; traffic from `getNetworkTraffic({ sn, hours })`; optional STA → SSID activity; optional app-flow.

**Not site-scoped:** there is no `corporate_site_id` / `siteId` parameter. Consumers must resolve site → device → `group_id` first.

### C. Interstellio / NebularStack subscriber usage (L3, site-mappable)

`GET .../interstellio/subscribers/[id]/usage`:

- `aggregation`: `hourly | daily | weekly | monthly | yearly`
- `days`: default 30, **max 90**
- Metrics: `upload_kb`, `download_kb`, `combined_kb` (+ optional kbps), with summary totals in MB/GB

Site linkage paths in schema:

- `corporate_sites.interstellio_subscriber_id`
- `service_network_identifiers` where `identifier_type = 'interstellio_uuid'` → `customer_services`

Documented as the PPPoE / CircleTel BNG path (`network_path = circletel_bng`). This is the **only** primary path that already encodes weekly/monthly/60d/≤90d usage windows.

### D. Related but not byte-usage

| Asset | What it gives | Usable as “usage report”? |
|-------|---------------|---------------------------|
| `device_health_snapshots` | `online_clients`, status, CPU/mem, `health_score` | **No** byte totals; availability/clients only. Portal health allows `7d`/`30d` ranges but selects `connected_clients` (schema column is `online_clients` — portal query is inconsistent with migrations). |
| `corporate_sites.ruijie_device_sn` / `ruijie_ap_serial` / `mikrotik_serial` | Install identity | Mapping only |
| `ruijie_device_cache.corporate_site_id` | Device → site FK | Required for site-scoped Ruijie reads |
| `mikrotik_routers` | Router inventory (CPU/mem/status) | **No traffic counters**; enrollment gap (0 routers) per bridges doc |
| Tarana TCS | RN online / RF detail | **No** clinic-keyed usage series; `tarana_serial` mapping still pending in SNI |

---

## Time grain we can produce

| Grain | Ruijie rollups | Analytics API | Interstellio usage |
|-------|----------------|---------------|--------------------|
| Hourly | Native (`hours_window=1`) | Series from hourly rows; window ≤168h | Supported aggregation |
| Daily | Sum hours client-side (if hours present) | Sum within ≤7d | Native `daily` |
| Weekly | Only if ≤14d of rollups retained and complete | Cap 168h ≈ 7d | Native `weekly` |
| Monthly | **Not** from store (14d prune) | **Not** | Native `monthly` |
| Custom ≤90d | At most last **14d** of hourly samples | At most **7d** via `hours` | Up to **90d** via `days` |

**Max history (CircleTel-owned Ruijie path):** **14 days** hard prune in the rollup job. Even if the live Ruijie `/flow/show/hour` API accepted a longer window, nothing in-repo persists beyond 14d, and the admin analytics route refuses `hours > 168`.

---

## Site mapping: group vs site

Resolution chain required for a **site** usage report from Ruijie:

```
corporate_sites.id
  → ruijie_device_cache (corporate_site_id = site.id)
     OR corporate_sites.ruijie_device_sn → ruijie_device_cache.sn
  → device.group_id
  → ruijie_traffic_rollups.group_id
```

Alternate service-level chain:

```
customer_services.id
  → service_network_identifiers (ruijie_sn | interstellio_uuid)
  → corporate_sites.service_id (where present)
```

**Group ≠ site:**

- Rollups and analytics are keyed by **Ruijie Cloud `group_id`**.
- Multiple devices (and potentially multiple clinic sites) can share one group; traffic is **group aggregate** from a representative flow SN (gateway preferred), not per-AP isolation.
- A site with a linked AP but no online/gateway-capable SN gets **no rollup rows** for that sync (`pickFlowDeviceSn` null / empty flow → skip).
- Unlinked devices (`corporate_site_id` null and no `ruijie_device_sn` on the site) cannot be attributed to a site report even if group rollups exist.

MikroTik:

- Sites may store `mikrotik_serial`, but `mikrotik_routers` has no byte-usage history and enrollment is documented as empty — **not** a usage source today.

---

## Gaps (explicit)

1. **Sites without devices / links**  
   No `ruijie_device_sn`, no `corporate_site_id` on cache, and no `interstellio_subscriber_id` / SNI row → **no usage series**. Active service status alone is insufficient.

2. **Missing / sparse rollups**  
   Empty Ruijie flow after sync, no gateway SN, job not registered with Inngest Cloud, or prune → gaps inside the 14d window. Analytics falls back to legacy overlapping window blobs (not summable as a clean hourly series).

3. **Max history too short for locked periods**  
   Monthly / 60d / custom ≤90d **cannot** be served from `ruijie_traffic_rollups` without changing retention (and likely live ingest window). Current design max = **14d**.

4. **Analytics API window shorter than retention**  
   Even within retention, cache API only accepts **≤168 hours (~7d)**. A 14d report would need a new query path (direct Supabase read) or a higher `hours` cap.

5. **Group vs site mapping**  
   Reports labeled “site” that sum by `group_id` alone can **over-attribute** traffic when one Ruijie group covers multiple sites, or **mis-attribute** when the flow SN is a shared gateway.

6. **MikroTik / Tarana / MTN SIM**  
   No persisted per-site byte usage in CircleTel DB for these bridges. Tarana and MSISDN mappings incomplete in `service_network_identifiers`.

7. **Health ≠ usage**  
   `device_health_snapshots` / portal health are client/health timeseries, not traffic. Do not substitute for a usage report.

8. **Path split**  
   Interstellio usage covers **BNG/PPPoE** sites with subscriber IDs. MTN breakout / consumer SIM sites are outside that path and currently have **no** ≤90d usage store in-repo.

---

## Period-by-period reliability matrix

Assume: **active-service site** with at least one of (linked Ruijie device → group with rollups) or (Interstellio UUID).

| Period | Reliable metrics | Grain | Conditions | Failure modes |
|--------|------------------|-------|------------|---------------|
| **Weekly** | RX/TX/total bytes, avg/peak rates (Mbps), hourly series; optional live SSID/app | Hourly (Ruijie) or daily (Interstellio) | Linked device + recent rollups **or** Interstellio ID | Unlinked site; empty group; analytics `hours` must be ≥168 for full week |
| **Monthly** | Upload/download/combined KB via Interstellio | Daily / weekly / monthly agg | `interstellio_subscriber_id` or SNI `interstellio_uuid` | Ruijie-only sites: **unsupported** today |
| **60-day** | Same as monthly | Daily / weekly | Same | Same |
| **Custom ≤90d** | Same; API already clamps `days ≤ 90` | Choose aggregation | Same | Same; Ruijie only fills last ≤14d if used as partial overlay |

---

## Implications

1. **Do not promise a single Ruijie-backed Site Network Usage Report for monthly / 60d / ≤90d.** The rollup table + prune policy make that false. Either extend retention (and backfill strategy) or treat Interstellio as the system of record for long windows on BNG sites.

2. **Weekly reports are the only period that CircleTel-owned Ruijie telemetry can honestly own end-to-end today** — and even then only for sites that resolve to a Ruijie `group_id` with hourly rows. Raise analytics `hours` max or query rollups directly if the UI needs the full 14d retention window.

3. **Product copy / report definition must state the unit of aggregation:** Ruijie **group** traffic (representative EG/gateway SN) vs Interstellio **subscriber** traffic. They are not interchangeable and may double-count or disagree if both are shown without labeling.

4. **Prerequisite ops work before any site report:** complete `corporate_site_id` / `ruijie_device_sn` / Interstellio SNI links for active services; sites without links should render an explicit “no telemetry” state, not zeros.

5. **If #661 needs one report shape across all active sites,** the honest MVP is:  
   - **BNG:** Interstellio daily/weekly/monthly ≤90d (upload/download/combined).  
   - **Wi‑Fi overlay (optional):** Ruijie hourly group traffic for last ≤7–14d when linked.  
   - **Else:** unavailable. MikroTik/Tarana are not usage sources yet.

6. **Schema/API follow-ups (out of scope for this ticket, but blocking fidelity):** longer rollup retention or cold archive; site-scoped analytics endpoint; fix portal health column name vs `online_clients`; enroll MikroTik only if router-level counters become a requirement.

---

## Source anchors (line-level facts)

- Retention **14d**: `lib/inngest/functions/ruijie-traffic-rollup.ts` (`RETENTION_DAYS = 14`, prune step).
- Analytics **hours max 168**: `app/api/admin/network/analytics/route.ts`.
- Hourly window constant: `HOURLY_ROLLUP_WINDOW = 1` in `lib/network/analytics-aggregates.ts`.
- Interstellio **days max 90**: `app/api/admin/integrations/interstellio/subscribers/[id]/usage/route.ts`.
- Unique key `(group_id, captured_at, hours_window)`: migration `20260725151606_ruijie_traffic_rollups.sql`.
- Device link columns: `ruijie_device_cache.corporate_site_id` (device linking migration); site columns `ruijie_device_sn`, `interstellio_subscriber_id`, `mikrotik_serial` (Unjani network columns migration).
