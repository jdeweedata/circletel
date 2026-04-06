# Business Rules Document
# WorkConnect + Mobile Bundle

| Field | Detail |
|-------|--------|
| **Document Reference** | CT-BRD-ARLAN-WCM-2026-001 |
| **Related CPS** | CT-CPS-ARLAN-WCM-2026-001 |
| **Version** | 1.0 |
| **Effective Date** | 06 April 2026 |
| **Classification** | CONFIDENTIAL — Internal & Partner Use |
| **Prepared By** | Jeffrey, Managing Director |
| **Company** | CircleTel (Pty) Ltd — A member of the New Generation Group |
| **Status** | ACTIVE |

---

## 1. Purpose & Scope

This document defines all business rules governing the WorkConnect + Mobile bundle. These rules apply to:

- All CircleTel sales staff and account managers
- The CircleTel platform (order flow, CRM, billing engine)
- Partner resellers operating under CircleTel agreement
- Operations, provisioning, and support staff

Rules are binding. Exceptions require written approval from the relevant authority as defined in each rule.

---

## 2. Governing Principles

The following principles underpin all rules in this document:

1. **WorkConnect first**: The Arlan add-on can only exist where WorkConnect connectivity has been confirmed. Coverage drives the sale.
2. **Independent contracts**: WorkConnect and the Arlan component are separate legal agreements. One can be cancelled without automatically cancelling the other.
3. **Single account experience**: Despite independent contracts, the customer experiences one account, one invoice, and one support contact.
4. **MSC accountability**: Every WorkConnect (Tarana) subscription added through this bundle must be counted toward MSC tracking. Discounting that falls below wholesale cost is prohibited.
5. **Mandatory offer**: The cross-sell is compulsory to offer; the customer's choice is voluntary.

---

## 3. Cross-Sell Trigger Rules

### Rule WCM-001 — MANDATORY CROSS-SELL OFFER

**Rule**: Every new WorkConnect order where coverage has been confirmed MUST trigger the WorkConnect + Mobile cross-sell offer before the order is completed.

**Applies to**: All WorkConnect tiers (Basic, Standard, Pro, Ultra)

**Trigger point**: Immediately after the coverage check returns a pass result, before the order checkout screen is presented.

**Offer presentation requirements**:
- Sales staff must verbally present at least two add-on options from the current promo sheet
- The WorkConnect order flow system must display the add-on offer screen (not an optional pop-up — a required step)
- The customer must explicitly accept or decline the add-on; a null response is not permitted

**Documentation requirement**: The CRM record for every WorkConnect order must be updated with one of the following statuses:
- `bundle_offered_accepted` — customer took the add-on
- `bundle_offered_declined` — customer declined; reason noted
- `bundle_not_offered` — ONLY valid if coverage check failed

**Non-compliance**: A WorkConnect order completed without a CRM bundle status entry is a process violation. Sales manager reviews weekly; repeat violations escalated to MD.

**Exception**: WorkConnect orders for business accounts with 6+ staff are routed to the Connected Office bundle instead of WorkConnect + Mobile. Sales rep documents `routed_to_connected_office` in CRM.

### Rule WCM-002 — EXISTING CUSTOMER UPSELL

**Rule**: All existing WorkConnect customers who do not currently have an Arlan add-on must be contacted for a WorkConnect + Mobile upsell offer within 60 days of this document's effective date.

**Priority segment**: Unjani pilot sites (10 WorkConnect sites) must be contacted by 15 May 2026 (before billing starts).

**Method**: WhatsApp outreach by account manager, followed by email if no response within 3 business days.

**Documentation**: CRM status updated with `upsell_offered` and outcome.

---

## 4. Eligibility Rules

### Rule WCM-003 — WORKCONNECT COVERAGE IS MANDATORY

**Rule**: The Arlan add-on may not be offered, signed, or provisioned until the WorkConnect site survey has confirmed coverage.

**Rationale**: The bundle's value proposition ("one account, one invoice") requires the WorkConnect line to be active. An Arlan-only sale is routed to the Business Mobility Starter product, not WorkConnect + Mobile.

