# WhatsApp Campaign Sales Cockpit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/admin/integrations/whatsapp-campaign` from a passive campaign report into a daily sales execution cockpit first, then add management reporting once the sales queue is reliable.

**Architecture:** Phase 1 uses existing `campaign_ticket_snapshots` fields plus pure TypeScript helpers to derive sales queues, SLA state, lead age, and action labels without a migration. The API live-refresh path is normalized to the same flattened row shape as the cached Supabase path, so the page behaves consistently whether data comes from snapshots or Zoho Desk. Phase 2 adds optional snapshot-enrichment columns for durable reporting and trend analysis.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript, Tailwind CSS, existing admin shared components, Supabase, Zoho Desk, Jest.

---

## Current Facts

- Route: `app/admin/integrations/whatsapp-campaign/page.tsx`
- Report API: `app/api/admin/whatsapp-campaign/report/route.ts`
- Zoho campaign service: `lib/integrations/zoho/desk-campaign-service.ts`
- Existing test file: `lib/integrations/zoho/__tests__/desk-campaign-service.test.ts`
- Snapshot table already has `first_response_at`, `closed_at`, `conversations`, `conversation_count`, `order_id`, and `is_signed_up`.
- Live API mode currently returns `{ ticket, conversations, profile, insightStatus }`, but the page expects flattened rows. Fix this before UI work.

---

## File Map

### Phase 1: Daily Sales Execution

| Action | File | Responsibility |
|---|---|---|
| Create | `lib/integrations/zoho/campaign-sales-ops.ts` | Pure helper functions for queue, SLA, display fallbacks, and live-row normalization |
| Create | `lib/integrations/zoho/__tests__/campaign-sales-ops.test.ts` | Unit tests for queue/SLA/normalization behavior |
| Modify | `app/api/admin/whatsapp-campaign/report/route.ts` | Return identical flattened ticket rows in cached and live modes |
| Modify | `app/admin/integrations/whatsapp-campaign/page.tsx` | Replace passive overview with sales queue, action stats, filters, and sales-useful CSV |

### Phase 2: Management Reporting

| Action | File | Responsibility |
|---|---|---|
| Create | `supabase/migrations/20260606120000_campaign_sales_reporting_columns.sql` | Add durable reporting columns after Phase 1 proves the queue model |
| Modify | `lib/inngest/functions/whatsapp-campaign-report.ts` | Persist derived reporting fields daily |
| Modify | `app/api/admin/whatsapp-campaign/report/route.ts` | Add management grouping query params |
| Modify | `app/admin/integrations/whatsapp-campaign/page.tsx` | Add reporting tab for agent, area, funnel, and trend views |

---

## Sales Queue Rules

Use these queue IDs in Phase 1:

```ts
export type SalesQueue =
  | 'needs_agent'
  | 'sla_risk'
  | 'ready_to_sell'
  | 'waiting_on_customer'
  | 'coverage_issue'
  | 'unresponsive'
  | 'converted';
```

Derivation order:

1. `converted`: `is_signed_up === true` or `order_id` is present.
2. `coverage_issue`: `insight_status === 'no_coverage'`.
3. `unresponsive`: `insight_status === 'unresponsive'`.
4. `sla_risk`: no `first_response_at`, inbound conversation exists, and lead age is 2 hours or more.
5. `needs_agent`: no `first_response_at` and inbound conversation exists.
6. `ready_to_sell`: details appear usable and no order exists. Treat `insight_status` of `completed` or `in_progress` with a phone or address as usable.
7. `waiting_on_customer`: `insight_status === 'awaiting_details'`.
8. Fallback: `needs_agent`.

SLA rule:

- `breached`: no first response and lead age is 2 hours or more.
- `at_risk`: no first response and lead age is 90 minutes to under 2 hours.
- `ok`: no first response and lead age is under 90 minutes.
- `responded`: `first_response_at` exists.
- `closed`: ticket status is `Closed`.

---

## Task 1: Add Sales-Ops Helper Tests

**Files:**
- Create: `lib/integrations/zoho/__tests__/campaign-sales-ops.test.ts`
- Create later in Task 2: `lib/integrations/zoho/campaign-sales-ops.ts`

