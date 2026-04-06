# Business Rules Document: Data & Connectivity

**Document ID**: CT-BRD-ARLAN-DC-2026-001
**Version**: 1.0
**Status**: ACTIVE
**Effective Date**: April 2026
**Author**: Jeffrey (MD)
**Entity**: CircleTel (Pty) Ltd — A member of the New Generation Group
**Related CPS**: CT-CPS-ARLAN-DC-2026-001

---

## 1. Purpose

This document defines the binding business rules governing the sale, quoting, ordering,
provisioning, billing, and cancellation of all Data & Connectivity plans. These rules apply
to all CircleTel sales staff, operations, and billing personnel handling Shesha, Uncapped 5G,
FWA, and Mobile Data SIM plans. Rules marked **[MANDATORY]** must be followed without exception.
Deviations require written approval from the Managing Director.

---

## 2. Eligibility Rules

### 2.1 Business Entity [MANDATORY]

| Rule | Requirement |
|------|------------|
| Entity type | Registered South African business (PTY Ltd, CC, sole proprietor, or professional) |
| FICA compliance | FICA verification must be completed before any order is submitted to Arlan |
| FICA documents | CIPC registration certificate + director/owner ID + proof of business address |
| Consumer eligibility | Sole proprietors and home-office professionals qualify; pure residential contracts excluded |

**Rule DC-ELIG-001**: No Data & Connectivity order may be submitted to Arlan without a
completed and verified FICA file on record. This applies to all plan types including Mobile
Data SIMs.

### 2.2 Signal Coverage Check [MANDATORY]

**Rule DC-ELIG-002**: Shesha Fixed-Speed plans and 5G FWA plans require confirmed indoor MTN
4G/5G signal at the customer's premises before a quote is issued.

| Plan Category | Coverage Check Required | Method |
|--------------|------------------------|--------|
| Shesha 10Mbps | YES — MANDATORY | Customer confirms MTN bars on mobile; sales checks MTN coverage map |
| Shesha 20Mbps | YES — MANDATORY | Same as above |
| MTN Business 5G FWA 500GB | YES — MANDATORY | Customer confirms 5G signal; MTN 5G coverage map checked |
| Uncapped 5G 35Mbps (BYOD) | YES — RECOMMENDED | Customer verifies MTN signal on own device before committing |
| Uncapped 5G 60Mbps (BYOD) | YES — RECOMMENDED | Same as above |
| Business Uncapped Wireless 50/100Mbps | YES — MANDATORY | Arlan ICT team confirms signal at site visit |
| Mobile Data SIMs | NO — general MTN LTE coverage | Customer confirms MTN coverage in area of use |

**Rule DC-ELIG-003**: Failure to complete a coverage check before selling a Shesha or FWA plan
is a chargeback risk. If the Tozed CPE cannot connect due to no signal and the coverage check
was not documented, the sale cannot be reversed at the customer's expense under CPA. Sales
staff are personally accountable for coverage check documentation.

**Coverage check documentation**: Record confirmation in the customer order note (CRM / Supabase
`consumer_orders` table). At minimum, note: "Customer confirmed MTN [4G/5G] signal at premises
on [date]; MTN coverage map checked — [postcode/suburb] confirmed covered."

---

## 3. "Uncapped" Fair Usage Policy Disclosure Rule [MANDATORY]

**Rule DC-FUP-001**: Before any "Uncapped" or "Business Uncapped Wireless" plan is signed,
sales must disclose the FUP in writing. Verbal disclosure alone is insufficient.

### 3.1 Plans Subject to FUP Disclosure

| Plan | FUP Threshold | Behaviour After FUP |
|------|--------------|---------------------|
| MTN Business Uncapped 5G 35Mbps | 500GB/month | Speed throttled to approximately 1–5Mbps |
| MTN Business Uncapped 5G 60Mbps | 800GB/month | Speed throttled to approximately 1–5Mbps |
| Business Uncapped Wireless 50Mbps | FUP at high contention; vendor-defined | Speed reduced during peak periods |
| Business Uncapped Wireless 100Mbps | FUP at high contention; vendor-defined | Speed reduced during peak periods |

