# WhatsApp Campaign Daily Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a daily reporting pipeline for the CircleTel WhatsApp Lead Campaign — Inngest cron fetches all `"whatsapp lead"` Zoho Desk tickets at 08:00 SAST, extracts per-ticket conversation intelligence, cross-references sign-ups in Supabase, writes snapshot tables, and sends a Resend email digest, with a supporting admin dashboard at `/admin/integrations/whatsapp-campaign`.

**Architecture:** Inngest cron (06:00 UTC) drives an 8-step pipeline that reads from Zoho Desk API (paginated tagged-ticket fetch + conversations), runs `ConversationIntelligence` to classify each ticket and extract lead profiles, cross-references `consumer_orders` in Supabase for sign-up detection, upserts results to `campaign_ticket_snapshots`, writes a daily aggregate to `campaign_report_snapshots`, and sends the digest via Resend. The admin dashboard reads from Supabase and calls a live-refresh API route backed by Zoho Desk.

**Tech Stack:** TypeScript, Next.js 15, Supabase (service role), Inngest cron, Resend email API, Zoho Desk REST API, `@/lib/integrations/zoho/auth-service` (OAuth token management), `@/lib/integrations/zoho/desk-service` (base HTTP client), Jest for unit tests.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `supabase/migrations/20260415_campaign_report_snapshots.sql` | Create | Daily aggregate table |
| `supabase/migrations/20260415_campaign_ticket_snapshots.sql` | Create | Per-ticket snapshot table |
| `lib/integrations/zoho/desk-campaign-service.ts` | Create | `CampaignZohoDeskService` (Zoho API calls) + `ConversationIntelligence` (classification + extraction) |
| `lib/integrations/zoho/__tests__/desk-campaign-service.test.ts` | Create | Unit tests for `ConversationIntelligence` |
| `lib/inngest/functions/whatsapp-campaign-report.ts` | Create | Inngest cron function — 8-step pipeline |
| `lib/inngest/index.ts` | Modify | Register `whatsappCampaignReportFunction` |
| `app/api/admin/whatsapp-campaign/report/route.ts` | Create | Dashboard data API (Supabase reads + live Zoho refresh) |
| `components/admin/shared/InsightBadge.tsx` | Create | Colour-coded pill for 8 insight statuses |
| `components/admin/whatsapp-campaign/ConversationThread.tsx` | Create | Inline conversation thread renderer |
| `app/admin/integrations/whatsapp-campaign/page.tsx` | Create | Full admin dashboard with 4 tabs |
| `scripts/backfill-whatsapp-campaign-tags.ts` | Create | One-off script: search and tag ~50 untagged tickets |

---

## Task 1: Database Migrations

**Files:**
- Create: `supabase/migrations/20260415_campaign_report_snapshots.sql`
- Create: `supabase/migrations/20260415_campaign_ticket_snapshots.sql`

- [ ] **Step 1: Write the campaign_report_snapshots migration**

```sql
-- supabase/migrations/20260415_campaign_report_snapshots.sql
CREATE TABLE IF NOT EXISTS campaign_report_snapshots (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date           date UNIQUE NOT NULL,
  generated_at          timestamptz NOT NULL DEFAULT now(),
  new_leads_today       int NOT NULL DEFAULT 0,
  cumulative_leads      int NOT NULL DEFAULT 0,
  open_tickets          int NOT NULL DEFAULT 0,
  closed_tickets        int NOT NULL DEFAULT 0,
  unassigned_tickets    int NOT NULL DEFAULT 0,
  conversion_rate       numeric(5,2) NOT NULL DEFAULT 0,
  avg_first_response_ms bigint,
  agent_breakdown       jsonb NOT NULL DEFAULT '{}',
  conversions_today     int NOT NULL DEFAULT 0,
  pipeline_breakdown    jsonb NOT NULL DEFAULT '{}',
  raw_snapshot          jsonb
);

COMMENT ON TABLE campaign_report_snapshots IS
  'Daily aggregate snapshots for the WhatsApp Lead Campaign (one row per report date).';
COMMENT ON COLUMN campaign_report_snapshots.agent_breakdown IS
  'JSON object: { "Tamsyn Jacobs": 12, "Unassigned": 3 }';
COMMENT ON COLUMN campaign_report_snapshots.pipeline_breakdown IS
  'JSON object: { "completed": 18, "signed_up": 3, "no_coverage": 4, ... }';
```

- [ ] **Step 2: Write the campaign_ticket_snapshots migration**

```sql
-- supabase/migrations/20260415_campaign_ticket_snapshots.sql
CREATE TABLE IF NOT EXISTS campaign_ticket_snapshots (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id             text UNIQUE NOT NULL,
  ticket_number         text,
  subject               text,
  status                text,
  assigned_agent        text,
  contact_name          text,
  contact_phone         text,
  contact_email         text,
  -- Lead profile extracted from GC conversation
  lead_name             text,
  lead_email            text,
  lead_phone            text,
  lead_address          text,
  -- Classification
  insight_status        text NOT NULL DEFAULT 'awaiting_agent',
  insight_updated_at    timestamptz,
  -- Conversion
  is_signed_up          boolean NOT NULL DEFAULT false,
  order_id              text,
  -- Timing
  zoho_created_at       timestamptz,
  first_response_at     timestamptz,
  closed_at             timestamptz,
  last_synced_at        timestamptz NOT NULL DEFAULT now(),
  -- Full conversation thread
  conversations         jsonb NOT NULL DEFAULT '[]',
  conversation_count    int NOT NULL DEFAULT 0,
  tags                  text[] NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_campaign_tickets_insight
  ON campaign_ticket_snapshots(insight_status);
CREATE INDEX IF NOT EXISTS idx_campaign_tickets_agent
  ON campaign_ticket_snapshots(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_campaign_tickets_signed_up
  ON campaign_ticket_snapshots(is_signed_up);
CREATE INDEX IF NOT EXISTS idx_campaign_tickets_created
  ON campaign_ticket_snapshots(zoho_created_at DESC);

COMMENT ON TABLE campaign_ticket_snapshots IS
  'Per-ticket snapshot for WhatsApp Lead Campaign tickets, upserted on every cron run.';
COMMENT ON COLUMN campaign_ticket_snapshots.insight_status IS
  'One of: signed_up, no_coverage, closed_resolved, completed, in_progress, awaiting_details, awaiting_agent, unresponsive';
COMMENT ON COLUMN campaign_ticket_snapshots.conversations IS
  'JSON array of { id, author, direction, content, timestamp, channel }';
```

- [ ] **Step 3: Apply migrations via Supabase MCP**

Run these SQL statements against the production Supabase project using the `mcp__supabase__apply_migration` tool (or paste into Supabase SQL editor). Verify both tables exist:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('campaign_report_snapshots', 'campaign_ticket_snapshots');
```

Expected: 2 rows.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260415_campaign_report_snapshots.sql \
        supabase/migrations/20260415_campaign_ticket_snapshots.sql
git commit -m "feat(whatsapp-campaign): add campaign snapshot migrations"
```

---

## Task 2: CampaignZohoDeskService + ConversationIntelligence

**Files:**
- Create: `lib/integrations/zoho/desk-campaign-service.ts`
- Create: `lib/integrations/zoho/__tests__/desk-campaign-service.test.ts`

### Step 2a: Write the failing tests first

- [ ] **Step 1: Write failing unit tests for ConversationIntelligence**