- [ ] **Step 1: Write the failing test file**

Create `lib/integrations/zoho/__tests__/campaign-sales-ops.test.ts`:

```ts
import {
  deriveSalesQueue,
  deriveSlaStatus,
  enrichSalesTicket,
  mapLiveCampaignTicketToSnapshot,
  summarizeSalesQueues,
  type SalesOpsTicketInput,
} from '../campaign-sales-ops';
import type { CampaignConversation, CampaignTicket, LeadProfile } from '../desk-campaign-service';

const NOW = new Date('2026-06-06T10:00:00.000Z');

function ticket(overrides: Partial<SalesOpsTicketInput> = {}): SalesOpsTicketInput {
  return {
    ticket_id: 'ticket-1',
    ticket_number: '123',
    subject: 'Hello! Can I get more info on this?',
    status: 'Open',
    assigned_agent: null,
    contact_name: null,
    contact_phone: null,
    contact_email: null,
    lead_name: null,
    lead_email: null,
    lead_phone: null,
    lead_address: null,
    insight_status: 'awaiting_agent',
    is_signed_up: false,
    order_id: null,
    zoho_created_at: '2026-06-06T08:00:00.000Z',
    first_response_at: null,
    closed_at: null,
    conversations: [
      {
        id: 'conv-1',
        author: 'Lead',
        direction: 'in',
        content: 'I need internet',
        timestamp: '2026-06-06T08:00:00.000Z',
        channel: 'whatsapp',
      },
    ],
    conversation_count: 1,
    ...overrides,
  };
}

describe('campaign sales ops helpers', () => {
  it('puts unresponded leads older than two hours into SLA risk', () => {
    expect(deriveSlaStatus(ticket(), NOW)).toBe('breached');
    expect(deriveSalesQueue(ticket(), NOW)).toBe('sla_risk');
  });

  it('puts fresh unresponded inbound leads into needs agent', () => {
    const row = ticket({ zoho_created_at: '2026-06-06T09:15:00.000Z' });
    expect(deriveSlaStatus(row, NOW)).toBe('ok');
    expect(deriveSalesQueue(row, NOW)).toBe('needs_agent');
  });

  it('puts leads between 90 and 120 minutes without response into at-risk SLA', () => {
    const row = ticket({ zoho_created_at: '2026-06-06T08:20:00.000Z' });
    expect(deriveSlaStatus(row, NOW)).toBe('at_risk');
    expect(deriveSalesQueue(row, NOW)).toBe('needs_agent');
  });

  it('puts completed leads with contact details into ready to sell', () => {
    const row = ticket({
      insight_status: 'completed',
      first_response_at: '2026-06-06T08:10:00.000Z',
      lead_phone: '0831234567',
      lead_address: '15 Milner Road, Vaalview',
      conversation_count: 5,
    });
    expect(deriveSalesQueue(row, NOW)).toBe('ready_to_sell');
  });

  it('keeps no coverage and signed-up states ahead of operational queues', () => {
    expect(deriveSalesQueue(ticket({ insight_status: 'no_coverage' }), NOW)).toBe('coverage_issue');
    expect(deriveSalesQueue(ticket({ is_signed_up: true, insight_status: 'no_coverage' }), NOW)).toBe('converted');
  });

  it('normalizes live Zoho tickets into the same flattened shape as snapshot rows', () => {
    const zohoTicket: CampaignTicket = {
      id: 'z-ticket',
      ticketNumber: '456',
      subject: 'I want to know more',
      status: 'Open',
      assigneeName: 'Tamsyn',
      contactName: 'Zoho Contact',
      contactPhone: '0821112222',
      contactEmail: 'lead@example.com',
      createdTime: '2026-06-06T07:00:00.000Z',
      closedTime: null,
      tags: [],
    };
    const conversations: CampaignConversation[] = [
      {
        id: 'msg-1',
        author: 'Lead',
        direction: 'in',
        content: 'My address is 1 Main Road',
        timestamp: '2026-06-06T07:00:00.000Z',
        channel: 'whatsapp',
      },
    ];
    const profile: LeadProfile = {
      name: 'Lead Name',
      phone: '0831234567',
      email: 'lead.profile@example.com',
      address: '1 Main Road, Vaalview',
    };

    expect(mapLiveCampaignTicketToSnapshot({
      ticket: zohoTicket,
      conversations,
      profile,
      insightStatus: 'awaiting_agent',
      isSignedUp: false,
      orderId: null,
    })).toMatchObject({
      ticket_id: 'z-ticket',
      ticket_number: '456',
      assigned_agent: 'Tamsyn',
      contact_name: 'Zoho Contact',
      lead_name: 'Lead Name',
      lead_phone: '0831234567',
      insight_status: 'awaiting_agent',
      conversation_count: 1,
    });
  });

  it('summarizes queue counts from enriched tickets', () => {
    const rows = [
      enrichSalesTicket(ticket({ zoho_created_at: '2026-06-06T09:30:00.000Z' }), NOW),
      enrichSalesTicket(ticket({ ticket_id: 'ticket-2', insight_status: 'no_coverage' }), NOW),
      enrichSalesTicket(ticket({ ticket_id: 'ticket-3', is_signed_up: true }), NOW),
    ];
    expect(summarizeSalesQueues(rows)).toMatchObject({
      needs_agent: 1,
      coverage_issue: 1,
      converted: 1,
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- --runTestsByPath lib/integrations/zoho/__tests__/campaign-sales-ops.test.ts
```

