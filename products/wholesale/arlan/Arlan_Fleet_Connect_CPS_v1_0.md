# Commercial Product Specification: Fleet Connect

**Document ID**: CT-CPS-ARLAN-FC-2026-001
**Version**: 1.0
**Status**: ACTIVE
**Effective Date**: April 2026
**Author**: Jeffrey (MD)
**Entity**: CircleTel (Pty) Ltd — A member of the New Generation Group
**Supply Channel**: Arlan Communications (Pty) Ltd T/A MTN Ballito (Reseller Agreement)

> **Pricing Notice**: IoT/M2M SIM pricing is drawn from the March 2026 Helios & iLula promo sheet
> (`Helios and iLula Business Promos - March 2026.xlsx`). Refresh specific per-SIM prices against
> the current Arlan promo sheet before issuing any customer quote. Bundle logic and product
> architecture in this document remain valid regardless of promo refresh.

---

## 1. Executive Summary

Fleet Connect is CircleTel's Phase 3 product offering targeting the South African logistics,
delivery, and field services market. It is a zero-CAPEX IoT/M2M SIM bundle sold via the Arlan
reseller channel, composed of multiple Business Access Mobile (Chip SIM) units for vehicle
trackers and sensors, combined with a supervisory data SIM for the fleet manager.

**Strategic position in the Arlan portfolio:**
Fleet Connect enters sales in Phase 3 (September–November 2026), following the cashflow
foundation built by Business Mobility Starter (Phase 1) and Connected Office / WorkConnect+Mobile
(Phase 2). It is the highest-SIM-count product in the Arlan line, and therefore offers the
highest markup leverage: revenue scales linearly with SIM count rather than requiring additional
customer acquisitions.

**Why this product now:**
- South African SME logistics companies (5–50 vehicles) are underserved by direct MTN Business
  offerings, which require a minimum spend threshold and a dedicated account manager
- CircleTel handles the Arlan relationship, providing a single account, single invoice, and
  direct WhatsApp support — advantages the MTN Business portal does not offer
- No physical installation is required: SIM cards are couriered and activated remotely, keeping
  margin per deal high from day one

**Month 5 target**: 3 fleet deals per month across Starter, Mid, and Large fleet sizes.

---

## 2. Product Architecture

Fleet Connect is structured in three fleet-size tiers. All tiers share the same SIM type
(Chip SIM CONSMD64K on the Business Access Mobile plan) for vehicle-side IoT, plus a mandatory
supervisory data SIM for the fleet manager.

### 2.1 Tier Structure

| Tier | IoT SIMs | Manager SIM | Customer MRC | CircleTel MRC |
|------|----------|-------------|-------------|---------------|
| Starter Fleet | 5× Chip SIM @ R6–R26 | 1× MFB Data+ XL 30GB @ R345 | R375–R475/mo | ~R72/mo |
| Mid Fleet | 10× Chip SIM @ R15 avg | 1× MFB Data+ XL 30GB @ R345 | ~R495/mo | ~R90/mo |
| Large Fleet | 20× Chip SIM @ R20 avg | 1× MFB Data+ XL 30GB @ R345 | ~R745/mo | ~R110/mo |

*Prices reflect March 2026 promo sheet — refresh before quoting.*

### 2.2 Starter Fleet — 5 IoT SIMs

| Component | Product | Retail/SIM/mo | Qty | Monthly Total |
|-----------|---------|--------------|-----|---------------|
| IoT SIM (tracker/sensor) | Business Access Mobile Chip SIM | R7.20 (R6 base + 20% markup) | 5 | R36.00 |
| Manager SIM | MFB Data+ XL 30GB | R396.75 (R345 + 15% markup) | 1 | R396.75 |
| **Starter Fleet total** | | | | **R432.75/mo incl. markup** |
| **Customer pays (rounded)** | | | | **R450/mo** |

### 2.3 Mid Fleet — 10 IoT SIMs

| Component | Product | Retail/SIM/mo | Qty | Monthly Total |
|-----------|---------|--------------|-----|---------------|
| IoT SIM (tracker/sensor) | Business Access Mobile Chip SIM | R18.00 (R15 avg + 20% markup) | 10 | R180.00 |
| Manager SIM | MFB Data+ XL 30GB | R396.75 | 1 | R396.75 |
| **Mid Fleet total** | | | | **R576.75/mo incl. markup** |
| **Customer pays (rounded)** | | | | **R595/mo** |