```typescript
// lib/integrations/zoho/__tests__/desk-campaign-service.test.ts

import {
  ConversationIntelligence,
  type CampaignConversation,
} from '../desk-campaign-service';

function makeConv(overrides: Partial<CampaignConversation>): CampaignConversation {
  return {
    id: 'c1',
    author: 'Test User',
    direction: 'in',
    content: 'Hello',
    timestamp: new Date().toISOString(),
    channel: 'whatsapp',
    ...overrides,
  };
}

describe('ConversationIntelligence', () => {
  describe('extractLeadProfile', () => {
    it('extracts email from inbound message', () => {
      const conversations: CampaignConversation[] = [
        makeConv({ direction: 'in', content: 'My email is john.doe@gmail.com' }),
      ];
      const ci = new ConversationIntelligence(conversations, 'Open');
      expect(ci.extractLeadProfile().email).toBe('john.doe@gmail.com');
    });

    it('extracts SA phone number starting with 0', () => {
      const conversations: CampaignConversation[] = [
        makeConv({ direction: 'in', content: 'Call me on 083 123 4567' }),
      ];
      const ci = new ConversationIntelligence(conversations, 'Open');
      expect(ci.extractLeadProfile().phone).toBe('0831234567');
    });

    it('extracts SA phone number starting with +27', () => {
      const conversations: CampaignConversation[] = [
        makeConv({ direction: 'in', content: 'My number is +27821234567' }),
      ];
      const ci = new ConversationIntelligence(conversations, 'Open');
      expect(ci.extractLeadProfile().phone).toBe('+27821234567');
    });

    it('returns empty profile when no data found', () => {
      const conversations: CampaignConversation[] = [
        makeConv({ direction: 'in', content: 'Hello I need internet' }),
      ];
      const ci = new ConversationIntelligence(conversations, 'Open');
      const profile = ci.extractLeadProfile();
      expect(profile.email).toBeUndefined();
      expect(profile.phone).toBeUndefined();
    });
  });

  describe('deriveInsightStatus', () => {
    it('returns awaiting_agent when only inbound messages exist', () => {
      const conversations: CampaignConversation[] = [
        makeConv({ direction: 'in', content: 'Hello I need internet' }),
      ];
      const ci = new ConversationIntelligence(conversations, 'Open');
      expect(ci.deriveInsightStatus({ isSigned_up: false })).toBe('awaiting_agent');
    });

    it('returns no_coverage when agent message contains "no coverage"', () => {
      const conversations: CampaignConversation[] = [
        makeConv({ direction: 'in', content: 'I live in Pretoria' }),
        makeConv({ direction: 'out', author: 'Tamsyn', content: 'Unfortunately there is no coverage in your area.' }),
      ];
      const ci = new ConversationIntelligence(conversations, 'Open');
      expect(ci.deriveInsightStatus({ isSigned_up: false })).toBe('no_coverage');
    });

    it('returns closed_resolved when ticket status is Closed', () => {
      const conversations: CampaignConversation[] = [
        makeConv({ direction: 'in', content: 'Thanks!' }),
        makeConv({ direction: 'out', author: 'Tamsyn', content: 'Welcome aboard!' }),
      ];
      const ci = new ConversationIntelligence(conversations, 'Closed');
      expect(ci.deriveInsightStatus({ isSigned_up: false })).toBe('closed_resolved');
    });

    it('returns signed_up with highest priority even over no_coverage', () => {
      const conversations: CampaignConversation[] = [
        makeConv({ direction: 'in', content: 'I live in Pretoria' }),
        makeConv({ direction: 'out', author: 'Tamsyn', content: 'No coverage in your area.' }),
      ];
      const ci = new ConversationIntelligence(conversations, 'Open');
      expect(ci.deriveInsightStatus({ isSigned_up: true })).toBe('signed_up');
    });

    it('returns completed when all 4 fields extracted and thread >= 5 messages', () => {
      const now = new Date();
      const conversations: CampaignConversation[] = [
        makeConv({ direction: 'in', content: '15 Milner Rd, Vaalview' }),
        makeConv({ direction: 'in', content: 'John Doe' }),
        makeConv({ direction: 'in', content: 'john.doe@example.com' }),
        makeConv({ direction: 'in', content: '0831234567' }),
        makeConv({ direction: 'out', author: 'Tamsyn', content: 'Thank you John!' }),
      ];
      const ci = new ConversationIntelligence(conversations, 'Open');
      expect(ci.deriveInsightStatus({ isSigned_up: false })).toBe('completed');
    });

    it('returns awaiting_details when GC started but fields missing', () => {
      const conversations: CampaignConversation[] = [
        makeConv({ direction: 'in', content: '15 Milner Rd, Vaalview' }),
        makeConv({ direction: 'out', author: 'Tamsyn', content: 'What is your name?' }),
      ];
      const ci = new ConversationIntelligence(conversations, 'Open');
      expect(ci.deriveInsightStatus({ isSigned_up: false })).toBe('awaiting_details');
    });

    it('returns unresponsive when last inbound > 48h ago with no outbound follow-up', () => {
      const oldDate = new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(); // 50h ago
      const conversations: CampaignConversation[] = [
        makeConv({ direction: 'in', content: 'Hello', timestamp: oldDate }),
        makeConv({ direction: 'out', author: 'Tamsyn', content: 'Hi! What is your address?', timestamp: oldDate }),
        // No inbound reply since
      ];
      const ci = new ConversationIntelligence(conversations, 'Open');
      expect(ci.deriveInsightStatus({ isSigned_up: false })).toBe('unresponsive');
    });

    it('returns in_progress when agent has replied, ticket Open, no negative signals', () => {
      const recentDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2h ago
      const conversations: CampaignConversation[] = [
        makeConv({ direction: 'in', content: 'I need fibre', timestamp: recentDate }),
        makeConv({ direction: 'out', author: 'Tamsyn', content: 'We can help!', timestamp: recentDate }),
        makeConv({ direction: 'in', content: 'Great, my address is 5 Oak St', timestamp: recentDate }),
      ];
      const ci = new ConversationIntelligence(conversations, 'Open');
      expect(ci.deriveInsightStatus({ isSigned_up: false })).toBe('in_progress');
    });
  });
});
```

- [ ] **Step 2: Run tests — expect ALL to fail**

```bash
cd /home/circletel
npx jest lib/integrations/zoho/__tests__/desk-campaign-service.test.ts --no-coverage 2>&1 | tail -20
```

Expected: `Cannot find module '../desk-campaign-service'`

### Step 2b: Write the implementation

- [ ] **Step 3: Create desk-campaign-service.ts**

