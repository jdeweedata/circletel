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
npx tsx scripts/billing/service-invoice-coverage.ts --period=2026-07
```

## Customer message (send with / after issue)

> Your **July 2026** clinic connectivity was not invoiced on the usual date. We have issued invoice **[number]** for **R517.50** (incl. VAT) for July only — **no late fees**. Please pay by the due date (or we will collect via your authorised debit where applicable). Contact us if anything looks wrong.

## Execute results (2026-07-30)

| Clinic | Invoice | Total | Collection | Due | Email |
|--------|---------|-------|------------|-----|-------|
| Sweetwaters | **INV-2026-00041** | R517.50 | paynow | 2026-08-13 | sweetwaters@unjani.org |
| Nokaneng | **INV-2026-00042** | R517.50 | debit_order | 2026-08-13 | phindimotebu@gmail.com |
| Cosmo City | **INV-2026-00043** | R517.50 | debit_order | 2026-08-13 | cosmo@unjani.org |
| Bhekilanga | **INV-2026-00044** | R517.50 | debit_order | 2026-08-13 | fleurhof@unjani.org |

Coverage re-check: `gaps=0` for 2026-07 (billable 18 covered 18; Alexandra…Sicelo still deferred_effective_date).

## After execute

- [ ] WhatsApp/email the four clinics (template above; insert invoice number)  
- [x] Do **not** force-debit Sweetwaters (paynow only)  
- [ ] Optional: include Cosmo June INV-2026-00017 R276 in collection plan separately  
- [x] Coverage script exit 0 for July  
