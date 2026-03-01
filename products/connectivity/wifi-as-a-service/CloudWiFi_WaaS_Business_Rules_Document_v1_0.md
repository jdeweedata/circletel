# CloudWiFi™ WaaS — Business Rules Document (BRD)

## Eligibility Logic, Workflow Rules & Conditional Policies

---

| Field | Value |
|---|---|
| **Document Reference** | CT-BRD-CLOUDWIFI-2026-001 |
| **Version** | 1.0 |
| **Effective Date** | 01 March 2026 |
| **Classification** | Confidential — Internal Use |
| **Locale** | en-ZA (South African English) |
| **Prepared By** | CircleTel Product Strategy |
| **Source Documents** | CloudWiFi WaaS Commercial Product Spec v1.0, Hardware Cost Register v1.2, ThinkWiFi Product Specification v2.1, SkyFibre FUP Framework, MTN FWB Commercial Schedule (July 2025), DFA Commercial Schedules v1.0, DUNE Solutions Portfolio v1.0, ICASA Licence Register v1.0, CHANGE_LOG_27_Feb_2026 |
| **Supersedes** | N/A — First issue |

---

## Version Control

| Version | Date | Author | Changes | Status |
|---|---|---|---|---|
| 1.0 | 01 March 2026 | CircleTel Product Strategy / Claude AI | Initial BRD for CloudWiFi WaaS product line aligned to CPS v1.0, covering managed Wi-Fi overlay eligibility, site qualification, tier selection, add-on dependency logic, hardware asset management, SLA entitlements, and vertical market rules | **CURRENT** |

---

## Table of Contents

1. Purpose & Scope
2. Definitions & Abbreviations
3. Customer Eligibility Rules
4. Site Qualification & Technical Eligibility
5. Backhaul Technology Selection Rules
6. Tier Selection Rules
7. Vertical Market Package Rules
8. Add-On Eligibility & Dependency Logic
9. Pricing & Discount Rules
10. Billing & Payment Rules
11. Contract & Commitment Rules
12. Credit Vetting & Onboarding Workflow
13. Site Survey & Deployment Workflow
14. SLA Entitlement Rules
15. Cloud Management & Monitoring Rules
16. Hardware Ownership & Asset Management Rules
17. Upgrade, Downgrade & Migration Rules
18. Cancellation & Equipment Recovery Policies
19. ThinkWiFi Integration Rules
20. Cross-Sell & Portfolio Alignment Rules
21. Partner & Reseller Rules
22. Regulatory & Compliance Policies
23. Exception Handling & Escalation
24. Appendix: Decision Trees

---

## 1. Purpose & Scope

This Business Rules Document (BRD) codifies every eligibility check, workflow trigger, conditional policy, and decision rule that governs the CloudWiFi™ Wi-Fi as a Service (WaaS) product line from lead qualification through to service termination and equipment recovery. It is the authoritative operational reference for sales, site survey, provisioning, billing, NOC monitoring, support, and compliance teams.

**Scope:** All CloudWiFi service tiers (Essential, Professional, Enterprise, Campus) delivered as a fully managed Wi-Fi overlay across all supported backhaul technologies (DFA Fibre, MTN Tarana G1 FWB, DUNE 60GHz, MTN 5G, MTN LTE), all vertical market packages (Hospitality, Commercial, Property, Healthcare, Education), and all optional add-on modules (Custom Captive Portal, Analytics, ThinkWiFi Integration, Failover, Static IP, Content Filtering, Digital Signage, CCTV VLAN).

**Out of scope:** Connectivity pipe products (SkyFibre SMB, SkyFibre Residential, HomeFibreConnect, BizFibreConnect, WorkConnect SOHO, ParkConnect, UmojaLink, AirLink FWA), CircleConnect IoT, EduConnect, SafeGuard Security, and Managed IT Services — each governed by separate BRDs. However, bundling rules between CloudWiFi and connectivity products are documented in this BRD (see Sections 9 and 20).

**Key Design Principles:**

1. **Managed overlay model:** CloudWiFi is NOT a connectivity product — it is a managed Wi-Fi service layered on top of a connectivity pipe. The customer pays for the Wi-Fi experience; the pipe is either bundled or supplied separately.

2. **Hardware ownership:** CircleTel owns ALL deployed CloudWiFi hardware. The customer never owns, purchases, or leases Wi-Fi equipment. This is fundamental to the WaaS model and creates balance sheet value, switching cost, and equipment recovery rights.

3. **Backhaul agnosticism:** CloudWiFi rules apply identically regardless of the underlying connectivity technology. Technology-specific rules apply only at the backhaul selection stage (Section 5).

4. **Vertical flexibility:** A single product with vertical-specific packaging. Rules for vertical customisation are additive overlays on the core tier rules, not separate product lines.

---

## 2. Definitions & Abbreviations

| Term | Definition |
|---|---|
| **WaaS** | Wi-Fi as a Service — subscription-based managed Wi-Fi delivery model |
| **CloudWiFi** | CircleTel's branded WaaS product |
| **Managed overlay** | A service layer deployed on top of an existing connectivity pipe |
| **Tier** | Core service level: Essential, Professional, Enterprise, or Campus |
| **Vertical package** | Pre-configured tier variant tailored to a specific industry |
| **Add-on module** | An independently priced optional service layered onto a tier |
| **AP** | Access Point — Reyee Wi-Fi 6 wireless radio unit |
| **CPE** | Customer Premises Equipment — in CloudWiFi context, refers to the gateway router and APs collectively (all owned by CircleTel) |
| **SSID** | Service Set Identifier — a wireless network name broadcast by APs |
| **VLAN** | Virtual Local Area Network — logical network segmentation |
| **QoS** | Quality of Service — traffic prioritisation and bandwidth management |
| **PoE** | Power over Ethernet — 802.3af/at power delivery to APs via Ethernet cable |
| **RF** | Radio Frequency — used in context of Wi-Fi signal propagation and site surveys |
| **MRC** | Monthly Recurring Charge (excl. VAT unless stated) |
| **NRC** | Non-Recurring Charge (once-off) |
| **BYOC** | Bring Your Own Connection — customer uses an existing CircleTel pipe |
| **DL:UL** | Download-to-Upload speed ratio |
| **NOC** | Network Operations Centre |
| **OTA** | Over-the-Air — remote firmware update mechanism |
| **ZTP** | Zero-Touch Provisioning — automatic AP configuration via Ruijie Cloud |
| **RMA** | Return Merchandise Authorisation — hardware replacement process |
| **CAPEX** | Capital Expenditure — upfront hardware investment (borne by CircleTel) |
| **OPEX** | Operational Expenditure — ongoing operational costs |
| **SLA** | Service Level Agreement |
| **AM** | Account Manager |
| **BSS** | Business Support System (AgilityGIS) |
| **CRM** | Customer Relationship Management system |
| **CPA** | Consumer Protection Act 68 of 2008 |
| **ECA** | Electronic Communications Act 36 of 2005 |
| **FICA** | Financial Intelligence Centre Act 38 of 2001 |
| **POPIA** | Protection of Personal Information Act 4 of 2013 |

---

## 3. Customer Eligibility Rules

### 3.1 Entity Type Eligibility

CloudWiFi is a commercial/enterprise product. It is NOT available to residential consumers for personal home use.

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-CE-001 | Registered business entity | Customer is a registered SA business (Pty Ltd, CC, sole proprietor, NPC, trust, partnership) | ELIGIBLE — proceed to site qualification |
| CW-CE-002 | Government entity | National, provincial, or local government department or SOE | ELIGIBLE — flag for tender/procurement compliance; may require RFQ/RFP process |
| CW-CE-003 | Registered body corporate or HOA | Body corporate, homeowners' association, or estate management | ELIGIBLE — treat as multi-tenant property vertical |
| CW-CE-004 | NGO or non-profit organisation | Registered NPC, PBO, or Section 21 company | ELIGIBLE — qualify under Healthcare or Education vertical if applicable; standard commercial terms |
| CW-CE-005 | Foreign-registered entity with SA premises | Business registered outside SA but operating from a physical SA venue | ELIGIBLE IF valid SA physical address, lease agreement, and local representative confirmed |
| CW-CE-006 | Residential consumer (personal use) | Individual seeking Wi-Fi for their home | REJECT — redirect to HomeFibreConnect (FTTH router with Wi-Fi), SkyFibre Residential, or WorkConnect SOHO |
| CW-CE-007 | Sole proprietor operating from home | Individual freelancer or WFH professional | REJECT for CloudWiFi — redirect to WorkConnect SOHO (includes managed router option). Exception: if the home doubles as a commercial venue (e.g., B&B, salon, practice), treat as CW-CE-001 |
| CW-CE-008 | Informal or unregistered business | No CIPC registration, no trade licence, no premises lease | REJECT — redirect to UmojaLink Business or SkyFibre Residential. Exception: if the venue is verifiable (e.g., spaza shop with physical address), escalate to Sales Manager for case-by-case assessment |
| CW-CE-009 | Existing CircleTel connectivity customer | Customer already has an active CircleTel connectivity service | PRIORITY ELIGIBLE — fast-track onboarding; BYOC (no new connectivity sale required); cross-sell bundle discount applies (see Section 9) |

### 3.2 Venue Type Eligibility

CloudWiFi is designed for commercial and institutional venues. Not all venue types are suitable.

| Rule ID | Venue Type | Eligible? | Tier Recommendation | Notes |
|---|---|---|---|---|
| CW-VE-001 | Restaurant / café / bar | YES | Essential or Professional | Captive portal recommended for guest Wi-Fi |
| CW-VE-002 | Hotel / lodge / B&B / guest house | YES | Professional or Enterprise (Hospitality vertical) | Room-level coverage assessment required |
| CW-VE-003 | Office (single floor, < 300 m²) | YES | Essential | Consider BYOC if customer has existing connectivity |
| CW-VE-004 | Office (multi-floor or > 300 m²) | YES | Professional or Enterprise | Multi-AP deployment with roaming required |
| CW-VE-005 | Retail store / showroom | YES | Essential or Professional | Guest Wi-Fi + operations SSID separation |
| CW-VE-006 | Clinic / medical practice | YES | Professional (Healthcare vertical) | POPIA compliance mandatory for patient data networks |
| CW-VE-007 | Hospital / large healthcare facility | YES | Enterprise or Campus (Healthcare vertical) | Multiple VLANs mandatory: clinical, admin, patient, IoT/devices |
| CW-VE-008 | School / training centre | YES | Professional or Enterprise (Education vertical) | Content filtering add-on recommended |
| CW-VE-009 | University / college campus | YES | Campus (Education vertical) | Multi-building backbone — integrate with LearnLink DUNE |
| CW-VE-010 | Shopping centre / mall | YES | Enterprise or Campus | High-density design required; ThinkWiFi integration recommended |
| CW-VE-011 | Office park / business park | YES | Campus | Integrate with ParkConnect DUNE backbone |
| CW-VE-012 | Residential estate (common areas) | YES | Professional or Enterprise | Only common areas (clubhouse, gym, pool, gate) — NOT individual homes |
| CW-VE-013 | Conference / events centre | YES | Enterprise | Variable-density design; may require temporary AP augmentation |
| CW-VE-014 | Warehouse / distribution centre | YES | Professional or Enterprise | Industrial-grade outdoor APs; consider RF interference from racking |
| CW-VE-015 | Petrol station / forecourt | YES | Essential | Outdoor AP required; integrate with convenience store |
| CW-VE-016 | Church / place of worship | YES | Essential or Professional | Periodic high-density during services; ThinkWiFi portal for congregation |
| CW-VE-017 | Private residential home (personal use) | NO | N/A | REJECT — redirect to residential connectivity products |
| CW-VE-018 | Temporary / pop-up venue (< 30 days) | CONDITIONAL | Essential | Minimum 30-day deployment; for shorter, escalate to Sales Manager for event-rate pricing |
| CW-VE-019 | Outdoor-only venue (no building) | CONDITIONAL | Professional | Must have power and backhaul connectivity at site; outdoor APs only |
| CW-VE-020 | Construction site / temporary structures | NO | N/A | REJECT — environmental risk to hardware; redirect to MTN LTE (temporary) |

### 3.3 Required Documentation

