# SkyFibre SMB — Business Rules Document (BRD)

## Eligibility Logic, Workflow Rules & Conditional Policies

---

| Field | Value |
|-------|-------|
| **Document Reference** | CT-BRD-SKYFIBRE-SMB-2026-001 |
| **Version** | 1.0 |
| **Effective Date** | 1 March 2026 |
| **Classification** | Confidential — Internal Use |
| **Locale** | en-ZA (South African English) |
| **Prepared By** | CircleTel Product Strategy |
| **Source Documents** | SkyFibre SMB CPS v2.0, SkyFibre Business Modular Portfolio v3.1, SkyFibre FUP Framework, MTN FWB Commercial Schedule (July 2025), Arlan Sales Agreement v1.0, ICASA Licence Register v1.0, Hardware Cost Register v1.2 |
| **Supersedes** | N/A — First issue |

---

## Version Control

| Version | Date | Author | Changes | Status |
|---------|------|--------|---------|--------|
| 1.0 | 1 March 2026 | CircleTel Product Strategy | Initial BRD aligned to modular pricing architecture (CPS v2.0) | **CURRENT** |

---

## Table of Contents

1. Purpose & Scope
2. Definitions & Abbreviations
3. Customer Eligibility Rules
4. Coverage & Technical Eligibility
5. Product Selection Rules
6. Module Eligibility & Dependency Logic
7. Pricing & Discount Rules
8. Billing & Payment Rules
9. Contract & Commitment Rules
10. Credit Vetting & Onboarding Workflow
11. Provisioning & Installation Workflow
12. SLA Entitlement Rules
13. Fair Usage & Traffic Management Policies
14. Upgrade, Downgrade & Migration Rules
15. Cancellation & Churn Policies
16. Arlan Backstop Channel Rules
17. Partner & Reseller Rules
18. Regulatory & Compliance Policies
19. Exception Handling & Escalation
20. Appendix: Decision Trees

---

## 1. Purpose & Scope

This Business Rules Document (BRD) codifies every eligibility check, workflow trigger, conditional policy, and decision rule that governs the SkyFibre SMB product line from lead qualification through to service termination. It is the authoritative operational reference for sales, provisioning, billing, support, and compliance teams.

**Scope:** All SkyFibre SMB base tiers (Business 50, Business 100, Business 200) and all add-on modules (Managed Router, Enhanced SLA, Premium SLA, Email Hosting, Cloud Backup, Business VPN, 5G/LTE Failover, Security Suite) sold under the modular pricing architecture introduced in CPS v2.0.

**Out of scope:** SkyFibre Residential, HomeFibreConnect (MTN FTTH), BizFibreConnect (DFA BIA), UmojaLink, AirLink FWA, ParkConnect DUNE, CircleConnect IoT, and Managed IT Services — each governed by separate BRDs.

---

## 2. Definitions & Abbreviations

| Term | Definition |
|------|-----------|
| **Base Tier** | The core connectivity service (Business 50, 100, or 200) including static IP, uncapped data, and basic support |
| **Module** | An independently priced add-on service layered onto a base tier |
| **BYOD** | Bring Your Own Device — customer supplies their own router |
| **MRC** | Monthly Recurring Charge (excl. VAT unless stated) |
| **NRC** | Non-Recurring Charge (once-off) |
| **MSC** | Minimum Spend Commitment — contractual minimum payable to MTN |
| **FUP** | Fair Usage Policy |
| **AUP** | Acceptable Usage Policy |
| **BSS** | Business Support System (AgilityGIS) |
| **CPE** | Customer Premises Equipment |
| **RN** | Tarana Remote Node (outdoor unit) |
| **NNI** | Network-to-Network Interface |
| **CPA** | Consumer Protection Act 68 of 2008 |
| **ECA** | Electronic Communications Act 36 of 2005 |
| **FICA** | Financial Intelligence Centre Act 38 of 2001 |
| **POPIA** | Protection of Personal Information Act 4 of 2013 |

---

## 3. Customer Eligibility Rules

### 3.1 Entity Type Eligibility

| Rule ID | Rule | Condition | Action |
|---------|------|-----------|--------|
| CE-001 | Registered business entity | Customer MUST be a registered South African business (Pty Ltd, CC, sole proprietor, NPC, trust, or partnership) | Proceed to coverage check |
| CE-002 | Consumer/residential applicant | Customer is a natural person NOT operating a business | REJECT — redirect to SkyFibre Residential |
| CE-003 | Government entity | National, provincial, or local government department/SOE | Proceed — flag for tender/procurement compliance |
| CE-004 | Foreign-registered entity | Business registered outside South Africa but with a South African physical address | Proceed IF a valid SA physical address and proof of local operation is provided |
| CE-005 | Informal/unregistered business | No CIPC registration or sole proprietor without trade documentation | REJECT for SkyFibre SMB — redirect to SkyFibre Residential or UmojaLink Business |

### 3.2 Required Documentation

