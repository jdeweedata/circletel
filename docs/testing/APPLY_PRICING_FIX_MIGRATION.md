# How to Apply Pricing Fix Migration

**Migration File**: `supabase/migrations/20250120000001_fix_skyfibre_pricing.sql`
**Status**: ✅ Ready to Apply
**Time Required**: 5 minutes

---

## 🎯 What This Migration Does

1. **Deactivates 4 mock products** with incorrect pricing (R299-R999)
2. **Updates 3 SME products** to correct promotional pricing (R1,299, R1,899, R2,899)
3. **Adds 1 missing product** - SkyFibre SME Enterprise (R4,999)
4. **Includes verification** - Built-in checks to ensure migration succeeded

**Result**: Coverage checker will show correct SkyFibre pricing (R799-R4,999)

---

## 📋 Step-by-Step Instructions

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Navigate to your CircleTel project: **agyjovdugmtopasyvlng**
3. Click **"SQL Editor"** in the left sidebar

### Step 2: Copy Migration SQL

1. Open the migration file:
   ```
   C:\Projects\circletel-nextjs\supabase\migrations\20250120000001_fix_skyfibre_pricing.sql
   ```

2. **Select ALL content** (Ctrl+A)
3. **Copy** (Ctrl+C)

### Step 3: Run Migration

1. In Supabase SQL Editor, click **"New query"**
2. **Paste** the migration SQL (Ctrl+V)
3. Click **"Run"** button (or press F5)

### Step 4: Verify Success

Look for these messages in the output:

```
✅ NOTICE: Step 1 Complete: Deactivated 4 mock products
✅ NOTICE: Step 2 Complete: Updated SME pricing (R1299, R1899, R2899)
✅ NOTICE: Step 3 Complete: Added SkyFibre SME Enterprise (R4999)

========================================
MIGRATION COMPLETE
========================================
Active SkyFibre products: 7
Inactive SkyFibre products: 4
========================================
```

**Plus a table showing**:
- ✅ 7 active products (Starter R799, Plus R899, Pro R1099, SME Essential R1299, SME Pro R1899, SME Premium R2899, SME Enterprise R4999)
- ✅ 4 inactive products (Essential 50Mbps, Standard 100Mbps, Premium 200Mbps, Business 200Mbps)

---

## ✅ Post-Migration Verification

### Verification 1: Check Database

Run this in SQL Editor to confirm active products:

```sql
SELECT name, price, speed_down, speed_up, active
FROM service_packages
WHERE service_type = 'SkyFibre' AND active = true
ORDER BY price;
```

**Expected Results** (7 rows):
| name | price | speed_down | speed_up | active |
|------|-------|------------|----------|--------|
| SkyFibre Starter | 799 | 50 | 50 | true |
| SkyFibre Plus | 899 | 100 | 100 | true |
| SkyFibre Pro | 1099 | 200 | 200 | true |
| SkyFibre SME Essential | 1299 | 50 | 50 | true |
| SkyFibre SME Professional | 1899 | 100 | 100 | true |
| SkyFibre SME Premium | 2899 | 200 | 200 | true |
| SkyFibre SME Enterprise | 4999 | 200 | 200 | true |

---

### Verification 2: Test Coverage API (Local)

Run this command to verify the database changes:

```bash
powershell -File .claude/skills/supabase-fetch/run-supabase.ps1 -Operation service-packages
```

**Expected Output**: Should show 7 active SkyFibre products with correct pricing

---

### Verification 3: Test Staging Deployment

1. **Create test coverage check**:
   ```bash
   curl -X POST https://circletel-staging.vercel.app/api/coverage/lead \
     -H "Content-Type: application/json" \
     -d '{"address":"1 Sandton Drive, Sandton","coordinates":{"lat":-26.10893,"lng":28.05659}}'
   ```

2. **Copy the `leadId` from response**

3. **Get packages**:
   ```bash
   curl "https://circletel-staging.vercel.app/api/coverage/packages?leadId=YOUR_LEAD_ID_HERE"
   ```

4. **Verify response** shows correct pricing:
   - SkyFibre Starter: **R799**
   - SkyFibre Plus: **R899**
   - SkyFibre Pro: **R1,099**
   - SME products: **R1,299 - R4,999**

---

### Verification 4: Browser Test (Optional)

