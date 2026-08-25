# Unjani Connect — active clinic close-out

**As at:** 13 August 2026 17:25 SAST (after CN-2026-00003)  
**Population:** 21 `corporate_sites.status = active` with an **active** `customer_services` row for Unjani Managed Connectivity (`UNJ-MC-001`), 10/10, R450 ex VAT / R517.50 incl per site per month.  
**Workbook:** `docs/clients/unjani-clinics/billing/closeouts/UNJANI_CONNECT_ACTIVE_CLINIC_CLOSEOUT_2026-08-13.xlsx`  
**Bill-to from 1 September 2026:** Unjani Clinics NPC (`corporate_code` UNJ). Do not start or keep clinic DebiCheck / PayNow after 31 August except the authorised 18 Aug **Nokaneng** debit (**INV-42 only, R517.50**, batch 2523842). INV-49 was credited **CN-2026-00003**. Durban’s matching R1,035 is unpaid PayNow INV-74 + INV-75 with no debit mandate.

This pack reconciles **each currently live clinic account** to its live service and to July–August invoices. It replaces clinic-level collection with a September NPC pack.

## Gate vs previous Jul/Aug invoice-date pack

The earlier workbook (`UNJANI_CONNECT_JUL_AUG_2026_CLOSEOUT.xlsx`) is invoice-date scoped. This pack is **service-gated**: a clinic is on the close-out only if the site is active **and** Unjani Connect is active.

Live check 13 Aug 2026 (Supabase `agyjovdugmtopasyvlng`):

| Gate | Result |
|---|---|
| Active sites with active Unjani Connect | **21** |
| Pending sites (excluded) | **5** — Delmas (pending service), Khayelitsha, Mamelodi, Soweto Diepkloof, Umlazi (no customer) |
| Jul–Aug issued on those 21 (excl voided) | **R20,644.50** |
| Paid on books | **R9,462.00** (includes CN-2026-00003 R517.50 on INV-49; Cosmo surplus R276) |
| Open AR still on clinic accounts | **R11,458.50** |
| September NPC pack (21 × R517.50) | **R10,867.50** |
| NPC pack + transferred AR | **R22,326.00** |

Issued / paid / due match the invoice-date close-out because every Jul–Aug Unjani invoice sits on one of these 21 clinic accounts. Pending sites have no Jul–Aug invoices.

## Totals by verdict

| Verdict | Clinics | Open AR |
|---|---:|---:|
| CLEAR (Jul+Aug collected, no surplus) | 4 — Barcelona, Heidelberg, Kayamandi, Zamdela | R0 |
| CLEAR_WITH_SURPLUS | 1 — Cosmo City | R0 (R276 cash surplus on INV-43) |
| CLEAR_MISSING_AUG_INVOICE | 1 — Fleurhof | R0 |
| SERVICE_LIVE_NO_JUL_AUG_AR | 2 — Alexandra, Chloorkop | R0 |
| DEBIT_IN_FLIGHT | 1 — Nokaneng | R517.50 |
| OPEN_AR | 12 | R10,941.00 |
| **Total** | **21** | **R11,458.50** |

## Per-clinic recon (active service + clinic account)

Amounts are live Jul–Aug invoices, excl voided. Monthly fee on every active service is R450 ex VAT.

