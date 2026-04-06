# Business Rules Document
## Connected Office — Arlan/MTN Reseller Bundle

**Document Reference:** CT-BRD-ARLAN-CO-2026-001  
**Version:** 1.0  
**Effective Date:** 06 April 2026  
**Classification:** CONFIDENTIAL — Internal & Partner Use  
**Prepared By:** Jeffrey, Managing Director  
**Entity:** CircleTel (Pty) Ltd — A member of the New Generation Group  
**Related CPS:** CT-CPS-ARLAN-CO-2026-001

---

## Document Purpose

This Business Rules Document (BRD) codifies the mandatory rules, eligibility criteria, operational procedures, and decision trees governing the sale, provisioning, management, and cancellation of the Connected Office bundle. All CircleTel staff involved in quoting, selling, onboarding, or supporting Connected Office customers must comply with these rules.

---

## Rule Index

| Rule ID | Rule Name | Section |
|---------|-----------|---------|
| R-001 | Customer Eligibility | §1 |
| R-002 | Coverage Verification (Mandatory Pre-Sale) | §2 |
| R-003 | Bundle Integrity | §3 |
| R-004 | Contract Terms — Mixed Term Management | §4 |
| R-005 | CPE Ownership and Return Obligation | §5 |
| R-006 | Pricing Rules and Markup Floors | §6 |
| R-007 | Billing and Invoice Rules | §7 |
| R-008 | Commission and Markup Recognition | §8 |
| R-009 | Cancellation Rules | §9 |
| R-010 | Ordering Workflow | §10 |
| R-011 | Upgrade Rules | §11 |
| R-012 | Margin Guardrail Sign-off | §12 |

---

## §1 — Customer Eligibility (R-001)

### R-001: Eligibility Criteria

A customer qualifies for Connected Office if and only if ALL of the following conditions are met:

| Criterion | Required | Verification Method |
|-----------|----------|---------------------|
| Entity type | Business entity: (Pty) Ltd, CC, Sole Proprietorship, or NPC | CIPC registration document |
| SA business registration | Valid and current registration with CIPC | CIPC registration number check |
| FICA compliance | Proof of registered address; identity document for all directors/owners | FICA document collection at onboarding |
| Minimum staff count | 3 or more staff (to justify 3-line bundle) | Self-declared at quote; reviewed at onboarding |
| MTN signal confirmed | Indoor or outdoor MTN 4G/5G signal confirmed at premises | Coverage check completed before quote |
| Creditworthiness | No adverse credit listed against the business or owner | ITC check at onboarding |
| Budget confirmed | Verbal or written budget approval from decision maker | Sales call / quote acceptance |

**Failure on any single criterion blocks the sale**. The sales team must not proceed to quote a Connected Office bundle until eligibility is confirmed.

### R-001.1: Entity Types — Accepted and Rejected

| Entity Type | Accepted | Notes |
|-------------|----------|-------|
| (Pty) Ltd | Yes | Standard CIPC registration |
| Close Corporation (CC) | Yes | CIPC registration required |
| Sole Proprietorship | Yes | SA ID + proof of business activity required |
| Non-Profit Company (NPC) | Yes | CIPC registration + NPO certificate if applicable |
| Individual consumer | No | Connected Office is a business product only; refer to WorkConnect SOHO |
| Foreign-registered entity | No | Must have SA subsidiary registered with CIPC |
| Trust | No | Not accepted in this product version |

### R-001.2: Staff Count Minimum

The 3-staff minimum exists because the bundle is structured around 1 connectivity line + 2 device lines. A customer with fewer than 3 staff should be referred to Business Mobility Starter (single device upgrade) instead.

---

## §2 — Coverage Verification (R-002)

### R-002: Coverage Check Is Mandatory Before Quoting

No Connected Office quote may be issued until MTN coverage at the customer premises has been verified. This protects both the customer and CircleTel from committing to a 24-month fixed-speed plan on a site where MTN signal is insufficient.

