# WorkConnect™ SOHO — Business Rules Document (BRD)

## Eligibility Logic, Workflow Rules & Conditional Policies

---

| Field | Value |
|---|---|
| **Document Reference** | CT-BRD-WORKCONNECT-2026-001 |
| **Version** | 1.0 |
| **Effective Date** | 01 March 2026 |
| **Classification** | Confidential — Internal Use |
| **Locale** | en-ZA (South African English) |
| **Prepared By** | CircleTel Product Strategy |
| **Source Documents** | WorkConnect SOHO Portfolio v1.1, SkyFibre FUP Framework, MTN FWB Commercial Schedule (July 2025), MTN FTTH Wholesale Areas, Hardware Cost Register v1.2, ICASA Licence Register v1.0, CHANGE_LOG_27_Feb_2026 |
| **Supersedes** | N/A — First issue |

---

## Version Control

| Version | Date | Author | Changes | Status |
|---|---|---|---|---|
| 1.0 | 01 March 2026 | CircleTel Product Strategy / Claude AI | Initial BRD for WorkConnect SOHO product line aligned to Portfolio v1.1, incorporating corrected Tarana G1 4:1 asymmetric speed profiles | **CURRENT** |

---

## Table of Contents

1. Purpose & Scope
2. Definitions & Abbreviations
3. Customer Eligibility Rules
4. Coverage & Technical Eligibility
5. Technology Selection Rules
6. Product Selection Rules
7. Add-On Eligibility & Dependency Logic
8. Pricing & Discount Rules
9. Billing & Payment Rules
10. Contract & Commitment Rules
11. Credit Vetting & Onboarding Workflow
12. Provisioning & Installation Workflow
13. Support & SLA Entitlement Rules
14. Fair Usage & Traffic Management Policies
15. Upgrade, Downgrade & Migration Rules
16. Cancellation & Churn Policies
17. Cross-Sell & Cannibalisation Guard Rails
18. Partner & Reseller Rules
19. Regulatory & Compliance Policies
20. Exception Handling & Escalation
21. Appendix: Decision Trees

---

## 1. Purpose & Scope

This Business Rules Document (BRD) codifies every eligibility check, workflow trigger, conditional policy, and decision rule that governs the WorkConnect™ SOHO product line from lead qualification through to service termination. It is the authoritative operational reference for sales, provisioning, billing, support, and compliance teams.

**Scope:** All WorkConnect base tiers (Starter, Plus, Pro) delivered across all supported technologies (MTN Tarana G1 FWB, MTN FTTH, MTN 5G, MTN LTE) and all optional add-ons (Static IP, Cloud Backup Boost, LTE Failover, Premium Router Upgrade, Additional Email Accounts, Microsoft 365 Basic).

**Out of scope:** SkyFibre SMB, SkyFibre Residential, HomeFibreConnect (MTN FTTH Residential), BizFibreConnect (DFA BIA), UmojaLink, AirLink FWA, ParkConnect DUNE, CircleConnect IoT, EduConnect, and Managed IT Services — each governed by separate BRDs.

**Key Design Principle:** WorkConnect is a technology-agnostic product line. The customer selects a speed tier; CircleTel determines the optimal underlying delivery technology based on coverage at the customer's address. This BRD governs rules across all delivery technologies.

---

## 2. Definitions & Abbreviations

| Term | Definition |
|---|---|
| **Base Tier** | The core connectivity service (Starter, Plus, or Pro) including VoIP QoS, cloud backup, email accounts, and router |
| **Add-On** | An independently priced optional service layered onto a base tier |
| **SOHO** | Small Office / Home Office — individuals and micro-businesses (1–5 users) operating from residential or small commercial premises |
| **WFH** | Work From Home — employed person working remotely |
| **MRC** | Monthly Recurring Charge (excl. VAT unless stated) |
| **NRC** | Non-Recurring Charge (once-off) |
| **MSC** | Minimum Spend Commitment — contractual minimum payable to MTN |
| **FUP** | Fair Usage Policy |
| **AUP** | Acceptable Usage Policy |
| **QoS** | Quality of Service — traffic prioritisation and shaping |
| **BSS** | Business Support System (AgilityGIS) |
| **CPE** | Customer Premises Equipment (router, ONT) |
| **RN** | Tarana Remote Node (outdoor FWB unit) |
| **ONT** | Optical Network Terminal (FTTH indoor unit) |
| **FWB** | Fixed Wireless Broadband (MTN Tarana G1) |
| **FTTH** | Fibre to the Home (MTN/DFA GPON network) |
| **DL:UL** | Download-to-Upload speed ratio |
| **CPA** | Consumer Protection Act 68 of 2008 |
| **ECA** | Electronic Communications Act 36 of 2005 |
| **FICA** | Financial Intelligence Centre Act 38 of 2001 |
| **POPIA** | Protection of Personal Information Act 4 of 2013 |
| **ARPU** | Average Revenue Per User |
| **CAC** | Customer Acquisition Cost |

---

## 3. Customer Eligibility Rules

### 3.1 Entity Type Eligibility

WorkConnect targets SOHO customers. Unlike SkyFibre SMB, business registration is NOT a mandatory requirement. Natural persons (individuals) are eligible.

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| WC-CE-001 | Natural person (individual) | South African citizen or permanent resident, 18 years or older | ELIGIBLE — proceed to coverage check |
| WC-CE-002 | Sole proprietor / freelancer | Individual operating unregistered business | ELIGIBLE — proceed to coverage check |
| WC-CE-003 | Registered micro-business | Registered entity (Pty Ltd, CC, sole proprietor, NPC) with ≤ 5 employees | ELIGIBLE — proceed to coverage check |
| WC-CE-004 | Foreign national with valid visa | Holder of valid SA work permit, critical skills visa, or Digital Nomad Visa | ELIGIBLE — proceed to coverage check; requires passport + visa documentation |
| WC-CE-005 | Registered business > 5 employees | Established SME or larger entity | REDIRECT to SkyFibre SMB (R1,299–R1,899/month) or BizFibreConnect |
| WC-CE-006 | Consumer seeking residential-only internet | No WFH or business activity; purely entertainment/personal use | REDIRECT to HomeFibreConnect (FTTH) or SkyFibre Home (FWA) |
| WC-CE-007 | Minor (under 18) | Applicant younger than 18 years of age | REJECT — legal guardian must apply |
| WC-CE-008 | Government entity | National, provincial, or local government department/SOE | REDIRECT to SkyFibre SMB or BizFibreConnect — tender/procurement compliance required |

### 3.2 Qualification Questions (Sales Script)

The following questions MUST be asked during initial sales engagement to determine product fit:

| Rule ID | Question | If YES | If NO |
|---|---|---|---|
| WC-CE-010 | "Do you work from home, freelance, or run a small business from home?" | ELIGIBLE for WorkConnect | Explore HomeFibreConnect or SkyFibre Home |
| WC-CE-011 | "Do you have more than 5 people in your team?" | REDIRECT to SkyFibre SMB | Continue with WorkConnect |
| WC-CE-012 | "Do you need a formal SLA with guaranteed uptime and service credits?" | REDIRECT to SkyFibre SMB (Enhanced/Premium SLA) | Continue with WorkConnect (service-level targets, not formal SLAs) |
| WC-CE-013 | "Do you need guaranteed symmetrical upload speeds?" | Prioritise FTTH delivery; if unavailable, REDIRECT to BizFibreConnect | Continue with WorkConnect (disclose technology-dependent upload speeds) |
| WC-CE-014 | "Is your budget below R799/month?" | REDIRECT to HomeFibreConnect Starter (R799 / 20 Mbps) or SkyFibre Home | Continue with WorkConnect |

### 3.3 Required Documentation