| Rule ID | Document | Required? | Validation |
|---------|----------|-----------|------------|
| CE-010 | Company registration certificate (CIPC) | Mandatory | Must be current; not deregistered |
| CE-011 | VAT registration certificate | Conditional | Required if customer requests VAT invoice |
| CE-012 | Proof of business address | Mandatory | Utility bill, lease agreement, or rates clearance certificate — not older than 3 months |
| CE-013 | Authorised signatory ID | Mandatory | South African ID or passport — FICA requirement |
| CE-014 | Bank account confirmation | Conditional | Required for debit order; bank-stamped letter or first page of bank statement |
| CE-015 | B-BBEE certificate | Optional | Record if provided; used for reporting and enterprise development tracking |
| CE-016 | Letter of authority | Conditional | Required if signatory is NOT a director per CIPC records |

### 3.3 Credit Eligibility

| Rule ID | Rule | Condition | Action |
|---------|------|-----------|--------|
| CE-020 | Credit check required | All new customers with MRC ≥ R1 299 | Run credit bureau check via TransUnion/Experian |
| CE-021 | Credit score PASS | Score ≥ 600 (TransUnion CPA score) | Proceed to provisioning |
| CE-022 | Credit score MARGINAL | Score 500–599 | Proceed with CONDITION: require 3-month upfront payment OR debit order mandate |
| CE-023 | Credit score FAIL | Score < 500 | REJECT for month-to-month — offer 12-month contract with 2-month deposit OR redirect to Arlan channel (R999 MTN direct) |
| CE-024 | Credit check exemption | Customer pays 12 months upfront | Credit check WAIVED |
| CE-025 | Existing customer (good standing) | Customer has active CircleTel service with zero arrears for ≥ 6 months | Credit check WAIVED for additional services |

---

## 4. Coverage & Technical Eligibility

### 4.1 Coverage Check

| Rule ID | Rule | Condition | Action |
|---------|------|-----------|--------|
| TC-001 | MTN Tarana G1 coverage required | Customer address MUST fall within MTN FWB coverage area (6 million homes passed) | Run MTN coverage API check or manual check via MTN Wholesale portal |
| TC-002 | Coverage CONFIRMED | Address returns positive coverage result | Proceed to site survey |
| TC-003 | Coverage NEGATIVE | Address not in MTN FWB footprint | REJECT for SkyFibre SMB — cross-sell to: HomeFibreConnect (if FTTH coverage), BizFibreConnect (if DFA coverage), or Arlan MTN Business 5G |
| TC-004 | Coverage MARGINAL | Coverage flagged as "possible" or fringe | Schedule site survey with signal test BEFORE customer commitment |

### 4.2 Site Technical Requirements

| Rule ID | Requirement | Condition | Action if NOT Met |
|---------|-------------|-----------|-------------------|
| TC-010 | Line of sight to MTN Tarana base station | Within 10 km radius | Installation CANNOT proceed — reject or explore alternative mounting |
| TC-011 | Minimum signal strength | ≥ −75 dBm measured at installation point | Installation CANNOT proceed — attempt alternative mounting position; if still below threshold, reject |
| TC-012 | Suitable outdoor mounting location | Roof or wall mount possible for Tarana RN device | Assess alternative mounting; if impossible, reject |
| TC-013 | Power outlet proximity | Mains power within 30 m of installation point | Customer must arrange power extension BEFORE installation |
| TC-014 | Ethernet routing path | Indoor cable route from RN PoE injector to router location | Maximum 100 m Cat6 run; customer premises wiring is customer responsibility beyond router |
| TC-015 | Weather exposure assessment | Installer must assess wind load and water ingress risk | If excessive exposure, use reinforced mounting bracket (additional R350 NRC) |

### 4.3 Site Survey Outcome

| Rule ID | Outcome | Action |
|---------|---------|--------|
| TC-020 | PASS — all requirements met | Proceed to installation scheduling |
| TC-021 | CONDITIONAL PASS — minor remediation required | Installation scheduled subject to customer completing remediation (power, mounting, etc.) within 10 business days |
| TC-022 | FAIL — technical barrier | Service cannot be delivered — issue formal rejection letter; offer alternative products per TC-003 |

---

## 5. Product Selection Rules

### 5.1 Base Tier Selection

| Rule ID | Rule | Condition | Assigned Tier |
|---------|------|-----------|---------------|
| PS-001 | Customer requests ≤ 50 Mbps | Budget-conscious, 1–5 users | SkyFibre Business 50 (R1 299/m) |
| PS-002 | Customer requests 51–100 Mbps | Standard office, 5–20 users | SkyFibre Business 100 (R1 499/m) |
| PS-003 | Customer requests > 100 Mbps | Bandwidth-intensive, 20–50 users | SkyFibre Business 200 (R1 899/m) |
| PS-004 | Customer requires symmetrical speeds | Upload-heavy workloads (large file transfers, live streaming, media production) | DO NOT sell SkyFibre SMB — redirect to BizFibreConnect (DFA fibre, symmetrical speeds) |
| PS-005 | Customer requires > 200 Mbps | Exceeds SkyFibre SMB maximum | Redirect to BizFibreConnect or HomeFibreConnect FTTH (up to 1 Gbps) |
| PS-006 | Customer cannot afford ≥ R1 299 | Budget below minimum base tier | Redirect to Arlan channel (MTN Business direct at R999) or SkyFibre Residential |

### 5.2 Speed Profile Disclosure (Mandatory)