| Step | Action | Responsible | Outcome |
|------|--------|-------------|---------|
| 1 | Sales rep checks MTN business coverage map for customer physical address | Sales Rep | Coverage status: Strong / Moderate / Marginal / None |
| 2 | If Strong or Moderate: proceed to quote | Sales Rep | Coverage confirmed — note on opportunity |
| 3 | If Marginal: request customer tests an MTN SIM on-site; reports speed and signal bars | Customer + Sales Rep | Pass: proceed; Fail: do not quote Shesha; offer alternative |
| 4 | If None: do not quote Shesha or FWA plans | Sales Rep | Refer to alternative: DFA fibre if available; Vodacom/Rain as alternatives |

### R-002.1: Minimum Signal Threshold

| Plan | Minimum Signal Required |
|------|------------------------|
| Shesha 10Mbps | Consistent indoor signal of ≥2 bars LTE or 5G |
| Shesha 20Mbps | Consistent indoor signal of ≥3 bars LTE or 5G |
| 5G FWA 500GB | Consistent outdoor signal of ≥3 bars 5G; outdoor CPE placement may be required |

### R-002.2: Coverage Check Must Be Documented

The outcome of the coverage check must be recorded in the CRM opportunity record before progressing to quote stage. The record must include:
- MTN coverage map status for the premises address
- Method used (map check only; or map + on-site SIM test)
- Date of check
- Sales rep name

---

## §3 — Bundle Integrity (R-003)

### R-003: Three Lines Must Be Signed Simultaneously

The Connected Office bundle is sold as an indivisible 3-line unit. All three lines (1× connectivity anchor + 2× device upgrades) must be signed on the same date and submitted to Arlan as a single order.

**Prohibited actions:**
- Selling the connectivity anchor alone as a "Connected Office sale" — this is a standalone Shesha deal, not a Connected Office bundle
- Selling 1 device upgrade and "adding the second later" — all lines must be signed simultaneously
- Retroactively adding the connectivity anchor to two existing device lines to reclassify as Connected Office

### R-003.1: Post-Sale Line Cancellation Does Not Dissolve Bundle

If a customer cancels one line after the bundle is active, the remaining lines continue at their contracted rates. CircleTel's bundle designation is updated to reflect the active lines. Commission and markup on the cancelled line cease; active lines continue.

**Example**: Customer cancels Device 2 line in month 8. Device 1 and connectivity anchor continue. CircleTel earns commission + markup on the 2 remaining lines. Customer is re-quoted for a device replacement if they wish to restore the bundle to 3 lines.

### R-003.2: Bundle Add-ons Do Not Break Integrity

Adding a fourth or fifth line post-sale (e.g., a third device upgrade or a data SIM) is permitted and does not affect the core 3-line bundle structure. The additional lines are billed separately at standard pricing.

---

## §4 — Contract Terms: Mixed Term Management (R-004)

### R-004: Connectivity and Device Terms Are Different

Connected Office uses mixed contract terms across the 3 lines:

| Line Type | Contract Term | Notes |
|-----------|--------------|-------|
| Connectivity anchor (Shesha/FWA) | 24 months | MTN standard business connectivity term |
| Device upgrades (×2) | 36 months | MTN standard device upgrade term |

### R-004.1: Mixed Term Disclosure

This mixed term must be clearly communicated to the customer at the quote stage and confirmed in writing before the customer signs. The customer must understand:
- Connectivity expires in 24 months; devices continue for 36 months
- If the customer wants to exit both connectivity and devices simultaneously, they must either (a) cancel the connectivity anchor at month 24 and pay out the remaining 12 months of device contracts, or (b) upgrade the connectivity anchor at month 24 to a new 24-month contract

### R-004.2: Contract Renewal Process

At month 22 (2 months before Shesha expiry), CircleTel must proactively contact the customer to:
1. Confirm renewal of the connectivity anchor on the latest Arlan promo pricing
2. Review if device upgrades are due (at month 34 for the device lines)
3. Offer a full bundle upgrade to the latest Connected Office tier pricing

---

## §5 — CPE Ownership and Return Obligation (R-005)

### R-005: The Tozed ZLT X100 Pro 5G Is MTN Property

The CPE device provided with Shesha and FWA plans is the property of MTN for the duration of the contract. CircleTel must communicate this clearly at sale and at activation.