| Rule ID | Document | Required? | Validation |
|---|---|---|---|
| WC-CE-020 | South African ID document or valid passport | Mandatory | FICA requirement — must be legible and current |
| WC-CE-021 | Proof of residential address | Mandatory | Utility bill, rates account, lease agreement, or bank statement — not older than 3 months |
| WC-CE-022 | Visa documentation (foreign nationals) | Conditional | Required for non-SA citizens — valid work permit, critical skills visa, or Digital Nomad Visa |
| WC-CE-023 | Company registration (CIPC) | Optional | Only required if customer requests business invoicing |
| WC-CE-024 | VAT registration certificate | Optional | Only required if customer requests VAT invoice |
| WC-CE-025 | Bank account confirmation | Conditional | Required if paying by debit order — bank-stamped letter or first page of bank statement |

### 3.4 Credit Eligibility

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| WC-CE-030 | Credit check required | All new customers on month-to-month contracts | Run credit bureau check via TransUnion/Experian |
| WC-CE-031 | Credit score PASS | Score ≥ 580 (TransUnion CPA score) | Proceed to provisioning |
| WC-CE-032 | Credit score MARGINAL | Score 450–579 | Proceed with CONDITION: require debit order mandate OR 2-month upfront payment |
| WC-CE-033 | Credit score FAIL | Score < 450 | Offer 12-month contract with 1-month deposit OR redirect to HomeFibreConnect (lower commitment) |
| WC-CE-034 | Credit check exemption — upfront payment | Customer pays 6 or 12 months upfront | Credit check WAIVED |
| WC-CE-035 | Credit check exemption — existing customer | Customer has active CircleTel service with zero arrears for ≥ 3 months | Credit check WAIVED for WorkConnect |
| WC-CE-036 | Credit threshold lower than SkyFibre SMB | WorkConnect minimum MRC (R799) is lower risk than SMB (R1,299) | Credit score threshold set at 580 (vs 600 for SkyFibre SMB) |

---

## 4. Coverage & Technical Eligibility

### 4.1 Multi-Technology Coverage Check

WorkConnect is technology-agnostic. Coverage checks must be performed across all supported technologies in priority order.

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| WC-TC-001 | Multi-technology coverage check mandatory | ALL new WorkConnect orders | Run coverage checks across FTTH, FWB, 5G, and LTE in priority order (see Section 5) |
| WC-TC-002 | Coverage CONFIRMED on at least one technology | Address returns positive result on ≥ 1 technology | Proceed to technology selection (Section 5) |
| WC-TC-003 | Coverage NEGATIVE on all technologies | No technology available at address | ADD to waitlist; notify customer when coverage becomes available; cross-sell MTN LTE prepaid as interim |
| WC-TC-004 | Coverage MARGINAL (FWB) | FWB coverage flagged as "possible" or fringe | Schedule site survey with signal test BEFORE customer commitment |
| WC-TC-005 | FTTH coverage check | Check MTN FTTH Wholesale Areas (37 sites) | If available, flag as FTTH-eligible; proceed to technology selection |
| WC-TC-006 | FWB coverage check | Check MTN Tarana G1 coverage (6 million homes passed) | If available, flag as FWB-eligible; proceed to technology selection |
| WC-TC-007 | 5G coverage check | Check MTN 5G fixed wireless coverage (metro areas) | If available AND tier ≤ Plus, flag as 5G-eligible |
| WC-TC-008 | LTE coverage check | Check MTN LTE-A coverage (national) | If available AND tier = Starter, flag as LTE-eligible |

### 4.2 Site Technical Requirements — FWB (Tarana)

| Rule ID | Requirement | Condition | Action if NOT met |
|---|---|---|---|
| WC-TC-010 | Line of sight to MTN Tarana base station | Within 10 km radius | Installation CANNOT proceed — attempt alternative mounting; if impossible, fall back to next technology |
| WC-TC-011 | Minimum signal strength | ≥ −75 dBm measured at installation point | Installation CANNOT proceed — attempt alternative mounting; if still below threshold, fall back to next technology |
| WC-TC-012 | Suitable outdoor mounting location | Roof, wall, or balcony mount possible for Tarana RN device | Assess alternative mounting; if impossible, fall back to next technology |
| WC-TC-013 | Power outlet proximity | Mains power within 30 m of installation point | Customer must arrange power extension BEFORE installation |
| WC-TC-014 | Ethernet routing path | Indoor cable route from RN PoE injector to router location | Maximum 100 m Cat6 run |
| WC-TC-015 | Landlord/body corporate consent | If customer rents or is in a sectional title complex | Written consent from landlord or body corporate MUST be obtained before installation; CircleTel provides consent template |

### 4.3 Site Technical Requirements — FTTH

| Rule ID | Requirement | Condition | Action if NOT met |
|---|---|---|---|
| WC-TC-020 | Fibre infrastructure present at address | ONT box or fibre drop cable available | If no fibre infrastructure, order fibre installation via MTN Wholesale; lead time 5–15 business days |
| WC-TC-021 | Active ONT or new ONT required | Check if existing ONT is compatible | Provision new ONT if none exists (cost included in installation) |
| WC-TC-022 | Indoor cable route for ONT | Suitable location for ONT placement | Customer premises wiring is customer responsibility beyond ONT/router |

### 4.4 Site Technical Requirements — 5G / LTE

| Rule ID | Requirement | Condition | Action if NOT met |
|---|---|---|---|
| WC-TC-030 | 5G/LTE signal confirmation | Signal quality must support target speed tier | If signal insufficient, fall back to FWB or LTE |
| WC-TC-031 | Window or external placement for CPE | 5G/LTE CPE must be placed near a window or externally mounted | Customer must ensure suitable placement |
| WC-TC-032 | Power outlet proximity | Mains power within 3 m of CPE placement | Customer must arrange power extension |

### 4.5 Site Survey Outcome

| Rule ID | Outcome | Action |
|---|---|---|
| WC-TC-040 | PASS — all requirements met on selected technology | Proceed to installation scheduling |
| WC-TC-041 | CONDITIONAL PASS — minor remediation required | Installation scheduled subject to customer completing remediation within 10 business days |
| WC-TC-042 | FAIL on primary technology — fallback available | Attempt provisioning on next-priority technology per Section 5 |
| WC-TC-043 | FAIL on all technologies | Service cannot be delivered — issue formal notification; add to waitlist; cross-sell MTN LTE prepaid as interim |

---

## 5. Technology Selection Rules

### 5.1 Technology Priority Matrix

The delivery technology is determined by CircleTel based on coverage availability and customer requirements. The customer does NOT choose the technology — they choose a speed tier, and CircleTel delivers on the best available technology.

| Rule ID | Priority | Technology | Condition | Override |
|---|---|---|---|---|
| WC-TS-001 | 1st (highest) | MTN FTTH | FTTH coverage confirmed at address | ALWAYS use FTTH if available — symmetrical speeds, lowest churn, best customer experience |
| WC-TS-002 | 2nd | MTN Tarana G1 FWB | FWB coverage confirmed at address AND FTTH NOT available | Default delivery technology for widest coverage |
| WC-TS-003 | 3rd | MTN 5G Fixed Wireless | 5G coverage confirmed AND FTTH/FWB NOT available AND tier ≤ Plus | 5G upload speeds are variable and best-effort — customer MUST be informed |
| WC-TS-004 | 4th (lowest) | MTN LTE-A Fixed Wireless | LTE coverage confirmed AND no other technology available AND tier = Starter only | LTE speeds are variable — Starter tier only; Plus/Pro NOT available on LTE |

### 5.2 Technology Override Rules

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| WC-TS-010 | Upload-sensitive customer override | Customer is a content creator, live streamer, or media professional requiring high upload speeds | PRIORITISE FTTH regardless of other availability; if FTTH unavailable, disclose FWB 4:1 limitation and offer BizFibreConnect as alternative |
| WC-TS-011 | Customer requests specific technology | Customer explicitly requests FTTH over FWB | Accommodate if FTTH is available at address; if not, explain technology-agnostic model |
| WC-TS-012 | FWB margin preference | Both FTTH and FWB available at address; customer has no upload-sensitive requirement | Sales MAY recommend FWB (higher margin) but MUST disclose FTTH availability and symmetrical advantage |
| WC-TS-013 | Pro tier on LTE blocked | Customer selects WorkConnect Pro (200 Mbps) | LTE delivery is BLOCKED for Pro tier — LTE cannot reliably deliver 200 Mbps; offer FWB or FTTH only |
| WC-TS-014 | Plus tier on LTE restricted | Customer selects WorkConnect Plus (100 Mbps) | LTE delivery is RESTRICTED with mandatory disclaimer: "Speeds may vary and are subject to network congestion; typical download speeds 40–80 Mbps on LTE" |