### 3.2 Required Written Disclosure

The following text (or equivalent) must appear in the customer quote and contract before signing:

> "This plan is marketed as 'Uncapped' but is subject to a Fair Usage Policy (FUP). After
> [500GB / 800GB] of data usage within a calendar month, speeds will be throttled. This is a
> standard MTN Business network management policy. CircleTel does not control FUP thresholds.
> By signing this agreement, you confirm you have read and understood the Fair Usage Policy."

**Rule DC-FUP-002**: The FUP disclosure must be on a separate line item in the quote, not
buried in general terms. Sales staff may not remove, minimise, or downplay FUP disclosure to
close a deal.

**Enforcement**: Any customer complaint about "Uncapped" throttling where FUP disclosure was
not documented will be treated as a sales process failure, not a network complaint.

---

## 4. CPE Ownership Rules [MANDATORY]

### 4.1 Tozed ZLT X100 Pro 5G (Shesha and FWA Plans)

**Rule DC-CPE-001**: The Tozed ZLT X100 Pro 5G CPE on Shesha and 5G FWA plans is MTN
property provided on loan for the duration of the contract.

| Scenario | Rule |
|----------|------|
| Customer wants to own CPE | Not possible on Shesha/FWA plans; device remains MTN property |
| Contract ends normally | Customer returns Tozed CPE to CircleTel or Arlan within 30 days |
| Contract cancelled early | CPE must be returned within 30 days; unreturned CPE billed at replacement cost (approx. R1,200) |
| CPE is damaged | Customer liable for damage beyond fair wear and tear |
| CPE is lost or stolen | Customer must report to CircleTel immediately; replacement charged at market rate |

**Rule DC-CPE-002**: The CPE ownership status (MTN property, on loan) must be clearly
disclosed to the customer at point of sale and included in the contract.

### 4.2 ZYXEL Router (Business Uncapped Wireless Plans)

**Rule DC-CPE-003**: The ZYXEL Router provided with Business Uncapped Wireless 50Mbps and
100Mbps plans is customer property delivered via ICT installation.

| Scenario | Rule |
|----------|------|
| Contract ends normally | Customer retains ZYXEL Router; no return required |
| Contract cancelled early | Customer retains router; no refund; early termination penalty applies to service only |
| Router malfunction during warranty | Arlan ICT team handles warranty replacement via CircleTel escalation |
| Customer wants CPE back at sale | ZYXEL is theirs — clarify this at point of sale to differentiate from Tozed |

### 4.3 MiFi Devices (Mobile Data SIM Plans)

**Rule DC-CPE-004**: MiFi devices included with MFB data SIM plans are provided on a plan-
bundled basis. Ownership follows the same pattern as Tozed CPE (MTN property, returned on
cancellation) unless otherwise stated on the specific Arlan promo sheet. Verify at order time.

---

## 5. Contract Term Rules

### 5.1 Standard Terms

| Plan Category | Standard Contract Term | Month-to-Month Available |
|--------------|----------------------|--------------------------|
| Shesha 10Mbps | 24 months | No |
| Shesha 20Mbps | 24 months | No |
| Uncapped 5G 35Mbps | 24 months | No |
| Uncapped 5G 60Mbps | 24 months | No |
| 5G FWA 500GB | 24 months | No |
| Business Uncapped Wireless 50Mbps | 24 months | No |
| Business Uncapped Wireless 100Mbps | 24 months | No |
| MFB Data+ XXL 50GB | 36 months | No |
| MFB Data+ Pro S 150GB Diamond | 24–36 months | No |
| MFB Data+ XL 30GB | 24–36 months | No |
| MFB Data+ S++ 6GB | 36 months | No |

**Rule DC-TERM-001**: Month-to-month contracts are not available on any Data & Connectivity
plan. All plans require a minimum 24-month commitment. Customers requesting a shorter term
must be redirected or educated on the commitment requirement before proceeding.

### 5.2 Term Confirmation

**Rule DC-TERM-002**: The contract term (24 or 36 months as applicable) must be explicitly
stated in the quote and customer contract. Ambiguity in contract term is a CPA compliance risk.

