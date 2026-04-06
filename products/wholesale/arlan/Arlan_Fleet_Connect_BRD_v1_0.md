# Business Rules Document: Fleet Connect

**Document ID**: CT-BRD-ARLAN-FC-2026-001
**Version**: 1.0
**Status**: ACTIVE
**Effective Date**: April 2026
**Author**: Jeffrey (MD)
**Entity**: CircleTel (Pty) Ltd — A member of the New Generation Group
**Related CPS**: CT-CPS-ARLAN-FC-2026-001

---

## 1. Purpose

This document defines the binding business rules governing the sale, ordering, provisioning,
billing, and cancellation of Fleet Connect. These rules apply to all CircleTel sales staff,
operations, and billing personnel. Rules marked **[MANDATORY]** must be followed without
exception. Deviations require written approval from the Managing Director.

---

## 2. Eligibility Rules

### 2.1 Business Entity [MANDATORY]

| Rule | Requirement |
|------|------------|
| Entity type | Registered South African company (PTY Ltd, CC, or sole proprietor with business registration) |
| FICA compliance | Customer must pass FICA verification before any order is submitted to Arlan |
| FICA documents | CIPC registration certificate + director ID + proof of business address |
| Consumer exclusions | Fleet Connect is a B2B-only product; no residential or personal contracts |

**Rule FC-ELIG-001**: No Fleet Connect order may be submitted to Arlan without a completed
and verified FICA file on record. This is a legal obligation under FICA (2001) and an Arlan
contractual requirement.

### 2.2 Minimum SIM Count [MANDATORY]

**Rule FC-ELIG-002**: A minimum of 5 IoT SIMs must be included in any Fleet Connect order.

| SIM Count | Action |
|-----------|--------|
| 1–4 SIMs requested | Redirect customer to Business Mobility Starter (data SIM only) |
| 5–20 SIMs | Standard Fleet Connect (Starter, Mid, or Large tier) |
| 21–50 SIMs | Large Fleet with Sales Director approval on pricing |
| 51+ SIMs | Refer to direct Arlan enterprise agreement negotiation; CircleTel earns referral |

### 2.3 Fleet Hardware Prerequisite [MANDATORY]

**Rule FC-ELIG-003**: Fleet Connect provides SIM cards only. The customer must already have
compatible GPS tracker or IoT sensor hardware installed in their vehicles or assets.

| Check | Requirement |
|-------|------------|
| Hardware confirmed | Sales must confirm customer has tracker hardware before issuing quote |
| Hardware not yet sourced | Redirect to hardware supplier (MiRO, Scoop, or Nology); re-engage once hardware is ordered |
| CircleTel hardware supply | CircleTel does not supply fleet tracking hardware under this product |

---

## 3. IoT SIM Rules

### 3.1 Chip SIM (CONSMD64K) Capabilities [MANDATORY]

**Rule FC-IOT-001**: The Business Access Mobile Chip SIM is an M2M-rated SIM. Sales staff must
not misrepresent its capabilities.

| Capability | Status | Notes |
|-----------|--------|-------|
| Data (GPRS/LTE) | YES | Primary function — tracker pings, sensor uploads |
| Voice calls | NO | M2M SIMs are data-only; no voice capability |
| SMS | NO | No outbound or inbound SMS |
| WhatsApp / OTT messaging | NO | No application layer messaging |
| Tethering / hotspot | NO | SIM is not for hotspot use |

**Rule FC-IOT-002**: Any customer expecting voice or SMS from IoT SIMs must be redirected to
a standard MFB voice/data plan instead. Selling an M2M SIM to a customer expecting voice is
a chargeback risk and a potential CPA violation.

### 3.2 APN Documentation [MANDATORY]

**Rule FC-IOT-003**: The APN string required by the customer's fleet tracking platform must be
documented in the order form before CircleTel submits the order to Arlan.

| Scenario | Action |
|----------|--------|
| Customer knows APN | Record APN string in order form; confirm with Arlan at submission |
| Customer unsure of APN | Provide default `internet` APN; advise customer to check with their fleet software vendor |
| Platform requires proprietary APN | Document specific APN; confirm Arlan can provision; if not, escalate before sale |

**Rule FC-IOT-004**: CircleTel is responsible for communicating the APN string to the customer
and documenting it. CircleTel is not responsible for configuring APN settings in the customer's
fleet tracking hardware or software.

---

## 4. Manager SIM Rule [MANDATORY]

**Rule FC-MGR-001**: Every Fleet Connect deal must include at least one data SIM for the fleet
supervisor. IoT Chip SIMs must not be sold as a standalone order without a management device.

**Rationale**: IoT SIMs are data-only and cannot be used for voice communication. A fleet
manager must have a data SIM to access the fleet management platform. Selling IoT SIMs without
a management SIM leaves the customer without operational oversight capability.

