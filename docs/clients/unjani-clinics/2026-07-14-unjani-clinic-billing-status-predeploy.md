# Unjani clinic billing status (pre merge/deploy)

**As of:** 2026-07-14 (live Supabase)  
**Assumption after #624 deploy:** list price R450 **excl VAT** → full month **R517.50**; catch-up only on next invoice run.

## Legend

| Health | Meaning |
|--------|---------|
| NEEDS_CATCHUP_OPEN | Wrong July R450 invoice open/unpaid → next run absorbs R517.50 for that period + voids open + current period |
| NEEDS_CATCHUP_MIXED | Wrong July invoice with partial payment → next run remainder to R517.50 |
| NEEDS_CATCHUP_TOPUP | Wrong July paid R450 → next run +R67.50 catch-up + current period |
| NO_INVOICES_YET | No invoices; next bill clean R517.50 only |
| OK_MSA_ALIGNED | No wrong full-month rows |

## Status table

| Account | Clinic | Svc | Onboarding | Debit/mandate | Invoices | Catch-up next run | Est. next full-month invoice* | Health |
|---------|--------|-----|------------|---------------|----------|------------------:|-----------------------------:|--------|
| CT-2026-00016 | Heidelberg | active | billing_ready | debit_order / active | INV-2026-00014 [paid R276.00/correct_prorata]; INV-2026-00026 [sent R4 | R517.50 | R1035.00 | **NEEDS_CATCHUP_OPEN** |
| CT-2026-00017 | Barcelona | active | billing_ready | debit_order / active | INV-2026-00015 [paid R276.00/correct_prorata]; INV-2026-00025 [sent R4 | R517.50 | R1035.00 | **NEEDS_CATCHUP_OPEN** |
| CT-2026-00019 | Jabulani | active | pending | — / — | INV-2026-00030 [sent R450.00/wrong_full_month] | R517.50 | R1035.00 | **NEEDS_CATCHUP_OPEN** |
| CT-2026-00026 | New Hanover | active | pending | — / — | INV-2026-00032 [sent R450.00/wrong_full_month] | R517.50 | R1035.00 | **NEEDS_CATCHUP_OPEN** |
| CT-2026-00027 | Umsinga | active | pending | — / — | INV-2026-00033 [sent R450.00/wrong_full_month] | R517.50 | R1035.00 | **NEEDS_CATCHUP_OPEN** |
| CT-2026-00022 | Kayamandi | active | billing_ready | debit_order / active | INV-2026-00016 [paid R276.00/correct_prorata]; INV-2026-00027 [partial | R241.50 | R759.00 | **NEEDS_CATCHUP_MIXED** |
| CT-2026-00013 | Sky City | active | pending | — / — | INV-2026-00023 [paid R450.00/wrong_full_month] | R67.50 | R585.00 | **NEEDS_CATCHUP_TOPUP** |
| CT-2026-00014 | Tokoza | active | pending | — / — | INV-2026-00024 [paid R450.00/wrong_full_month] | R67.50 | R585.00 | **NEEDS_CATCHUP_TOPUP** |
| CT-2026-00020 | Lens ext 10 | active | pending | — / — | INV-2026-00034 [paid R450.00/wrong_full_month] | R67.50 | R585.00 | **NEEDS_CATCHUP_TOPUP** |
| CT-2026-00021 | Nokaneng | active | billing_ready | debit_order / active | — | R0.00 | R517.50 | **NO_INVOICES_YET** |
| CT-2026-00024 | Sweetwaters | active | submitted | debit_order / pending | — | R0.00 | R517.50 | **NO_INVOICES_YET** |
| CT-2026-00033 | Delmas | pending | submitted | debit_order / active | — | R0.00 | R517.50 | **NO_INVOICES_YET** |
| CT-2026-00034 | Stinkwater | pending | submitted | debit_order / pending | — | R0.00 | R517.50 | **NO_INVOICES_YET** |
| CT-2026-00035 | Suurman | pending | in_progress | — / — | — | R0.00 | R517.50 | **NO_INVOICES_YET** |
| CT-2026-00036 | Bridge City KwaMashu | pending | in_progress | — / — | — | R0.00 | R517.50 | **NO_INVOICES_YET** |
| CT-2026-00037 | Daggakraal | pending | in_progress | — / — | — | R0.00 | R517.50 | **NO_INVOICES_YET** |
| CT-2026-00038 | uMzimkhulu | pending | in_progress | — / — | — | R0.00 | R517.50 | **NO_INVOICES_YET** |
| CT-2026-00011 | Mbali Zwakele Gumbi T/A Cosmo City | active | billing_ready | debit_order / active | INV-2026-00017 [sent R276.00/correct_prorata] | R0.00 | R517.50 | **OK_MSA_ALIGNED** |
| CT-2026-00012 | Bhekilanga Health Care | active | billing_ready | debit_order / active | INV-2026-00018 [paid R276.00/correct_prorata] | R0.00 | R517.50 | **OK_MSA_ALIGNED** |
| CT-2026-00023 | Zamdela | active | billing_ready | debit_order / active | INV-2026-00039 [sent R276.00/correct_prorata]; INV-2026-00040 [sent R5 | R0.00 | R517.50 | **OK_MSA_ALIGNED** |
| CT-2026-00028 | Soshanguve (Block P) | active | billing_ready | debit_order / active | INV-2026-00037 [sent R276.00/correct_prorata]; INV-2026-00038 [sent R5 | R0.00 | R517.50 | **OK_MSA_ALIGNED** |
| CT-2026-00009 | Alexandra | active | pending | — / — | INV-2026-00021 [voided R450.00/voided_wrong_full_month] | R0.00 | R517.50 | **REVIEW** |
| CT-2026-00010 | Chloorkop | active | pending | — / — | INV-2026-00022 [voided R450.00/voided_wrong_full_month] | R0.00 | R517.50 | **REVIEW** |
| CT-2026-00015 | Sicelo | active | pending | — / — | INV-2026-00028 [voided R450.00/voided_wrong_full_month] | R0.00 | R517.50 | **REVIEW** |
| CT-2026-00018 | Oukasie | active | pending | — / — | INV-2026-00029 [voided R450.00/voided_wrong_full_month] | R0.00 | R517.50 | **REVIEW** |
| CT-2026-00025 | Phoenix | active | pending | — / — | INV-2026-00031 [voided R450.00/voided_wrong_full_month] | R0.00 | R517.50 | **REVIEW** |

\* *Est. next full-month invoice* = R517.50 current + catch-up (only if that clinic is billed on the run and period is full month). Pro-rata periods scale down.

## Counts
- **NO_INVOICES_YET**: 8
- **NEEDS_CATCHUP_OPEN**: 5
- **REVIEW**: 5
- **OK_MSA_ALIGNED**: 4
- **NEEDS_CATCHUP_TOPUP**: 3
- **NEEDS_CATCHUP_MIXED**: 1

CSV: `2026-07-14-unjani-clinic-billing-status-predeploy.csv`