### 2.4 Large Fleet — 20 IoT SIMs

| Component | Product | Retail/SIM/mo | Qty | Monthly Total |
|-----------|---------|--------------|-----|---------------|
| IoT SIM (tracker/sensor) | Business Access Mobile Chip SIM | R24.00 (R20 avg + 20% markup) | 20 | R480.00 |
| Manager SIM | MFB Data+ XL 30GB | R396.75 | 1 | R396.75 |
| **Large Fleet total** | | | | **R876.75/mo incl. markup** |
| **Customer pays (rounded)** | | | | **R895/mo** |

### 2.5 Optional: Reporting Modem SIM

For fleets requiring a vehicle-mounted data modem (dashcam uploads, ELD compliance, live video):

| Component | Product | MRC |
|-----------|---------|-----|
| Vehicle reporting SIM | MFB Data+ S++ 6GB | R119–R329/mo (refresh against promo sheet) |

---

## 3. Retail Pricing Schedule

### 3.1 Customer-Facing Pricing (VAT Inclusive at 15%)

| Tier | Components | MRC excl. VAT | VAT (15%) | MRC incl. VAT |
|------|-----------|--------------|-----------|---------------|
| Starter Fleet (5 SIMs + 1 manager) | 5× IoT SIM + MFB XL 30GB | R391.09 | R58.66 | R449.75 |
| Mid Fleet (10 SIMs + 1 manager) | 10× IoT SIM + MFB XL 30GB | R518.04 | R77.71 | R595.75 |
| Large Fleet (20 SIMs + 1 manager) | 20× IoT SIM + MFB XL 30GB | R779.13 | R116.87 | R896.00 |

### 3.2 Additional SIM Pricing

| Add-on | Product | MRC excl. VAT | MRC incl. VAT |
|--------|---------|--------------|---------------|
| Extra IoT SIM | Business Access Mobile Chip SIM | R20.87–R27.13 | R24.00–R31.20 |
| Additional manager SIM | MFB Data+ XL 30GB | R345.65 | R397.50 |
| Vehicle reporting SIM | MFB Data+ S++ 6GB | R103.48–R286.09 | R119.00–R329.00 |

*All prices VAT-inclusive. Contract term: 24 months standard. Prices subject to change — validate against current Arlan promo sheet before issuing any customer quote.*

---

## 4. Wholesale Cost and Margin Analysis

### 4.1 Per-SIM Economics

| SIM Type | Arlan Wholesale | CircleTel Markup (20%) | Retail excl. VAT | Markup Revenue/SIM/mo |
|----------|----------------|----------------------|-----------------|----------------------|
| IoT Chip SIM (R6 base) | R6.00 | R1.20 | R7.20 | R1.20 |
| IoT Chip SIM (R15 avg) | R15.00 | R3.00 | R18.00 | R3.00 |
| IoT Chip SIM (R20 avg) | R20.00 | R4.00 | R24.00 | R4.00 |
| IoT Chip SIM (R26 max) | R26.00 | R5.20 | R31.20 | R5.20 |

### 4.2 Commission Revenue per IoT SIM

IoT SIM plans fall in the R0–R99 MTN tier: MTN rate 4.75% × CircleTel share 30% = 1.425%.

| SIM Price | Commission/SIM/mo | Per 10-SIM Fleet/mo |
|-----------|-----------------|---------------------|
| R6.00 | R0.09 | R0.85 |
| R15.00 | R0.21 | R2.14 |
| R20.00 | R0.29 | R2.85 |
| R26.00 | R0.37 | R3.71 |

*Commission supplements markup; combined gross margin on IoT SIMs exceeds 25% threshold once markup is applied.*

### 4.3 Manager SIM Economics

MFB Data+ XL 30GB at R345/mo falls in the R300–R499 MTN tier: MTN rate 8.75% × 30% = 2.625%.

| Component | Value |
|-----------|-------|
| Arlan wholesale | R345.00/mo |
| CircleTel markup (15%) | R51.75/mo |
| Retail excl. VAT | R396.75/mo |
| Commission (2.625% of R345) | R9.06/mo |
| **Total CircleTel revenue on manager SIM** | **R60.81/mo** |
| Gross margin % | 15.3% markup + commission = ~30.6% effective |