| Clinic | Account | Service | Jul / Aug | Issued | Paid | Due | Close-out |
|---|---|---|---|---:|---:|---:|---|
| Alexandra | CT-2026-00009 | Active · billing start 1 Sep | INV-21 voided · no Aug | 0.00 | 0.00 | 0.00 | Bill NPC from 1 Sep. Do not raise a clinic debit. |
| Barcelona | CT-2026-00017 | Active | INV-25 + INV-65 paid | 967.50 | 967.50 | 0.00 | Clear. NPC Sep only. |
| Chloorkop | CT-2026-00010 | Active · billing start 1 Sep | INV-22 voided · no Aug | 0.00 | 0.00 | 0.00 | Bill NPC from 1 Sep. |
| Cosmo City | CT-2026-00011 | Active · last invoice 30 Jul | INV-43 EFT R793.50 on R517.50 · no Aug | 517.50 | 793.50 | 0.00 | Surplus R276 — credit Nokaneng or NPC, not cash refund. Still bill Sep NPC. |
| Durban | CT-2026-00039 | Active | INV-74 + INV-75 sent | 1,035.00 | 0.00 | 1,035.00 | Carry AR to NPC. Stop clinic PayNow. |
| Fleurhof | CT-2026-00012 | Active · last invoice 30 Jul | INV-44 paid · no Aug | 517.50 | 517.50 | 0.00 | July collected. Do not raise a late clinic August debit. NPC Sep only. |
| Heidelberg | CT-2026-00016 | Active | INV-26 + INV-66 paid | 967.50 | 967.50 | 0.00 | Clear. NPC Sep only. |
| Jabulani | CT-2026-00019 | Active | INV-30, 50, 63 sent | 1,485.00 | 0.00 | 1,485.00 | Carry AR to NPC. Stop clinic PayNow. |
| Kayamandi | CT-2026-00022 | Active | INV-27 = CN R276 + TDD R174; INV-67 paid | 967.50 | 967.50 | 0.00 | Clear on books. Not a cash shortfall. |
| Lens ext 10 | CT-2026-00020 | Active | INV-34 + INV-68 paid; INV-51 open | 1,485.00 | 967.50 | 517.50 | Carry INV-51 to NPC. Recurring Jul+Aug collected. |
| New Hanover | CT-2026-00026 | Active | INV-32, 47, 59 sent | 1,485.00 | 0.00 | 1,485.00 | Carry AR to NPC. Stop clinic PayNow. |
| Nokaneng | CT-2026-00021 | Active | INV-61 paid TDD 5 Aug; INV-49 credited CN-00003; INV-42 authorised 18 Aug R517.50 | 1,552.50 | 1,035.00 | 517.50 | In-flight debit INV-42 only. August stands. Ozow did not settle. Cosmo R276 not applied here. |
| Oukasie | CT-2026-00018 | Active · billing start 5 Aug | INV-29 voided; INV-71 sent | 517.50 | 0.00 | 517.50 | Carry INV-71 to NPC. |
| Phoenix | CT-2026-00025 | Active · billing start 5 Aug | INV-31 voided; INV-73 sent | 517.50 | 0.00 | 517.50 | Carry INV-73 to NPC. |
| Sicelo | CT-2026-00015 | Active · billing start 5 Aug | INV-28 voided; INV-72 sent | 517.50 | 0.00 | 517.50 | Carry INV-72 to NPC. |
| Sky City | CT-2026-00013 | Active | INV-23 paid; INV-45 + INV-55 open | 1,485.00 | 450.00 | 1,035.00 | Carry R1,035 to NPC. |
| Soshanguve (Block P) | CT-2026-00028 | Active | INV-64 paid; INV-37 + INV-38 open | 1,311.00 | 517.50 | 793.50 | Carry R793.50 to NPC. August collected. |
| Sweetwaters | CT-2026-00024 | Active · `contract_months = 0` | INV-57 paid 5 Aug; INV-41 never authorised | 1,035.00 | 517.50 | 517.50 | Carry INV-41 to NPC. Do not resubmit clinic debit. Set contract to 24 months on cutover. |
| Tokoza | CT-2026-00014 | Active | INV-24 paid; INV-46 + INV-54 open | 1,485.00 | 450.00 | 1,035.00 | Carry R1,035 to NPC. |
| Umsinga | CT-2026-00027 | Active | INV-33, 48, 60 sent | 1,485.00 | 0.00 | 1,485.00 | Carry AR to NPC. Stop clinic PayNow. |
| Zamdela | CT-2026-00023 | Active | INV-39, 40, 62 paid | 1,311.00 | 1,311.00 | 0.00 | Clear. NPC Sep only. |

## Open AR to transfer to NPC (13 clinics)

