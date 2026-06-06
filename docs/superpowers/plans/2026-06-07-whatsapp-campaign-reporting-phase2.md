# WhatsApp Campaign Management Reporting Implementation Plan (Phase 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add durable management reporting (agent scorecard, area/suburb report, campaign funnel, daily trend) on top of the shipped Phase 1 sales cockpit, by persisting derived queue/SLA/location fields daily and exposing grouped aggregates through the existing report API and a new Reporting tab.

**Architecture:** Phase 1 derives sales queue, SLA state, and display fields at read-time from `campaign_ticket_snapshots`. Phase 2 makes those derivations *durable*: the daily Inngest job computes and stores `sales_queue`, `sla_status`, `last_inbound_at`, `last_outbound_at`, `coverage_outcome`, and `suburb` so historical trend/area reporting is possible without re-deriving from raw conversations. The report API gains a `?group=` parameter that returns pre-aggregated rollups; the page gains a Reporting tab that renders them. All queue/SLA logic continues to come from the single Phase 1 helper `lib/integrations/zoho/campaign-sales-ops.ts` — no duplicate derivation.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript, Tailwind, Supabase (Postgres), Inngest, Jest. Migration applied via the Supabase MCP `apply_migration` (Coolify deploy does NOT auto-apply migrations).

---

## Pre-Flight Gate (read before starting)

Phase 1 shipped to production on 2026-06-06. The original plan gates Phase 2 on **real operator usage** because the most useful reporting fields depend on which daily queue labels operators actually use. Before implementing:

- [ ] Confirm at least a few days of real campaign data exist in `campaign_ticket_snapshots` (so trend/area views have content).
- [ ] Confirm with the operator which Phase 1 queues they actually action (this validates the funnel stages below).

If neither is available yet, implement **Task 1–4 only** (migration + persistence + API), which are safe and additive, and defer **Task 5** (UI views) until there is data to shape them.

---

## Deferred Review Observations Folded In

Phase 1's final review surfaced three spec-compliant design decisions. Phase 2 resolves them:

1. **Closed-ticket handling** — `deriveSalesQueue` has no `Closed` branch, so a closed-but-unconverted ticket can surface under `needs_agent`. Task 2 adds a `closed` queue state.
2. **`first_response_at` = first-outbound proxy** — both `mapLiveCampaignTicketToSnapshot` and the Inngest `getFirstResponseAt` use the first outbound message, which mislabels an auto-welcome template as a "response." Task 2 changes the proxy to "first outbound that occurs after the first inbound," fixing both paths via the shared helper.
3. **`awaiting_details` + breached SLA ordering** — intentionally left as `sla_risk` in Phase 1. Task 2 keeps this behavior (an unanswered inbound is genuinely an SLA risk) but documents it; no code change.

---

## Current Facts

- Snapshot table: `campaign_ticket_snapshots` (see `supabase/migrations/archive/20260415_campaign_ticket_snapshots.sql`). Columns already include `lead_address`, `first_response_at`, `closed_at`, `conversations` (jsonb), `conversation_count`, `order_id`, `is_signed_up`, `insight_status`.
- Daily aggregate table: `campaign_report_snapshots` (written by Inngest step 7).
- Inngest job: `lib/inngest/functions/whatsapp-campaign-report.ts`. Step 5 (`upsert-ticket-snapshots`) builds the per-ticket rows; `getFirstResponseAt(conversations)` (line ~58) returns the first outbound timestamp.
- Phase 1 helper: `lib/integrations/zoho/campaign-sales-ops.ts` exports `enrichSalesTicket`, `deriveSalesQueue`, `deriveSlaStatus`, `getLastInboundAt`, `getLastOutboundAt`, `SalesQueue`, `SlaStatus`, `SalesOpsTicket`, `SalesOpsTicketInput`.
- Report API: `app/api/admin/whatsapp-campaign/report/route.ts` reads `date` and `live` query params only.
- Page: `app/admin/integrations/whatsapp-campaign/page.tsx` has `TABS` (overview/leads/agents/conversations) via `UnderlineTabs`/`TabPanel`.

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `supabase/migrations/20260607120000_campaign_sales_reporting_columns.sql` | Add durable reporting columns + indexes |
| Modify | `lib/integrations/zoho/campaign-sales-ops.ts` | Add `closed` queue state, fix first-response proxy, add `parseSuburb`, add `coverage_outcome` derivation |
| Modify | `lib/integrations/zoho/__tests__/campaign-sales-ops.test.ts` | Tests for the three additions |
| Create | `lib/integrations/zoho/campaign-reporting.ts` | Pure aggregation: agent scorecard, area, funnel, trend |
| Create | `lib/integrations/zoho/__tests__/campaign-reporting.test.ts` | Tests for aggregations |
| Modify | `lib/inngest/functions/whatsapp-campaign-report.ts` | Persist derived reporting fields in step 5 |
| Modify | `app/api/admin/whatsapp-campaign/report/route.ts` | `?group=agent\|area\|funnel\|trend` returns rollups |
| Modify | `app/admin/integrations/whatsapp-campaign/page.tsx` | Reporting tab rendering the four views |

