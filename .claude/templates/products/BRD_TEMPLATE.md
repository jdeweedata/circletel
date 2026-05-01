# {{PRODUCT_NAME}} — Business Rules Document (BRD)

## Eligibility Logic, Workflow Rules & Conditional Policies

---

| Field | Value |
|-------|-------|
| **Document Reference** | CT-BRD-{{PRODUCT_CODE}}-{{YEAR}}-001 |
| **Version** | 1.0 |
| **Effective Date** | {{EFFECTIVE_DATE}} |
| **Classification** | Confidential — Internal Use |
| **Locale** | en-ZA (South African English) |
| **Prepared By** | CircleTel Product Strategy |
| **Source Documents** | {{PRODUCT_NAME}} CPS v1.0 (CT-CPS-{{PRODUCT_CODE}}-{{YEAR}}-001), {{PRODUCT_NAME}} FSD v1.0 (CT-FSD-{{PRODUCT_CODE}}-{{YEAR}}-001), {{SOURCE_DOCUMENTS_LIST}} |
| **Supersedes** | N/A — First issue |

---

## Version Control

| Version | Date | Author | Changes | Status |
|---------|------|--------|---------|--------|
| 1.0 | {{EFFECTIVE_DATE}} | CircleTel Product Strategy | Initial BRD | **CURRENT** |

---

## Table of Contents

1. Purpose & Scope
2. Definitions & Abbreviations
3. Customer Eligibility Rules
4. {{SECTION_4_TITLE}}
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
16. Partner & Reseller Rules
17. Regulatory & Compliance Policies
18. Exception Handling & Escalation
19. Appendix: Decision Trees

<!-- SECTION_4_TITLE:
     - Connectivity products: "Coverage & Technical Eligibility"
     - Managed IT / Cloud-hosting: "Service Availability & Prerequisites"
     - Bundles: "Component Eligibility & Dependency" -->

---

## 1. Purpose & Scope

This Business Rules Document (BRD) codifies every eligibility check, workflow trigger, conditional policy, and decision rule that governs the {{PRODUCT_NAME}} product from lead qualification through to service termination. It is the authoritative operational reference for sales, provisioning, billing, support, and compliance teams.

**Scope:** {{PRODUCT_SCOPE_DESCRIPTION}}

**Out of scope:** {{OUT_OF_SCOPE_PRODUCTS}} — each governed by separate BRDs.

---

## 2. Definitions & Abbreviations

