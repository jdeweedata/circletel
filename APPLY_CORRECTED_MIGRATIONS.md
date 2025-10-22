# Apply Corrected Migrations Guide
## CircleTel Multi-Provider Product Migration

**Date**: 2025-10-21
**Status**: ✅ Ready to Apply
**Total Products**: 15 (4 HomeFibre + 5 BizFibre + 3 SkyFibre + 3 MTN 5G)

---

## 🎯 What's Been Fixed

### ❌ OLD Migration (REJECTED)
File: `20251021000007_add_mtn_products.sql`

**Critical errors**:
- BizFibreConnect wrongly attributed to MTN (should be DFA)
- HomeFibreConnect wrong pricing and missing tiers
- Missing SkyFibre wireless products entirely
- Invented products not in official documentation

### ✅ NEW Migration (CORRECTED)
File: `20251021000008_add_correct_products.sql`

**Based on official documentation**:
- ✅ 4 HomeFibreConnect products (MTN Wholesale FTTH)
- ✅ 5 BizFibreConnect products (DFA Business Internet Access)
- ✅ 3 SkyFibre products (MTN Tarana Wireless)
- ✅ 3 MTN Business 5G products (MTN EBU deals)

---

## 📋 Migration Files to Apply

### Migration 1: Multi-Provider Architecture
**File**: `supabase/migrations/20251021000006_cleanup_and_migrate.sql`
**Changes**: DFA provider now ENABLED (was disabled placeholder)

**What it does**:
- Adds provider_code, service_offerings columns
- Creates provider_product_mappings table
- Sets up MTN and **DFA** (enabled) providers
- Creates views and indexes

### Migration 2: Corrected Products
**File**: `supabase/migrations/20251021000009_add_correct_products_fixed.sql`
**NEW**: Schema-compatible version, replaces incorrect 20251021000007 and 20251021000008 files

**Product breakdown**:

#### SECTION 1: HomeFibreConnect (MTN FTTH)
| Product | Speed | Price | Provider |
|---------|-------|-------|----------|
| HomeFibre Starter | 20/20 Mbps | R799 | MTN |
| HomeFibre Plus | 50/50 Mbps | R999 | MTN |
| HomeFibre Max | 200/200 Mbps | R1,499 | MTN |
| HomeFibre Ultra | 500/500 Mbps | R1,999 | MTN |

**Source**: `docs/products/01_ACTIVE_PRODUCTS/HomeFibreConnect/homefibre-connect-product-doc.md`

#### SECTION 2: BizFibreConnect (DFA BIA)
| Product | Speed | Price | Provider |
|---------|-------|-------|----------|
| BizFibre Connect Lite | 10/10 Mbps | R1,699 | **DFA** |
| BizFibre Connect Starter | 25/25 Mbps | R1,899 | **DFA** |
| BizFibre Connect Plus | 50/50 Mbps | R2,499 | **DFA** |
| BizFibre Connect Pro | 100/100 Mbps | R2,999 | **DFA** |
| BizFibre Connect Ultra | 200/200 Mbps | R4,373 | **DFA** |

**Source**: `docs/products/01_ACTIVE_PRODUCTS/BizFibreConnect/bizfibre-connect-product-doc-v2.md`
**Note**: These are DFA products, NOT MTN!

#### SECTION 3: SkyFibre (MTN Tarana Wireless)
| Product | Speed | Price | Provider |
|---------|-------|-------|----------|
| SkyFibre Starter | 50/50 Mbps | R799 | MTN |
| SkyFibre Plus | 100/100 Mbps | R899 | MTN |
| SkyFibre Pro | 200/200 Mbps | R1,099 | MTN |

**Source**: `docs/products/01_ACTIVE_PRODUCTS/SkyFibre/Residential/skyfibre-residential-product-doc-v7.md`

#### SECTION 4: MTN Business 5G (MTN EBU)
| Product | Speed | FUP | Price | Provider |
|---------|-------|-----|-------|----------|
| MTN Business 5G Essential | 35 Mbps | 500GB | R449 | MTN |
| MTN Business 5G Professional | 60 Mbps | 800GB | R649 | MTN |
| MTN Business 5G Enterprise | Best Effort | 1.5TB | R949 | MTN |

