# Coverage → Integrations Observability Split

**Date**: 2026-08-01
**Status**: Draft — awaiting approval
**Phase**: Standalone
**Source map**: `.scratch/coverage-integrations-split/` (9 tickets, all resolved)

## Overview

`/admin/coverage` shows "System Health: Unhealthy — Last request: Never — 0.0% success" permanently.
This is not stale data. It has no datastore.

`MTNCoverageMonitor` (`lib/coverage/mtn/monitoring.ts:52`) holds metrics in a module-singleton
array. Production runs as a container; the process answering the admin fetch is rarely the one that
recorded a coverage check, and everything resets on deploy. Only one of nine coverage clients ever
called it. `/admin/coverage/analytics` renders 413 lines of charts fed by `Math.random()`.
`/admin/coverage/configuration` is a hardcoded fake of the real `network_providers` table.

Meanwhile `integration_api_metrics` — a table shaped precisely for these numbers, live in the
baseline schema since November — has **zero writers** and one reader, and `mtn-coverage` has sat in
`integration_registry` the whole time.

This spec wires the second to the first and retires the first.

## Boundary rule

State it once; future work applies it without re-deriving it:

> **Provider-API observability belongs to Integrations. Coverage operations belong to Coverage.**

Observability = is the provider up, how fast, what error codes, how often. Applies to every
provider, not just coverage.
Operations = check this address, browse DFA buildings, view base stations, test a coordinate.

## Architecture

```
provider client call (fetch or axios)
        │
        ▼
recordProviderCall()                    ← the seam, fire-and-forget
        │
        ▼
provider_api_calls                      ← NEW, call-grain, 90d retention, no PII
        │
        ├──── (hourly cron :05) ───► integration_api_metrics   ← EXISTING, finally written
        │                                      │
        └──── (live, current hour) ────────────┤
                                               ▼
                               /admin/integrations/api-health
                               /admin/integrations/[slug]
```

## Schema

### New table: `provider_api_calls`

| Field | Type | Notes |
|---|---|---|
| `id` | `uuid` PK default `gen_random_uuid()` | |
| `integration_slug` | `text NOT NULL` REFERENCES `integration_registry(slug)` | FK gates recording — the row must exist first |
| `operation` | `text NOT NULL` | Normalised `METHOD host/path[#Operation]`. **Never** the query string or body |
| `province` | `text NULL` | Derived server-side from the coordinate before the call |
| `duration_ms` | `integer NOT NULL` | |
| `success` | `boolean NOT NULL` | See Classification |
| `error_code` | `text NULL` | Constrained taxonomy only |
| `cache_hit` | `boolean NOT NULL` | |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | Rollup + prune key |

Index: `(integration_slug, created_at DESC)`.
RLS: service-role insert; admin select — mirror the policies on `integration_api_metrics`.

**Explicitly excluded**: raw URL, query string, POST body, `BBOX`, address strings,
latitude/longitude, API keys, response bodies, free-text error messages, `request_id`, `session_id`,
`lead_id`, `customer_id`, `user_agent`, `ip_address`.

**Why no raw URL** — `lib/coverage/utils/geocoding.ts:85-87` puts the customer's address *and the
Google API key* in the request URL. Logging endpoints verbatim would write a live credential into an
admin-readable table on every geocode. `lib/coverage/mtn/wms-client.ts:272` puts a 100m `BBOX` around
the coordinate in the URL. This exclusion is a security control, not a style preference.

**Why no linkage** — with no address, coordinate, or identifier, the table is non-personal
operational telemetry, so retention is an ops decision rather than a legal one. Per-customer
debugging belongs in application logs, which already carry that context.

### Migration: widen `integration_type`

Four coverage upstreams are keyless public endpoints and fit none of the permitted values.

```sql
ALTER TABLE integration_registry
  DROP CONSTRAINT integration_registry_integration_type_check;
ALTER TABLE integration_registry
  ADD CONSTRAINT integration_registry_integration_type_check
  CHECK (integration_type = ANY (ARRAY['oauth','api_key','webhook_only','public']));
```

Adding a permitted value invalidates no existing row.

### Migration: registry rows

