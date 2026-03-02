# Wholesale Costs & Vendor Relationships

CircleTel's wholesale partner costs and relationships. Use this when calculating margins or designing new products.

---

## Wholesale Partners Overview

| Partner | Role | Services | Contract Type |
|---------|------|----------|---------------|
| **MTN Wholesale (Direct)** | Access provider | Tarana FWB, FTTH | 24-month MSC |
| **MTN Business (via Arlan)** | Reseller channel | LTE, 5G, capped broadband | Commission-based |
| **DFA** | Fibre infrastructure | Business Broadband (FTTB), Magellan backhaul | Per-subscriber |
| **Echo SP** | Core network | Managed BNG, Arista switching, RADIUS proxy | Tiered pricing |
| **Interstellio** | AAA platform | RADIUS authentication, subscriber management | Per-subscriber |
| **AgilityGIS** | BSS | Billing, provisioning | Monthly licence |
| **United Wireless** | NOC services | Network monitoring, Tarana monitoring | Service agreement |
| **Peraso** | Hardware vendor | DUNE 60GHz equipment | Equipment purchase |

---

## Echo SP BNG Pricing

Managed BNG service with tiered pricing based on subscriber volume.
**Source:** Echo SP Commercial Offer SS Q27988 (August 2025)

| Tier | Subscriber Range | Per-Subscriber MRC |
|------|------------------|-------------------|
| Tier 1 | 0–500 | R25.40 |
| Tier 2 | 501–750 | R22.80 |
| Tier 3 | 751–1,000 | R20.20 |

**Volume benefit:** 20% cost reduction from Tier 1 to Tier 3

### Echo SP Full Service Pricing

| Service | NRC | MRC | Notes |
|---------|-----|-----|-------|
| IP Transit | R0 | R7/Mbps | Min 100 Mbps = R700/mo |
| CGNAT 1 Gbps | R2,000 | R1,250 | NAT processing |
| CGNAT 10 Gbps | R4,000 | R3,500 | For scale |
| Static IP | R0 | R50/IP | Per address |
| IP Block /30 | R0 | R100 | 2 usable IPs |
| IP Block /29 | R0 | R400 | 6 usable IPs |
| IP Block /28 | R0 | R800 | 14 usable IPs |

### Echo SP Infrastructure

- **Switches:** Arista L2 (VLAN switching only, cannot terminate PPPoE)
- **BNG:** PPPoE terminates on MTN Huawei NE8000M14 (JHB) / S9312 (CPT)
- **RADIUS:** Echo SP proxy → Interstellio (circletel.co.za realm)
- **IP Allocation:** 100.66.160.0/20 (JHB), 100.66.176.0/20 (CPT)
- **SLA:** 99.9% network availability, P1 response 15 min

---

## Cost of Sale Floor Breakdown

Monthly per-user costs at scale (Tier 4 volume):

| Component | Vendor | Monthly Cost | Notes |
|-----------|--------|--------------|-------|
| BNG Service | Echo SP | R20.20 | Tier 4 rate (>1k users) |
| IP Transit | Echo SP/DFA | R28.00 | ~4 Mbps avg usage @ R7/Mbps |
| DFA Backhaul (per user) | DFA Magellan | R86.27 | R12,940 ÷ 150 users |
| Support | Internal | R30.00 | Level 1 support allocation |
| Billing/Admin | AgilityGIS | R10.96 | BSS stack cost |
| **Total Monthly COS Floor** | | **R175.43** | **Excludes tower/access costs** |

### COS at Different Scales

| Scale | BNG Cost | Total COS | Notes |
|-------|----------|-----------|-------|
| 100 users | R30.30 | R185.53 | Tier 1 |
| 300 users | R26.93 | R182.16 | Tier 2 |
| 750 users | R23.57 | R178.80 | Tier 3 |
| 1,500 users | R20.20 | R175.43 | Tier 4 |

---

## Access Technology Costs

### MTN Tarana G1 FWA (SkyFibre SMB)

| Component | Cost Type | Amount | Notes |
|-----------|-----------|--------|-------|
| Access fee | Monthly | Included in COS | Per MTN wholesale agreement |
| CPE (Tarana ODU) | One-time | ~R3,000 | Customer or CircleTel funded |
| Installation | One-time | R1,500 cost | Charge R2,500-3,500 |

### DFA Business Broadband (BizFibreConnect)

**Source:** DFA Commercial Schedules v1.0, BizFibreConnect v2.0

