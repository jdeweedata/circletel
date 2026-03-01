# SkyFibre SMB — Commercial Product Specification

## Modular Pricing Architecture

### MTN Tarana G1 Fixed Wireless Broadband for SMB

---

| Field | Value |
|-------|-------|
| **Document Reference** | CT-CPS-SKYFIBRE-SMB-2026-002 |
| **Version** | 2.0 |
| **Effective Date** | 27 February 2026 |
| **Classification** | CONFIDENTIAL — Internal & Partner Use |
| **Locale** | en-ZA (South African English) |
| **Prepared By** | Jeffrey De Wee, Managing Director |
| **Approved By** | [Pending] |
| **Supersedes** | CT-CPS-SKYFIBRE-SMB-2026-001 v1.1 |

---

## Version Control & Change Log

| Version | Date | Author | Change Description | Status |
|---------|------|--------|--------------------|--------|
| 1.0 | Jan 2025 | Strategy Team | Initial SMB portfolio with bundled pricing | Superseded |
| 1.1 | 27 Feb 2026 | Jeffrey De Wee | Speed correction (4:1 DL:UL); MTN Business channel conflict analysis | Superseded |
| 2.0 | 27 Feb 2026 | Jeffrey De Wee | Modular pricing architecture; base + modules model; old bundled pricing removed; Arlan backstop channel; revised competitive positioning; Delphius case study; updated margin analysis | **CURRENT** |

> **Version 2.0 Change Notice:** This revision fundamentally restructures the SkyFibre SMB pricing model from bundled tiers to a modular Base + Add-on Modules architecture. All previous bundled pricing (R1 899 / R2 899 / R4 499) is fully superseded. This document incorporates the SkyFibre Business Modular Portfolio v3.1 pricing and competitive strategy.

---

## Table of Contents

1. Executive Summary
2. Product Architecture: Base + Modules
3. Add-on Modules
4. Retail Pricing Schedule
5. Wholesale Cost Structure & Margin Analysis
6. MTN Wholesale Obligations
7. Hardware & CPE Specifications
8. Network & Technical Specifications
9. Service Level Agreements
10. Fair Usage & Acceptable Usage Policy
11. Installation & Provisioning
12. Support Framework
13. Partner & Reseller Commission Structure
14. Target Market & Verticals
15. Competitive Positioning & Sales Strategy
16. Arlan Channel: The Price-Match Backstop
17. Risk Register
18. Implementation Roadmap
19. Financial Projections & KPIs
20. Approval

---

## 1. Executive Summary

This Commercial Product Specification (CPS) defines the complete commercial, technical, and operational parameters for the SkyFibre SMB portfolio — CircleTel's primary revenue-driving product line delivering business-grade fixed wireless broadband to South African small and medium enterprises.

SkyFibre SMB leverages MTN's Wholesale Fixed Wireless Broadband (FWB) service, utilising Tarana G1 beamforming technology operating on licensed spectrum. The service delivers **asymmetrical speeds at a 4:1 download-to-upload ratio** (e.g. 100 Mbps down / 25 Mbps up), which is a network-level configuration applied by MTN across their entire FWB infrastructure.

### 1.1 Strategic Context — Why Modular Pricing

This document supersedes all previous SkyFibre SMB product specifications and introduces a fundamentally restructured pricing model designed to address three critical market realities:

**Market Price Compression:** MTN Business is retailing uncapped wireless at R499–R999/month (10–100 Mbps) directly to SMBs, including a Wi-Fi router on 24-month contracts. This undercuts the previous SkyFibre SMB bundled pricing of R1 899–R4 499.

**Customer Objections:** The Delphius Midrand office objection (26 February 2026) demonstrated that a R2 899/month bundled offer is untenable when prospects can reference R999 alternatives, regardless of the underlying technology differences.

**Margin Protection Imperative:** Rather than engaging in a race to the bottom, the modular architecture separates connectivity pricing (where we must compete) from value-added services (where we can maintain premium margins).

**The core strategic shift:** move from a single, high-priced bundle to a competitive base + optional modules model. Critically, CircleTel's SkyFibre and MTN Business retail both run on the same Tarana G1 FWB infrastructure with identical 4:1 asymmetrical speed profiles. Speed is not a differentiator. The value proposition rests on: truly uncapped data (no FUP), static IP included, month-to-month flexibility, business-grade SLA and support, and modular add-on services.

