# CircleTel CloudWiFi™ — Wi-Fi as a Service (WaaS)

## Commercial Product Specification

| | |
|:---|:---|
| **Document Title** | CloudWiFi™ Wi-Fi as a Service — Commercial Product Specification |
| **Document Reference** | CT-CWIFI-CPS-2026-001 |
| **Version** | 1.0 |
| **Date** | 01 March 2026 |
| **Classification** | Confidential — Internal / Board |
| **Author** | CircleTel Product & Strategy |
| **Status** | Draft |

---

## Version Control

| Version | Date | Author | Changes |
|:---|:---|:---|:---|
| 1.0 | 01 Mar 2026 | Product & Strategy | Initial commercial product specification — multi-vertical managed Wi-Fi as a Service product definition, delivery model, pricing, unit economics, SLA framework, and go-to-market strategy |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Delivery Model Recommendation](#3-delivery-model-recommendation)
4. [Solution Architecture](#4-solution-architecture)
5. [Hardware Specification](#5-hardware-specification)
6. [Service Tiers & Pricing](#6-service-tiers--pricing)
7. [Vertical Market Packages](#7-vertical-market-packages)
8. [Unit Economics & Contribution Margin](#8-unit-economics--contribution-margin)
9. [Service Level Agreements](#9-service-level-agreements)
10. [Cloud Management & Analytics](#10-cloud-management--analytics)
11. [Optional Add-On Modules](#11-optional-add-on-modules)
12. [Competitive Positioning](#12-competitive-positioning)
13. [Go-to-Market Strategy](#13-go-to-market-strategy)
14. [Risks & Mitigations](#14-risks--mitigations)
15. [Portfolio Alignment & Cross-Sell](#15-portfolio-alignment--cross-sell)
16. [Document Control](#16-document-control)

---

## 1. Executive Summary

CircleTel CloudWiFi™ is a fully managed Wi-Fi as a Service (WaaS) product designed to deliver enterprise-grade wireless connectivity to commercial venues, hospitality establishments, multi-tenant properties, and community facilities — without the customer needing to procure, configure, or maintain any Wi-Fi infrastructure.

CloudWiFi™ operates as a managed overlay service on top of any CircleTel connectivity product (MTN Tarana FWB, DFA fibre, DUNE 60GHz, or LTE/5G), making it technology-agnostic and deployable wherever CircleTel has a backhaul presence. CircleTel owns, operates, and manages all on-site Wi-Fi hardware, cloud management, and ongoing support. The customer pays a single monthly fee inclusive of hardware, installation, management, and support.

### Why CloudWiFi™ for a Start-Up ISP

As a start-up, CircleTel benefits from the WaaS model because it transforms one-off hardware sales into compounding monthly recurring revenue (MRR), retains ownership of deployed assets (strengthening the balance sheet), creates deep customer stickiness through managed services, and generates cross-sell pathways into the broader CircleTel portfolio.

### Key Commercial Highlights

| Metric | Value |
|:---|:---|
| **Product name** | CloudWiFi™ by CircleTel |
| **Tagline** | *Managed Wi-Fi. Zero Hassle.* |
| **Delivery model** | Fully managed — CircleTel owns and operates all hardware |
| **Target verticals** | Hospitality, commercial venues, multi-tenant properties, healthcare, education, retail |
| **Underlying connectivity** | Technology-agnostic (Tarana FWB, DFA fibre, DUNE 60GHz, LTE/5G) |
| **Hardware platform** | Reyee Wi-Fi 6 access points + MikroTik / Reyee gateway routers |
| **Cloud management** | Ruijie Cloud — zero licensing cost, lifetime free |
| **Monthly pricing range** | R1 499–R14 999 per site (depending on tier and scale) |
| **Target gross margin** | 55–72% |
| **Contract terms** | 24 or 36 months |
| **CAPEX payback** | 3–8 months (depending on tier) |

---

## 2. Product Overview

### 2.1 What Is CloudWiFi™?

CloudWiFi™ is a subscription-based managed Wi-Fi service where CircleTel designs, deploys, owns, monitors, and maintains a complete wireless network at the customer's premises. The customer receives seamless, high-performance Wi-Fi coverage across their venue without capital outlay, technical complexity, or ongoing operational burden.

### 2.2 How It Works

1. **Site Survey:** CircleTel conducts a coverage assessment and produces a Wi-Fi design plan.
2. **Installation:** Certified technicians deploy Reyee Wi-Fi 6 access points, cabling, and the gateway router.
3. **Configuration:** SSIDs, VLANs, QoS policies, captive portal (if required), and bandwidth management are configured via Ruijie Cloud.
4. **Go-Live:** The customer's venue is connected with managed Wi-Fi — staff, guests, IoT, and operations each on segmented networks.
5. **Ongoing Management:** CircleTel monitors performance 24/7 via Ruijie Cloud, pushes firmware updates, adjusts configurations, and resolves faults remotely or on-site.

### 2.3 Value Proposition by Stakeholder

| Stakeholder | Value Delivered |
|:---|:---|
| **Venue owner / operator** | Enterprise-grade Wi-Fi with zero CAPEX, single monthly invoice, no IT overhead |
| **Guests / visitors** | Fast, reliable Wi-Fi with optional branded captive portal |
| **Staff / operations** | Dedicated, QoS-prioritised network for POS, VoIP, CCTV, and business systems |
| **CircleTel** | Recurring MRR, asset ownership, cross-sell gateway, customer lock-in |

### 2.4 Brand Architecture — Portfolio Positioning

```
CircleTel (Parent Company)
├── SkyFibre (Wireless FWA)              — Connectivity pipe
├── HomeFibreConnect (Residential Fibre) — Connectivity pipe
├── BizFibreConnect (Business Fibre)     — Connectivity pipe
├── WorkConnect (SOHO)                   — Connectivity pipe
├── ParkConnect (DUNE — Office Parks)    — Connectivity pipe
├── CloudWiFi™ (WaaS) ◄── NEW           — Managed overlay service
│   ├── CloudWiFi Essential              — Small venues
│   ├── CloudWiFi Professional           — Medium venues
│   ├── CloudWiFi Enterprise             — Large / multi-zone venues
│   └── CloudWiFi Campus                 — Multi-building campuses
├── ThinkWiFi (Ad-funded Free WiFi)      — Monetisation model
└── Managed IT Services                  — Full IT stack
```

**Naming rationale:** "CloudWiFi" communicates cloud-managed Wi-Fi delivery. It is deliberately technology-agnostic — the underlying pipe is invisible to the customer. The name is distinct from the connectivity products (which sell the pipe) and from ThinkWiFi (which is an ad-funded model). CloudWiFi sells the managed Wi-Fi experience.

---

## 3. Delivery Model Recommendation

### 3.1 Why Fully Managed Is Optimal for CircleTel as a Start-Up

| Factor | Fully Managed (Recommended) | Co-Managed | Self-Service |
|:---|:---|:---|:---|
| **MRR quality** | Highest — hardware + service + support bundled | Medium | Lowest |
| **Customer stickiness** | Very high — switching costs are significant | Medium | Low |
| **Asset ownership** | CircleTel owns all equipment (balance sheet value) | Split | Customer owns |
| **Service quality control** | Full — CircleTel controls the entire experience | Partial | None |
| **Cross-sell potential** | Maximum — ongoing relationship enables upsell | Moderate | Limited |
| **Operational complexity** | Higher (requires NOC + field support) | Medium | Lowest |
| **Start-up cash flow impact** | CAPEX upfront, recovered via MRR within 3–8 months | Lower CAPEX | Zero CAPEX |
| **Scalability** | Builds a managed services annuity book | Limited | Commodity |
| **Churn risk** | Low — equipment recovery creates exit friction | Medium | High |

**Recommendation:** The fully managed model is the optimal delivery model for CircleTel for three strategic reasons:

1. **Recurring revenue compounding:** Every site deployed adds guaranteed MRR for 24–36 months. At 50 sites averaging R4 000/month, that is R200 000 MRR — R2.4M annualised — from a single product line.

2. **Asset-light for the customer, asset-rich for CircleTel:** The customer pays no CAPEX, which removes the primary sales barrier. CircleTel accumulates a growing fleet of deployed hardware that has balance sheet value and can be re-deployed if a customer churns.

3. **Gateway to full-stack managed services:** Once CircleTel owns the Wi-Fi layer at a venue, it is a natural step to upsell managed IT, VoIP, security (SafeGuard), IoT (CircleConnect), and connectivity upgrades — creating a "land and expand" revenue model.

### 3.2 Financial Model — Fully Managed vs Alternatives

| Model | Year 1 Revenue (50 sites) | Year 1 CAPEX | Net Position (Year 1) | Year 2 Net |
|:---|---:|---:|---:|---:|
| **Fully managed** | R2 400 000 | R750 000 | R1 650 000 | R2 400 000 (zero CAPEX) |
| Co-managed | R1 500 000 | R375 000 | R1 125 000 | R1 500 000 |
| Self-service (hardware sale) | R750 000 | R0 | R750 000 | R0 (once-off) |

The fully managed model breaks even fastest on a cumulative basis and generates the highest lifetime value.

---

## 4. Solution Architecture

### 4.1 End-to-End Network Topology

```
┌──────────────────────────────────────────────────────────────────────┐
│              CLOUDWIFI™ PER-SITE TOPOLOGY                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   [Internet / CircleTel Core Network]                                │
│   (ECHO SP BNG at Teraco — CGNAT, IP Transit, NAPAfrica peering)     │
│          │                                                           │
│   [Backhaul — Technology-Agnostic]                                   │
│   (MTN Tarana FWB / DFA Fibre / DUNE 60GHz / LTE/5G)                │
│          │                                                           │
│   [Gateway Router]                                                   │
│   (MikroTik hEX S / hAP ax S / Reyee EG-Series)                     │
│       │          │          │          │                             │
│   [VLAN 10]   [VLAN 20]  [VLAN 30]  [VLAN 40]                       │
│   Staff/Ops   Guest WiFi  IoT/CCTV   Management                     │
│       │          │          │          │                             │
│   [AP Zone 1] [AP Zone 2] [AP Zone 3] [AP Zone N]                   │
│   Reyee Wi-Fi 6 Access Points (ceiling / wall / outdoor)             │
│          │                                                           │
│   [Ruijie Cloud — Remote Management]                                 │
│   (Zero-cost, lifetime free, multi-site dashboard)                   │
│          │                                                           │
│   [CircleTel NOC — Monitoring & Support]                             │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 Network Segmentation (Standard)

| VLAN | Purpose | Priority | Access Control |
|:---|:---|:---|:---|
| **VLAN 10** | Staff / Operations (POS, VoIP, admin) | High — QoS priority | WPA3-Enterprise, MAC filtering |
| **VLAN 20** | Guest / Visitor Wi-Fi | Standard | Open SSID with captive portal, bandwidth-capped |
| **VLAN 30** | IoT / CCTV / Sensors | Low | Isolated, no internet access (local only) or restricted |
| **VLAN 40** | Management | Critical | CircleTel NOC access only, encrypted |

### 4.3 Backhaul Agnosticism

CloudWiFi™ is a managed overlay — it sits on top of any CircleTel connectivity service. The backhaul technology is selected based on the venue's location and availability:

| Priority | Technology | Speed Range | Use Case |
|:---|:---|:---|:---|
| 1 | DFA Fibre (Business Broadband) | 10–200 Mbps symmetrical | Metro areas, fibre-covered buildings |
| 2 | MTN Tarana G1 FWB | 50–200 Mbps (4:1 asymmetric) | Wide coverage, 6M homes passed |
| 3 | DUNE 60GHz (via ParkConnect) | Up to 3.5 Gbps | Office parks, multi-tenant, campus |
| 4 | MTN 5G | 60+ Mbps | Metro, where FWB/fibre unavailable |
| 5 | MTN LTE | 20–50 Mbps | Rural, backup, temporary |

> **Important:** CloudWiFi™ is sold as a managed Wi-Fi overlay. The connectivity pipe is either bundled (CloudWiFi + connectivity) or the customer brings their own CircleTel connection. Bundling is recommended for simplicity and margin stacking.

---

## 5. Hardware Specification

### 5.1 Access Points — Reyee Wi-Fi 6 Range

| Model | Type | Standard | Coverage | Max Clients | PoE | Dealer Cost | Use Case |
|:---|:---|:---|:---|:---|:---|---:|:---|
| **RG-RAP2200(F)** | Indoor ceiling | Wi-Fi 6 AX1800 | 150 m² | 256+ | 802.3af | R850 | Offices, clinics, hotel rooms |
| **RG-RAP6262(G)** | Outdoor | Wi-Fi 6 AX1800 | 500 m² | 512+ | 802.3at | R1 203 | Courtyards, pools, parking, al fresco |
| **RG-EW3000GX** | Desktop | Wi-Fi 6 AX3000 | 230 m² | 128 | N/A | R650 | Small venues, single-zone |
| **RG-RAP2260(E)** | Wall plate | Wi-Fi 6 AX3000 | Per room | 64 | 802.3at | R950 | Hotel rooms, B&B suites |

All access points are managed via Ruijie Cloud at zero licensing cost.

### 5.2 Gateway Routers

| Model | Throughput | Ports | PoE | VPN | Dealer Cost | Use Case |
|:---|:---|:---|:---|:---|---:|:---|
| **MikroTik hEX S** | 880 MHz dual-core | 5× GbE + SFP | Out (port 5) | Full | R1 200 | Small venues, captive portal |
| **MikroTik hAP ax S** | 950 MHz dual-core | 5× GbE + 2.5G SFP | In + Out | Full | R1 150 | Small venues (consolidated router + AP) |
| **Reyee RG-EG105G** | 600 Mbps | 5× GbE (2 WAN) | — | 64 tunnels | R1 025 | Standard business venues |
| **Reyee RG-EG105G-P** | 600 Mbps | 5× GbE (2 WAN) | 4× PoE (54W) | 64 tunnels | R1 195 | Venues needing PoE for APs |
| **Reyee RG-EG305GH-P-E** | 1.5 Gbps | 5× GbE (4 WAN) | 4× PoE (60W) | 64 tunnels | R2 125 | Medium venues, multi-WAN |
| **Reyee RG-EG310GH-P-E** | 1.5 Gbps | 10× GbE (4 WAN) | 8× PoE (110W) | 64 tunnels | R2 525 | Large venues, high-density |

### 5.3 Supporting Infrastructure

| Component | Specification | Unit Cost | Notes |
|:---|:---|---:|:---|
| PoE Switch (8-port) | Reyee / MikroTik managed | R650–R1 500 | Where router PoE budget is insufficient |
| CAT6 UTP cabling | Per metre (installed) | R15/m | Structured cabling to each AP |
| PoE injector | 802.3af/at | R150–R350 | Where PoE switch is not required |
| Mounting hardware | Ceiling / wall / pole brackets | R45–R150 | Per AP |
| UPS (optional) | 650VA line-interactive | R800 | For load-shedding protection |

---

## 6. Service Tiers & Pricing

### 6.1 Core Service Tiers

| Tier | Venue Size | Access Points | Typical Coverage | Monthly Price (excl. VAT) | Contract |
|:---|:---|:---|:---|---:|:---|
| **CloudWiFi Essential** | Small (< 300 m²) | 1–2 indoor | Café, small office, B&B | **R1 499** | 24 months |
| **CloudWiFi Professional** | Medium (300–800 m²) | 3–5 indoor + 1 outdoor | Restaurant, hotel lobby, clinic | **R3 499** | 24 months |
| **CloudWiFi Enterprise** | Large (800–2 000 m²) | 6–12 indoor + 2 outdoor | Conference centre, large hotel, shopping centre | **R7 999** | 36 months |
| **CloudWiFi Campus** | Multi-building | 12–30+ APs | Office park, school, hospital | **R14 999** | 36 months |

### 6.2 What Is Included in Every Tier

| Included Component | Detail |
|:---|:---|
| **Hardware** | All access points, gateway router, PoE switches, cabling, mounting — owned by CircleTel |
| **Site survey** | Professional RF coverage assessment and Wi-Fi design |
| **Installation** | Certified on-site deployment and commissioning |
| **SSID configuration** | Up to 4 SSIDs (staff, guest, IoT, management) with VLAN segmentation |
| **QoS policy** | Bandwidth management per SSID, traffic prioritisation |
| **Cloud management** | Ruijie Cloud dashboard — real-time monitoring, alerts, remote config |
| **Firmware management** | Scheduled OTA updates across all APs |
| **Captive portal** | Branded guest login page (standard template) |
| **24/7 remote monitoring** | CircleTel NOC proactive fault detection |
| **Remote support** | Configuration changes, troubleshooting, optimisation |
| **On-site support** | Hardware replacement within SLA (see Section 9) |
| **Reporting** | Monthly performance report (usage, uptime, connected devices) |

### 6.3 What Is Not Included (Priced Separately)

| Component | Pricing |
|:---|:---|
| Underlying internet connectivity | Bundled at discount or BYOC (Bring Your Own Connection) |
| Custom captive portal design | R2 500 once-off |
| Advanced analytics dashboard | R500/month |
| ThinkWiFi ad-funded portal integration | R500/month + revenue share |
| Static IP address | R99/month |
| LTE/5G backup failover | R599/month |
| UPS / load-shedding protection | R150/month (rental) or R800 once-off |

---

## 7. Vertical Market Packages

### 7.1 Hospitality — Hotels, Lodges, B&Bs

| Package | Rooms | APs | Features | Monthly |
|:---|:---|:---|:---|---:|
| **CloudWiFi Hospitality — Boutique** | Up to 15 rooms | 3–4 indoor | Branded portal, guest SSID, staff SSID | R2 999 |
| **CloudWiFi Hospitality — Standard** | 15–50 rooms | 6–12 indoor + 2 outdoor | Branded portal, room-level coverage, pool/garden Wi-Fi | R6 999 |
| **CloudWiFi Hospitality — Premium** | 50–120 rooms | 15–30 indoor + 4 outdoor | Full campus, conference facilities, PMS integration-ready | R12 999 |

**Key hospitality features:** branded captive portal with venue logo, tiered guest access (free basic / premium paid), integration-ready for Property Management Systems (PMS), seamless roaming across all venue areas, outdoor pool and garden coverage.

### 7.2 Commercial Venues — Offices, Retail, Restaurants

| Package | Venue Type | APs | Features | Monthly |
|:---|:---|:---|:---|---:|
| **CloudWiFi Commercial — Starter** | Small office / café | 1–2 | Staff + guest SSID, basic QoS | R1 499 |
| **CloudWiFi Commercial — Business** | Medium office / restaurant | 3–5 | Dual SSID, VoIP QoS, captive portal | R3 499 |
| **CloudWiFi Commercial — Premium** | Large retail / conference | 6–12 | Multi-zone, IoT VLAN, analytics | R7 999 |

### 7.3 Multi-Tenant Properties — Estates, Office Parks, MDUs

| Package | Units | APs | Features | Monthly |
|:---|:---|:---|:---|---:|
| **CloudWiFi Property — Common Areas** | N/A | 3–6 outdoor/indoor | Lobby, clubhouse, pool, gym coverage | R3 999 |
| **CloudWiFi Property — Bulk** | 20–50 units | 10–25 | Per-unit coverage + common areas | R8 999 |
| **CloudWiFi Property — Enterprise** | 50–150 units | 25–60 | Full estate coverage, per-unit bandwidth management | R14 999 |

**Cross-sell synergy:** CloudWiFi Property deploys alongside ParkConnect (DUNE 60GHz) or EstateLink (DUNE residential) to provide the underlying connectivity backbone, with CloudWiFi providing the managed indoor/outdoor Wi-Fi layer.

### 7.4 Healthcare — Clinics, Medical Centres

| Package | Facility Size | APs | Features | Monthly |
|:---|:---|:---|:---|---:|
| **CloudWiFi Health — Clinic** | Single clinic | 1–2 | Staff SSID (POS/admin), patient free WiFi | R1 499 |
| **CloudWiFi Health — Practice** | Multi-room practice | 3–5 | Clinical VLAN, patient WiFi, CCTV VLAN | R3 499 |
| **CloudWiFi Health — Campus** | Hospital / multi-building | 12–30+ | Full campus, department segmentation | R14 999 |

**Cross-sell synergy:** Integrates directly with ThinkWiFi ad-funded model for patient/visitor free WiFi monetisation — proven at Unjani Clinics (R2 964/site/month ad revenue with outdoor AP).

### 7.5 Education — Schools, Training Centres

| Package | Facility | APs | Features | Monthly |
|:---|:---|:---|:---|---:|
| **CloudWiFi Edu — Classroom** | Single building | 3–6 | Content filtering, student/staff SSIDs | R3 499 |
| **CloudWiFi Edu — Campus** | Multi-building | 10–20 | Full campus, LearnLink backbone integration | R9 999 |
| **CloudWiFi Edu — Premium** | Large campus | 20–30+ | Bandwidth per class, digital signage ready | R14 999 |

**Cross-sell synergy:** Layers on top of LearnLink™ (DUNE campus backbone) and EduConnect managed IT.

---

## 8. Unit Economics & Contribution Margin

### 8.1 CAPEX per Tier

| Tier | Gateway | APs (avg.) | PoE/Cabling | Installation | Total CAPEX |
|:---|---:|---:|---:|---:|---:|
| **Essential** (2 APs) | R1 200 | R1 700 | R800 | R1 500 | **R5 200** |
| **Professional** (5 APs) | R1 195 | R4 850 | R2 000 | R3 000 | **R11 045** |
| **Enterprise** (10 APs) | R2 125 | R9 700 | R4 500 | R5 000 | **R21 325** |
| **Campus** (25 APs) | R2 525 | R22 250 | R10 000 | R12 000 | **R46 775** |

### 8.2 Monthly OPEX per Tier

| Cost Component | Essential | Professional | Enterprise | Campus |
|:---|---:|---:|---:|---:|
| Backhaul (blended avg.) | R499 | R599 | R899 | R2 199 |
| ECHO SP BNG (per site) | R55 | R55 | R55 | R55 |
| AgilityGIS BSS | R11 | R11 | R11 | R11 |
| NOC monitoring (pro-rata) | R200 | R400 | R750 | R1 500 |
| Support reserve (5% of revenue) | R75 | R175 | R400 | R750 |
| Hardware amortisation (24/36 months) | R217 | R307 | R593 | R1 299 |
| **Total monthly OPEX** | **R1 057** | **R1 547** | **R2 708** | **R5 814** |

### 8.3 Contribution Margin Analysis

| Tier | Monthly Revenue | Monthly OPEX | Gross Profit | Gross Margin | CAPEX Payback |
|:---|---:|---:|---:|---:|:---|
| **Essential** | R1 499 | R1 057 | **R442** | **29.5%** | 11.8 months |
| **Professional** | R3 499 | R1 547 | **R1 952** | **55.8%** | 5.7 months |
| **Enterprise** | R7 999 | R2 708 | **R5 291** | **66.1%** | 4.0 months |
| **Campus** | R14 999 | R5 814 | **R9 185** | **61.2%** | 5.1 months |

> **Note:** The Essential tier has a lower margin because the fixed OPEX components (BNG, BSS, NOC) are spread over a smaller revenue base. The recommendation is to position Essential as an entry-level funnel product and actively upsell to Professional within 6 months.

### 8.4 Bundled Connectivity Margin Stack

When CloudWiFi™ is sold with a bundled CircleTel connectivity service, the combined margin improves significantly:

| Bundle Example | CloudWiFi MRR | Connectivity MRR | Total MRR | Combined OPEX | Combined Margin |
|:---|---:|---:|---:|---:|---:|
| Professional + SkyFibre SMB 100 Mbps | R3 499 | R2 199 | R5 698 | R2 746 | **51.8%** |
| Enterprise + BizFibreConnect Pro | R7 999 | R2 599 | R10 598 | R4 545 | **57.1%** |
| Campus + ParkConnect Standard | R14 999 | R18 000 | R32 999 | R12 814 | **61.2%** |

**Recommendation:** Always sell CloudWiFi as a bundled solution with connectivity. The combined margin is healthier, the customer experience is simpler (single invoice, single SLA, single point of contact), and churn risk drops substantially.

---

## 9. Service Level Agreements

### 9.1 SLA Tiers by Product

| SLA Parameter | Essential | Professional | Enterprise | Campus |
|:---|:---|:---|:---|:---|
| **Wi-Fi uptime guarantee** | 99.0% | 99.5% | 99.9% | 99.9% |
| **Fault response time** | Next business day | 8 business hours | 4 hours (24/7) | 2 hours (24/7) |
| **Hardware replacement** | 48 hours | 24 hours | 8 hours | 4 hours (on-site spare) |
| **Remote resolution target** | 4 hours | 2 hours | 1 hour | 30 minutes |
| **Service credits** | 5% per SLA breach | 5% per SLA breach | 10% per SLA breach | 15% per SLA breach |
| **Quarterly performance review** | No | Yes | Yes | Yes — with dedicated AM |
| **Escalation path** | Tier 1 → Tier 2 | Tier 1 → Tier 2 → AM | Direct to AM | Dedicated AM + direct NOC |

### 9.2 Uptime Calculation

Wi-Fi uptime is measured as the percentage of time the venue's managed Wi-Fi network is operational, excluding scheduled maintenance windows (communicated 48 hours in advance) and force majeure events. Uptime is measured at the access point level per site.

### 9.3 Service Credit Mechanism

| Monthly Uptime | Credit (% of CloudWiFi MRC) |
|:---|:---|
| 99.9%–99.5% | 0% |
| 99.5%–99.0% | 5% |
| 99.0%–98.0% | 10% |
| Below 98.0% | 15% |

Service credits are capped at 15% of the monthly CloudWiFi fee and are applied as a discount on the following month's invoice.

---

## 10. Cloud Management & Analytics

### 10.1 Ruijie Cloud Platform

| Feature | Detail |
|:---|:---|
| **Cost** | Zero — lifetime free, no per-AP or per-site licence fees |
| **Multi-site management** | Single dashboard across all CloudWiFi deployments |
| **Real-time monitoring** | Per-AP status, client count, bandwidth, channel utilisation |
| **Zero-touch provisioning** | New APs auto-register and pull configuration from cloud |
| **Firmware management** | Scheduled OTA updates, bulk deployment |
| **Alerts & notifications** | AP offline, high utilisation, rogue SSID detection |
| **Mobile app** | iOS/Android — Reyee Router App |
| **API access** | REST API for integration with AgilityGIS BSS, CRM, and dashboards |

### 10.2 Customer-Facing Analytics (Optional Add-On — R500/month)

| Metric | Description |
|:---|:---|
| Connected devices | Daily, weekly, monthly unique device count |
| Peak usage periods | Hourly heatmap of Wi-Fi usage |
| Bandwidth consumption | Per-SSID and aggregate throughput |
| Dwell time | Average time users spend connected |
| Return visitor rate | Percentage of devices that reconnect within 30 days |
| Top applications | DPI-based application categorisation (social, streaming, productivity) |

### 10.3 API Integration with CircleTel Systems

| System | Integration Point | Purpose |
|:---|:---|:---|
| **AgilityGIS BSS** | Auto-provisioning, service activation, billing | Subscriber lifecycle management |
| **ECHO SP BNG** | Session management, bandwidth policy | Network authentication |
| **CRM (Supabase)** | Lead tracking, upsell triggers, churn flags | Sales and retention |
| **NOC Dashboard** | Real-time alerts, fault management | Proactive monitoring |
| **ThinkWiFi Platform** | Captive portal API, ad-serving integration | Ad-funded revenue overlay |

---

## 11. Optional Add-On Modules

| Module | Monthly Price | Description |
|:---|---:|:---|
| **CloudWiFi Captive Portal — Custom Design** | R2 500 once-off | Bespoke branded login page with venue branding, social login, T&C acceptance |
| **CloudWiFi Analytics** | R500/month | Advanced usage analytics dashboard with dwell time, footfall, and device insights |
| **CloudWiFi ThinkWiFi Integration** | R500/month + rev share | Ad-funded guest Wi-Fi monetisation via Think Digital X captive portal |
| **CloudWiFi Failover** | R599/month | LTE/5G backup connectivity for business continuity during primary link failure |
| **CloudWiFi Static IP** | R99/month | Dedicated public IPv4 for VPN, CCTV remote access, or server hosting |
| **CloudWiFi VoIP QoS** | Included | Traffic prioritisation for voice-over-IP — standard in all tiers |
| **CloudWiFi Content Filtering** | R250/month | Web content filtering for education, healthcare, or family venues |
| **CloudWiFi Digital Signage** | R350/month | Dedicated VLAN and bandwidth reservation for digital signage displays |
| **CloudWiFi CCTV VLAN** | Included | Isolated VLAN for IP cameras — standard in Professional tier and above |

---

## 12. Competitive Positioning

### 12.1 Competitive Landscape — South Africa WaaS Market

| Provider | Model | Target Market | Monthly Pricing | Differentiator |
|:---|:---|:---|:---|:---|
| **Cisco Meraki** | Cloud-managed (via partner) | Enterprise | R5 000–R50 000+ | Premium brand, expensive licensing |
| **Ruckus (CommScope)** | Partner-managed | Enterprise / Hospitality | R3 000–R30 000+ | High-performance hardware |
| **Ubiquiti (via resellers)** | Self-managed or MSP | SME / Tech-savvy | R1 000–R5 000 (hardware only) | Low cost, DIY model |
| **MikroTik (via resellers)** | Self-managed | ISPs / Tech-savvy | R500–R3 000 (hardware only) | Very low cost, complex config |
| **AlwaysOn WiFi** | Managed Wi-Fi | Hospitality | R2 000–R10 000 | Hospitality focus, SA-based |
| **CircleTel CloudWiFi™** | **Fully managed WaaS** | **Multi-vertical** | **R1 499–R14 999** | **Zero CAPEX, bundled connectivity, zero cloud licensing, SA start-up agility** |

### 12.2 CircleTel CloudWiFi™ Competitive Advantages

| Advantage | Detail |
|:---|:---|
| **Zero cloud licensing cost** | Ruijie Cloud is lifetime free — competitors like Cisco Meraki charge R200–R500/AP/year |
| **Bundled connectivity** | CloudWiFi + CircleTel internet as a single service — competitors sell Wi-Fi hardware only |
| **Fully managed, zero CAPEX** | Customer pays nothing upfront — competitors require hardware purchase or lease |
| **Multi-vertical flexibility** | Single product covers hospitality, commercial, property, health, education |
| **SA-based support** | Local NOC, local field engineers, ZAR pricing — no USD exchange risk |
| **Cross-sell ecosystem** | Gateway to ThinkWiFi, SafeGuard, CircleConnect IoT, Managed IT |
| **Start-up agility** | Faster decision-making, flexible deal structures, personal account management |

---

## 13. Go-to-Market Strategy

### 13.1 Launch Phases

| Phase | Period | Focus | Target Sites | MRR Target |
|:---|:---|:---|---:|---:|
| **Pilot** | Months 1–2 | 5 beta sites across verticals, validate unit economics | 5 | R17 500 |
| **Soft Launch** | Months 3–4 | Refine processes, build case studies, train sales team | 15 | R52 500 |
| **Growth** | Months 5–12 | Channel partners, inbound marketing, vertical specialisation | 50 | R200 000 |
| **Scale** | Year 2 | 100+ sites, dedicated WaaS sales team, national coverage | 100+ | R400 000+ |

### 13.2 Sales Channels

| Channel | CAC (Est.) | Conversion | Priority |
|:---|---:|:---|:---|
| **Direct sales** | R3 500 | High — consultative, complex venues | Primary (Year 1) |
| **Existing CircleTel customers** (upsell) | R500 | Very high — already paying for connectivity | Immediate |
| **Property management companies** | R2 000 | Medium — bulk sites, longer sales cycle | High |
| **Hospitality groups** | R2 500 | Medium — multi-site rollouts | High |
| **IT reseller partners** | R1 500 | Medium — referral model | Year 2 |
| **Digital / inbound** | R1 200 | Low volume, high quality | Ongoing |

### 13.3 Launch Promotions

**"First 20 Sites" Founders Offer:**

| Incentive | Value |
|:---|:---|
| Free site survey and Wi-Fi design | Save R2 500 |
| Free installation and commissioning | Save R1 500–R5 000 |
| Free branded captive portal design | Save R2 500 |
| First month free | Save R1 499–R14 999 |
| **Total value** | **Up to R25 000** |

Founders offer available for 24- or 36-month contracts only. Limited to 20 sites nationally.

---

## 14. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|:---|:---|:---|:---|
| **Slow uptake / long sales cycle** | Medium | High | Launch with existing customer base upsell; founders offer to accelerate |
| **CAPEX cash flow strain** | Medium | Medium | Prioritise Professional + Enterprise tiers (faster payback); explore Scoop Distribution credit terms |
| **Hardware failure / truck roll cost** | Low | Medium | Ruijie Cloud remote diagnostics reduce truck rolls by 60–70%; maintain 10% spares buffer |
| **Competition from Meraki / Ruckus partners** | Medium | Medium | Compete on zero CAPEX, zero licensing, bundled connectivity, and local support |
| **Customer churn at contract end** | Low | High | Build stickiness through ThinkWiFi integration, analytics, and cross-sell; 36-month contracts preferred |
| **Load shedding** | High | Medium | Offer UPS add-on; Tarana/LTE backhaul is PoE-powered and survives short outages |
| **Reyee hardware supply chain** | Low | Medium | Scoop Distribution holds 2 000+ units in SA; maintain 30-day buffer stock |

---

## 15. Portfolio Alignment & Cross-Sell

### 15.1 CloudWiFi™ as the "Land and Expand" Product

CloudWiFi™ is strategically positioned as CircleTel's primary entry point into commercial venues. Once the managed Wi-Fi relationship is established, it unlocks natural upsell pathways across the full portfolio:

| Step | Product | Additional MRR |
|:---|:---|---:|
| 1. **Land** | CloudWiFi™ Professional | R3 499 |
| 2. **Bundle connectivity** | SkyFibre SMB or BizFibreConnect | R1 899–R2 599 |
| 3. **Add security** | SafeGuard CCTV VLAN integration | R500–R2 000 |
| 4. **Add monetisation** | ThinkWiFi ad-funded guest portal | R500 + revenue share |
| 5. **Add IoT** | CircleConnect IoT sensors | R500–R1 500 |
| 6. **Add managed IT** | Managed IT Services | R2 500–R10 000 |
| 7. **Add VoIP** | Voice services | R149/line |
| **Total potential MRR** | | **R9 547–R20 747** |

### 15.2 Product Interaction Map

| Existing Product | CloudWiFi™ Relationship |
|:---|:---|
| **SkyFibre SMB / Home** | CloudWiFi adds managed Wi-Fi layer on top of SkyFibre connection |
| **BizFibreConnect** | CloudWiFi adds managed Wi-Fi layer on top of DFA fibre connection |
| **ParkConnect (DUNE)** | CloudWiFi provides per-tenant Wi-Fi overlay on DUNE backbone |
| **ThinkWiFi** | CloudWiFi guest SSID can be ThinkWiFi-monetised via captive portal |
| **LearnLink (DUNE)** | CloudWiFi provides in-building Wi-Fi on LearnLink campus backbone |
| **EventLink (DUNE)** | CloudWiFi provides exhibitor Wi-Fi on EventLink temporary network |
| **SafeGuard** | CloudWiFi CCTV VLAN integrates with SafeGuard IP camera solution |
| **Managed IT** | CloudWiFi is a natural component of a full managed IT stack |

---

## 16. Document Control

### 16.1 Review & Approval

| Role | Name | Signature | Date |
|:---|:---|:---|:---|
| CEO | | | |
| CTO | | | |
| CFO | | | |
| Head of Product | | | |
| Head of Sales | | | |

### 16.2 Distribution List

| Recipient | Purpose |
|:---|:---|
| Executive Committee | Strategic approval |
| Product Management | Product development and roadmap |
| Sales Leadership | Go-to-market execution |
| Finance | Budget and margin validation |
| Technical Operations | Architecture and deployment planning |
| Marketing | Collateral and campaign development |

### 16.3 Related Documents

| Document | Reference |
|:---|:---|
| CircleTel Complete Product Portfolio v3.0 | CT-PP-2026-003 |
| CircleTel Hardware Cost Register v1.2 | CT-HW-REG-2026-001 |
| ThinkWiFi Product Specification v2.1 | CT-TWF-PS-2026-001 |
| DUNE Solutions Portfolio v1.0 | CT-DUNE-2026-001 |
| SkyFibre SMB Commercial Product Spec v2.0 | CT-SFSMB-CPS-2026-001 |
| CircleTel Brand Guidelines | CT-BRAND-2026-001 |
| MTN Wholesale Direct Services Spec v1.0 | CT-MTN-WHS-2026-001 |

---

*CircleTel — Connecting Today, Creating Tomorrow*

*CloudWiFi™ — Managed Wi-Fi. Zero Hassle.*
