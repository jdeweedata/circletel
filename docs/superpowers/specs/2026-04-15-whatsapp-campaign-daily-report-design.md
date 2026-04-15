# WhatsApp Campaign Daily Report — Design Spec

**Date:** 2026-04-15
**Status:** Approved
**Author:** Claude Code

---

## Overview

Build a daily reporting system for the CircleTel WhatsApp Lead Campaign (Zoho Desk Guided Conversation — "WhatsApp Lead Campaign - 11.03.2026"). The system delivers a morning email digest at 08:00 SAST and provides an admin dashboard at `/admin/integrations/whatsapp-campaign`. It tracks leads, agent response, conversation intelligence, lead profiles, and conversions.

---

## Problem Statement

CircleTel is running a WhatsApp ad campaign (Meta Ads: "CircleTel - Marlbank (Vaal) - Connectivity - 28 March") that funnels leads into a Zoho Desk Guided Conversation. Leads are being created as Zoho Desk tickets tagged `whatsapp lead`, but there is currently no:

- Daily summary of new leads, agent response, and conversions
- Per-ticket intelligence (coverage status, lead profile, sign-up status)
- Admin dashboard to monitor campaign health
- Backfill of existing ~50 untagged tickets

---

## Campaign Context

| Property | Value |
|----------|-------|
| Zoho Desk tag | `whatsapp lead` |
| Guided Conversation | WhatsApp Lead Campaign - 11.03.2026 |
| GC Flow | Hello → Your Location → Customer Full Names → Customer Email → Customer Contact Numbers → Website & Confirmation |
| Meta Ads campaign | CircleTel - Marlbank (Vaal) - Connectivity - 28 March |
| Ad spend to date | R1,044.98 (25 leads @ R41.80/lead) |
| Report recipient | jeffrey.de.wee@circletel.co.za |
| Report time | 08:00 SAST daily |
| Report window | Previous calendar day (00:00–23:59 SAST) |

---

## Architecture

```
Zoho Desk API
     │
     ▼
Inngest Cron (08:00 SAST daily)
  ├── 1. Fetch all "whatsapp lead" tickets + conversations from Zoho Desk
  ├── 2. Extract lead profiles via ConversationIntelligence
  ├── 3. Derive insight statuses (coverage, sign-up, awaiting, etc.)
  ├── 4. Cross-reference emails/phones against consumer_orders (Supabase)
  ├── 5. Write snapshot → campaign_report_snapshots (Supabase)
  ├── 6. Upsert per-ticket data → campaign_ticket_snapshots (Supabase)
  └── 7. Send email digest via Resend → jeffrey.de.wee@circletel.co.za

Admin Dashboard /admin/integrations/whatsapp-campaign
  └── Reads from Supabase (snapshots + ticket data) + live Zoho API (today's partial data)

One-off Backfill Script (run once)
  └── scripts/backfill-whatsapp-campaign-tags.ts
      └── Search Zoho Desk for fb.me/ URL subjects → PATCH add "whatsapp lead" tag
```

---

## New Files

| File | Purpose |
|------|---------|
| `lib/integrations/zoho/desk-campaign-service.ts` | Campaign-specific Zoho Desk queries + ConversationIntelligence class |
| `lib/inngest/functions/whatsapp-campaign-report.ts` | Inngest cron function (daily 08:00 SAST) |
| `supabase/migrations/20260415_campaign_report_snapshots.sql` | Daily aggregate snapshot table |
| `supabase/migrations/20260415_campaign_ticket_snapshots.sql` | Per-ticket data table |
| `app/api/admin/whatsapp-campaign/report/route.ts` | API route for dashboard data |
| `app/admin/integrations/whatsapp-campaign/page.tsx` | Admin dashboard page |
| `scripts/backfill-whatsapp-campaign-tags.ts` | One-off backfill script |

**Reuses existing:**
- `lib/integrations/zoho/desk-service.ts` — base Zoho Desk HTTP client
- `lib/integrations/zoho/auth-service.ts` — OAuth token management
- `components/admin/shared/` — StatCard, SectionCard, StatusBadge
- Resend (already configured via `RESEND_API_KEY`, sender `billing@notify.circletel.co.za`)
- Inngest cron infrastructure

---

## Section 1: Backfill Script

**File:** `scripts/backfill-whatsapp-campaign-tags.ts`

**Logic:**
1. Query Zoho Desk for all tickets where subject contains `fb.me/` OR `lnk.ms/` OR "Hello! Can I get more info on this?"
2. Filter to tickets NOT already tagged `whatsapp lead`
3. PATCH each matching ticket to add `whatsapp lead` tag
4. Log results: tagged count, skipped count, errors

**Run once manually:**
```bash
npx ts-node scripts/backfill-whatsapp-campaign-tags.ts
```

---

## Section 2: Zoho Desk API Calls

All calls use the existing `ZohoDeskService.makeRequest()` pattern with `ZOHO_DESK_ORG_ID` and `ZOHO_ACCESS_TOKEN`.