### 5.3 Speed Profile Disclosure (Mandatory)

| Rule ID | Rule | Enforcement |
|---|---|---|
| WC-TS-020 | All FWB speeds are 4:1 asymmetrical (DL:UL) | Sales team MUST disclose to every prospect before contract signing |
| WC-TS-021 | FTTH speeds are symmetrical | The term "symmetrical" may ONLY be used when referring to FTTH delivery |
| WC-TS-022 | 5G/LTE speeds are best-effort and variable | Sales team MUST disclose variability; typical upload is 10–30% of download |
| WC-TS-023 | Upload speed must be stated explicitly | Quotes and contracts MUST state BOTH download AND upload speeds (e.g. "100/25 Mbps" for FWB; "100/100 Mbps" for FTTH) |
| WC-TS-024 | No "guaranteed" speed claims on 5G/LTE | Marketing materials, quotes, and verbal representations MUST use "up to" for 5G/LTE speeds |
| WC-TS-025 | Technology disclosure on contract | The delivery technology and its speed characteristics MUST be stated on the customer contract |

### 5.4 Technology-Specific Speed Mapping

| WorkConnect Tier | FTTH Speed | FWB (Tarana) Speed | 5G Speed | LTE Speed |
|---|---|---|---|---|
| Starter (R799) | 50/50 Mbps (symmetrical) | 50/12.5 Mbps (4:1) | ~50/10 Mbps (best-effort) | ~30/8 Mbps (best-effort) |
| Plus (R1,099) | 200/200 Mbps* (symmetrical) | 100/25 Mbps (4:1) | ~100/20 Mbps (best-effort) | ~60/15 Mbps (restricted, disclaimer required) |
| Pro (R1,499) | 500/500 Mbps** (symmetrical) | 200/50 Mbps (4:1) | NOT AVAILABLE on 5G | NOT AVAILABLE on LTE |

*FTTH Plus: No 100 Mbps wholesale tier exists — customer receives 200 Mbps symmetrical FTTH at the 100 Mbps price point (over-provision strategy).
**FTTH Pro: Customer receives 500 Mbps symmetrical FTTH — best available tier above 200 Mbps.

---

## 6. Product Selection Rules

### 6.1 Base Tier Selection

| Rule ID | Rule | Condition | Assigned Tier |
|---|---|---|---|
| WC-PS-001 | Entry-level freelancer / WFH (1–2 users) | Budget-conscious, basic video calls, email, browsing | WorkConnect Starter (R799/month) |
| WC-PS-002 | Active remote worker / micro-business (2–4 users) | Regular video conferencing, VPN usage, moderate file transfers | WorkConnect Plus (R1,099/month) |
| WC-PS-003 | Power user / content creator / multi-user SOHO (3–5 users) | 4K video uploads, live streaming, multiple VPN tunnels, heavy cloud usage | WorkConnect Pro (R1,499/month) |
| WC-PS-004 | Customer needs exceed WorkConnect Pro | Requires > 200 Mbps, dedicated line, 24/7 support, enterprise SLA | REDIRECT to SkyFibre SMB (R1,299–R1,899) or BizFibreConnect |
| WC-PS-005 | Customer budget < R799/month | Cannot afford minimum WorkConnect tier | REDIRECT to HomeFibreConnect Starter (R799 / 20 Mbps FTTH) or SkyFibre Home |
| WC-PS-006 | Customer already on HomeFibreConnect | Existing residential customer enquiring about WFH improvement | UPSELL to WorkConnect — emphasise VoIP QoS, cloud backup, business router, extended support |

### 6.2 Tier Feature Summary (Reference)

| Feature | Starter (R799) | Plus (R1,099) | Pro (R1,499) |
|---|---|---|---|
| Download Speed | 50 Mbps | 100 Mbps | 200 Mbps |
| Upload Speed (FWB) | 12.5 Mbps | 25 Mbps | 50 Mbps |
| Upload Speed (FTTH) | 50 Mbps | 200 Mbps* | 500 Mbps** |
| Data | Uncapped, no FUP | Uncapped, no FUP | Uncapped, no FUP |
| VoIP QoS | Included | Included | Included |
| Cloud Backup | 25 GB | 50 GB | 100 GB |
| Email Accounts | 2 | 5 | 10 |
| Static IP | Add-on (R99/month) | Add-on (R99/month) | Included |
| VPN Tunnels | 3 concurrent | 3 concurrent | 5 concurrent |
| Router | Reyee RG-EW1300G | Reyee RG-EG105GW | Reyee RG-EG105GW |
| Support Hours | Mon–Sat, 07:00–19:00 | Mon–Sat, 07:00–19:00 | Mon–Sat, 07:00–19:00 + WhatsApp priority |
| Response Time | 12 business hours | 8 business hours | 4 business hours |
| Uptime Target | 99.0% (target, no SLA) | 99.0% (target, no SLA) | 99.5% (target with credits) |
| On-Site Visits | Chargeable (R500) | 1 free per year | 2 free per year |
| Installation | R900 (amortised) or FREE on 24-month | R900 (amortised) or FREE on 24-month | FREE |
| Contract | Month-to-month or 12/24 months | Month-to-month or 12/24 months | Month-to-month or 12/24 months |

---

## 7. Add-On Eligibility & Dependency Logic

### 7.1 Add-On Prerequisite Rules

Every add-on requires an active WorkConnect base tier. No add-on may be sold standalone.

| Rule ID | Add-On | Monthly Price | Prerequisite | Dependency | Conflict |
|---|---|---|---|---|---|
| WC-AO-001 | Static IP | R99/month | Active WorkConnect Starter or Plus tier | None | N/A on Pro tier (already included) |
| WC-AO-002 | Additional Static IPs | R99/each/month | Active WorkConnect base tier + existing Static IP (included or add-on) | Requires at least 1 static IP active | Maximum 4 additional IPs per service |
| WC-AO-003 | Cloud Backup Boost (+100 GB) | R99/month | Active WorkConnect base tier | None | Only 1 Backup Boost per service (total: 125–200 GB depending on tier) |
| WC-AO-004 | LTE Failover | R299/month | Active WorkConnect base tier on FWB or FTTH | Requires MTN LTE coverage at site | NOT applicable to services already delivered on LTE/5G |
| WC-AO-005 | Premium Router Upgrade | R199 once-off | Active WorkConnect base tier | Swaps current router for Reyee RG-EG105G-P (PoE, 4 ports) | Only available on Plus and Pro tiers (Starter router is WiFi-only, upgrade path is to Plus tier) |
| WC-AO-006 | Additional Email Accounts | R15/account/month | Active WorkConnect base tier | Beyond included allocation (2/5/10) | Maximum 20 accounts per service |
| WC-AO-007 | Microsoft 365 Basic | R149/user/month | Active WorkConnect base tier | None | Provisioned via Microsoft CSP partnership |

### 7.2 Add-On Combination Rules

| Rule ID | Rule | Logic |
|---|---|---|
| WC-AO-010 | Static IP redundancy on Pro tier | `IF tier = Pro THEN Static_IP_AddOn = blocked` (already included); Additional Static IPs are permitted |
| WC-AO-011 | Maximum one Cloud Backup Boost per service | `IF Backup_Boost = active THEN additional Backup_Boost = blocked` |
| WC-AO-012 | LTE Failover requires non-LTE primary | `IF primary_technology = LTE OR primary_technology = 5G THEN LTE_Failover = blocked` |
| WC-AO-013 | Premium Router Upgrade tier restriction | `IF tier = Starter THEN Premium_Router_Upgrade = blocked` — Starter uses WiFi-only router; upgrade path is tier change |
| WC-AO-014 | All add-ons terminate if base tier terminates | `IF Base_Tier = cancelled THEN ALL active add-ons = auto-cancelled` |
| WC-AO-015 | Microsoft 365 survives tier change | `IF tier changes (upgrade/downgrade) THEN M365 subscription continues unchanged` |