**Coverage confirmation means**: A successful 4-layer coverage check (MTN WMS → MTN Consumer → Provider APIs → confirmed) AND a passed physical site survey. The automated coverage check alone is not sufficient — the site survey must confirm LoS.

**If coverage fails**: The WorkConnect order is cancelled at zero cost. The customer is offered an Arlan standalone (Shesha 10Mbps + CPE as a primary connection, no WorkConnect). This is documented as a `coverage_fail_arlan_offered` outcome in CRM.

### Rule WCM-004 — ARLAN FICA ELIGIBILITY

**Rule**: The Arlan add-on requires a successful FICA check before the MTN contract can be submitted to Arlan. FICA is checked in parallel with or immediately after the WorkConnect site survey.

**FICA requirements (individual/sole proprietor)**:
- South African ID document (green barcoded or smart card)
- Proof of residential address (not older than 3 months)

**FICA requirements (registered company)**:
- Company registration documents (CIPC)
- Director/authorised signatory ID
- Proof of business address (not older than 3 months)

**If FICA fails**: WorkConnect proceeds independently. The Arlan add-on is suspended until FICA is resolved. Sales rep notifies customer and schedules FICA resolution within 5 business days.

**FICA data handling**: CircleTel submits FICA documentation to Arlan on the customer's behalf. CircleTel does not retain original FICA documents beyond 30 days — stored in Supabase `partner_compliance_documents` equivalent store, access restricted to sales ops.

### Rule WCM-005 — MINIMUM ARLAN LINE VALUE

**Rule**: Only Arlan deals with a monthly subscription of R359/mo or above may be included in the WorkConnect + Mobile bundle.

**Rationale**: Below R359/mo, commission and markup earnings fall below R87/mo, which is insufficient to justify the account management overhead and bundle support model.

**Enforcement**: The quote tool must filter out deals below R359/mo from the bundle add-on selector.

---

## 5. Pricing Rules

### Rule WCM-006 — NO BUNDLE DISCOUNT

**Rule**: The WorkConnect + Mobile bundle does not carry an automatic discount. Each component is priced at its standard retail price. The customer benefit is consolidated billing and account management, not a price reduction.

**Rationale**: The "one account, one invoice" narrative is the value, not price. Discounting undermines margin without increasing perceived value for this segment.

**Markup allowed**: CircleTel may apply a markup above the Arlan base price (difference between Arlan base and CircleTel retail) on the Arlan component. This markup is set per deal at quote stage and is CircleTel's own revenue.

### Rule WCM-007 — GOODWILL DISCOUNT AUTHORITY

**Rule**: A maximum 5% goodwill discount may be applied to the WorkConnect component only, with Sales Director written approval. The Arlan component may not be discounted by CircleTel (MTN pricing is fixed; Arlan does not authorise downstream discounting).

| Discount Level | Authority | Max Duration | Approval Method |
|---------------|-----------|-------------|----------------|
| 0–5% on WorkConnect | Sales Director | 24 months | Email approval to MD |
| >5% | MD written approval | 12 months | MD signature on quote |
| Any discount on WorkConnect Basic | Sales Director | 12 months | Required even at 1% — Basic year-1 margin already below 25% floor |

**Record-keeping**: All discount approvals must be attached to the CRM order record before the order is confirmed.

### Rule WCM-008 — MSC PRICING FLOOR

**Rule**: WorkConnect retail pricing must never fall below the wholesale rate for the equivalent tier. The minimum billable WorkConnect MRC is:

| Tier | Wholesale MRC | Minimum Retail MRC |
|------|-------------|-------------------|
| WorkConnect Basic | R499 | R599 (minimum; standard R799) |
| WorkConnect Standard | R499 | R599 (minimum; standard R999) |
| WorkConnect Pro | R599 | R699 (minimum; standard R1,299) |
| WorkConnect Ultra | R699 | R799 (minimum; standard R1,499) |

