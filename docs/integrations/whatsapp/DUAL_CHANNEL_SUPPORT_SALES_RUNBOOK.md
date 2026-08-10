# Dual WhatsApp: Support IM + Sales 084 (bridge contingency)

**Status:** Active contingency (2026-08-10)  
**Sales number:** +27 84 773 9467  
**Phone number ID:** `1198404656682736`  
**WABA:** `2030687664240306` (Circle Tel SA)  
**Sales Desk department:** CircleTel Sales `1100825000005235029`

## Why Zoho native IM is stuck

Meta WhatsApp Manager → Setup guidance shows:

- Account connected to Zoho Corporation — **Completed**
- Connecting phone number to Zoho Corporation — **Stuck** (“reach out to Zoho Corporation”)

**Root cause:** `+27 84 773 9467` is already registered on **Cloud API** under CircleTel’s own app (**CircleTel Messaging** `2884267331911773`). Zoho Corporation as BSP cannot finish claiming that phone while CircleTel owns the Cloud API registration. Meta `subscribed_apps` on WABA `2030687664240306` lists only CircleTel Messaging — **no Zoho app**.

**Do not** set `WHATSAPP_SALES_NATIVE_IM=true` until Meta shows Zoho subscribed **and** Desk IM receives inbound on 084.

### Optional long-term fix (Zoho support)

Only if you must have native Desk IM (not required for sales closes):

1. Open a Zoho Desk support ticket: phone connection stuck for Cloud API number already on CircleTel Messaging.
2. Or migrate 084 onto a Zoho-managed WABA (often forces payment method **ZOHO CORPORATION PRIVATE LIMITED**) — this can **break** CircleTel Cloud API templates/Flows/billing on the same number.
3. Prefer keeping CircleTel Cloud API + bridge (current path).

## Active model (contingency)

| Line | Integration | Agent reply |
|------|-------------|-------------|
| Support WhatsApp | Zoho Desk Instant Messaging (existing) | Desk WhatsApp IM UI |
| **084 Sales** | CircleTel Cloud API → **desk-bridge** → **CircleTel Sales** dept | **Public Comment** (or Send) → synced to WA ~1 min |
| 084 automated | Same Cloud API (templates / Flows / billing) | N/A |

## Agent how-to (Sales 084) — use this now

1. Customer messages **084** (`wa.me/27847739467`).
2. Desk ticket appears: subject **`WhatsApp sales from …`** in **CircleTel Sales**.
3. Reply with a **Public Comment** (short text only, no CSAT/quotes) — or Desk Send.
4. Wait ~1 min; private `[WA-OUT-SYNCED]` confirms WhatsApp delivery.
5. Ignore placeholder email / mailer-daemon bounces.

Do **not** install WhatsApp Business on an 084 handset.

## Env (Coolify + local)

| Variable | Value |
|----------|--------|
| `WHATSAPP_PHONE_NUMBER_ID` | `1198404656682736` |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | `2030687664240306` |
| `WHATSAPP_SALES_PHONE_NUMBER_ID` | `1198404656682736` |
| `WHATSAPP_SALES_NATIVE_IM` | `false` (Zoho IM not live) |
| `WHATSAPP_DESK_BRIDGE_ENABLED` | `true` |
| `ZOHO_DESK_SALES_DEPARTMENT_ID` | `1100825000005235029` |
| `ZOHO_DESK_DEPARTMENT_ID` | support default (`1100825000000006907`) |

## Verify

```bash
set -a && source .env.local && set +a && npx tsx scripts/whatsapp/verify-dual-channel.ts
```

Manual E2E:

1. Message 084: “I want to purchase the package”.
2. Confirm ticket in **CircleTel Sales**, subject starts with `WhatsApp sales from`.
3. Public Comment reply → customer receives on WhatsApp from 084.
4. Support number still only Support IM.
5. No Zoho-native IM required for this path.

## Code

- Sales routing: `lib/integrations/whatsapp/desk-bridge.ts` (`isSalesPhoneNumberId`, `resolveBridgeDepartmentId`)
- Webhook phone id: `app/api/webhooks/whatsapp/route.ts`
- Verify: `scripts/whatsapp/verify-dual-channel.ts`