| Scenario | Rule |
|----------|------|
| Customer requests IoT SIMs only | Educate on requirement; add manager SIM to order |
| Customer has existing data SIM from another provider | Acceptable; manager SIM add-on is optional if customer confirms they already have one |
| Customer wants manager SIM only | Not a Fleet Connect deal; process as Business Mobility Starter |

---

## 5. Ordering Rules

### 5.1 Bulk Order Process [MANDATORY]

**Rule FC-ORD-001**: All SIMs in a fleet deal must be ordered simultaneously via a single Arlan
order submission. Piecemeal SIM ordering is not permitted under the standard Fleet Connect
process.

| Scenario | Rule |
|----------|------|
| Customer wants 5 SIMs now and 5 next month | Process as two separate orders with two separate quotes |
| Customer wants to add 3 SIMs mid-contract | New add-on order required; pricing validated against current promo sheet at time of expansion |
| Customer wants to remove SIMs mid-contract | Governed by cancellation rules (Section 8); individual SIM removals not permitted |

**Rule FC-ORD-002**: The quote locks the fleet size and SIM count. Any change to SIM count after
customer signs the quote requires a revised quote and re-signing.

### 5.2 Order Submission

| Requirement | Detail |
|-------------|--------|
| Submission channel | CircleTel submits all orders directly to Arlan sales team |
| Order form | CircleTel internal order form (Supabase `consumer_orders` or admin portal) |
| Lead time | 2–5 business days from Arlan receipt of completed order |
| Status tracking | CircleTel tracks order status; customer updates via WhatsApp |

---

## 6. Pricing Rules

### 6.1 Markup Floors [MANDATORY]

**Rule FC-PRICE-001**: The minimum markup on IoT SIMs (Business Access Mobile) is **20%** on
the Arlan wholesale price. This floor must not be broken under any circumstances without
written CFO approval.

**Rule FC-PRICE-002**: The minimum markup on the manager data SIM is **15%** on Arlan wholesale
price, consistent with the Data Connectivity category floor.

| Component | Arlan Wholesale | Min Markup | Min Retail excl. VAT |
|-----------|----------------|-----------|----------------------|
| IoT Chip SIM R6 base | R6.00 | 20% | R7.20 |
| IoT Chip SIM R15 avg | R15.00 | 20% | R18.00 |
| IoT Chip SIM R26 max | R26.00 | 20% | R31.20 |
| Manager SIM MFB XL 30GB R345 | R345.00 | 15% | R396.75 |

### 6.2 Bulk Order Discount [MANDATORY]

**Rule FC-PRICE-003**: Fleet deals with more than 20 SIMs require Sales Director approval before
a quote is issued. The Sales Director must verify the proposed pricing maintains the 20%/15%
markup floors after any volume discount.

| Deal Size | Discount Authority |
|-----------|-------------------|
| 5–20 SIMs | Sales Representative authority; no discount required |
| 21–50 SIMs | Sales Director approval; discount must not breach markup floors |
| 51+ SIMs | Refer to Arlan enterprise agreement; out of standard Fleet Connect scope |

### 6.3 Price Lock

**Rule FC-PRICE-004**: Once a 24-month contract is signed, CircleTel locks the customer's
pricing for the contract term. If Arlan's promo sheet changes (typically quarterly), CircleTel
absorbs any cost increase up to 5% without passing through to the customer. Increases above 5%
require written notification to the customer with 30 days notice.

---

## 7. Billing Rules

### 7.1 Single Invoice

**Rule FC-BILL-001**: All SIMs in a fleet deal are billed on a single monthly invoice from
CircleTel. Customers receive one invoice for the entire fleet, not individual SIM invoices.

| Billing Detail | Rule |
|----------------|------|
| Invoice date | 25th of each month |
| Due date | 1st of the following month |
| Payment methods | NetCash Pay Now (EFT, debit order) |
| Currency | ZAR incl. VAT at 15% |
| VAT | CircleTel charges VAT on full invoice amount |

### 7.2 Commission Tracking

**Rule FC-BILL-002**: Arlan pays CircleTel 30% of MTN commission by the 25th of each month.
Commission is an internal revenue item; it is not shown on customer invoices.

| Commission Scenario | Action |
|--------------------|--------|
| Commission paid on time | Reconcile against order records; credit to Arlan commission income |
| Commission underpaid | Raise with Arlan sales contact within 5 business days of statement |
| Commission missing | CircleTel still invoices and collects customer markup revenue; commission is supplementary |

---

## 8. Cancellation Rules

### 8.1 Contract Term [MANDATORY]

