# Unjani Connect — paid and unpaid invoices

**As at:** 13 August 2026 18:22 SAST (after CN-2026-00003, reduced 18 Aug debit, and five-site Sep billing move)  
**Source:** Live `customer_invoices` on Unjani clinic accounts  
**Workbook:** `docs/clients/unjani-clinics/billing/closeouts/UNJANI_CONNECT_PAID_UNPAID_INVOICES_2026-08-13.xlsx`

## What changed 13 Aug

| Action | Result |
|---|---|
| **CN-2026-00003** on Nokaneng INV-49 (June back-bill) | R517.50 credited. Invoice **paid**, due R0. No cash. |
| August INV-61 | **Not credited.** Stays paid (TDD 5 Aug). |
| Netcash batch **2523842** | **1 item R517.50** (INV-42 July). Action **18 Aug**. Leave authorised. |
| Ozow P2CE1A7B | Did **not** settle. Do not apply. Do not credit INV-61. |
| Cosmo INV-43 surplus R276 | Still cash on Cosmo. Not moved onto Nokaneng. |
| Five sites billing start **1 Sep** | Alexandra, Chloorkop, Oukasie, Phoenix, Sicelo. Aug **INV-71 / 72 / 73 voided**. |

## 18 Aug debit is Nokaneng INV-42 only — not Durban

| | Nokaneng (in the 18 Aug debit) | Durban (not in that debit) |
|---|---|---|
| Account | CT-2026-00021 | CT-2026-00039 |
| Invoices | **INV-2026-00042** Jul R517.50 only | **INV-2026-00074** Jul + **INV-2026-00075** Aug |
| Credited off the batch | INV-49 June via **CN-2026-00003** | — |
| Collection method | `debit_order` | `paynow` |
| Mandate | DebiCheck FNB `****9687` · Helping Hands | **None** |
| Netcash | Batch **2523842** · 1 item · R517.50 · **AUTHORISED** | Not listed |

## Totals (all Unjani clinic invoices)

| Status | Count | Issued | Paid on books | Due |
|---|---:|---:|---:|---:|
| Unpaid (`sent`) | 20 | R9,906.00 | R0.00 | **R9,906.00** |
| Paid | 24 | R10,566.00 | R10,842.00 | R0 collectable (Cosmo surplus R276 sits in cash; INV-49 is CN not cash) |
| Voided | 8 | R3,802.50 | — | — |

Paid-on-books R10,842.00 = issued R10,566.00 + Cosmo surplus R276. Credits inside paid: **CN-2026-00003 R517.50** and **CN-2026-00002 R276** (Kayamandi INV-27).

Voided: July INV-21/22/28/29/31 (R2,250) plus August INV-71/72/73 (R1,552.50) after the 1 Sep billing move.

If 18 Aug collects INV-42, open AR falls to **R9,388.50**. September NPC pack remains 21 × R517.50 = **R10,867.50**. NPC pack + remaining AR = **R20,773.50** (or R20,256.00 if INV-42 collects).

## Unpaid (20)

| Clinic | Account | Invoice | Period | Method | Due | Note |
|---|---|---|---|---|---:|---|
| Durban | CT-2026-00039 | INV-74 | Jul | paynow | 517.50 | No DebiCheck |
| Durban | CT-2026-00039 | INV-75 | Aug | paynow | 517.50 | No DebiCheck |
| Jabulani | CT-2026-00019 | INV-30 | Jul | paynow | 450.00 | |
| Jabulani | CT-2026-00019 | INV-50 | Jun back-bill | paynow | 517.50 | |
| Jabulani | CT-2026-00019 | INV-63 | Aug | paynow | 517.50 | |
| Lens ext 10 | CT-2026-00020 | INV-51 | Jun back-bill | paynow | 517.50 | Jul+Aug recurring paid |
| New Hanover | CT-2026-00026 | INV-32 | Jul | paynow | 450.00 | |
| New Hanover | CT-2026-00026 | INV-47 | Jun back-bill | paynow | 517.50 | |
| New Hanover | CT-2026-00026 | INV-59 | Aug | paynow | 517.50 | |
| Nokaneng | CT-2026-00021 | INV-42 | Jul | debit_order | 517.50 | **18 Aug authorised** |
| Sky City | CT-2026-00013 | INV-45 | Jun back-bill | paynow | 517.50 | |
| Sky City | CT-2026-00013 | INV-55 | Aug | paynow | 517.50 | |
| Soshanguve | CT-2026-00028 | INV-37 | Jun pro-rata | paynow | 276.00 | Aug paid |
| Soshanguve | CT-2026-00028 | INV-38 | Jul | paynow | 517.50 | Aug paid |
| Sweetwaters | CT-2026-00024 | INV-41 | Jul | debit_order | 517.50 | Never authorised |
| Tokoza | CT-2026-00014 | INV-46 | Jun back-bill | paynow | 517.50 | |
| Tokoza | CT-2026-00014 | INV-54 | Aug | paynow | 517.50 | |
| Umsinga | CT-2026-00027 | INV-33 | Jul | paynow | 450.00 | |
| Umsinga | CT-2026-00027 | INV-48 | Jun back-bill | paynow | 517.50 | |
| Umsinga | CT-2026-00027 | INV-60 | Aug | paynow | 517.50 | |
| **Total** | | | | | **9,906.00** | |