---

## Sales Queue / SLA additions (Task 2 reference)

```ts
export type SalesQueue =
  | 'needs_agent' | 'sla_risk' | 'ready_to_sell' | 'waiting_on_customer'
  | 'coverage_issue' | 'unresponsive' | 'converted' | 'closed';   // <- 'closed' added

export type CoverageOutcome = 'covered' | 'no_coverage' | 'pending' | 'unknown';
```

Derivation order in `deriveSalesQueue` becomes:
1. `converted`: `is_signed_up || order_id`.
2. `closed`: `status === 'Closed'` (new — checked after converted so signed-up closed tickets still read as converted).
3. `coverage_issue`: `insight_status === 'no_coverage'`.
4. `unresponsive`: `insight_status === 'unresponsive'`.
5. `sla_risk` / `needs_agent` / `ready_to_sell` / `waiting_on_customer` / fallback — unchanged from Phase 1.

---

## Task 1: Reporting Columns Migration

**Files:**
- Create: `supabase/migrations/20260607120000_campaign_sales_reporting_columns.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260607120000_campaign_sales_reporting_columns.sql`:

```sql
-- Durable reporting columns for the WhatsApp campaign sales cockpit (Phase 2).
-- Persisted daily by the campaign-report Inngest job so trend/area/funnel
-- reporting does not need to re-derive from raw conversations.

ALTER TABLE campaign_ticket_snapshots
  ADD COLUMN IF NOT EXISTS sales_queue       text,
  ADD COLUMN IF NOT EXISTS sla_status        text,
  ADD COLUMN IF NOT EXISTS last_inbound_at   timestamptz,
  ADD COLUMN IF NOT EXISTS last_outbound_at  timestamptz,
  ADD COLUMN IF NOT EXISTS coverage_outcome  text,
  ADD COLUMN IF NOT EXISTS suburb            text;

CREATE INDEX IF NOT EXISTS idx_campaign_tickets_sales_queue
  ON campaign_ticket_snapshots(sales_queue);

CREATE INDEX IF NOT EXISTS idx_campaign_tickets_suburb
  ON campaign_ticket_snapshots(suburb);

CREATE INDEX IF NOT EXISTS idx_campaign_tickets_coverage_outcome
  ON campaign_ticket_snapshots(coverage_outcome);
```

- [ ] **Step 2: Apply via Supabase MCP (NOT Coolify)**

Coolify deploys do not run migrations. Apply with the MCP tool `mcp__supabase__apply_migration` (project `agyjovdugmtopasyvlng`), name `campaign_sales_reporting_columns`, body = the SQL above.

- [ ] **Step 3: Verify columns exist**

Run (MCP `execute_sql`):

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'campaign_ticket_snapshots'
  AND column_name IN ('sales_queue','sla_status','last_inbound_at','last_outbound_at','coverage_outcome','suburb')
ORDER BY column_name;
```

Expected: 6 rows.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260607120000_campaign_sales_reporting_columns.sql
git commit -m "feat(whatsapp-campaign): add Phase 2 reporting columns migration"
```

---

## Task 2: Extend the Sales-Ops Helper (closed queue, response proxy, suburb, coverage)

