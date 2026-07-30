# July 2026 gap catch-up (soft path)

**Date:** 2026-07-30  
**Decision:** Catch up missing July entitlement **without surprising clinics**.

## Policy

| Rule | Choice |
|------|--------|
| Amount | Full MSA month **R450 excl + R67.50 VAT = R517.50 incl** |
| Late fees | **None** |
| Presentation | Standalone **July 2026** invoice with clear line + soft notes (not silent debit) |
| Due date | **+14 days** from issue |
| Sweetwaters | **PayNow only** (mandate pending) |
| Nokaneng / Cosmo / Bhekilanga | `debit_order` if mandate active, else PayNow |
| Cosmo June INV-2026-00017 (R276 sent) | **Leave as-is**; July is separate |
| Alexandra…Sicelo | **Not in this catch-up** — bill from **1 Aug 2026** |

## Clinics

1. Unjani Clinic - Sweetwaters  
2. Unjani Clinic - Nokaneng  
3. Cosmo City (Mbali Zwakele Gumbi T/A…)  
4. Bhekilanga Health Care  

## Script

```bash
set -a && source .env.local && set +a
npx tsx scripts/billing/issue-july-2026-gap-catchup.ts           # dry-run
npx tsx scripts/billing/issue-july-2026-gap-catchup.ts --execute
npx tsx scripts/billing/notify-july-2026-gap-catchup.ts --execute  # email + WhatsApp
npx tsx scripts/billing/service-invoice-coverage.ts --period=2026-07
```

## Customer message (sent 2026-07-30)

Email (soft copy, Pay Now CTA) + WhatsApp template `circletel_invoice_payment`:

> Your **July 2026** clinic connectivity was not invoiced on the usual date. We have issued invoice **[number]** for **R517.50** (incl. VAT) for July only — **no late fees**. Please pay by the due date (or we will collect via your authorised debit where applicable). Contact us if anything looks wrong.

## Execute results (2026-07-30)

| Clinic | Invoice | Total | Collection | Due | Email |
|--------|---------|-------|------------|-----|-------|
| Sweetwaters | **INV-2026-00041** | R517.50 | paynow | 2026-08-13 | sweetwaters@unjani.org |
| Nokaneng | **INV-2026-00042** | R517.50 | debit_order | 2026-08-13 | phindimotebu@gmail.com |
| Cosmo City | **INV-2026-00043** | R517.50 | debit_order | 2026-08-13 | cosmo@unjani.org |
| Bhekilanga | **INV-2026-00044** | R517.50 | debit_order | 2026-08-13 | fleurhof@unjani.org |

Coverage re-check: `gaps=0` for 2026-07 (billable 18 covered 18; Alexandra…Sicelo still deferred_effective_date).

## Notifications sent (2026-07-30)

| Clinic | Invoice | Email (Resend) | WhatsApp |
|--------|---------|----------------|----------|
| Sweetwaters | INV-2026-00041 | c7150852-17fd-4bb1-87f0-c52556d8c0dd → sweetwaters@unjani.org | wamid…NDEA → 082 822 2343 |
| Nokaneng | INV-2026-00042 | 2a4057c6-55cc-4008-9ecb-71b97c68f60c → phindimotebu@gmail.com | wamid…RDUA → 062 247 0885 |
| Cosmo City | INV-2026-00043 | 46712fa8-9092-4ccd-8fa0-ab6eb5cc6755 → cosmo@unjani.org | wamid…MzIA → 067 043 2693 |
| Bhekilanga | INV-2026-00044 | e4eec2f6-b2fb-4bad-a86d-e3b10a65d2de → fleurhof@unjani.org | wamid…N0UA → 073 394 5117 |

All four: `emailed_at` + `whatsapp_sent_at` set; debit_order collection method unchanged; PayNow refs generated for optional payment.

## After execute

- [x] WhatsApp/email the four clinics  
- [x] Do **not** force-debit Sweetwaters (paynow only)  
- [ ] Optional: include Cosmo June INV-2026-00017 R276 in collection plan separately  
- [x] Coverage script exit 0 for July  