| Rule ID | Document | Required? | Validation |
|---|---|---|---|
| CW-CE-020 | CIPC registration document (CK1 / CoR14.1) | Mandatory | Must match applicant details; current status "in business" |
| CW-CE-021 | Director / member ID documents | Mandatory | SA ID or passport; FICA requirement |
| CW-CE-022 | Proof of business address / venue address | Mandatory | Lease agreement, utility bill, rates account, or title deed — not older than 3 months |
| CW-CE-023 | Letter of authority (if not owner) | Conditional | Required if applicant is a tenant, property manager, or third-party agent — must authorise installation and cabling |
| CW-CE-024 | VAT registration certificate | Optional | Required if customer requests VAT invoice (all prices excl. VAT by default) |
| CW-CE-025 | Building plan / floor plan | Recommended | Assists site survey — can be a hand-drawn sketch if no formal plans exist |
| CW-CE-026 | Bank account confirmation | Conditional | Required for debit order — bank-stamped letter or bank statement first page |
| CW-CE-027 | Visa/permit documentation (foreign entity) | Conditional | Required for foreign entities per CW-CE-005 |

### 3.4 Credit Eligibility

CloudWiFi contracts involve higher MRC values (R1 499–R14 999/month) and CircleTel carries significant CAPEX per site. Credit vetting is therefore more rigorous than residential products.

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-CE-030 | Credit check mandatory | ALL new CloudWiFi customers on contract terms | Run commercial credit bureau check via TransUnion or Experian |
| CW-CE-031 | Credit score PASS | Commercial credit score ≥ 620 | Proceed to site survey and contract |
| CW-CE-032 | Credit score MARGINAL | Commercial credit score 500–619 | Proceed with CONDITIONS: (a) debit order mandate mandatory, (b) 3-month upfront payment, OR (c) customer provides bank guarantee or personal surety from director |
| CW-CE-033 | Credit score FAIL | Commercial credit score < 500 | HOLD — escalate to Sales Manager. Options: (i) 6-month upfront payment, (ii) personal surety from director, (iii) full CAPEX deposit (refundable over contract term), or (iv) REJECT |
| CW-CE-034 | Credit check exemption — upfront payment | Customer pays 12 months upfront | Credit check WAIVED |
| CW-CE-035 | Credit check exemption — existing customer | Customer has active CircleTel service with zero arrears for ≥ 6 months | Credit check WAIVED; cross-reference payment history |
| CW-CE-036 | Credit check exemption — anchor customer | Customer is an approved anchor account (e.g., Unjani Clinics, property management group) with master agreement | Credit check WAIVED per master agreement terms |
| CW-CE-037 | CAPEX risk threshold | Total site CAPEX exceeds R25 000 | MANDATORY: director personal surety OR 50% CAPEX deposit regardless of credit score |
| CW-CE-038 | Multi-site rollout | Customer commits to 5+ sites | Aggregate credit assessment; may accept lower per-site credit threshold if master agreement signed |

---

## 4. Site Qualification & Technical Eligibility

### 4.1 Mandatory Site Assessment

