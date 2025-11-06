# Commission Structure Comparison: Multi-Model Analysis
**Version:** 1.0
**Date:** 4 November 2025
**Purpose:** Compare and implement multiple commission models for different product lines

---

## Executive Summary

CircleTel uses **three distinct commission models** depending on the product line:

1. **MTN Arlan Model** (MTN Deals) - Tiered revenue-based commissions
2. **Margin-Share Model** (BizFibre, SkyFibre) - Fixed percentage of gross margin
3. **Hybrid Model** (Optional) - Combination of both approaches

---

## Model 1: MTN Arlan - Tiered Revenue Commission

### **Applied To:** MTN Deals, MTN 5G/LTE Products

### Commission Structure:
Based on **monthly subscription value** with **7 tiered rates**:

| Tier | Monthly Range | Base Rate | Partner Share | Effective Rate |
|------|---------------|-----------|---------------|----------------|
| 1 | R0-R99 | 4.75% | 30% | 1.425% |
| 2 | R100-R199 | 5.75% | 30% | 1.725% |
| 3 | R200-R299 | 7.25% | 30% | 2.175% |
| 4 | R300-R499 | 8.75% | 30% | 2.625% |
| 5 | R500-R999 | 9.75% | 30% | 2.925% |
| 6 | R1,000-R1,999 | 11.75% | 30% | 3.525% |
| 7 | R2,000+ | 13.75% | 30% | 4.125% |

### Calculation Method:
```
Total Contract Value = Monthly Subscription × Contract Term (months)
Base Commission = Total Contract Value × Base Rate
Partner Commission = Base Commission × 30%
```

### Example: R500/month, 24-month MTN Deal
```
Total Value: R500 × 24 = R12,000
Tier: 5 (Business) - 9.75% base
Base Commission: R12,000 × 9.75% = R1,170
Partner Commission: R1,170 × 30% = R351 (excl VAT)
```

---

## Model 2: Margin-Share - Fixed Product Commission

### **Applied To:** BizFibre Connect, SkyFibre Business

### BizFibre Connect Commission Structure:

| Package | Monthly Price | DFA Cost | Infrastructure | Router | Total Cost | **Gross Margin** | Margin % |
|---------|---------------|----------|----------------|--------|------------|------------------|----------|
| **Lite 10/10** | R1,699 | R999 | R122 | R18 | R1,139 | **R560** | 33.0% |
| **Starter 25/25** | R1,899 | R999 | R122 | R21 | R1,142 | **R757** | 39.8% |
| **Plus 50/50** | R2,499 | R1,422 | R122 | R21 | R1,565 | **R934** | 37.4% |
| **Pro 100/100** | R2,999 | R1,731 | R122 | R0 | R1,853 | **R1,146** | 38.2% |
| **Ultra 200/200** | R4,373 | R2,875 | R122 | R0 | R2,997 | **R1,376** | 31.5% |

### SkyFibre Business Commission Structure:

| Package | Monthly Price | MTN Cost | Total Cost | **Gross Margin** | Margin % |
|---------|---------------|----------|------------|------------------|----------|
| **Business 50** | R1,999 | R499 | R1,132 | **R867** | 43.4% |
| **Business 100** | R2,999 | R599 | R1,432 | **R1,567** | 52.3% |
| **Business 200** | R4,499 | R699 | R1,832 | **R2,667** | 59.3% |
| **Business 300** | R5,999 | R1,298 | R2,926 | **R3,073** | 51.2% |
| **Business 400** | R7,999 | R1,398 | R3,493 | **R4,506** | 56.3% |

### Proposed Partner Commission: 20% of Gross Margin

**Rationale:**
- MTN Arlan model gives partners 30% of base commission (which is ~4-14% of revenue)
- Effective partner earnings are 1.4-4.1% of total contract value
- For BizFibre/SkyFibre: 20% of margin = 6-12% of revenue equivalent
- Higher margin products (SkyFibre) automatically reward partners more

### Calculation Method:
```
Monthly Gross Margin = Revenue - Total Cost
Partner Commission = Gross Margin × 20%
Total Commission (24 months) = Monthly Commission × 24
```

### Examples:

#### BizFibre Plus (50/50 Mbps) - 24 months
```
Monthly Revenue: R2,499
Monthly Margin: R934 (37.4%)
Monthly Partner Commission: R934 × 20% = R186.80
Total Commission (24mo): R186.80 × 24 = R4,483.20
```

#### SkyFibre Business 100 - 24 months
```
Monthly Revenue: R2,999
Monthly Margin: R1,567 (52.3%)
Monthly Partner Commission: R1,567 × 20% = R313.40
Total Commission (24mo): R313.40 × 24 = R7,521.60
```

---

## Comparison: MTN vs Margin-Share Models

### R2,000/month Package Comparison:

| Model | Product Type | Commission Rate | Total (24mo) | % of Revenue |
|-------|--------------|----------------|--------------|--------------|
| **MTN Arlan** | MTN Deal R2,000/mo | 4.125% effective | **R1,980** | 4.1% |
| **Margin-Share** | SkyFibre Biz 100 ~R3,000/mo | 20% of R1,567 margin | **R7,522** | 10.4% |

### Key Insights:

1. **Margin-share rewards higher-margin products**
   - SkyFibre Business has 43-59% margins
   - BizFibre has 31-40% margins
   - Partners earn MORE on high-margin products

2. **MTN Arlan rewards high-value deals**
   - Commission increases with package price
   - Enterprise packages (R2,000+) get 4.125% rate
   - Encourages upselling to premium tiers