1. Open https://circletel-staging.vercel.app/
2. Enter address: "1 Sandton Drive, Sandton"
3. Click "Check coverage"
4. **Verify packages page shows correct pricing**:
   - ✅ SkyFibre Starter - **R799/month**
   - ✅ SkyFibre Plus - **R899/month**
   - ✅ SkyFibre Pro - **R1,099/month**
   - ✅ SME products visible (if applicable)

---

## 🚨 Troubleshooting

### Issue: Migration fails with error

**Error**: "duplicate key value violates unique constraint"
**Solution**: SkyFibre SME Enterprise already exists. This is okay - the migration is idempotent. Re-run and it will skip this step.

---

### Issue: Active products count is not 7

**Check**: Run this query to see what's active:
```sql
SELECT name, active FROM service_packages WHERE service_type = 'SkyFibre';
```

**Fix**: Manually verify which products should be active/inactive per the documentation.

---

### Issue: Prices don't match expected values

**Check**: Run this query:
```sql
SELECT name, price FROM service_packages WHERE name LIKE 'SkyFibre SME%';
```

**Expected**:
- SME Essential: 1299
- SME Professional: 1899
- SME Premium: 2899
- SME Enterprise: 4999

**Fix**: Re-run Step 2 of the migration manually.

---

## 📊 Success Criteria

After migration, you should have:

- ✅ **7 active SkyFibre products** with correct pricing
- ✅ **4 inactive mock products** (preserved for reference)
- ✅ **Coverage checker shows R799-R4,999** (not R299-R999)
- ✅ **API returns correct products** when checking coverage
- ✅ **No errors in Supabase logs**

---

## 🔄 Rollback (If Needed)

If something goes wrong, you can rollback by running this in SQL Editor:

```sql
-- Reactivate mock products
UPDATE service_packages
SET active = true
WHERE name IN (
  'SkyFibre Essential 50Mbps',
  'SkyFibre Standard 100Mbps',
  'SkyFibre Premium 200Mbps',
  'SkyFibre Business 200Mbps'
);

-- Revert SME pricing
UPDATE service_packages SET price = 999 WHERE name = 'SkyFibre SME Essential';
UPDATE service_packages SET price = 1499 WHERE name = 'SkyFibre SME Professional';
UPDATE service_packages SET price = 2299 WHERE name = 'SkyFibre SME Premium';

-- Remove SME Enterprise
DELETE FROM service_packages WHERE name = 'SkyFibre SME Enterprise';
```

---

## 📁 Related Documentation

- **Migration File**: `supabase/migrations/20250120000001_fix_skyfibre_pricing.sql`
- **Implementation Plan**: `docs/testing/PRICING_FIX_IMPLEMENTATION_2025-01-20.md`
- **Pricing Analysis**: `docs/testing/SKYFIBRE_PRICING_ANALYSIS_2025-01-20.md`
- **Excel Sources**:
  - Residential: `docs/products/01_ACTIVE_PRODUCTS/SkyFibre/Residential/SkyFibre Residential Products - September 2025.xlsx`
  - SME: `docs/products/01_ACTIVE_PRODUCTS/SkyFibre/SME/SkyFibre SME Products - Budget Pricing - September 2025.xlsx`

---

## ⏭️ Next Steps After Migration

1. ✅ **Verify** - Run all verification queries above
2. ✅ **Test** - Check coverage checker on staging
3. ✅ **Deploy** - Push changes to production
4. ✅ **Monitor** - Watch for any issues in the first 24 hours
5. ✅ **Document** - Take screenshot of correct pricing for records

---

**Created**: 2025-01-20
**Status**: Ready to apply
**Estimated Time**: 5 minutes
**Risk Level**: LOW (idempotent migration with built-in verification)

---

## 🎯 Quick Reference

**To apply migration**:
1. Open Supabase Dashboard → SQL Editor
2. Copy `supabase/migrations/20250120000001_fix_skyfibre_pricing.sql`
3. Paste and Run
4. Verify output shows "MIGRATION COMPLETE" with 7 active products

**To verify**:
```bash
powershell -File .claude/skills/supabase-fetch/run-supabase.ps1 -Operation service-packages
```

**Expected result**: 7 active SkyFibre products (R799, R899, R1099, R1299, R1899, R2899, R4999)