Every CloudWiFi deployment MUST be preceded by a site survey. Unlike connectivity products where coverage checks are database-driven, CloudWiFi requires a physical or virtual assessment of the venue's RF environment, power availability, cabling pathways, and mounting options.

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-SQ-001 | Site survey mandatory before contract signing | ALL CloudWiFi deployments | Schedule site survey within 5 business days of qualified lead |
| CW-SQ-002 | Site survey waiver — standard small venue | Venue is < 200 m², single room, no structural obstacles, and customer provides floor plan | MAY waive physical survey — conduct virtual survey via floor plan + photos + video call. Final decision by Technical Lead |
| CW-SQ-003 | Site survey output — Wi-Fi design plan | Completed site survey | Produce Wi-Fi design plan including: AP count and placement, cable routes, gateway location, VLAN topology, expected coverage heatmap, and bill of materials |
| CW-SQ-004 | Customer approval of Wi-Fi design plan | Wi-Fi design plan presented to customer | Customer MUST sign off on design plan before installation proceeds. Design plan forms part of the contract |
| CW-SQ-005 | Design plan validity | Wi-Fi design plan signed by customer | Valid for 60 days from approval date. If installation not scheduled within 60 days, a re-survey may be required (at CircleTel's discretion) |

### 4.2 Venue Physical Requirements

| Rule ID | Requirement | Mandatory? | Assessment Criteria | Failure Action |
|---|---|---|---|---|
| CW-SQ-010 | Reliable electrical supply | Mandatory | Stable mains power available at gateway and AP locations; dedicated circuit recommended for Enterprise/Campus | If no power at AP location, quote additional electrical work (customer's cost) or re-design AP placement |
| CW-SQ-011 | Ethernet cabling pathway | Mandatory | Physical pathway exists (or can be created) to run CAT6 cable from gateway to each AP location | If no pathway, quote structured cabling (included in installation estimate). If customer refuses cabling, consider Reyee mesh mode (see CW-SQ-012) |
| CW-SQ-012 | Mesh mode fallback | Conditional | Cabling is not feasible (heritage building, tenant restrictions, cost-prohibitive) | Deploy Reyee APs in mesh mode. IMPORTANT: mesh mode reduces effective throughput by ~50% per hop. Customer MUST be informed. Maximum 2 mesh hops recommended. Document mesh limitation in contract |
| CW-SQ-013 | Ceiling access for AP mounting | Recommended | Drop ceiling or solid ceiling with suitable mounting surface | If no ceiling access, use wall-mount or wall-plate APs (RG-RAP2260(E)). Outdoor venues: pole or wall mount with outdoor APs (RG-RAP6262(G)) |
| CW-SQ-014 | Backhaul connectivity available | Mandatory | At least one CircleTel backhaul technology confirmed at venue address (DFA Fibre, MTN FWB, DUNE 60GHz, 5G, or LTE) | If no backhaul available, CloudWiFi CANNOT be deployed. Add venue to connectivity waitlist. Check ParkConnect/DUNE for office parks |
| CW-SQ-015 | RF environment assessment | Mandatory for Professional+ | Survey for existing Wi-Fi interference, microwave ovens, Bluetooth devices, and neighbouring APs on same channels | If high interference detected, design must include channel planning and power adjustments. Enterprise/Campus tiers MUST include RF spectrum analysis |
| CW-SQ-016 | Load shedding exposure | Mandatory assessment | Assess venue's exposure to load shedding stages | Recommend UPS add-on (R150/month rental or R800 once-off). Enterprise/Campus: UPS STRONGLY recommended. Document customer's acceptance or refusal of UPS in contract |
| CW-SQ-017 | Security of installed equipment | Assessment | Risk of theft, vandalism, or accidental damage to installed APs and gateway | If high risk (public areas, unsecured ceilings, outdoor locations), specify tamper-proof mounting and security enclosures (additional NRC). CircleTel insurance covers hardware; excess applies if customer negligence proven |

### 4.3 Venue Size Classification

| Rule ID | Venue Classification | Floor Area | Typical AP Count | Minimum Tier | Notes |
|---|---|---|---|---|---|
| CW-SQ-020 | Small venue | < 300 m² | 1–2 APs | Essential | Single-zone coverage, basic segmentation |
| CW-SQ-021 | Medium venue | 300–800 m² | 3–5 APs + 0–1 outdoor | Professional | Multi-zone, full VLAN segmentation |
| CW-SQ-022 | Large venue | 800–2 000 m² | 6–12 APs + 1–2 outdoor | Enterprise | High-density design, advanced QoS |
| CW-SQ-023 | Campus / multi-building | > 2 000 m² or 2+ buildings | 12–30+ APs | Campus | Multi-site management, dedicated AM |
| CW-SQ-024 | Oversized for tier | Site survey determines AP count exceeds tier maximum | N/A | ESCALATE: auto-upgrade to next tier. If Campus maximum (30 APs) exceeded, treat as custom/bespoke quote |

---

## 5. Backhaul Technology Selection Rules

### 5.1 Backhaul Priority Order

CloudWiFi™ is backhaul-agnostic but the underlying connectivity must meet minimum performance thresholds for Wi-Fi service quality.

| Rule ID | Priority | Technology | Minimum Speed | Maximum Speed | Suitability | Monthly Cost Range (Wholesale) |
|---|---|---|---|---|---|---|
| CW-BH-001 | 1 | DFA Business Broadband (fibre) | 10 Mbps symmetrical | 200 Mbps symmetrical | All tiers; preferred for Enterprise/Campus | R399–R2 199 |
| CW-BH-002 | 2 | MTN Tarana G1 FWB | 50/12.5 Mbps (4:1) | 200/50 Mbps (4:1) | All tiers; upload limitation must be disclosed | R599–R1 799 |
| CW-BH-003 | 3 | DUNE 60GHz (via ParkConnect) | 100 Mbps symmetrical | 3.5 Gbps | Enterprise/Campus only; office park backbone | Per ParkConnect agreement |
| CW-BH-004 | 4 | MTN 5G | 60+ Mbps (variable) | 200+ Mbps (variable) | Essential/Professional only; best-effort speeds | R499–R999 |
| CW-BH-005 | 5 | MTN LTE | 20 Mbps (variable) | 50 Mbps (variable) | Essential ONLY; temporary or rural deployments | R399–R699 |

### 5.2 Backhaul Selection Rules

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-BH-010 | Backhaul must support tier throughput | Selected backhaul speed must be ≥ 80% of sum of all SSID bandwidth allocations | If backhaul is insufficient, either upgrade backhaul or reduce SSID bandwidth caps |
| CW-BH-011 | Fibre preferred for Enterprise/Campus | Customer selects Enterprise or Campus tier | RECOMMEND DFA fibre or DUNE 60GHz. If unavailable, MTN FWB is acceptable but customer must accept upload asymmetry (4:1) in writing |
| CW-BH-012 | LTE restricted to Essential only | Customer requesting CloudWiFi on LTE backhaul | ONLY Essential tier permitted. LTE best-effort speeds cannot support multi-AP, high-density deployments. Customer must sign best-effort speed disclaimer |
| CW-BH-013 | Bundled backhaul preferred | New CloudWiFi deployment without existing connectivity | ALWAYS recommend bundled connectivity (single invoice, combined margin, simplified SLA). BYOC only if customer has active CircleTel service |
| CW-BH-014 | Third-party backhaul NOT permitted | Customer wants CloudWiFi on non-CircleTel internet (Afrihost, Vodacom, etc.) | REJECT — CloudWiFi is a managed service requiring CircleTel backhaul for end-to-end SLA coverage, VLAN management, and NOC integration. No exceptions. If customer insists, recommend they migrate connectivity to CircleTel first |
| CW-BH-015 | Dual-WAN / failover backhaul | Customer requires high availability | Offer CloudWiFi Failover add-on (R599/month) — secondary LTE/5G link on separate gateway WAN port. Primary backhaul failure triggers automatic failover |
| CW-BH-016 | Tarana FWB upload speed disclosure | Backhaul selected is MTN Tarana G1 FWB | MANDATORY: disclose 4:1 asymmetric speed ratio (e.g., 100 Mbps download / 25 Mbps upload). Customer must acknowledge in contract. Per CHANGE_LOG_27_Feb_2026 correction |

### 5.3 Backhaul Minimum Thresholds per Tier

| Rule ID | Tier | Minimum Backhaul Download | Minimum Backhaul Upload | Recommended Backhaul |
|---|---|---|---|---|
| CW-BH-020 | Essential (1–2 APs, ≤ 50 users) | 25 Mbps | 5 Mbps | FWB 50 Mbps or Fibre 20 Mbps |
| CW-BH-021 | Professional (3–5 APs, ≤ 100 users) | 50 Mbps | 15 Mbps | FWB 100 Mbps or Fibre 50 Mbps |
| CW-BH-022 | Enterprise (6–12 APs, ≤ 250 users) | 100 Mbps | 25 Mbps | Fibre 100 Mbps or FWB 200 Mbps |
| CW-BH-023 | Campus (12–30+ APs, 250+ users) | 200 Mbps | 50 Mbps | Fibre 200 Mbps, DUNE backbone, or dual-WAN |

---

## 6. Tier Selection Rules

### 6.1 Tier Determination Logic

Tier selection is determined by the combination of venue size, AP count, and feature requirements — NOT by the customer's budget preference alone.

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-TS-001 | Tier determined by site survey | Wi-Fi design plan confirms required AP count and features | ASSIGN tier based on AP count thresholds (see CW-SQ-020 to CW-SQ-024) |
| CW-TS-002 | Customer requests lower tier than survey | Site survey recommends Professional but customer wants Essential | WARN customer: lower tier will result in coverage gaps. If customer insists, document acceptance in writing. Sales must obtain Sales Manager approval |
| CW-TS-003 | Customer requests higher tier than survey | Site survey recommends Essential but customer wants Professional (for SLA benefits) | ALLOW — customer may select a higher tier for SLA, QoS, or reporting benefits even if AP count is low |
| CW-TS-004 | AP count exceeds tier ceiling | Design requires more APs than the selected tier includes | Auto-upgrade to next tier. If Campus tier ceiling exceeded (30 APs), generate custom/bespoke quote |
| CW-TS-005 | Tier-specific SLA entitlements | Tier selected | Assign SLA entitlements per Section 14 |

### 6.2 Tier Boundaries

| Rule ID | Tier | AP Range (Indoor) | Outdoor APs Included | Max SSIDs | Max VLANs | Gateway Model |
|---|---|---|---|---|---|---|
| CW-TS-010 | Essential | 1–2 | 0 | 2 | 2 | MikroTik hAP ax S or Reyee EG105G |
| CW-TS-011 | Professional | 3–5 | 0–1 | 4 | 4 | Reyee EG105G-P or EG305GH-P-E |
| CW-TS-012 | Enterprise | 6–12 | 1–2 | 6 | 6 | Reyee EG310GH-P-E |
| CW-TS-013 | Campus | 12–30+ | 2–6 | 8 | 8 | Reyee EG310GH-P-E + managed switches |

### 6.3 Tier Feature Matrix — Enforcement Rules

| Rule ID | Feature | Essential | Professional | Enterprise | Campus |
|---|---|---|---|---|---|
| CW-TS-020 | Captive portal (standard template) | Included | Included | Included | Included |
| CW-TS-021 | Custom captive portal design | Add-on (R2 500 NRC) | Add-on (R2 500 NRC) | INCLUDED | INCLUDED |
| CW-TS-022 | Advanced analytics dashboard | NOT available | Add-on (R500/month) | Add-on (R500/month) | INCLUDED |
| CW-TS-023 | Quarterly performance review | NOT available | INCLUDED | INCLUDED | INCLUDED (monthly for Campus) |
| CW-TS-024 | Dedicated Account Manager | NOT available | NOT available | INCLUDED | INCLUDED |
| CW-TS-025 | Content filtering | Add-on (R250/month) | Add-on (R250/month) | Add-on (R250/month) | Add-on (R250/month) |
| CW-TS-026 | CCTV VLAN (isolated) | NOT available | INCLUDED | INCLUDED | INCLUDED |
| CW-TS-027 | ThinkWiFi integration | Add-on | Add-on | Add-on | Add-on |
| CW-TS-028 | Failover (LTE/5G backup) | Add-on (R599/month) | Add-on (R599/month) | Add-on (R599/month) | Add-on (R599/month) |
| CW-TS-029 | Digital signage VLAN | NOT available | Add-on (R350/month) | Add-on (R350/month) | INCLUDED |
| CW-TS-030 | Static IP | Add-on (R99/month) | Add-on (R99/month) | INCLUDED | INCLUDED |

---

## 7. Vertical Market Package Rules

### 7.1 Vertical Package Selection

Vertical packages are pre-configured tier variants with industry-specific defaults. They do NOT create new pricing tiers — they apply vertical-specific configuration, marketing, and default add-ons to the core tiers.

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-VP-001 | Vertical selection at point of sale | Sales identifies customer's industry during qualification | SELECT appropriate vertical package from: Hospitality, Commercial, Property, Healthcare, Education |
| CW-VP-002 | Vertical is optional | Customer does not fit any defined vertical OR prefers generic configuration | ALLOW — deploy standard CloudWiFi tier without vertical-specific configuration |
| CW-VP-003 | Single vertical per site | A venue can only be assigned ONE vertical package | If venue spans multiple verticals (e.g., hotel with conference facilities), select the PRIMARY vertical and note secondary requirements in design plan |
| CW-VP-004 | Vertical does not change pricing | Vertical packages use standard tier pricing | NO price premium for vertical packaging. Value-add is in the pre-configured defaults and specialised support playbooks |

### 7.2 Vertical Eligibility Matrix

| Rule ID | Vertical | Eligible Tiers | Default Add-Ons | Mandatory Features | Key Differentiator |
|---|---|---|---|---|---|
| CW-VP-010 | Hospitality (Hotels, Lodges, B&Bs) | Professional, Enterprise, Campus | Custom captive portal, analytics | Branded guest portal, room-level coverage design, separate staff/guest/IoT VLANs | Check-in integration readiness, property-wide coverage |
| CW-VP-011 | Commercial (Offices, Retail, Restaurants) | Essential, Professional, Enterprise | CCTV VLAN, QoS | POS traffic prioritisation, staff/guest separation | Business-critical traffic QoS policy |
| CW-VP-012 | Property (Estates, Office Parks, MDUs) | Professional, Enterprise, Campus | ThinkWiFi integration, analytics | Common-area coverage, tenant separation | Multi-tenant SSID architecture, per-tenant billing readiness |
| CW-VP-013 | Healthcare (Clinics, Hospitals) | Professional, Enterprise, Campus | Content filtering, security | Clinical device isolation (VLAN 30), POPIA-compliant patient Wi-Fi, no data logging on patient SSID | Medical device interference assessment, clinical network segregation |
| CW-VP-014 | Education (Schools, Training Centres) | Professional, Enterprise, Campus | Content filtering, analytics | Student/staff/admin SSIDs, content filtering mandatory, bandwidth per classroom management | Learner protection filtering, exam-mode lockdown readiness |

### 7.3 Healthcare-Specific Rules (POPIA & Clinical)

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-VP-020 | Patient Wi-Fi must NOT log personal data | CloudWiFi deployed in healthcare venue with patient-facing SSID | Captive portal MUST use anonymous access (no name, email, or phone collection). Splash page only with T&Cs acceptance |
| CW-VP-021 | Clinical device VLAN isolation | Healthcare venue with networked medical devices (patient monitors, dispensers, etc.) | VLAN 30 (IoT) MUST be fully isolated from all other VLANs — no inter-VLAN routing, no internet access unless explicitly required |
| CW-VP-022 | Medical device RF interference assessment | Healthcare venue | Site survey MUST include assessment of potential RF interference with medical equipment. If interference risk identified, adjust AP channels, power levels, or placement accordingly |
| CW-VP-023 | Healthcare data retention | CloudWiFi analytics in healthcare venue | Analytics add-on MUST exclude patient Wi-Fi usage data. Only aggregate metrics (total connected devices, bandwidth) permitted on patient SSID |

### 7.4 Education-Specific Rules

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-VP-030 | Content filtering mandatory for under-18 venues | Education venue serving learners under 18 years of age | Content filtering add-on (R250/month) is MANDATORY and INCLUDED at no additional charge. Films Act 65 of 1996 and ECASA obligations apply |
| CW-VP-031 | Bandwidth management per classroom | Education venue with per-classroom APs | Configure per-AP bandwidth limits to prevent single classroom consuming entire backhaul |
| CW-VP-032 | Exam-mode lockdown | School or examination venue | Provide capability to restrict internet access to approved domains during examination periods via Ruijie Cloud URL filtering |

---

## 8. Add-On Eligibility & Dependency Logic

### 8.1 Add-On Master List

| Rule ID | Add-On Module | Monthly Price | NRC | Tier Eligibility | Dependency | Conflict |
|---|---|---|---|---|---|---|
| CW-AO-001 | Custom Captive Portal Design | — | R2 500 | Essential, Professional | None | Supersedes standard template. Enterprise/Campus tiers INCLUDE this at no NRC |
| CW-AO-002 | CloudWiFi Analytics | R500/month | — | Professional, Enterprise | None | NOT available on Essential tier. Campus tier INCLUDES this |
| CW-AO-003 | ThinkWiFi Integration | R500/month + revenue share | R1 500 (portal setup) | All tiers | Requires guest SSID configured; requires ThinkWiFi platform account | Must NOT conflict with customer's own captive portal requirements |
| CW-AO-004 | LTE/5G Failover | R599/month | R500 (LTE modem install) | All tiers | Requires gateway with dual WAN (all gateways support this) | NOT applicable if primary backhaul is already LTE/5G (CW-BH-005) |
| CW-AO-005 | Static IP Address | R99/month | — | All tiers | Requires CircleTel-managed backhaul (not applicable to BYOC on LTE/5G) | Enterprise/Campus tiers INCLUDE this |
| CW-AO-006 | Content Filtering | R250/month | — | All tiers | None | Education vertical: MANDATORY and included at zero additional cost (CW-VP-030) |
| CW-AO-007 | Digital Signage VLAN | R350/month | — | Professional, Enterprise, Campus | Requires minimum 50 Mbps backhaul | NOT available on Essential tier. Campus tier INCLUDES this |
| CW-AO-008 | CCTV VLAN (isolated) | — | — | Professional, Enterprise, Campus | None | Standard inclusion for Professional+. NOT available on Essential |
| CW-AO-009 | UPS / Load Shedding Protection | R150/month (rental) or R800 NRC (purchase) | — | All tiers | Mains power must be available | If customer selects purchase, CircleTel does NOT own the UPS — customer's asset |
| CW-AO-010 | VoIP QoS Prioritisation | — | — | All tiers | None | Standard inclusion in ALL tiers at no additional cost |

### 8.2 Add-On Validation Function

The following validation logic MUST be executed by BSS/CRM before confirming any add-on subscription:

```
FUNCTION validate_cloudwifi_addon(site_id, addon_code):

  site = GET_SITE(site_id)
  tier = site.tier
  backhaul = site.backhaul_technology
  existing_addons = site.active_addons

  -- Tier eligibility check
  IF addon_code = 'CW-AO-002' AND tier = 'Essential':
    RETURN REJECT("CloudWiFi Analytics is not available on Essential tier. Upgrade to Professional.")

  IF addon_code = 'CW-AO-007' AND tier = 'Essential':
    RETURN REJECT("Digital Signage VLAN is not available on Essential tier. Upgrade to Professional.")

  IF addon_code = 'CW-AO-008' AND tier = 'Essential':
    RETURN REJECT("CCTV VLAN is not available on Essential tier. Upgrade to Professional.")

  -- Dependency check: LTE/5G Failover
  IF addon_code = 'CW-AO-004' AND backhaul IN ('LTE', '5G'):
    RETURN REJECT("LTE/5G Failover cannot be added when primary backhaul is already LTE/5G.")

  -- Dependency check: ThinkWiFi
  IF addon_code = 'CW-AO-003' AND site.guest_ssid_configured = FALSE:
    RETURN WARN("ThinkWiFi requires a guest SSID. Configure guest SSID before enabling ThinkWiFi.")

  -- Conflict check: ThinkWiFi + Custom Portal
  IF addon_code = 'CW-AO-003' AND 'CW-AO-001' IN existing_addons:
    RETURN WARN("ThinkWiFi captive portal will replace the custom captive portal on the guest SSID. Confirm customer accepts this.")

  -- Redundancy check: included add-ons
  IF addon_code = 'CW-AO-002' AND tier = 'Campus':
    RETURN REJECT("CloudWiFi Analytics is already included in Campus tier at no additional cost.")

  IF addon_code = 'CW-AO-005' AND tier IN ('Enterprise', 'Campus'):
    RETURN REJECT("Static IP is already included in Enterprise/Campus tier at no additional cost.")

  IF addon_code = 'CW-AO-007' AND tier = 'Campus':
    RETURN REJECT("Digital Signage VLAN is already included in Campus tier at no additional cost.")

  IF addon_code = 'CW-AO-001' AND tier IN ('Enterprise', 'Campus'):
    RETURN REJECT("Custom Captive Portal is already included in Enterprise/Campus tier at no additional NRC.")

  -- Backhaul threshold check: Digital Signage
  IF addon_code = 'CW-AO-007' AND site.backhaul_download_speed < 50:
    RETURN REJECT("Digital Signage VLAN requires minimum 50 Mbps backhaul. Current backhaul: " + site.backhaul_download_speed + " Mbps.")

  RETURN ACCEPT("Add-on validated. Proceed with activation.")
```

---

## 9. Pricing & Discount Rules

### 9.1 Standard Pricing

| Rule ID | Tier | Monthly MRC (excl. VAT) | Minimum Contract | Notes |
|---|---|---|---|---|
| CW-PR-001 | CloudWiFi Essential | R1 499 | 24 months | Maximum 2 indoor APs |
| CW-PR-002 | CloudWiFi Professional | R3 499 | 24 months | Maximum 5 indoor APs + 1 outdoor |
| CW-PR-003 | CloudWiFi Enterprise | R7 999 | 36 months | Maximum 12 indoor APs + 2 outdoor |
| CW-PR-004 | CloudWiFi Campus | R14 999 | 36 months | Maximum 30 APs; beyond 30, custom quote |

### 9.2 Discount Rules

| Rule ID | Rule | Condition | Discount | Approval Required |
|---|---|---|---|---|
| CW-PR-010 | Bundle discount — connectivity | Customer takes CloudWiFi + CircleTel connectivity (SkyFibre, BizFibre, ParkConnect) as a bundle | 10% off combined MRC | AUTO — system applies |
| CW-PR-011 | Multi-site discount | Customer contracts 3+ CloudWiFi sites | 5% off total CloudWiFi MRC per site | Sales Manager approval |
| CW-PR-012 | Multi-site discount (volume) | Customer contracts 10+ CloudWiFi sites | 10% off total CloudWiFi MRC per site | Sales Director / MD approval |
| CW-PR-013 | Anchor customer pricing | Pre-approved anchor account (e.g., Unjani Clinics, hotel group) with master agreement | Bespoke pricing per master agreement (typically 10–20% below standard) | MD approval; documented in master agreement |
| CW-PR-014 | 36-month contract loyalty discount | Customer opts for 36-month contract on Essential or Professional (where 24-month is the default) | 5% off MRC for the extended term | AUTO — system applies |
| CW-PR-015 | Founders offer (limited) | First 20 CloudWiFi sites nationally (launch promotion) | Free site survey + free installation + free captive portal design + first month free. Total value up to R25 000 per site | MD approval; counter tracks usage (20/20) |
| CW-PR-016 | Existing customer upsell | Customer already has active CircleTel connectivity service and adds CloudWiFi | Free installation (NRC waived) + first month free | AUTO — system validates existing service |
| CW-PR-017 | No discount stacking | Two or more discounts claimed simultaneously | Maximum ONE discount applies. Priority: Anchor pricing > Multi-site volume > Bundle > Founders offer > Loyalty. Highest-value discount prevails |
| CW-PR-018 | Price increase clause | Annual review (March each year) | MRC may increase by CPI or 8% (whichever is lower) with 60 days' written notice per CPA. First increase only applicable after 12 months of service |

### 9.3 Non-Recurring Charges (NRCs)

| Rule ID | NRC Item | Standard Price | Discount Conditions |
|---|---|---|---|
| CW-PR-020 | Site survey | R2 500 | WAIVED if contract signed within 30 days of survey |
| CW-PR-021 | Standard installation (Essential / Professional) | R1 500–R3 000 | WAIVED under Founders offer or Existing Customer upsell |
| CW-PR-022 | Standard installation (Enterprise / Campus) | R5 000–R12 000 | WAIVED under Founders offer only (Enterprise/Campus) |
| CW-PR-023 | Custom captive portal design | R2 500 | INCLUDED in Enterprise/Campus tiers |
| CW-PR-024 | ThinkWiFi portal setup | R1 500 | WAIVED if ThinkWiFi 24-month add-on committed |
| CW-PR-025 | LTE modem installation (failover) | R500 | Standard; no discount |
| CW-PR-026 | Additional structured cabling (beyond standard) | R15/metre + R250/point | Estimated during site survey; customer approval required before installation |
| CW-PR-027 | UPS (purchase option) | R800 | Standard; no discount. UPS becomes customer's property |
| CW-PR-028 | Early termination fee | See Section 18 | Per CPA formula |

---

## 10. Billing & Payment Rules

### 10.1 Billing Cycle

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-BL-001 | Monthly billing in advance | ALL CloudWiFi services | Invoice generated on 1st of each month for the month ahead |
| CW-BL-002 | First invoice pro-rata | Service activated mid-month | First invoice covers remaining days of activation month + full following month |
| CW-BL-003 | NRC invoiced at installation | Installation completed and signed off by customer | NRC (installation, cabling, portal setup) invoiced separately on completion. Due within 7 days |
| CW-BL-004 | Add-on billing aligned | Add-on activated mid-cycle | Pro-rata for remainder of current month; full MRC from next cycle |
| CW-BL-005 | VAT treatment | All pricing | All prices EXCLUDE VAT (15%). VAT added at invoice level. Customer may request VAT-inclusive quotes during sales process |

### 10.2 Payment Methods

| Rule ID | Method | Available? | Notes |
|---|---|---|---|
| CW-BL-010 | Debit order (EFT) | PREFERRED | Mandatory for customers with marginal credit (CW-CE-032). 3-day notice per CPA |
| CW-BL-011 | EFT / bank transfer | YES | Payment due by 7th of each month. Customer receives invoice with banking details |
| CW-BL-012 | Credit card | YES | Processed via Stripe/PayFast. 2.5% processing fee applies (disclosed to customer) |
| CW-BL-013 | Cash | NO | Not accepted for CloudWiFi services |
| CW-BL-014 | Annual / multi-month prepayment | YES | Discounts: 6-month prepayment = 3% discount; 12-month prepayment = 5% discount on MRC. Prepayment is NON-REFUNDABLE |

### 10.3 Arrears & Collections Escalation

| Rule ID | Days Overdue | Action | System Trigger |
|---|---|---|---|
| CW-BL-020 | 1 day | Automated SMS + email reminder | AgilityGIS auto-trigger |
| CW-BL-021 | 7 days | Second reminder (SMS + email) + automated WhatsApp message | AgilityGIS auto-trigger |
| CW-BL-022 | 14 days | Phone call from accounts team; formal letter of demand | Manual — accounts team |
| CW-BL-023 | 21 days | Service WARNING: notify customer of impending suspension | AgilityGIS auto-trigger; AM notified for Enterprise/Campus |
| CW-BL-024 | 30 days | Service SUSPENDED: CloudWiFi guest SSID disabled; staff SSID remains active for 7 more days as courtesy | Ruijie Cloud API — SSID toggle. NOC executes. IMPORTANT: staff SSID grace period prevents business disruption |
| CW-BL-025 | 37 days | Full service SUSPENDED: all SSIDs disabled; APs remain powered but non-functional | Ruijie Cloud API — full site disable. NOC executes |
| CW-BL-026 | 60 days | Service TERMINATED: formal cancellation notice sent; equipment recovery scheduled (see Section 18) | Manual — AM or Sales Manager triggers. CPA notice period honoured |
| CW-BL-027 | 90 days | Debt handover to external collections; equipment recovery enforced; customer blacklisted in CRM | Manual — finance team. Equipment recovery by field technician |
| CW-BL-028 | Enterprise/Campus escalation override | Enterprise or Campus tier enters arrears | AM contacted immediately at 7-day mark. Suspension delayed to 45 days (vs 30 for Essential/Professional) to protect high-value relationship. MD must approve suspension |

---

## 11. Contract & Commitment Rules

### 11.1 Contract Terms

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-CT-001 | Minimum contract term — Essential | Customer selects Essential tier | 24-month minimum contract. Option to extend to 36 months for loyalty discount (CW-PR-014) |
| CW-CT-002 | Minimum contract term — Professional | Customer selects Professional tier | 24-month minimum contract. Option to extend to 36 months for loyalty discount |
| CW-CT-003 | Minimum contract term — Enterprise | Customer selects Enterprise tier | 36-month minimum contract. No shorter option available |
| CW-CT-004 | Minimum contract term — Campus | Customer selects Campus tier | 36-month minimum contract. No shorter option available |
| CW-CT-005 | Contract start date | Service activated and customer sign-off received | Contract commences on the date of customer sign-off following successful installation and commissioning |
| CW-CT-006 | Contract renewal — auto-renewal | Contract term expires | Converts to month-to-month at current MRC (including any CPI adjustments applied during contract). 30 days' written notice required to cancel post-contract |
| CW-CT-007 | Contract renewal — new fixed term | Customer opts for new 24/36-month term at expiry | Apply latest pricing; customer may negotiate renewal discount (5% standard for loyal customers, MD approval for higher) |
| CW-CT-008 | Contract includes hardware schedule | ALL CloudWiFi contracts | Contract MUST include an equipment schedule listing every CircleTel-owned item deployed at the site (model, serial number, location). This schedule forms part of the hardware asset register |

### 11.2 Contract Inclusions (Mandatory Clauses)

| Rule ID | Clause | Requirement |
|---|---|---|
| CW-CT-010 | Hardware ownership statement | "All CloudWiFi hardware deployed at the Customer's premises remains the property of CircleTel (Pty) Ltd at all times. The Customer has no right, title, or interest in the equipment." |
| CW-CT-011 | Equipment access clause | "The Customer grants CircleTel, its employees, and authorised contractors reasonable access to the premises for the purposes of installation, maintenance, firmware updates, fault resolution, and equipment recovery." |
| CW-CT-012 | Equipment care obligation | "The Customer shall take reasonable care of all CircleTel equipment installed at the premises. The Customer shall not move, modify, disconnect, or tamper with any equipment without prior written consent from CircleTel." |
| CW-CT-013 | Damage / loss liability | "In the event of damage, theft, or loss of CircleTel equipment due to the Customer's negligence, the Customer shall be liable for the replacement cost of the equipment at current dealer pricing." |
| CW-CT-014 | Wi-Fi design plan attachment | The signed Wi-Fi design plan (from site survey) forms Schedule B of the contract, detailing AP placement, SSID configuration, VLAN topology, and bandwidth allocations |
| CW-CT-015 | SLA attachment | The applicable SLA parameters (per Section 14) form Schedule C of the contract |
| CW-CT-016 | Speed / technology disclosure | If backhaul is MTN Tarana G1 FWB: contract MUST include disclosure of 4:1 asymmetric speed ratio with customer acknowledgement signature |
| CW-CT-017 | CPA compliance | Contract MUST comply with Consumer Protection Act 68 of 2008: plain language, no unfair terms, cooling-off period (5 business days for direct marketing), and early termination formula disclosure |

### 11.3 Multi-Site Master Agreements

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-CT-020 | Master agreement available | Customer commits to 3+ sites | Offer master service agreement (MSA) with site-specific schedules. MSA governs common terms; each site has a unique deployment schedule |
| CW-CT-021 | MSA pricing | Multi-site under MSA | Apply multi-site discount (CW-PR-011 or CW-PR-012). Lock pricing for duration of MSA rollout period (maximum 12 months) |
| CW-CT-022 | MSA rollout schedule | MSA signed | Define rollout calendar with milestones. Sites not deployed within 12 months of MSA signing revert to current pricing |
| CW-CT-023 | MSA single credit assessment | Multi-site MSA | Single credit assessment covers all sites under MSA. Individual site credit checks waived |

---

## 12. Credit Vetting & Onboarding Workflow

### 12.1 Onboarding Workflow — Step by Step

```
1. LEAD QUALIFICATION
   └─ Sales qualifies entity type (CW-CE-001 to CW-CE-009)
   └─ Sales qualifies venue type (CW-VE-001 to CW-VE-020)
   └─ IF ELIGIBLE → Proceed to Step 2
   └─ IF NOT ELIGIBLE → Redirect to appropriate product

2. DOCUMENTATION COLLECTION
   └─ Collect mandatory documents (CW-CE-020 to CW-CE-027)
   └─ FICA compliance check
   └─ IF COMPLETE → Proceed to Step 3
   └─ IF INCOMPLETE → Hold; notify sales. 10 business day deadline

3. CREDIT ASSESSMENT
   └─ Run commercial credit bureau check
   └─ Apply credit rules (CW-CE-030 to CW-CE-038)
   └─ IF PASS → Proceed to Step 4
   └─ IF MARGINAL → Apply conditions; proceed to Step 4
   └─ IF FAIL → Escalate to Sales Manager; apply alternative options or REJECT

4. SITE SURVEY SCHEDULING
   └─ Schedule site survey within 5 business days
   └─ Assign qualified technician or RF specialist
   └─ Conduct physical or virtual survey (CW-SQ-001 to CW-SQ-017)

5. WI-FI DESIGN PLAN & PROPOSAL
   └─ Produce Wi-Fi design plan (AP count, placement, cabling, VLANs)
   └─ Determine tier (CW-TS-001 to CW-TS-005)
   └─ Select backhaul (CW-BH-001 to CW-BH-016)
   └─ Apply vertical package if applicable (CW-VP-001 to CW-VP-004)
   └─ Calculate pricing with applicable discounts (Section 9)
   └─ Present proposal to customer

6. CONTRACT SIGNING
   └─ Generate contract with all schedules (equipment, SLA, design plan)
   └─ Customer reviews and signs
   └─ Capture contract in AgilityGIS BSS
   └─ CPA 5-day cooling-off period starts (if direct marketing)

7. PROVISIONING
   └─ Proceed to Section 13 (Deployment Workflow)
```

---

## 13. Site Survey & Deployment Workflow

### 13.1 Site Survey Process

| Rule ID | Step | Responsible | Deliverable | SLA |
|---|---|---|---|---|
| CW-DW-001 | Schedule survey | Sales / Admin | Confirmed appointment with customer | Within 5 business days of credit PASS |
| CW-DW-002 | Conduct RF survey | Technician / RF Specialist | RF environment scan, interference map, signal propagation notes | During survey visit |
| CW-DW-003 | Measure venue dimensions | Technician | Floor plan with measurements (or annotated customer-provided plan) | During survey visit |
| CW-DW-004 | Assess power and cabling | Technician | Power availability per AP zone; cabling pathway assessment | During survey visit |
| CW-DW-005 | Document mounting locations | Technician | Photo documentation of each proposed AP and gateway mounting location | During survey visit |
| CW-DW-006 | Assess backhaul entry point | Technician | Confirm where backhaul (fibre, FWB RN, DUNE CPE) enters the building and how it reaches the gateway | During survey visit |
| CW-DW-007 | Produce Wi-Fi design plan | Technical Lead | Formal design plan document (see CW-SQ-003) | Within 3 business days of survey |
| CW-DW-008 | Produce bill of materials | Technical Lead | Itemised BOM: APs (model, quantity), gateway, switches, cabling, accessories | Included in design plan |
| CW-DW-009 | Customer sign-off on design | Sales / AM | Signed design plan approval | Within 5 business days of design delivery |

### 13.2 Pre-Installation Preparation

| Rule ID | Step | Responsible | Action | SLA |
|---|---|---|---|---|
| CW-DW-010 | Procure hardware | Operations | Order all BOM items from Scoop Distribution (primary) or MiRO (secondary) | Within 2 business days of contract signing |
| CW-DW-011 | Pre-configure hardware | NOC / Technical | Pre-configure gateway (VLANs, DHCP, QoS policies, firewall rules) and register APs on Ruijie Cloud organisation | Within 3 business days of hardware receipt |
| CW-DW-012 | Assign site on Ruijie Cloud | NOC | Create site/network on Ruijie Cloud; assign pre-configured APs | During pre-configuration |
| CW-DW-013 | Configure SSIDs | NOC | Create SSIDs per design plan: staff (WPA3-Enterprise), guest (captive portal), IoT (isolated), management (CircleTel-only) | During pre-configuration |
| CW-DW-014 | Stage captive portal | NOC / Marketing | Deploy standard or custom captive portal template on guest SSID | During pre-configuration |
| CW-DW-015 | Schedule installation | Operations | Confirm installation date with customer; minimum 3 business days' notice | Within 2 business days of hardware staged |
| CW-DW-016 | Prepare field kit | Technician | Verify all BOM items packed, cabling, tools, labelling, test equipment | Day before installation |

### 13.3 Installation Process

| Rule ID | Step | Responsible | Action | Verification |
|---|---|---|---|---|
| CW-DW-020 | Backhaul verification | Technician | Confirm backhaul connectivity is active and tested (speed test, latency check) | Record speed test results; compare to backhaul tier |
| CW-DW-021 | Gateway installation | Technician | Install and cable gateway router at designated location; connect to backhaul | Gateway powers on; obtains WAN IP; management interface accessible |
| CW-DW-022 | Structured cabling | Technician / Cabling Contractor | Run CAT6 UTP from gateway/PoE switch to each AP mounting location | Cable tested with cable tester; labelled at both ends |
| CW-DW-023 | AP mounting | Technician | Mount each AP at designated location per design plan | AP securely mounted; tamper-proof where specified; ceiling bracket or wall mount per plan |
| CW-DW-024 | AP power-up and ZTP | Technician / NOC | Power APs via PoE; APs auto-register on Ruijie Cloud (ZTP) and pull configuration | Each AP appears online in Ruijie Cloud dashboard; configuration pulled successfully |
| CW-DW-025 | SSID verification | Technician | Walk-test all SSIDs across all zones; verify signal strength, VLAN isolation, and captive portal | Signal strength ≥ -65 dBm in all designated coverage areas; VLAN isolation confirmed via ping test |
| CW-DW-026 | QoS verification | NOC | Run traffic tests to confirm QoS prioritisation (VoIP > staff > guest > IoT) | Priority traffic receives allocated bandwidth under load |
| CW-DW-027 | Speed test per SSID | Technician | Conduct speed test on each SSID from representative location | Results documented; compared to design plan bandwidth allocations |
| CW-DW-028 | Customer walkthrough | Technician / Sales | Walk customer through coverage, SSIDs, captive portal, and management app | Customer confirms satisfaction |
| CW-DW-029 | Customer sign-off | Technician | Obtain signed installation completion form (including equipment schedule) | Signed form; scanned and uploaded to CRM. Contract commencement date set |
| CW-DW-030 | NOC handover | NOC | Site added to NOC monitoring dashboard; alert thresholds configured; support playbook activated | Site visible in NOC; alerts tested |

### 13.4 Installation SLA

| Rule ID | Metric | Target | Escalation |
|---|---|---|---|
| CW-DW-040 | Survey to design plan | ≤ 3 business days | Technical Lead |
| CW-DW-041 | Design sign-off to installation | ≤ 10 business days | Operations Manager |
| CW-DW-042 | Installation duration — Essential | ≤ 4 hours on-site | N/A |
| CW-DW-043 | Installation duration — Professional | ≤ 1 business day on-site | N/A |
| CW-DW-044 | Installation duration — Enterprise | ≤ 2 business days on-site | Operations Manager |
| CW-DW-045 | Installation duration — Campus | 3–5 business days on-site (phased) | Operations Manager / MD |

---

## 14. SLA Entitlement Rules

### 14.1 SLA Parameters by Tier

| Rule ID | SLA Parameter | Essential | Professional | Enterprise | Campus |
|---|---|---|---|---|---|
| CW-SL-001 | Wi-Fi uptime guarantee | 99.0% | 99.5% | 99.9% | 99.9% |
| CW-SL-002 | Fault response time | Next business day | 8 business hours | 4 hours (24/7) | 2 hours (24/7) |
| CW-SL-003 | Hardware replacement | 48 hours | 24 hours | 8 hours | 4 hours (on-site spare kit) |
| CW-SL-004 | Remote resolution target | 4 hours | 2 hours | 1 hour | 30 minutes |
| CW-SL-005 | Service credit per breach | 5% of CloudWiFi MRC | 5% of CloudWiFi MRC | 10% of CloudWiFi MRC | 15% of CloudWiFi MRC |
| CW-SL-006 | Quarterly performance review | NOT included | INCLUDED | INCLUDED | INCLUDED (monthly) |
| CW-SL-007 | Dedicated Account Manager | NOT included | NOT included | INCLUDED | INCLUDED |
| CW-SL-008 | Escalation path | Tier 1 → Tier 2 | Tier 1 → Tier 2 → AM | Direct to AM → NOC Lead | Dedicated AM → NOC Lead → CTO |

### 14.2 Uptime Measurement Rules

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-SL-010 | Uptime measured per site | Each CloudWiFi site has independent uptime calculation | If 1 of 5 APs is offline, uptime is degraded proportionally (1/5 = 20% of site capacity offline) |
| CW-SL-011 | Uptime excludes scheduled maintenance | CircleTel notifies customer ≥ 48 hours in advance | Maintenance window not counted in uptime calculation. Maintenance scheduled outside business hours where possible |
| CW-SL-012 | Uptime excludes force majeure | Load shedding, natural disaster, civil unrest, ISP backbone outage | Force majeure events documented and excluded. Customer notified |
| CW-SL-013 | Uptime excludes customer-caused outages | Customer disconnects equipment, power interruption at premises (no UPS), building electrical fault | Documented via NOC investigation; excluded from SLA calculation |
| CW-SL-014 | Backhaul outage responsibility | Backhaul failure (not Wi-Fi failure) | If CircleTel-managed backhaul: included in uptime calculation. If shared/building backhaul not managed by CircleTel: excluded |

### 14.3 Service Credit Mechanism

| Rule ID | Monthly Uptime Achieved | Credit (% of CloudWiFi MRC) | Cap |
|---|---|---|---|
| CW-SL-020 | ≥ SLA guarantee | 0% | N/A |
| CW-SL-021 | SLA guarantee minus 0.5% | 5% | 5% |
| CW-SL-022 | SLA guarantee minus 1.0% | 10% | 10% |
| CW-SL-023 | Below SLA guarantee minus 1.0% | 15% | 15% of monthly CloudWiFi MRC (maximum) |
| CW-SL-024 | Credit application | Customer must REQUEST service credit within 30 days of breach month | Credit applied as discount on next invoice. NO cash refunds |
| CW-SL-025 | Credit does not apply to add-ons | Service credit calculated on base CloudWiFi tier MRC only | Add-on MRC excluded from service credit calculation |
| CW-SL-026 | Chronic SLA breach | 3+ consecutive months below SLA guarantee | Customer may terminate contract without penalty. CircleTel must offer remediation plan before termination executed |

---

## 15. Cloud Management & Monitoring Rules

### 15.1 Ruijie Cloud Management

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-CM-001 | All CloudWiFi sites managed via Ruijie Cloud | Mandatory — no exceptions | Every AP and gateway MUST be registered on CircleTel's Ruijie Cloud organisation account |
| CW-CM-002 | Customer does NOT have admin access to Ruijie Cloud | Fully managed model | Customer receives read-only access to their site dashboard (if Analytics add-on active). Configuration changes ONLY via CircleTel NOC |
| CW-CM-003 | Firmware updates managed by CircleTel | Ruijie releases firmware update | NOC evaluates update in staging environment → schedules deployment during off-peak hours → notifies customer 48 hours in advance → applies OTA update |
| CW-CM-004 | Configuration change requests | Customer requests SSID name change, password change, bandwidth adjustment, or VLAN modification | Customer submits request via support ticket. NOC implements within SLA response time (per tier). NO self-service configuration by customer |
| CW-CM-005 | Rogue SSID detection | Ruijie Cloud detects unauthorised SSID broadcasting from site | NOC investigates: if customer-installed equipment, advise removal. If interference from neighbouring premises, adjust channels/power |
| CW-CM-006 | AP offline alert | Ruijie Cloud detects AP offline for > 5 minutes | Auto-create fault ticket in support system. NOC investigates remotely (check PoE, reboot, network path). If not resolved in 30 minutes, escalate per tier SLA |

### 15.2 NOC Monitoring

| Rule ID | Metric Monitored | Threshold | Action |
|---|---|---|---|
| CW-CM-010 | AP online status | ANY AP offline > 5 min | Auto-ticket + remote investigation |
| CW-CM-011 | Channel utilisation | > 80% sustained for 15 min | Alert NOC; consider channel change or power adjustment |
| CW-CM-012 | Client count per AP | > 90% of AP capacity (e.g., > 230/256 clients) | Alert NOC; consider AP augmentation or load balancing |
| CW-CM-013 | Backhaul throughput | < 50% of contracted speed sustained for 30 min | Alert NOC; investigate backhaul. Escalate to backhaul provider if CircleTel-managed |
| CW-CM-014 | Gateway CPU/memory | > 85% utilisation | Alert NOC; investigate traffic patterns. Consider gateway upgrade |
| CW-CM-015 | PoE power budget | > 90% of switch/router PoE budget | Alert NOC; prevent additional AP connections until resolved |
| CW-CM-016 | Client connectivity failures | > 10% authentication failures in 1 hour | Alert NOC; investigate RADIUS/SSID/password issues |

---

## 16. Hardware Ownership & Asset Management Rules

### 16.1 Ownership Principles

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-HW-001 | CircleTel owns ALL CloudWiFi hardware | ALL deployments, ALL tiers, entire contract duration and beyond | Hardware remains CircleTel property until formally disposed of. No sale, lease, or transfer of ownership to customer — ever |
| CW-HW-002 | Hardware tracked in asset register | Every deployed item (AP, gateway, switch, PoE injector) | Record in CircleTel hardware asset register: model, serial number, site ID, deployment date, replacement history |
| CW-HW-003 | Customer cannot move or modify equipment | Customer attempts to relocate AP, change gateway settings, or disconnect device | Contract breach per CW-CT-012. Customer warned; NOC can detect via Ruijie Cloud (device offline or location change). Repeated violation: escalate to AM |
| CW-HW-004 | Hardware refresh cycle | Equipment reaches 5 years deployed age OR end-of-life from manufacturer | Schedule proactive hardware refresh during next maintenance window. Customer notified; no additional charge (included in MRC) |
| CW-HW-005 | Spare hardware pool | NOC / Operations | Maintain 10% spare pool of most-deployed AP models and gateway routers. Minimum 5 APs and 2 gateways in reserve at all times |

### 16.2 Hardware Replacement Rules

| Rule ID | Rule | Condition | Replacement Timeline | Cost |
|---|---|---|---|---|
| CW-HW-010 | Faulty hardware (warranty) | Hardware fails within manufacturer warranty (typically 3 years) | Per tier SLA (4–48 hours) | Zero cost to customer — CircleTel covers |
| CW-HW-011 | Faulty hardware (out of warranty) | Hardware fails after warranty period | Per tier SLA | Zero cost to customer — included in MRC (CloudWiFi is a managed service) |
| CW-HW-012 | Hardware damaged by customer negligence | Physical damage, water damage, power surge (no UPS), or tampering | Best-effort replacement within SLA | Customer liable for replacement cost at current dealer pricing. Invoice issued |
| CW-HW-013 | Hardware stolen | Theft reported by customer | Best-effort replacement | Customer liable UNLESS: (a) theft reported to SAPS within 24 hours, AND (b) case number provided, AND (c) CircleTel insurance claim lodged. If insurance covers loss, zero cost to customer (excess may apply) |
| CW-HW-014 | Lightning / power surge damage | Environmental damage | Best-effort replacement | CircleTel bears cost IF UPS was in place. Customer bears cost IF UPS was recommended but declined (documented in contract per CW-SQ-016) |
| CW-HW-015 | Technology upgrade (customer request) | Customer requests newer AP model or additional APs | Scheduled during maintenance window | Customer pays difference in hardware cost (if any) + installation NRC for additional units |

### 16.3 Asset Register Requirements

| Rule ID | Field | Mandatory? | Description |
|---|---|---|---|
| CW-HW-020 | Asset ID | Yes | CircleTel internal unique identifier |
| CW-HW-021 | Device model | Yes | Manufacturer and model (e.g., Reyee RG-RAP2200(F)) |
| CW-HW-022 | Serial number | Yes | Manufacturer serial number |
| CW-HW-023 | MAC address | Yes | Device MAC address (for Ruijie Cloud identification) |
| CW-HW-024 | Site ID | Yes | CircleTel site identifier (linked to CRM and BSS) |
| CW-HW-025 | Deployment date | Yes | Date equipment was installed and commissioned |
| CW-HW-026 | Location within venue | Yes | Description of physical location (e.g., "Ceiling — main dining area, east wall") |
| CW-HW-027 | Warranty expiry | Yes | Manufacturer warranty end date |
| CW-HW-028 | Status | Yes | Active / Spare / In-transit / RMA / Recovered / Disposed |
| CW-HW-029 | Replacement history | Conditional | Log of any replacements (date, reason, replacement serial) |

---

## 17. Upgrade, Downgrade & Migration Rules

### 17.1 Tier Upgrade

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-UD-001 | Customer requests tier upgrade | Customer wants more APs, better SLA, or additional features | Conduct supplementary site survey (if additional APs required). Generate change order with new MRC, additional hardware, and installation NRC for new APs |
| CW-UD-002 | Upgrade pricing | Upgrade to higher tier | New MRC applies from next billing cycle. Pro-rata credit for remaining days at old MRC. Additional installation NRC applies for new hardware only |
| CW-UD-003 | Upgrade contract impact | Upgrade within existing contract | Contract term RESETS to new minimum (24 or 36 months from upgrade date). Customer must agree in writing |
| CW-UD-004 | Upgrade approval | All tier upgrades | Approval: Sales Manager for Essential→Professional; AM for Professional→Enterprise; MD for Enterprise→Campus |

### 17.2 Tier Downgrade

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-UD-010 | Downgrade NOT permitted during contract | Customer requests lower tier during fixed term | REJECT — contract commits customer to selected tier for full term. CPA early termination applies if customer insists |
| CW-UD-011 | Downgrade permitted post-contract | Customer on month-to-month (after contract expiry) requests lower tier | Permitted with 30 days' notice. Surplus APs recovered by CircleTel. MRC adjusts from next billing cycle |
| CW-UD-012 | Downgrade — equipment recovery | Downgrade results in fewer APs required | CircleTel schedules equipment recovery visit. Removed APs returned to spare pool |

### 17.3 Migration from Other Products

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-UD-020 | Migration from customer-owned Wi-Fi | Customer has existing Wi-Fi (Ubiquiti, MikroTik, Ruckus, etc.) and wants CloudWiFi | Full CloudWiFi deployment. Customer's existing equipment remains customer's property (CircleTel does not remove third-party hardware). New CloudWiFi APs deployed alongside or replacing customer equipment |
| CW-UD-021 | Migration from competitor managed Wi-Fi | Customer currently with another managed Wi-Fi provider | Honour existing contract obligations (customer's responsibility). Deploy CloudWiFi once competitor equipment removed. Offer "migration incentive" (waived installation or first month free) — Sales Manager approval |
| CW-UD-022 | Migration from ThinkWiFi to CloudWiFi | Venue currently has ThinkWiFi ad-funded Wi-Fi | ThinkWiFi captive portal may be retained as CloudWiFi guest SSID add-on (CW-AO-003). Hardware may be reused if compatible (Reyee APs). If hardware upgrade required, swap under CloudWiFi asset register |

---

## 18. Cancellation & Equipment Recovery Policies

### 18.1 Cancellation Rules

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-CN-001 | Cancellation during contract | Customer cancels before contract expiry | Early termination fee applies per CPA formula: remaining months × MRC × declining percentage. Formula: ETF = Remaining Months × MRC × (1 − (Months Served / Total Contract Months)). Example: Month 12 of 24-month at R3 499 MRC → ETF = 12 × R3 499 × 0.50 = R20 994 |
| CW-CN-002 | Cancellation post-contract | Customer on month-to-month after contract expiry | 30 days' written notice required. No penalty. Final invoice includes final month's MRC |
| CW-CN-003 | Cancellation notice format | ALL cancellations | Must be in WRITING (email accepted). Verbal cancellation acknowledged but MUST be followed by written confirmation within 5 business days |
| CW-CN-004 | Cancellation effective date | Notice received | Cancellation effective on the last day of the notice period (30 days from receipt of written notice, or end of ETF payment, whichever is later) |
| CW-CN-005 | CPA cooling-off cancellation | Customer signed contract via direct marketing (e.g., telesales, door-to-door) | 5 business days cooling-off period from date of contract signing. Full refund of any payments; equipment recovered at CircleTel's cost. No penalty |
| CW-CN-006 | Cancellation due to chronic SLA breach | 3+ consecutive months below SLA guarantee (CW-SL-026) | Customer may terminate without penalty. CircleTel must offer remediation plan first. If remediation rejected or fails, penalty-free exit |
| CW-CN-007 | Cancellation due to relocation | Customer relocates to address where no CircleTel coverage exists | Early termination fee REDUCED by 50% as goodwill (Sales Manager approval). If customer relocates to covered address, offer service transfer (see CW-CN-010) |

### 18.2 Service Transfer (Relocation)

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-CN-010 | Service transfer to new address | Customer relocates within CircleTel coverage area | Conduct site survey at new address. If feasible: recover equipment from old site, deploy at new site. NRC: R1 500–R5 000 (depending on complexity). Contract term continues (no reset unless customer requests upgrade) |
| CW-CN-011 | Service transfer — hardware compatibility | New site requires different AP types or more/fewer APs than current deployment | Adjust hardware per new site survey. Customer pays only for NET additional hardware and cabling |

### 18.3 Equipment Recovery

| Rule ID | Rule | Condition | Action | Timeline |
|---|---|---|---|---|
| CW-CN-020 | Equipment recovery mandatory | ALL CloudWiFi cancellations or terminations | CircleTel MUST recover all owned equipment from customer premises | Within 15 business days of service end date |
| CW-CN-021 | Customer must provide access | Cancellation confirmed | Customer is contractually obligated (CW-CT-011) to provide reasonable access for equipment recovery. CircleTel schedules recovery visit with minimum 3 business days' notice |
| CW-CN-022 | Customer refuses access | Customer denies entry or repeatedly reschedules | Escalate to Sales Manager → MD. Send formal demand letter (7 business days to comply). If still refused, recover through legal channels; customer liable for equipment cost + legal fees |
| CW-CN-023 | Equipment condition at recovery | Equipment recovered from site | Inspect and categorise: (a) Functional — return to spare pool, (b) Damaged — assess liability per CW-HW-012, (c) End-of-life — dispose per e-waste regulations |
| CW-CN-024 | Equipment not recoverable | Equipment missing, stolen, or destroyed | Customer liable for replacement cost per CW-HW-013. Invoice issued. If unpaid, handed to collections |
| CW-CN-025 | Data erasure at recovery | Equipment recovered | Factory-reset ALL recovered equipment before redeployment. Ruijie Cloud site/network deleted. Customer data purged. POPIA compliance mandatory |
| CW-CN-026 | Final account reconciliation | Service terminated and equipment recovered | Issue final statement: outstanding MRC, ETF (if applicable), NRC balance, equipment replacement charges (if applicable). Credit any prepaid amounts. Account closed in BSS |

---

## 19. ThinkWiFi Integration Rules

### 19.1 ThinkWiFi Overview

ThinkWiFi is CircleTel's ad-funded free Wi-Fi platform (powered by Think Digital X). When integrated with CloudWiFi, the guest SSID captive portal is replaced with a ThinkWiFi monetised portal that serves advertisements to users before granting internet access. CircleTel earns advertising revenue share.

### 19.2 Integration Rules

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-TW-001 | ThinkWiFi is an add-on, not a tier replacement | Customer wants ThinkWiFi on CloudWiFi site | ThinkWiFi integration is add-on CW-AO-003 (R500/month + revenue share + R1 500 NRC portal setup). It does NOT replace the CloudWiFi MRC |
| CW-TW-002 | ThinkWiFi replaces standard captive portal | ThinkWiFi integration activated | ThinkWiFi captive portal replaces the standard or custom captive portal on the GUEST SSID only. Staff, IoT, and management SSIDs unaffected |
| CW-TW-003 | ThinkWiFi requires guest SSID | No guest SSID configured | Guest SSID MUST be enabled before ThinkWiFi activation. If Essential tier customer only has 2 SSIDs (staff + guest), ThinkWiFi is permitted |
| CW-TW-004 | ThinkWiFi conflicts with custom portal | Customer has active custom captive portal (CW-AO-001) on guest SSID | Customer must choose: ThinkWiFi portal OR custom portal. Cannot run both on the same SSID. If customer has Enterprise/Campus (which includes custom portal), they may choose to swap to ThinkWiFi or retain custom |
| CW-TW-005 | ThinkWiFi revenue share model | ThinkWiFi active on CloudWiFi site | Revenue share: CircleTel receives percentage of ad revenue generated at the site. Terms per ThinkWiFi Product Specification v2.1. Revenue credited monthly against CloudWiFi invoice or paid separately |
| CW-TW-006 | ThinkWiFi bandwidth allocation | ThinkWiFi active | Guest SSID bandwidth cap applies (per QoS policy). ThinkWiFi ad-loading traffic counts towards guest bandwidth allocation. Ensure sufficient backhaul for ad content delivery (minimum 10 Mbps to guest SSID recommended) |
| CW-TW-007 | ThinkWiFi and healthcare venues | Healthcare vertical customer requests ThinkWiFi | ALLOWED on patient/visitor Wi-Fi. ThinkWiFi portal MUST NOT collect personal health information. Standard ThinkWiFi data collection (name, email for ad targeting) permitted on patient Wi-Fi unless customer specifically requests anonymous access |
| CW-TW-008 | ThinkWiFi and education venues | Education vertical customer requests ThinkWiFi | CONDITIONAL: ThinkWiFi ad content must comply with content filtering requirements. Ads targeting minors must comply with ASA Code and Films & Publications Act. ThinkWiFi content categories must be approved by school/institution before go-live |

---

## 20. Cross-Sell & Portfolio Alignment Rules

### 20.1 Cross-Sell Triggers

| Rule ID | Trigger | Cross-Sell Recommendation | Action |
|---|---|---|---|
| CW-XS-001 | CloudWiFi sold without bundled connectivity | Customer on BYOC (existing CircleTel connection) | Recommend connectivity upgrade if current service < backhaul minimum threshold. Bundle discount (CW-PR-010) available |
| CW-XS-002 | CloudWiFi customer has no IT management | Customer managing their own IT | Recommend CircleTel Managed IT Services. Create "whole-of-venue" managed services package |
| CW-XS-003 | CloudWiFi customer has no VoIP | Customer using legacy PBX or mobile-only | Recommend CircleTel VoIP service. VoIP QoS already included in CloudWiFi (CW-AO-010) — upsell is natural |
| CW-XS-004 | CloudWiFi customer has CCTV on guest SSID | CCTV detected on non-isolated VLAN | Recommend SafeGuard CCTV solution with dedicated CCTV VLAN (CW-AO-008). Security consultation upsell |
| CW-XS-005 | CloudWiFi customer requests IoT connectivity | Customer has sensors, smart devices, or building management system | Recommend CircleConnect IoT product. IoT VLAN already available in Professional+ tiers |
| CW-XS-006 | CloudWiFi Hospitality customer | Hotel, lodge, or B&B with CloudWiFi | Recommend ThinkWiFi integration for guest Wi-Fi monetisation. Revenue share offsets CloudWiFi cost |
| CW-XS-007 | CloudWiFi Education customer | School or campus with CloudWiFi | Recommend EduConnect managed IT and LearnLink DUNE backbone (for multi-building campuses) |
| CW-XS-008 | CloudWiFi office park tenant | Tenant in office park | Recommend ParkConnect DUNE backbone as CloudWiFi backhaul for all tenants. Multi-tenant opportunity |
| CW-XS-009 | CloudWiFi customer moving to month-to-month | Contract expiry approaching | Proactive retention call. Offer renewal incentive (5% discount for new 24/36-month term). Upsell any unused add-ons |

### 20.2 Cannibalisation Guard Rails

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-XS-010 | CloudWiFi is NOT a connectivity product | Customer asks for CloudWiFi as a substitute for internet connectivity | CLARIFY: CloudWiFi is a managed Wi-Fi overlay. It requires underlying connectivity (bundled or BYOC). It is not a standalone internet service |
| CW-XS-011 | CloudWiFi vs Managed IT Services | Customer has full Managed IT and wants CloudWiFi | CloudWiFi can be a component of Managed IT. Offer as an add-on to Managed IT contract rather than a separate agreement (reduces admin, improves pricing) |
| CW-XS-012 | CloudWiFi Essential vs WorkConnect SOHO | SOHO customer requests CloudWiFi Essential for their home office | REDIRECT to WorkConnect SOHO (includes managed Reyee router with Wi-Fi coverage). CloudWiFi is designed for commercial venues, not home offices |
| CW-XS-013 | CloudWiFi vs customer self-install | Customer wants to buy Reyee APs directly and self-manage | Explain value of managed service: zero CAPEX, professional design, ongoing monitoring, firmware management, support. If customer insists on self-install, this is outside CloudWiFi scope. Direct to Scoop Distribution as a hardware reseller |

### 20.3 Portfolio MRR Expansion Model

CloudWiFi is positioned as the "land" product that opens cross-sell pathways:

| Step | Product | Additional MRR | Cumulative MRR |
|---|---|---|---|
| 1. Land | CloudWiFi Professional | R3 499 | R3 499 |
| 2. Bundle connectivity | SkyFibre SMB 100 Mbps or BizFibreConnect | R1 899–R2 599 | R5 398–R6 098 |
| 3. Add security | SafeGuard CCTV VLAN + monitoring | R500–R2 000 | R5 898–R8 098 |
| 4. Add monetisation | ThinkWiFi integration | R500 + rev share | R6 398–R8 598 |
| 5. Add IoT | CircleConnect sensors | R500–R1 500 | R6 898–R10 098 |
| 6. Add managed IT | Managed IT Services | R2 500–R10 000 | R9 398–R20 098 |
| 7. Add VoIP | Voice services | R149–R1 000 | R9 547–R21 098 |

---

## 21. Partner & Reseller Rules

### 21.1 Partner Eligibility

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-PT-001 | Authorised CloudWiFi partners | Partner must be an approved CircleTel reseller with signed partner agreement | Partner may sell CloudWiFi under CircleTel brand. Partner does NOT deploy, configure, or support — CircleTel retains full managed service delivery |
| CW-PT-002 | Partner role — referral only (Year 1) | CloudWiFi launch phase | Partners earn referral commission only (lead generation). All site surveys, deployment, and support handled by CircleTel. This protects service quality during early deployments |
| CW-PT-003 | Partner role — sales enablement (Year 2+) | CloudWiFi matured | Partners may conduct initial sales qualification and site assessment. All technical design, deployment, and management remains CircleTel responsibility |
| CW-PT-004 | Partner commission — CloudWiFi | Partner generates qualified CloudWiFi lead that converts | Commission: 10% of first 12 months' MRC (paid monthly in arrears). Residual: 5% of ongoing MRC for months 13–24. Post-24 months: zero residual (partner re-earns if renewal is partner-driven) |
| CW-PT-005 | Partner cannot sell standalone CloudWiFi | Partner attempts to sell CloudWiFi without CircleTel connectivity | Partner MUST recommend bundled connectivity. If customer has existing third-party connectivity, partner must facilitate connectivity migration to CircleTel (per CW-BH-014) |

### 21.2 Partner Training Requirements

| Rule ID | Training Module | Required? | Delivery | Duration |
|---|---|---|---|---|
| CW-PT-010 | CloudWiFi product positioning | Mandatory | Online (recorded) | 1 hour |
| CW-PT-011 | Site qualification checklist | Mandatory | Online (recorded) | 30 minutes |
| CW-PT-012 | CloudWiFi pricing and quoting | Mandatory | Online (live) | 1 hour |
| CW-PT-013 | Vertical market selling | Optional | Workshop | 2 hours |
| CW-PT-014 | Cross-sell & bundling | Recommended | Online (recorded) | 45 minutes |

### 21.3 Arlan Backstop Channel

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-PT-020 | Arlan backstop for CloudWiFi leads | CloudWiFi lead originates from Arlan (CircleTel's backstop sales partner) | Standard Arlan commission structure applies per Arlan Sales Agreement. CloudWiFi treated as additional product line under existing agreement |
| CW-PT-021 | Arlan cannot deploy CloudWiFi | Arlan generates lead and closes deal | Arlan handles sales and contract. CircleTel handles ALL site survey, design, deployment, and management. No exceptions |

---

## 22. Regulatory & Compliance Policies

### 22.1 ICASA Compliance

| Rule ID | Rule | Regulation | Action |
|---|---|---|---|
| CW-RC-001 | CircleTel licensed to provide services | ECA licence, ECNS licence | CloudWiFi delivered under CircleTel's ECNS and ECS licences as registered with ICASA (see ICASA Licence Register v1.0) |
| CW-RC-002 | Wi-Fi spectrum compliance | 2.4 GHz (ISM band) and 5 GHz (UNII bands) | All Reyee APs operate within unlicensed ISM and UNII bands. No additional spectrum licensing required. AP transmit power must comply with ICASA regulations (per Reyee factory defaults — compliant) |
| CW-RC-003 | Type approval | All wireless equipment | All Reyee AP models and gateway routers MUST have valid ICASA type approval certificates. Verify with Scoop Distribution before deployment of any new model |

### 22.2 POPIA Compliance

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-RC-010 | Personal information collection — captive portal | Guest SSID with captive portal collects personal information (name, email, phone) | Captive portal MUST include POPIA-compliant privacy notice and T&Cs acceptance. Data retention limited to 12 months. Opt-out mechanism required |
| CW-RC-011 | Personal information processing — analytics | CloudWiFi Analytics add-on active | Analytics data (device MAC, usage patterns, dwell time) constitutes personal information under POPIA. Anonymise data where possible. Customer is the "responsible party"; CircleTel is the "operator" (data processor). Data processing agreement required in contract |
| CW-RC-012 | Data breach notification | Suspected or confirmed breach of personal information collected via CloudWiFi | Notify customer within 72 hours. Notify Information Regulator as required by POPIA Section 22. Document breach, impact assessment, and remediation actions |
| CW-RC-013 | Healthcare POPIA — patient Wi-Fi | Healthcare venue with patient-facing Wi-Fi | Per CW-VP-020: no personal data collection on patient SSID. Anonymous access only. If patient registers via captive portal, POPIA notice must include healthcare-specific data handling disclosures |
| CW-RC-014 | Data erasure at service termination | CloudWiFi service cancelled or terminated | Per CW-CN-025: factory-reset all recovered equipment. Delete Ruijie Cloud site data. Purge any stored captive portal logs, analytics data, and RADIUS session records. Confirm erasure to customer in writing |

### 22.3 CPA Compliance

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-RC-020 | Plain language contracts | ALL CloudWiFi contracts | Contract must be in plain language per CPA Section 22. No jargon without definition. All technical terms explained |
| CW-RC-021 | No unfair contract terms | ALL CloudWiFi contracts | Contract must not contain terms that are unconscionable, one-sided, or that waive customer's CPA rights. Legal review required before contract template finalised |
| CW-RC-022 | Cooling-off period | Contract signed via direct marketing | 5 business days cooling-off per CPA Section 16(3). Full refund; equipment recovered at CircleTel's cost |
| CW-RC-023 | Right to cancel with notice | Post-contract (month-to-month) | Customer may cancel with 20 business days' notice per CPA Section 14(2)(b)(i)(bb). CircleTel policy: 30 calendar days (more generous than CPA minimum) |
| CW-RC-024 | Service descriptions must be accurate | Marketing materials, proposals, contracts | No misleading claims about Wi-Fi speed, coverage, or performance. Speed claims must align with site survey design plan. "Up to" disclaimers where applicable |
| CW-RC-025 | Annual price increases | CPI / annual escalation | Maximum CPI or 8% (whichever is lower). 60 days' written notice per CW-PR-018. Customer may terminate if price increase exceeds CPA fair-pricing thresholds |

### 22.4 FICA Compliance

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-RC-030 | FICA verification mandatory | ALL new CloudWiFi customers | Verify identity per FICA: SA ID or passport, proof of address, company registration. Documents retained for minimum 5 years |
| CW-RC-031 | FICA record-keeping | Customer documentation | Store FICA documents securely (encrypted). Retention: 5 years from end of business relationship per FICA Section 22 |

### 22.5 Advertising & Marketing Compliance

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-RC-040 | Wi-Fi speed claims | Marketing materials mention Wi-Fi speed | Distinguish between Wi-Fi link speed (theoretical) and actual throughput. Use "Up to" disclaimers. Disclose that actual speeds depend on device, distance, interference, and backhaul |
| CW-RC-041 | "Unlimited" / "Uncapped" claims | Marketing refers to data usage | If backhaul is uncapped (SkyFibre, BizFibreConnect), CloudWiFi may be marketed as "Uncapped Wi-Fi". If backhaul is capped (LTE), DO NOT use "unlimited" or "uncapped" |
| CW-RC-042 | FWB backhaul speed disclosure | CloudWiFi site on MTN Tarana G1 FWB backhaul | MANDATORY: marketing and proposals must disclose 4:1 asymmetric ratio on FWB backhaul. "Wi-Fi speeds are subject to underlying broadband connection. FWB connections deliver download speeds of up to X Mbps and upload speeds of up to X/4 Mbps." |

---

## 23. Exception Handling & Escalation

### 23.1 Exception Authority Matrix

| Rule ID | Exception Type | Approval Authority | Escalation |
|---|---|---|---|
| CW-EX-001 | Credit score override (MARGINAL customer) | Sales Manager | MD if CAPEX > R25 000 |
| CW-EX-002 | Credit score override (FAIL customer) | MD | Board if contract value > R100 000 |
| CW-EX-003 | Discount above standard (> 10%) | Sales Director / MD | Board for anchor pricing |
| CW-EX-004 | Contract term below minimum | MD | Not available — no exceptions below minimum terms |
| CW-EX-005 | Third-party backhaul exception | MD (with CTO technical sign-off) | Strongly discouraged; SLA responsibility issue |
| CW-EX-006 | Site survey waiver (non-standard) | Technical Lead + Sales Manager | CTO if venue > 500 m² |
| CW-EX-007 | Hardware type substitution | Technical Lead | CTO if specification differs significantly |
| CW-EX-008 | SLA exception (higher than tier entitlement) | AM + Sales Manager | MD for custom SLA terms |
| CW-EX-009 | Cancellation penalty waiver | Sales Manager (≤ R10 000); MD (> R10 000) | Board if > R50 000 |
| CW-EX-010 | Founders offer extension (beyond 20 sites) | MD | Not extendable — create new promotional campaign instead |

### 23.2 Escalation Paths

```
TIER 1 SUPPORT (NOC)
  └─ Cannot resolve within SLA response time
      └─ Escalate to TIER 2 (Senior NOC / Technical Lead)
          └─ Cannot resolve within 2× SLA response time
              └─ Escalate to AM (Enterprise/Campus) or Operations Manager
                  └─ Cannot resolve within 24 hours
                      └─ Escalate to CTO
                          └─ Vendor escalation (Scoop Distribution / Ruijie)

SALES ESCALATION
  └─ Deal exception required (pricing, credit, contract)
      └─ Sales Manager (standard exceptions)
          └─ Sales Director / MD (significant exceptions)
              └─ Board (anchor agreements, bulk contracts > R100K)

BILLING / COLLECTIONS ESCALATION
  └─ Standard arrears process (CW-BL-020 to CW-BL-027)
      └─ Account Manager intervention (Enterprise/Campus)
          └─ Finance Manager (30+ days overdue)
              └─ MD (60+ days; termination decision)
                  └─ External collections (90+ days)
```

### 23.3 Exception Logging

| Rule ID | Rule | Condition | Action |
|---|---|---|---|
| CW-EX-020 | All exceptions logged | ANY deviation from BRD rules approved | Log in CRM: exception type, rule ID overridden, reason, approver, date, and customer impact |
| CW-EX-021 | Exception review | Monthly | Operations Manager reviews all exceptions logged in the month. Identify patterns. If same exception occurs 5+ times, propose BRD amendment to formalise the rule change |
| CW-EX-022 | Exception audit trail | Annual | Internal audit of all exceptions for compliance, financial impact, and process improvement |

---

## 24. Appendix: Decision Trees

### 24.1 CloudWiFi Lead Qualification Decision Tree

```
LEAD RECEIVED
│
├─ Is the customer a registered business or institution?
│   ├─ YES → Is the venue a commercial/institutional premises?
│   │   ├─ YES → Does the venue have CircleTel coverage (any technology)?
│   │   │   ├─ YES → QUALIFY — proceed to site survey
│   │   │   └─ NO → ADD to waitlist; check ParkConnect/DUNE coverage; notify when coverage available
│   │   └─ NO (residential home) → REDIRECT to WorkConnect SOHO or HomeFibreConnect
│   └─ NO (individual / consumer)
│       ├─ Is the venue a commercial venue operated by this individual (e.g., B&B, salon)?
│       │   ├─ YES → Treat as CW-CE-007 exception; verify venue; proceed
│       │   └─ NO → REDIRECT to residential products
│
└─ DISQUALIFIED — log reason in CRM
```

### 24.2 Tier Selection Decision Tree

```
SITE SURVEY COMPLETE
│
├─ AP count ≤ 2 AND venue < 300 m²
│   └─ RECOMMEND: Essential (R1 499/month)
│       └─ Does customer need formal SLA, analytics, or dedicated AM?
│           ├─ YES → UPGRADE to Professional
│           └─ NO → Confirm Essential
│
├─ AP count 3–5 AND venue 300–800 m²
│   └─ RECOMMEND: Professional (R3 499/month)
│       └─ Does customer need > 4 SSIDs, > 4 VLANs, or 24/7 support?
│           ├─ YES → UPGRADE to Enterprise
│           └─ NO → Confirm Professional
│
├─ AP count 6–12 AND venue 800–2 000 m²
│   └─ RECOMMEND: Enterprise (R7 999/month)
│       └─ Is the venue multi-building or > 12 APs required?
│           ├─ YES → UPGRADE to Campus
│           └─ NO → Confirm Enterprise
│
├─ AP count 12–30 OR multi-building
│   └─ RECOMMEND: Campus (R14 999/month)
│       └─ AP count > 30?
│           ├─ YES → CUSTOM / BESPOKE quote
│           └─ NO → Confirm Campus
│
└─ EXCEPTION: Customer insists on lower tier than recommended
    └─ Document acceptance of coverage gaps in writing
    └─ Sales Manager approval required
```

### 24.3 Backhaul Selection Decision Tree

```
VENUE ADDRESS CONFIRMED
│
├─ DFA Fibre available?
│   ├─ YES → PREFERRED for Enterprise/Campus
│   │   └─ Customer budget supports fibre MRC?
│   │       ├─ YES → SELECT DFA Fibre
│   │       └─ NO → Check FWB availability
│   └─ NO → Check FWB availability
│
├─ MTN Tarana G1 FWB available?
│   ├─ YES → Suitable for all tiers
│   │   └─ Is customer upload-sensitive (video conferencing, cloud backup, uploads)?
│   │       ├─ YES → DISCLOSE 4:1 asymmetric. Recommend fibre if available. If not, proceed with FWB + written acknowledgement
│   │       └─ NO → SELECT FWB
│   └─ NO → Check DUNE availability
│
├─ DUNE 60GHz available (office park / campus)?
│   ├─ YES → PREFERRED for Campus/Enterprise in office parks
│   │   └─ SELECT DUNE (via ParkConnect)
│   └─ NO → Check 5G availability
│
├─ MTN 5G available?
│   ├─ YES → Essential/Professional only
│   │   └─ SELECT 5G with best-effort disclaimer
│   └─ NO → Check LTE availability
│
├─ MTN LTE available?
│   ├─ YES → Essential tier ONLY
│   │   └─ SELECT LTE with best-effort disclaimer and capped data warning
│   └─ NO → NO COVERAGE
│       └─ REJECT CloudWiFi deployment; add to waitlist
```

### 24.4 Add-On Validation Decision Tree

```
ADD-ON REQUESTED
│
├─ Check tier eligibility (CW-AO-001 to CW-AO-010)
│   ├─ ELIGIBLE → Continue
│   └─ NOT ELIGIBLE → REJECT with reason; suggest tier upgrade if appropriate
│
├─ Check if already included in tier
│   ├─ ALREADY INCLUDED → REJECT ("This is already included in your [tier] tier at no additional cost")
│   └─ NOT INCLUDED → Continue
│
├─ Check dependencies
│   ├─ DEPENDENCY MET → Continue
│   └─ DEPENDENCY NOT MET → WARN ("This add-on requires [dependency]. Would you like to enable [dependency] first?")
│
├─ Check conflicts
│   ├─ NO CONFLICT → Continue
│   └─ CONFLICT DETECTED → WARN ("This add-on conflicts with [existing add-on]. You must choose one or the other.")
│
├─ Check backhaul threshold (if applicable)
│   ├─ THRESHOLD MET → Continue
│   └─ THRESHOLD NOT MET → REJECT ("This add-on requires minimum [X] Mbps backhaul. Your current backhaul is [Y] Mbps.")
│
└─ ALL CHECKS PASSED → ACCEPT add-on; generate updated pricing
```

### 24.5 Arrears Escalation Decision Tree

```
PAYMENT OVERDUE
│
├─ Day 1–6 → Automated reminders (SMS + email)
│
├─ Day 7–13 → Second reminder + WhatsApp
│   └─ Is this Enterprise/Campus tier?
│       ├─ YES → AM contacted immediately
│       └─ NO → Standard process continues
│
├─ Day 14–20 → Phone call + formal letter of demand
│
├─ Day 21–29 → Suspension WARNING issued
│   └─ Is this Enterprise/Campus tier?
│       ├─ YES → AM engages; suspension delayed to Day 45
│       └─ NO → Standard process continues
│
├─ Day 30 → PARTIAL SUSPENSION (guest SSID off; staff SSID grace 7 days)
│   └─ Is this Enterprise/Campus tier?
│       ├─ YES → Only if MD approves suspension
│       └─ NO → AUTO-execute
│
├─ Day 37 → FULL SUSPENSION (all SSIDs off)
│
├─ Day 60 → SERVICE TERMINATED; equipment recovery scheduled
│
└─ Day 90 → External collections; equipment recovery enforced; customer blacklisted
```

---

## 25. Document Control

### 25.1 Review & Approval

| Role | Name | Signature | Date |
|---|---|---|---|
| CEO / Managing Director | | | |
| CTO | | | |
| CFO | | | |
| Head of Product | | | |
| Head of Sales | | | |
| Operations Manager | | | |

### 25.2 Related Documents

| Document | Reference |
|---|---|
| CloudWiFi WaaS Commercial Product Specification v1.0 | CT-CWIFI-CPS-2026-001 |
| CircleTel Complete Product Portfolio v3.0 | CT-PP-2026-003 |
| CircleTel Hardware Cost Register v1.2 | CT-HW-REG-2026-001 |
| ThinkWiFi Product Specification v2.1 | CT-TWF-PS-2026-001 |
| DUNE Solutions Portfolio v1.0 | CT-DUNE-2026-001 |
| SkyFibre SMB Commercial Product Spec v2.0 | CT-SFSMB-CPS-2026-001 |
| SkyFibre SMB Business Rules Document v1.0 | CT-BRD-SKYFIBRE-SMB-2026-001 |
| WorkConnect SOHO Business Rules Document v1.0 | CT-BRD-WORKCONNECT-2026-001 |
| SkyFibre FUP Framework | CT-FUP-2026-001 |
| MTN FWB Commercial Schedule (July 2025) | MTN-FWB-CS-2025-07 |
| DFA Commercial Schedules v1.0 | CT-DFA-CS-2026-001 |
| Arlan Communications Sales Agreement v1.0 | CT-ARLAN-SA-2026-001 |
| CircleTel Brand Guidelines | CT-BRAND-2026-001 |
| ICASA Licence Register v1.0 | CT-ICASA-REG-2026-001 |
| CHANGE_LOG_27_Feb_2026 | CT-CHANGELOG-2026-002 |

### 25.3 Amendment Process

| Step | Action | Responsible |
|---|---|---|
| 1 | Identify rule change requirement (from exception log, product change, regulatory update, or market feedback) | Any team |
| 2 | Draft proposed amendment with rule ID references | Product Strategy |
| 3 | Review impact on BSS, CRM, and operational workflows | Technical Lead + Operations |
| 4 | Approve amendment | MD (minor changes) or Board (structural changes) |
| 5 | Update BRD version; issue change log | Product Strategy |
| 6 | Communicate changes to all affected teams | Operations Manager |
| 7 | Update BSS/CRM validation rules | Technical Lead |

---

**END OF DOCUMENT**

*CircleTel SA (Pty) Ltd — A member of the New Generation Group*
*"Connecting Today, Creating Tomorrow"*

*CloudWiFi™ — Managed Wi-Fi. Zero Hassle.*