**Rule FC-CANCEL-001**: Fleet Connect contracts are 24-month fixed-term agreements. Early
termination is governed by CPA Section 14.

**Rule FC-CANCEL-002**: Individual SIM cancellations are not permitted mid-contract.
A customer may not cancel 3 SIMs and retain 7 — the contract applies to the full fleet size
as quoted. The only options are:

| Scenario | Outcome |
|----------|---------|
| Cancel entire fleet contract | CPA Section 14 applies; 20 business days notice; settlement calculated on remaining term |
| Remove individual SIMs | Not permitted under standard Fleet Connect; requires MD approval for commercial exception |
| Suspend SIMs temporarily | Not available on IoT SIM plans; SIMs remain billed while active |
| Upgrade to more SIMs | New add-on order; separate 24-month commitment for added SIMs |

### 8.2 CPA Section 14 Settlement

Upon early termination by the customer:

| Term Remaining | Settlement |
|---------------|-----------|
| > 18 months | 3 months penalty (markup component only) + remaining Arlan obligation |
| 12–18 months | 2 months penalty (markup component only) |
| < 12 months | 1 month penalty (markup component only) |

*Arlan/MTN may impose their own early termination charges in addition to the above.*

---

## 9. Fleet Deal Qualification Decision Tree

Use this decision tree for every inbound fleet enquiry.

```
START: Customer wants connectivity for their fleet/vehicles/assets
         |
         v
Is the customer a registered business (PTY Ltd, CC, or sole proprietor)?
  NO  → Redirect to consumer products; Fleet Connect is B2B only
  YES → Continue
         |
         v
Has the customer completed FICA (CIPC cert + director ID + proof of address)?
  NO  → Collect FICA documents; do not proceed to quote until verified
  YES → Continue
         |
         v
How many IoT SIMs are needed?
  1–4 → Redirect to Business Mobility Starter (data SIM deal)
  5+  → Continue with Fleet Connect
         |
         v
Does the customer already have GPS tracker / IoT hardware installed?
  NO  → Refer to hardware supplier (MiRO/Scoop/Nology); follow up after hardware ordered
  YES → Continue
         |
         v
Has the APN string been identified (or is customer using default MTN `internet` APN)?
  NO  → Customer must check with their fleet software vendor before order
  YES → Document APN in order form
         |
         v
Will a manager SIM be included?
  NO (customer has own data SIM) → Confirm in writing; manager SIM optional
  NO (no manager SIM at all)     → Educate; add MFB XL 30GB to quote
  YES → Continue
         |
         v
Is the fleet size > 20 SIMs?
  YES → Escalate to Sales Director for pricing approval before issuing quote
  NO  → Issue quote using current Arlan promo sheet prices + 20% IoT markup + 15% manager SIM markup
         |
         v
Customer signs 24-month contract + FICA verified?
  NO  → Hold order; do not submit to Arlan
  YES → Submit bulk SIM order to Arlan; confirm 2–5 business day delivery timeline
         |
         v
ORDER SUBMITTED — track activation; confirm first billing cycle with customer
```

---

## 10. Compliance and Regulatory

| Requirement | Rule |
|-------------|------|
| FICA (Act 38 of 2001) | Mandatory KYC before any order; no exceptions |
| CPA (Act 68 of 2008) | 24-month fixed-term; Section 14 applies on cancellation |
| POPIA | Customer data handled per CircleTel privacy policy; no data shared with Arlan without consent |
| VAT (Act 89 of 1991) | 15% VAT applied to all customer invoices; CircleTel is a VAT vendor |
| M2M SIM disclosure | Sales must disclose that IoT SIMs are data-only (no voice, no SMS) before sale |
| MTN Network Terms | Customer's use of SIMs subject to MTN's standard fair use and acceptable use policies |

---

## 11. Change Control

| Change Type | Authority |
|-------------|-----------|
| Pricing adjustment (markup floor) | CFO written approval |
| New fleet tier added | MD approval + CPS update |
| APN default changed | Operations Manager |
| Cancellation terms amended | MD + legal review |
| Promo sheet refresh (quarterly) | Sales Director; update price sheet; no CPS/BRD update required |

---

## 12. Document History

| Version | Date | Author | Change Summary |
|---------|------|--------|---------------|
| 1.0 | April 2026 | Jeffrey (MD) | Initial release — Phase 3 product launch |

**Next scheduled review**: July 2026 (prior to Phase 3 launch and promo sheet refresh)

---

## 13. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Managing Director | Jeffrey | | |
| Sales Director | | | |
| Operations | | | |

---

*CircleTel (Pty) Ltd — A member of the New Generation Group*
*"Connecting Today, Creating Tomorrow"*
*contactus@circletel.co.za | WhatsApp: 082 487 3900 | Mon–Fri 8am–5pm*