| slug | type | base_url | action |
|---|---|---|---|
| `mtn-coverage` | `public` | `https://mtnsi.mtn.co.za` | **UPDATE** — was `api_key`, and `base_url` was `https://www.mtn.co.za` (the marketing site) |
| `mtn-geocode` | `public` | `https://mtnsi.mtn.co.za/utils/geocode` | **INSERT** |
| `dfa` | `public` | `https://utility.arcgis.com/usrsvcs/servers/044304ebfe2140b18e6e50d1af16e9e0/rest/services/Hosted/PublicCoverage/FeatureServer` | **INSERT** — Esri/ArcGIS-hosted, note in description |
| `terrain-elevation` | `public` | `https://api.open-elevation.com` | **INSERT** — open-meteo fallback noted in description |
| `google-maps` | `api_key` | unchanged | none |

Use `INSERT … ON CONFLICT (slug) DO NOTHING`.

**Before changing `mtn-coverage.base_url`**, grep for readers — the current value feeds the health
probe this spec replaces and may have other consumers.

### Migration: `health_source`

```sql
ALTER TABLE integration_registry
  ADD COLUMN health_source text
  CHECK (health_source IN ('traffic','probe','none'));
```

⚠️ **Staging and production share one Supabase project.** No migration in this spec has been applied.
Each requires explicit approval before running.

## The recording seam

```ts
export interface ProviderCallRecord {
  integrationSlug: string;
  operation: string;
  province?: string | null;
  durationMs: number;
  success: boolean;
  errorCode?: string | null;
  cacheHit: boolean;
}

export async function recordProviderCall(r: ProviderCallRecord): Promise<void> {
  try {
    // service-role insert into provider_api_calls
  } catch {
    // swallowed by design — a logging failure must never fail a coverage check
  }
}
```

Called as `void recordProviderCall({…})` from a `finally`. **Not awaited.**

**Plain function, not a wrapper or base class.** `lib/coverage/providers/base-provider.ts` already
defines an abstract `BaseCoverageProvider` with `checkHealth()` and a `ProviderRegistry`. It has
**zero implementations** — the only `extends` is inside a docstring. An abstraction requiring
clients to restructure has already failed to be adopted in this codebase. Do not build a second one.

**Transport-agnostic is mandatory**, not incidental: `providers/dfa/dfa-coverage-client.ts:8` uses
**axios**; every other client uses **fetch**. A seam built as a fetch wrapper would silently miss DFA
— which is exactly how one instrumented client came to be mistaken for coverage-wide observability.

**Fire-and-forget is safe here** because production is a long-running Docker container on Coolify,
not serverless. Floating promises are not frozen mid-flight; the only loss window is container
shutdown during a deploy, which is acceptable for telemetry.

Rejected: awaiting the insert (six Supabase round trips added to a user-facing check);
`after()` from `next/server` (requires a request context, so it throws inside Inngest jobs like
`dfa-sync` — two write paths to keep correct); an in-process buffer (reintroduces exactly the
volatility that made `MTNCoverageMonitor` useless).

### Classification

`success` = **the call completed and returned a well-formed provider response.** Never the business
outcome.

| Observed | Classification |
|---|---|
| WMS 200, `features: [...]` | success |
| WMS 200, `features: []` | **success** — no coverage there is a valid answer |
| WMS 404 | fail — `LAYER_NOT_AVAILABLE` |
| WMS 5xx | fail — `SERVICE_UNAVAILABLE` |
| ArcGIS 200 with `data.error` | **fail** — `PROVIDER_ERROR` |
| ArcGIS 200, empty features | success |
| timeout / DNS / refused | fail — `TRANSPORT_ERROR` |

Shared codes: `TRANSPORT_ERROR`, `TIMEOUT`, `RATE_LIMITED`, `AUTH_FAILED`, `PROVIDER_ERROR`, plus
provider-specific ones. Existing `MTNErrorCode` values map in rather than being adopted wholesale.

**`FEATURE_INFO_EMPTY` must stop being an error code.** If empty coverage counts as failure, checking
uncovered rural addresses drives MTN to `degraded` — MTN's coverage gaps become CircleTel's health
alerts.

### Province derivation