**No exceptions below wholesale**. A price below wholesale directly increases CircleTel's MSC shortfall and is not permitted under any circumstance without CFO approval — and CFO approval will not be granted for this product category.

### Rule WCM-009 — VAT TREATMENT

**Rule**: All retail prices quoted to customers are exclusive of VAT unless the customer specifically requests VAT-inclusive pricing. Invoice must show both the VAT-exclusive amounts per line item and the total VAT at 15%.

The combined invoice total including VAT must be clearly stated on all customer-facing quotes and invoices.

---

## 6. Contract & Term Rules

### Rule WCM-010 — STAGGERED CONTRACT TERMS

**Rule**: WorkConnect and the Arlan add-on carry different contract terms. Both terms must be explicitly disclosed to the customer at signing.

| Component | Standard Contract Term | CPA Section |
|-----------|----------------------|-------------|
| WorkConnect (Tarana FWB) | 24 months | CPA Section 14 applies |
| Arlan/MTN device deal | 36 months (device) or 24 months (SIM/data) | CPA Section 14 applies to each independently |

**Disclosure requirement**: The sales rep must verbally and in writing inform the customer:
- "Your WorkConnect contract is 24 months. Your mobile/device contract with MTN via Arlan is [24/36] months. These are separate contracts and can be cancelled independently."
- This disclosure must be captured via customer signature on the combined quote document.

**Prohibited representation**: Sales staff must not represent the two contracts as a single combined term. Stating "you're on a 36-month bundle" when WorkConnect is 24 months is a misrepresentation under the CPA.

### Rule WCM-011 — INDEPENDENT LINE RULE

**Rule**: WorkConnect and the Arlan add-on are legally independent service agreements. Cancellation of one does not automatically cancel the other.

| Cancellation scenario | Effect on other service | Required action |
|----------------------|------------------------|----------------|
| Customer cancels WorkConnect | Arlan line continues independently | Update CRM; adjust MSC count; contact customer re: Arlan standalone billing |
| Customer cancels Arlan | WorkConnect continues independently | Update CRM; note Arlan commission stream ends; offer replacement Arlan deal at renewal |
| Customer cancels both | Normal dual cancellation process | Handle each under respective CPA Section 14 obligations |

### Rule WCM-012 — UPGRADE PATH

**Rule**: Either component may be upgraded independently without affecting the other.

| Upgrade Type | Process | Effect on Other Component |
|-------------|---------|--------------------------|
| WorkConnect tier upgrade (e.g., Standard → Pro) | New WorkConnect order; new 24-month term from upgrade date | Arlan component unaffected |
| Arlan add-on upgrade (e.g., add second device line) | New Arlan deal via CircleTel; new 36-month term for new line | WorkConnect component unaffected |
| WorkConnect + Arlan simultaneous upgrade | Treat as two independent upgrades in CRM | Each has own new term |

Maximum Arlan lines before routing to Connected Office bundle: 3. At 4+ Arlan lines, the account is reclassified as a Connected Office customer.

---

## 7. Billing Rules

### Rule WCM-013 — SINGLE INVOICE

**Rule**: The customer receives one monthly invoice from CircleTel showing both WorkConnect and Arlan line items.

**Invoice structure**:
```
CircleTel Monthly Invoice — [Account Number]
Period: [Month] [Year]

  WorkConnect [Tier]                         R[amount]
  MTN Mobile Add-On — [Device/Plan]          R[amount]
                                             ─────────
  Subtotal (excl. VAT)                       R[amount]
  VAT (15%)                                  R[amount]
  ─────────────────────────────────────────  ─────────
  TOTAL DUE                                  R[amount]

  Payment due: [1st of month]
  Debit order: [Yes/No — date]
```

### Rule WCM-014 — BILLING CYCLE

**Rule**: Both WorkConnect and the Arlan add-on are billed on the same monthly cycle:
- Invoice generation: 25th of each month (automated via Inngest `invoice-generation` function)
- Invoice due date: 1st of the following month
- Debit order: 1st of the month (where debit order is in place)