### 1.2 Strategic Metrics Summary

| Metric | Value | Notes |
|--------|-------|-------|
| Strategic Priority | ★★★ Primary Focus | Highest priority product line |
| Target Market | SME 1–50 staff | Professional services, retail, healthcare, creative |
| Speed Profile | Asymmetric 4:1 DL:UL | MTN network-level configuration |
| Base Tier Margin | 37.1–46.4% | Before module attach |
| Full Bundle Margin | 43.1% | Base + all modules |
| Technology | MTN Tarana G1 FWA | Licensed spectrum, sub-5 ms latency |
| Coverage | 6 million homes passed | National MTN Tarana footprint |
| Pricing Model | Base + Modules | Modular, transparent, competitive |

---

## 2. Product Architecture: Base + Modules

The revised SkyFibre Business portfolio separates the connectivity layer from all value-added services. Every customer starts with a base connectivity tier. Modules are added based on actual need, not assumption. This transparency builds trust and prevents the "why am I paying for things I don't use" objection that undermined the v1.1 bundle pricing.

### 2.1 Base Connectivity Tiers

All base tiers include: a static public IP address, Tarana G1 licensed-spectrum technology with sub-5 ms latency, truly uncapped data with no FUP, professional installation, and basic business-hours support. All speed profiles use a 4:1 download-to-upload ratio, consistent with the Tarana G1 platform configuration deployed by MTN across its FWB network.

| Product | Speed (DL/UL) | Retail Price | All-in Direct Cost | Contribution | Margin % |
|---------|---------------|-------------|-------------------|-------------|----------|
| SkyFibre Business 50 | 50/12.5 Mbps | R1 299 | R817 | R482 | 37.1% |
| SkyFibre Business 100 | 100/25 Mbps | R1 499 | R917 | R582 | 38.8% |
| SkyFibre Business 200 | 200/50 Mbps | R1 899 | R1 017 | R882 | 46.4% |

> **Important:** The router is excluded from the base tier. Customers may bring their own device (BYOD) or add the Managed Router module (R149/month). This is a key difference from v1.1 where the router was bundled.

### 2.2 Base Tier Cost Breakdown (Reference)

The following table details the all-in direct cost for the two most commonly quoted base tiers.

| Cost Component | 50 Mbps | 100 Mbps |
|----------------|---------|----------|
| MTN Wholesale (Tarana FWB) | R499 | R599 |
| Static IP Address | R50 | R50 |
| Infrastructure (BNG, Backhaul, CGNAT) | R35 | R45 |
| AgilityGIS BSS Platform | R10.96 | R10.96 |
| Installation (amortised 12 months) | R212.50 | R212.50 |
| Basic Business Support | R10 | R10 |
| **TOTAL DIRECT COST** | **R817.46** | **R917.46** |

### 2.3 Tarana G1 Capacity Profiles — Technical Context

The Tarana G1 platform uses Time Division Duplexing (TDD) with configurable download-to-upload ratios. The DL:UL ratio is set at the network level by the infrastructure operator (MTN) and applies to all subscribers on that base node, including wholesale partners.

**MTN has deployed a 4:1 profile** across its South African FWB network. This cannot be changed per-subscriber or per-partner. A "100 Mbps" profile therefore delivers up to 100 Mbps download and up to 25 Mbps upload. This is identical to the MTN Business retail product and must be communicated honestly to customers.

**Competitive implication:** CircleTel cannot differentiate on speed. All competitive positioning must focus on: (1) no FUP / truly uncapped, (2) static IP included, (3) no 24-month lock-in, (4) business SLA and support, (5) modular value-added services, and (6) a dedicated account manager.

---

## 3. Add-on Modules

Each module is independently priced, independently margined, and independently justified to the customer. Modules carry 28–61% margins individually, which is higher than the blended margin on the old bundled product.

