# Echo SP SA (Pty) Ltd — Service Portfolio Breakdown

## Commercial & Technical Specification for Product Management

**Prepared for:** CircleTel SA (Pty) Ltd
**Document Version:** 1.0
**Date:** 21 February 2026
**Classification:** Confidential
**Service Schedule Reference:** SS Q27988

---

## Table of Contents

1. [Entity Overview — Echo SP SA (Pty) Ltd](#1-entity-overview--echo-sp-sa-pty-ltd)
2. [Complete Service Catalogue](#2-complete-service-catalogue)
   - 2.1 [Managed BNG Service (Core Service)](#21-managed-bng-service-core-service)
   - 2.2 [Internet Access / IP Transit](#22-internet-access--ip-transit)
   - 2.3 [CGNAT (Carrier-Grade NAT)](#23-cgnat-carrier-grade-nat)
   - 2.4 [Static IP Addresses](#24-static-ip-addresses)
   - 2.5 [Physical Infrastructure at Teraco](#25-physical-infrastructure-at-teraco)
   - 2.6 [Core Network Management at Teraco](#26-core-network-management-at-teraco)
3. [End-to-End Traffic Flow Architecture](#3-end-to-end-traffic-flow-architecture)
4. [Consolidated Cost Summary for Product Management](#4-consolidated-cost-summary-for-product-management)
5. [Integration Map — CircleTel Products Using Echo SP](#5-integration-map--circletel-products-using-echo-sp)
6. [Risk & Dependency Analysis](#6-risk--dependency-analysis)
7. [Implementation Timeline](#7-implementation-timeline)
8. [Document Version Control](#8-document-version-control)

---

## 1. Entity Overview — Echo SP SA (Pty) Ltd

Echo SP SA (Pty) Ltd is an infrastructure and managed services provider that serves as a strategic partner to CircleTel, providing core network infrastructure, managed BNG services, and IP transit at Teraco Data Environments.

| Parameter | Details |
|---|---|
| **Legal Name** | Echo SP SA (Pty) Ltd |
| **Registration Number** | 2018/103951/07 |
| **VAT Number** | 4920285139 |
| **Registered Address** | 1st Floor, Block B, Monte Circle, 178 Montecasino Blvd, Magaliessig, Sandton, 2191 |
| **Telephone** | +27 (0) 87 310 1700 |
| **Email** | sales@echosp.co.za |
| **Website** | www.echosp.co.za |
| **Service Terms** | https://echosp.net/ZA/page/service-terms-conditions |
| **Service Schedule Ref** | SS Q27988 (06 August 2025) |
| **Relationship Type** | Infrastructure & Managed BNG Provider |

### 1.1 Key Contacts

| Name | Role | Contact |
|---|---|---|
| Aubrey Simmonds | Innovation / Solutions | Aubrey@echosp.co.za / +27 83 660 7579 |
| Herman Brönner | Technical | Herman@Echosp.co.za |
| Neil Dragt | Technical / RADIUS | Neild@echosp.co.za |
| Marthin van Dyk | Technical / Testing | marthin.vandyk@echosp.co.za |
| Refiloe Phalatsi | Project Manager | Refiloe@echosp.co.za |
| Batiisi Mbonelwa | Install Engineer | batiisi.mbonelwa@Echosp.co.za |
| NetOps Team | Operations | NetOps@Echosp.co.za |

---

## 2. Complete Service Catalogue

Echo SP provides CircleTel with six primary service categories. Each service is detailed below with commercial pricing, technical specifications, and product management considerations.

---

### 2.1 Managed BNG Service (Core Service)

The Managed BNG is the foundational service underpinning all CircleTel broadband products. It provides RADIUS proxy services, realm-based subscriber routing, session management, and integration with the Interstellio AAA platform.

#### 2.1.1 Commercial Terms

| Parameter | Value |
|---|---|
| **Service Name** | Managed BNG |
| **Quote Reference** | SS Q27988 |
| **Quote Date** | 06 August 2025 |
| **Initial Period** | 12 months |
| **Setup / Installation Fee** | R0.00 (waived) |
| **Monthly Recurring** | Usage-based (tiered per-user pricing) |
| **Fixed-term Cancellation** | 90 days written notice before expiry of Initial Period |
| **Month-to-month Cancellation** | 30 days written notice |
| **Annual Renewal** | Auto-renews for 12-month periods; 90 days notice required |
| **Early Cancellation Penalty** | Balance of MRCs and NRCs for remaining Contract Term |
| **Pricing Validity** | 3 days from quote date |

#### 2.1.2 Pricing Tiers

| User Count | Price/User/Month (excl VAT) | Example: Monthly Cost |
|---|---|---|
| 0 – 500 users | R 25.40 | 250 users = R6,350 \| 500 users = R12,700 |
| 501 – 750 users | R 22.80 | 750 users = R17,100 |
| 751 – 1,000 users | R 20.20 | 1,000 users = R20,200 |

> ⚠️ **Note:** The Cost Accounting Framework documents an alternative tier structure with slightly different thresholds (1–250 at R28.00, 251–500 at R25.40, 501–1,000 at R22.80, 1,001+ at R20.20). Product management should confirm the operative schedule with Echo SP, as SS Q27988 is the formal contractual reference.

#### 2.1.3 Technical Specification

The Managed BNG service includes the following technical components:

- RADIUS proxy services (realm-based routing to Interstellio AAA)
- Realm: `circletel.co.za` → routed to Interstellio RADIUS servers
- Subscriber session management and accounting
- Reporting and session analytics
- Integration with Interstellio AAA platform for authentication and billing
- Supports both L2TP and PPPoE authentication flows

**RADIUS Proxy Servers:**

| Server | Hostname | IP Address |
|---|---|---|
| Proxy 1 | radius1.sys.echosp.link | 13.247.40.35 |
| Proxy 2 | radius2.sys.echosp.link | 13.244.49.198 |

#### 2.1.4 Product Management Considerations

- **Cost optimisation:** Tiered pricing rewards scale — significant savings above 500 users
- **Volume target:** Push to 501+ users to unlock R22.80 tier (10.2% saving per user)
- This is a **shared cost across ALL CircleTel broadband products** (SkyFibre, HomeFibre, BizFibre, UmojaLink)
- No setup fee — low barrier to launch new products

---

### 2.2 Internet Access / IP Transit

Echo SP provides blended IP transit at Teraco via multiple Tier 1 carriers. This is the internet breakout service for all CircleTel subscriber traffic.

#### 2.2.1 Commercial Pricing

| Parameter | Value |
|---|---|
| **Service** | Internet Access (IP Transit) |
| **Setup Fee** | R0.00 |
| **Monthly Rate** | R7/Mbps committed |
| **Minimum Commit** | 100 Mbps |
| **Minimum Monthly Cost** | R700 (at 100 Mbps) |
| **Billing Model** | Committed rate — pay for reserved capacity |

#### 2.2.2 Scaling Projections

| Commit Level | Monthly Cost | Typical Subscriber Base |
|---|---|---|
| 100 Mbps | R700 | Launch phase (25–50 customers) |
| 200 Mbps | R1,400 | Growth phase (50–100 customers) |
| 500 Mbps | R3,500 | Scale phase (100–300 customers) |
| 1 Gbps | R7,000 | Established (300–750 customers) |
| 5 Gbps | R35,000 | Mature (750–2,000+ customers) |

#### 2.2.3 Technical Architecture

- Blended transit via multiple Tier 1 carriers at Teraco Johannesburg (Isando campus)
- **Primary link:** MTN Business 10 Gbps (via Echo SP)
- **Secondary link:** Liquid Intelligent Technologies 10 Gbps (via Echo SP)
- **Tertiary link:** Vumatel wholesale 5 Gbps (via Echo SP)
- **Total available bandwidth capacity:** 25 Gbps
- BGP routing with automatic failover between carriers
- **AS Number:** AS 327693 (Circle Tel / Echo SP)
- Redundant connectivity to Teraco Cape Town

#### 2.2.4 Product Management Considerations

- R7/Mbps is **highly competitive** vs typical SA transit pricing (R60–R200/Mbps)
- Contention ratio planning is critical: target 30:1 residential, 8:1 business
- Cost scales linearly — negotiate volume discount at higher commits
- This is a **resellable service** to NMS (Network Managed Services) clients at R350/Mbps committed

---

### 2.3 CGNAT (Carrier-Grade NAT)

CGNAT enables multiple subscribers to share public IP addresses, dramatically reducing IP address consumption and cost.

#### 2.3.1 Commercial Pricing

| Service | Setup (NRC) | Monthly (MRC) | Notes |
|---|---|---|---|
| CGNAT 1 Gbps | R2,000 | R1,250 | NAT processing for up to ~500 users |
| CGNAT 10 Gbps | R4,000 | R3,500 | NAT processing for high-volume deployments |

#### 2.3.2 Product Management Considerations

- CGNAT is **default for residential products** (SkyFibre, UmojaLink, HomeFibre basic tiers)
- Saves R50/customer vs providing static IPs
- CGNAT can be **shared across** Business Broadband and SkyFibre products
- Business customers requiring static IP should be upsold to paid add-on (R99/month retail vs R50/month cost)

---

### 2.4 Static IP Addresses

Public IP addresses for business customers requiring inbound connectivity, hosting, VPN endpoints, or other services requiring a fixed address.

#### 2.4.1 Pricing

| IP Product | Setup (NRC) | Monthly (MRC) | Usable IPs | Cost/Usable IP |
|---|---|---|---|---|
| Single Static IP | R0 | R50 | 1 | R50.00 |
| IP Block /29 | R0 | R400 | 6 | R66.67 |
| IP Block /28 | R0 | R800 | 14 | R57.14 |

#### 2.4.2 IP Address Pool Allocation

| Region | IP Range | Usable IPs |
|---|---|---|
| Johannesburg | 100.66.160.0/20 | 4,094 |
| Cape Town | 100.66.176.0/20 | 4,094 |
| **Total Available** | Two /20 blocks | **8,188** |

#### 2.4.3 Product Management Considerations

- **Retail pricing recommendation:** R99/month for single static IP (R49 margin)
- 60–70% of business customers typically require static IPs
- Bundle static IPs into higher business tiers (BizFibre Pro / Enterprise)
- IP blocks for enterprise at premium pricing

---

### 2.5 Physical Infrastructure at Teraco

Echo SP maintains physical infrastructure at Teraco data centres in Johannesburg (JB1 — Isando) and Cape Town (CT1), providing the Layer 2 switching fabric that interconnects CircleTel with MTN BNG infrastructure.

#### 2.5.1 Equipment Deployed

| Location | Owner | Equipment | Model | Function | PPPoE |
|---|---|---|---|---|---|
| JHB (JB1) | MTN | BNG/Router | Huawei NE8000M14 | Session termination, RADIUS client | ✅ Yes |
| CPT (CT1) | MTN | BNG/Switch | Huawei S9312 | Session termination, RADIUS client | ✅ Yes |
| JHB (JB1) | Echo SP | L2 Switch | Arista Networks | VLAN switching, interconnect | ❌ No |
| CPT (CT1) | Echo SP | L2 Switch | Arista Networks | VLAN switching, interconnect | ❌ No |
| Cloud (AWS) | Echo SP | Managed BNG | Echo SP Platform | RADIUS proxy, subscriber mgmt | N/A |
| Cloud | Interstellio | AAA Platform | Interstellio | Authentication, billing | N/A |

#### 2.5.2 Cross-Connect Details

| Parameter | Johannesburg (JB1) | Cape Town (CT1) |
|---|---|---|
| **Service Order** | SO161913 | SO161914 |
| **Echo SP Cabinet** | J_CH1_CAR065 | C_DC3_D02 |
| **MTN Cabinet** | J_CH5_D16 | C_CH4_L04 |
| **Cable Type** | OS2 Singlemode Fibre | OS2 Singlemode Fibre |
| **Connector** | LC/LC | LC/LC |
| **Interface Speed** | 1 Gbps | 1 Gbps |
| **Fibre Length** | 131.3m (OTDR) | 75.9m (OTDR) |
| **Overall Loss** | 0.92 dB @ 1310nm | 0.39 dB @ 1310nm |
| **Installation Date** | 14 August 2025 | 15 August 2025 |
| **Test Status** | ✅ PASS | ✅ PASS |

#### 2.5.3 NNI/ENNI Design

- Single NNI carrying both AAA VLAN and IP Transit (WWW) traffic
- **Critical design note:** Echo SP Arista switches are Layer 2 only — **cannot terminate PPPoE**
- All PPPoE/L2TP session termination occurs on MTN Huawei BNG infrastructure
- BGP sessions terminate on MTN BNG

---

### 2.6 Core Network Management at Teraco

Beyond the direct services to CircleTel, Echo SP manages core network infrastructure at Teraco that CircleTel leverages for its Network Managed Services (NMS) offering to Tier 2/Tier 3 providers.

#### 2.6.1 Managed Core Services (Resale via CircleTel NMS)

| Core Service | Description | Pricing |
|---|---|---|
| Shared Core (Entry) | Multi-tenant BRAS/BNG access, shared IP transit, basic CGNAT | R8,500/mo + R25/subscriber |
| Dedicated Core (Standard) | Dedicated BRAS instance, dedicated IP pool, RADIUS integration | R25,000/mo + R15/subscriber |
| Enterprise Core | Full dedicated infrastructure, custom routing, peering arrangements, full API | R65,000/mo + R10/subscriber |
| IP Transit (Resale) | Blended IP transit via multiple Tier 1 carriers at Teraco | R350/Mbps committed |

#### 2.6.2 Echo SP Infrastructure Capabilities at Teraco

- Cisco ASR 9000 series routers
- Juniper MX series edge routers
- F5 load balancers
- Akamai cache servers (CDN)
- Redundant power (2N+1 configuration)
- Meet-me rooms for carrier interconnections
- 24/7 NOC support
- Direct peering with major ISPs at Teraco Johannesburg
- Carrier-neutral connectivity options

---

## 3. End-to-End Traffic Flow Architecture

Understanding the traffic flow is critical for product management to diagnose service issues, plan capacity, and design new products.

### 3.1 Authentication Flow Sequence

```
End User CPE (PPPoE)
      │
      ▼
MTN Access Network
      │
      ▼
MTN BNG (Huawei NE8000M14 / S9312)  ──── RADIUS ────►  Echo SP RADIUS Proxy
      │                                                        │
      │                                                        ▼
      │                                                  Interstellio RADIUS
      │                                                  (circletel.co.za)
      │                                                        │
      │                                               Auth Response
      │                                                        │
      ▼                                                        ▼
Session Established ◄──────────────────────────── CircleTel Subscriber DB
      │
      ▼
Traffic via ENNI ──► Echo SP Arista L2 Switch ──► Internet (IP Transit)
```

| Step | Action | System |
|---|---|---|
| 1 | End-user CPE initiates PPPoE session | Customer Router |
| 2 | MTN Access Network delivers PPPoE to regional BNG | MTN Network |
| 3 | MTN BNG terminates PPPoE/L2TP session | Huawei NE8000M14 (JHB) / S9312 (CPT) |
| 4 | BNG sends RADIUS authentication request to Echo SP proxy | MTN BNG → Echo SP |
| 5 | Echo SP proxies RADIUS to Interstellio (circletel.co.za realm) | Echo SP RADIUS Proxy |
| 6 | Interstellio authenticates subscriber and returns attributes | Interstellio AAA |
| 7 | BNG establishes session with assigned IP from CircleTel pool | MTN BNG |
| 8 | User traffic routed via ENNI through Echo SP Arista infrastructure | Echo SP L2 Switch |
| 9 | BGP sessions on BNG announce CircleTel prefixes | MTN BNG / Echo SP |

### 3.2 RADIUS Configuration Summary

| Parameter | Value |
|---|---|
| **Interstellio RADIUS Server 1** | 102.220.62.161 |
| **Interstellio RADIUS Server 2** | 102.220.62.162 |
| **Interstellio RADIUS Server 3** | 102.220.62.163 |
| **Authentication Port** | 1812 (UDP) |
| **Accounting Port** | 1813 (UDP) |
| **POD Port (Disconnect)** | 3799 (UDP) |
| **Realm** | circletel.co.za |
| **Accounting Interval** | 10 minutes (RFC2869) |
| **Message-Authenticator** | Enabled for access-reply packets |

---

## 4. Consolidated Cost Summary for Product Management

This section provides a unified view of all Echo SP costs for financial modelling and product pricing.

### 4.1 Fixed Monthly Infrastructure Costs

| Service | Monthly Cost | Notes |
|---|---|---|
| Internet Access (200 Mbps commit) | R1,400 | R7/Mbps × 200 Mbps |
| CGNAT (1 Gbps) | R1,250 | Shared across all products |
| **Subtotal (Fixed Infrastructure)** | **R2,650** | Before per-user costs |

### 4.2 Variable Per-User Costs

| Service | Cost/User/Month | Notes |
|---|---|---|
| Managed BNG (0–500 users) | R25.40 | Primary cost driver |
| Static IP (if applicable) | R50.00 | Only for business customers |
| **Total per user (CGNAT)** | **R25.40** | Residential default |
| **Total per user (Static IP)** | **R75.40** | Business with static IP |

### 4.3 Cost Per Customer at Scale

| Scale | Monthly Infrastructure | Per Customer (CGNAT) | Per Customer (+ Static IP) |
|---|---|---|---|
| 25 customers | R4,648 | R185.92 | R235.92 |
| 50 customers | R5,548 | R110.96 | R160.96 |
| 100 customers | R7,184 | R71.84 | R121.84 |
| 250 customers | R11,185 | R44.74 | R94.74 |
| 500 customers | R18,780 | R37.56 | R87.56 |

### 4.4 Key Financial Metrics

- **Break-even point:** 35 customers
- **Profitable operation:** 50+ customers
- **Optimal efficiency:** 250+ customers (Echo BNG tier benefits kick in)
- All products maintain **28%+ margins** at 100 customers
- Target **32%+ margins** at 250+ customers

---

## 5. Integration Map — CircleTel Products Using Echo SP

Every CircleTel broadband product relies on Echo SP infrastructure. This mapping is essential for product management to understand dependencies.

| CircleTel Product | Echo SP Services Used | Access Technology |
|---|---|---|
| SkyFibre (Residential) | BNG, IP Transit, CGNAT | MTN Tarana G1 FWB |
| HomeFibre Connect | BNG, IP Transit, CGNAT, Static IP (optional) | MTN FTTH Wholesale |
| BizFibre Connect | BNG, IP Transit, Static IP, CGNAT | DFA Business Broadband |
| SkyFibre SMB | BNG, IP Transit, Static IP | MTN Tarana G1 FWB |
| UmojaLink (Township) | BNG, IP Transit, CGNAT | Tarana G1 + MTN Backhaul |
| ParkConnect | BNG, IP Transit, Static IP | Peraso DUNE 60 GHz |
| AirLink FWA | BNG, IP Transit, CGNAT | Reyee EST450G 5 GHz |
| NMS (Tier 2/3 resale) | Managed Core, IP Transit resale | Various (client networks) |

---

## 6. Risk & Dependency Analysis

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Echo SP service outage | Low | Critical | Redundant RADIUS proxies, dual Teraco sites (JB1 + CT1) |
| Price increases | Medium | Medium | Lock in long-term contract, negotiate volume discounts |
| Capacity constraints | Low | High | Monitor NNI utilisation, pre-order upgrades at 70% capacity |
| Single-vendor dependency | Medium | High | Document migration path; maintain Interstellio AAA independence |
| CGNAT complaints (gaming, VoIP) | Medium | Low | Offer static IP add-on; educate support team |
| Cross-connect failure | Very Low | Critical | Dual cross-connects per site; OTDR tested at install |

---

## 7. Implementation Timeline

Key milestones from the Echo SP integration project:

| Date | Milestone |
|---|---|
| 28 July 2025 | Technical discussion initiated |
| 29 July 2025 | Architecture confirmed (PPPoE on MTN BNG, L2 at Echo SP Arista) |
| 06 August 2025 | Echo SP Managed BNG Service Schedule issued (SS Q27988) |
| 13 August 2025 | Cross-connect orders placed with Teraco |
| 14 August 2025 | JB1 cross-connect installed and tested (SO161913) |
| 15 August 2025 | CT1 cross-connect installed and tested (SO161914) |
| **18 August 2025** | **RFS Date (Ready for Service)** |
| 03 September 2025 | Layer 2 link testing successful |
| 04 September 2025 | CPT LNS connection confirmed |
| 11 September 2025 | RADIUS proxy configuration completed |
| 12 September 2025 | Layer 3 testing and commissioning |

---

## 8. Document Version Control

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 21 February 2026 | CircleTel Product Management | Initial comprehensive breakdown from project knowledge base |

### Source Documents

- CircleTel BNG & ENNI Technical Architecture v1.1 (December 2025)
- CircleTel Cost Accounting Framework — Complete Cost Elements Documentation
- CircleTel Revised Strategy 2026–2027 v3.0
- CircleTel Business Connect Portfolio — DFA Business Broadband Product Line
- UmojaLink Township Connectivity Portfolio — Technical & Network Architecture Update
- SkyFibre Fair Usage & Acceptable Usage Policy Framework v1.0
- Echo SP Managed BNG Service Schedule SS Q27988 (06 August 2025)

---

*Confidential — CircleTel SA (Pty) Ltd*