| Speed | Installation (NRC) | Monthly (MRC) | Term |
|-------|-------------------|---------------|------|
| 10 Mbps | R1,650 | R999 | 24 months |
| 25 Mbps | R1,650 | R999 | 24 months |
| 50 Mbps | R1,650 | R1,422 | 24 months |
| 100 Mbps | R1,650 | R1,731 | 24 months |
| 200 Mbps | R1,650 | R2,875 | 24 months |

**GNNI Port (Required):**
| Port | NRC | MRC |
|------|-----|-----|
| 1 Gbps | R6,050 | R898 |
| 10 Gbps | R6,050 | R3,300 |

**Infrastructure Cost per Customer (@ 100 scale):**
- GNNI (1Gbps shared): R8.98
- Echo Internet (200Mbps): R14.00
- Echo BNG (Tier 1): R25.40
- CGNAT (shared): R12.50
- AgilityGIS: R10.96
- **Total Infrastructure:** R121.84/customer

### MTN LTE/5G (CircleConnect via Arlan)

**Source:** Arlan Commission Analysis v1.0 (January 2026)

| Component | Cost Type | Amount | Notes |
|-----------|-----------|--------|-------|
| Data packages | Monthly | Package-dependent | Via Arlan reseller |
| Router/MiFi | One-time | R500-2,000 | Varies by device |
| SIM | One-time | Included | |

### Arlan MTN Commission Structure ⚠️ KEY REVENUE OPPORTUNITY

CircleTel receives 30% of MTN commissions + **100% of any markup**.

| Monthly Subscription | MTN Rate | CircleTel 30% | With 10% Markup |
|---------------------|----------|---------------|-----------------|
| R0–R99 | 4.75% | 1.425% | +852% revenue |
| R100–R199 | 5.75% | 1.725% | +581% revenue |
| R200–R299 | 7.25% | 2.175% | +458% revenue |
| R300–R499 | 8.75% | 2.625% | +381% revenue |
| R500–R999 | 9.75% | 2.925% | +342% revenue |
| R1,000–R1,999 | 11.75% | 3.525% | +284% revenue |
| R2,000+ | 13.75% | 4.125% | +242% revenue |

**Recommended Markups:**
| Category | Markup | Rationale |
|----------|--------|-----------|
| IoT/M2M SIMs | 15–25% | Price-insensitive B2B market |
| Fleet Management | 15–20% | Value-added bundling |
| LTE/5G Routers | 10–15% | Bundle with CircleConnect |
| SMB Voice | 10–15% | Bundle with SkyFibre |
| Enterprise | 3–8% | Relationship-based |

**Lifetime Commission:** Renewals continue indefinitely (Clause 3.1)
**Customer Protection:** 24-month non-circumvention clause

### Peraso 60GHz (ParkConnect DUNE)

| Component | Cost Type | Amount | Notes |
|-----------|-----------|--------|-------|
| Base station | One-time | ~R50,000 | Per park |
| CPE unit | One-time | ~R5,000 | Per tenant |
| Backhaul | Monthly | Shared cost | Fibre or FWA to park |

### Reyee 5GHz (AirLink FWA)

| Component | Cost Type | Amount | Notes |
|-----------|-----------|--------|-------|
| Access point | One-time | ~R3,000 | Per tower/site |
| CPE | One-time | ~R1,500 | Per customer |
| Tower/site | Monthly | Variable | Lease or owned |

---

## Network Core Costs

### Data Centre (Teraco)

| Location | Role | Monthly Cost |
|----------|------|--------------|
| Teraco JB1 (Johannesburg) | Primary | Per rack/power |
| Teraco CT1 (Cape Town) | Secondary | Per rack/power |

### IP Transit

| Provider | Rate | Notes |
|----------|------|-------|
| Echo SP | ~R7/Mbps | Committed bandwidth |
| DFA Magellan | Part of backhaul | Included in DFA backhaul |

### Backhaul

| Route | Monthly Cost | Notes |
|-------|--------------|-------|
| DFA Magellan (aggregate) | R12,940 | Shared across ~150 users = R86.27/user |

---

## BSS/OSS Stack Costs

| System | Vendor | Monthly Cost | Notes |
|--------|--------|--------------|-------|
| Billing | AgilityGIS | ~R10.96/user | BSS stack |
| RADIUS/AAA | Interstellio | Per-subscriber | circletel.co.za realm |
| NOC | United Wireless | Service agreement | Outsourced monitoring |
| RMM/PSA | SuperOps.ai | Per-technician | Managed IT services |

---

## Volume Discount Opportunities

### Echo SP
- Scale from Tier 1 (R30.30) to Tier 4 (R20.20) = 33% savings
- Target: 1,000+ subscribers to reach Tier 4