Expected: FAIL because `../campaign-sales-ops` does not exist.

---

## Task 2: Implement Sales-Ops Helpers

**Files:**
- Create: `lib/integrations/zoho/campaign-sales-ops.ts`
- Test: `lib/integrations/zoho/__tests__/campaign-sales-ops.test.ts`

- [ ] **Step 1: Create the helper module**

Create `lib/integrations/zoho/campaign-sales-ops.ts`:

```ts
import type {
  CampaignConversation,
  CampaignTicket,
  InsightStatus,
  LeadProfile,
} from './desk-campaign-service';

export type SalesQueue =
  | 'needs_agent'
  | 'sla_risk'
  | 'ready_to_sell'
  | 'waiting_on_customer'
  | 'coverage_issue'
  | 'unresponsive'
  | 'converted';

export type SlaStatus = 'breached' | 'at_risk' | 'ok' | 'responded' | 'closed';

export interface SalesOpsTicketInput {
  ticket_id: string;
  ticket_number: string | null;
  subject: string | null;
  status: string | null;
  assigned_agent: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  lead_name: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  lead_address: string | null;
  insight_status: InsightStatus;
  is_signed_up: boolean;
  order_id: string | null;
  zoho_created_at: string | null;
  first_response_at: string | null;
  closed_at: string | null;
  conversations: CampaignConversation[];
  conversation_count: number;
}

export interface SalesOpsTicket extends SalesOpsTicketInput {
  sales_queue: SalesQueue;
  sla_status: SlaStatus;
  display_name: string;
  display_phone: string | null;
  display_email: string | null;
  lead_age_ms: number | null;
  first_response_ms: number | null;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
}

export interface LiveCampaignTicketParams {
  ticket: CampaignTicket;
  conversations: CampaignConversation[];
  profile: LeadProfile;
  insightStatus: InsightStatus;
  isSignedUp: boolean;
  orderId: string | null;
}

const SLA_BREACH_MS = 2 * 60 * 60 * 1000;
const SLA_AT_RISK_MS = 90 * 60 * 1000;

function timestampMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function getLastInboundAt(conversations: CampaignConversation[]): string | null {
  return conversations.filter((c) => c.direction === 'in').at(-1)?.timestamp ?? null;
}

export function getLastOutboundAt(conversations: CampaignConversation[]): string | null {
  return conversations.filter((c) => c.direction === 'out').at(-1)?.timestamp ?? null;
}

export function getLeadAgeMs(row: SalesOpsTicketInput, now = new Date()): number | null {
  const createdMs = timestampMs(row.zoho_created_at);
  if (createdMs === null) return null;
  return Math.max(0, now.getTime() - createdMs);
}

export function getFirstResponseMs(row: SalesOpsTicketInput): number | null {
  const createdMs = timestampMs(row.zoho_created_at);
  const responseMs = timestampMs(row.first_response_at);
  if (createdMs === null || responseMs === null) return null;
  return Math.max(0, responseMs - createdMs);
}

export function getDisplayName(row: SalesOpsTicketInput): string {
  return row.lead_name || row.contact_name || 'Unknown lead';
}

export function getDisplayPhone(row: SalesOpsTicketInput): string | null {
  return row.lead_phone || row.contact_phone || null;
}

export function getDisplayEmail(row: SalesOpsTicketInput): string | null {
  return row.lead_email || row.contact_email || null;
}

export function hasInbound(row: SalesOpsTicketInput): boolean {
  return row.conversations.some((conversation) => conversation.direction === 'in');
}

export function deriveSlaStatus(row: SalesOpsTicketInput, now = new Date()): SlaStatus {
  if (row.status === 'Closed') return 'closed';
  if (row.first_response_at) return 'responded';

  const ageMs = getLeadAgeMs(row, now);
  if (ageMs === null) return 'ok';
  if (ageMs >= SLA_BREACH_MS) return 'breached';
  if (ageMs >= SLA_AT_RISK_MS) return 'at_risk';
  return 'ok';
}

export function deriveSalesQueue(row: SalesOpsTicketInput, now = new Date()): SalesQueue {
  if (row.is_signed_up || row.order_id) return 'converted';
  if (row.insight_status === 'no_coverage') return 'coverage_issue';
  if (row.insight_status === 'unresponsive') return 'unresponsive';

  const slaStatus = deriveSlaStatus(row, now);
  const inboundExists = hasInbound(row);

  if (!row.first_response_at && inboundExists && slaStatus === 'breached') return 'sla_risk';
  if (!row.first_response_at && inboundExists) return 'needs_agent';

  const hasUsableContact = Boolean(getDisplayPhone(row) || getDisplayEmail(row));
  const hasAddress = Boolean(row.lead_address);
  if (
    (row.insight_status === 'completed' || row.insight_status === 'in_progress') &&
    (hasUsableContact || hasAddress)
  ) {
    return 'ready_to_sell';
  }

  if (row.insight_status === 'awaiting_details') return 'waiting_on_customer';
  return 'needs_agent';
}

export function enrichSalesTicket(row: SalesOpsTicketInput, now = new Date()): SalesOpsTicket {
  return {
    ...row,
    sales_queue: deriveSalesQueue(row, now),
    sla_status: deriveSlaStatus(row, now),
    display_name: getDisplayName(row),
    display_phone: getDisplayPhone(row),
    display_email: getDisplayEmail(row),
    lead_age_ms: getLeadAgeMs(row, now),
    first_response_ms: getFirstResponseMs(row),
    last_inbound_at: getLastInboundAt(row.conversations),
    last_outbound_at: getLastOutboundAt(row.conversations),
  };
}

export function summarizeSalesQueues(rows: SalesOpsTicket[]): Record<SalesQueue, number> {
  return rows.reduce<Record<SalesQueue, number>>(
    (summary, row) => {
      summary[row.sales_queue] += 1;
      return summary;
    },
    {
      needs_agent: 0,
      sla_risk: 0,
      ready_to_sell: 0,
      waiting_on_customer: 0,
      coverage_issue: 0,
      unresponsive: 0,
      converted: 0,
    }
  );
}

export function mapLiveCampaignTicketToSnapshot({
  ticket,
  conversations,
  profile,
  insightStatus,
  isSignedUp,
  orderId,
}: LiveCampaignTicketParams): SalesOpsTicketInput {
  const firstOutbound = conversations.find((conversation) => conversation.direction === 'out');

  return {
    ticket_id: ticket.id,
    ticket_number: ticket.ticketNumber ?? null,
    subject: ticket.subject ?? null,
    status: ticket.status ?? null,
    assigned_agent: ticket.assigneeName ?? 'Unassigned',
    contact_name: ticket.contactName ?? null,
    contact_phone: ticket.contactPhone ?? null,
    contact_email: ticket.contactEmail ?? null,
    lead_name: profile.name ?? null,
    lead_email: profile.email ?? null,
    lead_phone: profile.phone ?? null,
    lead_address: profile.address ?? null,
    insight_status: insightStatus,
    is_signed_up: isSignedUp,
    order_id: orderId,
    zoho_created_at: ticket.createdTime ?? null,
    first_response_at: firstOutbound?.timestamp ?? null,
    closed_at: ticket.closedTime ?? null,
    conversations,
    conversation_count: conversations.length,
  };
}
```

