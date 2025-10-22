# Apply CircleTel Migrations - Quick Start
**Date**: 2025-10-21
**Status**: ✅ READY TO APPLY

---

## 🚀 2-Step Migration Process

### Step 1: Apply Infrastructure Migration
**File**: `supabase/migrations/20251021000011_cleanup_and_migrate_fixed.sql`

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql
2. Click **New Query**
3. Copy the entire contents of `20251021000011_cleanup_and_migrate_fixed.sql`
4. Paste into SQL Editor
5. Click **Run**
6. Wait for completion message

**Note**: This is the FIXED version that removes ON CONFLICT clauses.

**Expected Output**:
```
✓ Exactly 1 MTN provider has provider_code set
✓ Placeholder providers created successfully (4 providers)
Multi-Provider Architecture - COMPLETE
```

---

### Step 2: Apply Products Migration
**File**: `supabase/migrations/20251021000010_add_products_final.sql`

1. In the same SQL Editor, click **New Query**
2. Copy the entire contents of `20251021000010_add_products_final.sql`
3. Paste into SQL Editor
4. Click **Run**
5. Wait for completion message

**Expected Output**:
```
✓✓✓ All 15 products successfully added!
  - 4 HomeFibre (MTN)
  - 5 BizFibre (DFA)
  - 3 SkyFibre (MTN)
  - 3 MTN 5G (MTN)
```

---

## ✅ Verify Migration Success

After both migrations complete, run this verification query:

```sql
SELECT
  product_category,
  COUNT(*) as products,
  compatible_providers[1] as provider
FROM service_packages
WHERE compatible_providers IS NOT NULL
GROUP BY product_category, compatible_providers[1]
ORDER BY product_category;
```

**Expected Result**:
| product_category | products | provider |
|-----------------|----------|----------|
| BizFibreConnect | 5 | dfa |
| HomeFibreConnect | 4 | mtn |
| MTN 5G Business | 3 | mtn |
| SkyFibre | 3 | mtn |

**Total**: 15 products across 2 providers (MTN: 10, DFA: 5)

---

## 🎯 What This Migration Does

### Infrastructure (Migration 1)
- ✅ Adds `provider_code` column to `fttb_network_providers`
- ✅ Enables **MTN** and **DFA** providers
- ✅ Creates `provider_product_mappings` table
- ✅ Adds placeholders for MetroFibre, Openserve, Vumatel
- ✅ Creates views: `v_active_providers`, `v_products_with_providers`

### Products (Migration 2)
Adds 15 products based on official CircleTel documentation:

**MTN Products (10)**:
1. HomeFibre Starter - 20 Mbps @ R799
2. HomeFibre Plus - 50 Mbps @ R999
3. HomeFibre Max - 200 Mbps @ R1,499
4. HomeFibre Ultra - 500 Mbps @ R1,999
5. SkyFibre Starter - 50 Mbps @ R799
6. SkyFibre Plus - 100 Mbps @ R899
7. SkyFibre Pro - 200 Mbps @ R1,099
8. MTN Business 5G Essential - 35 Mbps, 500GB @ R449
9. MTN Business 5G Professional - 60 Mbps, 800GB @ R649
10. MTN Business 5G Enterprise - Best Effort, 1.5TB @ R949

**DFA Products (5)**:
1. BizFibre Connect Lite - 10 Mbps @ R1,699
2. BizFibre Connect Starter - 25 Mbps @ R1,899
3. BizFibre Connect Plus - 50 Mbps @ R2,499
4. BizFibre Connect Pro - 100 Mbps @ R2,999
5. BizFibre Connect Ultra - 200 Mbps @ R4,373

---

## 🔧 Troubleshooting

### If Migration 1 Fails
- Check for duplicate MTN providers
- Verify `provider_code` column doesn't already exist
- Try applying via Supabase Dashboard (not CLI)

### If Migration 2 Fails
- Ensure Migration 1 completed successfully
- Verify `compatible_providers` column exists on `service_packages`
- Check for existing products with same names

### If Product Count ≠ 15
Run this query to see what's missing:
```sql
SELECT name, product_category, compatible_providers
FROM service_packages
WHERE name IN (
  'HomeFibre Starter','HomeFibre Plus','HomeFibre Max','HomeFibre Ultra',
  'BizFibre Connect Lite','BizFibre Connect Starter','BizFibre Connect Plus','BizFibre Connect Pro','BizFibre Connect Ultra',
  'SkyFibre Starter','SkyFibre Plus','SkyFibre Pro',
  'MTN Business 5G Essential','MTN Business 5G Professional','MTN Business 5G Enterprise'
);
```

---

## 📚 Additional Documentation

- **Full Guide**: `APPLY_CORRECTED_MIGRATIONS.md`
- **Migration Status**: `MIGRATION_STATUS.md`
- **Verification Report**: `docs/MIGRATION_PRODUCT_VERIFICATION.md`

---

**Ready to apply?** Follow Step 1 and Step 2 above! 🚀