### R-005.1: CPE Return Decision Tree

```
CPE RETURN OBLIGATION CHECK
============================

Is the Shesha/FWA connectivity plan being cancelled?
        |
       YES
        |
        v
Is the cancellation within the first 24 months of the plan?
        |
       YES
        |
        v
CPE RETURN REQUIRED
→ Customer must return Tozed ZLT X100 Pro 5G to CircleTel
→ CircleTel ships CPE back to Arlan/MTN
→ Timeline: within 14 calendar days of cancellation effective date
        |
        v
Did the customer return the CPE within 14 days?
        |
   YES  |   NO
        |    |
        v    v
 CPE return   R1,500 CPE REPLACEMENT CHARGE
 processed.   → Billed to customer on next CircleTel invoice
 No charge.   → CircleTel pays MTN via Arlan on behalf of customer
```

### R-005.2: CPE Return Process

| Step | Action | Responsible |
|------|--------|-------------|
| 1 | Customer notifies CircleTel of Shesha cancellation intent | Customer |
| 2 | CircleTel sends CPE return instructions via WhatsApp within 2 business days | CircleTel Account Manager |
| 3 | Customer couriers CPE to CircleTel offices (prepaid label provided by CircleTel) | Customer / CircleTel |
| 4 | CircleTel confirms receipt and forwards to Arlan/MTN | CircleTel |
| 5 | If not received within 14 days: raise R1,500 charge on customer invoice | CircleTel Billing |

### R-005.3: CPE Prohibited Uses

The customer must not:
- Unlock the CPE for use with another network operator's SIM
- Sell, give, or loan the CPE to a third party
- Tamper with or modify the CPE hardware or firmware

Breach of these conditions makes the customer liable for the full R1,500 replacement cost regardless of return.

---

## §6 — Pricing Rules and Markup Floors (R-006)

### R-006: Pricing Governance

All Connected Office pricing must comply with the following rules:

| Rule | Requirement |
|------|-------------|
| R-006.1 Markup floor — Data Connectivity | Minimum 15% markup applied to connectivity anchor (Shesha/FWA) subscription price |
| R-006.2 Markup floor — Device Upgrade | Minimum 8% markup applied to each device line subscription price |
| R-006.3 Bundle discount cap | Maximum 10% discount on any bundle; individual line pricing per current Arlan promo sheet |
| R-006.4 Never price below Arlan base | No line may be priced below the Arlan promo sheet price for that product |
| R-006.5 Promo sheet refresh | Prices must be verified against the current monthly Arlan promo sheet before any quote is issued |
| R-006.6 Pricing validity | Quotes are valid for 7 calendar days from issue date; after 7 days, prices must be re-verified |

### R-006.1: Discount Approval Matrix

| Discount Requested | Who Can Approve | Notes |
|-------------------|----------------|-------|
| 0–5% | Sales Representative | Standard authority |
| 5–10% | Sales Director | Maximum bundle discount |
| >10% | Not permitted | Bundle integrity and margin floor cannot support >10% |

### R-006.2: Pricing Validation Checklist (Pre-Quote)

Before issuing a Connected Office quote, the sales rep must confirm:

- [ ] Prices verified against current Arlan promo sheet (not prior month)
- [ ] Connectivity markup ≥ 15%
- [ ] Device markup ≥ 8% per line
- [ ] Total bundle discount ≤ 10%
- [ ] Customer price is ≥ Arlan base + minimum markup on each line

---

## §7 — Billing and Invoice Rules (R-007)

### R-007: CircleTel Issues Single Consolidated Invoice

Despite each line being a separate MTN contract via Arlan, CircleTel issues one monthly tax invoice to the customer covering all active Connected Office lines.

| Billing Rule | Detail |
|-------------|--------|
| Invoice frequency | Monthly; issued on the 25th of each month for the following month |
| Invoice due date | 1st of the following month |
| Currency | ZAR, inclusive of 15% VAT |
| Invoice line items | Each active line itemised separately (connectivity, Device 1, Device 2) |
| Markup display | CircleTel's total charge per line (including markup) shown on invoice; MTN base price not shown to customer |
| Late payment | 14-day cure period; then account suspended; ETA charges apply on reconnection |

