# Near-term: WhatsApp F1 + Admin Follow-up + Ops Floor — Design Spec

**Date:** 2026-07-31  
**Status:** Spec + implementation plan complete — **do not implement** until an explicit execute choice  
**ADR:** `docs/architecture/adr/2026-07-31-near-term-bss-goal.md`  
**Wayfinder:** `.scratch/near-term-bss-goal/` (destination met)  
**Implementation plan:** `docs/superpowers/plans/2026-07-31-near-term-f1-followup-floor.md`  
**Related plans:** `docs/plans/2026-07-08-whatsapp-flows-sales-crm.md`, `docs/plans/2026-07-29-bss-zoho-feature-roadmap.md`

---

## 1. Overview

### Goals

Deliver the **accepted near-term BSS goal** as three shippable workstreams that can land independently but share the lead funnel:

| Workstream | Outcome |
|------------|---------|
| **A — WhatsApp F1** | Customer completes Lead Qualification Flow → row in `coverage_leads` within seconds + confirmation + sales alert |
| **B — Admin follow-up** | Sales works unworked leads: queue, owner, notes, 2h first-response SLA, Zoho status visible |
| **C — Ops floor** | Device↔customer linkage for Ruijie APs; minimal activation/SLA path fix; consumer orphan service data fix |

### Non-goals

- F2 / F3 WhatsApp Flows  
- Full in-chat quote / KYC / checkout / order  
- Zoho Inventory / FSM  
- Admin support ticket UI rebuild (Desk remains support SoR)  
- WhatsApp ↔ Zoho Desk bridge on 084 (separate plan)  
- Full fulfillment stub pages (1.1)

---

## 2. Current baseline (verified 2026-07-31)

| Fact | Evidence |
|------|----------|
| Meta WABA ready for Flows | Wayfinder research 01: verified, GREEN, scopes OK; **0 flows** |
| F1 code | **None** — no `nfm_reply`, no `whatsapp_flow_sessions`, no flows module |
| `coverage_leads` | Exists with contact, address, interest, follow-up timestamps, Zoho sync columns; **no `assigned_admin_id`** |
| Admin “leads” | `app/admin/sales-engine/leads` is **lead scoring**, not a follow-up workbench on `coverage_leads` |
| Ruijie | **22/22** devices sampled unlinked (`customer_order_id` null) |
| Activation | `lib/activation/service-activator.ts` references **`sla_tracking`** (orphan risk) |
| Active services | 24; billing day-1 cron live |

---

## 3. Workstream A — WhatsApp F1 Lead Qualification

### 3.1 Product contract (locked)

- **Boundary:** F1 only  
- **Entry:** site/landing WA link, QR, admin manual send (CTWA later, same flow)  
- **Screens:** Contact → Address → Interest → Contact pref + POPIA  
- **CRM:** `coverage_leads` + sales alert + confirmation; Zoho best-effort  

### 3.2 Field ↔ column map

Flow field names (Flow Builder + TypeScript must match exactly):

| Flow field | `coverage_leads` column | Notes |
|------------|-------------------------|--------|
| `first_name` | `first_name` | required |
| `last_name` | `last_name` | required |
| `customer_type` | `customer_type` | `consumer` \| `business` (normalize) |
| `email` | `email` | optional |
| `phone` | `phone` | prefer webhook sender WA id if form empty |
| `company_name` | `company_name` | optional; show if business |
| `address` | `address` | required |
| `suburb` | `suburb` | required |
| `city` | `city` | required |
| `province` | `province` | optional |
| `service_interest` | `requested_service_type` | map labels → existing enums where possible |
| `speed` | `requested_speed` | optional string |
| `budget_range` | `budget_range` | optional |
| `contact_preference` | `contact_preference` | required |
| `best_contact_time` | `best_contact_time` | optional |
| `popia_optin` | `metadata.popia_optin` + reject if false | required true |

Also set on insert:

- `lead_source` = `whatsapp_flow` (**requires** `ALTER TYPE ... ADD VALUE`)  
- `source_campaign` from session  
- `status` = `new`  
- `metadata.entry_source`, `metadata.flow_token`, `metadata.flow_id`  

