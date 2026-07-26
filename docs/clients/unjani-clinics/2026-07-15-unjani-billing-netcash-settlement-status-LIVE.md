# Unjani billing + NetCash settlement (LIVE API pull)

**Pulled at (UTC):** 2026-07-14T22:13:01.778Z
**Auth:** live `NETCASH_DEBIT_ORDER_SERVICE_KEY` + `NETCASH_ACCOUNT_SERVICE_KEY` (read-only)
**Mandate file rows:** 16
**Statement lines loaded:** 46 across 16 dates
**CSV:** `docs/clients/unjani-clinics/2026-07-15-unjani-billing-netcash-settlement-status.csv`

## Invoice + NetCash settlement

| Account | Clinic | Invoice | Class | Status | Inv total | Supabase paid | NetCash settled? | Settled amt | Evidence | Match | MSA shortfall |
|---------|--------|---------|-------|--------|----------:|--------------:|:----------------:|------------:|----------|-------|--------------:|
| CT-2026-00009 | Alexandra | INV-2026-00021 | voided_wrong_full_month | voided | R450.00 | R0.00 | **NO** | R0.00 | Invoice voided — no settlement expected | VOIDED | — |
| CT-2026-00010 | Chloorkop | INV-2026-00022 | voided_wrong_full_month | voided | R450.00 | R0.00 | **NO** | R0.00 | Invoice voided — no settlement expected | VOIDED | — |
| CT-2026-00011 | Mbali Zwakele Gumbi T/A Cosmo City | INV-2026-00017 | correct_prorata | sent | R276.00 | R0.00 | **NO** | R0.00 | No NetCash settlement found | UNPAID_OR_NO_NETCASH_SETTLEMENT | — |
| CT-2026-00012 | Bhekilanga Health Care | INV-2026-00018 | correct_prorata | paid | R276.00 | R276.00 | **YES** | R276.00 | 2026-07-01 TDD R276.00 (INV-2026-00018 - BHEKILANGA HEALT… | MATCHES_INVOICE_TOTAL | — |
| CT-2026-00013 | Sky City | INV-2026-00023 | wrong_full_month | paid | R450.00 | R450.00 | **YES** | R450.00 | R450.00 completed netcash @ 2026-07-02 ref=271183e9-6de0-… | MATCHES_INVOICE_TOTAL | R67.50 |
| CT-2026-00014 | Tokoza | INV-2026-00024 | wrong_full_month | paid | R450.00 | R450.00 | **YES** | R450.00 | R450.00 completed netcash @ 2026-07-02 ref=696d052a-da5a-… | MATCHES_INVOICE_TOTAL | R67.50 |
| CT-2026-00015 | Sicelo | INV-2026-00028 | voided_wrong_full_month | voided | R450.00 | R0.00 | **NO** | R0.00 | Invoice voided — no settlement expected | VOIDED | — |
| CT-2026-00016 | Heidelberg | INV-2026-00014 | correct_prorata | paid | R276.00 | R276.00 | **YES** | R276.00 | 2026-06-26 TDD R276.00 (INV-2026-00014 - UNJANI CLINIC HE… | MATCHES_INVOICE_TOTAL | — |
| CT-2026-00016 | Heidelberg | INV-2026-00026 | wrong_full_month | sent | R450.00 | R0.00 | **NO** | R0.00 | No NetCash settlement found | UNPAID_OR_NO_NETCASH_SETTLEMENT | R517.50 |
| CT-2026-00017 | Barcelona | INV-2026-00015 | correct_prorata | paid | R276.00 | R276.00 | **YES** | R276.00 | 2026-06-26 TDD R276.00 (INV-2026-00015 - VL MMONENG) | MATCHES_INVOICE_TOTAL | — |
| CT-2026-00017 | Barcelona | INV-2026-00025 | wrong_full_month | sent | R450.00 | R0.00 | **NO** | R0.00 | No NetCash settlement found | UNPAID_OR_NO_NETCASH_SETTLEMENT | R517.50 |
| CT-2026-00018 | Oukasie | INV-2026-00029 | voided_wrong_full_month | voided | R450.00 | R0.00 | **NO** | R0.00 | Invoice voided — no settlement expected | VOIDED | — |
| CT-2026-00019 | Jabulani | INV-2026-00030 | wrong_full_month | sent | R450.00 | R0.00 | **NO** | R0.00 | No NetCash settlement found | UNPAID_OR_NO_NETCASH_SETTLEMENT | R517.50 |
| CT-2026-00020 | Lens ext 10 | INV-2026-00034 | wrong_full_month | paid | R450.00 | R450.00 | **YES** | R450.00 | R450.00 completed netcash @ 2026-07-07 ref=83def339-91b0-… | MATCHES_INVOICE_TOTAL | R67.50 |
| CT-2026-00022 | Kayamandi | INV-2026-00016 | correct_prorata | paid | R276.00 | R276.00 | **YES** | R276.00 | 2026-07-01 TDD R276.00 (INV-2026-00016 - ESTERKULA PRY LTD) | MATCHES_INVOICE_TOTAL | — |
| CT-2026-00022 | Kayamandi | INV-2026-00027 | wrong_full_month | partial | R450.00 | R276.00 | **NO** | R0.00 | No NetCash settlement found | UNPAID_OR_NO_NETCASH_SETTLEMENT | R241.50 |
| CT-2026-00023 | Zamdela | INV-2026-00039 | correct_prorata | sent | R276.00 | R0.00 | **NO** | R0.00 | No NetCash settlement found | UNPAID_OR_NO_NETCASH_SETTLEMENT | — |
| CT-2026-00023 | Zamdela | INV-2026-00040 | correct_full_month | sent | R517.50 | R0.00 | **NO** | R0.00 | No NetCash settlement found | UNPAID_OR_NO_NETCASH_SETTLEMENT | — |
| CT-2026-00025 | Phoenix | INV-2026-00031 | voided_wrong_full_month | voided | R450.00 | R0.00 | **NO** | R0.00 | Invoice voided — no settlement expected | VOIDED | — |
| CT-2026-00026 | New Hanover | INV-2026-00032 | wrong_full_month | sent | R450.00 | R0.00 | **NO** | R0.00 | No NetCash settlement found | UNPAID_OR_NO_NETCASH_SETTLEMENT | R517.50 |
| CT-2026-00027 | Umsinga | INV-2026-00033 | wrong_full_month | sent | R450.00 | R0.00 | **NO** | R0.00 | No NetCash settlement found | UNPAID_OR_NO_NETCASH_SETTLEMENT | R517.50 |
| CT-2026-00028 | Soshanguve (Block P) | INV-2026-00037 | correct_prorata | sent | R276.00 | R0.00 | **NO** | R0.00 | No NetCash settlement found | UNPAID_OR_NO_NETCASH_SETTLEMENT | — |
| CT-2026-00028 | Soshanguve (Block P) | INV-2026-00038 | correct_full_month | sent | R517.50 | R0.00 | **NO** | R0.00 | No NetCash settlement found | UNPAID_OR_NO_NETCASH_SETTLEMENT | — |

## No invoice yet

| Account | Clinic | Debit method | Mandate DB | NetCash mandate file |
|---------|--------|--------------|------------|----------------------|
| CT-2026-00021 | Nokaneng | debit_order | active | Awaiting authorisation |
| CT-2026-00024 | Sweetwaters | debit_order | pending | NOT_IN_MANDATE_FILE |
| CT-2026-00033 | Delmas | debit_order | active | Capturing |
| CT-2026-00034 | Stinkwater | debit_order | pending | Accepted |
| CT-2026-00035 | Suurman | — | — | NOT_IN_MANDATE_FILE |
| CT-2026-00036 | Bridge City KwaMashu | — | — | NOT_IN_MANDATE_FILE |
| CT-2026-00037 | Daggakraal | — | — | NOT_IN_MANDATE_FILE |
| CT-2026-00038 | uMzimkhulu | — | — | NOT_IN_MANDATE_FILE |

## Snapshot
- Settled & matches invoice face total: **7**
- Wrong full-month settled at R450 on NetCash: **3**
- Issued but no NetCash settlement: **11**
- Mandate outcomes on invoice rows: active=1, pending=10, missing=12

### Settlement channel codes
- **TDD** = two-day bank debit order
- **PNC** = PayNow completed
- Preference: merchant statement hit on invoice number, else payment_transactions