---

## 6. Pricing Rules

### 6.1 Markup Floor [MANDATORY]

**Rule DC-PRICE-001**: The minimum markup on all Data & Connectivity plans is **15%** on the
Arlan wholesale (MTN base) price. This floor must not be broken without written CFO approval.

| Plan Band | MTN Base Range | Min Markup | Min CircleTel Retail |
|-----------|---------------|-----------|----------------------|
| Shesha 10Mbps | ~R359 | 15% | ~R412.85 excl. VAT |
| Shesha 20Mbps | ~R429 | 15% | ~R493.35 excl. VAT |
| Uncapped 5G 35Mbps | ~R489 | 15% | ~R562.35 excl. VAT |
| Uncapped 5G 60Mbps | ~R709 | 15% | ~R815.35 excl. VAT |
| 5G FWA 500GB | ~R649 | 15% | ~R746.35 excl. VAT |
| Uncapped Wireless 50Mbps | ~R499 | 15% | ~R573.85 excl. VAT |
| Uncapped Wireless 100Mbps | ~R699 | 15% | ~R803.85 excl. VAT |

*Base prices are from March 2026 promo sheet — validate before quoting. Markup percentage
(15%) is fixed; the resulting retail price changes with each promo sheet update.*

### 6.2 Discount Authority

**Rule DC-PRICE-002**: Discounts on Data & Connectivity plans are permitted only within the
following authority matrix and only if the 15% markup floor is maintained after the discount.

| Discount Level | Authority Required | Conditions |
|---------------|-------------------|-----------|
| 0–5% off retail | Sales Representative | Must maintain 15% markup floor |
| 5–10% off retail | Sales Director approval | Must maintain 15% markup floor; documented in CRM |
| > 10% | Not permitted | No exceptions |

**Rule DC-PRICE-003**: Promotional pricing (e.g. introductory month free) must still reflect
the standard MRC on the contract. A free month may be granted as a contract signing incentive
but does not reduce the ongoing contract price. Requires MD approval.

### 6.3 Promo Sheet Price Lock

**Rule DC-PRICE-004**: Once a customer contract is signed, the customer's monthly price is
locked for the contract term. Arlan promo sheet price changes do not flow through to existing
customers mid-contract. CircleTel absorbs increases up to 5% over the contracted rate.
Increases above 5% require 30 days written notice to the customer.

---

## 7. Billing Rules

### 7.1 Invoicing

| Rule | Detail |
|------|--------|
| Invoice date | 25th of each month |
| Due date | 1st of the following month |
| Currency | ZAR including VAT at 15% |
| Invoice format | One line per active plan; plan name + MRC + VAT |
| Payment methods | NetCash Pay Now (EFT, debit order, card) |

**Rule DC-BILL-001**: Customers are invoiced by CircleTel for the full retail MRC (including
markup). Arlan commission is not shown on customer invoices and is an internal revenue item.

### 7.2 Commission Tracking

**Rule DC-BILL-002**: Arlan pays CircleTel 30% of MTN commission by the 25th of each month.
CircleTel must reconcile commission received against active plan count and MTN base prices.

| Commission Scenario | Action |
|--------------------|--------|
| Commission matches expected | Record in accounts; reconcile against plan count |
| Commission underpaid by < 10% | Raise with Arlan sales contact; include in next month reconciliation |
| Commission underpaid by > 10% | Formal written query to Arlan within 5 business days |
| Commission not received | CircleTel markup revenue covers operations; escalate to MD |

---

## 8. Cancellation Rules

### 8.1 Standard CPA Cancellation

**Rule DC-CANCEL-001**: Customers may cancel under CPA Section 14 with 20 business days'
written notice. Early termination penalty applies as follows:

| Time Remaining on Contract | Penalty |
|---------------------------|---------|
| > 18 months | 3 months of CircleTel markup component |
| 12–18 months remaining | 2 months of CircleTel markup component |
| 6–12 months remaining | 1 month of CircleTel markup component |
| < 6 months remaining | No penalty; standard notice period applies |