### 3.3 Data model

**New table `whatsapp_flow_sessions`** (service-role only RLS):

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `flow_token` | text UNIQUE | correlation; single-use complete |
| `flow_id` | text | Meta flow id |
| `flow_name` | text | e.g. `lead_qualification` |
| `phone` | text | E.164 digits |
| `entry_source` | text | `website` \| `qr` \| `admin` \| `ctwa_ad` \| `manual` |
| `source_campaign` | text nullable | |
| `status` | text | `sent` → `completed` \| `expired` \| `failed_parse` |
| `response_payload` | jsonb | parsed form |
| `raw_webhook` | jsonb | dead-letter |
| `coverage_lead_id` | uuid FK nullable | |
| `whatsapp_message_id` | text nullable | |
| `created_at` / `updated_at` / `completed_at` | timestamptz | |

### 3.4 Components (code)

| Unit | Path | Responsibility |
|------|------|----------------|
| Types + guards | `lib/integrations/whatsapp/flows/types.ts` | F1 response type + `isF1Response` |
| Session repo | `lib/integrations/whatsapp/flows/session-store.ts` | create/lookup/complete session |
| Sender | `lib/integrations/whatsapp/flows/flow-sender.ts` | `sendFlow`, `sendFlowTemplate` |
| Completion handler | `lib/integrations/whatsapp/flows/flow-response-handler.ts` | parse → lead insert → alert |
| Webhook branch | `app/api/webhooks/whatsapp/route.ts` | `nfm_reply` → handler; always 200 |
| Admin send API | `app/api/admin/whatsapp/flows/send/route.ts` | RBAC; manual F1 send |
| Public entry helpers | site CTAs already using `CONTACT.WHATSAPP_LINK` + optional prefilled text pointing to “start flow” once published |

### 3.5 Meta / env (ops + code)

| Item | Owner |
|------|--------|
| Build F1 in Flow Builder (DRAFT) | Ops + engineer |
| Draft E2E → capture real `nfm_reply` fixture | Engineer |
| `WHATSAPP_FLOW_LEAD_QUALIFICATION_ID` | `.env.local`, Coolify, `.env.example` |
| Flow-button template `circletel_lead_qualification` (MARKETING) | Meta approval |
| Publish flow when staging green | Ops |

### 3.6 Acceptance criteria (A)

1. Draft F1 completes on a test phone; webhook logs show `nfm_reply`.  
2. Completing F1 creates exactly one `coverage_leads` row (duplicate webhook = no second lead).  
3. False POPIA → no lead; session `failed_parse` or explicit reject status.  
4. Sales alert email sent; customer confirmation template attempted.  
5. Zoho failure still leaves lead in Supabase with sync error fields set.  
6. Admin can send F1 to a number (RBAC).  
7. Unit tests for handler use real payload fixtures (no mock of parser core).

---

## 4. Workstream B — Admin lead follow-up MVP

### 4.1 Product contract (locked)

Queue + detail + assign owner + 2h SLA + Zoho status visible. Not full CRM.

### 4.2 Schema

Migration additive:

```sql
ALTER TABLE public.coverage_leads
  ADD COLUMN IF NOT EXISTS assigned_admin_id uuid REFERENCES admin_users(id),
  ADD COLUMN IF NOT EXISTS first_response_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_responded_at timestamptz;

-- Optional index for queue
CREATE INDEX IF NOT EXISTS idx_coverage_leads_queue
  ON public.coverage_leads (status, next_follow_up_at, created_at DESC);
```

**SLA rule:** On insert (any source) or when status becomes `new`, set  
`first_response_due_at = created_at + 2 business hours` (SAST Mon–Fri 08:00–17:00 — reuse or add small helper in `lib/dates/business-days.ts`).

On first staff note or status change from `new` → non-new: set `first_responded_at` if null.

### 4.3 Surfaces

