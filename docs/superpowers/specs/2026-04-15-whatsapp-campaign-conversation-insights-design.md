# WhatsApp Campaign Conversation Insights Report — Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a per-client/per-address/per-area Insights tab to the WhatsApp Campaign admin dashboard, backed by coverage outcome and conversation summary fields stored in `campaign_ticket_snapshots`, with CSV and PDF export.

**Architecture:** Extend the existing Approach A pipeline — add four new columns to `campaign_ticket_snapshots`, extend `ConversationIntelligence` with three new methods, extend the Inngest cron upsert step to populate the new fields, add an on-demand AI summary API endpoint, and add a new Insights tab to the existing admin dashboard page.

**Tech Stack:** Next.js 15, TypeScript, Supabase, Inngest, Gemini API (`gemini-2.5-flash`), jsPDF (existing, used for invoices), Tailwind/shadcn

---

## 1. Data Layer

### Migration

Add four columns to `campaign_ticket_snapshots`:

| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `coverage_outcome` | `TEXT` | YES | `'covered'` \| `'not_covered'` \| `'pending_check'` \| `'unknown'` |
| `rule_summary` | `TEXT` | YES | Rule-based structured summary string |
| `ai_summary` | `TEXT` | YES | On-demand AI-generated summary, cached after first generation |
| `suburb` | `TEXT` | YES | Extracted from `lead_address` via comma-split heuristic |

No new tables. No changes to existing columns.

### Coverage Outcome Mapping

Derived from existing `insight_status` + conversation signals:

| `insight_status` | `coverage_outcome` |
|------------------|--------------------|
| `no_coverage` | `'not_covered'` |
| `signed_up`, `completed`, `closed_resolved` | `'covered'` |
| `in_progress`, `awaiting_details`, `awaiting_agent` | `'pending_check'` |
| `unresponsive`, anything else | `'unknown'` |

### Rule Summary Format

```
Lead from [suburb] asked about [subject]. Coverage: [coverage_outcome]. 
[N] conversation exchanges. Status: [insight_status].
[If signed_up: "Customer signed up."] [If no_coverage: "No coverage available at this address."]
```

### Suburb Extraction

Heuristic: split `lead_address` on commas, trim each segment, return second-to-last segment. Falls back to last segment if only two segments exist. Returns `'Unknown'` if address is empty or unparseable.

---

## 2. Backend

### 2a. `ConversationIntelligence` Extension

**File:** `lib/integrations/zoho/conversation-intelligence.ts`

Add three new exported functions (not methods on the class — keep them as pure utility functions to match the existing file pattern):

```typescript
export function deriveCoverageOutcome(insightStatus: InsightStatus): CoverageOutcome

export function buildRuleSummary(params: {
  subject: string;
  suburb: string;
  insightStatus: InsightStatus;
  coverageOutcome: CoverageOutcome;
  conversationCount: number;
}): string

export function extractSuburb(address: string | null | undefined): string
```

`CoverageOutcome` type: `'covered' | 'not_covered' | 'pending_check' | 'unknown'`

### 2b. Inngest Cron Step 5 Extension

**File:** `lib/inngest/functions/whatsapp-campaign-report.ts`

In the existing upsert step (step 5 — `upsert-snapshots`), extend the upsert payload for each ticket to include:

```typescript
coverage_outcome: deriveCoverageOutcome(enriched.insightStatus),
rule_summary: buildRuleSummary({ subject, suburb, insightStatus, coverageOutcome, conversationCount }),
suburb: extractSuburb(enriched.profile.address),
// ai_summary: NOT set here — populated on-demand only
```

No new Inngest steps. No changes to step ordering or names.

### 2c. AI Summary API Route

**File:** `app/api/admin/whatsapp-campaign/ai-summary/route.ts`

`POST /api/admin/whatsapp-campaign/ai-summary`

Request body: `{ ticket_id: string, refresh?: boolean }`

Behaviour:
1. Fetch row from `campaign_ticket_snapshots` where `ticket_id = ticket_id`
2. If `ai_summary` is already set and `refresh !== true`, return cached value immediately
3. Otherwise: build prompt from `conversations` JSONB + `subject` + `insight_status`
4. Call Gemini `gemini-2.5-flash` with `max_output_tokens: 300`
5. Strip any thinking tokens, extract plain text summary
6. `UPDATE campaign_ticket_snapshots SET ai_summary = ... WHERE ticket_id = ...`
7. Return `{ summary: string }`

Authentication: admin auth (same pattern as existing report route).