| Purpose | Endpoint | Method |
|---------|----------|--------|
| List tagged tickets | `GET /tickets?tags=whatsapp lead&limit=100` | GET |
| Get ticket details | `GET /tickets/{id}` | GET |
| Get conversations | `GET /tickets/{id}/conversations` | GET |
| Get comments | `GET /tickets/{id}/comments` | GET |
| Add/update tag | `PATCH /tickets/{id}` `{ tags: ["whatsapp lead"] }` | PATCH |
| Search by subject | `GET /tickets/search?searchStr=fb.me` | GET |

**Pagination:** Use `from` + `limit` params to page through all tagged tickets.

---

## Section 3: Database Schema

### Table: `campaign_report_snapshots`

Daily aggregate — one row per report date.

```sql
CREATE TABLE campaign_report_snapshots (
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
```

`agent_breakdown` shape: `{ "Tamsyn Jacobs": 12, "Unassigned": 3 }`

`pipeline_breakdown` shape:
```json
{
  "completed": 18,
  "signed_up": 3,
  "no_coverage": 4,
  "awaiting_details": 12,
  "awaiting_agent": 2,
  "in_progress": 8,
  "unresponsive": 6,
  "closed_resolved": 4
}
```

### Table: `campaign_ticket_snapshots`

Per-ticket record, upserted on every cron run.

```sql
CREATE TABLE campaign_ticket_snapshots (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id             text UNIQUE NOT NULL,
  ticket_number         text,
  subject               text,
  status                text,
  assigned_agent        text,
  contact_name          text,
  contact_phone         text,
  contact_email         text,
  -- Lead profile (extracted from GC conversation)
  lead_name             text,
  lead_email            text,
  lead_phone            text,
  lead_address          text,
  -- Insight
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

CREATE INDEX idx_campaign_tickets_insight ON campaign_ticket_snapshots(insight_status);
CREATE INDEX idx_campaign_tickets_agent ON campaign_ticket_snapshots(assigned_agent);
CREATE INDEX idx_campaign_tickets_signed_up ON campaign_ticket_snapshots(is_signed_up);
```

`conversations` array item shape:
```json
{
  "id": "abc123",
  "author": "Tamsyn Jacobs",
  "direction": "out",
  "content": "We will have a promo next week...",
  "timestamp": "2026-04-14T10:09:00Z",
  "channel": "whatsapp"
}
```

---

## Section 4: ConversationIntelligence

**File:** `lib/integrations/zoho/desk-campaign-service.ts`

A class that processes conversation threads to extract lead data and assign insight statuses.

### Insight Status Labels

| Status | Detection Logic |
|--------|----------------|
| `completed` | All 4 GC fields captured (name + email + phone + address) AND thread count ≥ 5 |
| `awaiting_details` | GC started but 1+ fields missing |
| `no_coverage` | Any agent message contains "no coverage", "not available", "coverage check failed" |
| `signed_up` | `is_signed_up = true` (cross-referenced with `consumer_orders`) |
| `awaiting_agent` | Customer has replied, no outbound agent message yet |
| `in_progress` | Agent engaged, conversation active, ticket Open |
| `closed_resolved` | Ticket status = Closed |
| `unresponsive` | Last customer message > 48h ago, no agent follow-up, ticket still Open |

Priority order (highest wins): `signed_up` > `no_coverage` > `closed_resolved` > `completed` > `in_progress` > `awaiting_details` > `awaiting_agent` > `unresponsive`

### Lead Profile Extraction

Fields are extracted from conversation messages in GC step order:

| GC Step | Extraction Method |
|---------|-------------------|
| Your Location | First inbound message after "location" prompt — stored as `lead_address` |
| Customer Full Names | First inbound message after "full name" prompt — stored as `lead_name` |
| Customer Email | Regex `[\w.]+@[\w.]+\.\w+` on inbound messages — stored as `lead_email` |
| Customer Contact Numbers | Regex `(\+27\|0)[6-8]\d{8}` on inbound messages — stored as `lead_phone` |

### Sign-up Cross-Reference

After extracting `lead_email` and `lead_phone`, query Supabase `consumer_orders` table:
```sql
SELECT id FROM consumer_orders
WHERE email = $lead_email
   OR phone = $lead_phone
LIMIT 1;
```
If matched: `is_signed_up = true`, `order_id = matched id`.

---

## Section 5: Inngest Cron Function

**File:** `lib/inngest/functions/whatsapp-campaign-report.ts`

```
Event: scheduled (cron)
Schedule: 0 6 * * *  (06:00 UTC = 08:00 SAST)
Retries: 2
```

**Steps:**
1. `fetch-all-campaign-tickets` — GET all `whatsapp lead` tickets from Zoho Desk (paginated)
2. `fetch-conversations` — GET conversations for each ticket (parallel, batched 10 at a time)
3. `extract-intelligence` — Run ConversationIntelligence on each ticket
4. `cross-reference-orders` — Batch query `consumer_orders` for lead emails/phones
5. `upsert-ticket-snapshots` — Upsert all ticket records to `campaign_ticket_snapshots`
6. `compute-daily-aggregate` — Compute metrics for previous day
7. `write-report-snapshot` — Insert/upsert row to `campaign_report_snapshots`
8. `send-email-report` — Send via Resend

