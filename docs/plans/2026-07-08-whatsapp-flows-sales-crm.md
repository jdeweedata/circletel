# WhatsApp Flows — Customer Sales Journey → CircleTel CRM

**Date**: 2026-07-08
**Status**: PLANNED
**Docs**: https://developers.facebook.com/documentation/business-messaging/whatsapp/flows/gettingstarted
**Branch**: `claude/whatsapp-flows-sales-crm-532d37`

## Goal

Use WhatsApp Flows (native in-chat forms) to run a structured sales journey — lead
qualification → B2B deep-qualification → follow-up booking — and capture every
completion into the CircleTel CRM (`coverage_leads` / `business_quotes` + Zoho CRM sync)
with an immediate sales alert. This closes the March-2026 campaign gap where 60% of
WhatsApp leads got zero follow-up.

## What already exists (reuse, don't rebuild)

| Asset | Location | Role in this plan |
|---|---|---|
| Cloud API sender (templates, SA phone formatting, logging) | `lib/integrations/whatsapp/whatsapp-service.ts` | Add `sendFlow()` + flow-button template sending |
| Template manager + registration scripts | `lib/integrations/whatsapp/whatsapp-template-manager.ts`, `scripts/create-*-template.ts` | Register the flow-button template |
| Verified Meta webhook | `app/api/webhooks/whatsapp/route.ts` | Handle `nfm_reply` flow completions (currently ignores incoming messages) |
| Message log | `whatsapp_message_log` table | Track flow message delivery |
| CRM lead table with Zoho sync columns | `coverage_leads` (`zoho_lead_id`, `zoho_sync_status`, …) | Flow completions land here |
| Zoho CRM client | `lib/zoho-api-client.ts` (`createLead`) | Auto-sync flow leads |
| Env vars | `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Already configured |

## Key design decisions

1. **Phase 1/2 use `navigate` (static) flows only.** Answers arrive on the existing
   webhook as an `nfm_reply` interactive message (`response_json`). No encrypted
   `data_exchange` endpoint until Phase 3.
2. **`flow_token` is the correlation ID.** One UUID per send, persisted in a new
   `whatsapp_flow_sessions` table before sending; single-use; unknown/reused tokens
   are logged and rejected.
3. **CRM writes are deterministic code, not chat parsing** (Rule 5). The flow's form
   fields map 1:1 to `coverage_leads` columns.
4. **New enum value** `whatsapp_flow` added to `lead_source` (additive migration —
   `ALTER TYPE ... ADD VALUE` is safe on the shared DB).
5. **Webhook always returns 200** (Meta retries on non-200). Parse failures go to a
   dead-letter column/status on `whatsapp_flow_sessions`, never dropped silently.

## The three flows

| Flow | Audience | Entry | Screens | CRM outcome |
|---|---|---|---|---|
| **F1 Lead Qualification** | All inbound | CTWA ads, site button, QR | Contact → Address → Service interest/budget → Contact pref + POPIA opt-in | `coverage_leads` row + Zoho lead + sales alert |
| **F2 B2B Qualification** | F1 completions with type=business; cold outreach | Follow-up template | Company/reg → Current ISP, spend, contract end → Sites/users | Lead enrichment → `business_quotes` pipeline |
| **F3 Follow-up Booking** | Unresponsive/aging leads | Scheduled template | Pick day/time slot → Confirm | `next_follow_up_at` + `follow_up_count` on lead, alert to sales |

---

# Phase 0 — Meta prerequisites (no code, ~1–2 days elapsed, mostly waiting)

Blockers for everything else. Do first, in WhatsApp Manager / Meta Business Suite.

### TODO / Checklist

- [ ] **0.1** Confirm Meta Business verification status is **Verified** (Business Settings → Security Centre). Unverified = flows only to test numbers.
- [ ] **0.2** Confirm phone number quality rating is **High/Green** (WhatsApp Manager → phone numbers). Low quality can get Flows revoked.
- [ ] **0.3** Confirm the WABA has Flows available (WhatsApp Manager → Account Tools → Flows tab exists).
- [ ] **0.4** Verify the system-user access token has `whatsapp_business_messaging` + `whatsapp_business_management` scopes (management scope needed for Flows API/template registration).
- [ ] **0.5** Build **Flow F1 in Flow Builder** (UI, no code) as DRAFT: 4 screens per table above; field `name`s must exactly match the payload contract in Phase 1 (see 1.2).
- [ ] **0.6** Send draft F1 to a test number (`flow_action_payload` with `mode: draft`) and complete it end-to-end; confirm the `nfm_reply` webhook payload arrives in prod webhook logs.
- [ ] **0.7** Record the `flow_id` and add `WHATSAPP_FLOW_LEAD_QUALIFICATION_ID` to `.env.local`, Coolify env, and `.env.example`.
- [ ] **0.8** Draft + submit the **flow-button template** (`circletel_lead_qualification`, category MARKETING) for approval — approval can take hours→days, so submit early even though it's only needed for business-initiated sends.

**Exit criteria**: draft flow completes on a test phone and its `nfm_reply` JSON is visible in webhook logs.

---

# Phase 1 — Foundation: F1 + webhook capture → CRM (~2–3 dev days)

Goal: a customer completes F1 and a `coverage_leads` row exists within seconds, with full traceability.

### 1.1 Migration — `whatsapp_flow_sessions` + enum value

`supabase/migrations/20260708______create_whatsapp_flow_sessions.sql` (applied **manually** to the shared DB — this repo has no CI migration step; see offers-build-time drift incident):

- `whatsapp_flow_sessions`: `id`, `flow_token` (unique), `flow_id`, `flow_name`, `phone`, `entry_source` (ctwa_ad/website/qr/manual/followup), `source_campaign`, `status` (`sent` → `delivered` → `completed` / `expired` / `failed_parse`), `response_payload` jsonb, `raw_webhook` jsonb (dead-letter), `coverage_lead_id` FK, `whatsapp_message_id`, timestamps.
- `ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'whatsapp_flow';`
- RLS: service-role only (same posture as `onboarding_tokens`).

### 1.2 Flow response contract

`lib/integrations/whatsapp/flows/types.ts` — one TypeScript type per flow response, e.g. `F1LeadQualificationResponse { first_name, last_name, customer_type, address, suburb, city, service_interest, speed, budget_range, contact_preference, best_contact_time, popia_optin }`. Field names are the single source of truth shared with Flow Builder (0.5). Validate with a plain type-guard (no new deps).

### 1.3 Sender

`lib/integrations/whatsapp/flows/flow-sender.ts`:
- `sendFlow({ to, flowId, flowCta, screen, entrySource, sourceCampaign })` — creates `whatsapp_flow_sessions` row (generates `flow_token`), then sends the interactive flow message (`type: interactive`, `interactive.type: flow`, `flow_message_version: "3"`, `flow_action: navigate`); logs to `whatsapp_message_log` via existing service patterns (lazy-config, formatted phone).
- `sendFlowTemplate(...)` — same but via the approved template with flow button (business-initiated, outside 24h window).

### 1.4 Webhook handler

Extend `app/api/webhooks/whatsapp/route.ts` `POST`:
- When `value.messages[].type === 'interactive' && message.interactive.type === 'nfm_reply'` → `handleFlowCompletion()` in new `lib/integrations/whatsapp/flows/flow-response-handler.ts`.
- Handler: parse `interactive.nfm_reply.response_json` → look up session by `flow_token` → guards: unknown token (log+store raw, status `failed_parse`), already-completed token (idempotent no-op — Meta retries webhooks) → validate against F1 type → **insert `coverage_leads`** (`lead_source='whatsapp_flow'`, `source_campaign` from session, `contact_preference`, phone from webhook sender) → mark session `completed` + link lead id.
- Non-flow incoming messages: keep current behaviour (log only). Always return 200.

### 1.5 Confirmation + sales alert

- On successful lead creation: send existing-style confirmation template ("Thanks {{name}} — we're checking coverage at your address; expect contact by {{time}}").
- Sales alert email via Resend (existing pattern, `billing@notify.circletel.co.za` sender infra) to sales inbox with lead summary + admin deep link. (WhatsApp-to-staff alert optional later.)

### 1.6 Tests

`lib/integrations/whatsapp/flows/__tests__/flow-response-handler.test.ts` — real parse logic against captured `nfm_reply` fixtures from 0.6 (no mocking of the parser itself): happy path, unknown token, duplicate delivery, malformed response_json → dead-letter.

### TODO / Checklist

- [ ] **1.1** Write + manually apply migration; verify with `SELECT` on shared DB; confirm enum value present.
- [ ] **1.2** `flows/types.ts` response contract; cross-check field names against the published Flow Builder JSON (0.5).
- [ ] **1.3** `flow-sender.ts` (`sendFlow`, `sendFlowTemplate`) + export from `lib/integrations/whatsapp/index.ts`.
- [ ] **1.4** Webhook `nfm_reply` branch + `flow-response-handler.ts` with token guards and dead-letter path.
- [ ] **1.5** Confirmation template send + sales alert email on completion.
- [ ] **1.6** Handler tests green (fixtures from real draft-flow webhook payloads).
- [ ] **1.7** Admin trigger endpoint `app/api/admin/whatsapp/flows/send/route.ts` (RBAC-guarded, follows `admin/billing/whatsapp/send` auth pattern) so staff can send F1 manually to a number.
- [ ] **1.8** `npm run type-check:memory` clean for touched files; push branch → staging; end-to-end test on staging with draft flow + test number.
- [ ] **1.9** **Publish** F1 in Flow Builder; switch env var to published flow id; live E2E: complete flow on a real phone → `coverage_leads` row + confirmation + alert received.
- [ ] **1.10** PR → main; verify prod deploy green (`gh run list --workflow deploy.yml`).

**Exit criteria**: real phone completes F1 → lead row, Zoho-pending status, confirmation message, and sales email — all within one minute, with the session row telling the full story.

---

# Phase 2 — CRM wiring, ops visibility, marketing entry (~2 dev days)

Goal: flow leads are worked, measured, and fed by paid traffic.

### 2.1 Zoho CRM auto-sync
Reuse the existing `coverage_leads` → Zoho path (`zoho_sync_status='pending'` columns + `lib/zoho-api-client.ts.createLead`). Verify the existing sync job/route actually picks up new rows (find the caller; if sync is manual today, add a Vercel-cron style `/api/cron/*` step — **never Inngest** for schedules, per cron-mechanism rule). Map `Lead_Source` = "WhatsApp Flow", include `source_campaign`.

### 2.2 Admin visibility
- Leads list: add `whatsapp_flow` source badge + filter (existing admin leads view).
- New lightweight admin page `app/admin/whatsapp/flows/page.tsx`: sessions table (sent/completed/conversion %, per `entry_source`/`source_campaign`), dead-letter rows surfaced for retry.
- Retry action: re-parse a `failed_parse` session after a contract fix.

### 2.3 Follow-up SLA guard
Vercel cron `/api/cron/flow-lead-sla` (CRON_SECRET bearer, per existing pattern): any `whatsapp_flow` lead with no `last_contacted_at` after N business hours → escalation email. This is the direct fix for the March campaign failure.

### 2.4 Marketing entry points
- CTWA ads: point the R10K/mo B2B budget at click-to-WhatsApp; icebreaker reply auto-sends F1 (webhook: on first inbound message matching campaign referral (`referral` object in webhook payload), auto-send F1 with `entry_source='ctwa_ad'`, `source_campaign` from `referral.source_id`).
- Website: WhatsApp button uses `wa.me` link with prefilled keyword; keyword-triggered auto-send of F1.
- QR codes for field/clinic visits (WhatsApp Manager generates these).

### 2.5 F2 B2B flow
Build + publish F2 in Flow Builder; response contract + handler branch (enriches the existing lead / creates `business_quotes` entry); auto-offer F2 template to business-type F1 completions after a delay (reuse sender; simple deterministic trigger in the completion handler or SLA cron — no LLM routing).

### TODO / Checklist

- [ ] **2.1** Confirm/complete Zoho lead sync path for new rows; field mapping documented in `docs/api/` per api-param-documentation rule (Wrong-vs-Correct table for Zoho Lead fields).
- [ ] **2.2** Source badge + filter in admin leads view.
- [ ] **2.3** `app/admin/whatsapp/flows/page.tsx` sessions/conversion dashboard + dead-letter retry.
- [ ] **2.4** SLA cron route + `vercel.json` cron entry + escalation email.
- [ ] **2.5** CTWA `referral` handling in webhook → auto-send F1 with attribution.
- [ ] **2.6** F2 built, published, contract typed, handler branch + tests; auto-offer trigger for business-type leads.
- [ ] **2.7** Staging E2E: ad-simulated entry → F1 → F2 → both CRM records + Zoho leads visible.
- [ ] **2.8** Launch checklist with marketing: campaign uses CTWA objective, `source_campaign` naming convention agreed.

**Exit criteria**: paid ad click → completed flow → Zoho lead with attribution → SLA guard proves no lead sits uncontacted; per-campaign conversion visible in admin.

---

# Phase 3 — Dynamic flows (`data_exchange`) + booking (only after Phase 1–2 prove out; ~4–5 dev days)

Goal: live data inside the flow — real coverage results and packages on screen 3 of F1, and real slots in F3.

### 3.1 Encryption + endpoint plumbing (the hard part)
- Generate RSA-2048 keypair; upload public key via Graph API (`POST /{phone_number_id}/whatsapp_business_encryption`); private key in env (`WHATSAPP_FLOW_PRIVATE_KEY`) — never committed (gitleaks will enforce).
- `app/api/whatsapp/flows/data/route.ts`: decrypt request (RSA-OAEP-decrypt the AES key, AES-128-GCM decrypt payload), route on `action` (`ping` health check / `INIT` / `data_exchange`), encrypt response with **inverted IV** per spec. Must respond <10s (well within Fluid/standalone limits, but coverage lookups need a timeout budget).
- `lib/integrations/whatsapp/flows/flow-crypto.ts` with unit tests against Meta's published example vectors.

### 3.2 F1-dynamic: in-flow coverage check
Clone F1 → add `data_exchange` on the address screen: endpoint calls the existing coverage aggregation service (`lib/coverage/aggregation-service.ts`, 4-layer fallback) and returns available services/packages for the next screen. Fallback: on lookup error return a generic "we'll confirm coverage" screen — never dead-end the flow.

### 3.3 F3 booking flow
Slots from a simple availability config (or calendar integration if/when one exists — don't invent one); completion writes `next_follow_up_at`, bumps `follow_up_count`, alerts the assigned rep. Triggered by the SLA cron for aging leads.

### 3.4 Optional: order handoff
Final screen deep-links qualified consumer leads into the web order flow (`/packages/[leadId]`) with the lead pre-created — payment stays on web (NetCash), not in-flow.

### TODO / Checklist

- [ ] **3.1** Keypair generated, public key registered (verify via GET), private key in env everywhere + `.env.example` placeholder.
- [ ] **3.2** `flow-crypto.ts` + tests (Meta example vectors) green.
- [ ] **3.3** Endpoint route: `ping` health check passes in Flow Builder's endpoint checker; error codes handled (421 = re-fetch key, etc. documented Wrong-vs-Correct in `docs/api/`).
- [ ] **3.4** F1-dynamic cloned flow: address screen `data_exchange` → live packages screen; coverage-service timeout + fallback screen tested.
- [ ] **3.5** A/B: keep static F1 running; compare completion rates before switching default.
- [ ] **3.6** F3 built + published; SLA cron sends it to aging leads; completion updates follow-up fields + rep alert.
- [ ] **3.7** Staging E2E for all dynamic paths incl. forced coverage-API failure.
- [ ] **3.8** Prod rollout + one-week metrics review (completion rate static vs dynamic, lead→contact SLA, lead→order conversion).

**Exit criteria**: customer sees their real coverage/packages inside WhatsApp; aging leads self-book follow-ups; static flow remains as fallback.

---

## Cross-cutting gotchas (apply to every phase)

- **24-hour window**: interactive flow sends require an open service window; otherwise use the approved template with flow button. All business-initiated sends (F2 offer, F3 SLA sends) must use templates.
- **Published flows are immutable** — clone to change; keep flow ids in env vars, never hardcoded.
- **Webhook retries**: handlers must be idempotent on `flow_token` and message id.
- **POPIA**: F1 includes explicit opt-in checkbox; store it; respect existing `whatsapp/optin` routes.
- **Schema-first** (repo rule): verify `coverage_leads`/`business_quotes` column names against the live DB before each handler write.
- **Migrations are manual** on the shared prod DB — apply before merging code that depends on them (onboarding-tokens drift incident).
- **Secrets**: flow private key + tokens via env only; gitleaks pre-commit enforces.

## Success metrics

| Metric | Baseline (Mar 2026 campaign) | Target |
|---|---|---|
| Lead capture from WhatsApp conversation | Manual, free-text | 100% structured, auto-CRM |
| Leads with zero follow-up | 60% | 0% (SLA cron enforced) |
| Cost per qualified lead | R41.80/conversation, 0 conversions | Measurable per `source_campaign` |
| Time from completion → CRM + alert | n/a | < 1 minute |
