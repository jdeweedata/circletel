# Pricing Guardrails

Non-negotiable rules for promotional pricing. Every campaign MUST validate against these guardrails before launch.

---

## The Golden Rule

> **Minimum 25% gross margin on ALL products — no exceptions without MD written approval.**

This means:
- Every promotional price must leave at least 25% margin after COS
- Volume-at-any-cost thinking is rejected
- Value-adds are preferred over price discounts
- Long-term sustainability trumps short-term wins

---

## Cost of Sale (COS) Reference

### Core COS Components

| Component | Vendor | Monthly Cost | Notes |
|-----------|--------|--------------|-------|
| BNG Service | Echo SP | R20.20 | Tier 4 volume rate (>1k users) |
| IP Transit | Echo SP/DFA | R28.00 | ~4 Mbps avg usage @ R7/Mbps |
| DFA Backhaul (per user) | DFA Magellan | R86.27 | R12,940 ÷ 150 users |
| Support | Internal | R30.00 | Level 1 support allocation |
| Billing/Admin | AgilityGIS | R10.96 | BSS stack cost |
| **Total Monthly COS Floor** | | **R175.43** | **Excludes tower/access costs** |

### COS by Product Line

| Product | Access COS | Total COS | Min Price (25% margin) | Typical Margin |
|---------|------------|-----------|------------------------|----------------|
| **SkyFibre SMB** | Tarana G1 | ~R175 | R234 | 41-52% |
| **BizFibreConnect** | DFA FTTB | ~R150 | R200 | 31-41% |
| **AirLink FWA** | Reyee 5GHz | ~R100 | R133 | 58-81% |
| **ParkConnect DUNE** | Peraso 60GHz | ~R500 | R667 | 54-75% |
| **CircleConnect LTE** | MTN LTE | ~R300 | R400 | 33-37% |
| **ClinicConnect** | Hybrid | ~R300 | R400 | 33-40% |
| **Managed IT** | SuperOps | Varies | Varies | 42-55% |

**Note:** COS varies by package speed due to transit costs. Higher speeds = higher COS.

---

## Margin Calculation Formula

```
Gross Margin % = (Revenue - COS) / Revenue × 100

Where:
- Revenue = Effective monthly price after promotions
- COS = All direct costs to deliver service
```

### Example Calculations

**Example 1: Simple Price Discount**
```
Product: SkyFibre SMB 50/25
Standard Price: R1,899/mo
Promotional Price: R1,599/mo (16% discount)
COS: R175.43

Gross Margin = (R1,599 - R175.43) / R1,599 = 89.0% ✓
```

**Example 2: Free Months Offer**
```
Product: SkyFibre SMB 50/25
Offer: 2 months free on 12-month contract
Standard Price: R1,899/mo

Effective Revenue = 10 months × R1,899 ÷ 12 = R1,582.50/mo
COS: R175.43

Gross Margin = (R1,582.50 - R175.43) / R1,582.50 = 88.9% ✓
```

**Example 3: Installation Waiver (Value-Add)**
```
Product: SkyFibre SMB 50/25
Standard Install: R2,500 (one-time)
Offer: FREE installation
Monthly Price: R1,899/mo (unchanged)

COS (monthly): R175.43
Installation cost to CircleTel: R1,500

Amortized monthly: R1,500 ÷ 12 months = R125/mo
Adjusted COS: R175.43 + R125 = R300.43/mo

Gross Margin = (R1,899 - R300.43) / R1,899 = 84.2% ✓

Note: Installation waiver is preferred over price discount
because margin remains high and customer perceives high value.
```

---

## Discount Approval Matrix

### Pre-Approved (No Approval Needed)

| Discount Type | Maximum | Conditions |
|--------------|---------|------------|
| Free installation | Full waiver | 12+ month commitment |
| Free months | 2 months | 12-month contract |
| Speed upgrade (temporary) | 6 months | Then auto-reverts |
| Bundle discount | 10% | When adding 2nd product |
| Referral credit | R500/customer | Both parties must be customers |

### MD Approval Required

| Discount Type | Threshold | Documentation Required |
|--------------|-----------|------------------------|
| Free months | 3+ months | Business case + margin calc |
| Price discount | >10% | Written justification |
| Speed upgrade (permanent) | Any | Product change approval |
| Bundle discount | >15% | Margin analysis for bundle |
| Custom pricing | Below published | Customer-specific quote |

### Never Approved

| Action | Why |
|--------|-----|
| Price below COS + 25% | Violates golden rule |
| Subsidized installation | Revenue must ≥ cost |
| Unlimited discounts | Creates precedent |
| Matching predatory competitor pricing | Race to bottom |

---

## Value-Add Hierarchy

When designing promotions, prefer value-adds over discounts. Listed from best to worst for margin:

| Rank | Value-Add Type | Margin Impact | Customer Perceived Value |
|------|----------------|---------------|-------------------------|
| 1 | **Speed boost (temporary)** | Minimal COS increase | High (free upgrade feel) |
| 2 | **Extended support hours** | Low operational cost | Medium-High |
| 3 | **Installation waiver** | One-time cost absorption | High (R2,500 saved) |
| 4 | **Free router upgrade** | One-time CPE cost | Medium |
| 5 | **Free months** | Direct revenue reduction | Very High |
| 6 | **Price discount** | Ongoing revenue reduction | High |

**Rule:** Work down this list. Only use #5 or #6 when #1-4 don't fit the campaign.

---

## Contract Term Extensions

Extending contract term can offset promotional costs:

| Standard Term | Extended Term | Acceptable Promotion |
|---------------|---------------|---------------------|
| 12 months | 24 months | 3 free months (still profitable) |
| 24 months | 36 months | 4 free months OR 15% discount |
| 12 months | 12 months | 2 free months OR 10% discount |

**Formula:**
```
LTV Impact = (Extended Term × Standard Price) - (Promo Value)

If LTV Impact > Standard LTV → Promotion is acceptable
```

---

## Product-Specific Guardrails

### SkyFibre SMB

| Package | Standard Price | Min Promo Price | Max Discount |
|---------|---------------|-----------------|--------------|
| 50/25 | R1,899 | R1,599 | 16% |
| 100/50 | R2,899 | R2,399 | 17% |
| 200/100 | R3,899 | R3,199 | 18% |
| 500/250 | R4,899 | R3,999 | 18% |

### BizFibreConnect

| Package | Standard Price | Min Promo Price | Max Discount |
|---------|---------------|-----------------|--------------|
| 50/50 | R1,699 | R1,449 | 15% |
| 100/100 | R2,373 | R1,999 | 16% |
| 200/200 | R3,523 | R2,949 | 16% |
| 500/500 | R4,373 | R3,649 | 17% |

### AirLink FWA

| Package | Standard Price | Min Promo Price | Max Discount |
|---------|---------------|-----------------|--------------|
| 25/10 | R599 | R499 | 17% |
| 50/25 | R999 | R799 | 20% |
| 100/50 | R1,699 | R1,399 | 18% |

---

## Campaign Budget Controls

### Per-Campaign Limits

| Campaign Type | Max Discount Pool | Max Duration |
|---------------|-------------------|--------------|
| Seasonal (Black Friday) | R50,000 total | 4 weeks |
| Product Launch | R25,000 total | 6 weeks |
| Competitor Response | R15,000 total | 2 weeks |
| Win-back | R100/customer × N | Ongoing |
| Referral | R500/referral | Ongoing |

### Portfolio Limits

| Metric | Maximum | Monitoring |
|--------|---------|------------|
| Active promotional customers | 20% of base | Monthly review |
| Blended portfolio margin | Never below 30% | Weekly finance report |
| Promotional MRR | 15% of total MRR | Monthly review |

---

## Red Flags: Stop and Escalate

Immediately escalate to MD if ANY of these occur:

1. **Campaign requires margin below 25%** — needs strategic exception
2. **Competitor matching would cause cascade** — may need to ignore
3. **High-value account requesting custom pricing** — case-by-case
4. **Promotional costs exceeding budget** — pause and review
5. **Blended margin trending down** — portfolio-level concern

---

## Margin Calculation Checklist

Before approving any promotional pricing, verify:

- [ ] COS correctly calculated for specific product/package
- [ ] Installation costs included if waiving install fee
- [ ] CPE/hardware costs amortized if subsidizing equipment
- [ ] Contract term accounted for in LTV calculation
- [ ] Gross margin ≥25% after all promotional impacts
- [ ] Campaign budget within limits
- [ ] Approval level appropriate for discount type

---

## Quick Reference Card

Print this or save as desktop reference:

```
╔════════════════════════════════════════════════════════════╗
║               CIRCLETEL PRICING GUARDRAILS                  ║
╠════════════════════════════════════════════════════════════╣
║                                                             ║
║  GOLDEN RULE: Minimum 25% gross margin. ALWAYS.            ║
║                                                             ║
║  COS FLOOR: ~R175/mo (varies by product)                    ║
║                                                             ║
║  APPROVED WITHOUT MD:                                       ║
║    • Free installation (12mo contract)                      ║
║    • 2 free months (12mo contract)                          ║
║    • 10% price discount                                     ║
║    • 6-month speed boost                                    ║
║    • 10% bundle discount                                    ║
║                                                             ║
║  NEEDS MD APPROVAL:                                         ║
║    • 3+ free months                                         ║
║    • >10% price discount                                    ║
║    • Custom pricing below published                         ║
║                                                             ║
║  PREFER VALUE-ADDS OVER DISCOUNTS:                          ║
║    Speed boost > Install waiver > Free months > Discount    ║
║                                                             ║
╚════════════════════════════════════════════════════════════╝
```

---

**Version:** 1.0.0
**Last Updated:** 2026-03-01
**Source:** products/solution-design.md Section 4
