# F1 Lead Qualification — Meta Ops & E2E Runbook

**Date:** 2026-07-31  
**Code status:** Implemented on `feat/near-term-f1-followup-floor` (A1–A5)  
**This document:** Task A6 — Meta Flow Builder, env, draft/publish E2E (ops + engineer)

---

## Prerequisites (already in code)

| Item | Location |
|------|----------|
| Session table + `whatsapp_flow` enum | Applied migration `20260731020000_whatsapp_flow_sessions.sql` |
| `nfm_reply` webhook branch | `app/api/webhooks/whatsapp/route.ts` |
| Handler + tests | `lib/integrations/whatsapp/flows/` |
| Admin send | `POST /api/admin/whatsapp/flows/send` |
| Admin queue | `/admin/leads` |
| Env placeholder | `.env.example` → `WHATSAPP_FLOW_LEAD_QUALIFICATION_ID` |

---

## 1. Build DRAFT flow in Meta Flow Builder

1. Meta Business Suite → WhatsApp Manager → **Flows** → Create flow.
2. Name: `lead_qualification` (or similar; code stores `flow_name` as `lead_qualification` by default in sender).
3. **First screen name must be `CONTACT`** (matches `F1_DEFAULT_SCREEN` in `flow-sender.ts`). If you use a different first screen, update code before send.
4. Four screens (product contract):
   - **CONTACT** — name, customer type, email, phone, company
   - **ADDRESS** — address, suburb, city, province
   - **INTEREST** — service_interest, speed, budget_range
   - **PREF** — contact_preference, best_contact_time, popia_optin

### Field names (must match TypeScript exactly)

| Flow field name | Required | Notes |
|-----------------|----------|--------|
| `first_name` | yes | |
| `last_name` | yes | |
| `customer_type` | yes | Prefer values `consumer` / `business` (`business` → DB `smme`) |
| `email` | no | |
| `phone` | no | Webhook sender used if empty |
| `company_name` | no | Show if business |
| `address` | yes | |
| `suburb` | yes | |
| `city` | yes | |
| `province` | no | |
| `service_interest` | yes | Maps to `requested_service_type` |
| `speed` | no | |
| `budget_range` | no | |
| `contact_preference` | yes | |
| `best_contact_time` | no | |
| `popia_optin` | yes | Must be `true` boolean; false → no lead |

Save **flow ID** from Meta (numeric string).

---

## 2. Environment

| Variable | Where |
|----------|--------|
| `WHATSAPP_FLOW_LEAD_QUALIFICATION_ID` | `.env.local`, Coolify/production |
| Existing WA token / phone number ID | already required for Cloud API |
| `WHATSAPP_APP_SECRET` | recommended for signature verify (separate hardening) |

```bash
# After setting flow id:
grep WHATSAPP_FLOW_LEAD_QUALIFICATION_ID .env.local
```

Redeploy app after Coolify env change.

---

## 3. Draft E2E (test phone)

```bash
# Admin session cookie required for API; or use Meta draft send from Flow Builder.
# Prefer admin API once logged into admin:

curl -sS -X POST "https://www.circletel.co.za/api/admin/whatsapp/flows/send" \
  -H "Content-Type: application/json" \
  -H "Cookie: <admin-session>" \
  -d '{"phone":"27XXXXXXXXX","entry_source":"admin","draft":true}'
```

1. Complete flow on test handset.
2. Confirm webhook logs show `nfm_reply` / F1 handler lines.
3. Confirm one row in `coverage_leads` with `lead_source = whatsapp_flow`.
4. Confirm `whatsapp_flow_sessions.status = completed` and `coverage_lead_id` set.
5. Capture real payload → replace fixtures under  
   `lib/integrations/whatsapp/flows/__tests__/fixtures/`.
6. Re-run tests:
   ```bash
   npx jest --testPathIgnorePatterns='/node_modules/' \
     --modulePathIgnorePatterns='/node_modules/' \
     --testPathPatterns='flow-response-handler.test'
   ```

---

## 4. Publish + production smoke

1. Publish flow in Meta when draft E2E is green.
2. Production send (non-draft) to controlled number.
3. Open `/admin/leads` — lead visible; assign owner; notes save.
4. Optional: submit flow-button template for **admin cold-send** outside 24h window (MARKETING; can lag).

---

## 5. Post-deploy ops

```bash
# After production has lead-followup-sla route:
ops/scheduler/generate-crontab.sh | crontab -
ops/scheduler/check-drift.sh
```

**Do not** install crontab until the route is live on the host/app that `APP_URL` points to.

---

## 6. Acceptance checklist (near-term goal)

- [ ] Draft F1 completes; webhook shows `nfm_reply`
- [ ] Exactly one `coverage_leads` row per flow_token (retry = idempotent)
- [ ] POPIA false → no lead
- [ ] Sales alert email + customer free-form confirm
- [ ] Zoho fail still leaves Supabase lead
- [ ] Admin can send F1 (`/api/admin/whatsapp/flows/send`)
- [ ] Queue + 2h SLA badges + escalation cron (after crontab install)

---

## Out of scope here

F2/F3, full in-chat order, Desk bridge on 084, Inventory/FSM.