| Add-on Module | What's Included | Monthly Fee | Cost to CT | Module Margin |
|---------------|----------------|------------|-----------|--------------|
| Managed Router | Reyee business router, cloud-managed, firmware updates, remote support | R149/m | R75–R108 | 28–50% |
| Enhanced SLA | 8am–8pm support, 4hr response, 99.5% uptime SLA with credits | R249/m | R150 | 40% |
| Premium SLA | 24/7 support, 2hr response, 99.9% uptime, dedicated TAM, QBRs | R499/m | R300 | 40% |
| Email Hosting | 5 mailboxes (R79) or 10 mailboxes (R129), 50 GB per box, spam filter | R79–R129/m | R40–R70 | 46–49% |
| Cloud Backup | 50 GB (R49), 100 GB (R89), 250 GB (R179), automated daily | R49–R179/m | R20–R80 | 55–59% |
| Business VPN | 5 users (R49), 10 users (R89), site-to-site capable | R49–R89/m | R20–R40 | 55–59% |
| 5G/LTE Failover | Automatic failover, 50 GB data/m, Tozed 5G CPE included | R399/m | R220 | 45% |
| Security Suite | DNS filtering, threat protection, monthly security reports | R129/m | R50 | 61% |

---

## 4. Retail Pricing Schedule

All prices are quoted in South African Rand (ZAR) exclusive of VAT at the prevailing rate (currently 15%).

### 4.1 Monthly Recurring Charges — Base Tiers

| Package | Speed (DL/UL) | MRC (excl. VAT) | MRC (incl. VAT) | Included Features |
|---------|---------------|-----------------|-----------------|-------------------|
| SkyFibre Business 50 | 50/12.5 Mbps | R1 299 | R1 493.85 | 1 static IP, uncapped, basic support |
| SkyFibre Business 100 | 100/25 Mbps | R1 499 | R1 723.85 | 1 static IP, uncapped, basic support |
| SkyFibre Business 200 | 200/50 Mbps | R1 899 | R2 183.85 | 1 static IP, uncapped, basic support |

### 4.2 Once-Off Charges

| Item | Standard Price | Launch Special |
|------|---------------|----------------|
| Professional Installation | R2 550 | FREE (amortised over 12 months in base tier cost) |
| Additional Static IP (per IP/month) | R99 | R99 |
| Setup & Configuration | R300 | FREE |

### 4.3 Example Configurations — 100 Mbps Reference

The modular model allows customers to build precisely the solution they need:

| Configuration | Monthly Total | Direct Cost | Contribution | Margin |
|---------------|-------------|------------|-------------|--------|
| Base only (100 Mbps) | R1 499 | R917 | R582 | 38.8% |
| Base + Managed Router + Enhanced SLA | R1 897 | R1 142 | R755 | 39.8% |
| Base + all modules (full bundle) | R2 524 | R1 437 | R1 087 | 43.1% |

---

## 5. Wholesale Cost Structure & Margin Analysis

> **CONFIDENTIAL — INTERNAL USE ONLY**

### 5.1 Per-Subscriber Unit Economics (Base Tier)

| Package | Retail | Wholesale | All-in Cost | Margin (R) | Margin (%) |
|---------|--------|-----------|------------|-----------|-----------|
| Business 50 (50/12.5) | R1 299 | R499 | R817 | R482 | 37.1% |
| Business 100 (100/25) | R1 499 | R599 | R917 | R582 | 38.8% |
| Business 200 (200/50) | R1 899 | R699 | R1 017 | R882 | 46.4% |

### 5.2 Margin Impact Analysis — Old vs New

The modular approach delivers healthy margins across all customer profiles. Even the base-only configuration maintains nearly 39% contribution.

| Customer Profile | Monthly Revenue | Direct Cost | Contribution | Margin % |
|-----------------|----------------|------------|-------------|----------|
| Price-sensitive (Base only) | R1 499 | R917 | R582 | 38.8% |
| Mid-market (Base + Router + SLA) | R1 897 | R1 142 | R755 | 39.8% |
| Full bundle (all modules) | R2 524 | R1 437 | R1 087 | 43.1% |
| Old v1.1 bundle (SUPERSEDED) | R2 899 | R1 436 | R1 463 | 50.5% |