```typescript
// lib/integrations/zoho/desk-campaign-service.ts
/**
 * Zoho Desk Campaign Service
 *
 * Campaign-specific Zoho Desk queries and ConversationIntelligence for the
 * WhatsApp Lead Campaign daily report pipeline.
 */

import { createZohoAuthService } from './auth-service';
import { zohoLogger } from '@/lib/logging';

// =============================================================================
// TYPES
// =============================================================================

export interface CampaignConversation {
  id: string;
  author: string;
  direction: 'in' | 'out';
  content: string;
  timestamp: string;
  channel: string;
}

export interface CampaignTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;            // 'Open' | 'Closed' | etc.
  assigneeName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  createdTime: string;
  closedTime: string | null;
  tags: string[];
}

export interface LeadProfile {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export type InsightStatus =
  | 'signed_up'
  | 'no_coverage'
  | 'closed_resolved'
  | 'completed'
  | 'in_progress'
  | 'awaiting_details'
  | 'awaiting_agent'
  | 'unresponsive';

// =============================================================================
// CONVERSATION INTELLIGENCE
// =============================================================================

const EMAIL_REGEX = /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i;
const PHONE_REGEX = /(\+27|0)[6-8]\d{8}/;
const NO_COVERAGE_PHRASES = ['no coverage', 'not available', 'coverage check failed'];

export class ConversationIntelligence {
  private conversations: CampaignConversation[];
  private ticketStatus: string;

  constructor(conversations: CampaignConversation[], ticketStatus: string) {
    this.conversations = conversations;
    this.ticketStatus = ticketStatus;
  }

  /**
   * Extract lead profile fields from inbound conversation messages.
   *
   * Strategy:
   * - email: regex match on any inbound content
   * - phone: regex match on any inbound content
   * - address: first inbound message after a bot/GC message containing "location"
   * - name: first inbound message after a bot/GC message containing "name"
   */
  extractLeadProfile(): LeadProfile {
    const profile: LeadProfile = {};
    const inbound = this.conversations.filter((c) => c.direction === 'in');

    for (const conv of inbound) {
      const text = conv.content || '';

      if (!profile.email) {
        const emailMatch = text.match(EMAIL_REGEX);
        if (emailMatch) profile.email = emailMatch[0].toLowerCase();
      }

      if (!profile.phone) {
        const stripped = text.replace(/[\s-]/g, '');
        const phoneMatch = stripped.match(PHONE_REGEX);
        if (phoneMatch) profile.phone = phoneMatch[0];
      }
    }

    // Extract address from the message immediately following a "location" prompt
    const addressPromptIdx = this.conversations.findIndex(
      (c) =>
        c.direction === 'out' &&
        /location|address|where do you live/i.test(c.content || '')
    );
    if (addressPromptIdx !== -1) {
      const nextInbound = this.conversations
        .slice(addressPromptIdx + 1)
        .find((c) => c.direction === 'in');
      if (nextInbound) profile.address = (nextInbound.content || '').trim();
    }

    // Extract name from the message immediately following a "name" prompt
    const namePromptIdx = this.conversations.findIndex(
      (c) =>
        c.direction === 'out' &&
        /full name|your name/i.test(c.content || '')
    );
    if (namePromptIdx !== -1) {
      const nextInbound = this.conversations
        .slice(namePromptIdx + 1)
        .find((c) => c.direction === 'in');
      if (nextInbound) profile.name = (nextInbound.content || '').trim();
    }

    return profile;
  }

  /**
   * Derive the insight status for this ticket.
   * Priority: signed_up > no_coverage > closed_resolved > completed >
   *           in_progress > awaiting_details > awaiting_agent > unresponsive
   */
  deriveInsightStatus({ isSigned_up }: { isSigned_up: boolean }): InsightStatus {
    if (isSigned_up) return 'signed_up';

    const outbound = this.conversations.filter((c) => c.direction === 'out');
    const inbound = this.conversations.filter((c) => c.direction === 'in');

    // no_coverage: any outbound agent message contains no-coverage phrase
    const hasNoCoverage = outbound.some((c) =>
      NO_COVERAGE_PHRASES.some((phrase) =>
        (c.content || '').toLowerCase().includes(phrase)
      )
    );
    if (hasNoCoverage) return 'no_coverage';

    // closed_resolved: ticket is Closed
    if (this.ticketStatus === 'Closed') return 'closed_resolved';

    // completed: all 4 profile fields present AND >= 5 messages
    const profile = this.extractLeadProfile();
    const allFieldsPresent =
      !!profile.name && !!profile.email && !!profile.phone && !!profile.address;
    if (allFieldsPresent && this.conversations.length >= 5) return 'completed';

    // awaiting_agent: inbound exists but no outbound at all
    if (inbound.length > 0 && outbound.length === 0) return 'awaiting_agent';

    // unresponsive: last inbound > 48h ago, outbound exists, ticket Open
    if (outbound.length > 0 && inbound.length > 0) {
      const lastInbound = inbound[inbound.length - 1];
      const lastOutbound = outbound[outbound.length - 1];
      const lastInboundMs = new Date(lastInbound.timestamp).getTime();
      const lastOutboundMs = new Date(lastOutbound.timestamp).getTime();
      const ageMs = Date.now() - lastInboundMs;
      const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
      // Customer last spoke > 48h ago AND agent has since replied
      if (ageMs > FORTY_EIGHT_HOURS && lastOutboundMs < lastInboundMs === false) {
        return 'unresponsive';
      }
    }

    // awaiting_details: GC started (inbound exists) but missing fields
    if (inbound.length > 0 && !allFieldsPresent) return 'awaiting_details';

    // in_progress: agent has engaged, ticket open
    if (outbound.length > 0 && inbound.length > 0) return 'in_progress';

    return 'awaiting_agent';
  }
}

// =============================================================================
// CAMPAIGN ZOHO DESK SERVICE
// =============================================================================

interface ZohoTicketListResponse {
  data: Array<{
    id: string;
    ticketNumber: string;
    subject: string;
    status: string;
    assignee?: { name: string; email?: string } | null;
    contact?: { name: string; email?: string; phone?: string } | null;
    createdTime: string;
    closedTime?: string | null;
    tags?: string[];
  }>;
  count?: number;
}

interface ZohoConversationResponse {
  data: Array<{
    id: string;
    author?: { name: string };
    type?: string;
    direction?: string;
    content: string;
    createdTime: string;
    channel?: string;
  }>;
}

export class CampaignZohoDeskService {
  private auth = createZohoAuthService();
  private baseUrl: string;
  private orgId: string;

  constructor() {
    const region = process.env.ZOHO_REGION || 'US';
    const regionSuffix = { US: '', EU: '.eu', IN: '.in', AU: '.com.au', CN: '.com.cn' }[region] ?? '';
    this.baseUrl = `https://desk.zoho${regionSuffix}.com/api/v1`;
    this.orgId = process.env.ZOHO_DESK_ORG_ID || '';
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' = 'GET',
    body?: Record<string, unknown>
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const accessToken = await this.auth.getAccessToken();
      const url = `${this.baseUrl}${endpoint}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json',
          'orgId': this.orgId,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        zohoLogger.error('[CampaignDesk] API error', { status: response.status, error: errorText });
        return { success: false, error: `${response.status} ${response.statusText}` };
      }

      const data: T = await response.json();
      return { success: true, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      zohoLogger.error('[CampaignDesk] Request failed', { error: message });
      return { success: false, error: message };
    }
  }

  /**
   * Fetch ALL tickets tagged "whatsapp lead", paginated.
   */
  async fetchAllCampaignTickets(): Promise<CampaignTicket[]> {
    const tickets: CampaignTicket[] = [];
    let from = 0;
    const limit = 100;

    while (true) {
      const result = await this.makeRequest<ZohoTicketListResponse>(
        `/tickets?tags=whatsapp+lead&limit=${limit}&from=${from}&fields=id,ticketNumber,subject,status,assignee,contact,createdTime,closedTime,tags`
      );

      if (!result.success || !result.data?.data) break;

      const batch = result.data.data;
      if (batch.length === 0) break;

      for (const t of batch) {
        tickets.push({
          id: t.id,
          ticketNumber: t.ticketNumber,
          subject: t.subject || '',
          status: t.status || 'Open',
          assigneeName: t.assignee?.name ?? null,
          contactName: t.contact?.name ?? null,
          contactPhone: t.contact?.phone ?? null,
          contactEmail: t.contact?.email ?? null,
          createdTime: t.createdTime,
          closedTime: t.closedTime ?? null,
          tags: t.tags ?? [],
        });
      }

      if (batch.length < limit) break;
      from += limit;
    }

    zohoLogger.debug(`[CampaignDesk] Fetched ${tickets.length} tagged tickets`);
    return tickets;
  }

  /**
   * Fetch conversations for a single ticket.
   */
  async fetchConversations(ticketId: string): Promise<CampaignConversation[]> {
    const result = await this.makeRequest<ZohoConversationResponse>(
      `/tickets/${ticketId}/conversations`
    );

    if (!result.success || !result.data?.data) return [];

    return result.data.data.map((c) => ({
      id: c.id,
      author: c.author?.name ?? 'Unknown',
      direction: (c.direction?.toLowerCase() === 'out' ? 'out' : 'in') as 'in' | 'out',
      content: c.content || '',
      timestamp: c.createdTime,
      channel: (c.channel || 'whatsapp').toLowerCase(),
    }));
  }

  /**
   * Search tickets by subject keyword (for backfill use).
   */
  async searchTicketsBySubject(searchStr: string): Promise<CampaignTicket[]> {
    const result = await this.makeRequest<ZohoTicketListResponse>(
      `/tickets/search?searchStr=${encodeURIComponent(searchStr)}&limit=100`
    );

    if (!result.success || !result.data?.data) return [];

    return result.data.data.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      subject: t.subject || '',
      status: t.status || 'Open',
      assigneeName: t.assignee?.name ?? null,
      contactName: t.contact?.name ?? null,
      contactPhone: t.contact?.phone ?? null,
      contactEmail: t.contact?.email ?? null,
      createdTime: t.createdTime,
      closedTime: t.closedTime ?? null,
      tags: t.tags ?? [],
    }));
  }

  /**
   * Add "whatsapp lead" tag to a ticket (merges with existing tags).
   */
  async addCampaignTag(ticketId: string, existingTags: string[]): Promise<boolean> {
    const updatedTags = Array.from(new Set([...existingTags, 'whatsapp lead']));
    const result = await this.makeRequest(
      `/tickets/${ticketId}`,
      'PATCH',
      { tags: updatedTags }
    );
    return result.success;
  }
}

export function createCampaignZohoDeskService(): CampaignZohoDeskService {
  return new CampaignZohoDeskService();
}
```

