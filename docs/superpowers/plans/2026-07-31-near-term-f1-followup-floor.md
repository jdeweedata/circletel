# Near-term F1 + Admin Follow-up + Ops Floor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship WhatsApp F1 lead capture, admin lead follow-up (2h SLA), and ops floor fixes per ADR `docs/architecture/adr/2026-07-31-near-term-bss-goal.md`.

**Architecture:** Three independent workstreams share `coverage_leads`. F1 writes leads via webhook `nfm_reply`; admin queue assigns and SLAs them; floor stabilizes devices/activation/orphan data. Deterministic CRM writes (no LLM in control plane).

**Tech Stack:** Next.js 15 App Router, Supabase, WhatsApp Cloud API Flows, Resend, existing admin RBAC patterns.

**Spec:** `docs/superpowers/specs/2026-07-31-near-term-f1-followup-floor-design.md`  
**Do not implement until explicitly executing this plan.**

---

## File map

| Area | Create | Modify |
|------|--------|--------|
| F1 | `lib/integrations/whatsapp/flows/*`, migration `whatsapp_flow_sessions`, admin send route, tests | `app/api/webhooks/whatsapp/route.ts`, `lib/integrations/whatsapp/index.ts` |
| Follow-up | `app/admin/leads/**`, `app/api/admin/leads/**`, SLA cron, migration columns | admin nav |
| Floor | audit script, optional sla migration or activator guard, device link UI glue | `lib/activation/service-activator.ts`, Ruijie link API/UI |

---

## Workstream C — Ops floor (start first if parallel capacity is limited)

### Task C1: Consumer orphan service audit + fix script

**Files:**
- Create: `scripts/billing/audit-consumer-service-order-orphans.ts`
- Docs: append result note to `docs/analysis/` if fix applied

- [ ] **Step 1:** Query active consumer services vs `consumer_orders` with `billing_active` (or project’s billable flag); print orphans.
- [ ] **Step 2:** With ops confirmation, deactivate orphan **or** link to order; dry-run default, `--execute` writes.
- [ ] **Step 3:** Re-run audit; expect zero unexplained orphans.
- [ ] **Step 4:** Commit script + one-line result note.

### Task C2: Guard or create `sla_tracking` path

**Files:**
- Modify: `lib/activation/service-activator.ts` (~line 115)
- Optional Create: `supabase/migrations/YYYYMMDDHHMMSS_sla_tracking_minimal.sql`

- [ ] **Step 1:** Confirm whether `sla_tracking` exists in live DB (`information_schema` / select).
- [ ] **Step 2:** If missing: either add minimal table **or** wrap insert in existence check / try-catch that logs and continues without swallowing all errors.
- [ ] **Step 3:** Unit or integration test: activator does not throw on missing SLA when guarded.
- [ ] **Step 4:** Commit.

### Task C3: Device ↔ customer linkage ops path

**Files:**
- Modify: existing Ruijie link API if needed
- Create or Modify: admin devices list with link action (smallest UI that uses existing API)

- [ ] **Step 1:** Document current link API request/response from code.
- [ ] **Step 2:** Admin table: unlinked devices + customer/order picker + link.
- [ ] **Step 3:** Link ≥ critical sites (ops list); verify `ruijie_device_cache.customer_order_id` or `corporate_site_id` set.
- [ ] **Step 4:** Commit.

---

## Workstream B — Admin follow-up

### Task B1: Schema for assignment + SLA

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_coverage_leads_followup_sla.sql`

```sql
-- Apply manually to shared DB (no CI migration runner).
ALTER TABLE public.coverage_leads
  ADD COLUMN IF NOT EXISTS assigned_admin_id uuid REFERENCES public.admin_users(id),
  ADD COLUMN IF NOT EXISTS first_response_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_responded_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_coverage_leads_followup_queue
  ON public.coverage_leads (status, first_response_due_at, created_at DESC);