> **Critical insight:** The v1.1 bundle's 50.5% margin is meaningless if the deal is lost entirely. A R582 contribution on a won deal at R1 499 is infinitely better than R1 463 on a deal that walks to MTN at R999. The modular model wins more deals whilst maintaining margin discipline.

### 5.3 Post-12-Month Margins (Equipment Recovered)

Once installation costs are fully amortised after month 12, the base-tier margins improve dramatically. The SkyFibre Business 100 base tier moves from 38.8% to approximately 54.2% contribution margin, as the R212.50 monthly amortisation charge falls away. This creates significant long-term value from retained customers.

### 5.4 Customer Lifetime Value

| Metric | Value | Notes |
|--------|-------|-------|
| Average Revenue Per User (ARPU) | R1 499–R2 524 | Depends on module attach rate |
| Customer Acquisition Cost (CAC) | R2 550 | Installation + sales |
| Average Customer Lifetime | 24 months | Target |
| LTV (Base only, 100 Mbps) | R35 976 | 24 × R1 499 |
| LTV (Full bundle, 100 Mbps) | R60 576 | 24 × R2 524 |
| Payback Period | 3–4 months | Base tier |
| Monthly Churn Target | < 2% | Retention KPI |

---

## 6. MTN Wholesale Obligations

> **CONFIDENTIAL — INTERNAL USE ONLY**

### 6.1 Initial Setup Costs (Once-Off)

| Component | Cost (Excl. VAT) | Notes |
|-----------|-----------------|-------|
| Setup + Licence | R875 | Self-installation by partner |
| MTN Professional Installation | R2 000 | Optional — per site |
| Training (10 pax) | R10 000 | Mandatory for partner staff |
| 1G NNI Port (NRC) | R7 000 | Network interconnect once-off |
| VPDN Setup | R999 | Virtual private network dial-in |
| **Total Initial Investment** | **R20 874** | Excluding optional MTN install |

### 6.2 Monthly Recurring Wholesale Costs

| Service | MRC (Excl. VAT) | Notes |
|---------|-----------------|-------|
| 1G NNI Port | R2 500 | Includes 100 Mbps backhaul |
| 50/12.5 Mbps Package (per customer) | R499 | Active |
| 100/25 Mbps Package (per customer) | R599 | Active |
| 200/50 Mbps Package (per customer) | R699 | Active |

### 6.3 Backhaul Pricing (Core Network)

| Capacity | MRC (Excl. VAT) | Cost per Mbps |
|----------|-----------------|--------------|
| 100 Mbps | Included in NNI | R0 (included) |
| 200 Mbps | R2 427 | R12.14 |
| 500 Mbps | R6 067 | R12.13 |
| 1 Gbps | R12 425 | R12.43 |
| 5 Gbps | R62 125 | R12.43 |
| 10 Gbps | R124 251 | R12.43 |

### 6.4 Minimum Spend Commitment (MSC) Schedule

The MSC is the minimum amount payable to MTN irrespective of actual billing. From month 4 onwards, if actual billing is less than the MSC, the MSC amount is due and payable.

| Quarter | Period | NRC (Once-Off) | Monthly MSC |
|---------|--------|----------------|-------------|
| Q1 | Months 1–3 | R8 750 (Month 1) | Actual spend |
| Q2 | Months 4–6 | R17 500 (Month 4) | R14 970 |
| Q3 | Months 7–9 | R26 250 (Month 7) | R29 940 |
| Q4 | Months 10–12 | R35 000 (Month 10) | R49 900 |
| Q5 | Months 13–15 | R43 750 (Month 13) | R74 850 |
| Q6 | Months 16–18 | R52 500 (Month 16) | R104 790 |
| Q7 | Months 19–21 | R61 250 (Month 19) | R139 720 |
| Q8 | Months 22–24 | R70 000 (Month 22) | R179 640 |

**Total 24-month NRC commitment: R315 000.** Total 24-month MSC exposure: R1 796 400.

> **MSC Compliance Note:** Lower per-unit pricing in the modular model means more subscribers are needed to meet the MTN MSC. Mitigation: Unjani Clinics rollout (252 sites) provides MSC runway independent of commercial SMB sales.

---

## 7. Hardware & CPE Specifications

### 7.1 Tarana Remote Node (RN) Device