| Rule ID | Rule | Enforcement |
|---------|------|-------------|
| PS-010 | All speed profiles are 4:1 asymmetrical (DL:UL) | Sales team MUST disclose this to every prospect before contract signing |
| PS-011 | Speed comparison with MTN Business direct | Sales team MUST acknowledge identical underlying Tarana G1 infrastructure |
| PS-012 | Upload speed must be stated explicitly | Quotes and contracts must state BOTH download AND upload speeds (e.g. "100/25 Mbps") |
| PS-013 | No "symmetrical" or "dedicated" claims | Marketing materials, quotes, and verbal representations MUST NOT describe speeds as symmetrical, dedicated, or guaranteed (unless Enhanced/Premium SLA module is attached) |

---

## 6. Module Eligibility & Dependency Logic

### 6.1 Module Prerequisite Rules

> **⚠️ Every module requires an active SkyFibre SMB base tier. No module may be sold standalone.**

| Rule ID | Module | Prerequisite | Dependency | Conflict |
|---------|--------|-------------|------------|----------|
| MD-001 | Managed Router (R149/m) | Active base tier | None | Cannot be added if customer has formally declared BYOD |
| MD-002 | Enhanced SLA — 99.5% (R249/m) | Active base tier | None | CONFLICTS with Premium SLA — only one SLA module per service |
| MD-003 | Premium SLA — 99.9% (R499/m) | Active base tier | None | CONFLICTS with Enhanced SLA — only one SLA module per service |
| MD-004 | Email Hosting — 5 mailbox (R79/m) | Active base tier | None | Can upgrade to 10 mailbox; cannot run both simultaneously |
| MD-005 | Email Hosting — 10 mailbox (R129/m) | Active base tier | None | Supersedes 5 mailbox option |
| MD-006 | Cloud Backup — 50 GB (R49/m) | Active base tier | None | Can upgrade to higher tier; only one backup tier active |
| MD-007 | Cloud Backup — 100 GB (R99/m) | Active base tier | None | Supersedes 50 GB |
| MD-008 | Cloud Backup — 250 GB (R179/m) | Active base tier | None | Supersedes 100 GB |
| MD-009 | Business VPN — 5 users (R199/m) | Active base tier | Requires Static IP (included in base) | Can upgrade to 10 users |
| MD-010 | Business VPN — 10 users (R349/m) | Active base tier | Requires Static IP (included in base) | Supersedes 5-user tier |
| MD-011 | 5G/LTE Failover (R399/m) | Active base tier | None | Tozed 5G CPE provisioned by CircleTel; requires MTN 5G/LTE coverage at site |
| MD-012 | Security Suite (R249/m) | Active base tier | Requires Managed Router OR customer router with DNS redirect capability | None |

### 6.2 Module Combination Rules

| Rule ID | Rule | Logic |
|---------|------|-------|
| MD-020 | Maximum one SLA module per service instance | `IF Enhanced_SLA = active THEN Premium_SLA = blocked` AND vice versa |
| MD-021 | Maximum one Email Hosting tier per service instance | `IF Email_5 = active THEN Email_10 = blocked` (upgrade removes previous tier) |
| MD-022 | Maximum one Cloud Backup tier per service instance | `IF Backup_50 = active THEN Backup_100 AND Backup_250 = blocked` (upgrade removes previous tier) |
| MD-023 | Maximum one VPN tier per service instance | `IF VPN_5 = active THEN VPN_10 = blocked` (upgrade removes previous tier) |
| MD-024 | Security Suite requires DNS capability | `IF Managed_Router = NOT active AND Customer_Router_DNS = NOT confirmed THEN Security_Suite = blocked` |
| MD-025 | 5G/LTE Failover requires 5G/LTE coverage | `IF MTN_5G_LTE_Coverage_At_Site = FALSE THEN Failover = blocked` |
| MD-026 | All modules terminate if base tier terminates | `IF Base_Tier = cancelled THEN ALL active modules = auto-cancelled` |

### 6.3 Recommended Module Bundles (Sales Guidance — Not Mandatory)

| Customer Profile | Recommended Configuration | Expected MRC (100 Mbps ref.) |
|-----------------|--------------------------|------------------------------|
| Price-sensitive / startup | Base only (BYOD) | R1 499 |
| Standard small office (5–15 staff) | Base + Managed Router + Enhanced SLA | R1 897 |
| Professional services / healthcare | Base + Router + Enhanced SLA + Email (10) + Backup (100 GB) | R2 115 |
| Mission-critical operations | Base + Router + Premium SLA + Email (10) + Backup (250 GB) + Failover + Security | R2 903 |

---

## 7. Pricing & Discount Rules

### 7.1 Standard Pricing (Non-Negotiable Unless Exception Approved)

| Rule ID | Rule | Detail |
|---------|------|--------|
| PR-001 | Base tier prices are fixed | R1 299 (50 Mbps), R1 499 (100 Mbps), R1 899 (200 Mbps) — no sales discretion |
| PR-002 | Module prices are fixed | Per CPS v2.0 module pricing schedule — no sales discretion |
| PR-003 | All prices exclude VAT | VAT at 15% added at point of billing |
| PR-004 | Prices are monthly recurring | No annual lump-sum pricing without CFO approval |

### 7.2 Discount Authority Matrix