**Files:**
- Modify: `lib/integrations/zoho/campaign-sales-ops.ts`
- Test: `lib/integrations/zoho/__tests__/campaign-sales-ops.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `lib/integrations/zoho/__tests__/campaign-sales-ops.test.ts` inside the existing `describe`:

```ts
  it('classifies a closed, unconverted ticket as closed (not needs_agent)', () => {
    const row = ticket({ status: 'Closed', insight_status: 'awaiting_agent' });
    expect(deriveSalesQueue(row, NOW)).toBe('closed');
  });

  it('keeps a signed-up closed ticket as converted', () => {
    const row = ticket({ status: 'Closed', is_signed_up: true });
    expect(deriveSalesQueue(row, NOW)).toBe('converted');
  });

  it('ignores an auto-welcome outbound sent before the first inbound when deriving first response', () => {
    const convs = [
      { id: 'o0', author: 'Bot', direction: 'out' as const, content: 'Welcome to CircleTel', timestamp: '2026-06-06T07:00:00.000Z', channel: 'whatsapp' },
      { id: 'i1', author: 'Lead', direction: 'in' as const, content: 'I need internet', timestamp: '2026-06-06T08:00:00.000Z', channel: 'whatsapp' },
    ];
    expect(getFirstResponseAfterInbound(convs)).toBeNull();
    const convs2 = [...convs, { id: 'o1', author: 'Agent', direction: 'out' as const, content: 'Sure!', timestamp: '2026-06-06T08:30:00.000Z', channel: 'whatsapp' }];
    expect(getFirstResponseAfterInbound(convs2)).toBe('2026-06-06T08:30:00.000Z');
  });

  it('parses suburb from a lead address', () => {
    expect(parseSuburb('15 Milner Road, Vaalview, Bloemfontein')).toBe('Vaalview');
    expect(parseSuburb('15 Milner Road')).toBe('15 Milner Road');
    expect(parseSuburb(null)).toBeNull();
  });

  it('derives coverage outcome from insight status', () => {
    expect(deriveCoverageOutcome('no_coverage')).toBe('no_coverage');
    expect(deriveCoverageOutcome('completed')).toBe('covered');
    expect(deriveCoverageOutcome('awaiting_details')).toBe('pending');
    expect(deriveCoverageOutcome('awaiting_agent')).toBe('unknown');
  });
```

Add the new imports at the top of the test file:

```ts
import {
  deriveSalesQueue,
  deriveSlaStatus,
  enrichSalesTicket,
  mapLiveCampaignTicketToSnapshot,
  summarizeSalesQueues,
  getFirstResponseAfterInbound,
  parseSuburb,
  deriveCoverageOutcome,
  type SalesOpsTicketInput,
} from '../campaign-sales-ops';
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
npx jest --runTestsByPath lib/integrations/zoho/__tests__/campaign-sales-ops.test.ts
```

Expected: FAIL — `getFirstResponseAfterInbound`, `parseSuburb`, `deriveCoverageOutcome` not exported; closed-queue assertions fail.

- [ ] **Step 3: Implement the additions**

In `lib/integrations/zoho/campaign-sales-ops.ts`:

(a) Extend the `SalesQueue` union and add a `CoverageOutcome` type:

```ts
export type SalesQueue =
  | 'needs_agent'
  | 'sla_risk'
  | 'ready_to_sell'
  | 'waiting_on_customer'
  | 'coverage_issue'
  | 'unresponsive'
  | 'converted'
  | 'closed';

export type CoverageOutcome = 'covered' | 'no_coverage' | 'pending' | 'unknown';
```

(b) Add a `closed` branch in `deriveSalesQueue`, immediately after the `converted` check:

```ts
  if (row.is_signed_up || row.order_id) return 'converted';
  if (row.status === 'Closed') return 'closed';
```

(c) Add the new helpers:

```ts
export function getFirstResponseAfterInbound(
  conversations: CampaignConversation[]
): string | null {
  const firstInboundIdx = conversations.findIndex((c) => c.direction === 'in');
  if (firstInboundIdx === -1) return null;
  const reply = conversations
    .slice(firstInboundIdx + 1)
    .find((c) => c.direction === 'out');
  return reply?.timestamp ?? null;
}

export function parseSuburb(address: string | null): string | null {
  if (!address) return null;
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  // "<street>, <suburb>, <city>" -> suburb; "<street>" -> street as-is.
  return parts.length >= 2 ? parts[1] : (parts[0] ?? null);
}

export function deriveCoverageOutcome(status: InsightStatus): CoverageOutcome {
  if (status === 'no_coverage') return 'no_coverage';
  if (status === 'completed' || status === 'in_progress' || status === 'signed_up') return 'covered';
  if (status === 'awaiting_details') return 'pending';
  return 'unknown';
}
```

(d) Update `mapLiveCampaignTicketToSnapshot` to use the corrected response proxy:

```ts
    first_response_at: getFirstResponseAfterInbound(conversations),