*Arlan/MTN may impose their own early termination charges on top of the above.*

### 8.2 CPE Return on Cancellation

**Rule DC-CANCEL-002**: On cancellation of any plan where the Tozed ZLT X100 Pro 5G CPE
was provided (Shesha and FWA plans), the customer must return the device within 30 days of
service termination.

| CPE Return Scenario | Outcome |
|--------------------|---------|
| CPE returned within 30 days, undamaged | No charge; refund of pro-rated cost if within cancellation window |
| CPE returned within 30 days, damaged | Damage assessment; customer invoiced for repair/replacement |
| CPE not returned after 30 days | Customer invoiced for replacement CPE at market rate (~R1,200) |
| ZYXEL Router (Uncapped Wireless) | No return required; customer keeps device |
| MiFi device | Return required within 30 days; same rules as Tozed CPE |

### 8.3 Upgrade Rules

**Rule DC-CANCEL-003**: Upgrades within the same plan family are permitted without triggering
a new contract, subject to the following:

| Upgrade Type | Rule |
|-------------|------|
| Shesha 10Mbps → Shesha 20Mbps (same family, speed upgrade) | Permitted; new MRC applies from next billing cycle; contract term continues |
| Shesha → Uncapped 5G (different plan family) | New contract required; previous contract terminated per CPA |
| Uncapped 5G 35Mbps → Uncapped 5G 60Mbps | Permitted; new MRC applies; contract term continues |
| Any plan → Business Uncapped Wireless | New contract; ICT delivery re-scheduled; previous contract terminated |
| Data SIM plan speed upgrade | Contact Arlan; may require new SIM provisioning |

**Rule DC-CANCEL-004**: Plan family switches (Shesha to Uncapped, MiFi to FWA, etc.) require
a new 24-month contract. The customer must be informed of this before requesting the switch.

---

## 9. Which Data Plan to Recommend — Decision Tree

Use this decision tree for every inbound Data & Connectivity enquiry.

```
START: Customer needs office internet or mobile data
         |
         v
Is the customer a registered business or professional?
  NO  → Redirect to consumer/residential offering; Data & Connectivity is B2B only
  YES → Continue
         |
         v
Is FICA complete?
  NO  → Collect documents before proceeding; do not quote until verified
  YES → Continue
         |
         v
What is the primary use case?
  |
  ├── Mobile worker / field staff / travelling data
  |     → Go to: MOBILE DATA SIM track (below)
  |
  └── Office internet (fixed location)
        → Continue to office track
         |
         v
[OFFICE TRACK]
Does the customer have confirmed MTN indoor 4G/5G signal at premises?
  NOT CHECKED → Check MTN coverage map + ask customer to confirm on phone
  NO SIGNAL   → Data & Connectivity cannot serve this location; refer to Tarana FWB or DFA
  YES SIGNAL  → Continue
         |
         v
How many staff need simultaneous internet access?
  |
  ├── 1–5 staff, moderate usage (up to 300GB/month)
  |     → Recommend: Shesha 10Mbps or Shesha 20Mbps
  |     → Disclose: Fixed speed; data cap; night bonus
  |
  ├── 5–15 staff, medium usage (300–500GB/month)
  |     → Recommend: Uncapped 5G 35Mbps or 5G FWA 500GB
  |     → MANDATORY: Disclose FUP (500GB threshold) in writing before signing
  |
  └── 15+ staff, high usage (500GB+ per month)
        → Recommend: Uncapped 5G 60Mbps or Business Uncapped Wireless 100Mbps
        → MANDATORY: Disclose FUP (800GB threshold or contention-based) in writing
        → Note: Uncapped Wireless requires ICT delivery (5–7 day lead time)
         |
         v
Does the customer want a free CPE (router) included?
  YES → Steer toward Shesha (Tozed free) or Uncapped Wireless (ZYXEL via ICT delivery)
  NO / They have own device → Uncapped 5G 35/60Mbps (BYOD) is appropriate
         |
         v
What is the customer's monthly budget?
  < R550/mo → Shesha 10Mbps (R474 incl. VAT) or Shesha 20Mbps (R567 incl. VAT)
  R550–R700 → Uncapped 5G 35Mbps (~R647) or Uncapped Wireless 50Mbps (~R660)
  R700–R1,000 → 5G FWA 500GB (~R858) or Uncapped 5G 60Mbps (~R938)
  > R1,000 → Uncapped Wireless 100Mbps (~R924) or bundle with device upgrades
         |
         v
Issue quote with correct plan, FUP disclosure (if applicable), CPE ownership terms,
and 24-month contract confirmation → PROCEED TO ORDER

[MOBILE DATA SIM TRACK]
         |
         v
How much data does the user need per month?
  |
  ├── < 10GB → MFB Data+ S++ 6GB (~R298 incl. VAT)
  ├── 10–30GB → MFB Data+ XL 30GB (~R443 incl. VAT)
  ├── 30–60GB → MFB Data+ XXL 50GB (~R620 incl. VAT)
  └── 60GB+ → MFB Data+ Pro S 150GB Diamond (~R726 incl. VAT)
         |
         v
Does the user need a MiFi device (hotspot) or will they use the SIM in a tablet/laptop?
  MiFi needed → All MFB plans include MiFi; confirm preferred device at order
  SIM-only  → MFB plans can be ordered SIM-only; confirm with Arlan at submission
         |
         v
Issue quote with 36-month (MFB standard) contract → PROCEED TO ORDER
```

