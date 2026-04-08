---
paths:
  - "lib/pricing/**"
  - "components/checkout/**"
  - "app/api/**/pricing/**"
  - "app/api/**/billing/**"
  - "components/admin/billing/**"
---

Rule: margin-guardrails
Loaded by: CLAUDE.md
Scope: Minimum margins, discount approval, pricing rules, MSC-aware pricing, bundle economics

---

## Minimum Margin Rule (NON-NEGOTIABLE)

**25% gross margin on ALL products — no exceptions without MD written approval.**

```
Gross Margin % = (Revenue - Cost of Sale) / Revenue × 100
```

| Threshold | Margin | Approval Required |
|-----------|--------|-------------------|
| Healthy | ≥ 35% | Standard — auto-approved |
| Marginal | 25-35% | Sales Director approval |
| Low | < 25% | CFO approval (rarely granted) |
| Floor | < 20% | **Never permitted** |

## Arlan Markup Floor by Category

These are the minimum markups applied to MTN Arlan deals. Defined in `MARKUP_RULES` constant in `lib/types/mtn-dealer-products.ts`.

| Category | Markup % | Resulting Margin | Notes |
|----------|----------|-----------------|-------|
| IoT/M2M | 20% | 16.7% | Commission supplements margin |
| Fleet Management | 18% | 15.3% | Commission supplements margin |
| Data Connectivity | 15% | 13.0% | Commission supplements margin |
| Backup Connectivity | 15% | 13.0% | Commission supplements margin |
| Mobile Workforce | 15% | 13.0% | Commission supplements margin |
| Voice Comms | 10% | 9.1% | Commission supplements margin |
| Device Upgrade | 8% | 7.4% | Commission supplements margin |
| Venue WiFi | 20% | 16.7% | Commission supplements margin |

**Note**: Markup-only margin is below 25% for all categories. This is acceptable because Arlan deals also generate commission income (1.4-4.1% effective rate). Combined margin (markup + commission) typically exceeds 25%.

## MSC-Aware Pricing

**CRITICAL**: Wholesale spend on Tarana customers counts toward MSC. Pricing decisions must consider MSC coverage.

```
MSC Coverage Ratio = (Tarana Customers × R499) / MSC Commitment
```

| Ratio | Status | Action |
|-------|--------|--------|
| < 0.8x | CRITICAL | Urgent — accelerate Tarana sales or renegotiate MSC |
| 0.8-1.0x | WARNING | MSC shortfall being paid — every new Tarana customer helps |
| 1.0-1.5x | COVERED | MSC met but thin margin |
| > 1.5x | SAFE | Healthy buffer above MSC |

**Never discount Tarana products below wholesale** — this would increase MSC shortfall.

## Discount Approval Matrix

| Discount Level | Who Can Approve | Max Duration | Applies To |
|---------------|----------------|-------------|-----------|
| 0-5% | Sales Rep | 24 months | Any product |
| 5-10% | Sales Director | 24 months | Non-DFA products |
| 10-15% | MD | 12 months | With volume commitment (5+ lines) |
| 15-20% | MD + CFO | 6 months | Strategic accounts only |
| > 20% | **Not permitted** | — | — |

**All discounts must maintain the 25% minimum margin floor.**

## Volume Discount Schedule

| Lines | Discount | Notes |
|-------|----------|-------|
| 1-4 | 0% | Standard pricing |
| 5-9 | 5% | Sales rep authority |
| 10-19 | 8% | Sales director authority |
| 20-49 | 10% | MD authority |
| 50+ | 12% | MD + CFO, custom pricing |

## Promotional Pricing Rules

- Maximum promotional period: **90 days**
- Must maintain **25% margin floor** even during promotion
- Promotional pricing requires **MD pre-approval**
- Cannot stack promotions on same product
- Must track promotional revenue separately for margin analysis

## Bundle Pricing Rules

- Combined bundle margin must exceed **30%** (higher than single-product floor)
- CircleTel connectivity product must be the primary (largest revenue component)
- Arlan add-ons priced at standard markup (no bundle discount on Arlan component)
- Bundle discount applied to CircleTel component only
- Maximum bundle discount: **15%** off combined retail

## Contract Term Pricing

| Term | Price Adjustment | Rationale |
|------|-----------------|-----------|
| Month-to-Month | +15% premium | Higher churn risk |
| 12 months | Standard retail | Base pricing |
| 24 months | -5% discount | Standard commitment |
| 36 months | -8% discount | Maximum discount for term |

## Do NOT

- Price below wholesale + COS floor under any circumstances
- Apply promotional pricing without tracking the margin impact
- Discount Arlan markup below the category floor (commission alone is insufficient margin)
- Accept deals that increase MSC shortfall without a plan to cover it
- Stack volume + term + promotional discounts simultaneously
- Create custom pricing without documenting the business case

## Pricing Decision Tree

```
1. Is it a Tarana/DFA product?
   → Check: retail - wholesale - COS > 25% margin? If not, reject or increase price.
   → Check: Does adding this customer improve MSC coverage? Factor into approval.

2. Is it an Arlan deal?
   → Apply category markup floor from MARKUP_RULES
   → Verify: markup + commission combined > 25% margin equivalent? If not, increase markup.

3. Is a discount requested?
   → Check discount level against approval matrix
   → Verify post-discount margin ≥ 25%
   → Document in CRM with approval reference

4. Is it a bundle?
   → Combined margin must exceed 30%
   → Discount CircleTel component only, not Arlan add-ons
```
