# Research: Ruijie STA session bytes → hourly SSID rollups

**Date:** 2026-07-31  
**Ticket:** [#673](https://github.com/jdeweedata/circletel/issues/673) (map [#672](https://github.com/jdeweedata/circletel/issues/672); parent Usage Reports [#661](https://github.com/jdeweedata/circletel/issues/661))  
**Question:** Against Ruijie STA APIs (`getGroupStaUsers` → `/sta/sta_users`, fields `wifiUp` / `wifiDown` / `wifiUpDown`), existing Inngest rollup patterns (`ruijie-traffic-rollup`), and API rate/timeout behaviour in this repo: can we sample STA session bytes on a schedule and persist **deltas rolled up by (device SN, SSID, hour)** good enough for Staff (and optionally Free) **period GB** on Usage Reports (week / month / 60d / ≤90d)?  
**Scope rule:** Surface facts only. Do **not** design the full DB schema (that is [#675](https://github.com/jdeweedata/circletel/issues/675)).

**Prior context:** `docs/analysis/2026-07-31-site-usage-report-unjani-staff-wifi.md` (Fallback B — Ruijie STA session-byte deltas by SSID).

---

## Verdict

**Qualified yes — forward-only, sampling-based estimate; not accounting-grade.**

CircleTel can call `/sta/sta_users` on a schedule, read per-STA cumulative session counters (`wifiUp` / `wifiDown` / `wifiUpDown`) with `ssid` + AP `sn` + client `mac`, compute **positive deltas between consecutive samples**, and sum those deltas into buckets keyed by **`(device SN, SSID, hour)`**. That series is good enough to power Staff (and optionally Free) **period GB** on Usage Reports **after go-live**, provided reports label it as sampled STA telemetry and accept undercount from short sessions and disconnect gaps.

It is **not** available today as a persisted series. Ruijie’s cloud API does **not** expose historical SSID byte traffic; `/flow/show/hour` remains whole-device / whole-group only. Nothing reconstructs Staff/Free GB for periods before the sampler starts.

---

## Evidence by primary source

### 1. STA API shape (`getGroupStaUsers` → `/sta/sta_users`)

| Path | What it proves |
|------|----------------|
| `lib/ruijie/client.ts` — `getGroupStaUsers` | POST `/sta/sta_users` with `{ groupId, pageIndex: 0, pageSize: 1000, staType: 'currentUser' }`; returns live online STA list only |
| `lib/ruijie/performance-metrics.ts` — `StaUserRaw` | Documents `wifiUp`, `wifiDown`, `wifiUpDown` (“Cumulative session bytes (up + down)”), `ssid`, `sn`, `mac`, `activeTime` (session duration ms) |
| `lib/ruijie/client.ts` — `RuijieClient` / `getDeviceClients` | Maps `wifiUpDown` → `sessionBytes` (“Cumulative bytes this session”); maps `activeTime` → `sessionMs` |
| `app/api/ruijie/devices/[sn]/traffic/route.ts` | Distinguishes device flow **history** (`flow/show/hour`) from STA **instantaneous rates**; note: “Client rates are instantaneous, from the STA API” — rates ≠ period bytes |
| `lib/network/analytics-aggregates.ts` — `aggregateSsidActivity` | Explicitly: “Client counts by SSID from live STA rows (**not byte traffic**)” |
| `components/admin/network/performance/GroupTrafficCards.tsx` — `SsidActivityCards` | UI copy: “Live client counts by SSID (STA API — not byte traffic)” / “Ruijie does not expose SSID byte traffic here” |

**Implication:** Byte fields exist on **current** associations. They are session-cumulative counters, not a ready-made historical rollup. CircleTel today uses them for live client UI only; analytics SSID cards intentionally ignore bytes.

### 2. Live probe (2026-07-31, cloud-eu via `getGroupStaUsers`)

Queried production credentials against the three `ruijie_device_cache` groups:

| `group_id` | Name | Devices (cache) | STA count | STA call latency | SSIDs observed |
|------------|------|-----------------|-----------|------------------|----------------|
| `9058218` | Unjani | 16 | **99** (91 with byte fields) | ~325 ms | `Unjani Clinic Staff` (57), `Unjani Clinic Free WiFi` (42) |
| `9124474` | UnjanihAPaxS | 5 | **0** | ~35 ms | (none at probe time) |
| `8902292` | Newgen Network | 1 | **5** (3 with byte fields) | ~69 ms | `NewGen MC` (5) |

Sample Staff row (group `9058218`): `ssid: "Unjani Clinic Staff"`, `sn`, `mac`, `wifiUp: 170438`, `wifiDown: 157471`, `wifiUpDown: 327909`, `activeTime: 291286000` (~80.9 h).  
Sample Free row: `ssid: "Unjani Clinic Free WiFi"`, `wifiUpDown: 43962775` (~42 MB), `activeTime: 26405000` (~7.3 h).  
Short sessions also present (e.g. Free `activeTime: 483000` ≈ 8 min with ~11.8 MB `wifiUpDown`).

**Implication:** Allow-listed Staff/Free SSID names already appear on live Unjani STAs with usable session byte counters. Fleet STA volume (≪ `pageSize: 1000`) fits one page per group today. Outdoor group can return **zero** STAs at a given sample — that hour contributes no SSID bytes from those APs unless clients are associated.

### 3. Timeouts and rate behaviour (coded)

| Constant / behaviour | Value | Source |
|----------------------|-------|--------|
| `RUIJIE_FETCH_TIMEOUT_MS` | **10_000** ms on every `ruijieFetch` / logbiz call | `lib/ruijie/client.ts` |
| `METRICS_DELAY_MS` | **250** ms between group STA fetches and between per-device `current_performance` | `lib/ruijie/client.ts` — `enrichDevicesWithLiveMetrics` |
| `ruijie-sync` cron | **`*/30 * * * *`** (every 30 min; comment notes reduction from 5 min for Inngest free tier) | `lib/inngest/functions/ruijie-sync.ts` |
| Sync already fetches STA | One `getGroupStaUsers` per distinct `group_id` during enrichment | same + `enrichDevicesWithLiveMetrics` |
| `POST_SYNC_COOLDOWN_MS` / sleep | **12 s** after sync before traffic rollup | `lib/inngest/functions/ruijie-traffic-rollup.ts` |
| `GROUP_DELAY_MS` | **600** ms between groups in traffic rollup | same |
| Rollup concurrency | **`limit: 1`** — “avoids Ruijie rate limits when syncs overlap” | same |
| Empty flow retry | one retry after **5_000** ms | same |
| Phase 0 rate guidance | 100–200 ms between per-device calls; watch throttling | `docs/plans/2026-07-09-phase0-network-foundation-spec.md` |

**Implication:** A dedicated STA sampler at **one POST per group** is light versus existing sync+rollup load. With **3 groups** today, even a 5-minute cadence is ~36 STA calls/hour, each typically well under the 10 s timeout (live probe &lt; 400 ms). No coded hard RPS quota was found beyond these delays/concurrency guards; the rollup job’s own comments treat Ruijie as throttle-sensitive under overlapping syncs.

### 4. Existing rollup pattern (`ruijie-traffic-rollup`)

| Path | What it proves |
|------|----------------|
| `lib/inngest/functions/ruijie-traffic-rollup.ts` | Triggered by `ruijie/sync.completed`; fetches `/flow/show/hour` via one `pickFlowDeviceSn` per `group_id`; upserts hour buckets; prunes with `RETENTION_DAYS = 14` |
| `lib/network/analytics-aggregates.ts` — `buildHourlyRollupUpserts` / `hourBucketIso` | Persists **hours_window=1** rows keyed by UTC hour — pattern for “sum without double-counting” |
| `supabase/migrations/20260725151606_ruijie_traffic_rollups.sql` | Schema grain: `(group_id, captured_at, hours_window)` — **no `ssid`, no `device_sn`** |
| `app/api/ruijie/devices/[sn]/traffic/route.ts` | `MAX_HOURS = 168` — “Ruijie keeps roughly a week of hourly flow” (device aggregate only) |

**Implication:** Inngest + hour-bucket upsert is a proven pattern, but today’s rollups are **group flow**, not SSID. Retention of **14 days** is shorter than Usage Report windows (week / month / 60d / ≤90d) — any SSID series used for those reports must retain longer than the current traffic-rollup prune (schema/retention detail deferred to #675). Historical SSID GB cannot be backfilled from Ruijie flow history.

### 5. What is **not** a source of SSID period bytes

| Source | Why it fails for this question |
|--------|--------------------------------|
| `/flow/show/hour` | Per-device (or group) `rxBytes`/`txBytes` — **no SSID dimension** |
| Live `uplinkRate` / `downlinkRate` on STA | Instantaneous rates; traffic route already documents this |
| `aggregateSsidActivity` / Analytics SSID cards | Counts only |
| Group `ruijie_traffic_rollups` | Shared Unjani multi-clinic groups; no Staff/Free split |

---

## How deltas would work (facts for implementers — not a schema)

Observed counter semantics from code comments + live rows:

1. **Identity for consecutive samples:** client `mac` + AP `sn` (+ `ssid` if the association can move SSID). Roaming to another AP changes `sn` → treat as a new association for delta purposes (prior AP’s last sample is the last credit).
2. **Positive delta:** if `wifiUpDown_t ≥ wifiUpDown_{t-1}` (same mac/sn/ssid), credit `Δ = wifiUpDown_t − wifiUpDown_{t-1}` (or separate `wifiUp`/`wifiDown` deltas) into the hour bucket of the sample time (or of the interval — product choice for #675).
3. **Session reset:** if counter decreases while the same mac/sn/ssid is still present, treat as a new session: credit `wifiUpDown_t` as a fresh cumulative (do not subtract). Same when a mac reappears after absence with a lower counter.
4. **Client churn / offline STAs:** `staType: 'currentUser'` omits disconnected clients. Traffic between the last sample that still listed the STA and disconnect is **not** observed after drop-off — undercount of the trailing interval. Entire associations that start and end **between** two samples never appear — undercount of short sessions.
5. **Missing byte fields:** live Unjani group had 99 STAs but only 91 with byte fields — null/absent counters contribute zero until present.
6. **Pagination:** client requests only `pageIndex: 0` with `pageSize: 1000`. Fleet today is fine; if concurrent STAs ever exceed 1000 per group, later pages would be ignored unless pagination is added.
7. **Forward-only:** no Ruijie API in this codebase returns historical STA session byte series. Period GB for week/month/60d/90d requires continuous sampling + retention covering that window **from go-live**.

---

## Recommended sample interval

| Option | Fit | Notes |
|--------|-----|-------|
| **Reuse 30-min `ruijie-sync` STA fetch** | Minimum viable for long Staff sessions | Sync already pulls STA per group every 30 min. Live data shows Free/Staff sessions shorter than 30 min with material `wifiUpDown` — **high short-session loss** if this is the only cadence. |
| **Every 15 min** (peer: Tarana metrics cron `*/15`) | Acceptable Staff-focused compromise | Matches an existing metrics cadence style (`lib/inngest/functions/tarana-metrics-collection.ts`). Still loses sub-15-min associations. |
| **Every 5 min (recommended)** | Best “good enough” for Staff **and** optional Free | 3 groups × 12 samples/hour ≈ 36 STA POSTs/hour; live latency ≪ 10 s timeout; stays lighter than sync’s per-device `current_performance` storm. Aligns better with observed ~8–15 min Free sessions. |

**Recommendation:** sample **every 5 minutes**, with the same inter-group delay discipline as sync (**≥250 ms** between group STA calls) and **concurrency 1** if sharing Ruijie load with sync/rollup. Prefer a **dedicated** sampler (or sync cadence change) rather than depending on 30-min sync alone. Do **not** sample STA immediately in the same second as post-sync flow rollup without the existing **12 s** cool-down pattern.

If Free SSID metering is deferred (#676) and Staff-only long clinic sessions dominate, **10–15 minutes** remains usable; **30 minutes** is a weak floor for period GB accuracy given live short-session evidence.

---

## Caveats (must surface on Usage Reports / ops)

1. **Session reset / counter non-monotonicity** — `wifiUp*` are current-session cumulatives; reconnects reset counters. Delta logic must handle decreases and reappearing MACs or period GB will go negative or spike.
2. **Client churn / offline omission** — only currently associated STAs appear (`staType: 'currentUser'`). Disconnect trailing bytes and entire inter-sample associations are lost → systematic **undercount**, worse as sample interval grows.
3. **Empty / offline APs and groups** — groups or APs with no associated STAs at sample time contribute nothing (live: `UnjanihAPaxS` returned 0 STAs). Offline APs do not list clients; their Staff usage during outage is invisible to this method.
4. **Forward-only / retention** — no historical SSID reconstruction from Ruijie; current group traffic rollups prune at **14 days**, which is insufficient for month/60d/≤90d reports without a longer-retained SSID series (#675).
5. **Shared Ruijie groups** — Unjani clinics share `group_id`s; rollups must key by **device SN** (then map SN → `corporate_sites`) — group-level STA totals are not site totals. AP↔site linkage is a separate ticket (#674), not solved by sampling alone.
6. **Allow-list required** — live SSIDs include both Staff and Free; sampling without an allow-list would mix patient Free radio into Staff if Free is not intended as CircleTel Staff attribution (product decision #676).
7. **Not a substitute for VLAN edge counters** — prior research Preferred A (MikroTik VLAN-10) is cleaner metering when inventory exists; STA deltas are Fallback B with the caveats above.

---

## Answer for map #672 / #661 consumers

| Claim | Status |
|-------|--------|
| Can we sample STA session bytes and persist deltas by `(device SN, SSID, hour)`? | **Yes (qualified)** — fields + identity + Inngest hour-bucket pattern exist |
| Good enough for Staff period GB (week / month / 60d / ≤90d)? | **Yes after go-live + retention ≥ report window**, as an **estimate** with undercount caveats — not billing-grade |
| Optional Free SSID radio metering the same way? | **Technically same mechanism**; short Free sessions need ≤5–15 min sampling; product scope is #676 |
| Available without new instrumentation? | **No** — live only today; no persisted SSID byte series |
| Reconstruct history before sampler go-live? | **No** |
| Recommended sample interval | **5 minutes** (Staff+Free); 10–15 min Staff-only compromise; avoid 30 min alone |
| Schema / retention design | Deferred to **#675** |

---

## Sources (paths)

- STA client + timeout: `lib/ruijie/client.ts` (`RUIJIE_FETCH_TIMEOUT_MS`, `getGroupStaUsers`, `getDeviceClients`, `METRICS_DELAY_MS`, `enrichDevicesWithLiveMetrics`)
- Field types: `lib/ruijie/performance-metrics.ts` (`StaUserRaw`)
- Analytics honesty: `lib/network/analytics-aggregates.ts`, `components/admin/network/performance/GroupTrafficCards.tsx`
- Device traffic API notes: `app/api/ruijie/devices/[sn]/traffic/route.ts`
- Sync cadence: `lib/inngest/functions/ruijie-sync.ts`
- Traffic rollup pattern / retention / delays: `lib/inngest/functions/ruijie-traffic-rollup.ts`, `supabase/migrations/20260725151606_ruijie_traffic_rollups.sql`, `lib/network/analytics-aggregates.ts` (`buildHourlyRollupUpserts`)
- Peer 15-min metrics cron: `lib/inngest/functions/tarana-metrics-collection.ts`
- Endpoint inventory: `docs/plans/2026-07-09-phase0-network-foundation-spec.md` (§2.5.1 `sta_users`)
- Prior Fallback B: `docs/analysis/2026-07-31-site-usage-report-unjani-staff-wifi.md`
- Live census: Supabase `ruijie_device_cache` + `getGroupStaUsers` probe, 2026-07-31