Use `CoverageGeoValidator.getProvince(coordinates)` (`lib/coverage/mtn/geo-validation.ts:274`);
confirm it is reachable outside the MTN validator. **Do not** use
`CoverageLogger.extractProvinceFromAddress` (`lib/analytics/coverage-logger.ts:82`) — it string-matches
province names inside an address, requires holding the address, and is observably unreliable
(`province` is null across the sampled `coverage_check_logs` rows). Nullable: bulk calls with no
single coordinate leave it null.

## Adoption

Call-grain — one row per outbound HTTP call, attached at each client's lowest chokepoint.

All chokepoints below are **verified**, not assumed.

| Client | Chokepoint | Work | Slug |
|---|---|---|---|
| `mtn/wms-client.ts` | `private makeRequest(url)` at `:385` — every layer fetch flows through it | **one edit** | `mtn-coverage` |
| `mtn/wms-realtime-client.ts` | `private static queryLayer()` at `:255`, sole fetch at `:282` | **one edit** | `mtn-coverage` |
| `mtn/nad-client.ts` | single POST at `:129` | **one edit** | `mtn-geocode` |
| `mtn/geocoder.ts` | sole fetch at `:42` | **one edit** | `mtn-geocode` |
| `utils/geocoding.ts` | sole fetch at `:90` in `geocodeAddress`; `batchGeocode` (`:190`) delegates | **one edit** | `google-maps` |
| `terrain/elevation-client.ts` | `fetchElevationsFromApi()` at `:159` — **operation-grain exception, see below** | **one edit** | `terrain-elevation` |
| `providers/dfa/dfa-coverage-client.ts` | **none** — 5 direct `axios.get` sites | introduce a private `request()` helper, route all 5 through it | `dfa` |
| `providers/dfa/dfa-sync-service.ts` | **none** — 2 direct `axios.get` sites | same | `dfa` |

`lib/coverage/dfa/client.ts` is a dead stub (always returns `available: false`) and adopts nothing.

### Documented exception: `terrain/elevation-client.ts` is operation-grain

`fetchElevationsFromApi()` (`:159`) tries `fetchFromOpenElevation` (`:178`), catches, and falls back
to `fetchFromOpenMeteo` (`:202`). Recording that call-grain would produce **two rows, one failed** —
a 50% success rate, i.e. `down` under the health thresholds — for a request that was served
perfectly. That directly contradicts the rule that a fallback-served call is healthy.

Attach at `fetchElevationsFromApi` instead. One row per elevation request:

| Outcome | `success` | `operation` |
|---|---|---|
| open-elevation served it | `true` | `POST api.open-elevation.com/api/v1/lookup#lookup` |
| primary failed, open-meteo served it | `true` | `GET api.open-meteo.com/v1/elevation#fallback` |
| **both failed** | `false` | `…#exhausted`, `error_code = PROVIDER_ERROR` |

Fallback frequency stays visible through the `operation` string, so "open-elevation is failing
constantly" remains observable without it registering as an outage.

**This also fixes a silent failure.** When both APIs fail, `fetchElevationsFromApi` currently returns
`elevation_m: 0` for every coordinate — real coordinates with fabricated zero elevation — logged only
to `console.error`. Terrain-dependent predictions silently degrade instead of failing. Recording the
exhausted case makes that visible for the first time.

**Remove** `mtnCoverageMonitor.recordRequest` at `wms-client.ts:61` and `:127` — replaced, not merely
deleted. Note the existing call records **check-grain** (one row per `checkCoverage()` with
`layers: allLayers`, covering 6+ HTTP calls); the seam replaces it with call-grain.

**Audit each client for a chokepoint before editing.** Two `lib/coverage/` modules in this codebase
have turned out to have shadow twins (`dfa/client.ts` vs `providers/dfa/`, and
`analytics/coverage-logger.ts`). Do not trust this table without grepping.

## Rollup

New route `/api/cron/provider-metrics-rollup`, schedule `5 * * * *`. Five past the hour so
late-arriving fire-and-forget writes have landed.

Each run:

1. **Target hours** = the previous complete hour, **plus** any hour with rows in
   `provider_api_calls` but no corresponding row in `integration_api_metrics`, within the 90-day
   window.
2. **Recompute wholly from raw** and `UPSERT` on the existing unique constraint
   `(integration_slug, metric_date, metric_hour)`. Recompute — never increment. A retry or
   overlapping run must not double-count.
