# Unjani VAT correction — deferred to next invoice run

**Decision (finance sign-off, 2026-07-14):** Do **not** amend, void, top-up, or re-debit historical Unjani invoices **now**.

Corrections apply on the **next monthly invoice run** for Unjani / Managed Connectivity clinics so statements and invoices show:

1. **Current period** at MSA rates (R450 excl VAT → **R517.50** incl for a full month).
2. **Adjustment line(s)** for any prior under-billed full months still short of R517.50 collectible.

## Behaviour (code on PR #624)

| Prior wrong invoice (total R450 / sub ~391.30) | Next invoice catch-up |
|-----------------------------------------------|------------------------|
| **Paid R450** | +**R67.50** adjustment (VAT/billing correction); leave original paid invoice |
| **Open unpaid (sent)** | +**R517.50** for that period; **void** the open wrong invoice after issue (absorbed) |
| **Partial (e.g. paid R276)** | +**(517.50 − paid)** adjustment; do not auto-void if paid &gt; 0 unless status open with residual logic |
| **Already correct R517.50 / pro-rata R276** | No catch-up |

## What we are not doing now

- No bulk UPDATE of existing invoices  
- No NetCash top-up batch today  
- No Zoho void/recreate of historical rows today  

## Ops checklist for next Unjani billing day

1. Merge/deploy PR #624 (ex-VAT generator + catch-up).  
2. Dry-run / log review: each clinic’s new total = current period + catch-up.  
3. NetCash batch uses **new invoice total_amount** (includes adjustments).  
4. Confirm mandates allow amounts (R517.50 + any catch-up; some clinics only Awaiting auth in mandate file).  
5. After successful collection, optional Zoho sync of the new combined invoices.

## Related artefacts

- Register: `2026-07-14-unjani-vat-correction-register-phase0.csv`  
- NetCash verification: `2026-07-14-unjani-netcash-verification-phase0.csv`  
- Implementation: `lib/billing/unjani-vat-catchup.ts` + `monthly-invoice-generator.ts`  
