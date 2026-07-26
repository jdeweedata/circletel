# Unjani VAT Correction Register — Phase 0

**Generated (UTC):** 2026-07-14T21:41:01.089284+00:00  
**Source:** live Supabase `customer_invoices` (read-only)  
**Commercial rule:** MSA R450 **excl VAT** → full month **R517.50** (R450 + R67.50)  
**CSV:** `2026-07-14-unjani-vat-correction-register-phase0.csv`

## Scope

All invoices linked to Unjani / Managed Connectivity (line items, notes, customer name, or package).

## Counts by recommended action

| Action | Count | Notes |
|--------|------:|-------|
| AMEND_OPEN | 5 | Open unpaid wrong R450 → restate to 517.50; collect R517.50 |
| REBUILD_PARTIAL | 1 | Partial payments; manual |
| TOPUP_67_50 | 3 | Paid R450; collect VAT shortfall R67.50 |
| IGNORE_VOID | 5 | Voided wrong invoices |
| LEAVE | 9 | Already correct (pro-rata 276 or full 517.50) |
| REVIEW_MANUAL | 0 | Needs human classify |
| **Total rows** | **23** | |

## Counts by classification

| Classification | Count |
|----------------|------:|
| correct_full_month_excl_model | 2 |
| correct_june_prorata | 7 |
| wrong_full_month_incl_model | 14 |

## Exposure (indicative, ZAR)

| Metric | Amount |
|--------|-------:|
| Collect if AMEND_OPEN restated (sum collect_after_correction) | 2,587.50 |
| Collect if TOPUP_67_50 executed | 202.50 |
| Collect if REBUILD_PARTIAL balances settled | 241.50 |
| Sum of total_delta on non-void wrong full months | 607.50 |
| **Total additional cash if all correction actions collected** | **3,031.50** |

> Note: AMEND_OPEN “collect_after_correction” is full R517.50 per open invoice (not only the R67.50 delta), because those invoices are unpaid. TOPUP is R67.50 only.

## Action code legend

| Code | Meaning |
|------|---------|
| AMEND_OPEN | Amend open invoice to 450+67.50=517.50; debit R517.50 |
| TOPUP_67_50 | Keep paid R450; issue VAT top-up R67.50; debit R67.50 |
| REBUILD_PARTIAL | Manual rebuild to 517.50 less cash already received |
| IGNORE_VOID | Voided; no cash action unless period unbilled |
| LEAVE | Amounts already match MSA math |
| REVIEW_MANUAL | Inspect before acting |

## Gates before Phase 1–3 writes

1. Finance signs this register.
2. Choose B1 (top-up) vs B2 (CN+reissue) for TOPUP rows.
3. Revise invoice generator (#624) for Unjani **ex-VAT** before next monthly run.
4. No NetCash batch / bulk UPDATE until register approved.

## Wrong full-month unpaid (AMEND_OPEN)

- INV-2026-00025 | CT-2026-00017 | Unjani Clinic - Barcelona | paid 0.00 → collect **517.50**
- INV-2026-00026 | CT-2026-00016 | Unjani Clinic - Heidelberg | paid 0.00 → collect **517.50**
- INV-2026-00030 | CT-2026-00019 | Unjani Clinic - Jabulani | paid 0.00 → collect **517.50**
- INV-2026-00032 | CT-2026-00026 | Unjani Clinic - New Hanover | paid 0.00 → collect **517.50**
- INV-2026-00033 | CT-2026-00027 | Unjani Clinic - Umsinga | paid 0.00 → collect **517.50**

## Paid needing top-up (TOPUP_67_50)

- INV-2026-00023 | CT-2026-00013 | Unjani Clinic - Sky City | paid 450.00 → top-up **67.50**
- INV-2026-00024 | CT-2026-00014 | Unjani Clinic - Tokoza | paid 450.00 → top-up **67.50**
- INV-2026-00034 | CT-2026-00020 | Unjani Clinic - Lens ext 10 | paid 450.00 → top-up **67.50**

## Partial (REBUILD_PARTIAL)

- INV-2026-00027 | CT-2026-00022 | Unjani Clinic - Kayamandi | paid 276.00 on total 450.00 → remaining after correction **241.50**