**Source**: `docs/products/01_ACTIVE_PRODUCTS/MTN 5G-LTE/mtn-5g-product-doc.md`
**Note**: Promotional deals, updated monthly by 25th

---

## 🚀 Application Steps

### Option 1: Supabase Dashboard (RECOMMENDED)

#### Step 1: Apply Infrastructure Migration

1. **Open SQL Editor**:
   ```
   https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql
   ```

2. **New Query** → Copy `supabase/migrations/20251021000006_cleanup_and_migrate.sql`

3. **Run** → Verify output:
   ```
   ✓ Exactly 1 MTN provider has provider_code set
   ✓ Placeholder providers created successfully (4 providers)

   Multi-Provider Architecture - COMPLETE

   Provider Summary:
     ✓ MTN providers with code: 1
     ✓ Placeholder providers: 4
     ✓ Total providers with codes: 5
   ```

#### Step 2: Apply Products Migration

1. **New Query** → Copy `supabase/migrations/20251021000009_add_correct_products_fixed.sql`

2. **Run** → Verify output:
   ```
   ✓ HomeFibreConnect (MTN FTTH): 4 products
   ✓ BizFibreConnect (DFA): 5 products
   ✓ SkyFibre (MTN Tarana): 3 products
   ✓ MTN Business 5G: 3 products

   Products by Provider:
     ✓ MTN products: 10
     ✓ DFA products: 5

   Total Products Added: 15

   ✓✓✓ All 15 products successfully added!
   ```

#### Step 3: Verify Database State

Run these verification queries:

```sql
-- 1. Check providers are set up correctly
SELECT provider_code, display_name, enabled, priority
FROM fttb_network_providers
WHERE provider_code IN ('mtn', 'dfa')
ORDER BY priority;

-- Expected:
-- mtn  | MTN                | true  | 1
-- dfa  | Dark Fibre Africa  | true  | 2

-- 2. Verify product counts
SELECT
  product_category,
  COUNT(*) as count,
  compatible_providers[1] as provider
FROM service_packages
WHERE compatible_providers IS NOT NULL
GROUP BY product_category, compatible_providers[1]
ORDER BY product_category;

-- Expected:
-- BizFibreConnect     | 5  | dfa
-- HomeFibreConnect    | 4  | mtn
-- MTN 5G Business     | 3  | mtn
-- SkyFibre            | 3  | mtn

-- 3. Check specific products exist
SELECT name, speed_down, price, compatible_providers
FROM service_packages
WHERE name IN (
  'HomeFibre Plus',
  'BizFibre Connect Pro',
  'SkyFibre Plus',
  'MTN Business 5G Professional'
);

-- Expected: 4 rows with correct pricing

-- 4. Test the fixed view
SELECT name, compatible_providers, provider_details
FROM v_products_with_providers
LIMIT 5;

-- Should work without errors now!
```

---

## ✅ Success Criteria

After both migrations:

### Database Objects Created
- ✅ `provider_code` column on `fttb_network_providers`
- ✅ `compatible_providers` column on `service_packages`
- ✅ `provider_product_mappings` table
- ✅ 2 providers enabled: MTN (priority 1), DFA (priority 2)
- ✅ 4 providers disabled: MetroFibre, Openserve, Vumatel

### Products Added
- ✅ 4 HomeFibreConnect (MTN) - R799 to R1,999
- ✅ 5 BizFibreConnect (DFA) - R1,699 to R4,373
- ✅ 3 SkyFibre (MTN) - R799 to R1,099
- ✅ 3 MTN Business 5G (MTN) - R449 to R949
- ✅ **Total**: 15 products

### Provider Attribution
- ✅ MTN products: 10 (HomeFibre 4 + SkyFibre 3 + 5G 3)
- ✅ DFA products: 5 (BizFibre all 5)
- ✅ No incorrect provider mappings

---

## 🧪 Testing Checklist

After migration, test these areas:

### 1. Coverage Checker
```bash
# Test coverage API with MTN address
curl -X POST http://localhost:3006/api/coverage/check \
  -H "Content-Type: application/json" \
  -d '{"address": "Sandton, Johannesburg", "type": "fibre"}'

# Should return HomeFibreConnect products
```

### 2. Admin Providers Page
Visit: `http://localhost:3006/admin/coverage/providers`