### R-007.1: Commission Separation

Arlan commission is received by CircleTel separately (paid by Arlan by 25th of each month) and is not itemised on the customer invoice. The customer only sees CircleTel's total monthly charge per line.

### R-007.2: Invoice Adjustment on Partial Cancellation

If a customer cancels one line mid-bundle:
1. Final invoice for the cancelled line includes any outstanding charges and the ETA (Early Termination Amount)
2. Remaining lines continue to be billed at their contracted rates on the monthly consolidated invoice
3. The invoice is updated within one billing cycle to reflect the new line configuration

---

## §8 — Commission and Markup Recognition (R-008)

### R-008: Revenue Recognition Rules

| Revenue Type | Recognition Timing | Notes |
|--------------|-------------------|-------|
| Markup | Monthly; when CircleTel invoice is paid | Collected directly from customer |
| Arlan commission | Monthly; when received from Arlan (by 25th) | Subject to Arlan payment schedule |
| Commission on renewal | Continues indefinitely after initial 24/36-month term | No additional sale action required; accrues passively |

### R-008.1: Commission Lag

Arlan typically pays commissions 30–45 days in arrears from MTN's payment cycle. Financial projections must account for a 6-week commission lag from activation to first commission receipt. Markup revenue is collected immediately on invoice payment.

---

## §9 — Cancellation Rules (R-009)

### R-009: CPA Compliance — Section 14 Rights

All Connected Office contracts are fixed-term contracts subject to the Consumer Protection Act 68 of 2008, Section 14.

| Term | CPA Right | CircleTel Process |
|------|-----------|-----------------|
| First 24 months (connectivity) | Customer may cancel with 20 business days' notice; ETA applies | CircleTel processes cancellation via Arlan; raises ETA invoice |
| First 36 months (device lines) | Customer may cancel with 20 business days' notice; ETA applies | CircleTel processes device line cancellation via Arlan; raises ETA invoice |
| After 24 months (connectivity) | Month-to-month; cancel with 20 business days' notice; no ETA | Connectivity line reverts to MTN month-to-month rate |
| After 36 months (device lines) | Upgrade due; customer should upgrade or cancel with notice | CircleTel account manager initiates upgrade call |

### R-009.1: Early Termination Amount (ETA) Calculation

ETA is calculated per line using the MTN standard formula:

```
ETA = Monthly Contracted Rate × Remaining Months in Term

Example (Vivo Y31 5G cancelled at month 12 of 36-month contract):
ETA = R455/mo × (36 - 12) remaining months = R10,920
```

ETA is billed on the next CircleTel invoice for that line. CircleTel pays Arlan/MTN the equivalent cancellation fee; the customer ETA invoice covers this cost.

### R-009.2: Connectivity Cancellation Triggers Device Line Review

If the customer cancels the connectivity anchor (Shesha/FWA), CircleTel must:
1. Immediately review the status of the 2 device lines
2. Notify the customer that device lines continue independently unless also cancelled
3. Calculate ETAs for device lines if the customer also wishes to exit those
4. Confirm CPE return obligation if Shesha plan cancelled within 24 months (see R-005)

---

## §10 — Ordering Workflow (R-010)

### R-010: Standard Connected Office Ordering Process

The following steps must be followed in sequence. No step may be skipped.

| Step | Action | Responsible | Gate |
|------|--------|-------------|------|
| 1 | Qualify customer against R-001 eligibility criteria | Sales Rep | Must pass all criteria |
| 2 | Confirm MTN coverage at premises (R-002) | Sales Rep | Must confirm ≥ threshold signal |
| 3 | Select bundle tier (Starter/Standard/Premium) based on customer needs and budget | Sales Rep + Customer | Pricing must comply with R-006 |
| 4 | Issue Connected Office quote (valid 7 days) | Sales Rep | Quote template; prices current |
| 5 | Customer signs quote and accepts terms | Customer | Signed quote required |
| 6 | Collect FICA documents: (a) CIPC registration, (b) Director/owner SA ID, (c) proof of business address | Sales Rep | All 3 documents required |
| 7 | ITC credit check on business entity and/or director | CircleTel Admin | Pass required before order |
| 8 | Submit 3-line order to Arlan simultaneously (1× connectivity + 2× devices) | CircleTel Admin | Must be simultaneous |
| 9 | MTN activates SIMs and provisions lines | Arlan/MTN | 2–5 business days |
| 10 | Tozed CPE and devices couriered to customer premises | MTN/Courier | 3–7 business days |
| 11 | CircleTel activation call: CPE setup assistance; confirm all lines active | CircleTel Account Manager | On delivery day |
| 12 | First invoice raised in next billing cycle (25th of month) | CircleTel Billing | Standard invoice |