| Rule ID | Discount Type | Maximum | Authority Required | Conditions |
|---------|--------------|---------|-------------------|------------|
| PR-010 | Base tier discount | 0% | N/A | No discounts on base tier pricing — price integrity is critical |
| PR-011 | Module bundle discount | 5% on total module MRC | Sales Director | Only if customer subscribes to ≥ 3 modules simultaneously |
| PR-012 | Annual payment discount | 5% on total MRC | CFO | Customer pays 12 months upfront; non-refundable |
| PR-013 | Multi-site discount | 10% on base tier from site 3 onwards | MD approval | Minimum 3 sites under single customer account |
| PR-014 | Promotional pricing | As defined per campaign | Marketing + CFO approval | Time-limited; must specify campaign code and expiry date |
| PR-015 | First-100-customer launch special | 3 months at 50% off MRC | Pre-approved | Valid only for first 100 commercial SMB customers; tracked in BSS |
| PR-016 | Competitive price match | Match R999 via Arlan channel | Sales Director | Only when SkyFibre deal is LOST — see Section 16 |

### 7.3 Pricing Prohibitions

| Rule ID | Prohibition | Rationale |
|---------|------------|-----------|
| PR-020 | No custom/bespoke pricing below R1 299 for any SkyFibre SMB base tier | Margin floor protection — below R1 299 the contribution margin becomes unsustainable |
| PR-021 | No zero-margin deals | Every deal MUST maintain ≥ 25% contribution margin after all discounts |
| PR-022 | No free modules beyond 30-day trial period | Modules must convert to paid after trial or be removed |
| PR-023 | No retrospective price adjustments | Price corrections require a formal credit note workflow |

---

## 8. Billing & Payment Rules

| Rule ID | Rule | Detail |
|---------|------|--------|
| BL-001 | Billing date is the 1st of each month | Pro-rata billing for partial first month |
| BL-002 | Payment terms: 7 calendar days | Invoice due within 7 days of issue |
| BL-003 | Accepted payment methods | Debit order (preferred), EFT, credit card |
| BL-004 | Debit order returns | First return: personalised call + R100 admin fee. Second return within 60 days: service suspended (BL-010) |
| BL-005 | EFT payment matching | Customer must use unique reference number; unmatched payments held in suspense account for 14 days |
| BL-006 | Advance billing | Base tier and all modules billed in advance for the upcoming month |
| BL-007 | Module changes mid-cycle | Pro-rata credit for removed modules; pro-rata charge for new modules from activation date |
| BL-010 | Non-payment suspension | Service suspended after 14 days in arrears; 30-day cure period before termination |
| BL-011 | Reconnection fee | R250 reconnection fee after payment suspension cleared |
| BL-012 | VAT treatment | All prices exclude VAT; 15% VAT charged on all invoices; CircleTel is a registered VAT vendor |

---

## 9. Contract & Commitment Rules

| Rule ID | Contract Type | Term | Early Termination |
|---------|--------------|------|-------------------|
| CT-001 | Month-to-month | Rolling monthly | 30 days' written notice; no penalty |
| CT-002 | 12-month fixed term | 12 months | CPA Section 14: remaining months × 75% of MRC |
| CT-003 | 24-month fixed term | 24 months | CPA Section 14: remaining months × 75% of MRC |

**CPA cooling-off period:** 5 business days (direct marketing only). Customer may cancel without penalty during this period.

**Auto-renewal:** Fixed-term contracts convert to month-to-month at expiry unless customer opts into a new fixed term. CircleTel must notify customer 40–80 business days before expiry (CPA Section 14).

**Equipment on termination:** Tarana RN device remains MTN property and is collected by MTN within 14 business days. Managed Router must be returned within 14 business days or R1 500 replacement fee applies.

---

## 10. Credit Vetting & Onboarding Workflow

### 10.1 End-to-End Onboarding Process

```
STEP 1: Lead Qualification
  └─ Sales qualifies entity type (CE-001 to CE-005)
  └─ IF FAIL → redirect per eligibility rules
  └─ IF PASS → proceed

STEP 2: Coverage Check
  └─ Run MTN Tarana coverage check (TC-001 to TC-004)
  └─ IF NEGATIVE → cross-sell alternatives (TC-003)
  └─ IF MARGINAL → schedule site survey (TC-004)
  └─ IF CONFIRMED → proceed

STEP 3: Product & Module Selection
  └─ Sales configures base tier + modules (PS-001 to PS-006, MD-001 to MD-012)
  └─ System validates module dependencies and conflicts
  └─ Generate quote via AgilityGIS BSS

STEP 4: Documentation Collection
  └─ Collect all mandatory documents (CE-010 to CE-016)
  └─ Verify documents against FICA and POPIA requirements
  └─ IF incomplete → return to customer with checklist; 10 business day deadline

STEP 5: Credit Vetting
  └─ Run TransUnion/Experian credit check (CE-020 to CE-025)
  └─ IF PASS → proceed
  └─ IF MARGINAL → apply conditions (3-month prepay or debit order mandate)
  └─ IF FAIL → offer 12-month contract + 2-month deposit OR redirect to Arlan

STEP 6: Contract Signing
  └─ Generate contract via BSS (contract type per CT-001 to CT-003)
  └─ Customer signs electronically or physically
  └─ CPA cooling-off period begins (5 business days for direct marketing)
  └─ Countersigned by CircleTel authorised representative

STEP 7: Order Activation
  └─ Order entered into MTN Wholesale provisioning system
  └─ Site survey scheduled (if not already completed)
  └─ Installation date confirmed with customer (target: 5 business days)

STEP 8: Installation & Handover
  └─ Installation workflow per Section 11
  └─ Service activated and tested
  └─ Customer signs acceptance form
  └─ Billing commences from activation date
```

