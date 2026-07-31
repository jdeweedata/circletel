# Research: Unjani Staff Wi-Fi attribution vs site totals

**Date:** 2026-07-31  
**Ticket:** [#663](https://github.com/jdeweedata/circletel/issues/663) (Wayfinder map [#661](https://github.com/jdeweedata/circletel/issues/661))  
**Question:** Against primary sources (MikroTik SSID/VLAN fields, Ruijie STA/SSID APIs, rollups schema, Unjani site device links): can Staff Wi-Fi be separated from site totals for Unjani clinics with evidence? If not, what minimum instrumentation would unlock it?  
**Scope rule:** Do **not** invent TDX/ThinkWiFi patient metrics (see #664).

---

## Verdict

**No — not today, with evidence suitable for a Site Network Usage Report period (week / month / 60-day / custom).**

CircleTel can label Staff vs Hotspot SSIDs in MikroTik schema and can show **live** Ruijie STA client counts by SSID, but nothing in the persisted telemetry stack attributes **byte traffic** to Staff Wi-Fi separately from site (or group) totals over a reportable date range.

Patient Wi-Fi (TDX/ThinkWiFi) is out of scope here and must remain a separately labelled source when the product spec dual-sources Unjani reports.

---

## Evidence by primary source

### 1. MikroTik SSID / VLAN fields

| Path | What it proves |
|------|----------------|
| `supabase/migrations/archive/20260307000001_create_mikrotik_router_management.sql` | `mikrotik_routers.wifi_ssid_staff` (VLAN 10 Clinic Staff) and `wifi_ssid_hotspot` (VLAN 20) — **config cache / labels only** |
| `lib/types/mikrotik.ts` (`MikrotikWifiConfig`, `MikrotikInterface`) | Proxy model knows `vlan_id` + SSID, and interface `rx_bytes` / `tx_bytes` |
| `lib/mikrotik/proxy-client.ts` | `getStatus` / `getWifiConfig` can return interfaces + WiFi; sync path used in production is thinner |
| `lib/mikrotik/router-service.ts` (`syncRouterStatus`) | Persists online/offline, firmware, uptime, CPU, memory — **does not persist interface or VLAN byte counters** |
| Live DB (2026-07-31) | `mikrotik_routers` row count = **0** — SSID label inventory is empty in Supabase |

**Implication:** Design intent (VLAN 10 staff / VLAN 20 patient) is documented and typed, including Unjani hardware docs (`docs/products/01_ACTIVE_PRODUCTS/Unjani Clinics/unjani-hardware-document.md` §5). There is **no stored VLAN/SSID traffic series** to subtract Staff from site totals.

Admin UI default labels reinforce naming only, not metering: `app/admin/network/mikrotik/[id]/page.tsx` (“Staff Network (VLAN 10)”, default SSID `Unjani Clinic Staff`).

### 2. Ruijie STA / SSID APIs

| Path | What it proves |
|------|----------------|
| `lib/ruijie/client.ts` — `getGroupStaUsers` → `/sta/sta_users` (API V2.0.3 §2.5.1) | Live STA rows include `ssid`, rates, and `wifiUpDown` (mapped to `sessionBytes`) |
| `lib/ruijie/performance-metrics.ts` — `StaUserRaw` | `wifiUp` / `wifiDown` / `wifiUpDown` are **current-session** fields, not a historical rollup |
| `lib/network/analytics-aggregates.ts` — `aggregateSsidActivity` | Explicitly: “Client counts by SSID from live STA rows (**not byte traffic**)” |
| `components/admin/network/performance/GroupTrafficCards.tsx` | Empty-state copy: “Ruijie does not expose SSID byte traffic here” |
| `lib/ruijie/client.ts` — `getNetworkTraffic` → `/flow/show/hour` (API V2.0.3 §2.6.2) | Hourly `rxBytes`/`txBytes` per device SN — **no SSID / VLAN dimension** |
| `app/api/admin/network/analytics/route.ts` | Cached KPIs from rollups; live mode adds STA SSID **counts** only |

**Implication:** SSID is available for **point-in-time association counts**. Session byte fields are not persisted into a period series and are not used for Staff attribution. Aggregate flow used for throughput is whole-device / whole-group.

### 3. Rollups schema

| Path | What it proves |
|------|----------------|
| `supabase/migrations/20260725151606_ruijie_traffic_rollups.sql` | Columns: `group_id`, `group_name`, `hours_window`, `total_rx_bytes`, `total_tx_bytes`, rates, `raw_summary` — **no `ssid`, no `vlan_id`, no `device_sn`, no `corporate_site_id`** |
| `lib/inngest/functions/ruijie-traffic-rollup.ts` | After sync, picks one flow SN per `group_id` and upserts hourly group totals |
| Live DB (2026-07-31) | **408** rollup rows; groups include `9058218` (“Unjani”), `9124474` (“UnjanihAPaxS”), `8902292` (“Newgen Network”) |

**Implication:** Persisted CircleTel traffic is **group-aggregate**. Unjani clinics share Ruijie groups (many APs under one `group_id`), so even “site total” from rollups is not cleanly per-clinic without device↔site resolution — and Staff cannot be split either way.

### 4. Unjani site ↔ device links

| Path | What it proves |
|------|----------------|
| `supabase/migrations/archive/20260308000001_device_customer_linking.sql` | `ruijie_device_cache.corporate_site_id` → `corporate_sites` |
| `app/api/ruijie/devices/[sn]/link/route.ts` | Admin link/unlink API for corporate sites |
| `corporate_sites.ruijie_device_sn` (baseline / portal specs) | Reverse link used by portal health |
| `docs/plans/2026-07-29-bss-zoho-feature-roadmap.md` §1.4 | Ops note: linkage is a prerequisite for network-side segment reporting |
| Live DB (2026-07-31) | **22** Ruijie devices; **0** with `corporate_site_id`; **26** Unjani sites (`CT-UNJ-%`); **1** site with `ruijie_device_sn` (CT-UNJ-015 Jabulani → `G1UQ9C8000921`) |

Device names clearly encode clinic identity (e.g. `UNJANICLINICJABULANI`, `UNJANICLINICSKYCITY`), but the **authoritative FK link is almost entirely unpopulated**. Even a fully linked fleet would only unlock **site totals** from device-level flow — not Staff vs Patient byte split.

---

## What “separated from site totals” would require

For Unjani PDF dual-source labelling (Staff = CircleTel-attributable; Patient = TDX — separate ticket):

| Need | Available today? |
|------|------------------|
| Identify Staff SSID / VLAN 10 by site | Schema/types yes; live MikroTik inventory empty |
| Historical Staff byte totals over report periods | **No** |
| Subtract Staff from site aggregate without double-count vs Patient | **No** CircleTel Staff series; Patient must not be invented here |
| Map AP → `corporate_sites` for per-site PDF | Link columns exist; **0/22** corporate links, **1/26** site SN |

---

## Minimum instrumentation to unlock Staff Wi-Fi attribution

Ordered by leverage for CircleTel-owned Staff traffic (do not depend on inventing TDX patient numbers).

### Must-have (unblock Staff series)

1. **Device ↔ site linkage backfill**  
   - Set `ruijie_device_cache.corporate_site_id` (and preferably `corporate_sites.ruijie_device_sn`) for Unjani APs.  
   - Without this, Staff metrics cannot attach to the Site Network Usage Report unit.

2. **Persist SSID- or VLAN-keyed traffic samples on a schedule** — pick **one** SoR:

   **Preferred A — MikroTik VLAN interface counters (edge of truth for Staff)**  
   - Use proxy `getStatus` → `interfaces` with `type: 'vlan'` (or named VLAN 10 / staff bridge ports).  
   - Cron/Inngest: sample `rx_bytes`/`tx_bytes`, store **deltas** per `(mikrotik_router_id | corporate_site_id, vlan_id|ssid, captured_at)`.  
   - Resolve Staff via `wifi_ssid_staff` / VLAN 10 convention.  
   - Prerequisite: populate `mikrotik_routers` (currently 0 rows) and keep proxy credentials healthy.

   **Fallback B — Ruijie STA session-byte deltas by SSID**  
   - Periodically call `getGroupStaUsers`, group by `ssid` + device SN, persist delta of `wifiUpDown` (and/or `wifiUp`/`wifiDown`) for STAs whose SSID matches the site’s Staff SSID allow-list.  
   - Caveats: session resets, offline clients drop out, not as clean as VLAN counters; still better than inventing Staff from group rollups.  
   - Do **not** treat `/flow/show/hour` as SSID-split — it has no SSID field.

3. **Staff SSID allow-list per site (or estate default)**  
   - Source of truth: MikroTik `wifi_ssid_staff` when present; else explicit config table / convention validated against live STA SSIDs.  
   - Prevents mis-attributing guest/patient SSIDs if they appear on the same AP.

### Nice-to-have (report quality)

4. Optional device-level flow retention (SN + hour) so **site totals** are clinic-scoped even when many APs share a Ruijie `group_id` — orthogonal to Staff split but required for honest “site total” vs “Staff” on the PDF.  
5. Retention aligned to report windows (weekly / monthly / 60-day / ≤90-day custom) — rollups today retain ~14 days (`RETENTION_DAYS` in `ruijie-traffic-rollup.ts`).

### Explicitly out of scope for this ticket

- TDX/ThinkWiFi patient session or ad metrics (#664).  
- Using group `ruijie_traffic_rollups` as a proxy for Staff (would mislabel shared clinic + patient + multi-site group traffic as Staff).

---

## Answer for map #661 consumers

| Claim | Status |
|-------|--------|
| Can Staff Wi-Fi be separated from site totals **today** with evidence? | **No** |
| Can we show live Staff SSID **client counts**? | Yes (Ruijie STA), not suitable as period usage |
| Minimum unlock | Link APs→sites + persist VLAN-10 **or** Staff-SSID byte deltas; populate MikroTik inventory if choosing VLAN path |
| Patient metrics | Do not invent — separate source / #664 |

---

## Live snapshot (supporting census, 2026-07-31)

Queried via service role against production Supabase:

- Ruijie devices: 22; `corporate_site_id` set: **0**
- Unjani corporate sites: 26; with `ruijie_device_sn`: **1** (Jabulani)
- `mikrotik_routers`: **0**
- `ruijie_traffic_rollups`: 408 rows; Unjani traffic lives under shared groups `Unjani` / `UnjanihAPaxS`

---

## Sources (paths)

- MikroTik schema: `supabase/migrations/archive/20260307000001_create_mikrotik_router_management.sql`
- MikroTik types / proxy / sync: `lib/types/mikrotik.ts`, `lib/mikrotik/proxy-client.ts`, `lib/mikrotik/router-service.ts`
- Ruijie STA + flow: `lib/ruijie/client.ts`, `lib/ruijie/performance-metrics.ts`
- Aggregates + UI honesty: `lib/network/analytics-aggregates.ts`, `components/admin/network/performance/GroupTrafficCards.tsx`
- Rollups: `supabase/migrations/20260725151606_ruijie_traffic_rollups.sql`, `lib/inngest/functions/ruijie-traffic-rollup.ts`
- Site links: `supabase/migrations/archive/20260308000001_device_customer_linking.sql`, `app/api/ruijie/devices/[sn]/link/route.ts`
- Domain definition: `CONTEXT.md` (Site Network Usage Report)
- Topology intent: `docs/products/01_ACTIVE_PRODUCTS/Unjani Clinics/unjani-hardware-document.md`