- [ ] **Step 2: Run helper tests**

Run:

```bash
npm test -- --runTestsByPath lib/integrations/zoho/__tests__/campaign-sales-ops.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit helper slice**

```bash
git add lib/integrations/zoho/campaign-sales-ops.ts lib/integrations/zoho/__tests__/campaign-sales-ops.test.ts
git commit -m "feat(whatsapp-campaign): add sales ops queue helpers"
```

---

## Task 3: Normalize Live Report API Shape

**Files:**
- Modify: `app/api/admin/whatsapp-campaign/report/route.ts`
- Uses: `lib/integrations/zoho/campaign-sales-ops.ts`

- [ ] **Step 1: Import the live mapper**

In `app/api/admin/whatsapp-campaign/report/route.ts`, add:

```ts
import { mapLiveCampaignTicketToSnapshot } from '@/lib/integrations/zoho/campaign-sales-ops';
```

- [ ] **Step 2: Replace the live-mode mapping**

Replace the current live-mode `ticketData` block with:

```ts
const ticketData = await Promise.allSettled(
  allTickets.map(async (ticket) => {
    const conversations = await campaignService.fetchConversations(ticket.id);
    const ci = new ConversationIntelligence(conversations, ticket.status);
    const profile = ci.extractLeadProfile();
    const insightStatus = ci.deriveInsightStatus({ isSigned_up: false });

    return mapLiveCampaignTicketToSnapshot({
      ticket,
      conversations,
      profile,
      insightStatus,
      isSignedUp: false,
      orderId: null,
    });
  })
);

