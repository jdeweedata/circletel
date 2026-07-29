# Phase 0 Spec — Network Management Foundation Fix

**Date:** 2026-07-09
**Parent roadmap:** `docs/plans/2026-07-09-in-app-network-management-roadmap.md`
**Status:** Ready for spike → plan → implement
**Blocking:** all subsequent network-management phases + the Revenue Assurance module

---

## 1. Context & Corrected Root Cause

The device detail page's Overview/Radio/traffic tabs render blank. Investigation of `lib/ruijie/client.ts` (2026-07-09) corrected the earlier assumptions:

| Earlier assumption | Reality (verified in code) |
|---|---|
| "getDeviceMetrics has an unhandled-rejection bug" | ❌ False. `getDeviceMetrics` (client.ts:326-353), `getDeviceClients` (:409), `getNetworkTraffic` (:789), `getAppFlow` (:838) **all try/catch and return empty on error.** The crash I saw was my own test-script bug (undefined device when env wasn't preloaded). |
| "CPU/mem 404s / is a bug" | ❌ Partly. `getDeviceMetrics` **hardcodes CPU/mem/radio/uptime to `null`** (getEmptyMetrics, :355) and only derives `online_clients` from the STA API. Comment says perf data "requires eWeb tunnel." |
| "The client uses wrong China-NOC endpoints" | ❌ False. The `/logbizagent/logbiz/api/*` paths it uses (sta_users, flow/show/hour) **are the documented international endpoints** (API doc §2.5.1, §2.6.2). |

**Actual root causes of the blank telemetry:**

1. **CPU/Memory is never fetched.** The Ruijie Cloud API documents **§2.6.6 Get Device CPU and Memory** at `GET /logbizagent/logbiz/api/sys/current_performance` — the client **never calls it**. This is the primary fix: implement it.
2. **Radio channel/utilization** has **no documented cloud endpoint** (eWeb-tunnel only). Accept as null; adjust the UI so it doesn't show empty progress bars, OR source later via eWeb (out of scope for Phase 0).
3. **Traffic/clients returning zero** — these use the correct documented endpoints; need the spike to confirm whether the zeros are *genuine* (no clients/traffic at test time) or a *request-param* issue (e.g. flow endpoint needs a building/time param). No endpoint change assumed until the spike says so.
4. **Noise:** `ruijieFetch` (:44-46) logs `await response.text()` on any non-OK — for HTML 404 pages that's 60KB per error. Cap it.
5. **No metrics history.** The cache stores only the latest status; even once CPU/mem works, there's nowhere to persist a time series for trends/alerts.

---

## 2. Goal & Success Criteria

**Goal:** the app shows real per-device performance where the cloud API can provide it, persists a metrics time series for history/alerting, and exposes a vendor-neutral device interface so MikroTik can slot in later — all without breaking the working inventory/status/logs/reboot/tunnel paths.

**Done means (all verified, evidence required):**
1. Opening an **online RAP2200(F)** device detail page shows a **non-null CPU% and Memory%** (sourced from §2.6.6).
2. `ruijie_device_metrics` table exists and **accumulates one snapshot per online device per 30-min sync** (verified: row count grows across two sync cycles).
3. Radio tab no longer shows misleading empty 0% bars when data is unavailable (shows "Not available via cloud — eWeb only").
4. A `NetworkDeviceAdapter` interface exists; the Ruijie implementation satisfies it and the app still builds (`npm run type-check:memory` clean for touched files).
5. `ruijieFetch` error logs are capped (≤500 chars); no 60KB HTML dumps.
6. `.claude/rules/ruijie-cloud-api.md` documents the verified cloud-eu endpoint set (which telemetry is/ isn't obtainable).
7. Existing device list, status, logs, reboot, tunnel flows still work (regression check).

**Out of scope (later phases):** alerting/notifications (Phase 1), historical charts UI (Phase 1), remote ops beyond existing reboot/tunnel (Phase 2), radio via eWeb scraping, MikroTik implementation (only the interface here).

---

## 3. Tasks

### Task 0.1 — Diagnostic spike *(GATE — informs 0.2/0.3)* — **S**
Write `scripts/diagnose-ruijie-telemetry.ts` (throwaway; delete or move to `scripts/diagnostics/` after). For 3 representative online devices — a **RAP2200(F)** (indoor AP, group 9058218), a **RAP62-OD** (outdoor AP, group 9124474 `UnjanihAPaxS`), and an **NBS switch** (Newgen group 8902292) — call each documented endpoint directly via `ruijieFetch` and record the raw `code`/shape:

| Capability | Endpoint (doc §) | Method |
|---|---|---|
| CPU/Memory | `/logbizagent/logbiz/api/sys/current_performance` (§2.6.6) | GET |
| Flow trend | `/logbizagent/logbiz/api/flow/show/hour` (§2.6.2) | POST `{groupId}` |
| Client online | `/logbizagent/logbiz/api/sta/sta_users` (§2.5.1) | POST `{groupId,pageIndex}` |
| Device detail (uptime?) | `/service/api/device/{sn}` (§2.6.3) | GET |
| Switch port status | `/service/api/conf/switch/device/{sn}/ports` (§2.6.7) | GET |

**Run with:** `set -a && source .env.local && set +a && npx tsx scripts/diagnose-ruijie-telemetry.ts`
**Deliverable:** a findings table (endpoint × device-type → works / empty / 404 + the exact param that works). This decides exactly what 0.2/0.3 implement. **Do not implement 0.2 before this is done.**

### Task 0.2 — Implement CPU/Memory (+ uptime if available) — **M**
In `lib/ruijie/client.ts`:
- Add a typed call to `/logbizagent/logbiz/api/sys/current_performance` for the device SN.
- Populate `metrics.cpu_usage` / `metrics.memory_usage` in `getDeviceMetrics` (keep the existing STA `online_clients` logic; keep try/catch + empty-on-error).
- If the spike shows `/service/api/device/{sn}` returns uptime/lastOnline, populate `uptime_seconds`.
- Update `DeviceMetrics` type in `lib/ruijie/types.ts` only if new fields are needed (reuse existing null-able fields first).
- **Radio:** if spike confirms no cloud source, leave null and update `app/admin/network/devices/[sn]/page.tsx` Radio tab to render an explicit "Not available via cloud API (eWeb only)" state instead of 0% bars.

### Task 0.3 — Traffic correctness + log hygiene — **S**
- Apply whatever param fix the spike identified for `/flow/show/hour` (or confirm zeros are genuine and leave as-is).
- In `ruijieFetch` (client.ts:44-46), truncate the error body to 500 chars before throwing/logging: `error.slice(0, 500)`.

### Task 0.4 — Metrics persistence (time series) — **M**
- **New migration** `supabase/migrations/<ts>_create_ruijie_device_metrics.sql`:
  ```sql
  create table if not exists ruijie_device_metrics (
    id            bigint generated always as identity primary key,
    sn            text not null,
    captured_at   timestamptz not null default now(),
    cpu_usage     numeric,
    memory_usage  numeric,
    online_clients integer,
    uptime_seconds bigint,
    status        text,
    source        text not null default 'ruijie',   -- vendor tag for multi-vendor
    raw           jsonb
  );
  create index on ruijie_device_metrics (sn, captured_at desc);
  -- RLS: service-role only (matches ruijie_device_cache convention)
  alter table ruijie_device_metrics enable row level security;
  ```
  Apply **manually to the shared prod DB** (project convention: Ruijie migrations are applied by hand, no CI step — see `ruijie_device_cache` history).
- Extend the sync path (`lib/inngest/functions/ruijie-sync.ts` + a helper in `lib/ruijie/sync-service.ts`) to, after `upsertDevices`, loop **online** devices and insert one `ruijie_device_metrics` snapshot each (call the 0.2 metrics fetch). **Rate-limit**: 100-200ms between per-device calls (≤55 devices → ~10s added to a 30-min cron; acceptable). Wrap per-device in try/catch so one failure doesn't abort the batch or the sync log.
- **Retention:** add a delete of rows older than 90 days to the existing `ruijie-tunnel-cleanup` (or a small step in sync) — keep it simple, no new cron.

### Task 0.5 — Vendor-neutral device interface — **S/M**
- Add `lib/network/adapter.ts` defining `NetworkDeviceAdapter` (vendor-neutral):
  ```ts
  interface NetworkDeviceAdapter {
    vendor: 'ruijie' | 'mikrotik';
    listDevices(): Promise<NetworkDevice[]>;
    getDevice(sn: string): Promise<NetworkDevice | null>;
    getMetrics(sn: string, groupId?: string): Promise<DeviceMetrics>;
    getClients(sn: string, groupId: string): Promise<NetworkClient[]>;
    getLogs(sn: string): Promise<NetworkLogEntry[]>;
    reboot(sn: string): Promise<{ success: boolean }>;
  }
  ```
- Provide `RuijieAdapter` that delegates to the existing `lib/ruijie/client.ts` functions (thin wrapper — **no behavior change**). Do **not** refactor callers yet; this is the seam for Phase 6. MikroTik adapter is a later phase.

### Task 0.6 — Document verified endpoints — **S**
- Write `.claude/rules/ruijie-cloud-api.md`: the verified cloud-eu endpoint set from the 0.1 spike (works/empty/unavailable per capability & device model), the module-level-env-capture gotcha (scripts must `source .env.local` before import), and that radio is eWeb-only. Add a Wrong-vs-Correct table per the `api-param-documentation.md` house style.

---

## 4. Global Constraints (apply to every task)

- **Never** flip `RUIJIE_MOCK_MODE`; work against live `cloud-eu`.
- Scripts importing `lib/ruijie/*`: **`set -a && source .env.local && set +a`** before `npx tsx` (auth.ts captures env at module load).
- Preserve the **audit-log invariant**: any new mutating call → `ruijie_audit_log`. (Phase 0 adds no new mutations except metrics inserts, which are not user actions.)
- Migrations applied **manually to the shared prod DB**; additive only; never drop/rename existing `ruijie_device_cache` columns.
- `npm run type-check:memory` clean for touched files before commit; branch off `main`, push to `staging` first, PR to `main`.
- Surgical changes only — do not refactor the working list/status/logs/reboot/tunnel code beyond wrapping it in the 0.5 adapter.

---

## 5. Verification Plan

1. **Spike (0.1):** findings table produced and reviewed before any implementation.
2. **CPU/mem (0.2):** re-run a read-only check against an online RAP2200(F) → cpu/mem non-null; screenshot the Overview tab on staging.
3. **Persistence (0.4):** `select count(*), max(captured_at) from ruijie_device_metrics` before and after two sync cycles → count increased, timestamps fresh.
4. **Log hygiene (0.3):** trigger a 404 path → confirm error log ≤500 chars.
5. **Adapter (0.5):** `type-check:memory` clean; `RuijieAdapter.listDevices()` returns the same 25 devices as `getAllDevices()`.
6. **Regression:** device list loads, a device reboots (test device only, with confirm), a tunnel launches — all still work on staging.
7. **Docs (0.6):** `.claude/rules/ruijie-cloud-api.md` committed.

---

## 6. Open Decisions / Risks

- **If the spike shows §2.6.6 CPU/mem returns empty/404 for RAP models on cloud-eu** → CPU/mem is genuinely eWeb-only; pivot 0.2 to "surface what IS available (clients, uptime, status) and mark CPU/mem/radio as eWeb-only in the UI." The spike is the decision point; don't pre-commit the fix.
- **Traffic zeros** may be genuine (clinics are low-traffic) — confirm with the spike against a busier group (Newgen) before assuming a bug.
- **Rate limits:** per-device metrics polling adds ~55 calls/sync; watch for Ruijie throttling (the debit/Zoho rate-limit lesson applies). If throttled, poll a subset or widen the interval.
- **Metrics table growth:** 55 devices × 48 syncs/day ≈ 2,640 rows/day; 90-day retention ≈ 240k rows — trivial for Postgres, index on (sn, captured_at) covers the query.