3. **Both models are viable**
   - MTN: Simple, predictable, tier-based
   - Margin: Fair distribution, rewards efficiency
   - Can coexist in same partner portal

---

## Recommended Implementation Strategy

### 1. Database Schema Enhancement

Add product-based commission configuration:

```sql
CREATE TABLE product_commission_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Product Identification
  product_line TEXT NOT NULL, -- 'mtn_deals', 'bizfibre', 'skyfibre', 'homefibre'
  product_sku TEXT, -- Optional specific SKU

  -- Commission Model
  commission_model TEXT NOT NULL CHECK (
    commission_model IN ('tiered_revenue', 'margin_share', 'flat_rate', 'hybrid')
  ),

  -- For margin_share model
  margin_share_rate DECIMAL(5, 2), -- e.g., 20.00 for 20%

  -- For flat_rate model
  flat_commission_rate DECIMAL(5, 2), -- e.g., 5.00 for 5%

  -- For hybrid model
  base_rate DECIMAL(5, 2),
  margin_bonus_rate DECIMAL(5, 2),

  -- Metadata
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Commission Calculation Functions

#### For Tiered Revenue (MTN Arlan):
```sql
-- Already implemented in migration 20251104000002
SELECT * FROM calculate_tiered_commission(500, 24);
```

#### For Margin-Share (BizFibre/SkyFibre):
```sql
CREATE FUNCTION calculate_margin_commission(
  p_monthly_revenue DECIMAL,
  p_monthly_cost DECIMAL,
  p_contract_term INTEGER,
  p_margin_share_rate DECIMAL DEFAULT 20.00
) RETURNS TABLE (...) AS $$
DECLARE
  v_monthly_margin DECIMAL;
  v_monthly_commission DECIMAL;
  v_total_commission DECIMAL;
BEGIN
  -- Calculate monthly margin
  v_monthly_margin := p_monthly_revenue - p_monthly_cost;

  -- Calculate monthly commission
  v_monthly_commission := v_monthly_margin * (p_margin_share_rate / 100);

  -- Calculate total over contract term
  v_total_commission := v_monthly_commission * p_contract_term;

  RETURN QUERY
  SELECT
    v_monthly_margin AS monthly_margin,
    (v_monthly_margin / p_monthly_revenue * 100) AS margin_percentage,
    v_monthly_commission AS monthly_commission,
    v_total_commission AS total_commission,
    v_total_commission * 1.15 AS total_commission_incl_vat;
END;
$$ LANGUAGE plpgsql;
```

### 3. Partner Portal Display

Show commission clearly by product type:

**MTN Deals:**
```
Package: MTN Business 5G R2,500/mo
Contract: 24 months
Tier: 7 (Enterprise) - 4.125% effective
Your Commission: R2,475 (excl VAT)
```

**BizFibre:**
```
Package: BizFibre Plus 50/50 Mbps
Price: R2,499/mo | Margin: R934/mo (37.4%)
Commission Rate: 20% of margin
Your Commission: R4,483.20 over 24 months
Monthly: R186.80
```

### 4. Commission Transaction Types

Update `partner_commission_transactions.transaction_type`:

```sql
ALTER TABLE partner_commission_transactions
  DROP CONSTRAINT IF EXISTS partner_commission_transactions_transaction_type_check;

ALTER TABLE partner_commission_transactions
  ADD CONSTRAINT partner_commission_transactions_transaction_type_check
  CHECK (transaction_type IN (
    'lead_conversion',
    'monthly_recurring',
    'installation_fee',
    'upgrade',
    'adjustment',
    'payout',
    'margin_share',  -- NEW: For BizFibre/SkyFibre
    'tiered_revenue' -- NEW: For MTN Deals
  ));
```

---

## Commission Rate Recommendations by Product

| Product Line | Commission Model | Rate | Partner Earnings (24mo) |
|-------------|------------------|------|------------------------|
| **MTN Deals** | Tiered Revenue | 1.4-4.1% of contract value | R351-R2,475 |
| **BizFibre Connect** | Margin Share | 20% of margin | R2,688-R6,613 |
| **SkyFibre Business** | Margin Share | 20% of margin | R4,162-R21,629 |
| **HomeFibre Connect** | Margin Share | 20% of margin | R1,500-R3,000 (est) |
| **Managed Services** | Flat Rate | 10% of MRR | Varies by service |

---

## Partner Tier Benefits (Unchanged)

Partners can still have Bronze/Silver/Gold/Platinum tiers with:
- **Base commission rate** (as above)
- **Performance bonuses** (e.g., +5% for Gold partners)
- **Volume bonuses** (e.g., +10% over 50 deals/month)

---

## Next Steps

1. ✅ **Already Complete:** MTN Arlan tiered model
2. **TODO:** Add margin-share calculation function
3. **TODO:** Seed product commission config for BizFibre/SkyFibre
4. **TODO:** Update commission transactions to track model type
5. **TODO:** Enhance partner portal to show both models
6. **TODO:** Create product-specific commission calculator pages

---

## Summary

**Key Principle:** Different products = Different commission models

- **MTN**: Encourages selling high-value packages (tiered revenue)
- **BizFibre/SkyFibre**: Rewards efficient, high-margin sales (margin-share)
- **Both are fair** and incentivize the right behaviors for each product line

**Implementation:** Flexible commission system that automatically applies the correct model based on product line.

---

**Questions or Adjustments:**
1. Should margin-share rate be 20%, 25%, or 30%?
2. Should partner tiers get multipliers on margin-share too?
3. Should we implement monthly recurring or upfront commissions for margin-share?

