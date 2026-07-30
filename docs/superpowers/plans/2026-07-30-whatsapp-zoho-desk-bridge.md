# WhatsApp ↔ Zoho Desk Bridge (084 number)

**Date**: 2026-07-30
**Status**: Approved, not started
**Owner**: Jeffrey
**Related**: `.claude/rules/zoho-desk-api.md`, `docs/architecture/CRON_SCHEDULE.md`

---

## Context

CircleTel's support number **+27 82 487 3900** is permanently lost. It went `DISCONNECTED` on Meta after being disconnected from Zoho Social, and the SIM was held by an employee who has left — a SIM swap is not realistically recoverable.

The surviving number **+27 84 773 9467** (`phone_number_id 1198404656682736`) sits on **our** WABA `2030687664240306`, owned by our Meta app "CircleTel Messaging". It is `CONNECTED`, GREEN quality, and carries the **12 approved templates** used for billing, DebiCheck and clinic onboarding.

Zoho Desk's *native* WhatsApp channel cannot be used for 084: a number holds a live registration on exactly one WABA, and ours holds it. Zoho's WABA (`1193707916248905`) carries a duplicate 084 entry permanently stuck at `PENDING`, which is why Meta reports "Please reach out to Zoho Corporation to resolve phone number connection issue". Migrating 084 to Zoho's WABA would force re-creation and re-approval of all 12 templates and take billing offline.

**Outcome wanted:** customers message 084 and a Zoho Desk ticket appears; agents reply inside Desk and the customer receives it on WhatsApp — while 084 continues to serve billing automation, marketing and sales unchanged.

**Approach:** build a bridge. Inbound lands on *our* existing webhook and is pushed into Desk via the Desk REST API; agent replies are pulled back out and sent via Cloud API. Nothing about 084's WABA registration changes.

Decisions taken: **two-way**, and **auto-fallback to an approved template** when Meta's 24-hour window has closed.

### Reference: WABA topology (verified 2026-07-30)

| WABA | ID | Numbers | Subscribed app |
|---|---|---|---|
| Ours | `2030687664240306` | +27 84 773 9467 (`1198404656682736`) — CONNECTED | CircleTel Messaging (`2884267331911773`) |
| Zoho's | `1193707916248905` | +27 82 487 3900 (`1017060154813193`) — DISCONNECTED; +27 84 773 9467 (`1224273540758405`) — PENDING; 2 × +1 test numbers | Zoho Social (`191062257579887`), callback `push.zohoim.com` |

Both WABAs are named "Circle Tel SA" and owned by business `1552942882661469`. The duplicate name is the main source of confusion when debugging this.

---

## Hard prerequisites (user actions — the build is dead without these)