---

## 8. Pricing & Discount Rules

### 8.1 Standard Pricing

| Rule ID | Item | Price (excl. VAT) | Notes |
|---|---|---|---|
| WC-PR-001 | WorkConnect Starter MRC | R799/month | All inclusive (connectivity + QoS + 25 GB backup + 2 emails + router) |
| WC-PR-002 | WorkConnect Plus MRC | R1,099/month | All inclusive (connectivity + QoS + 50 GB backup + 5 emails + router) |
| WC-PR-003 | WorkConnect Pro MRC | R1,499/month | All inclusive (connectivity + QoS + 100 GB backup + 10 emails + router + static IP) |
| WC-PR-004 | Installation fee (Starter/Plus) | R900 once-off OR R0 on 24-month contract | Amortised at R37.50/month over 24 months if month-to-month |
| WC-PR-005 | Installation fee (Pro) | R0 (free) | Included regardless of contract term |
| WC-PR-006 | All prices exclude VAT | VAT at 15% added to all charges | Invoices must show VAT separately per SARS requirements |

### 8.2 Discount Rules

| Rule ID | Rule | Condition | Maximum Discount | Authority |
|---|---|---|---|---|
| WC-PR-010 | No standard discounts | WorkConnect is a value-priced product | 0% — no discounts on standard MRC | N/A |
| WC-PR-011 | Multi-service discount | Customer has ≥ 2 active CircleTel services (e.g. WorkConnect + Managed IT) | 5% off WorkConnect MRC | Sales Director approval |
| WC-PR-012 | Annual prepayment discount | Customer pays 12 months upfront | 1 month free (effectively 8.3% discount) | Automatic — system applies |
| WC-PR-013 | Referral credit | Existing customer refers new WorkConnect customer who activates | R200 credit to referrer; R200 credit to new customer | Automatic — referral code validated at activation |
| WC-PR-014 | Promotional pricing | Time-limited launch offers | Maximum 10% off MRC for maximum 3 months | MD approval required; promotional pricing MUST have expiry date |
| WC-PR-015 | No pricing below cost floor | Discounted price must maintain positive contribution margin | Minimum MRC after discount: Starter R720, Plus R990, Pro R1,350 | CFO sign-off if exception required |

### 8.3 Price Escalation

| Rule ID | Rule | Detail |
|---|---|---|
| WC-PR-020 | Annual price review | Prices reviewed annually in April (aligned to MTN wholesale price revisions) |
| WC-PR-021 | Price increase notice | 30 calendar days' written notice before any price increase (CPA + ICASA requirement) |
| WC-PR-022 | Price increase cap | Maximum annual increase capped at CPI + 2% unless wholesale cost increase exceeds this |
| WC-PR-023 | Wholesale cost pass-through | If MTN wholesale prices increase, CircleTel may pass through the increase with 30 days' notice |
| WC-PR-024 | Customer right to cancel on increase | Customer may cancel without penalty within 20 business days of price increase notification (CPA Section 14) |

---

## 9. Billing & Payment Rules

### 9.1 Billing Cycle

| Rule ID | Rule | Detail |
|---|---|---|
| WC-BL-001 | Billing frequency | Monthly in advance |
| WC-BL-002 | Billing start date | From service activation date (PPPoE session confirmed UP or 5G/LTE connection active) |
| WC-BL-003 | Pro-rata first invoice | First month billed pro-rata from activation date to end of billing cycle |
| WC-BL-004 | Invoice generation | Invoices generated on 1st of each month via AgilityGIS BSS |
| WC-BL-005 | Payment due date | 7 calendar days from invoice date |
| WC-BL-006 | VAT treatment | All MRC and NRC amounts subject to 15% VAT; invoices must show VAT separately |

### 9.2 Payment Methods

| Rule ID | Method | Conditions |
|---|---|---|
| WC-BL-010 | Debit order | Preferred method; processed on 1st or 15th of month (customer choice) |
| WC-BL-011 | Credit card | Accepted; payment processing fee of 1% included in cost structure |
| WC-BL-012 | EFT (electronic funds transfer) | Accepted; customer must reference invoice number |
| WC-BL-013 | Cash deposit | NOT accepted for recurring billing; accepted for once-off installation fees only |
| WC-BL-014 | Upfront payment (6 or 12 months) | Accepted; must be received in full before service activation |

### 9.3 Payment Failure & Arrears

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| WC-BL-020 | First failed debit order | Debit order returned unpaid | Retry after 3 business days; send payment reminder via SMS + email |
| WC-BL-021 | Second failed payment | Payment still outstanding after retry | Send formal arrears notice; 7-day grace period commences |
| WC-BL-022 | 14 days overdue | Payment outstanding > 14 calendar days | Service throttled to 2 Mbps; customer notified via SMS + email |
| WC-BL-023 | 30 days overdue | Payment outstanding > 30 calendar days | Service suspended (no connectivity); customer must settle full arrears to restore |
| WC-BL-024 | 60 days overdue | Payment outstanding > 60 calendar days | Service terminated; router recovery initiated; account handed to collections |
| WC-BL-025 | Arrears interest | Outstanding amounts > 30 days | Interest charged at 2% per month on outstanding balance (disclosed in contract) |
| WC-BL-026 | Router recovery on default | Service terminated due to non-payment | CircleTel to recover router within 30 days; if not returned, R1,500 replacement fee charged |

---

## 10. Contract & Commitment Rules

### 10.1 Contract Types

| Rule ID | Contract Type | Term | Conditions |
|---|---|---|---|
| WC-CT-001 | Month-to-month | Rolling monthly, no fixed term | 30 calendar days' notice to cancel; installation fee of R900 applies (Starter/Plus) unless waived on promotion |
| WC-CT-002 | 12-month contract | 12-month fixed term | Installation fee amortised over term; early termination fee applies (see WC-CN-010) |
| WC-CT-003 | 24-month contract | 24-month fixed term | FREE installation; lowest effective monthly cost; early termination fee applies |
| WC-CT-004 | Contract auto-renewal | Fixed-term contract expires | Auto-converts to month-to-month at prevailing standard rate; customer notified 40 business days before expiry (CPA Section 14(2)(a)) |

### 10.2 Contract Documentation

| Rule ID | Rule | Detail |
|---|---|---|
| WC-CT-010 | Plain language | All contracts must be in plain language per CPA Section 22 |
| WC-CT-011 | Electronic signature | DocuSign or HelloSign accepted; must include timestamp and IP address |
| WC-CT-012 | Cooling-off period | 5 business days for transactions initiated by direct marketing (CPA Section 16); customer may cancel without penalty during this period |
| WC-CT-013 | Contract must state technology | The underlying delivery technology and its speed profile (including upload speeds) must be explicitly stated |
| WC-CT-014 | Contract must state all fees | MRC, installation fees, add-on fees, early termination fees, and router recovery fees must all be listed |

---

## 11. Credit Vetting & Onboarding Workflow

### 11.1 End-to-End Onboarding Process

