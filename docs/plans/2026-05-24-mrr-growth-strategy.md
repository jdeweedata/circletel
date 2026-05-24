# MRR Growth Strategy: R15K → R1.25M in 12 Months

**Date:** 2026-05-24
**Author:** Jeffrey de Wee (CircleTel)
**Status:** Draft — Under Review

---

## Executive Summary

CircleTel is uniquely positioned among SA ISPs with a supplier moat: 7,438 products across 5 distributors (Scoop, MiRO, Nology, Rectron, Apple iStore Business) with multi-distributor price and stock visibility. Competitors (WebAfrica, Afrihost, Vox) are pure connectivity plays. CircleTel can be the only provider that bundles **internet + hardware + IT management + cloud** into a single monthly bill.

**Target:** Grow MRR from ~R28.5K (R15K existing + R13.5K Unjani clinics) to R1.25M within 12 months.

**Core moat:** Multi-distributor hardware supply chain. No ISP competitor has this.

---

## Competitive Analysis Summary

| Capability | CircleTel | WebAfrica | Afrihost | Vox |
|---|---|---|---|---|
| Consumer Fibre | ✓ | ✓ | ✓ | ✓ |
| Business Fibre | ✓ | ✗ | ~ | ✓ |
| Managed IT | ✓ | ✗ | ✗ | ✗ |
| Hardware Supply | ✓ (5 distributors) | ✗ | ✗ | ✗ |
| Cloud & Hosting | ✓ | ✗ | ✓ (hosting) | ✗ |
| VoIP / Voice | ✗ | ✗ | ✓ | ✓ (leader) |
| Rewards / Loyalty | ✗ | ✓ (EarnMore) | ✗ | ✓ (Vox Rewards) |
| Mobile App | ✗ | ✓ | ✓ | ✗ |
| Power Backup | ✓ | ✗ | ✗ | ✗ |
| 24/7 Support | ✗ | ✗ | ✗ | ✓ |

**Key insight:** CircleTel's Managed IT + Hardware Supply is the uncontested space.

---

## The 7 Revenue Levers

### Lever 1: Managed Office-in-a-Box (FLAGSHIP)
One monthly fee: internet + hardware + IT support + cloud backup + VoIP. Zero upfront cost.
- **Micro (1-3 seats):** R1,999/m
- **Small (4-10 seats):** R4,999/m
- **Medium (11-25 seats):** R8,999/m
- **Target MRR:** R250,000/m (50 clients × R5,000 avg)

### Lever 2: 4-Hour Hardware Replacement SLA
Guaranteed hardware replacement within 4 hours. Enabled by multi-distributor stock visibility.
- **Pricing:** R299/m per site
- **Target MRR:** R59,800/m (200 sites)
- **Prerequisite:** Stock visibility problem solved (see below)

### Lever 3: Power Backup-as-a-Service
UPS + inverter + battery lease for load shedding resilience.
- **Basic (4hr):** R399/m | **Standard (6hr):** R699/m | **Pro (8hr):** R1,299/m
- **Target MRR:** R105,000/m (150 sites × R700 avg)

### Lever 4: Hardware-as-a-Service (HaaS)
Laptop, desktop, monitor, printer leasing with full break-fix support.
- **Pricing:** R299-R999/m per device
- **Target MRR:** R100,000/m (200 devices × R500 avg)
- **Capital intensive:** Requires equipment finance partner

### Lever 5: Procurement-as-a-Service
Monthly retainer for outsourced IT procurement. Client gets wholesale pricing.
- **Pricing:** R1,500-R5,000/m retainer + 10% hardware markup
- **Target MRR:** R100,000/m (40 clients × R2,500 avg)
- **Prerequisite:** Multi-distributor quoting engine

### Lever 6: Partner/Reseller Channel
White-label bundles to IT consultants and MSPs who lack supplier access.
- **Model:** Partners sell at their margin; CircleTel fulfills hardware + tier-2 support
- **Target MRR:** R150,000/m (10 partners × R15,000 avg wholesale)

### Lever 7: Consumer Fibre + Home Office Kit Upsell
Home fibre signup → upsell pro router + UPS + basic IT support.
- **Pricing:** R299/m add-on on top of fibre
- **Target MRR:** R400,000/m (500 homes × R800 avg)

---

## Hardware Lease Structure (Critical Design Decision)

To avoid competing with month-to-month ISPs on lock-in while protecting hardware investment:

| | Service Agreement | Hardware Rental Agreement |
|---|---|---|
| **Term** | Month-to-month | 36 months |
| **Cancel** | 30 days notice | Return hardware OR pay 50% of remaining lease |
| **Covers** | Internet + IT support + cloud | Router, switch, AP, UPS, firewall |
| **Monthly** | R3,500 | R1,500 |

**Key principle:** Marketing says "no lock-in on your internet" (true — service is month-to-month). Asset protection comes from the separate hardware lease. Client leaves in month 8 = return hardware OR pay 50% × 28 months × R1,500 = R21,000. Returned hardware goes into buffer stock.

---

## 12-Month Ramp Model