Verify:
- ✅ MTN shows `provider_code = 'mtn'`, enabled
- ✅ DFA shows `provider_code = 'dfa'`, enabled
- ✅ 4 placeholder providers disabled

### 3. Products Page
Visit: `http://localhost:3006/admin/products`

Verify:
- ✅ 15 total products visible
- ✅ HomeFibre products show MTN badge
- ✅ BizFibre products show DFA badge
- ✅ Pricing matches official docs

### 4. Product API
```bash
# Get all products
curl http://localhost:3006/api/products

# Filter by provider
curl http://localhost:3006/api/products?provider=mtn
curl http://localhost:3006/api/products?provider=dfa
```

---

## 📊 Product Comparison Table

### Before (Incorrect Migration)
| Category | Products | Provider | Status |
|----------|----------|----------|--------|
| HomeFibre | 4 (wrong tiers) | MTN | ❌ Wrong pricing |
| BizFibre | 3 (wrong tiers) | ❌ MTN | ❌ Wrong provider! |
| Wireless | 0 | - | ❌ Missing |
| 5G | 6 | MTN | ❓ Unverified |
| **Total** | **13** | **1 provider** | **REJECTED** |

### After (Corrected Migration)
| Category | Products | Provider | Status |
|----------|----------|----------|--------|
| HomeFibre | 4 (correct tiers) | MTN | ✅ Verified |
| BizFibre | 5 (correct tiers) | ✅ DFA | ✅ Verified |
| SkyFibre | 3 | MTN | ✅ Added |
| 5G Business | 3 | MTN | ✅ Verified |
| **Total** | **15** | **2 providers** | **READY** |

---

## 📚 Documentation References

### Product Documentation
- ✅ HomeFibreConnect: `docs/products/01_ACTIVE_PRODUCTS/HomeFibreConnect/homefibre-connect-product-doc.md`
- ✅ BizFibreConnect: `docs/products/01_ACTIVE_PRODUCTS/BizFibreConnect/bizfibre-connect-product-doc-v2.md`
- ✅ SkyFibre: `docs/products/01_ACTIVE_PRODUCTS/SkyFibre/Residential/skyfibre-residential-product-doc-v7.md`
- ✅ MTN 5G: `docs/products/01_ACTIVE_PRODUCTS/MTN 5G-LTE/mtn-5g-product-doc.md`

### Verification Report
- 📄 Full verification analysis: `docs/MIGRATION_PRODUCT_VERIFICATION.md`

### Migration Files
- ✅ Infrastructure: `supabase/migrations/20251021000006_cleanup_and_migrate.sql` (updated)
- ✅ Products: `supabase/migrations/20251021000009_add_correct_products_fixed.sql` (NEW - Schema Compatible)
- ❌ Old (rejected): `supabase/migrations/20251021000007_add_mtn_products.sql` (DO NOT USE)
- ❌ Old (schema error): `supabase/migrations/20251021000008_add_correct_products.sql` (DO NOT USE - missing columns)

---

## ⚠️ Important Notes

1. **DO NOT** apply `20251021000007_add_mtn_products.sql` - it contains critical errors
2. **DFA is now ENABLED** - BizFibreConnect products will work immediately
3. **Monthly updates required** - MTN 5G deals updated by 25th each month
4. **SkyFibre is wireless** - Uses MTN Tarana technology, not FTTH
5. **Provider codes are unique** - MTN and DFA are separate providers

---

## 🔄 Rollback Plan

If issues occur after migration:

```sql
-- Remove all products (keeps table structure)
DELETE FROM service_packages
WHERE 'mtn' = ANY(compatible_providers)
   OR 'dfa' = ANY(compatible_providers);

-- Reset providers
UPDATE fttb_network_providers SET enabled = false WHERE provider_code = 'dfa';

-- Check state
SELECT COUNT(*) FROM service_packages;
SELECT provider_code, enabled FROM fttb_network_providers WHERE provider_code IN ('mtn', 'dfa');
```

---

## 📞 Support

If you encounter issues:
1. Check Supabase Dashboard → Logs
2. Review error messages
3. Verify product documentation matches migration
4. Check provider codes are correct (mtn/dfa)

---

**Last Updated**: 2025-10-21
**Migration Version**: Phase 1A - Corrected
**Products**: 15 (MTN: 10, DFA: 5)
**Status**: ✅ Ready to Apply