```
STEP 1: Lead Qualification
  └─ Sales asks qualification questions (WC-CE-010 to WC-CE-014)
  └─ IF not SOHO profile → redirect per eligibility rules
  └─ IF SOHO profile confirmed → proceed

STEP 2: Multi-Technology Coverage Check
  └─ Run coverage checks: FTTH → FWB → 5G → LTE (WC-TC-001 to WC-TC-008)
  └─ IF NO coverage on any technology → add to waitlist (WC-TC-003)
  └─ IF FWB MARGINAL → schedule site survey (WC-TC-004)
  └─ IF CONFIRMED on ≥ 1 technology → proceed

STEP 3: Technology Selection
  └─ Apply technology priority matrix (WC-TS-001 to WC-TS-004)
  └─ Apply override rules if applicable (WC-TS-010 to WC-TS-013)
  └─ Disclose speed profile per selected technology (WC-TS-020 to WC-TS-025)

STEP 4: Product & Add-On Configuration
  └─ Customer selects base tier (WC-PS-001 to WC-PS-006)
  └─ System validates tier against technology (WC-TS-013, WC-TS-014)
  └─ Customer selects optional add-ons (WC-AO-001 to WC-AO-007)
  └─ System validates add-on dependencies and conflicts (WC-AO-010 to WC-AO-015)
  └─ Generate quote via AgilityGIS BSS

STEP 5: Documentation Collection
  └─ Collect all mandatory documents (WC-CE-020 to WC-CE-025)
  └─ Verify documents against FICA and POPIA requirements
  └─ IF incomplete → return to customer with checklist; 10 business day deadline

STEP 6: Credit Vetting
  └─ Run credit check (WC-CE-030 to WC-CE-036)
  └─ IF PASS → proceed
  └─ IF MARGINAL → apply conditions (debit order mandate or 2-month prepay)
  └─ IF FAIL → offer 12-month contract with 1-month deposit OR redirect

STEP 7: Contract Signing
  └─ Generate contract via BSS (contract type per WC-CT-001 to WC-CT-003)
  └─ Contract includes technology disclosure and speed profiles
  └─ Customer signs electronically or physically
  └─ CPA cooling-off period begins (5 business days for direct marketing)

STEP 8: Order Activation
  └─ Order entered into relevant provisioning system (MTN FWB / FTTH / 5G portal)
  └─ Site survey scheduled (if FWB and not already completed)
  └─ Installation date confirmed with customer (target: 5–10 business days)

STEP 9: Installation & Handover
  └─ Installation per Section 12 workflow
  └─ Service activated and tested (speed test, VoIP QoS validation)
  └─ Customer signs acceptance form
  └─ Billing commences from activation date (WC-BL-002)

STEP 10: Welcome & Onboarding
  └─ Welcome email sent (connection details, support contacts, cloud backup setup guide)
  └─ WhatsApp welcome message sent
  └─ Cloud backup service activated
  └─ Email accounts provisioned
  └─ Ruijie Cloud router provisioned with QoS template
```

---

## 12. Provisioning & Installation Workflow

### 12.1 Pre-Installation Rules

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| WC-IN-001 | Site survey mandatory (FWB) | All new FWB installations | Installer must verify signal (≥ −75 dBm), mounting location, and power before proceeding |
| WC-IN-002 | Site survey validity | Survey results valid for 30 calendar days | If installation not completed within 30 days, re-survey required |
| WC-IN-003 | Customer premises readiness | Power, indoor cable route, and mounting consent confirmed | Installation CANNOT proceed until customer confirms readiness |
| WC-IN-004 | Wholesale order placed | Order submitted to MTN Wholesale (FWB/FTTH/5G) | Installation cannot be scheduled until MTN confirms device availability |
| WC-IN-005 | Installation slot booking | Customer must confirm a 4-hour window | Morning (08:00–12:00) or afternoon (12:00–16:00), Mon–Fri; Saturday by arrangement (+R250 NRC) |
| WC-IN-006 | Landlord consent confirmed | If applicable per WC-TC-015 | Signed consent form must be on file before installation day |

### 12.2 Installation Process — FWB

| Step | Rule ID | Activity | Duration | Success Criteria |
|---|---|---|---|---|
| 1 | WC-IN-010 | Installer arrives; confirms customer ID | 5 min | Customer present and ID verified |
| 2 | WC-IN-011 | Mount Tarana RN outdoor unit | 45–90 min | Secure mounting; cable routed safely |
| 3 | WC-IN-012 | Run Ethernet from RN to router location | 15–30 min | Cat6 cable, max 100 m, neat routing |
| 4 | WC-IN-013 | Install and power router (Reyee RG-EW1300G or RG-EG105GW) | 10 min | Router powered on and connected |
| 5 | WC-IN-014 | Configure router via Ruijie Cloud | 10 min | QoS template applied, WiFi configured, VoIP prioritisation active |
| 6 | WC-IN-015 | Run speed test | 5 min | Download speed ≥ 90% of tier; upload speed consistent with technology profile |
| 7 | WC-IN-016 | Customer sign-off | 5 min | Customer signs digital acceptance form; photo of installation captured |

### 12.3 Installation Process — FTTH

| Step | Rule ID | Activity | Duration | Success Criteria |
|---|---|---|---|---|
| 1 | WC-IN-020 | Installer arrives; confirms customer ID | 5 min | Customer present and ID verified |
| 2 | WC-IN-021 | Install or activate ONT | 15–30 min | ONT powered and fibre light confirmed |
| 3 | WC-IN-022 | Connect router to ONT | 10 min | Ethernet from ONT to router |
| 4 | WC-IN-023 | Configure router via Ruijie Cloud | 10 min | QoS template applied, WiFi configured |
| 5 | WC-IN-024 | Run speed test (symmetrical) | 5 min | Download AND upload speed ≥ 90% of tier |
| 6 | WC-IN-025 | Customer sign-off | 5 min | Customer signs acceptance form |

### 12.4 Installation Process — 5G / LTE

| Step | Rule ID | Activity | Duration | Success Criteria |
|---|---|---|---|---|
| 1 | WC-IN-030 | Deliver and position 5G/LTE CPE | 15 min | CPE placed near window for optimal signal |
| 2 | WC-IN-031 | Power on CPE and verify connection | 10 min | Network registration confirmed; signal bars ≥ 3 |
| 3 | WC-IN-032 | Connect router to CPE | 10 min | Ethernet from CPE to router |
| 4 | WC-IN-033 | Configure router via Ruijie Cloud | 10 min | QoS template applied |
| 5 | WC-IN-034 | Run speed test | 5 min | Speeds within expected range for technology |
| 6 | WC-IN-035 | Customer sign-off with disclaimer | 5 min | Customer acknowledges variable speed nature of 5G/LTE delivery |

### 12.5 Post-Installation Actions

| Rule ID | Action | Trigger | System |
|---|---|---|---|
| WC-IN-040 | Activate PPPoE session (FWB/FTTH) | Installation complete | Echo SP BNG / Interstellio RADIUS |
| WC-IN-041 | Provision static IP (if applicable) | Pro tier or Static IP add-on active | RADIUS / BNG |
| WC-IN-042 | Provision Ruijie Cloud router | Installation complete | Ruijie Cloud API |
| WC-IN-043 | Activate cloud backup service | Installation complete | Cloud backup platform |
| WC-IN-044 | Create email accounts | Installation complete | Email hosting platform |
| WC-IN-045 | Send welcome pack | All post-installation actions confirmed | Notification service (email + WhatsApp) |
| WC-IN-046 | Start billing | PPPoE session confirmed UP (FWB/FTTH) or 5G/LTE connection active | AgilityGIS BSS |
| WC-IN-047 | Start router amortisation clock | Service activated | BSS — 24-month amortisation |

---

## 13. Support & SLA Entitlement Rules

### 13.1 Support Entitlements by Tier

| Rule ID | Aspect | Starter | Plus | Pro |
|---|---|---|---|---|
| WC-SL-001 | Support hours | Mon–Sat, 07:00–19:00 | Mon–Sat, 07:00–19:00 | Mon–Sat, 07:00–19:00 + WhatsApp priority |
| WC-SL-002 | Channels | Phone, Email, WhatsApp | Phone, Email, WhatsApp | Phone, Email, WhatsApp (priority queue) |
| WC-SL-003 | Response time | 12 business hours | 8 business hours | 4 business hours |
| WC-SL-004 | Remote diagnostics | Via Ruijie Cloud | Via Ruijie Cloud | Via Ruijie Cloud |
| WC-SL-005 | On-site visits | Chargeable (R500/visit) | 1 free per annum; thereafter R500 | 2 free per annum; thereafter R500 |
| WC-SL-006 | Account manager | None | None | Shared account manager |