**Arlan commission reconciliation**: Arlan pays CircleTel's commission by the 25th of each month. CircleTel must reconcile received commissions against active Arlan lines by the last business day of each month. Discrepancies escalated to Arlan account manager within 3 business days.

### Rule WCM-015 — PAYMENT ALLOCATION

**Rule**: When a customer payment is received, funds are allocated in the following order:
1. WorkConnect MRC (CircleTel's own revenue)
2. Any outstanding installation fee balance
3. Arlan line item (passed through to commission reconciliation)

**Partial payment**: If a customer pays partially, WorkConnect service is maintained first. Arlan billing continues independently — MTN may suspend the Arlan line for non-payment if Arlan invoice goes unpaid (this is MTN's direct credit risk, not CircleTel's liability).

---

## 8. MSC Tracking Rules

### Rule WCM-016 — MANDATORY MSC COUNT

**Rule**: Every WorkConnect (Tarana) subscriber, including those acquired via the WorkConnect + Mobile bundle, must be counted in `execution_milestones` MSC tracking.

**Database field**: `target_tarana_customers` in `execution_milestones`

**Update timing**: CRM record updated to `tarana_active` status on the day the WorkConnect installation is completed and the line is live. Provisioning ops is responsible for this update — it does not happen automatically.

**Verification**: Monthly MSC reconciliation cross-checks active WorkConnect subscribers in the billing system against `execution_milestones` counts. Discrepancies of more than 2 subscribers must be investigated and resolved before the MSC payment is made to MTN Wholesale.

### Rule WCM-017 — MSC COUNT REDUCTION ON CANCELLATION

**Rule**: When a WorkConnect subscriber cancels their service, the `execution_milestones` MSC count must be reduced on the effective cancellation date (not the notice date).

**Impact assessment**: Before confirming a cancellation, the sales rep must retrieve the current MSC coverage ratio and advise the MD if the cancellation will drop coverage below 0.9x.

| MSC Coverage After Cancellation | Required Action |
|--------------------------------|----------------|
| ≥ 1.0x | Process normally |
| 0.8x–0.99x | Notify MD; trigger churn prevention call |
| < 0.8x | MD approval required to process cancellation; escalate immediately |

---

## 9. Cancellation Rules

### Rule WCM-018 — CPA SECTION 14 COMPLIANCE

**Rule**: Both WorkConnect and the Arlan component are subject to CPA Section 14. Each must be handled as an independent cancellation obligation.

**WorkConnect cancellation process**:
1. Customer provides written cancellation notice (WhatsApp message accepted)
2. CircleTel acknowledges within 1 business day
3. 20 business days notice period applies (CPA Section 14)
4. Final invoice issued for notice period
5. CPE (Tarana G1) removal scheduled; customer must allow access
6. CPE not returned within 10 business days of cancellation = replacement charge of R3,200 applied

**Arlan/MTN cancellation process**:
1. Customer notifies CircleTel of intent to cancel Arlan component
2. CircleTel submits cancellation request to Arlan within 2 business days
3. Arlan/MTN 30-day notice period applies (separate from CircleTel CPA obligation)
4. Device may be subject to MTN early cancellation charge if cancelled before end of contract term
5. CircleTel must advise customer of any MTN early cancellation penalty before submitting the request

**Prohibited action**: CircleTel must not submit an Arlan cancellation without first advising the customer in writing of any early cancellation penalty. Failure to do so exposes CircleTel to a customer dispute under the CPA.

### Rule WCM-019 — CHURN PREVENTION CALL

**Rule**: Any customer who gives notice of cancellation for either component must receive a churn prevention call within 1 business day of the cancellation request.

**Script framework**:
- Acknowledge the cancellation request
- Identify the primary reason for cancellation (price, service quality, moving, business closure)
- Where price is the reason: offer tier downgrade before cancellation (e.g., Pro → Standard)
- Where service quality: escalate to NOC for immediate investigation before processing cancellation
- Where moving: check if new address has Tarana coverage — offer relocation

**CRM documentation**: Churn call outcome documented with reason code and offer made. Accepted retention offers must be confirmed in writing to the customer.

---

## 10. Decision Trees

### Decision Tree 1: Cross-Sell Flow at WorkConnect Signup

```
START: Customer enquires about WorkConnect
           │
           ▼
   Run coverage check (automated 4-layer)
           │
    ┌──────┴──────┐
    │             │
  FAIL          PASS
    │             │
    ▼             ▼
Offer Arlan    Present WorkConnect tiers
Shesha         (Basic / Standard / Pro / Ultra)
standalone      │
(not WCM        │ Customer selects tier
bundle)         │
    │           ▼
    │      PRESENT BUNDLE OFFER (MANDATORY — Rule WCM-001)
    │      "Would you like to add a mobile device or backup
    │       SIM to your WorkConnect account?"
    │           │
    │    ┌──────┴──────┐
    │    │             │
    │  DECLINE       ACCEPT
    │    │             │
    │    ▼             ▼
    │  Document     Select add-on from
    │  "bundle_     current promo sheet
    │  offered_     (Vivo / Oppo / Shesha /
    │  declined"    Samsung)
    │    │             │
    │    │             ▼
    │    │      Run FICA check for Arlan
    │    │           │
    │    │    ┌──────┴──────┐
    │    │    │             │
    │    │  FAIL          PASS
    │    │    │             │
    │    │    ▼             ▼
    │    │  Proceed WC   Finalise order:
    │    │  only; FICA   - WorkConnect contract (24mo)
    │    │  retry        - Arlan/MTN contract (24/36mo)
    │    │  within 5     - Combined invoice setup
    │    │  business     - Installation scheduled
    │    │  days         - Arlan SIM/device dispatched
    │    │               │
    │    │               ▼
    │    │          Document "bundle_offered_accepted"
    │    │          in CRM + both contract terms
    │    │          disclosed to customer (Rule WCM-010)
    │    │
    ▼    ▼
 Continue to WorkConnect-only order completion
 Document "bundle_offered_declined" or
 "coverage_fail_arlan_offered" in CRM
```

### Decision Tree 2: WorkConnect Cancellation Impact Assessment

```
START: Customer requests WorkConnect cancellation
           │
           ▼
  Churn prevention call within 1 business day
  (Rule WCM-019)
           │
    ┌──────┴──────────────────┐
    │                         │
  Retention          Proceeds with cancellation
  offer accepted               │
    │                         ▼
    ▼              Does customer have Arlan add-on?
  Document                    │
  "retained" in        ┌──────┴──────┐
  CRM; no further      │             │
  action needed       YES            NO
                       │             │
                       ▼             ▼
              Advise customer:   Process WC
              "Your MTN mobile  cancellation
              contract via       normally
              Arlan continues   (20 business
              independently.    days notice)
              Would you like       │
              to keep it?"         ▼
                       │        Remove CPE
               ┌───────┴───┐    on cancellation
               │           │    date
             KEEP        CANCEL     │
               │        ARLAN  ▼
               ▼           │  Reduce MSC count
           Retain Arlan     │  in execution_
           commission    Arlan│  milestones
           stream        cancel│  (Rule WCM-017)
               │        (Rule  │
               │        WCM-  ▼
               │        018)  Check MSC coverage
               │           │  ratio post-cancellation
               │           │        │
               │           │  ┌─────┴─────┐
               │           │  │           │
               │           │ ≥1.0x     <0.9x
               │           │  │           │
               │           │  ▼           ▼
               │           │ Process   Alert MD
               │           │ normally  (Rule WCM-017)
               │           │
               └─────────┬─┘
                         │
                         ▼
             Process WC cancellation
             20 business days notice
             Final invoice issued
             CPE return scheduled
             CRM updated: "workconnect_cancelled"
             Revenue_source updated in
             execution_milestones
```

---

## 11. System & CRM Rules

### Rule WCM-020 — CRM MANDATORY FIELDS FOR BUNDLE ORDERS

**Rule**: Every WorkConnect + Mobile bundle order must have the following fields completed in the CRM before the order is marked as active:

| Field | Required Value |
|-------|---------------|
| `workconnect_tier` | Basic / Standard / Pro / Ultra |
| `workconnect_contract_start` | Date (installation completion date) |
| `workconnect_term_months` | 24 |
| `arlan_addon_description` | Device/plan name from promo sheet |
| `arlan_addon_sub_amount` | Monthly subscription (excl. VAT) |
| `arlan_contract_term_months` | 24 or 36 |
| `arlan_contract_start` | Date of Arlan signing |
| `bundle_offer_status` | bundle_offered_accepted |
| `combined_monthly_retail_excl_vat` | Calculated total |
| `combined_monthly_earn` | CircleTel projected earn |
| `revenue_source` | tarana (for MSC tracking) |
| `fica_verified` | true |
| `staggered_terms_disclosed` | true (customer signature obtained) |

### Rule WCM-021 — REVENUE SOURCE TRACKING

**Rule**: WorkConnect subscribers added via the bundle must have `revenue_source = 'tarana'` in `execution_milestones` pipeline tracking. The Arlan component is tracked separately as `revenue_source = 'arlan'`.

This ensures MSC coverage calculations remain accurate and Arlan commission reporting is cleanly separated from Tarana margin reporting.

### Rule WCM-022 — COMMISSION RECONCILIATION

**Rule**: By the last business day of each month, the accounts team must reconcile:

1. Number of active Arlan lines in the billing system
2. Commission received from Arlan (paid by 25th)
3. Expected commission per line (calculated from sub amount × MTN rate × 30%)

**Discrepancy threshold**: Variances above R200/month total must be queried with the Arlan account manager within 3 business days.

**Commission not received by 25th**: Escalate to Arlan account manager on the 26th. If not resolved within 5 business days, escalate to MD.

---

## 12. Compliance & Regulatory Rules

### Rule WCM-023 — CPA COOLING-OFF PERIOD

**Rule**: Both WorkConnect and the Arlan component are fixed-term contracts subject to the Consumer Protection Act. The customer has a 5 business day cooling-off period from signing. If the customer cancels within this period:

- WorkConnect: Full refund of installation fee; no cancellation penalty
- Arlan/MTN: Arlan handles per MTN CPA policy; device must be returned in original condition

**Cooling-off disclosure**: Must be included in all customer-facing contract documentation.

### Rule WCM-024 — RICA COMPLIANCE

**Rule**: The Arlan/MTN SIM requires RICA registration in the customer's name. CircleTel does not handle RICA directly — this is managed by Arlan/MTN at SIM activation.

**Customer obligation**: Customer must provide valid SA ID for RICA at SIM delivery. If the customer cannot complete RICA within 14 days of SIM delivery, MTN may deactivate the SIM. CircleTel is not liable for MTN RICA deactivation.

---

## 13. Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 06 April 2026 | Jeffrey (MD) | Initial release |

**Review schedule**: This document must be reviewed quarterly (July 2026, October 2026, January 2027) or immediately following any change to the Arlan agreement terms, MTN commission structure, or WorkConnect wholesale pricing.

**Supersedes**: None (initial version)

**Related documents**:
- CT-CPS-ARLAN-WCM-2026-001 (Commercial Product Specification)
- Arlan_Deal_Packaging_Strategy_v1_0.md
- Arlan_Commission_Analysis_v1.0.md
- `.claude/rules/margin-guardrails.md`
- `.claude/rules/execution-targets.md`

---

## 14. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Managing Director | Jeffrey | _________________ | 06 April 2026 |
| Sales Lead | _________________ | _________________ | _________________ |
| Operations | _________________ | _________________ | _________________ |

---

*CircleTel (Pty) Ltd | contactus@circletel.co.za | WhatsApp: 082 487 3900 | Mon–Fri 08:00–17:00 SAST*
*Document: CT-BRD-ARLAN-WCM-2026-001 | Version 1.0 | Effective 06 April 2026*
*Classification: CONFIDENTIAL — Internal & Partner Use*