The outdoor CPE is an MTN-owned Tarana Remote Node device installed at the customer premises. It remains the property of MTN.

| Attribute | Specification |
|-----------|---------------|
| Type | Outdoor unit with integrated antenna |
| Power | PoE powered (48V) |
| Weather Rating | IP67 weatherproof |
| Alignment | Self-aligning for optimal signal |
| Management | Remote management capable |
| Ownership | MTN property — returned on service termination |

### 7.2 Business Router Equipment — Managed Router Module

Under the modular model, the router is offered as the Managed Router module (R149/month) rather than being bundled. Customers may also bring their own device (BYOD). The following routers are available through the module:

| Model | Type | Dealer Cost | Retail Value | Key Feature |
|-------|------|------------|-------------|-------------|
| Reyee RG-EG105GW | Business Gateway | R1 025 | R1 499 | 5-port GbE, built-in WiFi, cloud-managed |
| Reyee RG-EG210G-E | Advanced Gateway | R1 025+ | R1 799 | 10-port GbE, VPN, firewall |
| Reyee RG-EG310GH-E | Enterprise Gateway | R2 525 | R3 299 | PoE, enterprise firewall, DDoS |

### 7.3 Router Common Features

All SkyFibre SMB routers include Ruijie Cloud management (free), the Reyee Router mobile app for customer self-service, WPA3 encryption, advanced QoS with VoIP prioritisation, IPSec and OpenVPN support, and automatic firmware updates.

---

## 8. Network & Technical Specifications

| Parameter | Specification |
|-----------|---------------|
| Technology Platform | Tarana G1 Next-Gen Fixed Wireless Access |
| Spectrum | Licensed (MTN managed) |
| Speed Ratio | 4:1 download to upload (asymmetric) |
| Latency | < 5 ms typical |
| Packet Loss | < 0.1% |
| Jitter | < 2 ms |
| Network Availability | 99.5% (base) / 99.9% (Premium SLA module) |
| Weather Impact | Minimal — beamforming compensation |
| Coverage | 6 million homes passed nationally |
| Maximum Range | 10 km from base station (line of sight) |
| Minimum Signal Strength | −75 dBm |
| Contention Ratio (Business) | 8:1 target |
| IP Transit Provider | ECHO SP / Multi-peer |
| Security | WPA3 encryption, firewall with IPS/IDS |

---

## 9. Service Level Agreements

Under the modular model, the SLA tier is determined by the customer's chosen SLA module. The base tier includes basic business-hours support. Enhanced and Premium SLA modules provide escalated service levels.

| SLA Parameter | Base (Included) | Enhanced SLA (+R249/m) | Premium SLA (+R499/m) |
|---------------|-----------------|----------------------|---------------------|
| Uptime Guarantee | Best-effort | 99.5% | 99.9% |
| Support Hours | Mon–Fri, 08:00–17:00 | Mon–Sat, 08:00–20:00 | 24/7/365 |
| Fault Response Time | Next business day | 4 business hours | 2 hours |
| Fault Resolution Target | 48 hours | 12 hours | 8 hours |
| Service Credits | None | 10% per hour | 15% per hour |
| DL Speed Guarantee | No guarantee | 85% of package | 90% of package |
| UL Speed Guarantee | No guarantee | 85% of UL speed | 90% of UL speed |
| Installation Lead Time | 5 business days | 5 business days | 3 business days |
| Escalation Path | Standard queue | Tier 1 → Tier 2 → AM | Direct to Account Manager |
| Account Manager | Named contact | Yes | Yes — Priority + QBRs |

---

## 10. Fair Usage & Acceptable Usage Policy

**SkyFibre SMB is marketed as truly uncapped with no FUP.** This is a key competitive differentiator against MTN Business direct, which applies fair usage throttling. Business customers operate under a generous contention model (8:1) compared to residential (35:1).

### 10.1 Protected Traffic (Never Throttled)

VoIP and video conferencing (Zoom, Teams, WhatsApp calls), banking and financial services, educational platforms, work VPN connections, and email/messaging are classified as protected traffic and are never subject to traffic management.

### 10.2 Prohibited Activities