3. **Prune**: `DELETE FROM provider_api_calls WHERE created_at < now() - interval '90 days'`.

Gap backfill matters because the crontab runs on a single VPS that gets rebooted, redeployed and
occasionally fills its disk. A previous-hour-only job turns every missed run into a permanent,
undetected hole.

**p95**: `percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)` over the hour's raw rows.
Percentiles need the sample — this is why the raw table exists. Do not "simplify" it to incremental
counters later.

**`top_errors`**: JSONB array of `{ error_code, count }`, **codes only, top 5**. Never free-text
messages — a message can contain the request URL, reintroducing the coordinates and API key excluded
above.

**Null by design**: `rate_limit_quota`, `rate_limit_remaining`, `rate_limit_reset_at`,
`rate_limit_hits`. MTN publishes no rate-limit headers. Leave them null rather than inventing values.

### ⚠️ Scheduling — the step that is easy to miss

The **scheduler of record is the VPS crontab**, not Vercel — but the crontab is *generated from*
`vercel.json` by `ops/scheduler/generate-crontab.sh`
(`docs/architecture/CRON_SCHEDULE.md`, decision dated 2026-05-09).

1. Add to `vercel.json` `crons[]`: `{ "path": "/api/cron/provider-metrics-rollup", "schedule": "5 * * * *" }`
2. Add a function config entry with an appropriate `maxDuration`.
3. **On VPS 94.72.104.81, run `ops/scheduler/generate-crontab.sh | crontab -`.** Without this the
   job never fires.
4. The route must require `Authorization: Bearer $CRON_SECRET`, matching every existing entry.
5. **Do not add an Inngest cron trigger.** `CRON_SCHEDULE.md` documents active dual-fire risks where
   Inngest crons duplicate crontab entries, one rated CRITICAL on billing.

A rollup that looks wired and never fires would reproduce the exact failure this spec exists to fix.

## Health derivation

Written by the existing `/api/cron/integrations-health-check` (`*/30`), which remains the **sole
writer** of `health_status`. Two writers on different schedules would overwrite each other.

**Passive path — query `provider_api_calls` directly, not the rollup.** The rollup runs at `:05` and
health at `:00`/`:30`; deriving health from rollups would make it up to an hour stale.

| Condition (60-minute window) | Verdict | `health_source` |
|---|---|---|
| ≥ 5 calls, success ≥ 95% | `healthy` | `traffic` |
| ≥ 5 calls, success 80–95% | `degraded` | `traffic` |
| ≥ 5 calls, success < 80% | `down` | `traffic` |
| ≥ 5 calls, p95 > 10 000ms | `degraded` (override) | `traffic` |
| < 5 calls | fall through to probe | `probe` |
| probe unavailable | `unknown` | `none` |

Thresholds are tighter than the retired monitor's 85% because these are real customer checks — at
CircleTel's volume, one in twenty failing is already customer-visible.

`consecutive_failures` = consecutive non-healthy verdicts **regardless of source**, reset to 0 on any
`healthy`. A mixed meaning is a trap for later readers.

The column is `last_health_check_at`. (`app/api/admin/integrations/health/route.ts:143` renames it to
`health_last_checked_at` in the response shape — presentation, not drift.)

### Probes

**`mtn-coverage`** — replace `fetch('https://www.mtn.co.za')`
(`lib/integrations/health-check-service.ts:220`) with a real WMS `GetFeatureInfo`:

```
SERVICE=WMS  VERSION=1.3.0  REQUEST=GetFeatureInfo
LAYERS / QUERY_LAYERS = <layer>
INFO_FORMAT=application/json  FEATURE_COUNT=10
CRS=CRS:84  BBOX=<100m box around coordinate>
WIDTH=256  HEIGHT=256  I=128  J=128
```

Headers are mandatory (`.claude/rules/coding-standards.md`): `User-Agent: Mozilla/5.0 …`,
`Referer: https://www.mtn.co.za/`, `Origin: https://www.mtn.co.za`.
Healthy = HTTP 200 **and** `features.length > 0` with valid properties.

⚠️ **The candidate coordinate `{ lat: -26.2041, lng: 28.0473 }` is mock-fixture data from
`test-data.ts` and has never been validated against live MTN.** Validate it with one manual query
before shipping the probe.