Gemini prompt template:
```
You are summarising a WhatsApp support conversation between a customer and a telecoms agent.
Write a 2-3 sentence plain-English summary covering: what the customer wanted, whether coverage was available, and the outcome.

Ticket subject: [subject]
Conversation:
[formatted message thread — direction: content]
```

### 2d. Report API Extension

**File:** `app/api/admin/whatsapp-campaign/report/route.ts`

Add optional query param: `?groupBy=client|address|suburb`

When `groupBy` is set:
- `client`: return array of individual ticket rows (existing behaviour, extended with new fields)
- `address`: group rows by `lead_address`, return `{ address, suburb, tickets[] }`
- `suburb`: group rows by `suburb`, return `{ suburb, total, covered, not_covered, pending_check, unknown, conversion_rate }[]`

When `groupBy` is absent, existing behaviour is unchanged.

---

## 3. Frontend

### 3a. New Insights Tab

**File:** `app/admin/integrations/whatsapp-campaign/page.tsx`

Add "Insights" as the 5th tab in the existing `UnderlineTabs` component.

Inside the tab: a segmented control (three buttons) switching between sub-views:

**Per Client sub-view**
Table columns: Name, Email, Phone, Address, Suburb, Coverage Outcome (StatusBadge), Rule Summary (truncated, expandable), AI Summarise button

- AI Summarise button: calls `POST /api/admin/whatsapp-campaign/ai-summary`, shows loading spinner, replaces rule summary text inline with AI result on success
- If `ai_summary` already exists in the row data, show it directly with a "Regenerate" link

**Per Address sub-view**
Grouped list. Each group:
- Header: full address + suburb + lead count
- Collapsed by default, click to expand
- Expanded: shows each lead as a compact row (name, coverage outcome badge, insight status)

**Per Area sub-view**
Table columns: Suburb, Total Leads, Covered, Not Covered, Pending, Unknown, Conversion Rate (%)
Sorted by Total Leads descending.

### 3b. CSV Export

**File:** `app/admin/integrations/whatsapp-campaign/page.tsx` — extend existing `exportToCsv()`

Add columns to the export: `coverage_outcome`, `suburb`, `rule_summary`, `ai_summary` (blank if not generated).

The CSV export button in the Insights tab toolbar exports the current sub-view's data:
- Per Client: one row per ticket
- Per Address: one row per address group (address, suburb, lead_count, covered_count, not_covered_count)
- Per Area: one row per suburb

### 3c. PDF Export

**File:** `app/admin/integrations/whatsapp-campaign/page.tsx` — new `downloadInsightsPdf()` function

Uses jsPDF (same library used for invoices — see `.claude/rules/invoice-pdf-patterns.md`).

PDF structure:
1. Header: "WhatsApp Campaign Insights Report" + generated date
2. Summary stats bar: total leads, covered, not covered, pending, overall conversion rate
3. Per Client section: table (name, suburb, coverage outcome, summary)
4. Per Address section: grouped by address
5. Per Area section: suburb stats table

PDF is triggered by a "Download PDF" button in the Insights tab toolbar. Print-hidden elements (`.print:hidden`) excluded as per existing pattern.

---

## 4. Error Handling

- AI summary endpoint: if Gemini call fails, return 500 with `{ error: 'Summary generation failed' }`. Do not update DB. Frontend shows error toast, keeps rule summary visible.
- Suburb extraction: never throws — always returns a string (falls back to `'Unknown'`).
- `deriveCoverageOutcome`: always returns a valid `CoverageOutcome` — defaults to `'unknown'` for any unrecognised status.
- Inngest cron: new field computation failures must not break the existing upsert — wrap in try/catch, fall back to `null` values for new fields.

---

## 5. Files Touched

| Action | File |
|--------|------|
| Create | `supabase/migrations/YYYYMMDD_campaign_insights_columns.sql` |
| Modify | `lib/integrations/zoho/conversation-intelligence.ts` |
| Modify | `lib/inngest/functions/whatsapp-campaign-report.ts` |
| Create | `app/api/admin/whatsapp-campaign/ai-summary/route.ts` |
| Modify | `app/api/admin/whatsapp-campaign/report/route.ts` |
| Modify | `app/admin/integrations/whatsapp-campaign/page.tsx` |

No new pages. No new shared components.

---

## 6. Out of Scope

- Real-time conversation sync (cron-only)
- Customer-facing report delivery
- Geographic map visualisation
- Historical trend charts
- Gemini model upgrade path (use `gemini-2.5-flash` throughout)