### 4.4 Bundle Margin Summary

| Tier | Markup Revenue | Commission Revenue | Total CircleTel MRC | Effective Margin |
|------|---------------|--------------------|---------------------|-----------------|
| Starter Fleet | R67.75 | R0.42 + R9.06 | R77.23/mo | ~28.9% |
| Mid Fleet | R90.75 | R2.14 + R9.06 | R101.95/mo | ~30.0% |
| Large Fleet | R141.75 | R5.71 + R9.06 | R156.52/mo | ~29.0% |

All fleet tiers maintain combined effective margin above the 25% floor. IoT/M2M category minimum markup (20%) applied throughout.

---

## 5. Hardware

### 5.1 IoT SIM — Chip SIM CONSMD64K

| Specification | Detail |
|---------------|--------|
| Product code | CONSMD64K |
| Form factor | Chip SIM (nano SIM compatible via adapter) |
| Network certification | M2M (Machine-to-Machine) certified |
| Voice capability | Data only — no voice, no SMS |
| Data usage | Low-volume telemetry (tracker pings, sensor readings) |
| APN | Custom APN must be specified at order; default: `internet` for basic connectivity |
| Network | MTN South Africa (4G LTE, IoT NB-IoT where available) |
| Physical delivery | SIM card couriered to customer premises in bulk |

### 5.2 Fleet Manager Device — MiFi / Tozed ZLT X100 Pro 5G

| Specification | Detail |
|---------------|--------|
| Device | Tozed ZLT X100 Pro 5G (included free on qualifying MFB plans) |
| Form factor | Portable MiFi hotspot |
| Network | 5G/4G LTE MTN South Africa |
| Coverage | Up to 10 connected devices simultaneously |
| Battery | Up to 8 hours active use |
| Data plan pairing | MFB Data+ XL 30GB (30GB data + 30GB night bonus) |

*Device availability subject to Arlan promo sheet at time of order. Alternative MiFi devices (Vida M2, standard Tozed) may be substituted if Tozed X100 Pro 5G is out of stock.*

---

## 6. Network and Technical

### 6.1 MTN IoT Network

| Dimension | Specification |
|-----------|---------------|
| Coverage | MTN national 4G LTE; NB-IoT available in major metros (Johannesburg, Cape Town, Durban, Pretoria) |
| Uptime SLA | MTN Business: 99.5% monthly availability (network level) |
| Latency | Typical 20–80ms for LTE IoT |
| Data throttle | Business Access Mobile plans have fair use at 1GB/SIM/month for tracker payloads |

### 6.2 APN Configuration

| APN Type | APN String | Use Case |
|----------|------------|----------|
| Standard MTN | `internet` | Basic HTTP tracker connectivity |
| MTN Business APN | `mtnbusiness` | Secure device management |
| Customer-specific APN | Specified at order | Fleet management platform integration |

**APN documentation requirement**: CircleTel documents the APN string in the order form; customer's fleet software administrator is responsible for configuring APN settings in their tracking hardware. CircleTel provides APN information only — not fleet software configuration.

### 6.3 Static IP Option

Fleet customers requiring fixed IP addressing (for firewall rules in their fleet management
platform) may request static IPs at R50/SIM/month through the Echo SP add-on. This is billed
separately and is not part of the standard Fleet Connect package. Requires Sales Director
approval for inclusion in quote.

---

## 7. Service Level Agreement

### 7.1 MTN Network SLA

| Metric | Commitment |
|--------|-----------|
| Network availability | 99.5% monthly (MTN Business) |
| IoT SIM provisioning | 2–5 business days from Arlan order submission |
| Fault escalation | MTN Business fault desk via Arlan channel |

### 7.2 CircleTel Support SLA

| Channel | Availability | Response Time |
|---------|-------------|---------------|
| WhatsApp: 082 487 3900 | Mon–Fri 8am–5pm | Within 2 business hours |
| Email: contactus@circletel.co.za | Mon–Fri 8am–5pm | Within 4 business hours |
| After-hours faults | WhatsApp; triaged next business day | Next business day |

