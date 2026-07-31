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

### Live DRAFT (created 2026-07-31 via Flows API)

| Field | Value |
|-------|--------|
| **Flow ID** | `2044303956204342` |
| **Name** | `lead_qualification` |
| **Status** | `PUBLISHED` (2026-07-31 via `POST /{flow-id}/publish`) |
| **JSON version** | `6.0` |
| **Category** | `LEAD_GENERATION` |
| **Validation** | empty (no errors) |
| **Source JSON** | `docs/integrations/whatsapp/flows/f1_lead_qualification.flow.json` |
| **Local env** | `WHATSAPP_FLOW_LEAD_QUALIFICATION_ID=2044303956204342` (`.env.local`) |

**Screens:** `CONTACT` → `ADDRESS` → `INTEREST` → `PREF` (terminal). First screen matches `F1_DEFAULT_SCREEN` in `flow-sender.ts`.

**Re-upload / edit (keep DRAFT):**

```bash
set -a && source .env.local && set +a
FLOW_JSON=$(python3 -c 'import json; print(json.dumps(json.load(open("docs/integrations/whatsapp/flows/f1_lead_qualification.flow.json"))))')
curl -sS -X POST "https://graph.facebook.com/v21.0/2044303956204342" \
  -H "Authorization: Bearer ${WHATSAPP_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"flow_json\": $(python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))' <<<"$FLOW_JSON")}"
```

Or recreate from WABA if deleted:

```bash
# POST /{WABA-ID}/flows with name, categories, flow_json, publish:false
# See scripts note / source JSON above
```

**Coolify/production:** set the same flow ID env after deploy; draft sends require `"draft": true` until published.

### Field names (must match TypeScript exactly)

| Flow field name | Required | Notes |
|-----------------|----------|--------|
| `first_name` | yes | CONTACT |
| `last_name` | yes | CONTACT |
| `customer_type` | yes | `consumer` / `business` (`business` → DB `smme`) |
| `email` | no | CONTACT |
| `phone` | no | Webhook sender used if empty |
| `company_name` | no | CONTACT optional |
| `address` | yes | ADDRESS |
| `suburb` | yes | ADDRESS |
| `city` | yes | ADDRESS |
| `province` | no | SA provinces dropdown |
| `service_interest` | yes | INTEREST → `requested_service_type` |
| `speed` | no | INTEREST |
| `budget_range` | no | INTEREST |
| `contact_preference` | yes | PREF |
| `best_contact_time` | no | PREF |
| `popia_optin` | yes | OptIn; must be true to create lead |

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

## Staging E2E (2026-07-31)

| Step | Result |
|------|--------|
| Env `WHATSAPP_FLOW_LEAD_QUALIFICATION_ID` | Set on `/home/circletel/.env.staging` → container |
| Draft send fix | `mode` must be under `parameters`, not `flow_action_payload` (commit `1fa99b1f`) |
| `POST /api/admin/whatsapp/flows/send` draft | **200** — wamid delivered to `27737288016` |
| Session | `whatsapp_flow_sessions` status `sent` → after nfm_reply `completed` |
| Lead | `coverage_leads` `lead_source=whatsapp_flow`, SLA `first_response_due_at` set |

**Phone completion:** Meta app webhooks still point at **production**. Completing the Flow on-device will hit prod until webhook/code is live there. Staging full path verified with a synthetic `nfm_reply` POST to staging webhook using the real `flow_token`.

## Published (2026-07-31)

- Flow ID `2044303956204342` status **PUBLISHED**
- Meta health: `can_send_message: AVAILABLE`
- Production sends: omit `draft: true` (or set `draft: false`)
- Cold outbound outside 24h window still needs an approved **Flow button template** (error 131047 otherwise)

