# Echo SP SA (Pty) Ltd — Commercial Schedule for CircleTel

**Document Version:** 1.0  
**Date:** 02 February 2026  
**Classification:** Commercial / Confidential  
**Locale:** en-ZA (South African English)  
**Service Schedule Reference:** SS Q27988  
**Quote Date:** 06 August 2025

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Contracting Parties](#2-contracting-parties)
3. [Managed BNG Service](#3-managed-bng-service)
4. [IP Transit & Internet Services](#4-ip-transit--internet-services)
5. [Managed Core Services](#5-managed-core-services)
6. [Contract Terms & Conditions](#6-contract-terms--conditions)
7. [Service Level Agreements](#7-service-level-agreements)
8. [Key Contacts](#8-key-contacts)
9. [Document References](#9-document-references)
10. [Revision History](#10-revision-history)

---

## 1. Executive Summary

This document outlines the complete commercial schedule between Echo SP SA (Pty) Ltd and Circle Tel SA (Pty) Ltd for the provision of managed network services. Echo SP provides critical infrastructure services that enable CircleTel to deliver wholesale broadband services to end customers.

The commercial relationship encompasses three primary service categories:

1. **Managed BNG (Broadband Network Gateway) Service** — Subscriber session management and RADIUS proxy services with tiered pricing based on user volumes
2. **IP Transit Services** — Blended internet connectivity via Tier 1 carriers at Teraco data centres
3. **Managed Core Services** — Carrier-grade network infrastructure for smaller ISPs and service providers

Echo SP operates infrastructure at Teraco data centres in Johannesburg (JB1) and Cape Town (CT1), providing CircleTel with enterprise-grade connectivity and network services without requiring significant capital expenditure.

### Key Commercial Highlights

| Aspect | Details |
|--------|---------|
| **Service Commencement (RFS)** | 18 August 2025 |
| **Initial Contract Period** | 12 months |
| **Setup/Installation Fee** | R0.00 (waived) |
| **Pricing Model** | Usage-based with volume discounts |
| **Infrastructure Location** | Teraco JB1 (Johannesburg) & CT1 (Cape Town) |

---

## 2. Contracting Parties

### 2.1 Service Provider

| Field | Details |
|-------|---------|
| **Legal Name** | Echo SP SA (Pty) Ltd |
| **Trading As** | Echo SP |
| **Role** | Managed Network Services Provider |
| **Primary Infrastructure** | Teraco Data Centres (JB1, CT1) |
| **Service Terms URL** | https://echosp.net/ZA/page/service-terms-conditions |

### 2.2 Customer

| Field | Details |
|-------|---------|
| **Legal Name** | Circle Tel SA (Pty) Ltd |
| **Trading As** | CircleTel |
| **Role** | Licensed Telecommunications Operator |
| **AS Number** | AS 327693 (shared with Echo SP) |

---

## 3. Managed BNG Service

### 3.1 Service Overview

The Managed BNG Service provides CircleTel with comprehensive subscriber session management capabilities without requiring investment in dedicated BNG hardware. This service is fundamental to CircleTel's ability to deliver PPPoE-based broadband services via the MTN wholesale network.

#### Service Description

| Parameter | Value |
|-----------|-------|
| **Service Name** | Managed BNG |
| **Service Schedule Reference** | SS Q27988 |
| **Quote Date** | 06 August 2025 |
| **Initial Period** | 12 months |
| **Setup/Installation Fee** | R0.00 (waived) |
| **Monthly Recurring Charges** | Usage-based (see pricing tiers below) |
| **Billing Frequency** | Monthly in arrears |

### 3.2 Pricing Structure

Echo SP employs a tiered pricing model that rewards subscriber growth with reduced per-user costs. All prices are quoted excluding VAT.

#### Per-User Monthly Pricing Tiers

| User Count Range | Price per User per Month (excl. VAT) | Effective Discount |
|------------------|--------------------------------------|-------------------|
| 0 – 500 users | R25.40 | Base rate |
| 501 – 750 users | R22.80 | 10.2% discount |
| 751 – 1 000 users | R20.20 | 20.5% discount |

#### Detailed Cost Calculations by Subscriber Volume

The following table illustrates the total monthly cost at various subscriber levels:

| Subscriber Count | Applicable Tier | Per-User Rate | Monthly Cost (excl. VAT) | Cost per User (effective) |
|------------------|-----------------|---------------|--------------------------|---------------------------|
| 100 users | 0–500 | R25.40 | R2 540.00 | R25.40 |
| 250 users | 0–500 | R25.40 | R6 350.00 | R25.40 |
| 500 users | 0–500 | R25.40 | R12 700.00 | R25.40 |
| 600 users | 501–750 | R22.80 | R13 680.00 | R22.80 |
| 750 users | 501–750 | R22.80 | R17 100.00 | R22.80 |
| 850 users | 751–1 000 | R20.20 | R17 170.00 | R20.20 |
| 1 000 users | 751–1 000 | R20.20 | R20 200.00 | R20.20 |

**Note:** Pricing for subscriber counts exceeding 1 000 users is subject to separate negotiation with Echo SP.

### 3.3 Service Inclusions

The Managed BNG Service includes the following components at no additional charge:

| Component | Description |
|-----------|-------------|
| **RADIUS Proxy Services** | Proxying of authentication requests from MTN BNG to Interstellio AAA platform |
| **Realm-Based Routing** | Configuration for circletel.co.za realm |
| **AAA Platform Integration** | Full integration with Interstellio for subscriber authentication, authorisation, and accounting |
| **Subscriber Session Management** | Real-time session tracking, CoA (Change of Authorisation), and POD (Packet of Disconnect) support |
| **Accounting & Reporting** | Usage data collection and reporting for billing purposes |
| **Technical Support** | Access to Echo SP technical team during business hours |

### 3.4 Technical Architecture

The Managed BNG Service integrates with the broader MTN–Echo SP–Interstellio architecture as follows:

| Component | Owner | Function |
|-----------|-------|----------|
| **BNG/Router (JHB)** | MTN | Huawei NE8000M14 — PPPoE session termination |
| **BNG/Switch (CPT)** | MTN | Huawei S9312 — PPPoE session termination |
| **L2 Switches** | Echo SP | Arista switches — VLAN switching and interconnect |
| **Managed BNG Platform** | Echo SP | RADIUS proxy and subscriber management |
| **AAA Platform** | Interstellio | Authentication, authorisation, accounting, and billing |

---

## 4. IP Transit & Internet Services

### 4.1 Blended IP Transit

Echo SP provides blended IP transit services via multiple Tier 1 carriers at Teraco data centres, ensuring high-quality, resilient internet connectivity for CircleTel's subscriber base.

| Service | Pricing | Notes |
|---------|---------|-------|
| **Blended IP Transit** | R350 per Mbps committed | Via multiple Tier 1 carriers at Teraco |
| **Internet Commit Rate** (alternative) | R7 per Mbps committed | Competitive bulk rate |

### 4.2 Bandwidth Commitment Guidelines

| Subscriber Volume | Recommended Commit | Estimated Monthly Cost |
|-------------------|-------------------|----------------------|
| 100 users | 100 Mbps | R700 (at R7/Mbps) |
| 250 users | 200 Mbps | R1 400 |
| 500 users | 400 Mbps | R2 800 |
| 1 000 users | 750 Mbps | R5 250 |

**Note:** Actual bandwidth requirements depend on subscriber product mix, contention ratios, and usage patterns.

---

## 5. Managed Core Services

Echo SP offers additional managed core services that enable smaller providers to access carrier-grade infrastructure without significant capital expenditure.

### 5.1 Core Service Tiers

| Service Tier | Description | Monthly Fee | Per-Subscriber Fee |
|--------------|-------------|-------------|-------------------|
| **Shared Core (Entry)** | Multi-tenant BRAS/BNG access, shared IP transit, basic CGNAT | R8 500/month | R25/subscriber |
| **Dedicated Core (Standard)** | Dedicated BRAS instance, dedicated IP pool, RADIUS integration | R25 000/month | R15/subscriber |
| **Enterprise Core** | Full dedicated infrastructure, custom routing, peering arrangements, full API access | R65 000/month | R10/subscriber |

### 5.2 Supplementary Services

| Service | Description | Pricing |
|---------|-------------|---------|
| **IP Transit** | Blended IP transit via multiple Tier 1 carriers at Teraco | R350/Mbps committed |
| **CGNAT Services** | Carrier-grade NAT for IPv4 address conservation | Included in core tiers |
| **BGP Peering** | Custom peering arrangements | Enterprise tier only |

---

## 6. Contract Terms & Conditions

### 6.1 Contract Duration & Renewal

| Term Type | Duration | Notice Period | Renewal Terms |
|-----------|----------|---------------|---------------|
| **Initial Period** | 12 months | 90 days written notice before expiry | Auto-renews for successive 12-month periods |
| **Annual Recurring** | 12 months | 90 days written notice | Auto-renews for 12-month periods |
| **Month-to-Month** | 1 month | 30 days written notice | Continues until terminated |

### 6.2 Termination Provisions

| Scenario | Consequence |
|----------|-------------|
| **Early Cancellation** | Subject to payment of balance of MRCs and NRCs for remaining Contract Term |
| **Termination for Cause** | Per service terms and conditions |
| **Non-Renewal** | Written notice required per notice periods above |

### 6.3 Commercial Terms

| Term | Details |
|------|---------|
| **Pricing Validity** | 3 days from quote date |
| **Payment Terms** | Monthly in advance (assumed standard) |
| **Currency** | South African Rand (ZAR) |
| **VAT** | All prices exclude VAT (15%) |
| **Price Escalation** | Subject to annual review |

### 6.4 Service Terms Reference

Full service terms and conditions are available at:  
**https://echosp.net/ZA/page/service-terms-conditions**

---

## 7. Service Level Agreements

### 7.1 Availability Targets

| Metric | Target | Measurement Period |
|--------|--------|-------------------|
| **Network Availability** | 99.95% | Monthly |
| **BNG Platform Availability** | 99.9% | Monthly |
| **RADIUS Response Time** | < 100ms | Per request |

### 7.2 Support Response Times

| Severity | Description | Initial Response | Resolution Target |
|----------|-------------|-----------------|-------------------|
| **Critical** | Service outage affecting all subscribers | 15 minutes | 4 hours |
| **High** | Partial service degradation | 30 minutes | 8 hours |
| **Medium** | Non-critical functionality affected | 4 hours | 24 hours |
| **Low** | General enquiries and requests | 8 hours | 72 hours |

---

## 8. Key Contacts

### 8.1 Echo SP SA (Pty) Ltd

| Name | Role | Email | Mobile |
|------|------|-------|--------|
| **Aubrey Simmonds** | Innovation / Solutions | Aubrey@echosp.co.za | +27 83 660 7579 |
| **Herman Brönner** | Technical | Herman@Echosp.co.za | — |
| **Neil Dragt** | Technical / RADIUS | Neild@echosp.co.za | — |
| **Marthin van Dyk** | Technical / Testing | marthin.vandyk@echosp.co.za | — |
| **Refiloe Phalatsi** | Project Manager | Refiloe@echosp.co.za | — |
| **Batiisi Mbonelwa** | Install Engineer | batiisi.mbonelwa@Echosp.co.za | — |
| **NetOps Team** | Operations | netops@echosp.co.za | — |

### 8.2 Escalation Matrix

| Level | Contact | Scope |
|-------|---------|-------|
| **Level 1** | NetOps Team | Operational issues, routine support |
| **Level 2** | Neil Dragt / Herman Brönner | Technical escalations |
| **Level 3** | Aubrey Simmonds | Commercial and strategic escalations |

---

## 9. Document References

| Document | Description |
|----------|-------------|
| **Annexure_1_New_MSA_Service_Schedule_for_Circle_Tel_06-08-2025.pdf** | Echo SP Managed BNG Service Schedule |
| **CircleTel_BNG_ENNI_Technical_Architecture_v1.1.md** | Technical architecture and configuration documentation |
| **CircleTel_Revised_Strategy_2026-2027_v3_0.docx** | CircleTel strategic plan including Echo SP partnership |

---

## 10. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 02 February 2026 | CircleTel | Initial document — compiled from project knowledge including BNG Technical Architecture v1.1 and Strategy documents |

---

## Appendix A: Cost Modelling Scenarios

### A.1 Small ISP Deployment (250 subscribers)

| Cost Element | Monthly Cost (excl. VAT) |
|--------------|--------------------------|
| Managed BNG (250 × R25.40) | R6 350.00 |
| IP Transit (200 Mbps × R7) | R1 400.00 |
| **Total Monthly Cost** | **R7 750.00** |
| **Cost per Subscriber** | **R31.00** |

### A.2 Medium ISP Deployment (750 subscribers)

| Cost Element | Monthly Cost (excl. VAT) |
|--------------|--------------------------|
| Managed BNG (750 × R22.80) | R17 100.00 |
| IP Transit (500 Mbps × R7) | R3 500.00 |
| **Total Monthly Cost** | **R20 600.00** |
| **Cost per Subscriber** | **R27.47** |

### A.3 Growth Deployment (1 000 subscribers)

| Cost Element | Monthly Cost (excl. VAT) |
|--------------|--------------------------|
| Managed BNG (1 000 × R20.20) | R20 200.00 |
| IP Transit (750 Mbps × R7) | R5 250.00 |
| **Total Monthly Cost** | **R25 450.00** |
| **Cost per Subscriber** | **R25.45** |

---

## Appendix B: Strategic Advantages

### B.1 Echo SP Partnership Benefits

1. **Lower Infrastructure Burden** — Echo's actual costs are more favourable than building own infrastructure
2. **Volume Incentives** — Tiered BNG pricing rewards subscriber growth with automatic discounts
3. **Operational Simplicity** — Managed services reduce need for in-house technical resources
4. **Scalability** — Can start smaller and grow margins with volume
5. **Carrier-Grade Infrastructure** — Access to Teraco data centre facilities and Tier 1 carrier peering

### B.2 Cost Optimisation Opportunities

| Opportunity | Potential Saving |
|-------------|------------------|
| Volume commitments at subscriber milestones | 10–20% on BNG costs |
| Bundled services negotiation | Potential discounts |
| Shared CGNAT with other CircleTel products | Infrastructure efficiency |
| Long-term contract commitment | Enhanced pricing terms |

---

**— End of Document —**

*This document was compiled from CircleTel project knowledge and represents the commercial terms as at the document date. For the most current pricing and terms, please contact Echo SP directly.*