Running servers (web, mail, game), cryptocurrency mining, reselling or sharing connections, continuous streaming/broadcasting, automated bot traffic, and network attacks or scanning are prohibited under the Acceptable Usage Policy.

---

## 11. Installation & Provisioning

### 11.1 Site Requirements

Line of sight to an MTN Tarana base station within 10 km, a suitable outdoor mounting location (roof or wall), a power outlet within 30 m of the installation point, and a minimum signal strength of −75 dBm.

### 11.2 Installation Process (Estimated 45 Minutes)

| Step | Description |
|------|-------------|
| 1 | Site survey and signal verification |
| 2 | Professional mounting of Tarana RN device |
| 3 | Ethernet cable routing and connection to business router (if Managed Router module selected) or customer-supplied router |
| 4 | Router setup via QR code scanning — zero-touch cloud provisioning |
| 5 | QoS configuration and VoIP prioritisation |
| 6 | Speed testing, latency verification, and optimisation |
| 7 | Customer handover: WiFi credentials, portal access, and Reyee app setup |

---

## 12. Support Framework

Support levels are determined by the customer's chosen SLA module:

| Channel | Base (Included) | Enhanced SLA Module | Premium SLA Module |
|---------|-----------------|--------------------|--------------------|
| Phone Support | Mon–Fri 08:00–17:00 | Mon–Sat 08:00–20:00 | 24/7/365 |
| WhatsApp | Business hours | Extended hours | 24/7/365 |
| Email | < 4 hours (business) | < 2 hours (business) | < 1 hour |
| Online Portal | 24/7 self-service | 24/7 self-service | 24/7 self-service |
| On-Site Response | Next business day | Same business day | 4-hour response |
| Account Manager | Named contact | Yes | Yes — Priority |
| Remote Diagnostics | Standard | 85% issue resolution | 90% issue resolution |
| QBRs | No | No | Yes — with SLA report |

---

## 13. Partner & Reseller Commission Structure

> **CONFIDENTIAL — PARTNER PROGRAMME ONLY**

### 13.1 Partner Tiers & Commissions

| Tier | Upfront Commission | Recurring Commission | Minimum Requirement |
|------|-------------------|---------------------|---------------------|
| Authorised Reseller | 15% of first MRC | None | No minimum |
| Gold Partner | 20% of first MRC | 10% recurring (12 months) | 5 sales per quarter |
| Platinum Partner | 25% of first MRC | 15% recurring (24 months) | 10 sales per quarter |

### 13.2 Partner Benefits

| Benefit | Authorised | Gold | Platinum | Notes |
|---------|-----------|------|----------|-------|
| Marketing Materials | Yes | Yes | Yes | |
| Technical Training | Basic | Advanced | Certified | |
| Co-Branded Materials | No | Yes | Yes | |
| Dedicated Partner Manager | No | Yes | Yes | |
| White-Label Options | No | No | Yes | |
| Joint Marketing Campaigns | No | No | Yes | |
| Priority Lead Distribution | No | No | Yes | |
| Quarterly Business Reviews | No | Yes | Yes | |

---

## 14. Target Market & Verticals

### 14.1 Primary Verticals

| Vertical | Typical Businesses | Recommended Tier |
|----------|--------------------|-----------------|
| Professional Services | Law firms, accounting practices, consultancies, architecture studios | Business 100 / 200 |
| Retail & Hospitality | Restaurants, retail stores, guest houses, coffee shops | Business 50 / 100 |
| Healthcare | Medical practices, dental offices, physiotherapy clinics, pharmacies | Business 100 / 200 |
| Creative Industries | Design studios, marketing agencies, photography studios, media companies | Business 100 / 200 |
| Education | Private tutoring centres, training academies, e-learning providers | Business 50 / 100 |

### 14.2 Key Use Cases

Cloud-based applications (Microsoft 365, Google Workspace, Xero, Sage), VoIP phone systems, video conferencing (Zoom, Teams), point-of-sale systems, remote desktop access, online backup and storage, and customer WiFi provision.

> **Note:** Upload-intensive workflows (large file uploads, live streaming) should be evaluated against the 4:1 DL:UL ratio. For businesses requiring symmetrical speeds, BizFibreConnect (DFA fibre) is the recommended alternative.

---