**`dfa`** — do **not** write a new probe. `providers/dfa/dfa-coverage-client.ts:382` already
implements `checkHealth()` as `GET {baseUrl}/2?f=json`. It is currently uncalled and asserts only
`response.status === 200`, which is the ArcGIS trap. Fix the assertion (fail when `data.error` is
present) and wire it into `health-check-service.ts`.

**`terrain-elevation`** — a call served by the **open-meteo fallback is a success**. Health asks "can
we get elevation at all", not "did the primary answer". Otherwise the fallback defeats its own health
signal.

**Anti-bot**: a fixed-origin probe on a regular cadence carries moderate risk of being flagged by
MTN. Mitigations: jitter within the window, rotate layers, or probe one layer per run.

## Read path

`/admin/integrations/api-health` and `/admin/integrations/[slug]` **union** two sources:

- complete hours → `integration_api_metrics`
- the in-progress hour → computed live from `provider_api_calls`

Two queries, one rule: rolled-up hours are history, the current hour is live. This map exists because
`/admin/coverage` permanently read "Last request: Never"; a replacement that can be 59 minutes stale
during an incident would be a quieter version of the same failure. Cost is negligible — ~18k raw rows
in a 30-day window on an indexed table.

## Retirement

### Delete — each verified by inbound-reference grep

| Path | Verified because |
|---|---|
| `app/admin/coverage/page.tsx` | Only refs: 3 dashboard links + nav entry, both repointed |
| `app/admin/coverage/analytics/page.tsx` | Refs: nav entry + `product-map.ts:316`, both updated |
| `app/admin/coverage/monitoring/page.tsx` | Zero refs; not in nav |
| `app/admin/coverage/configuration/page.tsx` | Zero refs anywhere; not in nav |
| `components/admin/coverage/ApiMonitoringDashboard.tsx` | Sole consumer is `monitoring/page.tsx` |
| `lib/coverage/mtn/monitoring.ts` | Importers: `wms-client.ts:15` (replaced) + the two routes below |
| `app/api/coverage/mtn/monitoring/route.ts` | Consumers: deleted page + one test case removed below |
| `app/api/admin/coverage/monitoring/route.ts` | Sole consumer is `ApiMonitoringDashboard` |

### Keep — `mtn-maps/` was orphaned, not dead

`app/admin/coverage/mtn-maps/page.tsx` is 388 lines of working coordinate/map tester on a live
`/api/coverage/mtn/map-check` endpoint, absent from the nav. It is operational tooling, so the
boundary rule keeps it under Coverage. **Add a nav entry**; verify the endpoint responds first.

### Consequential edits

1. `app/admin/dashboard/page.tsx:272,310,359` — repoint `/admin/coverage` → `/admin/coverage/checker`.
2. `lib/agents/pm/context/product-map.ts:316` — remove the Analytics route entry, or the PM agent
   keeps advertising a deleted page.
3. `app/admin/coverage/testing/page.tsx:124-148` — remove the `testMonitoring()` case only. The rest
   of the page is unaffected.
4. `lib/admin/workspace-access.ts:96` — **no change**; prefix matching survives the redirect.

### Nav — `lib/admin/feature-registry.ts:319-325`

| Before | After |
|---|---|
| Dashboard → `/admin/coverage` | **Checker → `/admin/coverage/checker`** |
| Analytics → `/admin/coverage/analytics` | *(removed)* |
| Testing / Providers / Maps / Base Stations / DFA Buildings | unchanged |
| — | **MTN Maps → `/admin/coverage/mtn-maps`** |
| — | **API Health → `/admin/integrations/api-health`** |

Also check `feature-registry.ts:234-240` (quick-actions block) for knock-on effects.

### Root redirect

`/admin/coverage` → `/admin/coverage/checker` via `redirect()` in a server component, **temporary
(307), not permanent** — this is an internal admin reorganisation, not a public URL contract, and a
permanent redirect would be cached in admins' browsers.

## Adoption recipe — instrumenting a new provider

1. Ensure an `integration_registry` row exists with the right `integration_type` (`public` for
   keyless endpoints). The FK on `provider_api_calls` will reject anything else.
2. Find the client's lowest shared request helper. If none exists, introduce a small private one —
   do not instrument call sites individually.
