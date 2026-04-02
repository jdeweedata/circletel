# SkyFibre Residential Product Document
## Based on MTN Wholesale Tarana G1 Fixed Wireless Broadband Service

| Field | Detail |
|---|---|
| **Document Reference** | CT-SKY-RES-2026-001 |
| **Version** | 3.0 |
| **Effective Date** | 31 March 2026 |
| **Status** | ACTIVE — Open for New Sales |
| **Locale** | en-ZA (South African English) |
| **Classification** | Confidential — Internal Use Only |
| **Prepared By** | CircleTel Product Team |
| **Supersedes** | SkyFibre_Residential_Product_Document_-_MTN_Tarana_FWB_Service.md (v2.0, July 2025) |

---

## Version History

| Version | Date | Author | Changes |
|---|---|---|---|
| 3.0 | 31 Mar 2026 | CircleTel Product Team | Corrected all speed profiles to 4:1 asymmetrical (DL:UL) per CHANGE_LOG_27_Feb_2026.md. Updated pricing: Plus = R899 incl. VAT, Max = R999 incl. VAT. Confirmed Active / open for new sales. Removed 20 Mbps Starter tier (deprecated). Added excl. VAT pricing fields. Added 24-month discount option. |
| 2.0 | Jul 2025 | CircleTel Product Team | Launch version — contained incorrect symmetrical speed profiles. |

---

## Executive Summary

SkyFibre Residential leverages MTN's Wholesale Fixed Wireless Broadband (FWB) service, utilising the Tarana G1 beamforming platform to deliver high-speed, reliable internet access to South African homes. This product line covers 6 million homes nationally via licensed spectrum, providing fibre-equivalent latency performance where traditional FTTH infrastructure is unavailable or pending deployment.

**Important correction (effective 27 February 2026):** All SkyFibre Residential speed profiles operate on a **4:1 asymmetrical download:upload ratio** as configured by MTN across their entire FWB infrastructure. Previous documentation incorrectly described these speeds as symmetrical. See Section 1.2 for full details.

---

## 1. Technology Overview

### 1.1 MTN Tarana G1 Network Infrastructure

**Core Technology:**
- **Platform:** Tarana G1 beamforming next-generation FWA
- **Spectrum:** Licensed — minimal interference, no contention with unlicensed bands
- **Coverage:** 6 million homes passed nationally
- **Latency:** Sub-5 ms typical (industry-leading)
- **Packet Loss:** < 0.1%
- **Jitter:** < 2 ms
- **Availability:** 99.5% uptime SLA
- **Weather Resilience:** Superior rain fade resistance via beamforming compensation
- **Power Resilience:** Load-shedding resilient — backup power at all MTN towers

### 1.2 Speed Profile — Corrected (Effective 27 February 2026)

MTN deploys the Tarana G1 platform with a **4:1 download:upload asymmetrical speed ratio** across all wholesale FWB tiers. CircleTel, as a wholesale partner, inherits this network-level configuration.

| Wholesale Tier | Download | Upload | Ratio | Previous Spec (INCORRECT) |
|---|---|---|---|---|
| 50 Mbps tier | **50 Mbps** | **12.5 Mbps** | 4:1 | ~~50/50 Mbps~~ |
| 100 Mbps tier | **100 Mbps** | **25 Mbps** | 4:1 | ~~100/100 Mbps~~ |

**Products NOT affected (remain symmetrical):**
- HomeFibreConnect (MTN FTTH — GPON fibre technology, genuinely symmetrical)
- BizFibreConnect (DFA BIA — dedicated fibre, genuinely symmetrical)
- DUNE 60GHz / ParkConnect (Peraso mmWave — different technology)

*Reference: CHANGE_LOG_27_Feb_2026.md*

---

## 2. SkyFibre Residential Product Portfolio

### 2.1 Active Products

| Package | Download | Upload | Price (incl. VAT) | Price (excl. VAT) | Data | Status |
|---|---|---|---|---|---|---|
| **SkyFibre Home Plus** | 50 Mbps | 12.5 Mbps | **R899.00** | R782.61 | Uncapped | Active |
| **SkyFibre Home Max** | 100 Mbps | 25 Mbps | **R999.00** | R868.70 | Uncapped | Active |

*VAT calculated at the current South African rate of 15%.*

### 2.2 Contract Options

| Contract Term | Discount | Plus (incl. VAT) | Max (incl. VAT) |
|---|---|---|---|
| Month-to-Month | None | R899.00 | R999.00 |
| 24-Month Term | 10% | **R809.10** | **R899.10** |

### 2.3 Installation & Setup Costs

| Service Component | Cost | Notes |
|---|---|---|
| Professional Installation | R0 | Included — standard offering |
| Self-Install Kit | R875 | Tarana RN + Reyee router; customer-provisioned via QR code |
| Setup & Configuration | R0 | Included with professional install |
| Tarana G1 Outdoor Unit | Included | Remains MTN property |

---

## 3. Unit Economics

### 3.1 SkyFibre Home Plus