### 13.2 Uptime Targets (NOT Formal SLAs)

| Rule ID | Rule | Tier | Detail |
|---|---|---|---|
| WC-SL-010 | WorkConnect Starter/Plus uptime target | Starter, Plus | 99.0% monthly uptime TARGET — this is a service-level target, NOT a contractual SLA; no service credits apply |
| WC-SL-011 | WorkConnect Pro uptime target with credits | Pro | 99.5% monthly uptime TARGET with service credits for extended outages |
| WC-SL-012 | Pro service credit calculation | Pro only | Credit = (downtime hours beyond target ÷ total hours in month) × MRC; capped at 50% of monthly MRC |
| WC-SL-013 | Service credit claim window | Pro only | Customer must submit claim within 30 calendar days of outage event |
| WC-SL-014 | Planned maintenance excluded | All tiers | Planned maintenance with ≥ 48 hours' notice is excluded from uptime calculations |
| WC-SL-015 | Force majeure excluded | All tiers | Load shedding, natural disasters, and upstream MTN outages are excluded from uptime calculations |
| WC-SL-016 | Formal SLA requires SkyFibre SMB | All tiers | Customers requiring contractual SLA (99.5%+ with penalties and guaranteed response times) must be REDIRECTED to SkyFibre SMB |

### 13.3 Escalation Path

```
Tier 1: WhatsApp / Phone Support → Remote diagnostics via Ruijie Cloud
    │
Tier 2: Technical Support → Router reconfiguration, QoS adjustment, MTN fault logging
    │
Tier 3: Network Operations → MTN wholesale escalation, BNG/ENNI issues
    │
Tier 4: Management Escalation → Account manager intervention (Pro tier only)
```

---

## 14. Fair Usage & Traffic Management Policies

### 14.1 FUP Position

| Rule ID | Rule | Detail |
|---|---|---|
| WC-FU-001 | WorkConnect is "truly uncapped with no FUP" | This is a primary differentiator; no hard data caps, no throttling based on usage volume |
| WC-FU-002 | No hard data caps | Customers are never hard-capped or disconnected for data usage |
| WC-FU-003 | Contention ratio | SOHO customers operate at 12:1 contention (between residential 35:1 and business 8:1) |
| WC-FU-004 | Network protection management | CircleTel reserves the right to apply temporary traffic management during extreme congestion events affecting > 20% of subscribers on a base node |

### 14.2 Traffic Classification Rules

| Rule ID | Traffic Type | Classification | Management Action |
|---|---|---|---|
| WC-FU-010 | VoIP, video conferencing (Zoom, Teams, Google Meet, WhatsApp) | PROTECTED — HIGHEST PRIORITY | Never throttled or deprioritised; QoS packet marking applied |
| WC-FU-011 | VPN connections (work VPN) | PROTECTED | Never throttled or deprioritised |
| WC-FU-012 | Banking and financial services | PROTECTED | Never throttled or deprioritised |
| WC-FU-013 | Remote Desktop Protocol (RDP, Citrix, TeamViewer) | PROTECTED (Pro tier) | Priority handling on Pro tier; standard on Starter/Plus |
| WC-FU-014 | Email and messaging | PROTECTED | Never throttled or deprioritised |
| WC-FU-015 | Cloud backup (WorkConnect included service) | MANAGED | Scheduled to run during off-peak hours (22:00–06:00) by default; customer can override |
| WC-FU-016 | Streaming (Netflix, YouTube, DSTV) | STANDARD | Normal priority; no specific management |
| WC-FU-017 | P2P / torrent traffic | MANAGED | May be shaped during peak hours (07:00–22:00) |
| WC-FU-018 | Bulk cloud uploads (non-backup) | STANDARD | Normal priority |
| WC-FU-019 | Online gaming | STANDARD | Normal priority |

### 14.3 Acceptable Usage Policy (AUP) Violations

| Rule ID | Violation | Severity | Action |
|---|---|---|---|
| WC-FU-020 | Running commercial servers (web, mail, game hosting) | Medium | First notice: written warning. Second: service restriction. Third: suspension with right to cancel |
| WC-FU-021 | Cryptocurrency mining | High | Immediate suspension pending investigation |
| WC-FU-022 | Reselling or sharing connection commercially | High | Immediate suspension; contract termination if confirmed |
| WC-FU-023 | Network attacks, scanning, or exploitation | Critical | Immediate termination; reported to SAPS and relevant CSIRT |
| WC-FU-024 | SPAM or bulk unsolicited email | High | Immediate suspension of email hosting; static IP blacklist review |
| WC-FU-025 | Illegal content distribution | Critical | Immediate termination; reported to relevant authorities |
| WC-FU-026 | Continuous 24/7 streaming or broadcasting | Low | Advisory notice only — this is legitimate for content creators on WorkConnect; no action unless causing network degradation |

---

## 15. Upgrade, Downgrade & Migration Rules

### 15.1 Upgrade Rules

| Rule ID | Upgrade Type | Conditions | Processing Time | Billing Impact |
|---|---|---|---|---|
| WC-UG-001 | Tier upgrade (e.g. Starter → Plus) | Customer requests; no contract restriction | Within 2 business days | New MRC from next billing cycle; pro-rata adjustment for current month |
| WC-UG-002 | Tier upgrade with router swap | Starter → Plus/Pro requires RG-EW1300G → RG-EG105GW | Installation visit required; new 24-month amortisation clock starts | Old router collected; new router amortisation begins |
| WC-UG-003 | Technology upgrade (e.g. FWB → FTTH) | FTTH coverage becomes available at customer's address | Customer must request; installation visit required | New technology activated; previous technology decommissioned; any equipment changes handled |
| WC-UG-004 | Add-on addition | Customer requests new add-on | Same business day (system-provisioned add-ons); next business day (hardware add-ons) | New add-on MRC from next billing cycle |
| WC-UG-005 | Migration from HomeFibreConnect | Existing HomeFibreConnect customer upgrades to WorkConnect | 2–5 business days; router swap required | New MRC from activation; HomeFibreConnect service cancelled; no double billing |
| WC-UG-006 | Migration from SkyFibre Home | Existing SkyFibre Home customer moves to WorkConnect | 2–5 business days; installation visit required | SkyFibre Home service cancelled on WorkConnect activation |

### 15.2 Downgrade Rules

| Rule ID | Downgrade Type | Conditions | Processing Time | Billing Impact |
|---|---|---|---|---|
| WC-DG-001 | Tier downgrade (e.g. Pro → Plus) | Customer requests; subject to contract term | Within 2 business days | Reduced MRC from next billing cycle |
| WC-DG-002 | Tier downgrade with feature loss | Downgrading causes loss of included features (e.g. Pro → Plus loses static IP, reduces backup from 100 GB to 50 GB) | Customer MUST be informed of all features lost before confirmation | Auto-cancel affected add-ons and included features |
| WC-DG-003 | Downgrade from Pro to Starter | Router swap NOT required (Starter can use RG-EG105GW if already installed) | Within 2 business days | MRC reduced; QoS profile updated remotely via Ruijie Cloud |
| WC-DG-004 | Downgrade during contract term | Customer on 12 or 24-month contract | ALLOWED but contract term and original tier's early termination conditions remain in effect | Reduced MRC applies; if MRC falls below contract minimum, original contract MRC applies |
| WC-DG-005 | Add-on removal | Customer requests add-on cancellation | Same business day; effective end of current billing month | Add-on MRC removed from next billing cycle |

### 15.3 Migration Rules (Between Product Lines)