**Scope of CircleTel support**: SIM ordering, billing queries, APN documentation, Arlan escalation.
**Out of scope**: Fleet tracking software configuration, GPS hardware installation, vehicle telematics integration.

---

## 8. Installation and Provisioning

### 8.1 Process Overview

Fleet Connect requires no physical installation by CircleTel. The provisioning process is:

| Step | Action | Timeline | Responsible |
|------|--------|----------|-------------|
| 1 | Customer signs quote and FICA documents | Day 0 | Customer |
| 2 | CircleTel submits bulk SIM order to Arlan | Day 0–1 | CircleTel |
| 3 | MTN provisions SIMs on network | Day 1–3 | Arlan / MTN |
| 4 | Arlan couriers SIM cards to customer | Day 3–5 | Arlan |
| 5 | Customer inserts SIMs in tracker hardware | Day 5–7 | Customer |
| 6 | Customer configures APN in fleet software | Day 5–7 | Customer |
| 7 | CircleTel confirms SIM activation and first billing cycle | Day 7 | CircleTel |

### 8.2 Bulk Activation

All SIMs in a fleet deal are ordered simultaneously. Phased SIM delivery is not standard; if a
customer requires staged rollout (e.g. 5 SIMs now, 5 next month), this must be documented as
two separate orders and quoted accordingly.

### 8.3 APN Setup Support

CircleTel provides a standard APN setup guide document to the customer at delivery. Configuration
of the fleet tracking software (iTrack, FleetComplete, Cartrack, etc.) is the customer's
responsibility. CircleTel can assist with basic APN setting guidance via WhatsApp during
business hours.

---

## 9. Support Framework

| Escalation Tier | Handled By | Contact |
|-----------------|------------|---------|
| Billing and account queries | CircleTel | contactus@circletel.co.za |
| SIM connectivity faults | CircleTel → Arlan escalation | WhatsApp 082 487 3900 |
| MTN network faults | Arlan → MTN Business desk | Via CircleTel |
| Fleet software integration | Customer's fleet software vendor | Not CircleTel scope |

**Commission disputes**: Any discrepancy in Arlan commission payments is raised by CircleTel
internally; customers are billed directly by CircleTel and are not involved in Arlan commission
processes.

---

## 10. Target Market

### 10.1 Primary Segments

| Segment | Description | Fleet Size | Deal Type |
|---------|-------------|-----------|-----------|
| Logistics and delivery | Last-mile delivery, courier companies | 5–30 vehicles | Starter or Mid Fleet |
| Field service companies | Plumbing, electrical, pest control, cleaning | 5–20 vehicles | Starter Fleet |
| Security patrols | Armed response, guarding companies | 8–25 vehicles | Mid Fleet |
| Vending and ATM operators | Machine monitoring, cash replenishment | 10–50 machines | Mid or Large Fleet |
| Cold chain transport | Refrigerated transport, temperature monitoring | 5–15 vehicles | Mid Fleet + reporting SIM |

### 10.2 Qualifying Criteria

| Criterion | Requirement |
|-----------|------------|
| Business registration | Registered company; FICA compliant |
| Minimum SIM count | 5 IoT SIMs (below 5 redirected to Business Mobility Starter) |
| Existing fleet hardware | Customer must already have tracker hardware (Fleet Connect provides SIMs only) |
| APN requirement | Customer must identify the APN string needed by their tracking platform before order |
| Contract term | 24-month standard commitment |

---

## 11. Competitive Positioning

| Differentiator | CircleTel Fleet Connect | Direct MTN Business Portal |
|---------------|------------------------|---------------------------|
| Account minimum | 5 SIMs | Typically 10+ SIMs for dedicated account |
| Onboarding time | 2–5 business days | 5–10 business days |
| Single account manager | Yes — CircleTel handles Arlan | No — customer deals with MTN and Arlan separately |
| Billing | Single invoice from CircleTel | Separate MTN and Arlan invoices |
| Support | WhatsApp + email, Mon–Fri | Call centre, business hours |
| Markup transparency | CircleTel margin not visible to customer | Customer may price-check MTN portal |
| Coverage | MTN national 4G/5G | MTN national 4G/5G (identical) |
| CAPEX required | Zero | Zero |