const tickets = ticketData
  .filter((result): result is PromiseFulfilledResult<ReturnType<typeof mapLiveCampaignTicketToSnapshot>> => {
    return result.status === 'fulfilled';
  })
  .map((result) => result.value)
  .sort((a, b) => {
    const aTime = a.zoho_created_at ? new Date(a.zoho_created_at).getTime() : 0;
    const bTime = b.zoho_created_at ? new Date(b.zoho_created_at).getTime() : 0;
    return bTime - aTime;
  });
```

Keep the existing JSON response shape:

```ts
return NextResponse.json({
  snapshot: null,
  tickets,
  generatedAt: new Date().toISOString(),
  isLive: true,
});
```

- [ ] **Step 3: Run targeted tests**

Run:

```bash
npm test -- --runTestsByPath lib/integrations/zoho/__tests__/campaign-sales-ops.test.ts lib/integrations/zoho/__tests__/desk-campaign-service.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit API slice**

```bash
git add app/api/admin/whatsapp-campaign/report/route.ts
git commit -m "fix(whatsapp-campaign): normalize live report rows"
```

---

## Task 4: Build the Daily Sales Queue UI

**Files:**
- Modify: `app/admin/integrations/whatsapp-campaign/page.tsx`
- Uses: `lib/integrations/zoho/campaign-sales-ops.ts`

- [ ] **Step 1: Import sales ops helpers and types**

Add:

```ts
import {
  enrichSalesTicket,
  summarizeSalesQueues,
  type SalesOpsTicket,
  type SalesQueue,
} from '@/lib/integrations/zoho/campaign-sales-ops';
```

Extend `TicketRow` to include fields already present in `campaign_ticket_snapshots`:

```ts
  contact_phone: string | null;
  contact_email: string | null;
  order_id: string | null;
  first_response_at: string | null;
  closed_at: string | null;
```

- [ ] **Step 2: Add queue configuration**

Add below `PIPELINE_ORDER`:

```ts
const SALES_QUEUE_TABS: Array<{ id: SalesQueue | 'all'; label: string }> = [
  { id: 'all', label: 'All Active' },
  { id: 'sla_risk', label: 'SLA Risk' },
  { id: 'needs_agent', label: 'Needs Agent' },
  { id: 'ready_to_sell', label: 'Ready to Sell' },
  { id: 'waiting_on_customer', label: 'Waiting on Customer' },
  { id: 'coverage_issue', label: 'Coverage Issue' },
  { id: 'unresponsive', label: 'Unresponsive' },
  { id: 'converted', label: 'Converted' },
];
```