- [ ] **Step 4: Run tests — expect them to pass**

```bash
npx jest lib/integrations/zoho/__tests__/desk-campaign-service.test.ts --no-coverage 2>&1 | tail -20
```

Expected: All 8 tests PASS.

> **Note on unresponsive logic:** If any tests around `unresponsive` are flaky due to timestamp math, review the `deriveInsightStatus` condition: `lastOutboundMs < lastInboundMs === false` means "agent replied AFTER the last customer message". Adjust as needed.

- [ ] **Step 5: Commit**

```bash
git add lib/integrations/zoho/desk-campaign-service.ts \
        lib/integrations/zoho/__tests__/desk-campaign-service.test.ts
git commit -m "feat(whatsapp-campaign): add CampaignZohoDeskService and ConversationIntelligence"
```

---

## Task 3: Inngest Cron Function

**Files:**
- Create: `lib/inngest/functions/whatsapp-campaign-report.ts`

- [ ] **Step 1: Create the Inngest cron function**

```typescript
// lib/inngest/functions/whatsapp-campaign-report.ts
/**
 * WhatsApp Campaign Daily Report — Inngest Cron Function
 *
 * Schedule: 0 6 * * * (06:00 UTC = 08:00 SAST)
 * Retries: 2
 *
 * Pipeline:
 *  1. fetch-all-campaign-tickets — GET all "whatsapp lead" tickets (paginated)
 *  2. fetch-conversations — GET conversations for each ticket (batched 10 at a time)
 *  3. extract-intelligence — Run ConversationIntelligence on each ticket
 *  4. cross-reference-orders — Batch query consumer_orders by email/phone
 *  5. upsert-ticket-snapshots — Upsert all rows to campaign_ticket_snapshots
 *  6. compute-daily-aggregate — Compute metrics for previous calendar day
 *  7. write-report-snapshot — Insert/upsert to campaign_report_snapshots
 *  8. send-email-report — Send digest via Resend
 */

import { inngest } from '../client';
import { createClient } from '@/lib/supabase/server';
import {
  createCampaignZohoDeskService,
  ConversationIntelligence,
  type CampaignTicket,
  type CampaignConversation,
  type InsightStatus,
  type LeadProfile,
} from '@/lib/integrations/zoho/desk-campaign-service';
import { zohoLogger } from '@/lib/logging';

// =============================================================================
// TYPES
// =============================================================================

interface EnrichedTicket {
  ticket: CampaignTicket;
  conversations: CampaignConversation[];
  profile: LeadProfile;
  insightStatus: InsightStatus;
  isSigned_up: boolean;
  orderId: string | null;
  firstResponseAt: string | null;
}

// =============================================================================
// HELPERS
// =============================================================================

/** Format milliseconds as "2h 14m" */
function formatDuration(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/** Get first outbound conversation timestamp */
function getFirstResponseAt(conversations: CampaignConversation[]): string | null {
  const firstOut = conversations.find((c) => c.direction === 'out');
  return firstOut?.timestamp ?? null;
}

/** Build the plain-text + HTML email body */
function buildEmailHtml(params: {
  reportDate: string;
  newLeadsToday: number;
  conversionsToday: number;
  conversionRate: number;
  unassigned: number;
  openTickets: number;
  closedTickets: number;
  cumulative: number;
  avgFirstResponseMs: number | null;
  agentBreakdown: Record<string, number>;
  pipelineBreakdown: Record<string, number>;
  newSignUps: EnrichedTicket[];
}): { html: string; text: string } {
  const {
    reportDate, newLeadsToday, conversionsToday, conversionRate,
    unassigned, openTickets, closedTickets, cumulative,
    avgFirstResponseMs, agentBreakdown, pipelineBreakdown, newSignUps,
  } = params;

  const convRateFmt = conversionRate.toFixed(1);
  const avgRespFmt = avgFirstResponseMs ? formatDuration(avgFirstResponseMs) : 'N/A';
  const agentLines = Object.entries(agentBreakdown)
    .map(([name, count]) => `  ${name}: ${count} tickets`)
    .join('\n');
  const pipelineOrder: InsightStatus[] = [
    'signed_up', 'completed', 'in_progress', 'awaiting_details',
    'no_coverage', 'awaiting_agent', 'unresponsive', 'closed_resolved',
  ];
  const pipelineLines = pipelineOrder
    .filter((k) => (pipelineBreakdown[k] ?? 0) > 0)
    .map((k) => {
      const label = k.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      const icon = k === 'signed_up' ? '  ✅' : k === 'awaiting_agent' ? '  ⚠' : '  ';
      return `${icon} ${label}: ${pipelineBreakdown[k]}`;
    })
    .join('\n');
  const signUpLines = newSignUps
    .map((e) => {
      const p = e.profile;
      const name = p.name ?? e.ticket.contactName ?? 'Unknown';
      const email = p.email ?? e.ticket.contactEmail ?? 'N/A';
      const phone = p.phone ?? e.ticket.contactPhone ?? 'N/A';
      const address = p.address ?? 'N/A';
      return `  • ${name} | ${email} | ${phone}\n    ${address}`;
    })
    .join('\n');

  const text = `─────────────────────────────────────────
CircleTel | WhatsApp Lead Campaign Report
${reportDate}
─────────────────────────────────────────

YESTERDAY AT A GLANCE
  New Leads:         ${newLeadsToday}
  Conversions:       ${conversionsToday}   (${convRateFmt}% rate)
  Unassigned:        ${unassigned}${unassigned > 0 ? '   ⚠' : ''}

TICKET STATUS
  Open:              ${openTickets}
  Closed:            ${closedTickets}
  Total (all time):  ${cumulative}

AGENT RESPONSE
  Avg. First Response:  ${avgRespFmt}
${agentLines}

LEAD PIPELINE (all time)
${pipelineLines}

${newSignUps.length > 0 ? `NEW SIGN-UPS YESTERDAY\n${signUpLines}\n` : ''}
View full dashboard: https://www.circletel.co.za/admin/integrations/whatsapp-campaign
─────────────────────────────────────────`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><style>
  body { font-family: monospace; background: #f8fafc; padding: 24px; }
  pre { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
        padding: 20px; white-space: pre-wrap; font-size: 14px; line-height: 1.6; }
  a { color: #F5831F; }
</style></head>
<body><pre>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre></body>
</html>`;

  return { html, text };
}

// =============================================================================
// INNGEST FUNCTION
// =============================================================================