3. In a `finally`, call `void recordProviderCall({…})` with a normalised `operation` string. Never
   pass a URL, query string, or body.
4. Define the provider's success rule using the Classification table. A 200 that carries an error
   envelope is a failure; an empty-but-valid result is a success.
5. Add a probe to `health-check-service.ts` only if the provider may go quiet for long stretches.
   Check whether the client already has a `checkHealth()` before writing one.

Ready to adopt: Tarana (TCS), Ruijie Cloud, Interstellio, NetCash, Zoho, Didit, Clickatell, Resend,
WhatsApp/Meta. None are wired by this spec.

## Design Decisions

1. **Split by concern, not by page** — observability moves to Integrations for *all* providers;
   coverage operations stay put. Applying this rule, not copying this spec, is what generalises.
2. **Thin raw log + rollup, not aggregate-only** — percentiles need the sample. Aggregate-only would
   have made p95 permanently unobtainable.
3. **No linkage, no PII** — keeps the telemetry table non-personal so retention is an ops decision.
   Deliberately does *not* inherit `coverage_check_logs`' unresolved privacy status.
4. **Plain function, not an abstraction** — `BaseCoverageProvider` proves that an abstraction
   requiring client restructuring does not get adopted here.
5. **Call-grain, not operation-grain** — knowing *which layer* is slow is the most useful thing the
   dashboard can say. **One documented exception**: `terrain/elevation-client.ts` is operation-grain,
   because call-grain over a primary/fallback pair would report a perfectly-served request as an
   outage.
6. **Passive health preferred, probe as fallback** — real user experience beats a synthetic ping, but
   a quiet provider still needs a signal.
7. **`health_source` is exposed** — "healthy from 40 real checks" and "healthy from one ping" are
   different claims and must not render identically.

## Success Criteria

- [ ] A real coverage check produces ≥1 row in `provider_api_calls` with a normalised `operation`
      and **no** URL, address, coordinate, or API key in any column
- [ ] A WMS 200 with `features: []` is recorded as `success = true`
- [ ] An ArcGIS 200 carrying `data.error` is recorded as `success = false`
- [ ] DFA calls (axios) are recorded, not just MTN calls (fetch)
- [ ] An elevation request served by the open-meteo **fallback** records as `success = true` with a
      `#fallback` operation, and does **not** push `terrain-elevation` toward `degraded`
- [ ] An elevation request where **both** APIs fail records as `success = false` rather than silently
      returning `elevation_m: 0`
- [ ] The rollup cron produces an `integration_api_metrics` row with a non-null `p95_response_time_ms`
- [ ] Deleting a rollup row and re-running the cron restores it identically (idempotent + backfills)
- [ ] `crontab -l` on the VPS shows the rollup entry after regeneration
- [ ] `/admin/integrations/api-health` shows `mtn-coverage` with a non-`unknown` status and
      `health_source = 'traffic'` after ≥5 real checks in an hour
- [ ] The same page reflects a check made 30 seconds ago (in-progress hour is live)
- [ ] `/admin/coverage` redirects to `/admin/coverage/checker`
- [ ] MTN Maps is reachable from the nav
- [ ] `npm run type-check:memory` passes
- [ ] No route in the app references `/api/coverage/mtn/monitoring` or
      `/api/admin/coverage/monitoring`

## Out of scope

- **Business coverage-check history** — `coverage_check_logs` already holds address, coordinates and
  lead linkage. It is half-built, not absent. See the map's ticket 09; a **separate, sign-off-gated**
  action minimises its `ip_address`/`user_agent` columns. `provider_api_calls` does not depend on it
  in either direction.
- **Adoption by non-coverage clients** — the seam is designed for them; this spec wires none.
- **Probe quality for other integrations** — `resend` deliberately 401s, `netcash` is skipped
  entirely. Same class of problem, different effort.
- **Deleting `lib/coverage/dfa/client.ts`** — dead stub shadowing the real module. Not observability
  work; check for importers before removing.
- **Terrain provider strategy** — `terrain/elevation-client.ts` depends on two free public APIs
  (open-elevation, open-meteo) with no SLA or contract. This spec makes that *visible*; whether to
  depend on them is a procurement question.
- **`BaseCoverageProvider`** — dead scaffolding, zero implementations. Retire separately.