| Month | Focus | New MRR/m Added | Cumulative MRR |
|---|---|---|---|
| 0 | Baseline (existing + Unjani) | — | R28,500 |
| 1 | Build bundles, apply for distributor credit | R20,000 | R48,500 |
| 2 | First 3 Office-in-a-Box clients | R25,000 | R73,500 |
| 3 | Power Backup upsells, buffer stock from deposits | R30,000 | R103,500 |
| 4 | Partner #1 onboarded | R40,000 | R143,500 |
| 5 | Consumer fibre + WFH Kit launch | R55,000 | R198,500 |
| 6 | Partner #2, procurement retainer (manual) | R75,000 | R273,500 |
| 7 | HaaS pilot (5 clients), partner #3 | R90,000 | R363,500 |
| 8 | SMB acceleration, procurement scaling | R120,000 | R483,500 |
| 9 | Consumer scaling, HaaS expansion | R160,000 | R643,500 |
| 10 | Partners #4-5, procurement growth | R200,000 | R843,500 |
| 11 | Full throttle all levers | R220,000 | R1,063,500 |
| 12 | Close pipeline, holiday push | R200,000 | R1,263,500 |

**Assumptions:**
- 3% monthly churn (factored into cumulative, not shown)
- Working capital available by month 3 for buffer stock
- First hire (sales/ops) by month 2
- Partners recruited months 4-10

---

## Stock Visibility Status (As-Is)

| Supplier | Feed Type | Price Data | Stock Data | Status |
|---|---|---|---|---|
| Scoop | XML | ✓ (DealerPrice, RetailPrice) | ✓ (CPT, JHB, DBN, Total) | **LIVE** |
| MiRO | xlsx + product-page scraper | ✓ (Your Price, Retail) | ~ (scraper for JHB/CPT/DBN) | **PARTIAL** |
| Nology | xlsx | ✓ (Price excl VAT) | ✗ (comments may have stock notes) | **NONE** |
| Rectron | xlsm (CAPTCHA portal) | ✓ (Price excl VAT) | ✗ (explicitly not tracked) | **NONE** |
| Apple iStore | Pending | Pending | Pending | **PENDING** |

**Critical finding:** 2 of 5 suppliers have no stock data at all. Only Scoop has reliable real-time stock. This constrains Levers 2 (4-hour SLA) and 5 (Procurement-as-a-Service) until resolved.

---

## Working Capital Analysis (Revised May 2026)

### Baseline Revenue
- Existing MRR: R15,000/m
- Unjani Clinics partner revenue: R8,999/m (May 2026, 31-day pro-rated)
- 16 new clinics from 15 Jun 2026 at R450 ex VAT: +R4,464/m (CT share)
- **Combined baseline: R28,463/m**

### Lean Launch Cash Flow (Months 1-3, with TDX 45-day lag)

| | June | July | August | Total |
|---|---|---|---|---|
| Existing MRR | R15,000 | R15,000 | R15,000 | R45,000 |
| Unjani (45-day lag via TDX) | R6,332 (Apr) | R9,002 (May) | R11,232 (Jun est.) | R26,566 |
| **Cash IN** | **R21,332** | **R24,002** | **R26,232** | **R71,566** |
| MSC shortfall | R18,652 | R18,652 | R18,652 | R55,956 |
| Ops/hosting | R5,000 | R5,000 | R5,000 | R15,000 |
| Hardware float (6 OiaB, 75% deposit, COD) | R2,750 | R2,750 | R2,750 | R8,250 |
| **Cash OUT** | **R26,402** | **R26,402** | **R26,402** | **R79,206** |
| **Net cash flow** | **-R5,070** | **-R2,400** | **-R170** | **-R7,640** |

**Gap: R7,640 over 3 months.** ~R2,500/month — survivable.
- Arlan 30-day credit on Arlan-sourced hardware → shifts R2-4K of float to credit
- 75% client deposit (not 50%) → COD items are nearly fully funded upfront
- 6 OiaB clients total (2/month) not 10 → proves model without overextending

## Prerequisites for Launch

1. **Buffer stock** of top 5 SKUs: R12-20K (built from client deposits, not pre-purchased)
2. **Arlan 30-day credit** for Arlan-sourced CPE/routers in OiaB bundles
3. **Client deposit policy:** 75% hardware deposit upfront for COD items from Scoop/Rectron
4. **Stock visibility** for ≥3 distributors before Levers 2 and 5
5. **Hardware lease agreement** template: 36-month rental, separate from service
6. **First hire** (sales/ops hybrid): month 4 (funded by new MRR)

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Stock data is fiction for 2 distributors | HIGH | Buffer stock + defer Levers 2/5 until solved |
| Working capital for hardware | HIGH | 50% deposit + 30-day distributor terms + finance partner |
| Support doesn't scale | MEDIUM | Hire support by month 6, ticketing system month 1 |
| Partner quality control | MEDIUM | Vetting process, non-compete, minimum commitment |
| Consumer churn | LOW | Hardware amortized in 8-10 months; 12-month retention is profitable |
| Jeffrey becomes bottleneck | HIGH | Hire #1 by month 2, hire #2 by month 6 |

---

## Next Actions

1. [ ] Approve R50-80K buffer stock budget
2. [ ] Define top 20 SKUs from supplier data
3. [ ] Contact Rectron re: reseller API / stock feed availability
4. [ ] Contact Nology re: stock data availability
5. [ ] Build 3 standardized SMB bundles with pricing
6. [ ] Hire salesperson #1
7. [ ] Deploy lightweight ticketing system
