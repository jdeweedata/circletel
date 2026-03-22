# Sniper Sales Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing sales engine into a sniper-focused system that auto-creates zones from coverage data, tags them with campaigns, surfaces "where to sell this week" intelligence, and generates SEO coverage pages — all using free public data sources.

**Architecture:** Incremental upgrade in 4 phases across ~15 working days. Extends existing `lib/sales-engine/` services and `lib/inngest/functions/` orchestration. No new frameworks. Two new services (`demand-signal-service.ts`, `campaign-service.ts`), one new admin component (`SniperTargetCard.tsx`), one new public route (`/coverage/[suburb]`), and three database migrations.

**Tech Stack:** Next.js 15, TypeScript, Supabase (PostGIS), Inngest, Tailwind, shadcn/ui, OSM Overpass API

---

## File Structure

### Files to Create

| File | Responsibility |
|------|---------------|
| `supabase/migrations/20260322100000_sniper_engine_phase1.sql` | Schema additions for campaign tags, demand signals, auto-decision tracking |
| `lib/sales-engine/demand-signal-service.ts` | Aggregate coverage_check_logs by ward into demand scores |
| `lib/sales-engine/campaign-service.ts` | 6 campaign definitions (from PR #473), zone campaign tagging, Arlan routing |
| `app/api/admin/sales-engine/briefing/weekly/route.ts` | GET endpoint for the weekly sniper briefing |
| `components/admin/sales-engine/SniperTargetCard.tsx` | Zone focus card showing campaign + routing + rationale |
| `components/admin/sales-engine/ArlanWeeklyTargets.tsx` | Horizontal strip of Arlan deal targets per category |
| `app/coverage/[suburb]/page.tsx` | Public SEO coverage page per suburb |
| `app/coverage/[suburb]/not-found.tsx` | 404 fallback for invalid suburb slugs |
| `lib/seo/json-ld.tsx` | Reusable JSON-LD component for structured data |

### Files to Modify

| File | What Changes |
|------|-------------|
| `lib/tarana/client.ts:82-157` | Add `getAllRemoteNodes()` function (fetches RN devices) |
| `lib/inngest/functions/tarana-sync.ts:198-262` | Add step to count RNs per BN site, fix `active_connections: 0` |
| `lib/sales-engine/types.ts:15-71` | Add `campaign_tag`, `arlan_routing`, `seo_slug`, `demand_signal_count` to SalesZone and CreateZoneInput |
| `lib/sales-engine/zone-discovery-service.ts:349-401,539-608` | Add `autoProcessDiscoveryCandidates()`, thread campaign tags, call `tagZoneWithCampaign()` in `approveCandidate()` |
| `lib/sales-engine/briefing-service.ts:78-99` | Add `SniperTarget` type and `getWeeklyBriefing()` function |
| `lib/inngest/functions/sales-engine-orchestrator.ts:252-279` | Add steps: `aggregate-demand-signals`, `auto-approve-batch`, `tag-campaigns`, `refresh-osm-pois` |
| `app/admin/sales-engine/briefing/page.tsx` | Switch to weekly endpoint, add SniperTargetCard + ArlanWeeklyTargets sections |
| `lib/sales-engine/osm-poi-service.ts` | Add `refreshPoisFromOverpass()` for live Overpass API queries |

---

## Phase 1: Fix the Foundation (Days 1-3)

### Task 1: Database Migration — Sniper Engine Schema

**Files:**
- Create: `supabase/migrations/20260322100000_sniper_engine_phase1.sql`

- [ ] **Step 0: Verify schema first** (per `verify-schema-first.md` rule)

Run: `SELECT column_name FROM information_schema.columns WHERE table_name = 'coverage_check_logs' AND column_name IN ('latitude', 'longitude', 'session_id', 'has_coverage');` — must return all 4 columns for the `aggregate_demand_by_ward` function to work. Also verify `ward_demographics` has `centroid_lat` and `centroid_lng`.

- [ ] **Step 1: Write the migration**

Add campaign_tag, arlan_routing, seo_slug, demand_signal_count columns to sales_zones. Add auto_decision tracking to zone_discovery_candidates. Create coverage_demand_signals table with PostGIS function for aggregating coverage check logs by nearest ward.

Key elements:
- `campaign_tag TEXT` on `sales_zones`
- `arlan_routing TEXT CHECK (IN ('tarana_primary','arlan_primary','dual_funnel'))` on `sales_zones`
- `seo_slug TEXT UNIQUE` on `sales_zones`
- `demand_signal_count INTEGER DEFAULT 0` on `sales_zones`
- `auto_decision TEXT`, `auto_decided_at TIMESTAMPTZ`, `campaign_tag TEXT`, `arlan_only_zone BOOLEAN DEFAULT FALSE` on `zone_discovery_candidates`
- `coverage_demand_signals` table with (ward_code, week_start) unique constraint
- `aggregate_demand_by_ward(p_days)` PostGIS function that joins coverage_check_logs to nearest ward

- [ ] **Step 2: Apply the migration**

Run: Apply via Supabase MCP or dashboard.
Verify: Check that new columns exist on sales_zones and zone_discovery_candidates.

- [ ] **Step 3: Commit**

---

### Task 2: Fix `active_connections` — Fetch RN Count per BN

**Files:**
- Modify: `lib/tarana/client.ts:82-157`
- Modify: `lib/inngest/functions/tarana-sync.ts:198-262`

**Context:** `tarana_base_stations.active_connections` is always 0 (hardcoded at tarana-sync.ts:220). The TaranaRadio type has `deviceStatus: 1` for connected devices. Fix: fetch all RNs via `searchRadios('RN')`, group by `siteName`, count connected ones per site.

- [ ] **Step 1: Add `getAllRemoteNodes()` to `lib/tarana/client.ts`**

Calls `searchRadios('RN')` with pagination loop. Returns `TaranaRadio[]`. **Important:** MTN's RN fleet may exceed 5,000 devices. Must paginate: fetch in batches of 5,000 using `offset`, continue while `response.radios.length === limit`. Compare `response.totalCount` against collected count to detect truncation.

- [ ] **Step 2: Add `fetch-rn-counts` step to `tarana-sync.ts`**

Insert between Step 4 (get-existing-records, line 181) and Step 5 (upsert-records, line 199). Fetches all RNs, builds `Record<string, number>` mapping siteName to count of RNs with `deviceStatus === 1`.

- [ ] **Step 3: Fix the hardcode at line 220**

Change `active_connections: 0` to `active_connections: rnCountsBySite[bn.siteName ?? ''] ?? 0`.

- [ ] **Step 4: Verify**

Trigger manual sync. Check: `SELECT site_name, active_connections FROM tarana_base_stations WHERE active_connections > 0 LIMIT 10;`

- [ ] **Step 5: Commit**

---

### Task 3: Update Sales Engine Types

**Files:**
- Modify: `lib/sales-engine/types.ts:15-71`

**PREREQUISITE:** Task 1 migration must be applied before this task.

- [ ] **Step 1: Add fields to `SalesZone` interface** (after line 50)

```typescript
campaign_tag: string | null;
campaign_tagged_at: string | null;
arlan_routing: 'tarana_primary' | 'arlan_primary' | 'dual_funnel';
seo_slug: string | null;
demand_signal_count: number;
```

- [ ] **Step 2: Add fields to `CreateZoneInput` interface** (after line 70)

```typescript
campaign_tag?: string;
arlan_routing?: 'tarana_primary' | 'arlan_primary' | 'dual_funnel';
seo_slug?: string;
```

- [ ] **Step 3: Add fields to `ZoneDiscoveryCandidate` interface** (around line 520)

```typescript
auto_decision: 'auto_approved_high' | 'auto_approved_passive' | 'rejected' | null;
auto_decided_at: string | null;
campaign_tag: string | null;
arlan_only_zone: boolean;
```

- [ ] **Step 4: Run type check** — `npm run type-check:memory`
- [ ] **Step 5: Commit**

---

### Task 4: Demand Signal Service

**Files:**
- Create: `lib/sales-engine/demand-signal-service.ts`

- [ ] **Step 1: Create the service**

Exports:
- `aggregateDemandSignals(days?: number)` — calls `aggregate_demand_by_ward` RPC, upserts into `coverage_demand_signals` table
- `getDemandForZone(centerLat, centerLng, radiusKm?)` — returns demand score + check count for a zone location

Follows existing `ServiceResult<T>` pattern. Uses `createClient()` from `@/lib/supabase/server`.

- [ ] **Step 2: Run type check**
- [ ] **Step 3: Commit**

---

### Task 5: Campaign Service

**Files:**
- Create: `lib/sales-engine/campaign-service.ts`

- [ ] **Step 1: Create the service**

Exports:
- `CampaignTag` type — union of 6 campaign tags from PR #473
- `ArlanRouting` type — `'tarana_primary' | 'arlan_primary' | 'dual_funnel'`
- `CAMPAIGN_DEFINITIONS` array — 6 campaigns with active_months, eligible_zone_types, requires_tarana, requires_dfa, arlan_deal_categories, primary_product, priority_boost
- `determineArlanRouting(baseStationCount, dfaConnectedCount)` — pure function
- `selectCampaignForZone(zone, currentMonth?)` — filters by month, zone type, infrastructure
- `generateSlug(name, province?)` — URL-safe slug
- `tagZoneWithCampaign(zoneId)` — reads zone, computes tag + routing, updates DB
- `tagAllActiveZones()` — tags untagged or stale zones

Campaign definitions match PR #473:
1. Business Boost Launch (Apr-May, Arlan)
2. Free Installation Summer (Jun-Aug, Tarana SMB)
3. Arlan Volume Blitz (Jun+, referral)
4. Switch & Save (Sep-Nov, competitor response)
5. Enterprise Connect (Sep+, DFA)
6. FY Fresh Start (Jan-Mar, bundles)

- [ ] **Step 2: Run type check**
- [ ] **Step 3: Commit**

---

### Task 6: Auto-Zone Creation + Campaign Integration

**Files:**
- Modify: `lib/sales-engine/zone-discovery-service.ts:349-401,539-608`

**PREREQUISITES:** Tasks 1 (migration), 3 (types), 4 (demand service), and 5 (campaign service) must all be committed before this task.

- [ ] **Step 1: Add imports** — import `tagZoneWithCampaign`, `generateSlug`, `determineArlanRouting` from campaign-service

- [ ] **Step 2: Thread campaign fields into candidate construction** (line 362-401)

Add `campaign_tag: null` and `arlan_only_zone: row.nearby_base_stations === 0 && row.nearby_dfa_connected === 0` to candidate object and insertRows mapping.

- [ ] **Step 3: Add campaign tagging to `approveCandidate()`** (after line 590)

After `enrichZoneDemographics()`, call `tagZoneWithCampaign(newZone.id)` and generate + persist SEO slug. Wrap in try/catch — campaign tagging is supplementary.

- [ ] **Step 4: Add `autoProcessDiscoveryCandidates(batchId)` function**

Score thresholds:
- >= 70: `approveCandidate(id, { priority: 'high' }, 'system-auto')` + auto_decision = 'auto_approved_high'
- 50-69: `approveCandidate(id, { priority: 'low' }, 'system-auto')` + auto_decision = 'auto_approved_passive'
- < 50: `rejectCandidate(id, 'Score below 50')` + auto_decision = 'rejected'

Each candidate wrapped in its own try/catch so one failure doesn't block the batch.

- [ ] **Step 5: Run type check**
- [ ] **Step 6: Commit**

---

### Task 7: Wire Phase 1 into Inngest Orchestrator

**Files:**
- Modify: `lib/inngest/functions/sales-engine-orchestrator.ts:252-279`

- [ ] **Step 1: Add `aggregate-demand-signals` step** before zone discovery

Calls `aggregateDemandSignals(30)`. Wrapped in try/catch with graceful failure.

- [ ] **Step 2: Add `auto-approve-candidates` step** after zone discovery

Fetches latest pending batch_id, calls `autoProcessDiscoveryCandidates(batchId)`.

- [ ] **Step 3: Add `tag-zone-campaigns` step** after auto-approval

Calls `tagAllActiveZones()`. Idempotent — only tags untagged or stale zones.

- [ ] **Step 4: Run type check**
- [ ] **Step 5: Commit**

---

## Phase 1 Validation Gate

- [ ] Trigger manual Tarana sync — confirm `active_connections > 0` for some BNs
- [ ] Trigger weekly review event — confirm demand signals aggregated, zones auto-approved, campaigns tagged, SEO slugs generated
- [ ] Jeff reviews 10 sample zones for scoring accuracy

---

## Phase 2: Sniper Briefing (Days 4-7)

### Task 8: Weekly Briefing Service

**Files:**
- Modify: `lib/sales-engine/briefing-service.ts:78-99`
- Create: `app/api/admin/sales-engine/briefing/weekly/route.ts`

- [ ] **Step 1: Add `SniperTarget` interface** (after DailyBriefing, line 99)

Fields: zone_id, zone_name, zone_type, suburb, province, composite_score, routing (ArlanRouting), campaign_tag, campaign_name, rationale (string[]), primary_product, arlan_deal_categories, estimated_zone_mrr, demand_signal_count, demand_checks_last_7d, unworked_leads, open_deals, stalled_deals, coverage_confidence, business_poi_density, pct_no_internet

- [ ] **Step 2: Add `ArlanWeeklyTargets` interface**

Per-category target/current pairs for data_connectivity, backup_connectivity, iot_m2m, fleet_management, made_for_business.

- [ ] **Step 3: Add `WeeklyBriefing` interface** extending `DailyBriefing`

Adds: sniper_targets, arlan_weekly_targets, weekly_focus_summary.

- [ ] **Step 4: Add `getWeeklyBriefing()` function**

**Error handling:** If `getDailyBriefing()` returns `{ data: null, error }`, propagate immediately: `return { data: null, error }`. Follow the `ServiceResult<T>` pattern.

1. Call `getDailyBriefing()` for base data — if null, return error immediately
2. Fetch top 5 active zones ordered by `enriched_zone_score` DESC (more reliably populated than `propensity_score` which may be 0 for new zones). Filter out zones where `enriched_zone_score = 0`.
3. For each zone: count unworked leads, open/stalled pipeline deals, recent demand checks
4. Build rationale array from actual data
5. Build deterministic weekly_focus_summary string (no LLM)
6. Return WeeklyBriefing extending daily data

- [ ] **Step 5: Create API route** at `app/api/admin/sales-engine/briefing/weekly/route.ts`

Simple GET handler calling `getWeeklyBriefing()`.

- [ ] **Step 6: Run type check**
- [ ] **Step 7: Commit**

---

### Task 9: Sniper Target Card Component

**Files:**
- Create: `components/admin/sales-engine/SniperTargetCard.tsx`
- Create: `components/admin/sales-engine/ArlanWeeklyTargets.tsx`

- [ ] **Step 1: Create `SniperTargetCard`**

Props: `{ target: SniperTarget; rank: number }`. Renders:
- Rank number badge + zone name + suburb
- Score out of 100
- Routing badge (TARANA / ARLAN ONLY / DUAL FUNNEL) with color coding
- Campaign badge (purple)
- Rationale bullet list
- "LEAD WITH" box showing primary_product + arlan deal categories
- 3-column stats: Businesses | Demand Signals | Unworked Leads

- [ ] **Step 2: Create `ArlanWeeklyTargets`**

Props: `{ targets: ArlanWeeklyTargets }`. Renders 5-column grid showing current/target per Arlan deal category (Data: 0/3, Backup: 0/2, IoT: 0/2, Fleet: 0/1, MfB: 0/2).

- [ ] **Step 3: Commit**

---

### Task 10: Upgrade Briefing Page

**Files:**
- Modify: `app/admin/sales-engine/briefing/page.tsx`

- [ ] **Step 1: Read the existing page** to understand fetch + render patterns
- [ ] **Step 2: Switch API endpoint** from `/api/admin/sales-engine/briefing` to `/api/admin/sales-engine/briefing/weekly`
- [ ] **Step 3: Add imports** for SniperTargetCard, ArlanWeeklyTargets, WeeklyBriefing type
- [ ] **Step 4: Add Weekly Focus Summary** banner (orange-50 bg) at top
- [ ] **Step 5: Add Sniper Targets** grid (1-3 columns, up to 5 cards) below summary
- [ ] **Step 6: Add Arlan Weekly Targets** strip below sniper targets
- [ ] **Step 7: Keep existing sections** (Priority Calls, Stalled Deals, etc.) below
- [ ] **Step 8: Run type check**
- [ ] **Step 9: Commit**

---

## Phase 2 Validation Gate

- [ ] Navigate to `/admin/sales-engine/briefing` — confirm sniper targets render
- [ ] Jeff uses the briefing for 1 week of sales activity

---

## Phase 3: SEO Coverage Pages (Days 8-12)

### Task 11: JSON-LD Component

**Files:**
- Create: `lib/seo/json-ld.tsx`

- [ ] **Step 1: Create reusable JSON-LD component**

A server component that safely renders structured data:

```typescript
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      // Content is from our own database, not user input
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

- [ ] **Step 2: Commit**

---

### Task 12: Public Coverage Page Route

**Files:**
- Create: `app/coverage/[suburb]/page.tsx`
- Create: `app/coverage/[suburb]/not-found.tsx`

- [ ] **Step 1: Create the coverage page**

Server component with:
- `generateStaticParams()` — fetches active zones with seo_slug and high/medium coverage confidence
- `generateMetadata()` — SEO title + description using suburb name and CONTACT constants
- `revalidate = 86400` for daily ISR
- Page structure: Hero (dark bg) with H1 "Business Internet Available in [Suburb]" + dual CTAs (Check Address + WhatsApp) → Available Services grid (SkyFibre if Tarana, BizFibreConnect if DFA, MTN Business 5G/LTE always) → CTA section
- Uses `CONTACT` and `getWhatsAppLink` from `@/lib/constants/contact`
- JSON-LD: Service schema using the JsonLd component from Task 11

- [ ] **Step 2: Create not-found page**

Simple centered layout with "Coverage area not found" + link to /order/coverage.

- [ ] **Step 3: Run type check**
- [ ] **Step 4: Commit**

---

## Phase 4: OSM Overpass Refresh (Days 13-15)

### Task 13: OSM Overpass Live Queries

**Files:**
- Modify: `lib/sales-engine/osm-poi-service.ts`
- Modify: `lib/inngest/functions/sales-engine-orchestrator.ts`

- [ ] **Step 1: Add `refreshPoisFromOverpass()` to osm-poi-service.ts**

Builds Overpass QL query for business/office/healthcare POIs within radius of a center point. Fetches from `https://overpass-api.de/api/interpreter`. Classifies results using existing `classifyPOI()` function. Updates `ward_demographics` POI counts.

- [ ] **Step 2: Add `refreshTopWardPois(limit?)` function**

Fetches top N wards by demographic_fit_score, calls `refreshPoisFromOverpass()` for each with 1.5s delay between requests (Overpass rate limiting).

- [ ] **Step 3: Add `refresh-osm-pois` step to weekly orchestrator**

After `tag-zone-campaigns`. Calls `refreshTopWardPois(30)`. Wrapped in try/catch.

- [ ] **Step 4: Run type check**
- [ ] **Step 5: Commit**

---

## Final Validation

- [ ] Run full type check: `npm run type-check:memory`
- [ ] Run production build: `npm run build:memory`
- [ ] Verify weekly orchestrator runs end-to-end
- [ ] Verify `/admin/sales-engine/briefing` shows sniper targets
- [ ] Verify at least one `/coverage/[suburb]` page renders
- [ ] Verify Tarana sync populates `active_connections`

---

## What NOT to Build Yet

| Feature | When It Becomes Relevant |
|---------|-------------------------|
| Campaign management UI | Month 4+ when 7th campaign is added |
| WhatsApp campaign automation | After Phase 2 validation |
| Arlan deal tracking in pipeline | When Arlan commission exceeds R50K/mo |
| Public-facing zone map | When partner channel is active |
| AI-generated briefing summaries | When MD reads 10+ zones/week |
| Real-time demand signal updates | When check volume exceeds 1,000/day |