```

(replacing the previous `firstOutbound?.timestamp ?? null` line and the now-unused `firstOutbound` const).

- [ ] **Step 4: Run tests, verify pass**

```bash
npx jest --runTestsByPath lib/integrations/zoho/__tests__/campaign-sales-ops.test.ts
```

Expected: PASS (all existing + 5 new).

- [ ] **Step 5: Add `closed` to `summarizeSalesQueues` seed**

In `summarizeSalesQueues`, add `closed: 0,` to the initial accumulator so the `Record<SalesQueue, number>` is exhaustive (TypeScript will error otherwise).

- [ ] **Step 6: Type check + commit**

```bash
npm run type-check:memory
git add lib/integrations/zoho/campaign-sales-ops.ts lib/integrations/zoho/__tests__/campaign-sales-ops.test.ts
git commit -m "feat(whatsapp-campaign): closed queue + response/suburb/coverage helpers"
```

> NOTE: adding `closed` to `SalesQueue` makes `queueRank` in `page.tsx` (Phase 1) non-exhaustive. Task 5 Step 1 fixes that. If running type-check between Task 2 and Task 5, expect that one known error.

---

## Task 3: Persist Derived Reporting Fields in the Inngest Job

**Files:**
- Modify: `lib/inngest/functions/whatsapp-campaign-report.ts`

- [ ] **Step 1: Import the helpers**

Add to the imports from the sales-ops module (create the import if absent):

```ts
import {
  deriveSalesQueue,
  deriveSlaStatus,
  getLastInboundAt,
  getLastOutboundAt,
  getFirstResponseAfterInbound,
  parseSuburb,
  deriveCoverageOutcome,
} from '@/lib/integrations/zoho/campaign-sales-ops';
```

- [ ] **Step 2: Use the corrected response proxy in step 3**

Replace the local `getFirstResponseAt(conversations)` call (line ~194) with `getFirstResponseAfterInbound(conversations)`, and delete the now-unused local `getFirstResponseAt` function (lines ~58-61). This unifies the proxy with the read path.

- [ ] **Step 3: Compute + persist the new fields in step 5**

In the `upsert-ticket-snapshots` row builder, build a `SalesOpsTicketInput`-shaped object per ticket and derive the reporting fields. Add these properties to each row object:

```ts
        // --- Phase 2 derived reporting fields ---
        sales_queue: deriveSalesQueue({
          ticket_id: e.ticket.id,
          ticket_number: e.ticket.ticketNumber ?? null,
          subject: e.ticket.subject ?? null,
          status: e.ticket.status ?? null,
          assigned_agent: e.ticket.assigneeName ?? null,
          contact_name: e.ticket.contactName ?? null,
          contact_phone: e.ticket.contactPhone ?? null,
          contact_email: e.ticket.contactEmail ?? null,
          lead_name: e.profile.name ?? null,
          lead_email: e.profile.email ?? null,
          lead_phone: e.profile.phone ?? null,
          lead_address: e.profile.address ?? null,
          insight_status: e.insightStatus,
          is_signed_up: e.isSigned_up,
          order_id: e.orderId,
          zoho_created_at: e.ticket.createdTime ?? null,
          first_response_at: e.firstResponseAt,
          closed_at: e.ticket.closedTime ?? null,
          conversations: e.conversations,
          conversation_count: e.conversations.length,
        }),
        sla_status: deriveSlaStatus({
          status: e.ticket.status ?? null,
          first_response_at: e.firstResponseAt,
          zoho_created_at: e.ticket.createdTime ?? null,
        } as Parameters<typeof deriveSlaStatus>[0]),
        last_inbound_at: getLastInboundAt(e.conversations),
        last_outbound_at: getLastOutboundAt(e.conversations),
        coverage_outcome: deriveCoverageOutcome(e.insightStatus),
        suburb: parseSuburb(e.profile.address ?? null),