1. **Configure the Meta app callback URL.** Verified 2026-07-30: our webhook receives *nothing* from Meta — zero statuses across two live test sends, and zero inbound. The endpoint answers Meta's handshake correctly when called directly (`GET .../api/webhooks/whatsapp` → 200 + challenge echo), so the gap is the app's Webhooks config. Set callback to `https://www.circletel.co.za/api/webhooks/whatsapp`, verify token = `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, and subscribe the **`messages`** field on WABA `2030687664240306`. This also fixes the long-standing delivery-status blind spot.
2. **`WHATSAPP_APP_SECRET`** — from Meta App Dashboard → Settings → Basic. Needed for signature verification.
3. **Re-mint the Zoho Desk refresh token** with write scopes: `Desk.tickets.CREATE`, `Desk.tickets.UPDATE`, `Desk.contacts.CREATE`, `Desk.basic.READ`. The current token is effectively read-only.
4. **Create Desk custom field `cf_whatsapp_id`** (single-line text) on the ticket layout. Desk rejects unknown `cf` keys with 422.
5. **Submit template `circletel_reopen_conversation`** (UTILITY, `en_ZA`, one body param = first name) for Meta approval. 24–48h.

**Timing:** do not deploy across the 1st — `process-billing-day` and the monthly invoice runs use 084 as sender.

---

## Design

### Inbound: WhatsApp → Desk ticket

`app/api/webhooks/whatsapp/route.ts` already receives and parses the envelope; `value.messages` is detected at **lines 87-90 and thrown away** (it only logs a count). Replace that with real processing:

1. Verify `X-Hub-Signature-256` (HMAC-SHA256 of the raw body with `WHATSAPP_APP_SECRET`).
2. Dedupe on `message.id` (wamid) — Meta retries.
3. Resolve the sender: match `customers` by phone (try `27XX` and `0XX` forms), else treat as unknown.
4. Look up `whatsapp_desk_tickets` by `wa_id`. If an open ticket exists, append; otherwise create a Desk ticket and record the mapping.
5. Append the message as a **public comment** via the existing `addComment()`.
6. Stamp `last_inbound_at` — this is the 24-hour window clock.

Always return 200 to Meta even on internal failure (a non-200 triggers retry storms); log failures separately.

### Outbound: Desk reply → WhatsApp

**Agents must reply using a public Comment, not the email Reply box.** Unknown senders get a synthetic contact email, and Desk's Reply would try to email it. Ticket creation posts a private note stating this, and the ticket subject is prefixed `[WhatsApp]`.

A poller reads new public comments on mapped open tickets and sends them out:
- Skip any comment whose id is recorded in `whatsapp_inbound_messages.desk_comment_id` (those are ours — otherwise we echo the customer's own words back).
- Within 24h of `last_inbound_at` → free-form text via the new `sendText()`.
- Outside it → `circletel_reopen_conversation` template, plus a private note on the ticket saying the free-form reply was converted.

### Scheduler — important

**Do not use an Inngest cron.** `docs/architecture/CRON_SCHEDULE.md` names the **VPS crontab** as scheduler of record and is actively removing Inngest cron triggers due to dual-fire risk (the billing dual-fire is flagged CRITICAL). Follow the house pattern: an `/api/cron/*` route, an entry in `vercel.json`, then regenerate the crontab with `ops/scheduler/generate-crontab.sh | crontab -`.

Poll at `*/5 * * * *`. Structure the send logic behind `POST /api/webhooks/zoho-desk/reply` so a Zoho Desk workflow-rule webhook can drive it in real time later without a rewrite. (Whether Desk workflow webhooks are available on the current Zoho plan is **unverified** — polling works on every tier, so start there.)

---

## Files

**New**

| Path | Purpose |
|---|---|
| `supabase/migrations/<ts>_whatsapp_desk_bridge.sql` | Tables + RPCs below |
| `lib/integrations/whatsapp/webhook-validator.ts` | `verifyWhatsAppSignature(rawBody, header, appSecret)` using `crypto.timingSafeEqual` |
| `lib/integrations/whatsapp/whatsapp-inbound-service.ts` | Inbound → Desk orchestration |
| `lib/integrations/whatsapp/whatsapp-desk-sync-service.ts` | Desk comments → WhatsApp |
| `lib/integrations/zoho/desk-token-provider.ts` | Desk-only token cache (see traps) |
| `app/api/cron/whatsapp-desk-sync/route.ts` | Cron entry point, `Authorization: Bearer $CRON_SECRET` |
| `app/api/webhooks/zoho-desk/reply/route.ts` | Optional real-time push path |

**Modified**

| Path | Change |
|---|---|
| `app/api/webhooks/whatsapp/route.ts` | Signature check; replace lines 87-90 with inbound processing |
| `lib/integrations/whatsapp/whatsapp-service.ts` | Add public `sendText(to, body, opts)`; extend `logSend()` for `message_type`/`desk_ticket_id` |
| `lib/integrations/zoho/desk-service.ts` | `CreateTicketInput` (line 49) gains `channel?` and `cf?`; `createTicket()` (line 143) passes them through |
| `lib/integrations/whatsapp/types.ts` | Reuse existing `WebhookMessage` (lines 264-315); add inbound-result types |
| `vercel.json` | Add the `*/5` cron entry |
| `.env.example` | `WHATSAPP_APP_SECRET`, `WHATSAPP_REOPEN_TEMPLATE` |

**Reuse — do not rebuild:** `deskService.createTicket()` (line 143) and `deskService.addComment(ticketId, content, isPublic)` (line 267) already exist and work — `addComment` is currently unused in production. `whatsAppService.formatPhoneNumber()` (line 68) handles `0XX→27XX`. `whatsAppService.sendTemplate()` (line 88) is the template path. RPCs `log_whatsapp_message` / `update_whatsapp_message_status` already exist.

---

## Migration

```sql
whatsapp_desk_tickets      -- wa_id UNIQUE, phone, desk_ticket_id UNIQUE, desk_ticket_number,
                           -- customer_id, contact_name, contact_email, status,
                           -- last_inbound_at, last_synced_comment_at, created_at, updated_at