---

## 11. Provisioning & Installation Workflow

### 11.1 Pre-Installation Rules

| Rule ID | Rule | Condition | Action |
|---------|------|-----------|--------|
| IN-001 | Site survey mandatory | All new installations | Installer must verify signal (≥ −75 dBm), mounting location, and power before proceeding |
| IN-002 | Site survey validity | Survey results are valid for 30 calendar days | If installation not completed within 30 days, re-survey required |
| IN-003 | Customer premises readiness | Power, indoor cable route, and mounting consent confirmed | Installation CANNOT proceed until customer confirms readiness |
| IN-004 | MTN wholesale order placed | Order submitted to MTN Wholesale system | Installation cannot be scheduled until MTN confirms RN device availability |
| IN-005 | Installation slot booking | Customer must confirm a 4-hour installation window | Morning (08:00–12:00) or afternoon (12:00–16:00) slots available Mon–Fri; Saturday by arrangement |

### 11.2 Installation Process (Estimated 45 Minutes)

| Step | Activity | Duration | Success Criteria |
|------|----------|----------|-----------------|
| 1 | Site survey and signal verification | 10 min | ≥ −75 dBm confirmed |
| 2 | Professional mounting of Tarana RN device | 10 min | Secure mounting, weather-sealed |
| 3 | Ethernet cable routing and PoE connection | 5 min | Cat6, ≤ 100 m, tested |
| 4 | Router setup via QR code — zero-touch cloud provisioning | 5 min | Ruijie Cloud registration confirmed |
| 5 | QoS configuration and VoIP prioritisation | 5 min | Profile applied per base tier |
| 6 | Speed testing, latency verification, and optimisation | 5 min | DL ≥ 80% of package; UL ≥ 80% of rated |
| 7 | Customer handover: WiFi credentials, portal access, and Reyee app setup | 5 min | Customer sign-off on acceptance form |

### 11.3 Post-Installation Rules

| Rule ID | Rule | Detail |
|---------|------|--------|
| IN-010 | Speed test record | Installer must record DL/UL speed test results in BSS; minimum 3 tests from 3 devices |
| IN-011 | Acceptance form | Customer must sign installation acceptance form before installer leaves site |
| IN-012 | Failed installation | If speed test fails after optimisation, installation is rescheduled; customer not billed until service is active |
| IN-013 | RN device serial recording | Tarana RN device serial number must be recorded in BSS against the customer's service record |

---

## 12. SLA Entitlement Rules

### 12.1 SLA Assignment Logic

| Rule ID | Condition | SLA Level | Uptime | Response Time | Service Credits |
|---------|-----------|-----------|--------|---------------|-----------------|
| SL-001 | Base tier only (no SLA module) | Basic | Best-effort | Next business day | None |
| SL-002 | Enhanced SLA module active (+R249/m) | Enhanced | 99.5% | 4 business hours | 10% per hour of confirmed downtime |
| SL-003 | Premium SLA module active (+R499/m) | Premium | 99.9% | 2 hours (24/7) | 15% per hour of confirmed downtime |

### 12.2 Service Credit Calculation Rules