### R-010.1: FICA Document Requirements

| Document | Required | Acceptable Formats |
|----------|----------|-------------------|
| CIPC company registration certificate | Mandatory | PDF or clear photo |
| Director/owner SA identity document | Mandatory | SA ID (green book or smart card); SA passport |
| Proof of registered/physical business address | Mandatory | Bank statement (≤3 months); utility bill (≤3 months); CIPC address confirmation |

Documents must be received and verified before the Arlan order is submitted. Incomplete FICA blocks the order.

### R-010.2: Order Submission to Arlan

The Arlan order must include all 3 line items in a single submission:
- Line 1: Connectivity anchor (Shesha 10/20Mbps or 5G FWA) — product code, customer name, address, FICA
- Line 2: Device upgrade 1 — product code, customer name, address, delivery address
- Line 3: Device upgrade 2 — product code, customer name, address, delivery address

Arlan is notified that the 3 lines form a Connected Office bundle. This ensures simultaneous provisioning and coordinated delivery.

---

## §11 — Upgrade Rules (R-011)

### R-011: Permitted Upgrades During Contract Term

| Upgrade Type | Rule | Process |
|-------------|------|---------|
| Connectivity speed: Shesha 10Mbps → 20Mbps | Permitted at any time; pricing adjusts to current promo rate | Submit speed upgrade request to Arlan; new rate applies from next billing cycle |
| Connectivity speed: Shesha → 5G FWA | Permitted if MTN confirms 5G signal at premises | Coverage check required; Arlan order for plan change |
| Add a third device line | Permitted post-sale at standard pricing; not retroactively bundled | Separate Arlan order; separate invoice line |
| Add a data SIM for a field worker | Permitted at any time | Separate Arlan order; separate invoice line |
| Device upgrade: swap device within same tier | Not permitted mid-contract | MTN device contracts are fixed to the contracted device |
| Full bundle tier upgrade | Permitted at contract renewal (month 22/34 review) | New bundle quote; new contract; simultaneous signing |

### R-011.1: Speed Upgrade Markup Rule

If the customer upgrades from Shesha 10Mbps to Shesha 20Mbps during the contract, the new subscription rate is priced at the current promo rate + CircleTel markup (minimum 15%). The original device lines are not affected.

---

## §12 — Margin Guardrail Sign-off (R-012)

### R-012: Gross Margin Compliance

CircleTel's minimum gross margin rule requires 25% gross margin on all products. Connected Office bundles are assessed as follows:

| Tier | Point-in-time Margin | Lifetime Effective Margin | Sign-off Required |
|------|---------------------|--------------------------|-------------------|
| Starter | ~24.4% (marginally below floor) | >25% (commission tail included) | Sales Director sign-off required |
| Standard | ~24.8% | >25% | Sales Director sign-off required |
| Premium | ~25.3% | >26% | Standard — no additional sign-off |

### R-012.1: Sign-off Process for Starter and Standard Tiers

1. Sales rep presents bundle quote to Sales Director before issuing to customer
2. Sales Director reviews margin calculation and lifetime commission projection
3. Sales Director approves in writing (email or WhatsApp message saved to CRM)
4. Approval reference noted on quote before issue

### R-012.2: Under No Circumstances

- A bundle discount greater than 10% may not be approved for Connected Office by any authority
- A line may not be priced below Arlan base (zero or negative markup)
- Commission from one line may not be used to subsidise a below-floor markup on another line in margin calculations

---

## Decision Trees