```

- [ ] **Step 1:** Confirm `admin_users.id` type matches uuid.
- [ ] **Step 2:** Write migration file; apply to shared DB manually; verify columns.
- [ ] **Step 3:** Commit migration file only after apply verified (or commit with ops note if apply is manual later).

### Task B2: Business-hours SLA helper

**Files:**
- Create: `lib/leads/first-response-sla.ts`
- Test: `__tests__/lib/leads/first-response-sla.test.ts`

- [ ] **Step 1:** Write failing tests for `addBusinessHours(start, 2)` SAST Mon–Fri 08:00–17:00 (cross weekend, mid-day, after hours).
- [ ] **Step 2:** Implement helper; tests green.
- [ ] **Step 3:** Commit.

### Task B3: Admin leads API

**Files:**
- Create: `app/api/admin/leads/route.ts` (GET list)
- Create: `app/api/admin/leads/[id]/route.ts` (GET one, PATCH)

- [ ] **Step 1:** GET list: session auth + service role query; filters `status`, `assigned_admin_id`, `overdue` (`first_response_due_at < now` AND `first_responded_at is null` AND status=new), `q` search name/phone/email, `lead_source`.
- [ ] **Step 2:** PATCH: notes, status, assigned_admin_id, next_follow_up_at; on first response set `first_responded_at` and `last_contacted_at`.
- [ ] **Step 3:** On create paths that insert leads (later F1), set `first_response_due_at` via helper — for existing leads backfill optional script.
- [ ] **Step 4:** Smoke with curl as admin; commit.

### Task B4: Admin leads UI

**Files:**
- Create: `app/admin/leads/page.tsx`
- Create: `app/admin/leads/[id]/page.tsx`
- Modify: admin navigation config (find existing nav registry / sidebar)

- [ ] **Step 1:** Queue table with SLA badge (green / amber / red).
- [ ] **Step 2:** Detail: fields + notes + assign select of admin_users + save.
- [ ] **Step 3:** Nav entry **Leads** (Sales workspace if multi-workspace).
- [ ] **Step 4:** Manual UI pass; commit.

### Task B5: SLA escalation cron

**Files:**
- Create: `app/api/cron/lead-followup-sla/route.ts`
- Modify: `vercel.json` crons + regenerate host crontab via `ops/scheduler/generate-crontab.sh | crontab -`

- [ ] **Step 1:** Cron GET/POST with `CRON_SECRET`; query overdue first response; Resend to sales inbox; dedupe via metadata or last alert column if needed.
- [ ] **Step 2:** Schedule e.g. every 30 min business hours or hourly.
- [ ] **Step 3:** Install crontab with `--max-time 360` generator; `check-drift.sh`.
- [ ] **Step 4:** Commit.

---

## Workstream A — WhatsApp F1

### Task A1: Migration + enum

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_whatsapp_flow_sessions.sql`

```sql
ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'whatsapp_flow';

CREATE TABLE public.whatsapp_flow_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_token text NOT NULL UNIQUE,
  flow_id text NOT NULL,
  flow_name text NOT NULL,
  phone text NOT NULL,
  entry_source text NOT NULL,
  source_campaign text,
  status text NOT NULL DEFAULT 'sent',
  response_payload jsonb,
  raw_webhook jsonb,
  coverage_lead_id uuid REFERENCES public.coverage_leads(id),
  whatsapp_message_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.whatsapp_flow_sessions ENABLE ROW LEVEL SECURITY;
-- service role only (no anon policies)
```

- [ ] **Step 1:** Apply manually to shared DB; verify enum + table.
- [ ] **Step 2:** Commit migration file.

### Task A2: Types + session store + handler tests (TDD)

**Files:**
- Create: `lib/integrations/whatsapp/flows/types.ts`
- Create: `lib/integrations/whatsapp/flows/session-store.ts`
- Create: `lib/integrations/whatsapp/flows/flow-response-handler.ts`
- Create: `lib/integrations/whatsapp/flows/__tests__/flow-response-handler.test.ts`
- Create: fixtures under `__tests__/.../fixtures/nfm_reply_f1.json` (replace with real payload after Meta draft test)