Alexandra, Chloorkop, Oukasie, Phoenix and Sicelo have **no unpaid invoices**. First bill is the 1 Sep NPC pack.

## Paid (24)

| Clinic | Account | Invoice | Period | Method | Issued | Paid on books | Paid on |
|---|---|---|---|---|---:|---:|---|
| Barcelona | CT-2026-00017 | INV-15 | Jun pro-rata | paynow | 276.00 | 276.00 | 26 Jun |
| Barcelona | CT-2026-00017 | INV-25 | Jul | TDD | 450.00 | 450.00 | 15 Jul |
| Barcelona | CT-2026-00017 | INV-65 | Aug | TDD | 517.50 | 517.50 | 5 Aug |
| Cosmo City | CT-2026-00011 | INV-17 | Jun pro-rata | TDD | 276.00 | 276.00 | 15 Jul |
| Cosmo City | CT-2026-00011 | INV-43 | Jul | EFT | 517.50 | 793.50 | 12 Aug |
| Fleurhof | CT-2026-00012 | INV-18 | Jun pro-rata | TDD | 276.00 | 276.00 | 1 Jul |
| Fleurhof | CT-2026-00012 | INV-44 | Jul | card | 517.50 | 517.50 | 5 Aug |
| Heidelberg | CT-2026-00016 | INV-14 | Jun pro-rata | paynow | 276.00 | 276.00 | 26 Jun |
| Heidelberg | CT-2026-00016 | INV-26 | Jul | TDD | 450.00 | 450.00 | 15 Jul |
| Heidelberg | CT-2026-00016 | INV-66 | Aug | TDD | 517.50 | 517.50 | 5 Aug |
| Kayamandi | CT-2026-00022 | INV-16 | Jun pro-rata | TDD | 276.00 | 276.00 | 1 Jul |
| Kayamandi | CT-2026-00022 | INV-27 | Jul | TDD+CN-00002 | 450.00 | 450.00 | 15 Jul |
| Kayamandi | CT-2026-00022 | INV-67 | Aug | TDD | 517.50 | 517.50 | 5 Aug |
| Lens ext 10 | CT-2026-00020 | INV-34 | Jul | paynow | 450.00 | 450.00 | 7 Jul |
| Lens ext 10 | CT-2026-00020 | INV-68 | Aug | card | 517.50 | 517.50 | 4 Aug |
| Nokaneng | CT-2026-00021 | INV-49 | Jun back-bill | **CN-00003** | 517.50 | 517.50 | 13 Aug credit |
| Nokaneng | CT-2026-00021 | INV-61 | Aug | TDD | 517.50 | 517.50 | 5 Aug |
| Sky City | CT-2026-00013 | INV-23 | Jul | paynow | 450.00 | 450.00 | 2 Jul |
| Soshanguve | CT-2026-00028 | INV-64 | Aug | TDD | 517.50 | 517.50 | 5 Aug |
| Sweetwaters | CT-2026-00024 | INV-57 | Aug | TDD | 517.50 | 517.50 | 5 Aug |
| Tokoza | CT-2026-00014 | INV-24 | Jul | paynow | 450.00 | 450.00 | 2 Jul |
| Zamdela | CT-2026-00023 | INV-39 | Jun pro-rata | Ozow | 276.00 | 276.00 | 17 Jul |
| Zamdela | CT-2026-00023 | INV-40 | Jul | Ozow | 517.50 | 517.50 | 17 Jul |
| Zamdela | CT-2026-00023 | INV-62 | Aug | TDD | 517.50 | 517.50 | 5 Aug |
| **Total** | | | | | **10,566.00** | **10,842.00** | |

## Voided (8)

| Clinic | Account | Invoice | Period | Issued | Reason |
|---|---|---|---|---:|---|
| Alexandra | CT-2026-00009 | INV-21 | Jul | 450.00 | Extension · billing start 1 Sep |
| Chloorkop | CT-2026-00010 | INV-22 | Jul | 450.00 | Extension · billing start 1 Sep |
| Oukasie | CT-2026-00018 | INV-29 | Jul | 450.00 | July extension |
| Oukasie | CT-2026-00018 | INV-71 | Aug | 517.50 | Moved to 1 Sep NPC |
| Phoenix | CT-2026-00025 | INV-31 | Jul | 450.00 | July extension |
| Phoenix | CT-2026-00025 | INV-73 | Aug | 517.50 | Moved to 1 Sep NPC |
| Sicelo | CT-2026-00015 | INV-28 | Jul | 450.00 | July extension |
| Sicelo | CT-2026-00015 | INV-72 | Aug | 517.50 | Moved to 1 Sep NPC |
| **Total** | | | | **3,802.50** | |

Jabulani invoices remain `sent` (cancellation letter on file does not change AR until you void or credit). Cosmo and Fleurhof have no August invoice; still bill Sep NPC.