### Decision Tree 1: Connected Office Eligibility Check

```
CONNECTED OFFICE ELIGIBILITY CHECK
====================================

START: Customer has expressed interest in Connected Office
                    |
                    v
Is the customer a registered SA business entity?
(Pty Ltd / CC / Sole Prop / NPC)
           |              |
          YES             NO
           |              |
           v              v
   Continue           Refer to WorkConnect SOHO
                      (individual/consumer product)
           |
           v
Does the customer have 3 or more staff?
           |              |
          YES             NO
           |              |
           v              v
   Continue           Refer to Business Mobility Starter
                      (single device upgrade)
           |
           v
Is the customer FICA compliant?
(CIPC reg. + director ID + proof of address)
           |              |
          YES             NO
           |              |
           v              v
   Continue           Collect outstanding documents
                      before proceeding
           |
           v
Has MTN coverage been confirmed at the premises?
(≥2 bars LTE for Shesha 10; ≥3 bars for Shesha 20/FWA)
           |              |
          YES             NO
           |              |
           v              v
   Continue           Do not quote Shesha/FWA plans.
                      Offer alternative connectivity
                      or refer to DFA/Vodacom.
           |
           v
Has the customer's budget been verbally or
in writing approved for the bundle total?
           |              |
          YES             NO
           |              |
           v              v
CUSTOMER IS ELIGIBLE      Address budget objection.
→ Proceed to quote.       Consider lower tier.
```

---

### Decision Tree 2: CPE Return Obligation

```
CPE RETURN OBLIGATION CHECK
=============================

TRIGGER: Customer requests Shesha or FWA plan cancellation
                    |
                    v
Is the Shesha/FWA plan within its first 24 months?
           |              |
          YES             NO
           |              |
           v              v
CPE RETURN         No return obligation.
REQUIRED           Customer may keep CPE.
           |       (MTN does not reclaim CPE
           |        after 24-month term.)
           v
Send customer CPE return instructions within
2 business days (WhatsApp)
           |
           v
Provide prepaid courier label to customer
           |
           v
Did CircleTel receive the CPE within 14 calendar days?
           |              |
          YES             NO
           |              |
           v              v
Forward CPE         RAISE R1,500 CPE REPLACEMENT CHARGE
to Arlan/MTN.       on next customer invoice.
                    Notify customer in writing.
No further          CircleTel pays MTN via Arlan.
action required.
```

---

## Definitions

| Term | Definition |
|------|-----------|
| **Bundle** | The 3-line Connected Office product: 1× connectivity anchor + 2× device upgrades |
| **Connectivity anchor** | The Shesha or 5G FWA plan that provides fixed office internet connectivity |
| **Device upgrade** | A smartphone on an MTN Business MFB contract, paired with a mobile data SIM |
| **Arlan** | Arlan Communications (PTY) LTD T/A MTN Ballito — CircleTel's MTN reseller partner |
| **CPE** | Customer Premises Equipment — the Tozed ZLT X100 Pro 5G router provided free on Shesha/FWA plans |
| **ETA** | Early Termination Amount — the fee charged when a customer cancels a fixed-term contract before the end of the contracted term |
| **FICA** | Financial Intelligence Centre Act — requires collection of business registration, identity, and address documents |
| **MFB** | MTN For Business — the brand name for MTN's business smartphone and data plans |
| **Promo sheet** | The monthly Arlan/MTN promotional price list (e.g., Helios & iLula Business Promos) |
| **Markup** | The amount CircleTel charges above the Arlan base (MTN promo sheet) price |
| **Commission** | The monthly payment from Arlan to CircleTel, representing 30% of MTN's commission on each active line |

---

## Document Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 06 April 2026 | Jeffrey (MD) | Initial release |

---

## Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Managing Director | Jeffrey | ___________________ | 06 April 2026 |
| Sales Lead | ___________________ | ___________________ | ___________ |

---

*Document Reference: CT-BRD-ARLAN-CO-2026-001 | Version 1.0 | Effective: 06 April 2026*  
*CircleTel (Pty) Ltd — A member of the New Generation Group*  
*"Connecting Today, Creating Tomorrow"*