```

> To avoid the verbose inline object, the cleaner alternative is to import `enrichSalesTicket` and build the input once; either is acceptable, but keep derivation in the helper, never inline new logic here.

- [ ] **Step 4: Verify the job still builds/type-checks**

```bash
npm run type-check:memory
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/inngest/functions/whatsapp-campaign-report.ts
git commit -m "feat(whatsapp-campaign): persist derived reporting fields daily"
```

---

## Task 4: Aggregation Module + API Grouping

**Files:**
- Create: `lib/integrations/zoho/campaign-reporting.ts`
- Test: `lib/integrations/zoho/__tests__/campaign-reporting.test.ts`
- Modify: `app/api/admin/whatsapp-campaign/report/route.ts`

- [ ] **Step 1: Write failing tests for aggregations**

Create `lib/integrations/zoho/__tests__/campaign-reporting.test.ts`:

```ts
import { agentScorecard, areaReport, campaignFunnel, dailyTrend, type ReportingRow } from '../campaign-reporting';

function row(o: Partial<ReportingRow> = {}): ReportingRow {
  return {
    assigned_agent: 'Tamsyn',
    sales_queue: 'needs_agent',
    sla_status: 'ok',
    coverage_outcome: 'pending',
    suburb: 'Vaalview',
    is_signed_up: false,
    order_id: null,
    zoho_created_at: '2026-06-06T08:00:00.000Z',
    ...o,
  };
}

describe('campaign reporting aggregations', () => {
  it('agentScorecard counts assigned, sla breaches, ready, conversions per agent', () => {
    const rows = [
      row({ assigned_agent: 'Tamsyn', sla_status: 'breached' }),
      row({ assigned_agent: 'Tamsyn', sales_queue: 'ready_to_sell' }),
      row({ assigned_agent: 'Tamsyn', is_signed_up: true, sales_queue: 'converted' }),
      row({ assigned_agent: 'Sipho' }),
    ];
    const sc = agentScorecard(rows);
    const tam = sc.find((r) => r.agent === 'Tamsyn')!;
    expect(tam.assigned).toBe(3);
    expect(tam.slaBreaches).toBe(1);
    expect(tam.readyToSell).toBe(1);
    expect(tam.conversions).toBe(1);
  });

  it('areaReport groups by suburb with no-coverage + conversion counts', () => {
    const rows = [
      row({ suburb: 'Vaalview', coverage_outcome: 'no_coverage' }),
      row({ suburb: 'Vaalview', is_signed_up: true }),
      row({ suburb: 'Universitas' }),
    ];
    const ar = areaReport(rows);
    const vv = ar.find((r) => r.suburb === 'Vaalview')!;
    expect(vv.leads).toBe(2);
    expect(vv.noCoverage).toBe(1);
    expect(vv.conversions).toBe(1);
  });

  it('campaignFunnel counts each stage as a monotonic-ish breakdown', () => {
    const rows = [
      row(),                                   // lead, not responded
      row({ sla_status: 'responded' }),        // responded
      row({ coverage_outcome: 'covered' }),    // details/coverage
      row({ coverage_outcome: 'no_coverage' }),// coverage issue
      row({ order_id: 'o1', is_signed_up: true }), // order
    ];
    const f = campaignFunnel(rows);
    expect(f.leads).toBe(5);
    expect(f.responded).toBe(1);
    expect(f.coverageIssue).toBe(1);
    expect(f.orders).toBe(1);
  });

  it('dailyTrend buckets by created date (YYYY-MM-DD)', () => {
    const rows = [
      row({ zoho_created_at: '2026-06-05T09:00:00.000Z' }),
      row({ zoho_created_at: '2026-06-06T09:00:00.000Z', sla_status: 'breached' }),
      row({ zoho_created_at: '2026-06-06T11:00:00.000Z', is_signed_up: true }),
    ];
    const t = dailyTrend(rows);
    expect(t).toHaveLength(2);
    const d6 = t.find((d) => d.date === '2026-06-06')!;
    expect(d6.leads).toBe(2);
    expect(d6.slaBreaches).toBe(1);
    expect(d6.conversions).toBe(1);
  });
});
```

- [ ] **Step 2: Run, verify fail**

```bash
npx jest --runTestsByPath lib/integrations/zoho/__tests__/campaign-reporting.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the aggregation module**

Create `lib/integrations/zoho/campaign-reporting.ts`:

```ts
import type { SalesQueue, SlaStatus, CoverageOutcome } from './campaign-sales-ops';

export interface ReportingRow {
  assigned_agent: string | null;
  sales_queue: SalesQueue | null;
  sla_status: SlaStatus | null;
  coverage_outcome: CoverageOutcome | null;
  suburb: string | null;
  is_signed_up: boolean;
  order_id: string | null;
  zoho_created_at: string | null;
}

export interface AgentScore {
  agent: string;
  assigned: number;
  slaBreaches: number;
  readyToSell: number;
  conversions: number;
}

export function agentScorecard(rows: ReportingRow[]): AgentScore[] {
  const map = new Map<string, AgentScore>();
  for (const r of rows) {
    const agent = r.assigned_agent || 'Unassigned';
    const s = map.get(agent) ?? { agent, assigned: 0, slaBreaches: 0, readyToSell: 0, conversions: 0 };
    s.assigned += 1;
    if (r.sla_status === 'breached') s.slaBreaches += 1;
    if (r.sales_queue === 'ready_to_sell') s.readyToSell += 1;
    if (r.is_signed_up || r.order_id) s.conversions += 1;
    map.set(agent, s);
  }
  return Array.from(map.values()).sort((a, b) => b.assigned - a.assigned);
}

export interface AreaScore {
  suburb: string;
  leads: number;
  noCoverage: number;
  pendingCoverage: number;
  conversions: number;
}

export function areaReport(rows: ReportingRow[]): AreaScore[] {
  const map = new Map<string, AreaScore>();
  for (const r of rows) {
    const suburb = r.suburb || 'Unknown';
    const s = map.get(suburb) ?? { suburb, leads: 0, noCoverage: 0, pendingCoverage: 0, conversions: 0 };
    s.leads += 1;
    if (r.coverage_outcome === 'no_coverage') s.noCoverage += 1;
    if (r.coverage_outcome === 'pending') s.pendingCoverage += 1;
    if (r.is_signed_up || r.order_id) s.conversions += 1;
    map.set(suburb, s);
  }
  return Array.from(map.values()).sort((a, b) => b.leads - a.leads);
}

export interface Funnel {
  leads: number;
  responded: number;
  detailsCollected: number;
  coverageIssue: number;
  orders: number;
}

export function campaignFunnel(rows: ReportingRow[]): Funnel {
  return rows.reduce<Funnel>(
    (f, r) => {
      f.leads += 1;
      if (r.sla_status === 'responded') f.responded += 1;
      if (r.coverage_outcome === 'covered') f.detailsCollected += 1;
      if (r.coverage_outcome === 'no_coverage') f.coverageIssue += 1;
      if (r.is_signed_up || r.order_id) f.orders += 1;
      return f;
    },
    { leads: 0, responded: 0, detailsCollected: 0, coverageIssue: 0, orders: 0 }
  );
}

export interface TrendDay {
  date: string;
  leads: number;
  slaBreaches: number;
  conversions: number;
  noCoverage: number;
}

export function dailyTrend(rows: ReportingRow[]): TrendDay[] {
  const map = new Map<string, TrendDay>();
  for (const r of rows) {
    if (!r.zoho_created_at) continue;
    const date = r.zoho_created_at.slice(0, 10);
    const d = map.get(date) ?? { date, leads: 0, slaBreaches: 0, conversions: 0, noCoverage: 0 };
    d.leads += 1;
    if (r.sla_status === 'breached') d.slaBreaches += 1;
    if (r.is_signed_up || r.order_id) d.conversions += 1;
    if (r.coverage_outcome === 'no_coverage') d.noCoverage += 1;
    map.set(date, d);
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}
```

- [ ] **Step 4: Run, verify pass**

```bash
npx jest --runTestsByPath lib/integrations/zoho/__tests__/campaign-reporting.test.ts
```

Expected: PASS.

- [ ] **Step 5: Add `?group=` to the report API**

In `app/api/admin/whatsapp-campaign/report/route.ts`, in the standard (cached) mode after fetching `ticketsResult`, add grouping. Import at top:

```ts
import { agentScorecard, areaReport, campaignFunnel, dailyTrend } from '@/lib/integrations/zoho/campaign-reporting';
```

Before the final `NextResponse.json` of standard mode:

```ts
  const group = searchParams.get('group');
  if (group) {
    const rows = (ticketsResult.data ?? []) as Parameters<typeof agentScorecard>[0];
    const reporting =
      group === 'agent' ? { agent: agentScorecard(rows) }
      : group === 'area' ? { area: areaReport(rows) }
      : group === 'funnel' ? { funnel: campaignFunnel(rows) }
      : group === 'trend' ? { trend: dailyTrend(rows) }
      : null;
    if (reporting) {
      return NextResponse.json({ ...reporting, generatedAt: new Date().toISOString(), isLive: false });
    }
  }
```

