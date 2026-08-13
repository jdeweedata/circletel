# Unjani Connect — NPC billing addendum

**Status:** CircleTel operational addendum for commercial confirmation with Unjani Clinics NPC  
**Effective:** 1 September 2026  
**Product:** Unjani Connect (`UNJ-MC-001`) — R450 ex VAT per site per month  
**Parent agreement:** Master Service Agreement between CircleTel SA (Pty) Ltd and Unjani Clinics NPC (see `UNJANI_MSA_KEY_COMMERCIAL_TERMS.md`)

This addendum does **not** restart remaining term on clinics already live before 1 September 2026. It changes the **bill-to party**, **collection rail**, and **monthly settlement calendar** for all Unjani Connect services, and it sets **new-site** commercial start rules from 1 September 2026.

---

## 1. Payer and collection

From 1 September 2026 CircleTel bills **Unjani Clinics NPC** once a month. Individual clinics are not debtors.

- Stop per-clinic DebiCheck / debit-order collection.
- Bill-to: Unjani Clinics NPC (`corporate_accounts.corporate_code = UNJ`).
- Collection: EFT against the NPC, not Netcash clinic mandates.
- Equipment remains CircleTel property (already in the MSA). Return on decommission; no transfer at term end.

## 2. Monthly pack (all sites, including existing live sites)

On the **last Monday** of each calendar month CircleTel issues **two PDFs**:

1. **Itemized tax invoice** — one line per active Unjani Connect service (clinic name, SKU, period, quantity 1, unit price ex VAT, line amount, charge type `full` | `pro_rata` | `free`).
2. **Statement of account** — opening balance, this invoice as one debit, payments received, closing balance, aging.

If there are **no queries**, the invoice is payable by **EFT on the Friday of that week**.  
Example: September 2026 pack issued Monday 28 September, due Friday 2 October.

This operational calendar **replaces the MSA’s 30-day EFT** for Unjani Connect billing from 1 September 2026 and requires Unjani NPC commercial confirmation.

Sites that go live after the issue date land on the **next** pack. Nominated / installing sites with no RFS do not appear on the invoice.

## 3. Existing live clinics (payer switch only)

For clinics already live before 1 September 2026:

- No new complimentary month.
- Remaining MSA term continues: **24 months from original activation**, **3 calendar months’ notice**.
- From 1 September they appear as full-month lines on the NPC itemized invoice.

## 4. New clinics connected from 1 September 2026

1. **RFS is the commercial start.** Installation alone does not start billing. The technician job card must be uploaded **and approved by CircleTel**. Only then is the Ready for Service Certificate issued. `rfs_issued_at` starts the clock.
2. **Complimentary period:** 30 calendar days from RFS (RFS = day 1). Network monitoring stays on. Helpdesk tickets follow the existing Unjani Connect onboarding guide. The site still appears on the itemized invoice at **R0.00** (complimentary). It is not collectable.
3. **Then pro-rata:** from day 31 through the last day of that calendar month (R450 × days / daysInMonth, ex VAT).
4. **Then calendar months:** full R450 from the 1st of the next month.
5. **Contract:** 25 months from RFS (first 30 days complimentary ≈ 24 paid months). Thereafter month-to-month with **30 calendar days’ written notice**.

Worked example: RFS 12 Sep 2026 → free 12 Sep–11 Oct → pro-rata 12–31 Oct on the October NPC invoice → full months from 1 Nov 2026 → term ends 12 Oct 2028 → then M2M.

## 5. Queries

Unjani NPC Super Users may raise a query on the **itemized invoice** during the Monday–Friday window. An open query holds collection until cleared. The statement shows whether the previous pack was paid.

---

**Confirmation needed from Unjani NPC finance:** last-Monday issue / Friday due settlement calendar for all Unjani Connect services from 1 September 2026.