---

## Section 6: Email Report Template

**Sender:** `billing@notify.circletel.co.za`
**Recipient:** `jeffrey.de.wee@circletel.co.za`
**Subject:** `WhatsApp Campaign Report — {DD MMM YYYY} | {N} new leads`

```
─────────────────────────────────────────
CircleTel | WhatsApp Lead Campaign Report
{Weekday}, {DD MMM YYYY}
─────────────────────────────────────────

YESTERDAY AT A GLANCE
  New Leads:          12
  Conversions:         3   (25.0% rate)
  Unassigned:          2   ⚠

TICKET STATUS
  Open:               34
  Closed:              3
  Total (all time):   57

AGENT RESPONSE
  Avg. First Response:   2h 14m
  Tamsyn Jacobs:         28 tickets
  Unassigned:             3 tickets

LEAD PIPELINE (all time)
  Signed Up:           3  ✅
  Completed GC:       18
  In Progress:         8
  Awaiting Details:   12
  No Coverage:         4
  Awaiting Agent:      2  ⚠
  Unresponsive:        6

NEW SIGN-UPS YESTERDAY
  • Sipho Dlamini | sipho@gmail.com | 083 123 4567
    15 R42, Vaalview AH, Vanderbijlpark
  • ...

View full dashboard: https://www.circletel.co.za/admin/integrations/whatsapp-campaign
─────────────────────────────────────────
```

---

## Section 7: Admin Dashboard

**Route:** `/admin/integrations/whatsapp-campaign`
**File:** `app/admin/integrations/whatsapp-campaign/page.tsx`

### Layout

```
Header: "WhatsApp Lead Campaign" | Date range picker | Refresh button

StatCards row:
  [Total Leads] [Conversions] [Conversion Rate %] [Avg Response Time]

Row 2:
  [Daily New Leads bar chart — 30 days]  |  [Pipeline funnel]

Tabs: Overview | Leads | Agent Performance | Conversations

— Overview tab —
  Recent 20 tickets table:
  Ticket # | Contact | Status badge | Insight badge | Agent | Address | Created

— Leads tab —
  Full leads table with filters (status, agent, date):
  Name | Email | Phone | Address | Insight Status | Signed Up? | Agent | Date
  [Export CSV button]

— Agent Performance tab —
  Agent | Tickets Assigned | Avg Response Time | Closed Count | Conversion Rate

— Conversations tab —
  Ticket list with expandable rows → inline conversation thread
```

### Components Used
- `StatCard`, `SectionCard`, `StatusBadge` from `components/admin/shared/`
- `UnderlineTabs`, `TabPanel` from `components/admin/shared/`
- New: `InsightBadge` — colour-coded pill for the 8 insight statuses
- New: `ConversationThread` — renders conversation messages inline

### Data Loading
- Page load: reads `campaign_report_snapshots` + `campaign_ticket_snapshots` from Supabase
- "Refresh" button: calls `/api/admin/whatsapp-campaign/report` which fetches live data from Zoho Desk for today (partial day)

---

## Section 8: API Route

**File:** `app/api/admin/whatsapp-campaign/report/route.ts`

```
GET /api/admin/whatsapp-campaign/report
  Query params:
    ?date=YYYY-MM-DD   — fetch snapshot for a specific date (default: today)
    ?live=true         — bypass Supabase cache, query Zoho Desk directly

Authentication: Admin auth required (service role)
```

Response shape:
```json
{
  "snapshot": { ...campaign_report_snapshots row },
  "tickets": [ ...campaign_ticket_snapshots rows ],
  "generatedAt": "2026-04-15T06:00:00Z",
  "isLive": false
}
```

---

## Environment Variables Required

```env
ZOHO_DESK_ORG_ID=<org_id>
ZOHO_ACCESS_TOKEN=<token>          # or ZOHO_DESK_ACCESS_TOKEN
ZOHO_REGION=US                     # or IN/EU/AU
RESEND_API_KEY=<key>               # already configured
CAMPAIGN_REPORT_RECIPIENT=jeffrey.de.wee@circletel.co.za
```

---

## Conversion Definition

| Conversion Type | Detection |
|-----------------|-----------|
| Ticket closed | `status = Closed` AND `tags contains "whatsapp lead"` |
| Service order placed | `consumer_orders` match on lead email or phone |

Both types are tracked independently and surfaced separately in the report.

---

## Out of Scope (Phase 1)

- Meta Ads API integration (cost-per-lead, impressions) — deferred to Phase 2
- Automated CRM lead creation in Zoho CRM from captured GC data
- SMS notifications
- Multi-campaign support (this report is hard-scoped to `whatsapp lead` tag)