- [ ] **Step 1:** Define `F1LeadQualificationResponse` + type guard per design field map.
- [ ] **Step 2:** Tests: happy path → lead insert mocked supabase; unknown token; duplicate complete; popia false; malformed JSON.
- [ ] **Step 3:** Implement handler; tests green.
- [ ] **Step 4:** Commit.

### Task A3: Flow sender + webhook wire

**Files:**
- Create: `lib/integrations/whatsapp/flows/flow-sender.ts`
- Modify: `lib/integrations/whatsapp/index.ts` exports
- Modify: `app/api/webhooks/whatsapp/route.ts` — branch `interactive.nfm_reply`

- [ ] **Step 1:** `sendFlow` creates session then posts Cloud API interactive flow message.
- [ ] **Step 2:** Webhook calls handler; always return 200.
- [ ] **Step 3:** Persist non-flow inbound optional log (nice-to-have, not required).
- [ ] **Step 4:** Commit.

### Task A4: Confirmation + sales alert

**Files:**
- Modify: handler after lead insert
- Reuse: Resend patterns from billing notify; confirmation template name TBD (`circletel_lead_received` or existing)

- [ ] **Step 1:** On success, send confirmation template (or temporary free-form only if 24h window — prefer template).
- [ ] **Step 2:** Sales alert email with deep link `/admin/leads/[id]`.
- [ ] **Step 3:** Set `first_response_due_at` on lead insert via B2 helper.
- [ ] **Step 4:** Commit.

### Task A5: Admin send endpoint

**Files:**
- Create: `app/api/admin/whatsapp/flows/send/route.ts`

- [ ] **Step 1:** POST `{ phone, entry_source, source_campaign? }` RBAC admin; calls `sendFlow`.
- [ ] **Step 2:** Manual test with draft flow + test number.
- [ ] **Step 3:** Commit.

### Task A6: Meta Flow Builder + env + E2E (ops + engineer)

**Files:**
- Modify: `.env.example` with `WHATSAPP_FLOW_LEAD_QUALIFICATION_ID=`
- Coolify env (ops)

- [ ] **Step 1:** Build DRAFT F1 in Meta Flow Builder; field names match `types.ts`.
- [ ] **Step 2:** Draft send E2E; capture real `nfm_reply` into fixtures; re-run tests.
- [ ] **Step 3:** Set env; staging E2E; publish flow; production E2E on controlled number.
- [ ] **Step 4:** Submit flow-button template if admin cold-send required (can lag).

---

## Env checklist

| Var | Where |
|-----|--------|
| Existing WA vars | already |
| `WHATSAPP_FLOW_LEAD_QUALIFICATION_ID` | local + Coolify |
| `WHATSAPP_APP_SECRET` | Coolify before signature verify (Desk bridge / hardening) |
| `CRON_SECRET` | already |

---

## Self-review

| Spec section | Tasks |
|--------------|--------|
| F1 fields/CRM | A1–A6 |
| Admin queue/SLA | B1–B5 |
| Floor 1.3/1.4/1.6 | C1–C3 |
| Non-goals | Not tasked |

No placeholder “TBD implement later” steps for core paths; Meta template approval may lag admin cold-send.

---

## Execution handoff

**Plan complete.** Saved to:

- Spec: `docs/superpowers/specs/2026-07-31-near-term-f1-followup-floor-design.md`
- Plan: `docs/superpowers/plans/2026-07-31-near-term-f1-followup-floor.md`

**Two execution options (when you choose to implement):**

1. **Subagent-Driven (recommended)** — fresh subagent per task + review  
2. **Inline Execution** — executing-plans in session with checkpoints  

**Do not implement until you pick one.**
