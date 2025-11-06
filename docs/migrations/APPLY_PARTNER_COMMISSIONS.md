# Apply Partner Commission Migrations

## Quick Steps

The partner commission system requires 3 SQL migrations to be applied in order:

### 1. Open Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql/new

### 2. Apply Migrations (In Order)

Copy and paste each migration file into the SQL Editor and click "Run".

#### Migration 1: Create Commission Transactions Table
**File:** `supabase/migrations/20251104000001_create_partner_commissions.sql`

**Creates:**
- `partner_commission_transactions` table
- Triggers for updating partner totals
- Helper function: `create_lead_conversion_commission()`

**Run this first** ✅

---

#### Migration 2: Add Tiered Commission Structure (MTN Arlan Model)
**File:** `supabase/migrations/20251104000002_add_tiered_commission_structure.sql`

**Creates:**
- `commission_tier_config` table
- Seeds 7 commission tiers (Tier 1: R0-R99 to Tier 7: R2,000+)
- Function: `calculate_tiered_commission()`
- View: `v_partner_commission_tier_analysis`

**Run this second** ✅

---

#### Migration 3: Add Product Commission Models (BizFibre/SkyFibre)
**File:** `supabase/migrations/20251104000003_add_product_commission_models.sql`

**Creates:**
- `product_commission_config` table
- Seeds 10 products (5 BizFibre + 5 SkyFibre) with margin-share model
- Functions: `calculate_margin_commission()`, `calculate_product_commission()`
- View: `v_product_commission_comparison`

**Run this third** ✅

---

## Verification

After applying all 3 migrations, run this query to verify:

```sql
-- Check tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'partner_commission_transactions',
    'commission_tier_config',
    'product_commission_config'
  );

-- Check tiers were seeded (should return 7 rows)
SELECT tier_name, min_monthly_value, max_monthly_value, effective_rate
FROM commission_tier_config
ORDER BY tier_order;

-- Check products were seeded (should return 10 rows)
SELECT product_line, product_name, monthly_price, monthly_margin, commission_model
FROM product_commission_config
ORDER BY product_line, sort_order;

-- Test tiered commission calculation
SELECT calculate_tiered_commission(799.00, 24) as commission_for_r799_package;

-- Test margin commission calculation
SELECT calculate_margin_commission('bizfibre_plus_50', 24) as commission_for_bizfibre;
```

## Expected Results

### Tables Created (3):
- ✅ `partner_commission_transactions`
- ✅ `commission_tier_config`
- ✅ `product_commission_config`

### Functions Created (6):
- ✅ `create_lead_conversion_commission()`
- ✅ `calculate_tiered_commission()`
- ✅ `create_tiered_commission()`
- ✅ `calculate_margin_commission()`
- ✅ `calculate_product_commission()`
- ✅ `create_margin_commission()`

### Views Created (2):
- ✅ `v_partner_commission_tier_analysis`
- ✅ `v_product_commission_comparison`

### Data Seeded:
- ✅ 7 commission tiers (MTN Arlan model)
- ✅ 10 products (5 BizFibre + 5 SkyFibre with margin-share)

## Troubleshooting

### Error: "relation already exists"
This means the table/view already exists. Safe to ignore or drop and recreate.

### Error: "function already exists"
This means the function already exists. Safe to ignore or use `CREATE OR REPLACE FUNCTION`.

### Error: "duplicate key value"
This means the data was already seeded. Safe to ignore.

## Commission Models Summary

### Model 1: Tiered Revenue (MTN Arlan)
- **Product Lines:** MTN Business, MTN Consumer
- **Commission:** Based on monthly subscription value (7 tiers)
- **Example:** R799/month package = Tier 4 (2.6% effective) = R498.24 over 24 months

### Model 2: Margin-Share (BizFibre/SkyFibre)
- **Product Lines:** BizFibre Connect, SkyFibre Business
- **Commission:** 20% of gross margin
- **Example:** BizFibre Plus 50 (R934/mo margin) = R186.80/mo = R4,483.20 over 24 months

## Next Steps After Migrations

1. ✅ Visit `/partners/commissions/tiers` to see interactive calculator
2. ✅ Test commission calculations with sample orders
3. ✅ Verify partner portal displays commission data correctly
4. ✅ Set up commission payout schedules
5. ✅ Configure commission approval workflow

---

**Created:** 2025-11-06
**Status:** Ready to apply
**Dependencies:** Requires `partners` table to exist (from partner onboarding migrations)
