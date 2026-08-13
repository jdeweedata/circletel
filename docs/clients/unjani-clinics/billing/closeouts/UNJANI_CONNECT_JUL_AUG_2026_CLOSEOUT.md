# Unjani Connect — July & August 2026 billing close-out

**Generated:** 13 August 2026  
**Updated:** 13 August 2026 17:25 SAST — CN-2026-00003 posted; 18 Aug debit reduced to INV-42 R517.50. Current AR is in the paid/unpaid and active-clinic packs; this workbook’s extract JSON is the morning snapshot.  
**Source:** Live Supabase (`customer_invoices`, `payment_transactions` where provider = Netcash, `debit_order_batch_items`)  
**Workbook:** `docs/clients/unjani-clinics/billing/closeouts/UNJANI_CONNECT_JUL_AUG_2026_CLOSEOUT.xlsx`  
**Bill-to from 1 September 2026:** Unjani Clinics NPC (`corporate_code` UNJ)

This pack closes **clinic-level** DebiCheck / PayNow collection at 31 August 2026. From 1 September CircleTel bills NPC only. Do not start or keep clinic debit orders after 31 August unless a batch already in flight succeeds and is then cancelled going forward.

## Totals (invoice date 1 Jul – 31 Aug 2026)

| Measure | Amount / count |
|---|---|
| Invoices in period | 47 |
| Voided (excluded from collectable AR) | 5 |
| Live invoices | 42 |
| Marked paid | 19 |
| Still open (`sent`) | 23 |
| Issued incl VAT (excl voided) | **R20,644.50** |
| Paid on books | **R9,462.00** |
| Still due on books | **R11,458.50** |
| Netcash completed txs linked to these invoices | **R8,668.50** |
| Netcash completed txs in Jul–Aug for Unjani customers (includes June-invoice collections) | **R9,496.50** |
| Books vs Netcash on Jul/Aug invoices | R276 Kayamandi CN-2026-00002 (not missing cash) + R276 Cosmo over-collect |
| Active sites | 21 |
| Pending (not live) sites | 5 — Delmas, Khayelitsha, Mamelodi, Soweto Diepkloof, Umlazi |

Books paid exceeds Netcash on these invoices by **R793.50** because (1) INV-2026-00027 (Kayamandi) is marked paid at R450 while Netcash recorded TDD of **R174** — that R276 is **CN-2026-00002**; (2) INV-2026-00049 (Nokaneng June back-bill) is marked paid at R517.50 via **CN-2026-00003** with no cash. Cosmo City INV-2026-00043 was collected at **R793.50** against an invoice of R517.50; that over-collect is in both books and Netcash.

## Netcash batch reports (13 Aug 2026)

Checked `../source-reports/ACCOUNT_BATCH_DEBIT.xls` (batches that collected, unpaid = 0) and `../source-reports/DEBIT_BATCH_DETAIL_REPORT.csv` (18 Aug authorisation) against CircleTel.

**Sweetwaters INV-2026-00041 (July, action 10 Aug) did not run.** It is absent from AccountBatchDebit. CircleTel still shows the item `pending` on batch `CircleTel-2026-08-05-1785902406720`, status `submitted`, `authorised_at` null. Invoice remains `sent` / R517.50 due. No Netcash payment is posted.

**Sweetwaters August INV-57 did run.** It is inside `CIRCLETEL-2026-08-01-RESUBMIT` (5 Aug, R4,104.00, 7 transactions, 0 unpaid). Invoice is paid.

**Nokaneng August INV-61 did run** (`CIRCLETEL-2026-08-01-INV-00061`, R517.50, 5 Aug).

**Nokaneng INV-42 will run on 18 Aug (R517.50, one month).** Batch **2523842** was cut from R1,035 / 2 items to **R517.50 / 1 item** (INV-49 credited **CN-2026-00003**). Authorised. Leave it. August INV-61 stays paid (TDD 5 Aug). Ozow P2CE1A7B did not settle.

**Kayamandi is not a cash shortfall.** `CN-2026-00002` was applied 8 Jul to offset a duplicate June debit of R276 against INV-27; Netcash then collected R174. That is the precedent for crediting instead of a cash refund.

## Netcash merchant reports (`docs/clients/unjani-clinics/billing/source-reports/`) — 15 Jul to 13 Aug 2026

| File | What it is |
|---|---|
| `ACCOUNT_BATCH_DEBIT_BATCHES.csv` | Collected debit batches (0 unpaid) |
| `DEBIT_ORDER_AUDIT_REPORT.csv` | Mandate/bank details — not settlements |
| `PAYNOW_TRANSACTION_EFT_REPORT.csv` | EFT PayNow only (Cosmo INV-43) |
| `TRANSACTION_REPORT.pdf` | All PayNow/Ozow/card 15 Jul–13 Aug, report date 13 Aug |

**Unjani cash in this window matches CircleTel** except one PayNow line to verify:

- Debit: R1,350.00 (15 Jul: INV-27 R174 + INV-17 R276 + INV-25/26 R900) + R3,622.50 (5 Aug: six Unjani R517.50 in batch 2517272 + INV-61 R517.50 in 2517290) = **R4,972.50**
- Batch 2517272 is R4,104 / 7 txns because the seventh item is **Prins INV-53 R999** (account CT-2025-00030), not Unjani
- PayNow posted on Unjani books: INV-39 R276, INV-40 R517.50, INV-68 R517.50, INV-44 R517.50, INV-43 R793.50 = **R2,622.00**
- Combined Unjani cash 15 Jul–13 Aug: **R7,594.50**
- PDF merchant total R5,136.50 includes non-Unjani INV-19 R899, INV-36 R649, INV-56 R449

**INV-61 check:** Ozow P2CE1A7B did **not** settle (no PNC on the merchant statement). Confirmed cash-in is the 5 Aug TDD only. Do not apply Ozow. Do not credit August.

**Still not collected:** Sweetwaters INV-41 (absent from collected batches). Nokaneng INV-42 authorised for 18 Aug R517.50. INV-49 credited CN-2026-00003.

## Credit Nokaneng — posted 13 Aug 2026

**CN-2026-00003** applied to INV-49 (June back-bill) R517.50, `billing_error`. August INV-61 was not credited. 18 Aug debit reduced to INV-42 only.

The Cosmo surplus **R276** was **not** moved onto Nokaneng. Hold it as an NPC opening credit — do not cash-refund Cosmo.

Kayamandi **CN-2026-00002** (R276 on INV-27) is unchanged.

## Close-out actions before NPC billing

1. **Cancel in-flight clinic debit orders**  
   - Sweetwaters **INV-2026-00041** — batch still `pending`, action date **10 Aug** (already past; confirm with Netcash whether it collected). Invoice remains `sent` / R517.50 due.  
   - Nokaneng **INV-2026-00042** — authorised 18 Aug R517.50. Leave it. INV-49 already credited.  
2. **Do not collect remaining clinic PayNow / DebiCheck after 31 Aug.** Carry open AR of **R11,458.50** onto the September NPC statement (or write off by agreement).
3. **Kayamandi INV-27:** already settled via CN-2026-00002 (R276) + Netcash R174. No cash refund.
4. **Cosmo City INV-43:** R276 over-collect. Hold as NPC opening credit — do not cash-refund. Not applied to Nokaneng.
5. **VAT underbill:** several 1 Jul invoices were issued at **R450 incl** (subtotal R391.30) instead of **R517.50 incl** (R450 ex). Catalogue price is R450 ex VAT. Decide whether to absorb or raise a correcting NPC line.
6. **Alexandra and Chloorkop:** active sites; July invoices voided; **no August replacement**. Confirm they appear on the September NPC pack as full months.
7. **June back-bills** dated 30 Jul with `period_start` in June (INV-45–51) are still unpaid. Treat as clinic AR to fold into NPC, not a second clinic collection.

## Paid and matched (Netcash = invoice total)

Sky City INV-23; Tokoza INV-24; Barcelona INV-25 & INV-65; Heidelberg INV-26 & INV-66; Lens INV-34 & INV-68; Zamdela INV-39, INV-40 & INV-62; Fleurhof/Bhekilanga INV-44; Sweetwaters INV-57; Nokaneng INV-61; Soshanguve INV-64; Kayamandi INV-67.

## Material exceptions

| Invoice | Clinic | Issue | Issued | Books paid | Netcash |
|---|---|---|---:|---:|---:|
| INV-2026-00027 | Kayamandi | CN-2026-00002 R276 + Netcash R174 | 450.00 | 450.00 | 174.00 |
| INV-2026-00043 | Cosmo City | Over-collect (517.50 + 276) | 517.50 | 793.50 | 793.50 |
| INV-2026-00041 | Sweetwaters | Open; debit pending 10 Aug | 517.50 | 0 | 0 |
| INV-2026-00042 | Nokaneng | Open; 18 Aug debit authorised R517.50 | 517.50 | 0 | 0 |
| INV-2026-00049 | Nokaneng | Paid via CN-2026-00003 (no cash) | 517.50 | 517.50 | 0 |
| INV-2026-00021 / 22 | Alexandra / Chloorkop | Voided Jul; no Aug invoice | 450.00 voided | 0 | 0 |

Full line-by-line detail, Netcash transaction ids, and per-site AR are in the Excel workbook (sheets `02_Invoices`, `03_Netcash_payments`, `04_Debit_order_items`, `05_Site_closeout`, `06_Exceptions`).

## NPC opening pack (1 Sep)

Bill Unjani Clinics NPC for every **active** Unjani Connect site at R450 ex VAT (R517.50 incl), plus:

- Open clinic AR the parties agree to transfer (recommended: **R11,458.50** books due; falls to R10,941.00 if 18 Aug collects INV-42).
- Full September lines for Alexandra and Chloorkop if those sites remain live.
- R0.00 lines for any site still inside a post-RFS free period (none of the 21 live sites are on the new-from-1-Sep free-month engine yet).

Pending sites (Delmas, Khayelitsha, Mamelodi, Soweto Diepkloof, Umlazi) stay off the pack until RFS.