| Term | Definition |
|------|-----------|
| **Base Tier** | The core service ({{BASE_TIER_NAMES}}) |
| **Module** | An independently priced add-on service |
| **BYOD** | Bring Your Own Device |
| **MRC** | Monthly Recurring Charge (excl. VAT unless stated) |
| **NRC** | Non-Recurring Charge (once-off) |
| **MSC** | Minimum Spend Commitment |
| **FUP** | Fair Usage Policy |
| **AUP** | Acceptable Usage Policy |
| **BSS** | Business Support System (AgilityGIS) |
| **CPE** | Customer Premises Equipment |
| **CPA** | Consumer Protection Act 68 of 2008 |
| **ECA** | Electronic Communications Act 36 of 2005 |
| **FICA** | Financial Intelligence Centre Act 38 of 2001 |
| **POPIA** | Protection of Personal Information Act 4 of 2013 |
{{#ADDITIONAL_DEFINITIONS}}
| **{{TERM}}** | {{DEFINITION}} |
{{/ADDITIONAL_DEFINITIONS}}

---

## 3. Customer Eligibility Rules

### 3.1 Entity Type Eligibility

| Rule ID | Rule | Condition | Action |
|---------|------|-----------|--------|
| CE-001 | Registered business entity | Customer MUST be a registered South African business (Pty Ltd, CC, sole proprietor, NPC, trust, or partnership) | Proceed to coverage/availability check |
| CE-002 | Consumer/residential applicant | Customer is a natural person NOT operating a business | REJECT — redirect to {{CONSUMER_REDIRECT_PRODUCT}} |
| CE-003 | Government entity | National, provincial, or local government department/SOE | Proceed — flag for tender/procurement compliance |
| CE-004 | Foreign-registered entity | Business registered outside SA with a SA physical address | Proceed IF valid SA physical address and proof of local operation |
| CE-005 | Informal/unregistered business | No CIPC registration or sole proprietor without trade documentation | REJECT — redirect to {{INFORMAL_REDIRECT_PRODUCT}} |
{{#ADDITIONAL_ENTITY_RULES}}
| {{RULE_ID}} | {{RULE}} | {{CONDITION}} | {{ACTION}} |
{{/ADDITIONAL_ENTITY_RULES}}

### 3.2 Required Documentation

| Rule ID | Document | Required? | Validation |
|---------|----------|-----------|------------|
| CE-010 | Company registration (CIPC) | Mandatory | CIPC extract or COR14.3 — must be active |
| CE-011 | ID/Passport (authorised signatory) | Mandatory | SA ID or valid passport |
| CE-012 | Proof of business address | Mandatory | Utility bill, lease agreement, or municipal account ≤ 90 days |
| CE-013 | Bank account confirmation | Mandatory for debit order | Official bank letter or cancelled cheque |
| CE-014 | Tax clearance certificate | For contracts > R50,000/year | SARS pin verification |
| CE-015 | Director resolution | For companies | Required to authorise service agreement |
{{#ADDITIONAL_DOC_RULES}}
| {{RULE_ID}} | {{DOCUMENT}} | {{REQUIRED}} | {{VALIDATION}} |
{{/ADDITIONAL_DOC_RULES}}

### 3.3 Credit Eligibility

| Rule ID | Rule | Condition | Action |
|---------|------|-----------|--------|
| CE-020 | Credit vetting threshold | Contract value ≥ R{{CREDIT_VETTING_THRESHOLD}}/month | Credit check mandatory |
| CE-021 | Good standing required | Customer has no outstanding unpaid CircleTel account | Proceed |
| CE-022 | Payment method validation | Valid debit order or credit card mandate required | Collect before provisioning |
| CE-023 | Deposit requirement | New customer with no credit history OR adverse credit | Deposit of 2× MRC required |
| CE-024 | Credit bureau check | Contract value ≥ R{{CREDIT_BUREAU_THRESHOLD}}/month | Pull Experian/TransUnion commercial report |

---

## 4. {{SECTION_4_TITLE}}

<!-- For CONNECTIVITY products: Use the "Coverage & Technical Eligibility" block below.
     For MANAGED IT / CLOUD-HOSTING: Use the "Service Availability & Prerequisites" block.
     For BUNDLES: Use the "Component Eligibility & Dependency" block. -->

### 4.1 {{SECTION_4_SUBSECTION_1_TITLE}}

| Rule ID | Rule | Condition | Action |
|---------|------|-----------|--------|
{{#SECTION_4_RULES_BLOCK_1}}
| {{RULE_ID}} | {{RULE}} | {{CONDITION}} | {{ACTION}} |
{{/SECTION_4_RULES_BLOCK_1}}

<!-- CONNECTIVITY example (TC-001 through TC-004):
| TC-001 | Primary coverage check | Address lookup in MTN FWB or DFA coverage database | Pass → proceed. Fail → redirect to Arlan backstop or waitlist |
| TC-002 | Signal strength requirement | Tarana RN requires ≥ -75 dBm at customer premises | Below -75 dBm → site survey required |
| TC-003 | Line of sight requirement | Tarana FWB requires clear LoS to base station | Obstructed → assess DFA or Arlan alternative |
| TC-004 | Building access consent | Landlord/body corporate approval for external mounting | Refused → REJECT installation, advise customer -->

### 4.2 {{SECTION_4_SUBSECTION_2_TITLE}}

| Rule ID | Rule | Condition | Action |
|---------|------|-----------|--------|
{{#SECTION_4_RULES_BLOCK_2}}
| {{RULE_ID}} | {{RULE}} | {{CONDITION}} | {{ACTION}} |
{{/SECTION_4_RULES_BLOCK_2}}

---

## 5. Product Selection Rules

### 5.1 Base Tier Selection

| Rule ID | Rule | Condition | Action |
|---------|------|-----------|--------|
| PS-001 | Default tier | Customer does not specify a tier | Present {{RECOMMENDED_DEFAULT_TIER}} as recommended |
| PS-002 | Tier eligibility | All tiers available to all eligible customers | No restrictions except coverage/technical eligibility |
| PS-003 | Trial tier | N/A — no free trial available | Direct to paid plan |
{{#ADDITIONAL_PRODUCT_SELECTION_RULES}}
| {{RULE_ID}} | {{RULE}} | {{CONDITION}} | {{ACTION}} |
{{/ADDITIONAL_PRODUCT_SELECTION_RULES}}

### 5.2 Speed Profile & Spec Disclosure

| Rule ID | Rule | Condition | Action |
|---------|------|-----------|--------|
| PS-010 | Disclose asymmetric speeds | {{SPEED_ASYMMETRY_CONDITION}} | Sales MUST disclose actual upload speed at point of sale |
| PS-011 | Disclose contention ratio | Service uses {{CONTENTION_RATIO}} contention | Disclose in pre-sale materials |
| PS-012 | Disclose FUP (where applicable) | Any component with a FUP | FUP limits must be disclosed before contract signing |

---

## 6. Module Eligibility & Dependency Logic

### 6.1 Module Prerequisite Rules

| Rule ID | Module | Prerequisite | If Not Met |
|---------|--------|--------------|------------|
{{#MODULE_PREREQUISITE_RULES}}
| {{RULE_ID}} | {{MODULE_NAME}} | {{PREREQUISITE}} | {{CONSEQUENCE}} |
{{/MODULE_PREREQUISITE_RULES}}

<!-- Example entries:
| MD-001 | Enhanced SLA | Any base tier | N/A — available on all tiers |
| MD-002 | Premium SLA | Enhanced SLA NOT already selected | Cannot stack |
| MD-003 | 5G/LTE Failover | Base tier must be a connectivity product | Cannot add to Managed IT standalone | -->

### 6.2 Module Combination Rules

| Rule ID | Rule | Constraint |
|---------|------|-----------|
{{#MODULE_COMBINATION_RULES}}
| {{RULE_ID}} | {{RULE}} | {{CONSTRAINT}} |
{{/MODULE_COMBINATION_RULES}}

### 6.3 Recommended Module Bundles

| Bundle Name | Included Modules | Target Use Case |
|-------------|-----------------|-----------------|
{{#RECOMMENDED_BUNDLES}}
| {{BUNDLE_NAME}} | {{BUNDLE_MODULES}} | {{BUNDLE_USE_CASE}} |
{{/RECOMMENDED_BUNDLES}}

---

## 7. Pricing & Discount Rules

### 7.1 Standard Pricing

| Rule ID | Rule | Condition | Action |
|---------|------|-----------|--------|
| PR-001 | List price | All standard sales | Use pricing as per CPS v1.0 pricing schedule |
| PR-002 | VAT addition | All SA customers | Add 15% VAT to all quoted prices. Show both excl. and incl. |
| PR-003 | Currency | All transactions | ZAR only — no foreign currency pricing |
| PR-004 | Price changes | Retail price increase | 30 days written notice required per CPA |

### 7.2 Discount Authority Matrix

| Rule ID | Discount Level | Approver | Max Duration | Constraint |
|---------|---------------|---------|-------------|------------|
| PR-010 | 0-5% | Sales Representative | 24 months | Must maintain ≥ 25% margin |
| PR-011 | 5-10% | Sales Director | 24 months | Must maintain ≥ 25% margin |
| PR-012 | 10-15% | MD | 12 months | Volume commitment required (5+ lines) |
| PR-013 | 15-20% | MD + CFO | 6 months | Strategic accounts only |
| PR-014 | > 20% | **Not permitted** | — | Below floor margin — never authorised |

### 7.3 Pricing Prohibitions

| Rule ID | Prohibition |
|---------|-------------|
| PR-020 | No pricing below wholesale cost + COS floor under any circumstances |
| PR-021 | No stacking of volume + term + promotional discounts simultaneously |
| PR-022 | No custom pricing without documented business case in CRM |
| PR-023 | No promotional pricing without MD pre-approval and 90-day maximum |

---

## 8. Billing & Payment Rules

| Rule ID | Rule | Detail |
|---------|------|--------|
| BR-001 | Billing cycle | Monthly in advance, calendar month |
| BR-002 | Payment methods | Debit order (primary), credit card, EFT |
| BR-003 | First invoice | Pro-rata from activation date to month-end, plus full first month |
| BR-004 | Invoice delivery | Email only — PDF format — delivered by 3rd business day of month |
| BR-005 | Payment due date | 7th of each month (or next business day) |
| BR-006 | Failed payment action | SMS + email notification. Retry on 14th. Suspend on 21st if unpaid |
| BR-007 | Suspension reactivation | R{{REACTIVATION_FEE}} reactivation fee after payment |
| BR-008 | Reconnection after termination | New contract and installation required — no reactivation |
| BR-009 | Billing disputes | Must be raised within 30 days of invoice date |
| BR-010 | Credit notes | Issued within 5 business days of approved dispute |

---

## 9. Contract & Commitment Rules

| Rule ID | Rule | Detail |
|---------|------|--------|
| CC-001 | Contract terms available | Month-to-month (MTM), 12-month, 24-month |
| CC-002 | MTM premium | MTM contracts attract +{{MTM_PREMIUM_PCT}}% on base MRC |
| CC-003 | 24-month discount | {{DISCOUNT_24_MONTH}}% discount on base MRC |
| CC-004 | 12-month discount | {{DISCOUNT_12_MONTH}}% discount on base MRC |
| CC-005 | Early termination | Remaining months × MRC (excl. VAT) |
| CC-006 | Installation waiver | Free installation on 24-month contract. Standard NRC applies on MTM/12-month |
| CC-007 | Contract renewal | Auto-renews to MTM at month-end unless 30-day written notice given |
| CC-008 | Price lock | Retail price locked for contract term. MSC price changes passed through with 30-day notice |
| CC-009 | Hardware ownership | CircleTel-supplied CPE remains MTN/CircleTel property throughout contract |

---

## 10. Credit Vetting & Onboarding Workflow

| Step | Activity | System | Outcome |
|------|----------|--------|---------|
| 1 | Lead qualification | CRM | Qualified / Not qualified |
| 2 | Coverage check | MTN Portal / DFA / Internal | Pass / Fail / Alternative |
| 3 | Document collection | CRM | Complete / Incomplete |
| 4 | Credit vetting | Experian / Internal | Approved / Deposit required / Rejected |
| 5 | Contract generation | AgilityGIS BSS | Draft contract |
| 6 | Contract signing | DocuSign / Physical | Signed |
| 7 | Payment mandate | Debit order / Card | Authorised |
| 8 | Provisioning trigger | AgilityGIS → MTN Portal | Order placed |
| 9 | Installation scheduling | Internal | Date confirmed |
| 10 | Service activation | AgilityGIS | Active |

---

## 11. Provisioning & Installation Workflow

| Step | Rule | Owner | SLA |
|------|------|-------|-----|
| 1 | Order received | Sales | Same business day |
| 2 | MTN wholesale order placed | Operations | Within 24 hours of signed contract |
| 3 | Customer contacted to schedule installation | Operations | Within 24 hours of order acknowledgement |
| 4 | Installation appointment set | Operations | Within {{INSTALL_APPOINTMENT_SLA}} business days |
| 5 | Installation completed | Field Tech | On agreed date |
| 6 | Post-installation test | Field Tech | Before leaving site |
| 7 | Service activated in BSS | Operations | Same day as installation |
| 8 | Welcome email sent | System | Within 1 hour of activation |
| 9 | First invoice generated | AgilityGIS | On activation date |

### 11.1 Provisioning Failure Rules

| Rule ID | Failure Condition | Action |
|---------|------------------|--------|
| PV-001 | MTN order rejected | Contact MTN wholesale — resolve within 2 business days or escalate |
| PV-002 | Installation site inaccessible | Reschedule within 48 hours. 3rd failed attempt triggers cancellation |
| PV-003 | Signal below threshold on install day | Re-assess alternative placement. If no solution → refund NRC, cancel order |
| PV-004 | Hardware fault during install | Replace within 48 hours at no charge |

---

## 12. SLA Entitlement Rules

| Rule ID | Rule | Tier | Entitlement |
|---------|------|------|-------------|
{{#SLA_ENTITLEMENT_RULES}}
| {{RULE_ID}} | {{RULE}} | {{TIER}} | {{ENTITLEMENT}} |
{{/SLA_ENTITLEMENT_RULES}}

<!-- Standard entries to include:
| SL-001 | Uptime measurement | All | Calculated monthly — planned maintenance excluded |
| SL-002 | Credit trigger | Professional+ | Measured uptime < SLA guarantee triggers automatic credit |
| SL-003 | Credit calculation | Professional | 10% of MRC per hour below SLA |
| SL-004 | Credit calculation | Enterprise | 15% of MRC per hour below SLA |
| SL-005 | Maximum credit | All | Credits capped at 50% of monthly MRC |
| SL-006 | Credit application | All | Applied to next invoice automatically | -->

---

## 13. Fair Usage & Traffic Management Policies

| Rule ID | Rule | Detail |
|---------|------|--------|
| FU-001 | {{PRIMARY_CONNECTIVITY_COMPONENT}} | {{PRIMARY_FUP_POLICY}} |
{{#ADDITIONAL_FUP_COMPONENTS}}
| FU-{{FUP_SEQ_NUM}} | {{FUP_COMPONENT_NAME}} | {{FUP_COMPONENT_POLICY}} |
{{/ADDITIONAL_FUP_COMPONENTS}}
| FU-010 | Traffic prioritisation | Business critical traffic (VoIP, video conferencing) prioritised during congestion |
| FU-011 | AUP enforcement | CircleTel reserves the right to suspend service for AUP violations without notice |
| FU-012 | MTN traffic management | MTN wholesale may apply traffic management per their FUP — disclosed in customer agreement |

---

## 14. Upgrade, Downgrade & Migration Rules

| Rule ID | Rule | Condition | Effective Date | Charge |
|---------|------|-----------|----------------|--------|
| UD-001 | Upgrade base tier | Customer requests higher tier | Pro-rata from request date | R0 |
| UD-002 | Downgrade base tier | Customer requests lower tier | Start of next billing month | R0 |
| UD-003 | Add module | Customer adds add-on | Pro-rata from request date | R0 setup |
| UD-004 | Remove module | Customer removes add-on | Start of next billing month | R0 |
| UD-005 | Contract upgrade | MTM → 24-month | Immediate — reset contract term | Free installation waiver reinstated |
| UD-006 | Contract downgrade | 24-month → MTM (end of term) | At contract expiry | MTM premium applies from month 1 |
| UD-007 | Site relocation | Customer moves premises | New site survey required | NRC may apply |
| UD-008 | Product migration | Migrate to different product line | Subject to eligibility check at new address | Migration fee R{{MIGRATION_FEE}} |

---

## 15. Cancellation & Churn Policies

| Rule ID | Rule | Detail |
|---------|------|--------|
| CH-001 | Cancellation notice | 30 calendar days written notice (email or portal) |
| CH-002 | CPA cooling-off | 5 business days from contract signing — no penalty |
| CH-003 | Early termination fee (ETF) | Remaining months × MRC (excl. VAT) |
| CH-004 | ETF waiver conditions | Proven service failure (≥ 3 unresolved faults in 30 days), relocation outside coverage area |
| CH-005 | Equipment return | CPE must be returned within 10 business days. Non-return fee R{{CPE_NON_RETURN_FEE}} |
| CH-006 | Final invoice | Issued on cancellation date. Includes ETF if applicable |
| CH-007 | Churn save attempt | Retention specialist contacts customer before processing cancellation |
| CH-008 | Win-back period | Re-sign within 90 days: ETF waived, installation fee waived |

---

## 16. Partner & Reseller Rules

| Rule ID | Rule | Detail |
|---------|------|--------|
| PA-001 | Partner authorisation | Must hold valid CircleTel Partner Agreement |
| PA-002 | Commission eligibility | Commissions paid only on new sales (not win-backs or migrations) |
| PA-003 | Commission payment | Monthly, 30 days in arrears, EFT to registered bank account |
| PA-004 | Clawback period | Commission clawback if customer cancels within 6 months of activation |
| PA-005 | Price disclosure | Partners may not quote below CircleTel list price without prior approval |
| PA-006 | Direct customer contact | Partners must not contact CircleTel customers directly without consent |

---

## 17. Regulatory & Compliance Policies

| Rule ID | Regulation | Requirement |
|---------|-----------|-------------|
| RC-001 | POPIA (Act 4 of 2013) | Customer PII stored in SA-hosted Supabase (Johannesburg region). DPA in place |
| RC-002 | ECTA (Act 25 of 2002) | Electronic contracts are legally binding. DocuSign or email acceptance valid |
| RC-003 | CPA (Act 68 of 2008) | 5-day cooling-off, plain language contracts, no unfair terms |
| RC-004 | ECA (Act 36 of 2005) | ICASA ECNS licence required — held by CircleTel |
| RC-005 | RICA (Act 70 of 2002) | SIM-based products require RICA registration of end-user |
| RC-006 | FICA (Act 38 of 2001) | AML screening for business customers — PEP and sanctions check |
| RC-007 | VAT (Act 89 of 1991) | 15% VAT charged on all supplies. Tax invoices issued as required |
{{#ADDITIONAL_REGULATORY_RULES}}
| {{RULE_ID}} | {{REGULATION}} | {{REQUIREMENT}} |
{{/ADDITIONAL_REGULATORY_RULES}}

---

## 18. Exception Handling & Escalation

| Scenario | First Response | Escalation Level 1 | Escalation Level 2 | SLA |
|----------|---------------|-------------------|-------------------|-----|
| Coverage dispute | Sales — re-verify address | Technical team — site survey | MD — commercial decision | 48 hours |
| Discount request > 15% | Sales Director — reject or escalate | MD | MD + CFO | 24 hours |
| ETF waiver request | Support team — assess criteria | Sales Director | MD | 5 business days |
| Billing dispute > R10,000 | Billing team — audit | CFO review | MD arbitration | 10 business days |
| Regulatory complaint | Legal team response | MD | Ombudsman referral | 14 days |
| Service SLA breach (multiple months) | Account Manager | Technical Director | MD — commercial remedy | 5 business days |
{{#ADDITIONAL_ESCALATION_SCENARIOS}}
| {{SCENARIO}} | {{FIRST_RESPONSE}} | {{ESCALATION_1}} | {{ESCALATION_2}} | {{SLA}} |
{{/ADDITIONAL_ESCALATION_SCENARIOS}}

---

## 19. Appendix: Decision Trees

### A. Customer Eligibility Flow

```
START: New Enquiry
         │
         ▼
   Business entity? ──── NO ──── Redirect to {{CONSUMER_REDIRECT_PRODUCT}}
         │ YES
         ▼
   SA-registered?  ──── NO ──── SA address + proof? ── NO ── REJECT
         │ YES                        │ YES
         ▼                            ▼
   {{COVERAGE_CHECK_LABEL}}           Continue ─────────────────────────┐
         │                                                               │
   Pass? ──── NO ──── Alternative available? ── YES ── Offer alternative │
         │ YES              │ NO                                         │
         ▼                  ▼                                            │
   Credit eligible? ── NO ── Deposit required? ── YES ── Collect deposit─┘
         │ YES                   │ NO                        │
         ▼                       ▼                           ▼
   Proceed to       REJECT — advise reasons         Proceed with deposit
   onboarding
```

### B. Pricing & Discount Flow

```
Customer requests price
         │
         ▼
   Standard list price applies?
         │ YES ──── Quote standard pricing
         │ NO (discount requested)
         ▼
   Discount ≤ 5%? ─── YES ─── Sales rep authorises
         │ NO
         ▼
   Discount ≤ 10%? ── YES ─── Sales Director authorises
         │ NO
         ▼
   Discount ≤ 15%? ── YES ─── MD authorises (volume commitment required)
         │ NO
         ▼
   Discount ≤ 20%? ── YES ─── MD + CFO authorise (strategic account)
         │ NO
         ▼
   NOT PERMITTED — Reject discount request
```

### C. {{ADDITIONAL_DECISION_TREE_TITLE}}

```
{{ADDITIONAL_DECISION_TREE_ASCII}}
```

---

**END OF DOCUMENT**

*CircleTel (Pty) Ltd — A member of the New Generation Group*
*"Connecting Today, Creating Tomorrow" | www.circletel.co.za*
*Confidential — Internal Use Only*