## 15. Competitive Positioning & Sales Strategy

### 15.1 Market Landscape

Both CircleTel's SkyFibre Business and MTN Business Uncapped Wireless run on the same underlying infrastructure: MTN's Tarana G1 FWB network using a 4:1 DL:UL profile. The speed profiles are identical. CircleTel's competitive advantage rests entirely on the service wrapper.

### 15.2 Head-to-Head Comparison (100 Mbps Reference)

| Configuration | MTN Business Direct | CT Base Only | CT Full Bundle |
|---------------|-------------------|-------------|---------------|
| Speed (DL/UL) | 100/25 Mbps (4:1) | 100/25 Mbps (4:1) | 100/25 Mbps (4:1) |
| Monthly Price | R999 | R1 499 | R2 524 |
| Underlying Technology | Tarana G1 (MTN FWB) | Tarana G1 (MTN FWB) | Tarana G1 (MTN FWB) |
| Static IP | ✗ Not included | ✓ 1x Public IP included | ✓ 1x Public IP included |
| Fair Usage Policy | ✗ FUP applies (throttling) | ✓ No FUP — truly uncapped | ✓ No FUP — truly uncapped |
| Contract Lock-in | ✗ 24-month commitment | ✓ Month-to-month | ✓ Month-to-month |
| Business SLA | ✗ No SLA | Best-effort support | ✓ 99.5% SLA with credits |
| Managed Router | Basic Wi-Fi router included | BYOD (bring your own) | ✓ Cloud-managed Reyee |
| 5G/LTE Failover | ✗ Not available | ✗ Not included | ✓ Automatic failover |
| Cloud Backup / Email | ✗ Not available | ✗ Not included (add-on) | ✓ Included in bundle |
| Account Manager | ✗ Call centre only | ✓ Named contact | ✓ Named contact + QBRs |

**The R500/month premium buys:** truly uncapped data without FUP throttling, a static public IP address for servers and remote access, month-to-month flexibility (no 24-month lock-in), a named business account manager (not a call centre), and the option to add managed services, failover, backup, and security as needed.

### 15.3 Sales Objection Framework

When a prospect raises the MTN Business pricing comparison, the recommended sales response follows this framework:

**1. Acknowledge the price difference honestly:** "You're right, the R999 offer and our service both run on the same Tarana G1 platform — so the raw speed is identical at 100/25 Mbps."

**2. Articulate the service wrapper:** "The difference is what sits around that connectivity. Their offer locks you into 24 months, applies a fair usage policy that can throttle your speeds during peak hours, gives you no static IP for your office systems, and routes your support calls through a generic call centre."

**3. Present the modular advantage:** "Our offer at R1 499 gives you truly uncapped data with no FUP, a dedicated static IP, month-to-month flexibility, and a named account manager who knows your business. We've also stripped out services you don't need — you only pay for what you use."

**4. Offer the backstop:** "And if matching R999 is essential, I have an alternative MTN Business channel that can do exactly that."

### 15.4 Delphius Midrand Case Study

On 26 February 2026, PJ Phike of Delphius (Midrand office) rejected the R2 899/month SkyFibre SMB Professional quote, citing a comparable MTN service provider offering at R999/month for 100 Mbps.

| Component | MTN Business (PJ Quote) | CircleTel Counter-Offer |
|-----------|------------------------|------------------------|
| Connectivity | 100/25 Mbps (4:1 Tarana G1) | 100/25 Mbps (4:1 Tarana G1) |
| Monthly Fee | R999 (incl. VAT) | R1 499 (excl. VAT) |
| Static IP Address | Not included (extra cost) | 1x Public IP included |
| Fair Usage Policy | FUP applies | No FUP — truly uncapped |
| Business SLA | Consumer-grade, no SLA | Business-grade, basic SLA |
| Optional: 5G Failover | Not available | Add R399/m |
| Optional: Managed Router | Basic Wi-Fi included | Add R149/m (cloud-managed) |
| CircleTel Gross Margin | N/A | 38.8% (R582/month) |

---

## 16. Arlan Channel: The Price-Match Backstop