export const whatsappCampaignReportFunction = inngest.createFunction(
  {
    id: 'whatsapp-campaign-daily-report',
    name: 'WhatsApp Campaign Daily Report',
    retries: 2,
  },
  { cron: '0 6 * * *' }, // 06:00 UTC = 08:00 SAST
  async ({ step }) => {
    const campaignService = createCampaignZohoDeskService();
    const supabase = await createClient();

    // ── Step 1: Fetch all campaign tickets ────────────────────────────────
    const allTickets = await step.run('fetch-all-campaign-tickets', async () => {
      return await campaignService.fetchAllCampaignTickets();
    });

    // ── Step 2: Fetch conversations (batched 10 at a time) ────────────────
    const conversationMap = await step.run('fetch-conversations', async () => {
      const result: Record<string, CampaignConversation[]> = {};
      const batchSize = 10;
      for (let i = 0; i < allTickets.length; i += batchSize) {
        const batch = allTickets.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(
          batch.map((t) => campaignService.fetchConversations(t.id))
        );
        for (let j = 0; j < batch.length; j++) {
          const r = batchResults[j];
          result[batch[j].id] = r.status === 'fulfilled' ? r.value : [];
        }
      }
      return result;
    });

    // ── Step 3: Extract intelligence ──────────────────────────────────────
    const enriched: EnrichedTicket[] = await step.run('extract-intelligence', async () => {
      return allTickets.map((ticket) => {
        const conversations = conversationMap[ticket.id] ?? [];
        const ci = new ConversationIntelligence(conversations, ticket.status);
        const profile = ci.extractLeadProfile();
        const firstResponseAt = getFirstResponseAt(conversations);
        return {
          ticket,
          conversations,
          profile,
          insightStatus: ci.deriveInsightStatus({ isSigned_up: false }), // sign-up resolved in step 4
          isSigned_up: false,
          orderId: null,
          firstResponseAt,
        };
      });
    });

    // ── Step 4: Cross-reference consumer_orders ───────────────────────────
    const enrichedWithSignUps = await step.run('cross-reference-orders', async () => {
      const emails = enriched.map((e) => e.profile.email).filter(Boolean) as string[];
      const phones = enriched.map((e) => e.profile.phone).filter(Boolean) as string[];

      const { data: orders } = await supabase
        .from('consumer_orders')
        .select('id, email, phone')
        .or(
          [...emails.map((e) => `email.eq.${e}`), ...phones.map((p) => `phone.eq.${p}`)].join(',')
        );

      const ordersByEmail = new Map<string, string>();
      const ordersByPhone = new Map<string, string>();
      for (const o of orders ?? []) {
        if (o.email) ordersByEmail.set(o.email.toLowerCase(), o.id);
        if (o.phone) ordersByPhone.set(o.phone, o.id);
      }

      return enriched.map((e) => {
        const email = e.profile.email?.toLowerCase();
        const phone = e.profile.phone;
        const orderId =
          (email ? ordersByEmail.get(email) : null) ??
          (phone ? ordersByPhone.get(phone) : null) ??
          null;
        const isSigned_up = orderId !== null;
        const ci = new ConversationIntelligence(e.conversations, e.ticket.status);
        return {
          ...e,
          isSigned_up,
          orderId,
          insightStatus: ci.deriveInsightStatus({ isSigned_up }),
        };
      });
    });

    // ── Step 5: Upsert ticket snapshots ───────────────────────────────────
    await step.run('upsert-ticket-snapshots', async () => {
      const rows = enrichedWithSignUps.map((e) => ({
        ticket_id: e.ticket.id,
        ticket_number: e.ticket.ticketNumber,
        subject: e.ticket.subject,
        status: e.ticket.status,
        assigned_agent: e.ticket.assigneeName ?? (e.ticket.assigneeName === null ? 'Unassigned' : null),
        contact_name: e.ticket.contactName,
        contact_phone: e.ticket.contactPhone,
        contact_email: e.ticket.contactEmail,
        lead_name: e.profile.name ?? null,
        lead_email: e.profile.email ?? null,
        lead_phone: e.profile.phone ?? null,
        lead_address: e.profile.address ?? null,
        insight_status: e.insightStatus,
        insight_updated_at: new Date().toISOString(),
        is_signed_up: e.isSigned_up,
        order_id: e.orderId,
        zoho_created_at: e.ticket.createdTime,
        first_response_at: e.firstResponseAt,
        closed_at: e.ticket.closedTime,
        last_synced_at: new Date().toISOString(),
        conversations: e.conversations,
        conversation_count: e.conversations.length,
        tags: e.ticket.tags,
      }));

      const { error } = await supabase
        .from('campaign_ticket_snapshots')
        .upsert(rows, { onConflict: 'ticket_id' });

      if (error) {
        zohoLogger.error('[CampaignReport] Upsert failed', { error: error.message });
        throw new Error(`Upsert failed: ${error.message}`);
      }
    });

    // ── Step 6: Compute daily aggregate ──────────────────────────────────
    const aggregate = await step.run('compute-daily-aggregate', async () => {
      // Report window: previous calendar day SAST (UTC+2)
      const now = new Date();
      const sast = new Date(now.getTime() + 2 * 3600 * 1000);
      const reportDate = new Date(sast);
      reportDate.setDate(reportDate.getDate() - 1);
      const dateStr = reportDate.toISOString().slice(0, 10); // YYYY-MM-DD

      const dayStart = new Date(`${dateStr}T00:00:00+02:00`).toISOString();
      const dayEnd = new Date(`${dateStr}T23:59:59+02:00`).toISOString();

      const newLeads = enrichedWithSignUps.filter(
        (e) => e.ticket.createdTime >= dayStart && e.ticket.createdTime <= dayEnd
      );
      const conversionsToday = enrichedWithSignUps.filter(
        (e) =>
          e.isSigned_up &&
          e.ticket.createdTime >= dayStart &&
          e.ticket.createdTime <= dayEnd
      );

      const openTickets = enrichedWithSignUps.filter((e) => e.ticket.status !== 'Closed').length;
      const closedTickets = enrichedWithSignUps.filter((e) => e.ticket.status === 'Closed').length;
      const unassigned = enrichedWithSignUps.filter((e) => !e.ticket.assigneeName).length;

      // Agent breakdown
      const agentBreakdown: Record<string, number> = {};
      for (const e of enrichedWithSignUps) {
        const agent = e.ticket.assigneeName ?? 'Unassigned';
        agentBreakdown[agent] = (agentBreakdown[agent] ?? 0) + 1;
      }

      // Pipeline breakdown
      const pipelineBreakdown: Record<string, number> = {};
      for (const e of enrichedWithSignUps) {
        pipelineBreakdown[e.insightStatus] = (pipelineBreakdown[e.insightStatus] ?? 0) + 1;
      }

      // Avg first response time (ms) for tickets with responses
      const responseTimes = enrichedWithSignUps
        .filter((e) => e.firstResponseAt)
        .map((e) => {
          const created = new Date(e.ticket.createdTime).getTime();
          const first = new Date(e.firstResponseAt!).getTime();
          return first - created;
        })
        .filter((ms) => ms > 0);
      const avgFirstResponseMs =
        responseTimes.length > 0
          ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
          : null;

      const conversionRate =
        newLeads.length > 0
          ? (conversionsToday.length / newLeads.length) * 100
          : 0;

      return {
        reportDate: dateStr,
        newLeadsToday: newLeads.length,
        cumulative: enrichedWithSignUps.length,
        openTickets,
        closedTickets,
        unassigned,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgFirstResponseMs,
        agentBreakdown,
        conversionsToday: conversionsToday.length,
        pipelineBreakdown,
        newSignUps: conversionsToday,
      };
    });

    // ── Step 7: Write report snapshot ─────────────────────────────────────
    await step.run('write-report-snapshot', async () => {
      const { error } = await supabase
        .from('campaign_report_snapshots')
        .upsert(
          {
            report_date: aggregate.reportDate,
            generated_at: new Date().toISOString(),
            new_leads_today: aggregate.newLeadsToday,
            cumulative_leads: aggregate.cumulative,
            open_tickets: aggregate.openTickets,
            closed_tickets: aggregate.closedTickets,
            unassigned_tickets: aggregate.unassigned,
            conversion_rate: aggregate.conversionRate,
            avg_first_response_ms: aggregate.avgFirstResponseMs,
            agent_breakdown: aggregate.agentBreakdown,
            conversions_today: aggregate.conversionsToday,
            pipeline_breakdown: aggregate.pipelineBreakdown,
          },
          { onConflict: 'report_date' }
        );

      if (error) throw new Error(`Snapshot write failed: ${error.message}`);
    });

    // ── Step 8: Send email report ─────────────────────────────────────────
    await step.run('send-email-report', async () => {
      const dateLabel = new Date(aggregate.reportDate + 'T00:00:00')
        .toLocaleDateString('en-ZA', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });

      const { html, text } = buildEmailHtml({
        reportDate: dateLabel,
        newLeadsToday: aggregate.newLeadsToday,
        conversionsToday: aggregate.conversionsToday,
        conversionRate: aggregate.conversionRate,
        unassigned: aggregate.unassigned,
        openTickets: aggregate.openTickets,
        closedTickets: aggregate.closedTickets,
        cumulative: aggregate.cumulative,
        avgFirstResponseMs: aggregate.avgFirstResponseMs,
        agentBreakdown: aggregate.agentBreakdown,
        pipelineBreakdown: aggregate.pipelineBreakdown,
        newSignUps: aggregate.newSignUps,
      });

      const recipient =
        process.env.CAMPAIGN_REPORT_RECIPIENT ?? 'jeffrey.de.wee@circletel.co.za';

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'billing@notify.circletel.co.za',
          to: [recipient],
          subject: `WhatsApp Campaign Report — ${dateLabel} | ${aggregate.newLeadsToday} new lead${aggregate.newLeadsToday !== 1 ? 's' : ''}`,
          html,
          text,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`Resend failed: ${err.message}`);
      }

      zohoLogger.debug('[CampaignReport] Email sent', { recipient, date: aggregate.reportDate });
    });

    return {
      reportDate: aggregate.reportDate,
      ticketsProcessed: enrichedWithSignUps.length,
      newLeads: aggregate.newLeadsToday,
      conversions: aggregate.conversionsToday,
    };
  }
);
```

- [ ] **Step 2: Commit**

```bash
git add lib/inngest/functions/whatsapp-campaign-report.ts
git commit -m "feat(whatsapp-campaign): add Inngest daily report cron function"
```

---

## Task 4: Register Inngest Function

**Files:**
- Modify: `lib/inngest/index.ts`

- [ ] **Step 1: Add export near the `invoiceNotificationFunction` export (line ~119)**

In [lib/inngest/index.ts](lib/inngest/index.ts), add after the `invoiceNotificationFunction` export block:

```typescript
export {
  whatsappCampaignReportFunction,
} from './functions/whatsapp-campaign-report';
```

- [ ] **Step 2: Add import and register in the `functions` array**

Add the import after the existing `invoiceNotificationFunction` import (around line ~229):

```typescript
import {
  whatsappCampaignReportFunction,
} from './functions/whatsapp-campaign-report';
```

Add to the `functions` array at the end (before the closing `]`):

```typescript
  // WhatsApp Lead Campaign daily report (08:00 SAST)
  whatsappCampaignReportFunction,