| Rule ID | Migration Path | Conditions | Action |
|---|---|---|---|
| WC-MG-001 | WorkConnect → SkyFibre SMB | Customer's business grows beyond SOHO scale | New SkyFibre SMB provisioning; WorkConnect cancelled; no migration penalty |
| WC-MG-002 | WorkConnect → BizFibreConnect | Customer requires symmetrical DFA fibre | New BizFibreConnect provisioning; WorkConnect cancelled; DFA installation required |
| WC-MG-003 | WorkConnect → HomeFibreConnect | Customer no longer working from home; wants residential-only | Downgrade path; WorkConnect cancelled; HomeFibreConnect provisioned |
| WC-MG-004 | Any migration preserves customer history | Customer record, payment history, and support history retained | CRM record linked; new service instance created; old instance archived |

---

## 16. Cancellation & Churn Policies

### 16.1 Cancellation Rules

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| WC-CN-001 | Month-to-month cancellation | 30 calendar days' written notice | Service terminates at end of notice period; final invoice generated |
| WC-CN-002 | Fixed-term early cancellation | Customer cancels before contract expiry | Early termination fee applies (WC-CN-010) |
| WC-CN-003 | Cancellation notice methods | Email, written letter, or WhatsApp to designated cancellation channel | Cancellation MUST be acknowledged within 2 business days with reference number |
| WC-CN-004 | Verbal cancellation not accepted | Customer calls to cancel | Sales/support team must guide customer to submit written notice; verbal request alone is insufficient |
| WC-CN-005 | Cooling-off cancellation | Within CPA 5-business-day cooling-off period | Full refund of any payments; no penalty; router collected |
| WC-CN-006 | Service failure cancellation | CircleTel fails to deliver advertised service persistently (> 3 outages of > 24 hours in a 30-day period) | Customer may cancel without penalty per CPA Section 56 |
| WC-CN-007 | Price increase cancellation | Customer cancels within 20 business days of price increase notification | No early termination fee; CPA Section 14 applies |

### 16.2 Early Termination Fees

| Rule ID | Contract Type | Cancellation Month | Fee Calculation |
|---|---|---|---|
| WC-CN-010 | 12-month contract | Months 1–6 | 50% of remaining MRC payments |
| WC-CN-011 | 12-month contract | Months 7–11 | 25% of remaining MRC payments |
| WC-CN-012 | 24-month contract | Months 1–12 | 50% of remaining MRC payments |
| WC-CN-013 | 24-month contract | Months 13–23 | 25% of remaining MRC payments |
| WC-CN-014 | All contracts | Final month | No early termination fee |
| WC-CN-015 | CPA reasonableness test | All early terminations | Fee must not exceed a "reasonable" penalty per CPA Section 14; if challenged, CircleTel must demonstrate actual loss |

### 16.3 Equipment Recovery on Cancellation

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| WC-CN-020 | Router must be returned | All cancellations — router is CircleTel property | Customer must return router within 14 calendar days of service termination |
| WC-CN-021 | Router collection | CircleTel arranges collection OR customer delivers to designated drop-off | 1 free collection attempt; subsequent attempts chargeable at R250 |
| WC-CN-022 | Router not returned | Router not returned within 30 calendar days | R1,500 replacement fee charged to final account; debt recovery if unpaid |
| WC-CN-023 | Router damage | Router returned in damaged condition (beyond normal wear) | R500 damage surcharge; assessed by technical team |
| WC-CN-024 | ONT retention (FTTH) | FTTH services — ONT may be MTN-owned | Check ONT ownership; if CircleTel-owned, collect; if MTN-owned, leave in situ |

### 16.4 Churn Mitigation

| Rule ID | Rule | Trigger | Action |
|---|---|---|---|
| WC-CN-030 | Churn risk identification | Customer submits cancellation notice OR payment fails twice in succession | Flag account for churn mitigation intervention |
| WC-CN-031 | Retention call | Churn risk flagged | Contact customer within 2 business days to understand reason for churn |
| WC-CN-032 | Retention offer — downgrade | Customer cites cost as reason | Offer tier downgrade before cancellation |
| WC-CN-033 | Retention offer — credit | Customer cites service issue as reason | Offer 1-month service credit if outage documented |
| WC-CN-034 | Win-back campaign | Customer cancels and service terminates | Contact after 90 days with re-activation offer (waived installation, 1 month free) |
| WC-CN-035 | Churn analysis | Monthly | Report churn rate by tier, technology, tenure, and reason code; target < 5% monthly churn |

---

## 17. Cross-Sell & Cannibalisation Guard Rails

### 17.1 Product Line Boundaries

| Rule ID | Rule | Logic | Guard Rail |
|---|---|---|---|
| WC-XS-001 | WorkConnect vs HomeFibreConnect | WorkConnect includes business value-adds (QoS, backup, email, business router) that HomeFibreConnect does not | Sales must NOT downgrade a WorkConnect enquiry to HomeFibreConnect unless customer explicitly has no WFH/business use |
| WC-XS-002 | WorkConnect vs SkyFibre SMB | WorkConnect is for 1–5 users without formal SLA; SkyFibre SMB is for 5–50 users with full SLA | Sales must NOT sell WorkConnect to customers requiring formal SLA, 24/7 support, or enterprise features |
| WC-XS-003 | WorkConnect Starter vs HomeFibreConnect Plus | Both at similar price points (R799 vs R999) | Differentiate on VoIP QoS, cloud backup, business router, and extended support — NOT on speed alone |
| WC-XS-004 | WorkConnect Pro ceiling | WorkConnect Pro is the maximum SOHO offering at R1,499 | Customers needing more must be redirected to SkyFibre SMB; do NOT create custom WorkConnect tiers above Pro |

### 17.2 Upsell & Cross-Sell Paths

| Rule ID | Source Product | Trigger | Target Product |
|---|---|---|---|
| WC-XS-010 | HomeFibreConnect | Customer mentions WFH, video calls, VPN usage | WorkConnect (Starter or Plus) |
| WC-XS-011 | WorkConnect Starter | Customer reports frequent video call issues, needs more speed | WorkConnect Plus |
| WC-XS-012 | WorkConnect Plus | Customer requires static IP, more backup, higher speed | WorkConnect Pro |
| WC-XS-013 | WorkConnect Pro | Customer hiring staff, needing 24/7 support, formal SLA | SkyFibre SMB |
| WC-XS-014 | WorkConnect (any tier) | Customer asks about IT support, device management | Managed IT Services |
| WC-XS-015 | WorkConnect (any tier) | Customer asks about security, antivirus | CircleTel SafeGuard |

---

## 18. Partner & Reseller Rules

### 18.1 Partner Qualification

| Rule ID | Rule | Condition |
|---|---|---|
| WC-PA-001 | Partner must complete WorkConnect product training | Before making first sale |
| WC-PA-002 | Partner must maintain customer satisfaction ≥ 4.0/5.0 | Measured quarterly; below threshold triggers remediation plan |
| WC-PA-003 | Partner must adhere to CircleTel brand guidelines | Use of approved materials only; no custom pricing |
| WC-PA-004 | Co-working space partners | WeWork, Workshop17, Open, and similar co-working operators may be appointed as referral partners |
| WC-PA-005 | IT consultant partners | Independent IT consultants may refer clients; standard referral commission applies |

### 18.2 Partner Commission Rules

| Rule ID | Partner Type | Upfront Commission | Recurring Commission | Clawback |
|---|---|---|---|---|
| WC-PA-010 | Referral Partner (co-working, individual) | R200 per activated customer | None | Full clawback if customer cancels within 2 months |
| WC-PA-011 | Authorised Reseller | 15% of first MRC | None | Full clawback if customer cancels within 3 months |
| WC-PA-012 | Gold Partner | 20% of first MRC | 10% recurring for 12 months | Full clawback within 3 months; pro-rata months 4–6 |
| WC-PA-013 | Commission payment | By 25th of month following activation | Subject to customer payment received by CircleTel |

---

## 19. Regulatory & Compliance Policies

### 19.1 ICASA Compliance