For prospects where even R1 299–R1 499 will not land and the customer insists on R999, CircleTel has a strategic alternative: sell the MTN Business deal through the Arlan Communications partnership. This earns commission revenue with zero infrastructure investment, retains the customer relationship, and creates an upsell pathway.

| Metric | Arlan Channel (MTN Deal) |
|--------|--------------------------|
| Customer Pays | R999/month (MTN Business direct pricing) |
| MTN Commission Rate (R500–R999 tier) | 8.75–9.75% of contract value |
| CircleTel Share (30% of commission) | ~R29–R35/month per customer |
| Infrastructure Investment | ZERO |
| Customer Ownership | Permanent attribution per Clause 7.1 |
| Upsell Opportunity | Layer CT managed services (IT, security, backup) on top |

> **This approach is not the primary strategy — it is the backstop.** Use it when the alternative is losing the customer entirely. Every Arlan-channel customer becomes a prospect for CircleTel managed IT services, security, and backup modules over time.

---

## 17. Risk Register

**MSC Compliance:** Lower per-unit pricing means more subscribers are needed to meet the MTN Minimum Spend Commitment. The modular model must be paired with aggressive customer acquisition to stay above MSC thresholds. Mitigation: Unjani Clinics rollout (252 sites) provides MSC runway independent of commercial SMB sales.

**Module Attach Rate Uncertainty:** If most customers take base-only, blended ARPU drops. Mitigation: Target module attach of 1.5+ modules per customer through consultative selling and free 30-day trials on email and backup modules.

**Further MTN Price Drops:** MTN could reduce the Business Uncapped Wireless pricing further. Mitigation: Arlan backstop channel ensures CircleTel can always match MTN pricing whilst earning commission.

**Sales Team Adaptation:** Moving from "sell the bundle" to "consultative modular selling" requires retraining. Mitigation: Create a pricing configurator tool and conduct a 2-day sales enablement workshop in Week 1.

---

## 18. Implementation Roadmap

### 18.1 Immediate Actions (Week 1)

1. Update all sales collateral, price lists, and the CircleTel website with modular pricing.
2. Send revised counter-offer to PJ Phike at Delphius (R1 499 base, modules optional).
3. Brief the sales team on the new objection-handling framework.
4. Update AgilityGIS BSS billing templates to support modular line items.

### 18.2 Short-Term Actions (Month 1)

5. Create competitive battlecard: SkyFibre Business vs MTN Business Uncapped Wireless.
6. Develop a one-page modular pricing configurator for sales team use.
7. Review all open SkyFibre SMB quotes and re-price under new model.
8. Engage Arlan Communications to confirm MTN Business deal availability for backstop channel.

### 18.3 Medium-Term Actions (Months 2–3)

9. Track module attach rates per customer to identify highest-demand add-ons.
10. Analyse win/loss rates comparing modular vs old bundle pricing.
11. Consider introducing a "SkyFibre Business Starter" at 25 Mbps / R899 for FTTH areas only.
12. Evaluate introduction of annual billing discount (5%) to improve cash flow and reduce churn.

---

## 19. Financial Projections & KPIs

### 19.1 Key Performance Indicators

| KPI | Target | Measurement Method |
|-----|--------|-------------------|
| Monthly Churn Rate | < 2% | Customer retention tracking |
| Net Promoter Score (NPS) | > 50 | Quarterly customer surveys |
| Installation Lead Time | < 5 business days | Order-to-active tracking |
| Support Resolution Time | < 4 hours (Enhanced SLA) | Ticket closure analysis |
| Network Uptime | > 99.5% | Automated network monitoring |
| Base Tier Gross Margin | > 37% | Monthly P&L analysis |
| Module Attach Rate | ≥ 1.5 modules/customer | Module subscription tracking |
| Blended ARPU | > R1 700 | Revenue / active subscribers |

---

## 20. Approval

This revised product specification requires approval from the following stakeholders before market implementation:

| Role | Name | Signature | Date |
|------|------|-----------|------|
| CEO / Managing Director | | _________________ | _________________ |
| Chief Financial Officer | | _________________ | _________________ |
| Sales Director | | _________________ | _________________ |

---

**END OF DOCUMENT**

*CircleTel (Pty) Ltd — A member of the New Generation Group*

*"Connecting Today, Creating Tomorrow"*