---

## 10. Compliance and Regulatory

| Requirement | Rule |
|-------------|------|
| FICA (Act 38 of 2001) | Mandatory KYC before any order; no exceptions |
| CPA (Act 68 of 2008) | 24/36-month fixed-term; Section 14 governs cancellation |
| POPIA | Customer data handled per CircleTel privacy policy; no data shared with Arlan without consent |
| VAT (Act 89 of 1991) | 15% VAT applied to all customer invoices; CircleTel is a VAT vendor |
| FUP disclosure | Written disclosure mandatory before signing; see Rule DC-FUP-001 |
| CPE ownership disclosure | Written disclosure of whether CPE is MTN property or customer property |
| Coverage check | Mandatory for Shesha and FWA plans; documented in order record |
| Advertising Standards | Sales must not advertise "unlimited" data without immediate FUP qualification |

---

## 11. Escalation Matrix

| Issue | First Contact | Escalation |
|-------|--------------|-----------|
| CPE not delivered after 7 days | CircleTel → Arlan courier query | MD if unresolved after 2 business days |
| SIM not activating after 5 days | CircleTel → Arlan provisioning | Arlan sales manager |
| FUP throttling complaint | CircleTel → confirm FUP in writing was disclosed | If not disclosed, internal investigation |
| Customer disputes contract term | Sales manager reviews signed contract | MD decision if not in writing |
| Commission underpaid | Accounts team → Arlan statement reconciliation | MD escalation |
| Coverage check failure post-sale | CircleTel initiates CPE return process | MD signs off on commercial resolution |

---

## 12. Change Control

| Change Type | Authority Required |
|-------------|-------------------|
| Pricing adjustment (markup floor) | CFO written approval |
| New plan added to product range | MD approval + CPS update |
| FUP thresholds change (MTN decision) | Update BRD disclosure table; notify all sales staff |
| CPE ownership rules change | MD approval; update all active quote templates |
| Contract term change | MD + legal review |
| Promo sheet refresh (quarterly) | Sales Director; update price tables in CPS only; BRD does not change |

---

## 13. Document History

| Version | Date | Author | Change Summary |
|---------|------|--------|---------------|
| 1.0 | April 2026 | Jeffrey (MD) | Initial release — Phase 2 product launch |

**Next scheduled review**: July 2026 (promo sheet refresh + Phase 3 activation)

---

## 14. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Managing Director | Jeffrey | | |
| Sales Director | | | |
| Operations | | | |

---

*CircleTel (Pty) Ltd — A member of the New Generation Group*
*"Connecting Today, Creating Tomorrow"*
*contactus@circletel.co.za | WhatsApp: 082 487 3900 | Mon–Fri 8am–5pm*