Add helper formatters:

```ts
function formatAge(ms: number | null): string {
  if (ms === null) return 'N/A';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getQueueLabel(queue: SalesQueue): string {
  return SALES_QUEUE_TABS.find((tab) => tab.id === queue)?.label ?? queue;
}
```

- [ ] **Step 3: Add queue state and derived rows**

Inside `WhatsAppCampaignPage`, add:

```ts
const [activeQueue, setActiveQueue] = useState<SalesQueue | 'all'>('all');
```

Replace the `tickets` constant with enriched rows:

```ts
const tickets = data?.tickets ?? [];
const enrichedTickets = tickets
  .map((ticket) => enrichSalesTicket(ticket))
  .sort((a, b) => {
    const queueRank: Record<SalesQueue, number> = {
      sla_risk: 0,
      needs_agent: 1,
      ready_to_sell: 2,
      waiting_on_customer: 3,
      coverage_issue: 4,
      unresponsive: 5,
      converted: 6,
    };
    const rankDiff = queueRank[a.sales_queue] - queueRank[b.sales_queue];
    if (rankDiff !== 0) return rankDiff;
    return (b.lead_age_ms ?? 0) - (a.lead_age_ms ?? 0);
  });
const queueCounts = summarizeSalesQueues(enrichedTickets);
const activeSalesTickets =
  activeQueue === 'all'
    ? enrichedTickets.filter((ticket) => ticket.sales_queue !== 'converted')
    : enrichedTickets.filter((ticket) => ticket.sales_queue === activeQueue);
```

Update `agentRows` to use `enrichedTickets` instead of raw `tickets`.

- [ ] **Step 4: Replace the top stat cards**

Use these four stats:

```tsx
<StatCard
  label="Needs Agent"
  value={queueCounts.needs_agent}
  subtitle={`${queueCounts.sla_risk} SLA risk`}
  icon={<PiUsersBold />}
  onClick={() => setActiveQueue('needs_agent')}
  isActive={activeQueue === 'needs_agent'}
/>
<StatCard
  label="SLA Risk"
  value={queueCounts.sla_risk}
  subtitle="No response after 2h"
  icon={<PiClockBold />}
  onClick={() => setActiveQueue('sla_risk')}
  isActive={activeQueue === 'sla_risk'}
/>
<StatCard
  label="Ready to Sell"
  value={queueCounts.ready_to_sell}
  subtitle="Details collected, no order"
  icon={<PiChartBarBold />}
  onClick={() => setActiveQueue('ready_to_sell')}
  isActive={activeQueue === 'ready_to_sell'}
/>
<StatCard
  label="Converted"
  value={queueCounts.converted}
  subtitle={snap ? `${snap.conversions_today} yesterday` : undefined}
  icon={<PiCheckCircleBold />}
  onClick={() => setActiveQueue('converted')}
  isActive={activeQueue === 'converted'}
/>
```

- [ ] **Step 5: Add the Sales Queue section to the overview tab**

In the Overview tab, add this section above the existing pipeline card:

```tsx
<SectionCard
  title="Daily Sales Queue"
  icon={PiWhatsappLogoBold}
  action={
    <button
      onClick={() => exportToCsv(activeSalesTickets)}
      className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
    >
      <PiDownloadBold /> Export Queue
    </button>
  }
>
  <div className="flex flex-wrap gap-2 mb-4">
    {SALES_QUEUE_TABS.map((tab) => {
      const count = tab.id === 'all'
        ? enrichedTickets.filter((ticket) => ticket.sales_queue !== 'converted').length
        : queueCounts[tab.id];
      return (
        <button
          key={tab.id}
          onClick={() => setActiveQueue(tab.id)}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            activeQueue === tab.id
              ? 'border-circleTel-orange bg-orange-50 text-circleTel-orange'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          {tab.label} <span className="ml-1 text-xs opacity-70">{count}</span>
        </button>
      );
    })}
  </div>

  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
          <th className="pb-2 pr-4">Lead</th>
          <th className="pb-2 pr-4">Queue</th>
          <th className="pb-2 pr-4">Age</th>
          <th className="pb-2 pr-4">Response</th>
          <th className="pb-2 pr-4">Agent</th>
          <th className="pb-2 pr-4">Address</th>
          <th className="pb-2">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {activeSalesTickets.map((ticket) => (
          <tr key={ticket.ticket_id} className="hover:bg-slate-50">
            <td className="py-3 pr-4">
              <p className="font-medium text-slate-900">{ticket.display_name}</p>
              <p className="text-xs text-slate-500">
                {ticket.display_phone ?? ticket.display_email ?? 'No contact captured'} · #{ticket.ticket_number ?? 'N/A'}
              </p>
            </td>
            <td className="py-3 pr-4">
              <span className="text-xs font-semibold text-slate-700">{getQueueLabel(ticket.sales_queue)}</span>
            </td>
            <td className="py-3 pr-4 text-slate-600">{formatAge(ticket.lead_age_ms)}</td>
            <td className="py-3 pr-4 text-slate-600">
              {ticket.first_response_ms === null ? ticket.sla_status : formatDuration(ticket.first_response_ms)}
            </td>
            <td className="py-3 pr-4 text-slate-600">{ticket.assigned_agent ?? 'Unassigned'}</td>
            <td className="py-3 pr-4 text-slate-600 max-w-[240px] truncate">
              {ticket.lead_address ?? 'No address captured'}
            </td>
            <td className="py-3">
              <div className="flex items-center gap-2">
                {ticket.display_phone && (
                  <button
                    onClick={() => navigator.clipboard.writeText(ticket.display_phone ?? '')}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    Copy Phone
                  </button>
                )}
                {ticket.order_id && (
                  <a
                    href={`/admin/orders/${ticket.order_id}`}
                    className="text-xs font-medium text-circleTel-orange hover:underline"
                  >
                    Open Order
                  </a>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</SectionCard>
```

Do not add a Zoho deep link in this task because the correct Zoho Desk agent URL is not verified in the repository.

- [ ] **Step 6: Update Leads and Conversations tabs to use enriched rows**

Use `enrichedTickets` for the Leads table and Conversations tab so rows are consistently sorted and include the same fallback display values. Keep `ConversationThread` unchanged.

- [ ] **Step 7: Run type check**

Run:

```bash
npm run type-check:memory
```

Expected: PASS.

- [ ] **Step 8: Commit UI slice**

```bash
git add app/admin/integrations/whatsapp-campaign/page.tsx
git commit -m "feat(whatsapp-campaign): add daily sales cockpit"
```

---

## Task 5: Make CSV Useful for Sales Execution

**Files:**
- Modify: `app/admin/integrations/whatsapp-campaign/page.tsx`

- [ ] **Step 1: Replace CSV headers and rows**

Change `exportToCsv` to accept `SalesOpsTicket[]` and export action-oriented columns:

```ts
function csvEscape(value: string | number | null | undefined): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function exportToCsv(tickets: SalesOpsTicket[]) {
  const headers = [
    'Queue',
    'SLA Status',
    'Ticket #',
    'Name',
    'Phone',
    'Email',
    'Address',
    'Insight',
    'Signed Up',
    'Order ID',
    'Agent',
    'Lead Age',
    'First Response',
    'Created',
    'Messages',
  ];

  const rows = tickets.map((ticket) => [
    getQueueLabel(ticket.sales_queue),
    ticket.sla_status,
    ticket.ticket_number ?? '',
    ticket.display_name,
    ticket.display_phone ?? '',
    ticket.display_email ?? '',
    ticket.lead_address ?? '',
    ticket.insight_status,
    ticket.is_signed_up ? 'Yes' : 'No',
    ticket.order_id ?? '',
    ticket.assigned_agent ?? 'Unassigned',
    formatAge(ticket.lead_age_ms),
    ticket.first_response_ms === null ? '' : formatDuration(ticket.first_response_ms),
    ticket.zoho_created_at ? new Date(ticket.zoho_created_at).toLocaleString('en-ZA') : '',
    ticket.conversation_count,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `whatsapp-campaign-sales-queue-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Verify every CSV caller passes enriched rows**