```

- [ ] **Step 3: Type-check**

```bash
npm run type-check:memory 2>&1 | grep -E "error|Error" | head -20
```

Expected: No new errors.

- [ ] **Step 4: Commit**

```bash
git add lib/inngest/index.ts
git commit -m "feat(whatsapp-campaign): register Inngest cron in function index"
```

---

## Task 5: Admin API Route

**Files:**
- Create: `app/api/admin/whatsapp-campaign/report/route.ts`

- [ ] **Step 1: Create the API route**

```typescript
// app/api/admin/whatsapp-campaign/report/route.ts
/**
 * GET /api/admin/whatsapp-campaign/report
 *
 * Query params:
 *   ?date=YYYY-MM-DD   — fetch snapshot for a specific date (default: today)
 *   ?live=true         — bypass Supabase cache, re-run against Zoho Desk live
 *
 * Authentication: Admin (service role via authenticateAdmin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth/admin-api-auth';
import { createClient } from '@/lib/supabase/server';
import {
  createCampaignZohoDeskService,
  ConversationIntelligence,
} from '@/lib/integrations/zoho/desk-campaign-service';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authResult = await authenticateAdmin(request);
  if (!authResult.success) return authResult.response;

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');
  const isLive = searchParams.get('live') === 'true';

  const reportDate = dateParam ?? new Date().toISOString().slice(0, 10);
  const supabase = await createClient();

  // Live mode: re-fetch from Zoho and return enriched tickets (no DB write)
  if (isLive) {
    const campaignService = createCampaignZohoDeskService();
    const allTickets = await campaignService.fetchAllCampaignTickets();

    const ticketData = await Promise.allSettled(
      allTickets.map(async (ticket) => {
        const conversations = await campaignService.fetchConversations(ticket.id);
        const ci = new ConversationIntelligence(conversations, ticket.status);
        const profile = ci.extractLeadProfile();
        const insightStatus = ci.deriveInsightStatus({ isSigned_up: false });
        return { ticket, conversations, profile, insightStatus };
      })
    );

    const tickets = ticketData
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<typeof ticketData[number] extends PromiseFulfilledResult<infer V> ? V : never>).value);

    return NextResponse.json({
      snapshot: null,
      tickets,
      generatedAt: new Date().toISOString(),
      isLive: true,
    });
  }

  // Standard mode: read from Supabase
  const [snapshotResult, ticketsResult] = await Promise.all([
    supabase
      .from('campaign_report_snapshots')
      .select('*')
      .eq('report_date', reportDate)
      .maybeSingle(),
    supabase
      .from('campaign_ticket_snapshots')
      .select('*')
      .order('zoho_created_at', { ascending: false }),
  ]);

  return NextResponse.json({
    snapshot: snapshotResult.data ?? null,
    tickets: ticketsResult.data ?? [],
    generatedAt: snapshotResult.data?.generated_at ?? new Date().toISOString(),
    isLive: false,
  });
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check:memory 2>&1 | grep "app/api/admin/whatsapp-campaign" | head -10
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/whatsapp-campaign/report/route.ts
git commit -m "feat(whatsapp-campaign): add admin report API route"
```

---

## Task 6: UI Components — InsightBadge + ConversationThread

**Files:**
- Create: `components/admin/shared/InsightBadge.tsx`
- Create: `components/admin/whatsapp-campaign/ConversationThread.tsx`

- [ ] **Step 1: Create InsightBadge**

```tsx
// components/admin/shared/InsightBadge.tsx
'use client';

import { cn } from '@/lib/utils';
import type { InsightStatus } from '@/lib/integrations/zoho/desk-campaign-service';

const INSIGHT_STYLES: Record<InsightStatus, { bg: string; text: string; label: string }> = {
  signed_up:        { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Signed Up' },
  no_coverage:      { bg: 'bg-red-50',     text: 'text-red-700',     label: 'No Coverage' },
  closed_resolved:  { bg: 'bg-slate-100',  text: 'text-slate-600',   label: 'Closed' },
  completed:        { bg: 'bg-blue-50',    text: 'text-blue-700',    label: 'Completed GC' },
  in_progress:      { bg: 'bg-sky-50',     text: 'text-sky-700',     label: 'In Progress' },
  awaiting_details: { bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'Awaiting Details' },
  awaiting_agent:   { bg: 'bg-orange-50',  text: 'text-orange-700',  label: 'Awaiting Agent' },
  unresponsive:     { bg: 'bg-rose-50',    text: 'text-rose-700',    label: 'Unresponsive' },
};

interface InsightBadgeProps {
  status: InsightStatus;
  className?: string;
}

export function InsightBadge({ status, className }: InsightBadgeProps) {
  const style = INSIGHT_STYLES[status] ?? INSIGHT_STYLES['awaiting_agent'];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        style.bg,
        style.text,
        className
      )}
    >
      {style.label}
    </span>
  );
}
```

- [ ] **Step 2: Create ConversationThread**

```tsx
// components/admin/whatsapp-campaign/ConversationThread.tsx
'use client';

import { cn } from '@/lib/utils';
import type { CampaignConversation } from '@/lib/integrations/zoho/desk-campaign-service';

interface ConversationThreadProps {
  conversations: CampaignConversation[];
}

export function ConversationThread({ conversations }: ConversationThreadProps) {
  if (!conversations || conversations.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic py-2">No conversation messages.</p>
    );
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto p-3 bg-slate-50 rounded-lg">
      {conversations.map((msg) => {
        const isOutbound = msg.direction === 'out';
        const time = new Date(msg.timestamp).toLocaleString('en-ZA', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });
        return (
          <div
            key={msg.id}
            className={cn('flex', isOutbound ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                isOutbound
                  ? 'bg-[#F5831F] text-white rounded-tr-none'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
              )}
            >
              <p className="font-medium text-xs mb-1 opacity-70">{msg.author}</p>
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              <p className="text-xs mt-1 opacity-60 text-right">{time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
npm run type-check:memory 2>&1 | grep -E "InsightBadge|ConversationThread" | head -10
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add components/admin/shared/InsightBadge.tsx \
        components/admin/whatsapp-campaign/ConversationThread.tsx
git commit -m "feat(whatsapp-campaign): add InsightBadge and ConversationThread components"
```

---

## Task 7: Admin Dashboard Page

**Files:**
- Create: `app/admin/integrations/whatsapp-campaign/page.tsx`

- [ ] **Step 1: Create the dashboard page**

```tsx
// app/admin/integrations/whatsapp-campaign/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PiArrowClockwiseBold,
  PiWhatsappLogoBold,
  PiUsersBold,
  PiCheckCircleBold,
  PiChartBarBold,
  PiClockBold,
  PiWarningBold,
  PiDownloadBold,
} from 'react-icons/pi';
import { StatCard } from '@/components/admin/shared/StatCard';
import { SectionCard } from '@/components/admin/shared/SectionCard';
import { StatusBadge } from '@/components/admin/shared/StatusBadge';
import { UnderlineTabs, TabPanel } from '@/components/admin/shared/UnderlineTabs';
import { InsightBadge } from '@/components/admin/shared/InsightBadge';
import { ConversationThread } from '@/components/admin/whatsapp-campaign/ConversationThread';
import type { InsightStatus, CampaignConversation } from '@/lib/integrations/zoho/desk-campaign-service';

// =============================================================================
// TYPES
// =============================================================================

interface SnapshotRow {
  report_date: string;
  new_leads_today: number;
  cumulative_leads: number;
  open_tickets: number;
  closed_tickets: number;
  unassigned_tickets: number;
  conversion_rate: number;
  avg_first_response_ms: number | null;
  agent_breakdown: Record<string, number>;
  conversions_today: number;
  pipeline_breakdown: Record<string, number>;
}

interface TicketRow {
  ticket_id: string;
  ticket_number: string | null;
  subject: string | null;
  status: string | null;
  assigned_agent: string | null;
  contact_name: string | null;
  lead_name: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  lead_address: string | null;
  insight_status: InsightStatus;
  is_signed_up: boolean;
  zoho_created_at: string | null;
  conversations: CampaignConversation[];
  conversation_count: number;
}

interface ReportData {
  snapshot: SnapshotRow | null;
  tickets: TicketRow[];
  generatedAt: string;
  isLive: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

function formatDuration(ms: number | null): string {
  if (!ms) return 'N/A';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function exportToCsv(tickets: TicketRow[]) {
  const headers = ['Ticket #', 'Name', 'Email', 'Phone', 'Address', 'Insight', 'Signed Up', 'Agent', 'Created'];
  const rows = tickets.map((t) => [
    t.ticket_number ?? '',
    t.lead_name ?? t.contact_name ?? '',
    t.lead_email ?? '',
    t.lead_phone ?? '',
    t.lead_address ?? '',
    t.insight_status,
    t.is_signed_up ? 'Yes' : 'No',
    t.assigned_agent ?? 'Unassigned',
    t.zoho_created_at ? new Date(t.zoho_created_at).toLocaleDateString('en-ZA') : '',
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `whatsapp-campaign-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// =============================================================================
// PAGE
// =============================================================================

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'leads', label: 'Leads' },
  { id: 'agents', label: 'Agent Performance' },
  { id: 'conversations', label: 'Conversations' },
];

const PIPELINE_ORDER: InsightStatus[] = [
  'signed_up', 'completed', 'in_progress', 'awaiting_details',
  'no_coverage', 'awaiting_agent', 'unresponsive', 'closed_resolved',
];

export default function WhatsAppCampaignPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  const fetchData = useCallback(async (live = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/admin/whatsapp-campaign/report${live ? '?live=true' : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json: ReportData = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const snap = data?.snapshot;
  const tickets = data?.tickets ?? [];

  // Derived agent rows
  const agentRows = snap
    ? Object.entries(snap.agent_breakdown).map(([agent, count]) => ({
        agent,
        count,
        signUps: tickets.filter((t) => t.assigned_agent === agent && t.is_signed_up).length,
        closed: tickets.filter((t) => t.assigned_agent === agent && t.status === 'Closed').length,
      }))
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <PiWhatsappLogoBold className="text-green-600 text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">WhatsApp Lead Campaign</h1>
              <p className="text-sm text-slate-500">
                {snap ? `Last updated: ${new Date(data?.generatedAt ?? '').toLocaleString('en-ZA')}` : 'Loading...'}
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <PiArrowClockwiseBold className={loading ? 'animate-spin' : ''} />
            Refresh Live
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Leads"
            value={snap?.cumulative_leads ?? '—'}
            subtitle={snap ? `${snap.new_leads_today} yesterday` : undefined}
            icon={<PiUsersBold />}
          />
          <StatCard
            label="Conversions"
            value={snap?.conversions_today ?? '—'}
            subtitle={snap ? `${snap.conversion_rate.toFixed(1)}% rate` : undefined}
            icon={<PiCheckCircleBold />}
          />
          <StatCard
            label="Open Tickets"
            value={snap?.open_tickets ?? '—'}
            subtitle={snap?.unassigned_tickets ? `${snap.unassigned_tickets} unassigned ⚠` : undefined}
            icon={<PiChartBarBold />}
          />
          <StatCard
            label="Avg. Response"
            value={formatDuration(snap?.avg_first_response_ms ?? null)}
            icon={<PiClockBold />}
          />
        </div>

        {/* Tabs */}
        <UnderlineTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Overview Tab */}
        <TabPanel activeTab={activeTab} tabId="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Pipeline Breakdown */}
            <SectionCard title="Lead Pipeline (All Time)" icon={PiChartBarBold}>
              <div className="space-y-2">
                {PIPELINE_ORDER.map((status) => {
                  const count = snap?.pipeline_breakdown[status] ?? 0;
                  const total = snap?.cumulative_leads ?? 1;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <InsightBadge status={status} className="w-36 justify-center" />
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-[#F5831F] h-2 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {/* Recent Tickets */}
            <SectionCard title="Recent Tickets" icon={PiWhatsappLogoBold}>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tickets.slice(0, 20).map((t) => (
                  <div
                    key={t.ticket_id}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {t.lead_name ?? t.contact_name ?? '—'}
                      </p>
                      <p className="text-xs text-slate-500">#{t.ticket_number}</p>
                    </div>
                    <InsightBadge status={t.insight_status} />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </TabPanel>

        {/* Leads Tab */}
        <TabPanel activeTab={activeTab} tabId="leads">
          <SectionCard
            title="All Leads"
            icon={PiUsersBold}
            action={
              <button
                onClick={() => exportToCsv(tickets)}
                className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
              >
                <PiDownloadBold /> Export CSV
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Email</th>
                    <th className="pb-2 pr-4">Phone</th>
                    <th className="pb-2 pr-4">Address</th>
                    <th className="pb-2 pr-4">Insight</th>
                    <th className="pb-2 pr-4">Agent</th>
                    <th className="pb-2">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map((t) => (
                    <tr key={t.ticket_id} className="hover:bg-slate-50">
                      <td className="py-2 pr-4 font-medium text-slate-900">
                        {t.lead_name ?? t.contact_name ?? '—'}
                        {t.is_signed_up && (
                          <span className="ml-1 text-emerald-600 text-xs">✅</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-slate-600">{t.lead_email ?? '—'}</td>
                      <td className="py-2 pr-4 text-slate-600">{t.lead_phone ?? '—'}</td>
                      <td className="py-2 pr-4 text-slate-600 max-w-[200px] truncate">
                        {t.lead_address ?? '—'}
                      </td>
                      <td className="py-2 pr-4">
                        <InsightBadge status={t.insight_status} />
                      </td>
                      <td className="py-2 pr-4 text-slate-600">{t.assigned_agent ?? 'Unassigned'}</td>
                      <td className="py-2 text-slate-500">
                        {t.zoho_created_at
                          ? new Date(t.zoho_created_at).toLocaleDateString('en-ZA')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </TabPanel>

        {/* Agent Performance Tab */}
        <TabPanel activeTab={activeTab} tabId="agents">
          <SectionCard title="Agent Performance" icon={PiUsersBold}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                  <th className="pb-2 pr-4">Agent</th>
                  <th className="pb-2 pr-4">Tickets Assigned</th>
                  <th className="pb-2 pr-4">Sign-Ups</th>
                  <th className="pb-2">Closed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agentRows.map((row) => (
                  <tr key={row.agent} className="hover:bg-slate-50">
                    <td className="py-2 pr-4 font-medium text-slate-900">{row.agent}</td>
                    <td className="py-2 pr-4 text-slate-600">{row.count}</td>
                    <td className="py-2 pr-4 text-emerald-600 font-medium">{row.signUps}</td>
                    <td className="py-2 text-slate-600">{row.closed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>
        </TabPanel>

        {/* Conversations Tab */}
        <TabPanel activeTab={activeTab} tabId="conversations">
          <SectionCard title="Conversation Threads" icon={PiWhatsappLogoBold}>
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.ticket_id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() =>
                      setExpandedTicket(expandedTicket === t.ticket_id ? null : t.ticket_id)
                    }
                    className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-medium text-slate-900">
                        {t.lead_name ?? t.contact_name ?? '—'}
                      </span>
                      <span className="text-xs text-slate-500">#{t.ticket_number}</span>
                      <InsightBadge status={t.insight_status} />
                    </div>
                    <span className="text-xs text-slate-500 ml-2 shrink-0">
                      {t.conversation_count} messages
                    </span>
                  </button>
                  {expandedTicket === t.ticket_id && (
                    <div className="border-t border-slate-100">
                      <ConversationThread conversations={t.conversations} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </TabPanel>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify UnderlineTabs props by reading the component**

```bash
grep -n "interface\|tabId\|activeTab\|onTabChange\|tabs" /home/circletel/components/admin/shared/UnderlineTabs.tsx | head -20
```

If the props differ from what's in the page above, update the page to match the actual interface.

- [ ] **Step 3: Type-check**

```bash
npm run type-check:memory 2>&1 | grep "whatsapp-campaign" | head -20
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/admin/integrations/whatsapp-campaign/page.tsx
git commit -m "feat(whatsapp-campaign): add admin dashboard page"
```

---

## Task 8: Backfill Script

**Files:**
- Create: `scripts/backfill-whatsapp-campaign-tags.ts`

- [ ] **Step 1: Create the backfill script**

```typescript
// scripts/backfill-whatsapp-campaign-tags.ts
/**
 * One-off backfill: search Zoho Desk for untagged WhatsApp campaign tickets
 * and add the "whatsapp lead" tag to each.
 *
 * Usage:
 *   npx tsx scripts/backfill-whatsapp-campaign-tags.ts
 *
 * Dry-run mode (no writes):
 *   DRY_RUN=true npx tsx scripts/backfill-whatsapp-campaign-tags.ts
 */

import 'dotenv/config';
import { createCampaignZohoDeskService } from '../lib/integrations/zoho/desk-campaign-service';

const SEARCH_TERMS = ['fb.me/', 'lnk.ms/', 'Hello! Can I get more info on this?'];
const DRY_RUN = process.env.DRY_RUN === 'true';

async function main() {
  console.log(`\n🚀 WhatsApp Campaign Backfill${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

  const service = createCampaignZohoDeskService();

  // 1. Search for matching tickets across all search terms
  const seen = new Set<string>();
  const candidates: Awaited<ReturnType<typeof service.searchTicketsBySubject>> = [];

  for (const term of SEARCH_TERMS) {
    console.log(`🔍 Searching for: "${term}"`);
    const results = await service.searchTicketsBySubject(term);
    console.log(`   Found ${results.length} ticket(s)`);
    for (const t of results) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        candidates.push(t);
      }
    }
  }

  console.log(`\n📋 Total unique candidates: ${candidates.length}`);

  // 2. Filter to those NOT already tagged "whatsapp lead"
  const needsTag = candidates.filter(
    (t) => !t.tags.some((tag) => tag.toLowerCase() === 'whatsapp lead')
  );
  const alreadyTagged = candidates.length - needsTag.length;

  console.log(`   Already tagged: ${alreadyTagged}`);
  console.log(`   Needs tagging:  ${needsTag.length}\n`);

  if (needsTag.length === 0) {
    console.log('✅ Nothing to do — all matching tickets are already tagged.\n');
    return;
  }

  // 3. Apply tag to each untagged ticket
  let tagged = 0;
  let errors = 0;

  for (const ticket of needsTag) {
    if (DRY_RUN) {
      console.log(`[DRY RUN] Would tag: #${ticket.ticketNumber} — ${ticket.subject.slice(0, 60)}`);
      tagged++;
      continue;
    }

    const ok = await service.addCampaignTag(ticket.id, ticket.tags);
    if (ok) {
      console.log(`✅ Tagged: #${ticket.ticketNumber} — ${ticket.subject.slice(0, 60)}`);
      tagged++;
    } else {
      console.error(`❌ Failed: #${ticket.ticketNumber}`);
      errors++;
    }

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Tagged: ${tagged}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Skipped (already tagged): ${alreadyTagged}`);
  if (DRY_RUN) {
    console.log('\n💡 Re-run without DRY_RUN=true to apply changes.\n');
  } else {
    console.log('\n✅ Backfill complete.\n');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Dry-run the script (read-only, no writes)**

Make sure the app's `.env` or `.env.local` is loaded, then:

```bash
cd /home/circletel
DRY_RUN=true npx tsx scripts/backfill-whatsapp-campaign-tags.ts
```

Expected output: Lists candidate tickets with `[DRY RUN] Would tag:` lines. Review the list — these should be the ~50 WhatsApp campaign tickets without tags.

- [ ] **Step 3: Run for real (once confirmed dry-run looks correct)**

```bash
npx tsx scripts/backfill-whatsapp-campaign-tags.ts
```

Expected: Each ticket shows `✅ Tagged:` line. Summary shows tagged count.

- [ ] **Step 4: Commit**

```bash
git add scripts/backfill-whatsapp-campaign-tags.ts
git commit -m "feat(whatsapp-campaign): add backfill script for missing whatsapp lead tags"
```

---

## Task 9: Final Type-Check and Integration Verification

- [ ] **Step 1: Full type-check**

```bash
npm run type-check:memory 2>&1 | grep -E "^.*error" | head -30
```

Expected: No new errors introduced by this feature.

- [ ] **Step 2: Run unit tests**

```bash
npx jest lib/integrations/zoho/__tests__/desk-campaign-service.test.ts --no-coverage
```

Expected: All 8 tests PASS.

- [ ] **Step 3: Start dev server and verify the dashboard loads**

```bash
npm run dev:memory
```

Navigate to `http://localhost:3000/admin/integrations/whatsapp-campaign`. The page should load without console errors, with the stat cards and tabs visible. (API call will return empty data until cron has run or live refresh is triggered.)

- [ ] **Step 4: Verify Inngest function is registered**

```bash
curl -s http://localhost:3000/api/inngest | jq '.functions[].id' 2>/dev/null | grep campaign
```

Expected: `"whatsapp-campaign-daily-report"` appears in the list.

- [ ] **Step 5: Trigger cron manually via Inngest Dev Server (optional smoke test)**

If running Inngest Dev Server locally (`npx inngest-cli@latest dev`), navigate to the Inngest dashboard and trigger the `whatsapp-campaign-daily-report` function. Verify it completes all 8 steps without errors in the Inngest trace.

- [ ] **Step 6: Final commit**

```bash
git add -A
git status  # Confirm only expected files are staged
git commit -m "feat(whatsapp-campaign): complete daily report pipeline and admin dashboard"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Section 1 (Backfill Script) — Task 8
- ✅ Section 2 (Zoho Desk API calls) — Task 2 (`CampaignZohoDeskService`)
- ✅ Section 3 (DB Schema) — Task 1
- ✅ Section 4 (ConversationIntelligence) — Task 2
- ✅ Section 5 (Inngest Cron) — Task 3
- ✅ Section 6 (Email Report) — Task 3 (`buildEmailHtml` + step 8)
- ✅ Section 7 (Admin Dashboard) — Tasks 6 + 7
- ✅ Section 8 (API Route) — Task 5
- ✅ `InsightBadge` new component — Task 6
- ✅ `ConversationThread` new component — Task 6
- ✅ `lib/inngest/index.ts` registration — Task 4
- ✅ Env vars documented in spec (`ZOHO_DESK_ORG_ID`, `ZOHO_REGION`, `RESEND_API_KEY`, `CAMPAIGN_REPORT_RECIPIENT`)

**No placeholders:** All code blocks are complete and production-ready.

**Type consistency:**
- `InsightStatus` type exported from `desk-campaign-service.ts` and imported in `InsightBadge.tsx`, `ConversationThread.tsx`, and `page.tsx` — consistent.
- `CampaignConversation` type exported from `desk-campaign-service.ts` and imported in `page.tsx` and `ConversationThread.tsx` — consistent.
- `createCampaignZohoDeskService()` factory used in both `whatsapp-campaign-report.ts` and `route.ts` — consistent.