| Item | Amount (ZAR) |
|---|---|
| Retail Price (incl. VAT) | R899.00 |
| Retail Price (excl. VAT) | R782.61 |
| MTN Wholesale Cost (50 Mbps) | R499.00 |
| Infrastructure Cost (Echo BNG, CGNAT, AgilityGIS, Support) | R121.84 |
| **Total Direct Cost** | **R620.84** |
| **Gross Margin (excl. VAT)** | **R161.77** |
| **Gross Margin %** | **20.7%** |

### 3.2 SkyFibre Home Max

| Item | Amount (ZAR) |
|---|---|
| Retail Price (incl. VAT) | R999.00 |
| Retail Price (excl. VAT) | R868.70 |
| MTN Wholesale Cost (100 Mbps) | R599.00 |
| Infrastructure Cost | R121.84 |
| **Total Direct Cost** | **R720.84** |
| **Gross Margin (excl. VAT)** | **R147.86** |
| **Gross Margin %** | **17.0%** |

---

## 4. Equipment & Hardware

### 4.1 Standard Customer Premises Equipment (CPE)

| Item | Specification |
|---|---|
| Outdoor CPE | Tarana G1 BN (Base Node) — remains MTN property |
| WiFi Router (Plus) | Reyee RG-EW1300G — WiFi 5 (802.11ac), 1300 Mbps, Gigabit ports |
| WiFi Router (Max) | Reyee RG-EW1300G — WiFi 5 (802.11ac), 1300 Mbps, Gigabit ports |
| Router Management | Ruijie Cloud — zero-touch provisioning via QR code |
| Router Included | Yes — included with both tiers |

### 4.2 Router Technical Specifications — Reyee RG-EW1300G

| Spec | Detail |
|---|---|
| Standard | WiFi 5 (802.11ac) |
| Maximum Wireless Speed | 1300 Mbps |
| LAN Ports | 3× Gigabit |
| WAN Port | 1× Gigabit |
| Cloud Management | Ruijie Cloud (free) |
| Provisioning | QR code / zero-touch |
| Retail Value | ~R595 |

---

## 5. Installation & Activation

| Item | Detail |
|---|---|
| Timeline | 3–5 business days from order confirmation |
| Professional Install | Field technician — site survey, outdoor unit mount, cabling, router config |
| Self-Install Option | Yes — R875 kit; QR code provisioning via Ruijie Cloud mobile app |
| Coverage Verification | Mandatory prior to order acceptance |
| Post-Install Test | Speed and latency test required before handover sign-off |
| Provisioning System | AgilityGIS BSS → MTN Wholesale API |

---

## 6. SLA & Support

| Parameter | Commitment |
|---|---|
| Network Uptime | 99.5% monthly availability |
| Fault Response | 4 hours (initial response) |
| Mean Time to Repair | 24 hours |
| Phone Support | Monday–Friday, 08:00–17:00 SAST |
| WhatsApp Support | Business hours |
| Email Support | Response within 4 business hours |
| Online Portal | 24/7 self-service (invoices, tickets, usage) |
| On-Site Response | Next business day |

---

## 7. Fair Usage & Acceptable Use Policy

SkyFibre Home products are uncapped. The following principles apply per the SkyFibre Fair Usage & Acceptable Use Policy Framework:

- The service is for residential use by the registered account holder and household members only.
- Reselling, redistribution, or wholesale use of the service is prohibited.
- Sustained peer-to-peer seeding, server hosting, or commercial bulk data transfers are not permitted.
- MTN may apply traffic management during network congestion events. CircleTel will communicate any changes with reasonable advance notice.

---

## 8. Minimum Spend Commitment (MSC)

CircleTel's MTN Wholesale FWB agreement includes a portfolio-level MSC that ramps quarterly:

| Period | NRC Milestone | MRC Obligation |
|---|---|---|
| Months 1–3 | R8,750 | Actual spend |
| Months 4–6 | R17,500 | R14,970 |
| Months 7–9 | R26,250 | R29,940 |
| Months 10–12 | R35,000 | R49,900 |
| Months 13–15 | R43,750 | R74,850 |
| Months 16–18 | R52,500 | R104,790 |

*MSC applies to the SkyFibre Home portfolio as a whole, not per individual product.*

---

## 9. Technical Appendix

### A. Coverage Verification Process
Coverage must be confirmed against the MTN Tarana FWB coverage footprint prior to order acceptance. CircleTel uses the MTN Wholesale coverage API and/or the MTN FWB coverage map to verify serviceability.

### B. Technical Specifications Reference
- Tarana G1 BN — MTN Wholesale technical documentation
- Reyee RG-EW1300G — Ruijie Networks product datasheet
- Echo SP BNG — Internal infrastructure specification

### C. Related Documents
- CHANGE_LOG_27_Feb_2026.md
- SkyFibre_Home_Plus_Product_Document_v1_0.docx (CT-SKY-HOME-2026-001)
- skyfibre_home_residential_products_v2_0.json
- SkyFibre_Fair_Usage___Acceptable_Usage_Policy_Framework.md
- Router_and_Hardware_Recommendations_-_SkyFibre_Residential_Service.md

---

*circleTEL — A member of the New Generation Group*
*"Connecting Today, Creating Tomorrow" | www.circletel.co.za*
*Confidential — Internal Use Only*