The Overview queue export should pass `activeSalesTickets`.

The Leads tab export should pass `enrichedTickets`.

- [ ] **Step 3: Run type check**

Run:

```bash
npm run type-check:memory
```

Expected: PASS.

- [ ] **Step 4: Commit export slice**

```bash
git add app/admin/integrations/whatsapp-campaign/page.tsx
git commit -m "feat(whatsapp-campaign): export sales queue context"
```

---

## Task 6: Manual Browser Verification

**Files:**
- No source changes expected.

- [ ] **Step 1: Start the dev server**

Run:

```bash
npm run dev:memory
```

Expected: local Next.js server starts without compile errors.

- [ ] **Step 2: Open the page**

Navigate to:

```text
http://localhost:3000/admin/integrations/whatsapp-campaign
```

Expected:

- Page renders without console errors.
- Top stats show `Needs Agent`, `SLA Risk`, `Ready to Sell`, `Converted`.
- Overview tab shows `Daily Sales Queue` above the passive reporting cards.
- Queue filter buttons update the visible table.
- `Refresh Live` still loads rows and the table does not collapse into blank names/ticket IDs.
- `Export Queue` downloads a CSV with the sales queue columns.
- Expanding conversations still works.

- [ ] **Step 3: Stop the dev server**

Stop the running `npm run dev:memory` session with `Ctrl+C`.

---

## Task 7: Phase 2 Management Reporting Design Gate

Do not start this task until Phase 1 is deployed or at least manually verified with real campaign data.

**Files:**
- Create: `supabase/migrations/20260606120000_campaign_sales_reporting_columns.sql`
- Modify: `lib/inngest/functions/whatsapp-campaign-report.ts`
- Modify: `app/api/admin/whatsapp-campaign/report/route.ts`
- Modify: `app/admin/integrations/whatsapp-campaign/page.tsx`

Add these columns only after the Phase 1 queue labels prove useful:

```sql
ALTER TABLE campaign_ticket_snapshots
  ADD COLUMN IF NOT EXISTS sales_queue text,
  ADD COLUMN IF NOT EXISTS sla_status text,
  ADD COLUMN IF NOT EXISTS last_inbound_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_outbound_at timestamptz,
  ADD COLUMN IF NOT EXISTS coverage_outcome text,
  ADD COLUMN IF NOT EXISTS suburb text;

CREATE INDEX IF NOT EXISTS idx_campaign_tickets_sales_queue
  ON campaign_ticket_snapshots(sales_queue);

CREATE INDEX IF NOT EXISTS idx_campaign_tickets_suburb
  ON campaign_ticket_snapshots(suburb);
```

Management reporting views to add:

- Agent scorecard: assigned leads, SLA breaches, ready-to-sell leads, conversions.
- Area report: suburb/address grouping, no-coverage count, pending coverage checks, conversion count.
- Campaign funnel: lead, responded, details collected, coverage issue, order created.
- Daily trend: lead volume, SLA breaches, conversions, no-coverage rate.

Phase 2 should get its own implementation plan after Phase 1 feedback, because the best reporting fields depend on which daily queue labels operators actually use.

---

## Verification Commands

Run before reporting Phase 1 complete:

```bash
npm test -- --runTestsByPath lib/integrations/zoho/__tests__/campaign-sales-ops.test.ts lib/integrations/zoho/__tests__/desk-campaign-service.test.ts
npm run type-check:memory
```

For UI changes, also run `npm run dev:memory` and manually inspect `/admin/integrations/whatsapp-campaign`.

---

## Self-Review

- Spec coverage: Phase 1 covers daily sales execution first with action queues, SLA risk, live API shape normalization, row actions, and sales-useful CSV. Phase 2 covers management reporting after feedback.
- Completeness scan: No incomplete task markers remain. The Zoho deep link is explicitly excluded because the correct agent URL is not verified.
- Type consistency: `SalesOpsTicketInput`, `SalesOpsTicket`, `SalesQueue`, and `SlaStatus` are defined before use and reused consistently across tests, API, and UI tasks.