| Rule ID | Rule | Detail |
|---|---|---|
| WC-RG-001 | Class ECS licence compliance | CircleTel operates under Class ECS Licence 0343/RE/CECS/MAR/2013 (national coverage); all WorkConnect services fall within this licence scope |
| WC-RG-002 | Advertising compliance | All advertising must comply with ICASA regulations: no misleading speed claims, speeds stated as "up to", no "unlimited" without qualification |
| WC-RG-003 | Technology-specific advertising | Advertisements must NOT claim "symmetrical speeds" unless specifically referring to FTTH delivery; FWB advertisements must disclose 4:1 DL:UL ratio |
| WC-RG-004 | Service change notice | 30 calendar days' written notice required for any changes affecting price, speed, or terms |
| WC-RG-005 | Customer complaints | Customers must be informed of their right to escalate unresolved complaints to ICASA |

### 19.2 CPA Compliance

| Rule ID | Rule | Detail |
|---|---|---|
| WC-RG-010 | Plain language contracts | All contracts in plain language per CPA Section 22 |
| WC-RG-011 | Cooling-off right | 5 business days for direct marketing transactions (CPA Section 16) |
| WC-RG-012 | Early termination right | Customers may cancel fixed-term contracts with 20 business days' notice; penalty limited to reasonable amount per CPA Section 14 |
| WC-RG-013 | Right to fair value | Services must deliver fair value; persistent failure entitles customer to cancellation without penalty per CPA Section 56 |
| WC-RG-014 | Supplier accountability | CircleTel is accountable for the full service even though connectivity is delivered via MTN Wholesale infrastructure |
| WC-RG-015 | Auto-renewal notice | Customer must be notified 40–80 business days before fixed-term contract auto-renewal (CPA Section 14(2)(a)) |

### 19.3 POPIA Compliance

| Rule ID | Rule | Detail |
|---|---|---|
| WC-RG-020 | Customer consent | Explicit consent required for collection, processing, and storage of personal information |
| WC-RG-021 | Data retention | Customer data retained for minimum 5 years post service termination (FICA + tax compliance) |
| WC-RG-022 | Data breach notification | Information Regulator and affected customers notified within 72 hours of a confirmed data breach |
| WC-RG-023 | Cloud backup data handling | Cloud backup data is customer property; encrypted at rest; deleted within 30 days of service termination unless customer requests earlier deletion |
| WC-RG-024 | Email data handling | Email account data retained for 30 days post service termination; customer may request export in standard format (MBOX/PST) |

### 19.4 FICA Compliance

| Rule ID | Rule | Detail |
|---|---|---|
| WC-RG-030 | Customer identification | All customers identified and verified per FICA (WC-CE-020 requirement) |
| WC-RG-031 | Record keeping | Identification records retained for minimum 5 years after termination |
| WC-RG-032 | Suspicious transaction reporting | Suspicious transactions reported to the Financial Intelligence Centre |

---

## 20. Exception Handling & Escalation

### 20.1 Exception Authority Matrix

| Exception Type | First Level | Second Level | Final Authority |
|---|---|---|---|
| Pricing exception (below cost floor) | Sales Director | CFO | MD |
| Credit vetting override | Finance Manager | CFO | MD |
| Technology exception (e.g. Pro on 5G) | Technical Lead | CTO | MD |
| Contract term exception | Sales Director | CFO | MD |
| AUP violation dispute | NOC Manager | CTO | MD |
| Partner commission exception | Partner Manager | Sales Director | CFO |
| SLA credit exception (beyond standard formula) | Operations Manager | CFO | MD |

### 20.2 Escalation Timelines

| Escalation Level | Response Time | Owner |
|---|---|---|
| Level 1 (Operational) | 4 business hours | Relevant department manager |
| Level 2 (Director) | 1 business day | Sales Director / CTO / CFO |
| Level 3 (Executive) | 2 business days | MD |

---

## 21. Appendix: Decision Trees

### 21.1 New Customer Qualification

```
START: New lead received
  │
  ├─ Does the person work from home, freelance, or run a small (≤ 5 person) business?
  │   ├─ NO → Redirect to HomeFibreConnect / SkyFibre Home
  │   └─ YES ↓
  │
  ├─ Does the customer have > 5 employees?
  │   ├─ YES → Redirect to SkyFibre SMB / BizFibreConnect
  │   └─ NO ↓
  │
  ├─ Does the customer need a formal SLA with guaranteed uptime?
  │   ├─ YES → Redirect to SkyFibre SMB (Enhanced/Premium SLA)
  │   └─ NO ↓
  │
  ├─ Is any technology available at the address? (FTTH → FWB → 5G → LTE)
  │   ├─ NO → Waitlist; cross-sell MTN LTE prepaid as interim
  │   └─ YES ↓
  │
  ├─ Can the customer afford ≥ R799/month?
  │   ├─ NO → Redirect to HomeFibreConnect Starter (R799 / 20 Mbps FTTH)
  │   └─ YES ↓
  │
  ├─ Credit check result?
  │   ├─ FAIL → 12-month contract + 1-month deposit OR redirect
  │   ├─ MARGINAL → Debit order mandate OR 2-month prepay
  │   └─ PASS ↓
  │
  └─ QUALIFIED → Proceed to technology selection and product configuration
```

### 21.2 Technology Selection

```
START: Customer qualified; address captured
  │
  ├─ Is the customer upload-sensitive? (content creator, live streamer, media)
  │   └─ YES → Prioritise FTTH; if unavailable, disclose FWB 4:1 and offer BizFibreConnect
  │
  ├─ Check 1: Is FTTH available at address?
  │   └─ YES → SELECT FTTH (symmetrical speeds, lowest churn) ✓
  │
  ├─ Check 2: Is FWB (Tarana) available at address?
  │   ├─ YES → SELECT FWB (4:1 asymmetric — disclose upload speeds) ✓
  │   └─ MARGINAL → Schedule site survey first
  │
  ├─ Check 3: Is 5G available AND tier ≤ Plus?
  │   └─ YES → SELECT 5G (variable upload — disclose and get acknowledgement) ✓
  │
  ├─ Check 4: Is LTE available AND tier = Starter?
  │   └─ YES → SELECT LTE (variable speeds — Starter only, with disclaimer) ✓
  │
  └─ No technology available → Waitlist + notify when coverage arrives
```

### 21.3 Price Objection Handling

```
START: Customer raises price objection
  │
  ├─ "It's too expensive compared to residential internet"
  │   └─ Present value differentiation: VoIP QoS, cloud backup, business router,
  │      extended support, email accounts — "work-grade at home-friendly prices"
  │   ├─ Accepts → CLOSE (WorkConnect)
  │   └─ Rejects ↓
  │
  ├─ Offer Starter at R799: "Same price as HomeFibreConnect but with business features"
  │   ├─ Accepts → CLOSE (WorkConnect Starter)
  │   └─ Rejects ↓
  │
  ├─ Customer budget < R799?
  │   ├─ YES → Redirect to HomeFibreConnect Starter (R799 / 20 Mbps FTTH)
  │   │         or SkyFibre Home
  │   └─ Customer walks → Log lost deal; review in 90 days
  ```

### 21.4 Add-On Validation

```
START: Customer selects add-on(s)
  │
  ├─ Does customer have an active WorkConnect base tier?
  │   ├─ NO → BLOCK — add-ons cannot be sold standalone
  │   └─ YES ↓
  │
  ├─ FOR EACH selected add-on:
  │   ├─ Check prerequisites (WC-AO-001 to WC-AO-007)
  │   ├─ Check conflicts (WC-AO-010 to WC-AO-015)
  │   │   ├─ CONFLICT detected → Alert sales; remove conflicting add-on
  │   │   └─ NO CONFLICT ↓
  │   └─ Check dependencies
  │       ├─ DEPENDENCY unmet → Alert sales; add required dependency OR block
  │       └─ DEPENDENCY met ↓
  │
  └─ ALL add-ons validated → Generate quote with itemised pricing
```

---

**END OF DOCUMENT**

*CircleTel SA (Pty) Ltd — A member of the New Generation Group*
*"Connecting Today, Creating Tomorrow"*