| Clinic | Account | Open invoices | Due |
|---|---|---|---:|
| Durban | CT-2026-00039 | INV-74, INV-75 | 1,035.00 |
| Jabulani | CT-2026-00019 | INV-30, INV-50, INV-63 | 1,485.00 |
| Lens ext 10 | CT-2026-00020 | INV-51 | 517.50 |
| New Hanover | CT-2026-00026 | INV-32, INV-47, INV-59 | 1,485.00 |
| Nokaneng | CT-2026-00021 | INV-42 (18 Aug debit authorised R517.50) | 517.50 |
| Oukasie | CT-2026-00018 | INV-71 | 517.50 |
| Phoenix | CT-2026-00025 | INV-73 | 517.50 |
| Sicelo | CT-2026-00015 | INV-72 | 517.50 |
| Sky City | CT-2026-00013 | INV-45, INV-55 | 1,035.00 |
| Soshanguve (Block P) | CT-2026-00028 | INV-37, INV-38 | 793.50 |
| Sweetwaters | CT-2026-00024 | INV-41 | 517.50 |
| Tokoza | CT-2026-00014 | INV-46, INV-54 | 1,035.00 |
| Umsinga | CT-2026-00027 | INV-33, INV-48, INV-60 | 1,485.00 |
| **Total** | | | **11,458.50** |

If the 18 Aug Nokaneng debit collects INV-42, transferred AR falls to **R10,941.00**.

## September NPC pack (all 21 live services)

Every active clinic is on the 1 Sep pack at R517.50 incl, whether or not July/August AR exists.

| Line | Amount |
|---|---:|
| 21 × Unjani Connect September | 10,867.50 |
| Transferred clinic AR (if INV-42 still open) | 11,458.50 |
| Cosmo surplus held as NPC credit (optional) | −276.00 |
| **Opening NPC statement (AR transferred, surplus credited)** | **22,050.00** |
| Opening NPC statement (AR transferred, surplus not credited) | 22,326.00 |

Pending sites are **not** on this pack until RFS / active service.

## Registered business names (`customers.business_name`)

Source: live `customers.business_name` and `customers.business_registration` on 13 Aug 2026. This is the name on the clinic account / invoice bill-to. Site label is `corporate_sites.site_name`.

**NPC (bill-to from 1 Sep):** Unjani Clinics NPC, trading as Unjani Clinics, **2013/105073/08**.

**Two active clinics do not use the site name as the registered account name:**

| Clinic | Account | `customers.business_name` | Registration |
|---|---|---|---|
| Cosmo City | CT-2026-00011 | **Mbali Zwakele Gumbi T/A Unjani Clinic - Cosmo City** | 2016/37347/07 |
| Fleurhof | CT-2026-00012 | **Bhekilanga Health Care** | 2024/349220/07 |

The other 19 active accounts store `Unjani Clinic - {site}` as `business_name`.

**Registration issues on those 19:**

| Issue | Clinics |
|---|---|
| CIPC blank | Alexandra, Chloorkop, Jabulani, New Hanover, Oukasie, Phoenix, Sicelo, Sky City, Tokoza, Umsinga (10) |
| Same CIPC on two clinics | Barcelona and Durban both **2017/468955/07** (Barcelona stored with a leading space) |
| ID number, not CIPC | Sweetwaters **7403100396083** |
| CIPC present and unique | Heidelberg 2021/436093/07 · Kayamandi 2023/547010/10 · Lens 2020/090909/07 · Nokaneng 2024/377138/07 · Soshanguve 2022/580726/07 · Zamdela 2021/599225/07 |

Pending Delmas (CT-2026-00033) is `Unjani Clinic Delmas` (no hyphen) / `2022/868822/07`. Khayelitsha, Mamelodi, Soweto Diepkloof and Umlazi have no customer row.

September NPC invoices should bill **Unjani Clinics NPC**, not Cosmo’s T/A name or Bhekilanga. Clinic-level AR still sits on those customer accounts until you journal it to NPC.

## Items that are still live operational risks

1. **Nokaneng 18 Aug R517.50** — batch **2523842** authorised, 1 item, INV-42. Leave it. INV-49 already credited **CN-2026-00003**.
2. **Ozow P2CE1A7B** — did **not** settle (no PNC). Do not apply to INV-61. Do not credit August.
3. **Cosmo surplus R276** — still the only over-collect. Hold as NPC opening credit; do not cash-refund. Not applied to Nokaneng.
4. **Sweetwaters INV-41** — never authorised. Do not resubmit a clinic debit. Carry to NPC. `contract_months` is 0 and should be 24.
5. **Alexandra / Chloorkop / Cosmo / Fleurhof** — live services with no August invoice. Bill NPC from 1 Sep. Do not raise late clinic August invoices.