whatsapp_inbound_messages  -- wamid UNIQUE (dedupe), wa_id, phone, message_type, text_content,
                           -- media_storage_path, desk_ticket_id, desk_comment_id, created_at
ALTER TABLE whatsapp_message_log
  ADD COLUMN message_type text DEFAULT 'template',   -- 'template' | 'text'
  ADD COLUMN desk_ticket_id text;
```

RPCs, following the existing `log_whatsapp_message` convention (`SECURITY DEFINER`, service-role only):
`register_whatsapp_desk_ticket`, `log_whatsapp_inbound_message` (`ON CONFLICT (wamid) DO NOTHING`), `touch_last_inbound`, `is_within_24h_window`.

---

## Two traps worth calling out

**Desk token clobbering.** `lib/integrations/zoho/auth-service.ts` requests scope `ZohoCRM.modules.ALL` (line 155) and caches into a **singleton** `zoho_tokens` row. A background CRM process overwrites that row with a CRM-scoped token that is read-only for Desk — which is exactly why `scripts/log-unjani-support-tickets.ts` deliberately bypasses the cache and mints its own. The bridge must not share that row. Use a separate cache key or an in-process Desk token cache in `desk-token-provider.ts`. Also keep `ZOHO_DESK_ORG_ID` as the **empty string** (see `.claude/rules/zoho-desk-api.md`) — the CRM org id causes org-mismatch errors.

**Inbound media cannot be linked.** Meta media URLs are short-lived and require the bearer token, so pasting one into a Desk comment gives agents a dead link. Media must be fetched (`GET /{media-id}` → URL → authenticated download) and re-hosted in Supabase Storage, with a signed URL in the comment. For v1, handling `text`, `button` and `interactive` fully and writing "Customer sent an image — <signed link>" for media is sufficient; audio/video/location can degrade to a text note.

---

## Verification

1. **Signature rollout, log-only first.** Deploy `verifyWhatsAppSignature` in warn-only mode, confirm real Meta deliveries validate, *then* enforce. Enforcing on a wrong secret silently drops every webhook — including delivery statuses.
2. **Prove the webhook is live at all**: after the Meta callback URL is set, send one template from 084 and confirm `whatsapp_message_log.status_updated_at` becomes non-null. It has **never** been non-null for any row, all-time — that single check proves the prerequisite landed.
3. **Inbound, synthetic**: POST a crafted `messages` payload with a valid HMAC to staging; assert a row in `whatsapp_inbound_messages`, a mapping row, and a real Desk ticket with the message as a public comment. Re-POST the identical payload and assert **no** duplicate (idempotency).
4. **Inbound, live**: message 084 from a test handset (`+27 73 728 8016` is the known test number); confirm ticket creation end-to-end.
5. **Outbound, in-window**: add a public comment in Desk, run the cron route manually with the `CRON_SECRET` bearer, confirm arrival on the handset and that the customer's own comment was not echoed.
6. **Outbound, out-of-window**: set `last_inbound_at` back 25 hours, repeat, confirm the template fired and the private note was posted.
7. **Billing regression — required before merge**: send one live `circletel_invoice_payment` template from 084 and confirm success. The bridge must not touch the send path.
8. `npm run type-check:memory`.

---

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Signature enforcement drops all webhooks | High | Warn-only rollout first (verification step 1) |
| Desk token overwritten by CRM process | High | Dedicated token provider, never the shared `zoho_tokens` row |
| Agents use Reply instead of Comment → mail bounces | Medium | `[WhatsApp]` subject prefix + private note on every new ticket; brief the three agents |
| Echo loop (our own comments resent) | Medium | Skip comment ids recorded in `whatsapp_inbound_messages` |
| Deploy collides with billing run | Medium | Do not deploy across the 1st |
| Template not yet approved at go-live | Low | Out-of-window replies fail closed with a private note until approved |
| Support volume drags 084 quality rating down, throttling billing throughput | Low–Medium | Watch `quality_rating` on 084 after go-live; GREEN as of 2026-07-30 |

---

## Deferred / out of scope

- Recovering +27 82 487 3900 (SIM held by ex-employee; abandoned)
- Provisioning a separate support number on Zoho's WABA — still a valid alternative if the bridge proves too heavy
- Migrating 084 to Zoho's WABA (costs re-approval of all 12 templates)
- Zoho Desk workflow-rule webhook for real-time outbound (plan tier unverified; polling ships first)
