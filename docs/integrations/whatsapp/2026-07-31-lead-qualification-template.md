# Cold F1 template: `circletel_lead_qualification`

**Date:** 2026-07-31  
**Purpose:** Business-initiated (cold) WhatsApp message that opens the published F1 Lead Qualification Flow without a prior customer message (avoids Meta **131047** re-engagement).

---

## Meta submission

| Field | Value |
|-------|--------|
| **Name** | `circletel_lead_qualification` |
| **Language** | `en_ZA` |
| **Category** | `MARKETING` |
| **Template ID** | `2086190671980465` |
| **Status at submit** | **PENDING** |
| **Flow ID** | `2044303956204342` (`lead_qualification`, PUBLISHED) |
| **Button** | FLOW → navigate → screen `CONTACT`, CTA “Get started” |

### Body

> Hi {{1}}, thanks for your interest in CircleTel. Tap below to share a few details so we can check coverage and recommend the right package. Takes about a minute.

`{{1}}` = first name / greeting name (example: Jeffrey).

### Submit / status

```bash
set -a && source .env.local && set +a
npx tsx scripts/submit-whatsapp-lead-qualification-template.ts           # dry-run
npx tsx scripts/submit-whatsapp-lead-qualification-template.ts --execute # already submitted 2026-07-31
npx tsx scripts/submit-whatsapp-lead-qualification-template.ts --status
```

---

## When APPROVED

### Send (template + flow_token)

Use `sendFlowTemplate` in `lib/integrations/whatsapp/flows/flow-sender.ts` (creates `whatsapp_flow_sessions` then posts Cloud API template with `sub_type: flow`).

Or admin:

```http
POST /api/admin/whatsapp/flows/send
{
  "phone": "27XXXXXXXXX",
  "entry_source": "admin",
  "source_campaign": "qr-campaign",
  "use_template": true,
  "customer_name": "Thandi"
}
```

### Do not use

- Interactive `sendFlow` outside 24h without customer message → **131047**
- `draft: true` after Flow is published (optional only for unpublished edits)

---

## In-session path (no template)

If the customer already messaged 084 within 24h, prefer interactive `sendFlow` (no template cost / simpler).

---

## Ops checklist

- [x] Flow PUBLISHED  
- [x] Template submitted PENDING  
- [ ] Meta APPROVED  
- [ ] Smoke cold send to test number with `use_template: true`  
- [ ] Wire site/QR CTA to cold template path  
