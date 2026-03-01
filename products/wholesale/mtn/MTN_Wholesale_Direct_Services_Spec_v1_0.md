# MTN Wholesale Direct Services — Commercial & Technical Specification
## CircleTel SA (Pty) Ltd — Product Management Reference Document

**Document Version:** 1.0  
**Date:** 21 February 2026  
**Classification:** Internal / Confidential  
**Prepared for:** CircleTel Product Management Team  
**Related Document:** MTN Arlan Communications Services — Commercial & Technical Specification v1.0

---

## Version Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 21 Feb 2026 | CircleTel Product Management | Initial release — split from consolidated MTN Wholesale Services document v1.0 |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Relationship Structure](#2-relationship-structure)
3. [Service 1 — Fixed Wireless Broadband (FWB) Tarana G1](#3-service-1--fixed-wireless-broadband-fwb-tarana-g1)
4. [Service 2 — Fibre-to-the-Home (FTTH) Wholesale](#4-service-2--fibre-to-the-home-ftth-wholesale)
5. [Supporting Infrastructure — BNG & ENNI Integration](#5-supporting-infrastructure--bng--enni-integration)
6. [Supporting Infrastructure — Echo SP Managed BNG Service](#6-supporting-infrastructure--echo-sp-managed-bng-service)
7. [NNI & Backhaul Architecture](#7-nni--backhaul-architecture)
8. [Minimum Spend Commitment (MSC) Summary](#8-minimum-spend-commitment-msc-summary)
9. [CircleTel Product Mapping — Wholesale Direct](#9-circletel-product-mapping--wholesale-direct)
10. [Key Contacts — MTN Wholesale & Partners](#10-key-contacts--mtn-wholesale--partners)
11. [Appendix A — FTTH Site Coverage List](#appendix-a--ftth-site-coverage-list)
12. [Appendix B — FWB Tarana G1 Coverage Notes](#appendix-b--fwb-tarana-g1-coverage-notes)

---

## 1. Executive Summary

This document details the services CircleTel SA (Pty) Ltd procures **directly from MTN Wholesale** via Network-to-Network Interface (NNI) interconnection at Teraco data centres. These are infrastructure-grade wholesale services requiring physical interconnect, BNG integration, and Minimum Spend Commitments (MSC).

### Services Covered in This Document

| # | Service | Technology | Contract | CircleTel Product Lines |
|---|---------|-----------|----------|------------------------|
| 1 | Fixed Wireless Broadband (FWB) | Tarana G1, licensed spectrum | 24-month MSC | SkyFibre SMB, AirLink, UmojaLink |
| 2 | Fibre-to-the-Home (FTTH) | Pure fibre, GPON | Per-subscriber, ongoing | HomeFibreConnect |

### Services NOT Covered (see Arlan Document)

MTN Business LTE, 5G, capped broadband, and mobile voice/data/IoT services accessed via the Arlan Communications reseller channel are documented separately in the **MTN Arlan Communications Services** specification.

---

## 2. Relationship Structure

### Channel: MTN Wholesale Direct

| Parameter | Detail |
|-----------|--------|
| **Contracting Entity** | Circle Tel SA (Pty) Ltd ↔ MTN South Africa (Wholesale Division) |
| **Interconnect** | Physical NNI at Teraco JB1 (Johannesburg) and CT1 (Cape Town) |
| **Core Partner** | Echo SP SA (Pty) Ltd — Managed BNG, CGNAT, Layer 2 switching |
| **AAA Platform** | Interstellio — RADIUS authentication via Echo SP proxy |
| **Billing Model** | Wholesale MRC per subscriber + NNI port fees + MSC obligations |
| **Contract Term** | FWB: 24-month MSC schedule / FTTH: per-site, ongoing |

### What This Channel Requires

1. **Capital investment** — NNI ports, BNG setup, training, CPE procurement
2. **Technical integration** — PPPoE/RADIUS/BGP configuration via Echo SP at Teraco
3. **MSC commitment** — Escalating quarterly minimum spend (FWB only)
4. **Operational capability** — Self-installation of CPE, subscriber provisioning, L1/L2 support

---

## 3. Service 1 — Fixed Wireless Broadband (FWB) Tarana G1

### 3.1 Service Description

MTN's Wholesale FWB service delivers high-speed, fixed wireless broadband via the **Tarana G1 beamforming technology** on licensed spectrum. Designed for areas where traditional FTTH infrastructure is not available, covering approximately **6 million homes** nationally with a broadband experience equivalent to fibre.

### 3.2 Active Speed Profiles (effective 1 July 2025)

| Speed Profile | Previous MRC | Current MRC (excl. VAT) | Status |
|--------------|-------------|------------------------|--------|
| 5 Mbps | R299 | — | **RETIRED** (no new sales from 1 Jul 2025) |
| 10 Mbps | R399 | — | **RETIRED** (no new sales from 1 Jul 2025) |
| 20 Mbps | R412 | — | **RETIRED** (no new sales from 1 Jul 2025) |
| **50 Mbps** | R542 | **R499** | **ACTIVE** |
| **100 Mbps** | R626 | **R599** | **ACTIVE** |
| **200 Mbps** | R737 | **R699** | **ACTIVE** |

> **Note:** Existing customers on retired speeds are unaffected. MTN relies on ISP partners to market and migrate customers to higher-tier offerings. The retired range ceased new sales from 1 July 2025 to accommodate inflight orders.

### 3.3 Setup & Equipment Costs

| Item / Service | NRC (excl. VAT) | MRC (excl. VAT) | Notes |
|---------------|-----------------|-----------------|-------|
| Setup + Licence (RN device, self-install) | R875 | — | Self-installation by CircleTel |
| MTN Installation (optional) | R2,000 | — | If MTN performs the installation |
| RN Device (CPE) | Included | — | Remains **property of MTN** — lost device cost recovered from ISP |
| Training (min. 10 pax) | R10,000 | — | Mandatory for partner staff |
| 1G NNI Port | R7,000 | R2,500 | Network interconnect; includes 100 Mbps backhaul |
| 2G W-NNI: MTN National Transit | R0 | R0 | No charge |
| 1G IP Transit (IPT) | R0 | R0 | No charge |
| VPDN Setup | R999 | R0 | Virtual Private Dial-up Network |
| **Totals** | **R17,999** | **R2,500** | — |

### 3.4 Additional Backhaul Tiers

100 Mbps backhaul is included in the standard NNI port fee. Higher capacities attract additional charges:

| Backhaul Capacity | Monthly Cost (excl. VAT) |
|-------------------|-------------------------|
| 100 Mbps | Included |
| 1 Gbps | R12,425 |
| 2 Gbps | R24,850 |
| 3 Gbps | R37,275 |
| 4 Gbps | R49,700 |
| 5 Gbps | R62,125 |
| 6 Gbps | R74,550 |
| 7 Gbps | R86,976 |
| 8 Gbps | R99,401 |
| 9 Gbps | R111,826 |
| 10 Gbps | R124,251 |

### 3.5 Minimum Spend Commitment (MSC) — 24-Month Schedule

From Month 4 onwards, if actual billing is below the MSC, the MSC amount is still due and payable irrespective of actual billing. If actual billing exceeds the MSC, only the actual is payable.

| Quarter | Period | NRC (once-off, start of quarter) | Monthly MSC |
|---------|--------|--------------------------------|-------------|
| Q1 | Months 1–3 | R8,750 (Month 1) | Actual spend |
| Q2 | Months 4–6 | R17,500 (Month 4) | R14,970 |
| Q3 | Months 7–9 | R26,250 (Month 7) | R29,940 |
| Q4 | Months 10–12 | R35,000 (Month 10) | R49,900 |
| Q5 | Months 13–15 | R43,750 (Month 13) | R74,850 |
| Q6 | Months 16–18 | R52,500 (Month 16) | R104,790 |
| Q7 | Months 19–21 | R61,250 (Month 19) | R139,720 |
| Q8 | Months 22–24 | R70,000 (Month 22) | R179,640 |

**Total 24-month NRC:** R315,000  
**Total 24-month MSC (MRC):** R1,796,400  
**Combined 24-month minimum commitment:** R2,111,400

#### MSC Illustrative Ramp (based on expected RN sales blend)

| Milestone | Expected RN (CPE) Count | Cumulative |
|-----------|------------------------|------------|
| Month 1 | 10 | 10 |
| Month 4 | 20 | 30 |
| Month 7 | 30 | 60 |
| Month 10 | 40 | 100 |
| Month 13 | 50 | 150 |
| Month 16 | 60 | 210 |
| Month 19 | 70 | 280 |
| Month 22 | 80 | 360 |

### 3.6 Technical Specifications

| Parameter | Specification |
|-----------|--------------|
| **Technology** | Tarana G1 next-generation Fixed Wireless Access (ngFWA) |
| **Spectrum** | Licensed band |
| **Beamforming** | Adaptive multi-beam, interference-cancelling |
| **Latency** | < 5 ms (fibre-equivalent) |
| **Symmetry** | Symmetrical upload/download |
| **Weather Resilience** | High — licensed spectrum, not susceptible to rain fade |
| **CPE (RN Device)** | Tarana Remote Node — remains MTN property |
| **Last-Mile** | Point-to-multipoint from MTN base stations |
| **Backhaul** | Via NNI at Teraco (JB1/CT1) |
| **PPPoE Termination** | MTN BNG (Echo SP Arista switches — Layer 2 only) |
| **Authentication** | RADIUS via Echo SP → Interstellio |
| **IP Management** | CGNAT via Echo SP |
| **Coverage** | ~6 million homes nationally |
| **Deployment Time** | 3–5 days (vs 15–45 days for FTTH) |

### 3.7 Key Commercial Risks & Considerations

| Risk | Detail | Mitigation |
|------|--------|-----------|
| **MSC Escalation** | Monthly commitment grows from actual spend to R179,640/month by Month 22 | Aggressive subscriber acquisition to keep actual billing above MSC thresholds |
| **Device Ownership** | RN devices remain MTN property; lost devices recovered from CircleTel | Strict CPE tracking and customer contracts with device clauses |
| **Channel Conflict** | MTN AirFibre (retail) pricing can match/undercut CircleTel's wholesale costs | Residential FWA sunset; focus on SMB/enterprise/township segments where AirFibre does not compete |
| **Retired Profiles** | 5/10/20 Mbps no longer available for new sales | All new deployments on 50+ Mbps profiles |
| **Pricebook Changes** | MTN reserves right to update pricebook from time to time | Monitor quarterly communications from MTN Wholesale BD team |

---

## 4. Service 2 — Fibre-to-the-Home (FTTH) Wholesale

### 4.1 Service Description

MTN Wholesale FTTH provides pure fibre connectivity across **37 sites in 7 provinces**. The service targets premium estates and suburban areas with symmetrical, truly uncapped speeds up to 500 Mbps. No Minimum Spend Commitment — billing is purely per-subscriber MRC.

### 4.2 Speed Tiers & MRC

| Speed Package | MRC (excl. VAT) | Type |
|--------------|-----------------|------|
| **20 Mbps** | R412 | Symmetrical, uncapped |
| **50 Mbps** | R542 | Symmetrical, uncapped |
| **200 Mbps** | R737 | Symmetrical, uncapped |
| **500 Mbps** | R837 | Symmetrical, uncapped |

### 4.3 Installation & Setup

| Component | Cost (excl. VAT) | Notes |
|-----------|-----------------|-------|
| Setup + Installation (NRC) | R2,876 | Includes ONT, fibre termination, trenching |
| Standard Trenching | Included | Up to 50 m |
| Additional Trenching (per metre) | R160 | Beyond 50 m — property owner permission required |
| Installation Timeline | 5–10 working days | From order confirmation, subject to feasibility |

### 4.4 Coverage Summary (37 sites)

| Region | Sites | % of Total | Site Types |
|--------|-------|-----------|-----------|
| **Gauteng** | 15 | 40.5% | Suburbs & HOAs |
| **Tshwane** | 9 | 24.3% | Primarily HOAs |
| **Western Cape** | 7 | 18.9% | Premium suburbs & HOAs |
| **KwaZulu-Natal** | 5 | 13.5% | Suburbs & HOAs |
| **Eastern Cape** | 3 | 8.1% | Suburbs |
| **Northern Region** | 1 | 2.7% | HOA |
| **Total** | **37** | **100%** | 18 HOA / 18 Suburb / 1 Mixed |

> Full site list in **Appendix A**.  
> Coverage can be checked via the MTN feasibility tool using GPS co-ordinates.

### 4.5 Technical Specifications

| Parameter | Specification |
|-----------|--------------|
| **Technology** | GPON Fibre-to-the-Home |
| **Speed** | Symmetrical upload/download |
| **Data Cap** | None — truly uncapped |
| **Fair Usage Policy** | No FUP |
| **Uptime SLA** | 99.9% |
| **ONT** | Included in installation |
| **Backhaul** | Via NNI at Teraco |
| **Authentication** | PPPoE via BNG |
| **Feasibility** | GPS co-ordinates on MTN feasibility tool |
| **Contract Term** | Per-subscriber (no fixed-term MSC) |
| **Payment Terms** | Monthly in advance via debit order |

### 4.6 CircleTel Margin Analysis (HomeFibreConnect)

#### Standard Pricing Margins (first 24 months, incl. equipment amortisation)

| Package | Retail Price | MTN Wholesale | All-in Direct Cost* | Contribution | Margin % |
|---------|-------------|--------------|-------------------|-------------|---------|
| HomeFibre Starter (20 Mbps) | R799 | R412 | R643 | R156 | 19.5% |
| HomeFibre Plus (50 Mbps) | R999 | R542 | R789 | R210 | 21.0% |
| HomeFibre Max (200 Mbps) | R1,499 | R737 | R1,027 | R472 | 31.5% |
| HomeFibre Ultra (500 Mbps) | R1,999 | R837 | R1,186 | R813 | 40.7% |

*All-in direct cost includes: MTN wholesale, Echo BNG, backhaul allocation, CGNAT, BSS platform, equipment amortisation (24 months), support, and payment processing.

#### Post-24-Month Margins (equipment fully recovered)

| Package | Revenue | Operating Costs | Contribution | Margin % |
|---------|---------|----------------|-------------|---------|
| HomeFibre Starter | R899 | R576 | R323 | 35.9% |
| HomeFibre Plus | R1,199 | R679 | R520 | 43.3% |
| HomeFibre Max | R1,599 | R798 | R801 | 50.1% |
| HomeFibre Ultra | R2,299 | R1,030 | R1,269 | 55.2% |

### 4.7 Key Commercial Considerations

| Consideration | Detail |
|--------------|--------|
| **No MSC** | Pure pay-per-subscriber model — no minimum commitment risk |
| **Limited Footprint** | Only 37 sites nationally — premium estates and suburbs |
| **No Channel Conflict** | FTTH operates on different infrastructure to MTN AirFibre — unaffected |
| **High Margins at Scale** | 200+ Mbps tiers deliver 40–55% contribution margins post-equipment recovery |
| **Installation Lead Time** | 5–10 business days vs 3–5 days for FWB |
| **Trenching Liability** | Additional trenching beyond 50 m at R160/m; property owner permission required |

---

## 5. Supporting Infrastructure — BNG & ENNI Integration

### 5.1 Architecture Overview

Both FWB and FTTH services are delivered via a shared BNG and ENNI integration between MTN, Echo SP, and Interstellio. This architecture is the backbone for all MTN Wholesale Direct subscriber services.

| Component | Provider | Role |
|-----------|----------|------|
| Last-mile Access | MTN | Tarana G1 FWB / FTTH GPON infrastructure |
| NNI / Layer 2 Switching | Echo SP | Interconnection at Teraco JB1 and CT1 |
| BNG (PPPoE Termination) | MTN (via Echo SP managed service) | Subscriber session management |
| RADIUS / AAA | Echo SP → Interstellio | Subscriber authentication (realm-based proxy) |
| CGNAT | Echo SP | Network Address Translation |
| IP Transit | Via NNI | Internet connectivity |

### 5.2 Key Technical Decisions

| Decision | Detail |
|----------|--------|
| PPPoE Termination | On MTN BNG (Echo SP Arista switches = Layer 2 only, cannot terminate PPPoE) |
| BGP Sessions | Terminate on MTN BNG |
| NNI Design | Single NNI carrying both AAA VLAN and IP Transit (WWW) traffic |
| RADIUS Architecture | Echo SP proxies requests to Interstellio based on realm |
| Managed BNG | Echo SP provides managed BNG with tiered pricing |

### 5.3 Physical Infrastructure

| Item | Specification |
|------|--------------|
| Primary PoP | Teraco JB1 (Johannesburg) |
| Secondary PoP | Teraco CT1 (Cape Town) |
| Cross-Connects | Fibre, single-mode |
| NNI Ports | 1G initially (2 ordered), upgradable |
| Project Reference | SS Q27988 |
| RFS Date | 18 August 2025 |

### 5.4 IP Addressing & Authentication

| Component | Detail |
|-----------|--------|
| BGP AS Number | Assigned to Circle Tel |
| IP Allocation | Via AFRINIC / Echo SP |
| RADIUS Proxy | Echo SP → Interstellio (realm-based) |
| Authentication Protocol | PPPoE / L2TP |

### 5.5 Data Flow Diagram (Logical)

```
[End Customer CPE]
        │
        ▼
[MTN Last-Mile] ── Tarana G1 / FTTH GPON
        │
        ▼
[MTN BNG] ── PPPoE termination, BGP
        │
        ▼
[Echo SP @ Teraco] ── Layer 2 switching, CGNAT, RADIUS proxy
        │
        ├── [RADIUS → Interstellio] ── AAA / Subscriber auth
        │
        └── [IP Transit / Internet] ── BGP peering
```

---

## 6. Supporting Infrastructure — Echo SP Managed BNG Service

### 6.1 Service Terms

| Parameter | Value |
|-----------|-------|
| Service | Managed BNG |
| Provider | Echo SP SA (Pty) Ltd |
| Customer | Circle Tel SA (Pty) Ltd |
| Initial Period | 12 months |
| Setup Fee | R0.00 (waived) |
| Quote Reference | SS Q27988 |

### 6.2 Pricing Tiers

| User Tier | Price per User per Month (excl. VAT) |
|-----------|--------------------------------------|
| 0–500 users | R25.40 |
| 501–750 users | R22.80 |
| 751–1,000 users | R20.20 |

#### Example Cost Calculations

| Subscriber Count | Tier | Monthly Cost (excl. VAT) | Per-User Cost |
|-----------------|------|-------------------------|--------------|
| 250 users | 0–500 | R6,350 | R25.40 |
| 500 users | 0–500 | R12,700 | R25.40 |
| 750 users | 501–750 | R17,100 | R22.80 |
| 1,000 users | 751–1,000 | R20,200 | R20.20 |

### 6.3 Echo SP CaaS — Per-Site Charges

For multi-site deployments (e.g. Unjani Clinics, ThinkWiFi), an additional per-site charge applies for subscriber management:

| Component | Cost | Purpose |
|-----------|------|---------|
| Echo SP CaaS (BNG/CGNAT) | R55/month per site | Subscriber management, CGNAT, bandwidth policy |

### 6.4 Contract Terms

| Term | Detail |
|------|--------|
| Fixed-term Services | 90 days written notice before expiry |
| Month-to-month | 30 days written notice |
| Annual Recurring | 90 days notice; auto-renews for 12-month periods |
| Early Cancellation | Subject to balance of MRCs and NRCs for remaining contract term |
| Pricing Validity | 3 days from quote date |
| Service Terms | https://echosp.net/ZA/page/service-terms-conditions |

---

## 7. NNI & Backhaul Architecture

### 7.1 NNI Configuration

| Parameter | Value |
|-----------|-------|
| Interface Type | 1G NNI (upgradable) |
| NNI Count | 2 ports ordered |
| Monthly Cost | R2,500 per port (includes 100 Mbps backhaul) |
| Setup Cost | R7,000 per port (NRC) |
| Design | Single NNI carrying AAA VLAN + IP Transit |
| Location | Teraco JB1 (Johannesburg), Teraco CT1 (Cape Town) |

### 7.2 Traffic Types over NNI

| VLAN | Traffic Type | Direction |
|------|-------------|-----------|
| AAA VLAN | RADIUS authentication | CircleTel ↔ Echo SP ↔ Interstellio |
| WWW / Transit | Internet traffic | Subscriber ↔ MTN BNG ↔ Internet |

### 7.3 Backhaul Scaling Path

| Capacity | Monthly Cost | Notes |
|----------|-------------|-------|
| 100 Mbps | Included | In standard NNI port fee |
| 1 Gbps | R12,425 | First upgrade tier |
| 5 Gbps | R62,125 | Mid-scale |
| 10 Gbps | R124,251 | Enterprise scale |

---

## 8. Minimum Spend Commitment (MSC) Summary

### FWB Tarana G1 — Full MSC Table

| Period | Quarterly NRC | Monthly MSC | Quarterly Total (NRC + 3× MSC) | Cumulative Commitment |
|--------|--------------|-------------|-------------------------------|----------------------|
| Months 1–3 | R8,750 | Actual spend | R8,750 + actual | R8,750 + actual |
| Months 4–6 | R17,500 | R14,970 | R62,410 | R71,160 + Q1 actual |
| Months 7–9 | R26,250 | R29,940 | R116,070 | R187,230 |
| Months 10–12 | R35,000 | R49,900 | R184,700 | R371,930 |
| Months 13–15 | R43,750 | R74,850 | R268,300 | R640,230 |
| Months 16–18 | R52,500 | R104,790 | R366,870 | R1,007,100 |
| Months 19–21 | R61,250 | R139,720 | R480,410 | R1,487,510 |
| Months 22–24 | R70,000 | R179,640 | R608,920 | R2,096,430 |

### FTTH — No MSC

FTTH operates on a pure per-subscriber MRC model with no minimum spend commitment. Revenue risk is limited to individual subscriber churn.

### MSC Breakeven Analysis

To avoid paying above actual usage, CircleTel needs the following minimum subscriber counts per quarter (assuming average R549 MRC per subscriber — blended 50/100/200 Mbps):

| Quarter | Monthly MSC | Min. Subscribers to Cover MSC |
|---------|-------------|------------------------------|
| Q2 (Month 4–6) | R14,970 | ~28 |
| Q3 (Month 7–9) | R29,940 | ~55 |
| Q4 (Month 10–12) | R49,900 | ~91 |
| Q5 (Month 13–15) | R74,850 | ~136 |
| Q6 (Month 16–18) | R104,790 | ~191 |
| Q7 (Month 19–21) | R139,720 | ~254 |
| Q8 (Month 22–24) | R179,640 | ~327 |

---

## 9. CircleTel Product Mapping — Wholesale Direct

| MTN Wholesale Service | CircleTel Product | Target Segment | Status |
|----------------------|-------------------|----------------|--------|
| FWB Tarana G1 (50 Mbps) | **SkyFibre SMB** | SMB / Enterprise | **ACTIVE** |
| FWB Tarana G1 (50–200 Mbps) | **AirLink FWA** | Business parks, office parks | **ACTIVE** |
| FWB Tarana G1 (50 Mbps) | **UmojaLink** | Township connectivity | **ACTIVE** |
| FWB Tarana G1 (50 Mbps) | **Unjani Clinics** | Healthcare (94 urban sites) | **IN MARKET** |
| FWB Tarana G1 (50 Mbps) | **ParkConnect** | Residential parks/estates | **ACTIVE** |
| FWB Tarana G1 (Residential) | **SkyFibre Residential** | Suburban residential | **SUNSET** ⚠️ |
| FTTH (20–500 Mbps) | **HomeFibreConnect** | Premium estates & suburbs | **ACTIVE** |

### Revenue Contribution — Wholesale Direct (FY27 Projected)

| Technology | FY27 Revenue | FY27 Share |
|-----------|-------------|-----------|
| Fixed Wireless (FWA) — Tarana G1 | R23.4M | 92% |
| Fibre (FTTH) | R2.0M | 8% |
| **Total Wholesale Direct** | **R25.4M** | **100%** |

---

## 10. Key Contacts — MTN Wholesale & Partners

### MTN South Africa — Wholesale Division

| Name | Role | Contact |
|------|------|---------|
| Nareen Moodaley | Manager — Business Development | Nareen.Moodaley@mtn.com / +27 83 209 1282 |
| Mitch Adams | Senior Manager — Broadband Services | Mitch.Adams@mtn.com |
| Priyanka Jindal | Senior Consultant — Presales Solution Architect | Priyanka.Jindal@mtn.com / +27 83 211 0535 |
| Alan Wilson | MTN Technical | Alan.Wilson@mtn.com |
| Nyasha Mhizha | Capcircle Management Consultants (MTN) | Nyasha.Mhizha@mtn.com |
| Dawie Moller | Capcircle Management Consultants (MTN) | Dawie.Moller@mtn.com |

### Echo SP SA (Pty) Ltd

| Name | Role | Contact |
|------|------|---------|
| Aubrey Simmonds | Innovation / Solutions | Aubrey@echosp.co.za / +27 83 660 7579 |
| Herman Brönner | Technical | Herman@echosp.co.za |
| Neil Dragt | Technical / RADIUS | Neild@echosp.co.za |
| Marthin van Dyk | Technical / Testing | marthin.vandyk@echosp.co.za |
| Refiloe Phalatsi | Project Manager | Refiloe@echosp.co.za |
| Batiisi Mbonelwa | Install Engineer | batiisi.mbonelwa@echosp.co.za |

### CircleTel SA

| Name | Role | Contact |
|------|------|---------|
| Jeffrey De Wee | Group Chief Operating Officer | jeffrey@newgengroup.co.za / +27 73 728 8016 |
| Melvin Watkins | Technical Implementation | melvinw@newgengroup.co.za |
| Ashwyn Watkins | Operations | ashwynw@newgengroup.co.za |

---

## Appendix A — FTTH Site Coverage List

### Full Site List (37 sites)

| # | Region | Site | Type |
|---|--------|------|------|
| 1 | Eastern Cape | Little Walmer | Suburb |
| 2 | Eastern Cape | Milpark Westgate | Suburb |
| 3 | Eastern Cape | Walmer Greenshield | Suburb |
| 4 | Gauteng | Bryanston Catholic Church | Suburb |
| 5 | Gauteng | Bryanston High School | Suburb |
| 6 | Gauteng | Cedar Lakes | HOA |
| 7 | Gauteng | Glen Eagles | HOA |
| 8 | Gauteng | Kengies | HOA |
| 9 | Gauteng | Lakewood Estate | HOA |
| 10 | Gauteng | Lonehill LRA | HOA |
| 11 | Gauteng | Lonehill Commco | Suburb |
| 12 | Gauteng | Newtown | Suburb |
| 13 | Gauteng | Parkmore Sandown | Suburb |
| 14 | Gauteng | Parkmore | Suburb |
| 15 | Gauteng | Morningside Gallomanor | Suburb |
| 16 | Gauteng | River Club Morningside | Suburb |
| 17 | Gauteng | Sandhurst | Suburb |
| 18 | Gauteng | The View | HOA |
| 19 | KwaZulu-Natal | Capri Heights | Suburb |
| 20 | KwaZulu-Natal | Kloof | Suburb |
| 21 | KwaZulu-Natal | La Lucia | Suburb |
| 22 | KwaZulu-Natal | Le Domaine | HOA |
| 23 | KwaZulu-Natal | Umhlanga | Suburb |
| 24 | Northern Region | Heidelberg Kloof | HOA |
| 25 | Tshwane | Blair Atholl | HOA |
| 26 | Tshwane | Boardwalk Manor | HOA |
| 27 | Tshwane | Chartwell | Suburb |
| 28 | Tshwane | Duncan Court | HOA |
| 29 | Tshwane | Featherbrooke | HOA |
| 30 | Tshwane | Heritage Hill | HOA |
| 31 | Tshwane | Midstream (Bondev) | HOA |
| 32 | Tshwane | Monaghan Farm | HOA |
| 33 | Tshwane | Xanadu | HOA |
| 34 | Western Cape | Boschem Park | HOA |
| 35 | Western Cape | Camps Bay | Suburb/DSTV |
| 36 | Western Cape | Clifton | HOA |
| 37 | Western Cape | Fresnaye | Suburb |
| 38 | Western Cape | Queensgate | HOA |
| 39 | Western Cape | Rontree/Bakoven | Suburb |
| 40 | Western Cape | Welgemoed | Suburb |

---

## Appendix B — FWB Tarana G1 Coverage Notes

The Tarana G1 network covers approximately **6 million homes** nationally, with deployment concentrated in urban and peri-urban areas where FTTH infrastructure is unavailable.

### Coverage Verification

Coverage can be verified via the MTN feasibility tool using GPS co-ordinates. Contact Nareen Moodaley (MTN Wholesale BD) for access to the tool or to arrange a coverage session.

### Technology Advantages over Competing FWA

| Parameter | Tarana G1 | Unlicensed 5 GHz (e.g. AirFibre) | Mobile 5G FWA |
|-----------|----------|----------------------------------|---------------|
| Spectrum | Licensed | Unlicensed | Licensed |
| Latency | < 5 ms | 15–30 ms | 10–20 ms |
| Rain Fade | Resilient | Susceptible | Moderate |
| Symmetry | Symmetrical | Asymmetric | Asymmetric |
| Interference | Low (beamforming) | High (congestion) | Moderate |
| Deployment | 3–5 days | 1–3 days | Same day |

---

*All prices are in South African Rand (ZAR) and exclude VAT unless otherwise stated.*  
*Document compiled from MTN Wholesale pricebooks, commercial schedules, and partnership agreements current as at February 2026.*

---

**End of Document**