- [ ] **Step 6: Type check + commit**

```bash
npm run type-check:memory
git add lib/integrations/zoho/campaign-reporting.ts lib/integrations/zoho/__tests__/campaign-reporting.test.ts app/api/admin/whatsapp-campaign/report/route.ts
git commit -m "feat(whatsapp-campaign): reporting aggregations + API grouping"
```

---

## Task 5: Reporting Tab UI

**Files:**
- Modify: `app/admin/integrations/whatsapp-campaign/page.tsx`

- [ ] **Step 1: Fix the `queueRank` exhaustiveness (from Task 2's new `closed` state)**

In the `enrichedTickets` sort, add `closed: 7` to the `queueRank` record so it stays exhaustive over `SalesQueue`.

- [ ] **Step 2: Add a Reporting tab + state**

Add `{ id: 'reporting', label: 'Reporting' }` to `TABS`. Add state and a fetch for grouped data:

```tsx
const [reporting, setReporting] = useState<{
  agent?: { agent: string; assigned: number; slaBreaches: number; readyToSell: number; conversions: number }[];
  area?: { suburb: string; leads: number; noCoverage: number; pendingCoverage: number; conversions: number }[];
  funnel?: { leads: number; responded: number; detailsCollected: number; coverageIssue: number; orders: number };
  trend?: { date: string; leads: number; slaBreaches: number; conversions: number; noCoverage: number }[];
} | null>(null);

useEffect(() => {
  if (activeTab !== 'reporting') return;
  (async () => {
    const groups = ['agent', 'area', 'funnel', 'trend'] as const;
    const results = await Promise.all(
      groups.map((g) =>
        fetch(`/api/admin/whatsapp-campaign/report?group=${g}`).then((r) => (r.ok ? r.json() : {}))
      )
    );
    setReporting(Object.assign({}, ...results));
  })();
}, [activeTab]);
```

- [ ] **Step 3: Render the four views in a Reporting TabPanel**

```tsx
<TabPanel id="reporting" activeTab={activeTab}>
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <SectionCard title="Agent Scorecard" icon={PiUsersBold}>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-200">
          <th className="pb-2 pr-4">Agent</th><th className="pb-2 pr-4">Assigned</th>
          <th className="pb-2 pr-4">SLA Breaches</th><th className="pb-2 pr-4">Ready</th><th className="pb-2">Conv.</th>
        </tr></thead>
        <tbody className="divide-y divide-slate-100">
          {(reporting?.agent ?? []).map((a) => (
            <tr key={a.agent}><td className="py-2 pr-4 font-medium text-slate-900">{a.agent}</td>
              <td className="py-2 pr-4">{a.assigned}</td>
              <td className="py-2 pr-4 text-red-600">{a.slaBreaches}</td>
              <td className="py-2 pr-4">{a.readyToSell}</td>
              <td className="py-2 text-emerald-600 font-medium">{a.conversions}</td></tr>
          ))}
        </tbody>
      </table>
    </SectionCard>

    <SectionCard title="Area Report" icon={PiChartBarBold}>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-200">
          <th className="pb-2 pr-4">Suburb</th><th className="pb-2 pr-4">Leads</th>
          <th className="pb-2 pr-4">No Coverage</th><th className="pb-2 pr-4">Pending</th><th className="pb-2">Conv.</th>
        </tr></thead>
        <tbody className="divide-y divide-slate-100">
          {(reporting?.area ?? []).map((a) => (
            <tr key={a.suburb}><td className="py-2 pr-4 font-medium text-slate-900">{a.suburb}</td>
              <td className="py-2 pr-4">{a.leads}</td>
              <td className="py-2 pr-4 text-red-600">{a.noCoverage}</td>
              <td className="py-2 pr-4 text-amber-600">{a.pendingCoverage}</td>
              <td className="py-2 text-emerald-600 font-medium">{a.conversions}</td></tr>
          ))}
        </tbody>
      </table>
    </SectionCard>

    <SectionCard title="Campaign Funnel" icon={PiChartBarBold}>
      {reporting?.funnel && (
        <div className="space-y-2">
          {([
            ['Leads', reporting.funnel.leads],
            ['Responded', reporting.funnel.responded],
            ['Details Collected', reporting.funnel.detailsCollected],
            ['Coverage Issue', reporting.funnel.coverageIssue],
            ['Orders', reporting.funnel.orders],
          ] as const).map(([label, value]) => {
            const pct = reporting.funnel!.leads > 0 ? Math.round((value / reporting.funnel!.leads) * 100) : 0;
            return (
              <div key={label} className="flex items-center gap-3">
                <span className="w-36 text-xs text-slate-600">{label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div className="bg-[#F5831F] h-2 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm text-slate-600 w-8 text-right">{value}</span>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>

    <SectionCard title="Daily Trend" icon={PiClockBold}>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-200">
          <th className="pb-2 pr-4">Date</th><th className="pb-2 pr-4">Leads</th>
          <th className="pb-2 pr-4">SLA Breaches</th><th className="pb-2 pr-4">No Cov.</th><th className="pb-2">Conv.</th>
        </tr></thead>
        <tbody className="divide-y divide-slate-100">
          {(reporting?.trend ?? []).map((d) => (
            <tr key={d.date}><td className="py-2 pr-4 font-medium text-slate-900">{d.date}</td>
              <td className="py-2 pr-4">{d.leads}</td>
              <td className="py-2 pr-4 text-red-600">{d.slaBreaches}</td>
              <td className="py-2 pr-4 text-amber-600">{d.noCoverage}</td>
              <td className="py-2 text-emerald-600 font-medium">{d.conversions}</td></tr>
          ))}
        </tbody>
      </table>
    </SectionCard>
  </div>
</TabPanel>
```

- [ ] **Step 4: Type check**

```bash
npm run type-check:memory
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/admin/integrations/whatsapp-campaign/page.tsx
git commit -m "feat(whatsapp-campaign): management reporting tab"
```

---

## Task 6: Verification

- [ ] **Step 1: Full targeted test run**

```bash
npx jest --runTestsByPath \
  lib/integrations/zoho/__tests__/campaign-sales-ops.test.ts \
  lib/integrations/zoho/__tests__/campaign-reporting.test.ts \
  lib/integrations/zoho/__tests__/desk-campaign-service.test.ts
```

Expected: all PASS.

- [ ] **Step 2: Type check**

```bash
npm run type-check:memory
```

Expected: PASS.

- [ ] **Step 3: Trigger the Inngest job once (staging) and confirm new columns populate**

Run the campaign-report function from the Inngest dev/staging dashboard (or wait for the daily cron), then (MCP `execute_sql`):

```sql
SELECT sales_queue, sla_status, suburb, coverage_outcome
FROM campaign_ticket_snapshots
WHERE sales_queue IS NOT NULL
LIMIT 10;
```

Expected: rows with populated derived fields.

- [ ] **Step 4: Manual browser check**

`npm run dev:memory` → `/admin/integrations/whatsapp-campaign` → Reporting tab shows all four views without console errors.

---

## Verification Commands

```bash
npx jest --runTestsByPath lib/integrations/zoho/__tests__/campaign-sales-ops.test.ts lib/integrations/zoho/__tests__/campaign-reporting.test.ts lib/integrations/zoho/__tests__/desk-campaign-service.test.ts
npm run type-check:memory
```

Migration is applied via MCP `apply_migration`, NOT by the Coolify deploy.

---

## Self-Review

- **Spec coverage:** Migration (Task 1), the four reporting views — agent scorecard, area, funnel, trend (Task 4 + Task 5), daily persistence (Task 3), and API grouping (Task 4) all map to the original Phase 2 sketch. The three deferred review observations are resolved in Task 2 (closed queue, response proxy) or explicitly retained (SLA ordering).
- **Placeholder scan:** No TBDs; every code step has concrete code. The one cross-task dependency (adding `closed` to `SalesQueue` breaks `queueRank`/`summarizeSalesQueues` exhaustiveness) is called out in Task 2 Step 6 and fixed in Task 2 Step 5 + Task 5 Step 1.
- **Type consistency:** `SalesQueue` (now 8 members), `CoverageOutcome`, `ReportingRow`, `AgentScore`, `AreaScore`, `Funnel`, `TrendDay` are defined once and reused across API, Inngest, and UI tasks. Helper names (`getFirstResponseAfterInbound`, `parseSuburb`, `deriveCoverageOutcome`) match between definition (Task 2) and use (Task 3/4).
- **Migration safety:** All `ADD COLUMN IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` — idempotent and additive (no data rewrite, no NOT NULL on existing rows).