| Rule ID | Rule | Formula / Detail |
|---------|------|------------------|
| SL-010 | Credit calculation basis | `Credit = (Downtime_Hours × Credit_Rate%) × Monthly_MRC` |
| SL-011 | Maximum credit per incident | Capped at 100% of that month's MRC (base tier + active modules) |
| SL-012 | Maximum credit per calendar month | Capped at 100% of monthly MRC — credits do not carry over |
| SL-013 | Downtime measurement start | Clock starts from the time the customer reports the fault via any official support channel |
| SL-014 | Excluded downtime | Scheduled maintenance (with 48 hours' prior notice), customer-caused issues, force majeure, and upstream MTN network outages beyond CircleTel's control are excluded from SLA calculations |
| SL-015 | Credit claim process | Customer must submit a credit claim within 30 calendar days of the incident; claims not lodged within this period are forfeited |

### 12.3 Speed Guarantee Rules

| Rule ID | SLA Level | DL Guarantee | UL Guarantee | Measurement Method |
|---------|-----------|-------------|-------------|-------------------|
| SL-020 | Basic (no SLA module) | No guarantee | No guarantee | N/A |
| SL-021 | Enhanced SLA | 85% of package DL speed | 85% of rated UL speed | Average over any 24-hour period measured at the router WAN interface |
| SL-022 | Premium SLA | 90% of package DL speed | 90% of rated UL speed | Average over any 24-hour period measured at the router WAN interface |

---

## 13. Fair Usage & Traffic Management Policies

### 13.1 FUP Position (SkyFibre SMB v2.0)

| Rule ID | Rule | Detail |
|---------|------|--------|
| FU-001 | SkyFibre SMB is marketed as "truly uncapped with no FUP" | This is a primary competitive differentiator vs MTN Business direct |
| FU-002 | No hard data caps | Customers are never hard-capped or disconnected for data usage |
| FU-003 | Contention ratio | Business customers operate at 8:1 contention (vs 35:1 residential) |
| FU-004 | Network protection management | CircleTel reserves the right to apply network management during extreme congestion events affecting >20% of subscribers on a base node |

### 13.2 Traffic Classification Rules

| Rule ID | Traffic Type | Classification | Management Action |
|---------|-------------|----------------|-------------------|
| FU-010 | VoIP, video conferencing (Zoom, Teams, WhatsApp) | PROTECTED | Never throttled or deprioritised |
| FU-011 | Banking and financial services | PROTECTED | Never throttled or deprioritised |
| FU-012 | Educational platforms | PROTECTED | Never throttled or deprioritised |
| FU-013 | Work VPN connections | PROTECTED | Never throttled or deprioritised |
| FU-014 | Email and messaging | PROTECTED | Never throttled or deprioritised |
| FU-015 | P2P / torrent traffic | MANAGED | May be shaped during peak hours (08:00–18:00 for business) |
| FU-016 | Bulk cloud backup uploads | MANAGED | Recommend scheduling off-peak (18:00–06:00) |
| FU-017 | Streaming (Netflix, YouTube, etc.) | STANDARD | Normal priority; no specific management |

### 13.3 Acceptable Usage Policy (AUP) Violations

| Rule ID | Violation | Severity | Action |
|---------|----------|----------|--------|
| FU-020 | Running servers (web, mail, game) | Medium | First notice: written warning. Second notice: service restriction. Third: suspension |
| FU-021 | Cryptocurrency mining | High | Immediate suspension pending investigation |
| FU-022 | Reselling or sharing connection | High | Immediate suspension; contract termination if confirmed |
| FU-023 | Continuous streaming/broadcasting (24/7) | Medium | Written warning; redirect to dedicated line product |
| FU-024 | Automated bot traffic | High | Immediate suspension pending investigation |
| FU-025 | Network attacks or scanning | Critical | Immediate termination; reported to SAPS and relevant CSIRT |
| FU-026 | SPAM or bulk unsolicited email | High | Immediate suspension of email hosting module; static IP blacklist review |

---

## 14. Upgrade, Downgrade & Migration Rules

### 14.1 Upgrade Rules

| Rule ID | Upgrade Type | Conditions | Processing Time | Billing Impact |
|---------|-------------|-----------|----------------|----------------|
| UG-001 | Base tier upgrade (e.g. 50→100 Mbps) | Customer request; no additional site survey needed | Same business day (remote provisioning) | Pro-rata difference applied from upgrade date |
| UG-002 | Module addition | Customer request; dependency/conflict check per Section 6 | Same business day (except Managed Router and 5G Failover which require CPE delivery) | New module MRC starts from activation date |
| UG-003 | Module tier upgrade (e.g. Backup 50→100 GB) | Customer request | Same business day | Previous tier MRC stops; new tier starts from upgrade date |
| UG-004 | SLA module upgrade (Enhanced→Premium) | Customer request | Immediate | New SLA effective from activation; pro-rata billing |

### 14.2 Downgrade Rules

| Rule ID | Downgrade Type | Conditions | Processing Time | Billing Impact |
|---------|---------------|-----------|----------------|----------------|
| DG-001 | Base tier downgrade (e.g. 200→100 Mbps) | Customer request; 30 days' notice | Effective 1st of next billing cycle | Reduced MRC from effective date |
| DG-002 | Module removal | Customer request; 30 days' notice | Effective 1st of next billing cycle | Module MRC ceases from effective date |
| DG-003 | SLA module downgrade (Premium→Enhanced) | Customer request; 30 days' notice | Effective 1st of next billing cycle | Reduced SLA effective from downgrade date |
| DG-004 | Downgrade below minimum tier | Customer requests below R1 299 | NOT POSSIBLE within SkyFibre SMB — redirect to Arlan channel or SkyFibre Residential |

### 14.3 Migration Rules

| Rule ID | Migration | Conditions | Process |
|---------|----------|-----------|---------|
| MG-001 | SkyFibre SMB → BizFibreConnect | Customer requires symmetrical speeds or DFA fibre | New installation required; SkyFibre cancelled per cancellation policy; no migration fee |
| MG-002 | SkyFibre SMB → HomeFibreConnect | Customer relocates to FTTH area | New installation required; SkyFibre cancelled per cancellation policy |
| MG-003 | SkyFibre Residential → SkyFibre SMB | Existing residential customer upgrading to business | Business onboarding process required (credit check, documentation); existing RN device may be reused if on same site |
| MG-004 | SkyFibre SMB old bundle → modular | Existing v1.1 bundle customers | Migrate to equivalent base tier + modules; customer must consent; no penalty for migration |

---

## 15. Cancellation & Churn Policies

### 15.1 Cancellation Rules

| Rule ID | Scenario | Notice Period | Penalty | Process |
|---------|----------|--------------|---------|---------|
| CN-001 | Month-to-month cancellation | 30 calendar days' written notice | None | Service terminates at end of notice period; final invoice issued |
| CN-002 | Fixed-term early cancellation | 20 business days' written notice (CPA) | Remaining months × 75% of MRC (CPA Section 14(3)(b)(i)(bb)) | Penalty invoice issued; service terminates at end of notice period |
| CN-003 | CPA cooling-off cancellation | Within 5 business days of signing (direct marketing only) | None | Full refund of any payments; no installation if not yet completed |
| CN-004 | Cancellation due to coverage loss | MTN discontinues Tarana coverage at customer site | None | Service terminates; no penalty regardless of contract term |
| CN-005 | Cancellation due to persistent SLA breach | 3+ SLA breaches in 90-day rolling period (Enhanced/Premium SLA) | None | Customer may cancel without penalty per CPA Section 56 |
| CN-006 | Death of sole proprietor | Proof of death required | None | Service terminates; any fixed-term penalties waived per CPA |

### 15.2 Cancellation Process

```
STEP 1: Customer submits cancellation request (email, portal, or written)
STEP 2: Sales/retention team contacts customer within 2 business days
  └─ Attempt retention: identify reason, offer alternatives (downgrade, module adjustment, Arlan channel)
  └─ IF retention successful → update service; close cancellation request
  └─ IF retention unsuccessful → proceed
STEP 3: Confirm cancellation terms (notice period, penalties if applicable)
STEP 4: Schedule equipment collection (Tarana RN + Managed Router if applicable)
  └─ MTN RN device: MTN collection within 14 business days
  └─ Managed Router: customer must return within 14 business days or R1 500 fee applies
STEP 5: Generate final invoice (pro-rata to termination date + any penalties)
STEP 6: Deactivate service in BSS and MTN Wholesale system
STEP 7: Close customer record; retain data per POPIA (minimum 5 years)
```

### 15.3 Churn Prevention Triggers

| Rule ID | Trigger | Detection Method | Automated Action |
|---------|---------|-----------------|------------------|
| CH-001 | Customer contacts support ≥ 3 times in 30 days | BSS ticket count | Flag for proactive account manager outreach |
| CH-002 | Speed tests consistently below 70% of package | Ruijie Cloud monitoring | Automated alert to NOC + account manager |
| CH-003 | Customer removes modules | BSS module change | Retention team contacts within 24 hours |
| CH-004 | Customer queries competitor pricing | Support ticket keyword detection | Flag for competitive counter-offer via sales |
| CH-005 | Non-payment (first occurrence) | Billing system | Personalised call from account manager before formal arrears process |

---

## 16. Arlan Backstop Channel Rules

> **⚠️ STRATEGIC:** The Arlan backstop channel ensures CircleTel never loses a customer entirely. If a prospect cannot be won on SkyFibre SMB pricing, the deal is redirected to MTN Business via the Arlan partnership at 30% commission.

### 16.1 Eligibility for Arlan Channel Redirect

| Rule ID | Rule | Condition | Action |
|---------|------|-----------|--------|
| AR-001 | Primary sale attempt required first | Sales team MUST attempt SkyFibre SMB sale before offering Arlan | Documented in CRM; minimum one SkyFibre quote presented |
| AR-002 | Price objection threshold | Customer explicitly rejects all SkyFibre tiers (minimum R1 299) | Sales may offer Arlan channel |
| AR-003 | Budget constraint confirmed | Customer's stated budget is below R1 299/month | Sales may offer Arlan channel directly |
| AR-004 | Credit check failure redirect | Customer fails credit check (CE-023) and cannot pay deposit | Redirect to Arlan channel (MTN handles own credit assessment) |
| AR-005 | Coverage failure redirect | Customer site has no Tarana G1 coverage but has MTN 5G/LTE | Redirect to Arlan channel for MTN Business 5G |

### 16.2 Arlan Channel Commercial Rules

| Rule ID | Rule | Detail |
|---------|------|--------|
| AR-010 | Commission structure | CircleTel receives 30% of Arlan's MTN commission (per Arlan Sales Agreement Clause 1.1) |
| AR-011 | Commission basis | Net subscription fees excluding handsets, itemised billing, once-off charges, and VAT |
| AR-012 | Customer attribution | Permanent attribution per Arlan Agreement Clause 7.1 — customer belongs to CircleTel regardless of future activity |
| AR-013 | Upsell obligation | Every Arlan-channel customer must be flagged for managed services cross-sell within 90 days of activation |
| AR-014 | CRM tracking | All Arlan-channel customers must be recorded in CircleTel CRM with "Arlan Backstop" tag |
| AR-015 | Non-circumvention | CircleTel must not bypass Arlan and deal with MTN directly for these customers (24-month non-circumvention clause) |

---

## 17. Partner & Reseller Rules

### 17.1 Partner Eligibility

| Rule ID | Rule | Condition |
|---------|------|-----------|
| PA-001 | Partner must complete technical certification | Before making first sale |
| PA-002 | Partner must maintain customer satisfaction ≥ 4.0/5.0 | Measured quarterly; below threshold triggers remediation plan |
| PA-003 | Partner must adhere to CircleTel brand guidelines | Use of approved materials only; no custom pricing without approval |
| PA-004 | Partner cannot offer discounts beyond their tier allowance | Authorised: 0%; Gold: 0%; Platinum: up to 5% on modules only with approval |

### 17.2 Partner Commission Rules

| Rule ID | Partner Tier | Upfront Commission | Recurring Commission | Clawback |
|---------|-------------|-------------------|---------------------|----------|
| PA-010 | Authorised Reseller | 15% of first MRC | None | Full clawback if customer cancels within 3 months |
| PA-011 | Gold Partner | 20% of first MRC | 10% recurring for 12 months | Full clawback if customer cancels within 3 months; pro-rata clawback months 4–6 |
| PA-012 | Platinum Partner | 25% of first MRC | 15% recurring for 24 months | Full clawback if customer cancels within 3 months; pro-rata clawback months 4–6 |
| PA-013 | Commission payment | By 25th of month following activation | Subject to customer payment received by CircleTel | N/A |

---

## 18. Regulatory & Compliance Policies

| Rule ID | Regulation | Requirement | CircleTel Compliance |
|---------|-----------|-------------|---------------------|
| RC-001 | ICASA I-ECS Licence | Required for provision of internet access services | Licence held: File No. [per ICASA register] |
| RC-002 | FICA (Act 38/2001) | Customer identification and verification before service activation | KYC process embedded in onboarding (CE-010 to CE-016) |
| RC-003 | POPIA (Act 4/2013) | Lawful processing of personal information; data minimisation; breach notification | Privacy policy on all contracts; data retained minimum 5 years post-termination |
| RC-004 | CPA (Act 68/2008) | Cooling-off period, fixed-term rules, service quality, cancellation rights | Embedded in contract terms (CT-001 to CT-003) and cancellation (CN-001 to CN-006) |
| RC-005 | ECA (Act 36/2005) | Electronic communications regulatory compliance | Compliance with ICASA regulations and licence conditions |
| RC-006 | VAT Act | VAT registration, invoicing, and reporting | CircleTel registered VAT vendor; 15% VAT on all invoices |

---

## 19. Exception Handling & Escalation

### 19.1 Exception Authority Matrix

| Exception Type | First Level | Second Level | Final Authority |
|---------------|------------|-------------|-----------------|
| Pricing exception (below standard rates) | Sales Director | CFO | MD |
| Credit vetting override | Finance Manager | CFO | MD |
| SLA exception (custom terms) | Operations Manager | CTO | MD |
| Contract term exception | Sales Director | CFO | MD |
| AUP violation dispute | NOC Manager | CTO | MD |
| Partner commission exception | Partner Manager | Sales Director | CFO |
| Arlan channel authorisation | Sales Manager | Sales Director | Automatic if criteria met (AR-001 to AR-005) |

### 19.2 Escalation Timelines

| Escalation Level | Response Time | Owner |
|-----------------|--------------|-------|
| Level 1 (Operational) | 4 business hours | Relevant department manager |
| Level 2 (Director) | 1 business day | Sales Director / CTO / CFO |
| Level 3 (Executive) | 2 business days | MD |

---

## 20. Appendix: Decision Trees

### 20.1 New Customer Qualification

```
START: New lead received
  │
  ├─ Is the applicant a registered business entity?
  │   ├─ NO → Redirect to SkyFibre Residential / UmojaLink
  │   └─ YES ↓
  │
  ├─ Is the address within MTN Tarana G1 coverage?
  │   ├─ NO → Cross-sell HomeFibreConnect / BizFibreConnect / Arlan 5G
  │   ├─ MARGINAL → Schedule site survey first
  │   └─ YES ↓
  │
  ├─ Does the customer require symmetrical speeds?
  │   ├─ YES → Redirect to BizFibreConnect (DFA fibre)
  │   └─ NO ↓
  │
  ├─ Can the customer afford ≥ R1 299/month?
  │   ├─ NO → Offer Arlan channel (MTN Business at R999)
  │   └─ YES ↓
  │
  ├─ Credit check result?
  │   ├─ FAIL → 12-month contract + 2-month deposit OR Arlan channel
  │   ├─ MARGINAL → 3-month prepay OR debit order mandate
  │   └─ PASS ↓
  │
  └─ QUALIFIED → Proceed to product configuration and contract signing
```

### 20.2 Price Objection Handling

```
START: Customer raises price objection (e.g. "MTN is R999")
  │
  ├─ Present value differentiation (no FUP, static IP, no lock-in, SLA, account manager)
  │   ├─ Customer accepts R1 299–R1 899 → CLOSE (SkyFibre SMB)
  │   └─ Customer rejects ↓
  │
  ├─ Offer modular approach: "Only pay for what you need"
  │   ├─ Customer accepts base-only at R1 299–R1 499 → CLOSE (SkyFibre SMB base)
  │   └─ Customer rejects ↓
  │
  ├─ Customer insists on ≤ R999?
  │   ├─ YES → Offer Arlan backstop channel (MTN Business at R999)
  │   │         ├─ Flag for managed services upsell in 90 days
  │   │         └─ CLOSE (Arlan channel)
  │   └─ Customer walks → Log lost deal with reason code; review in 90 days
```

### 20.3 Module Selection Validation

```
START: Customer selects module(s)
  │
  ├─ Does customer have an active SkyFibre SMB base tier?
  │   ├─ NO → BLOCK — modules cannot be sold standalone
  │   └─ YES ↓
  │
  ├─ FOR EACH selected module:
  │   ├─ Check prerequisites (MD-001 to MD-012)
  │   ├─ Check conflicts (MD-020 to MD-025)
  │   │   ├─ CONFLICT detected → Alert sales; remove conflicting module
  │   │   └─ NO CONFLICT ↓
  │   └─ Check dependencies
  │       ├─ DEPENDENCY unmet → Alert sales; add required dependency OR block
  │       └─ DEPENDENCY met ↓
  │
  └─ ALL modules validated → Generate quote with itemised pricing
```

---

**END OF DOCUMENT**

*CircleTel (Pty) Ltd — A member of the New Generation Group*
*"Connecting Today, Creating Tomorrow"*