**Key competitive advantage**: Logistics SMEs often lack IT departments. CircleTel's single-
account, WhatsApp-first model removes friction that causes SMEs to delay IoT adoption.

---

## 12. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Low per-SIM value requires volume | High | Medium | Target 3+ fleet deals/month; upsell to Large Fleet tier |
| Fleet customer expands beyond 50 SIMs | Low-Medium | Low | Negotiate direct Arlan enterprise agreement; CircleTel earns referral |
| IoT SIM theft from vehicle | Medium | Low | SIMs are network-locked; customer responsible for physical security |
| Arlan promo sheet changes IoT pricing | High (quarterly) | Medium | Lock customer pricing for contract term; absorb promo changes |
| Customer's fleet software requires proprietary APN | Low | Medium | Document APN requirement at quote stage; not a blocker |
| Customer has no tracker hardware | Medium | High | Qualify at first call; redirect to hardware supplier (MiRO, Scoop) |
| Commission payments delayed by Arlan | Low | Low | Invoice customers independently; commission is secondary revenue |

---

## 13. Implementation Roadmap

### 13.1 Phase Timeline (Per Arlan Strategy v1.1)

| Phase | Calendar Period | Action | Target |
|-------|----------------|--------|--------|
| Phase 3 Pre-launch | Jul–Aug 2026 | Train sales team; finalise collateral; qualify first pipeline | 0 deals; 5 qualified leads |
| Phase 3 Launch | Sep 2026 | First fleet deals closed | 1 deal in September |
| Phase 3 Ramp | Oct–Nov 2026 | 3 deals/month cadence | 3 deals/month sustained |

### 13.2 Sales Process

| Stage | Activity | Owner |
|-------|----------|-------|
| Prospect | LinkedIn/WhatsApp outreach to logistics SMEs | Sales |
| Qualify | Confirm: 5+ vehicles, existing tracker hardware, FICA | Sales |
| Quote | Issue fleet-size quote; confirm APN; include FUP disclosure | Sales |
| Sign | Customer signs 24-month contract; submits FICA | Admin |
| Order | CircleTel submits SIM order to Arlan | Admin |
| Deliver | Arlan couriers SIMs; CircleTel confirms activation | Admin |
| Invoice | Monthly invoice issued by CircleTel on 25th | Billing |

---

## 14. Financial Projections

### 14.1 Monthly Revenue Ramp

| Month | Calendar | Fleet Deals Active | Avg SIMs/Deal | Total IoT SIMs | CircleTel MRC |
|-------|----------|--------------------|---------------|----------------|---------------|
| 6 | Sep 2026 | 1 | 10 | 10 | ~R102/mo |
| 7 | Oct 2026 | 4 | 10 | 40 | ~R407/mo |
| 8 | Nov 2026 | 7 | 10 | 70 | ~R713/mo |
| 9 | Dec 2026 | 10 | 12 | 120 | ~R1,022/mo |
| 10 | Jan 2027 | 13 | 12 | 156 | ~R1,328/mo |
| 12 | Mar 2027 | 20 | 12 | 240 | ~R2,040/mo |

### 14.2 Month 5 Interim Target (per Strategy)

Month 5 (August 2026) is before Phase 3 Fleet launch. Fleet revenue at Month 5: R0 (planned;
Phase 3 starts September 2026). The R270/mo Month 5 fleet contribution cited in the strategy
assumes 3 early deals from qualified pilots. Pipeline-dependent.

### 14.3 12-Month Fleet Contribution

By Month 12 (March 2027): 20 active fleet deals @ ~R102/mo average = approximately R2,040/mo.
This contributes to the R893K total MRR target. Fleet is not a primary MRR driver but provides
a high-margin, zero-CAPEX revenue stream with strong upsell potential.

---

## 15. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Managing Director | Jeffrey | | |
| Sales Director | | | |

**Review cycle**: Quarterly or upon Arlan promo sheet refresh, whichever comes first.

**Next review date**: July 2026 (prior to Phase 3 launch)

---

*CircleTel (Pty) Ltd — A member of the New Generation Group*
*"Connecting Today, Creating Tomorrow"*
*contactus@circletel.co.za | WhatsApp: 082 487 3900 | Mon–Fri 8am–5pm*