### DFA
- Volume discounts available on backhaul
- Negotiate at 200+ subscriber threshold

### MTN
- MSC (minimum service commitment) drives pricing
- Volume = better unit rates

---

## Contract Obligations

### MTN Wholesale
- **Term:** 24-month MSC
- **Commitment:** Minimum subscriber volumes
- **Penalties:** Below MSC = fees apply

### DFA
- **Term:** Per-subscriber, typically 24 months
- **Commitment:** Per-site installation
- **Exit:** Subject to contract terms

### Echo SP
- **Term:** Ongoing with volume tiers
- **Scaling:** Automatic tier progression
- **SLA:** Managed BNG uptime guarantees

---

## NameHero CloudShield VPS (CircleCloud Hosting)

**Partner:** NameHero Inc. (USA)
**Source:** CircleCloud_Hosting_Commercial_Product_Spec_v1_0.md

### VPS Tiers

| Plan | CPU | RAM | Storage | Bandwidth | USD/mo | ZAR/mo |
|------|-----|-----|---------|-----------|--------|--------|
| Starter CloudShield | 2 AMD cores | 4 GB | 150 GB NVMe | 2 TB/mo | $23.70 | R439 |
| Plus CloudShield | 6 AMD cores | 8 GB | 250 GB NVMe | 3 TB/mo | $32.43 | R600 |
| **Turbo CloudShield** | 8 AMD cores | 16 GB | 450 GB NVMe | 2 TB/mo | $40.23 | **R744** |
| Business CloudShield | 10 AMD cores | 32 GB | 500 GB NVMe | 2 TB/mo | $49.03 | R907 |

**Included FREE (all plans):**
- Imunify360 Security
- CloudLinux OS
- LiteSpeed Webserver
- cPanel Control Panel (Solo = 1 account)
- Website Migrations
- SSL Certificates
- 30-Day Money-Back

**WHMCS:** FREE on Plus and above (while subscription active)

### cPanel License Costs (2026 Pricing)

| License Tier | Accounts | USD/mo | ZAR/mo |
|--------------|----------|--------|--------|
| Solo (included) | 1 | $0 | R0 |
| Admin | 5 | $35.95 | R665 |
| **Pro** | 30 | $53.95 | **R998** |
| Premier | 100 | $69.95 | R1,294 |
| 150 accounts | 150 | $94.45 | R1,747 |

### CircleCloud COS Breakdown (30-Account Scale)

| Component | Monthly (ZAR) |
|-----------|---------------|
| NameHero Turbo VPS | R744 |
| cPanel Pro License | R998 |
| Support Allocation | R500 |
| Billing (AgilityGIS) | R150 |
| **Total Infrastructure** | **R2,392** |
| **COS per Account** | **R80** |

**Break-even:** 6 accounts at R450 avg revenue
**Margin at scale:** 60-96% depending on tier

---

## Hardware Costs Summary

| Equipment | Typical Cost | Funded By | Amortization |
|-----------|--------------|-----------|--------------|
| Tarana ODU | R3,000 | CircleTel or Customer | 24 months |
| DFA NTU | R2,500 | Usually Customer | N/A |
| LTE Router | R500-2,000 | Customer | N/A |
| DUNE CPE | R5,000 | CircleTel | 24 months |
| DUNE Base Station | R50,000 | CircleTel | 36-48 months |
| Reyee AP | R3,000 | CircleTel | 36 months |
| Reyee CPE | R1,500 | CircleTel | 24 months |

---

## Margin Impact Calculator

```
Monthly Revenue: R[X]
Access Cost: R[Y]
COS Floor: R175.43
Total COS: R[Y] + R175.43 = R[Z]

Gross Margin: (R[X] - R[Z]) / R[X] × 100

Example (SkyFibre SMB 50):
Revenue: R1,899
Access Cost: ~R0 (included in COS)
Total COS: R175.43
Gross Margin: (R1,899 - R175.43) / R1,899 = 90.8%
```

---

## Key Constraints

### Technical
- **PPPoE termination:** Occurs on MTN Huawei BNG, not Echo SP
- **BGP sessions:** Terminate on MTN BNG
- **Tarana asymmetry:** 4:1 download-to-upload ratio (MTN-set)
- **DUNE LoS:** Line-of-sight required, <500m optimal

### Commercial
- **MSC obligations:** MTN minimum commitments
- **Volume requirements:** Need scale to reach better pricing tiers
- **Lead times:** Fibre installations can take 2-4 weeks

---

**Version:** 1.0.0
**Last Updated:** 2026-03-01
**Source:** products/solution-design.md Section 3