| Surface | Path | Behaviour |
|---------|------|-----------|
| Queue page | `app/admin/leads/page.tsx` (new; **not** sales-engine scoring page) | Table: name, phone, source, status, age, owner, Zoho status, SLA badge (ok / due soon / overdue) |
| Detail | `app/admin/leads/[id]/page.tsx` | Full lead fields, notes editor → `follow_up_notes` + bump `last_contacted_at` / `follow_up_count`, set `next_follow_up_at`, assign owner |
| List API | `app/api/admin/leads/route.ts` | Filters: status, source, assigned, overdue SLA, search |
| Patch API | `app/api/admin/leads/[id]/route.ts` | Update notes, status, assignment, next follow-up |
| SLA cron | `app/api/cron/lead-followup-sla/route.ts` | Find `new` + `first_response_due_at < now` + `first_responded_at is null`; send escalate email (existing sales-alert pattern); log execution |
| Nav | admin nav config | Link **Leads** under Sales / appropriate workspace |

Auth: existing admin session + RBAC pattern from `app/api/admin/billing/whatsapp/send`.

### 4.4 Acceptance criteria (B)

1. Admin sees all `coverage_leads` including `whatsapp_flow` when present.  
2. Can assign owner; queue filters by unassigned / mine / overdue.  
3. SLA badge correct for business-hours math.  
4. Cron emails on overdue first response (dry-run flag optional).  
5. Zoho columns display-only (no new retry engine).  
6. Does not replace Desk for support tickets.

---

## 5. Workstream C — Ops floor

### 5.1 Device ↔ customer linkage (1.4)

| Item | Spec |
|------|------|
| Problem | All Ruijie APs unlinked |
| API | Existing `/api/ruijie/devices/[sn]/link` (verify/extend) |
| Admin | Minimal bulk link UI or table on network devices: SN → customer / order / corporate site |
| Success | Critical paying sites linkable; reporting can join device → customer |

### 5.2 Minimal activation / SLA path (1.3)

| Item | Spec |
|------|------|
| Problem | `service-activator` writes `sla_tracking` which may be missing |
| Options (pick at implement) | (a) add thin `sla_tracking` table if product still wants SLA rows, or (b) remove/guard insert so activation does not swallow/throw on missing table |
| Success | Activation path does not fail silently on missing relation; errors logged/alerted |

### 5.3 Consumer orphan service (1.6)

| Item | Spec |
|------|------|
| Problem | Active consumer service without matching `billing_active` order (was 4 vs 3) |
| Work | Scripted audit + data fix (link or deactivate orphan) with finance/ops sign-off |
| Success | Documented 1:1 active consumer service ↔ billable order (or explicit exception) |

---

## 6. Sequencing

Recommended ship order (each independently testable):

```
C.1 orphan audit (XS)     ─┐
C.2 sla_tracking guard    ─┼─ floor stabilizes base
B.1 schema + APIs         ─┤
B.2 queue UI + SLA cron   ─┼─ follow-up before/with F1
A.1 migration + types     ─┤
A.2 webhook + handler     ─┼─ F1 capture
A.3 sender + admin send   ─┤
A.4 Meta draft/publish    ─┘
C.3 device link UI/ops    ── can parallel after C.1
```

F1 without admin queue re-creates the March gap — prefer **B before or with A**, not long after.

---

## 7. Risks

| Risk | Mitigation |
|------|------------|
| MARKETING template slow approval | Site/QR customer-initiated flow does not need template; template only for admin cold send |
| Webhook drops inbound | Always 200; dead-letter on session; later persist inbound messages |
| Double lead on Meta retry | Idempotent complete on `flow_token` |
| assigned_admin_id FK to wrong table | Confirm `admin_users.id` vs auth.users |
| Desk bridge / F1 share webhook | Same route: branch by message type; do not block F1 on Desk work |

---

## 8. Success criteria (near-term goal)

1. F1 E2E: phone complete → lead + alert + confirm.  
2. Unworked leads visible, assignable, SLA escalated after 2h business.  
3. Floor: no activation hard-fail on sla_tracking; orphan fixed; ≥ critical APs linkable.  
4. ADR non-goals remain unbuilt.

---

## 9. Out of scope (repeat)

F2/F3, full WhatsApp order, Inventory, FSM, admin Desk UI, env polish, auto-debit of leads.
