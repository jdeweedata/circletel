# Pricing Fix Implementation - Final Solution

**Date**: 2025-01-20
**Priority**: ⚠️ HIGH - Customer-facing pricing error
**Status**: 🔧 READY TO IMPLEMENT

---

## 🎯 Executive Summary

Good news: The `service_packages` table ALREADY has the correct products! The issue is that the API query is returning the WRONG rows due to duplicate product names.

### The Problem

Looking at the `service_packages` table SkyFibre products:

| Row | Name | Price | Promo | Speed | Status |
|-----|------|-------|-------|-------|--------|
| **22** | SkyFibre Essential 50Mbps | R399 | R299 | 50/25 | ❌ WRONG - Mock data |
| **23** | SkyFibre Standard 100Mbps | R599 | R449 | 100/50 | ❌ WRONG - Mock data |
| **24** | SkyFibre Premium 200Mbps | R899 | R699 | 200/100 | ❌ WRONG - Mock data |
| **21** | SkyFibre Business 200Mbps | R1,199 | R999 | 200/200 | ❌ WRONG - Mock data |
| **25** | SkyFibre Starter | R799 | null | 50/50 | ✅ CORRECT - Residential |
| **26** | SkyFibre Plus | R899 | null | 100/100 | ✅ CORRECT - Residential |
| **27** | SkyFibre Pro | R1,099 | null | 200/200 | ✅ CORRECT - Residential |
| **28** | SkyFibre SME Essential | R999 | null | 50/50 | ⚠️ NEEDS UPDATE (should be R1,299) |
| **29** | SkyFibre SME Professional | R1,499 | null | 100/100 | ⚠️ NEEDS UPDATE (should be R1,899) |
| **30** | SkyFibre SME Premium | R2,299 | null | 200/200 | ⚠️ NEEDS UPDATE (should be R2,899) |

**Missing**: SkyFibre SME Enterprise (R4,999)

---

## 🔍 Root Cause Analysis

### API Query (Lines 163-168 in `app/api/coverage/packages/route.ts`)

```typescript
const { data: packages, error: packagesError } = await supabase
  .from('service_packages')
  .select('*')
  .in('product_category', productCategories)  // Matches 'connectivity'
  .eq('active', true)
  .order('price', { ascending: true });  // Orders by price
```

**Problem**:
- Query matches ALL active SkyFibre products where `product_category = 'connectivity'`
- Orders by `price` ascending
- Returns rows 22-24 FIRST (R299, R449, R699) instead of correct rows 25-27 (R799, R899, R1,099)

---

## ✅ Solution: Three-Step Fix

### Step 1: Deactivate Mock Data (5 minutes)

Deactivate the incorrect mock products in `service_packages`:

```sql
-- Deactivate mock SkyFibre products (rows 21-24)
UPDATE service_packages
SET active = false
WHERE name IN (
  'SkyFibre Essential 50Mbps',
  'SkyFibre Standard 100Mbps',
  'SkyFibre Premium 200Mbps',
  'SkyFibre Business 200Mbps'
);

-- Verify deactivation
SELECT id, name, price, promotion_price, active
FROM service_packages
WHERE service_type = 'SkyFibre'
ORDER BY price;
```

**Expected result**: Only rows 25-30 remain active (Starter, Plus, Pro, SME Essential, SME Professional, SME Premium)

---

### Step 2: Update SME Pricing to Match Excel Sources (10 minutes)

Update SME products to match the promotional pricing from the Excel workbook:

```sql
-- Update SkyFibre SME Essential (should be R1,299 promo)
UPDATE service_packages
SET price = 1299
WHERE name = 'SkyFibre SME Essential';

-- Update SkyFibre SME Professional (should be R1,899 promo)
UPDATE service_packages
SET price = 1899
WHERE name = 'SkyFibre SME Professional';

-- Update SkyFibre SME Premium (should be R2,899 promo)
UPDATE service_packages
SET price = 2899
WHERE name = 'SkyFibre SME Premium';

-- Verify updates
SELECT name, price, speed_down, speed_up
FROM service_packages
WHERE name LIKE 'SkyFibre SME%'
ORDER BY price;
```

---

### Step 3: Add Missing SME Enterprise Product (15 minutes)

Add the missing SkyFibre SME Enterprise product:

```sql
-- Add SkyFibre SME Enterprise
INSERT INTO service_packages (
  name,
  service_type,
  product_category,
  speed_down,
  speed_up,
  price,
  promotion_price,
  promotion_months,
  description,
  features,
  active
) VALUES (
  'SkyFibre SME Enterprise',
  'SkyFibre',
  'connectivity',
  200,
  200,
  4999,
  null,
  null,
  'Enterprise-grade connectivity with dedicated support. Maximum reliability for mission-critical operations.',
  '["200Mbps symmetrical", "Static IP included", "Unlimited business emails", "Unlimited cloud backup", "Enterprise router", "VPN service (25 users)", "24/7 priority support", "99.8% uptime SLA", "Dedicated account manager"]'::jsonb,
  true
);

-- Verify insertion
SELECT name, price, speed_down, speed_up
FROM service_packages
WHERE name = 'SkyFibre SME Enterprise';
```

---

## 🧪 Testing Plan

### Test 1: Verify Database Changes

```bash
# Query all active SkyFibre products
powershell -File .claude/skills/supabase-fetch/run-supabase.ps1 -Operation service-packages
```

**Expected Results**:
- ✅ 7 active SkyFibre products total
- ✅ Residential: Starter (R799), Plus (R899), Pro (R1,099)
- ✅ SME: Essential (R1,299), Professional (R1,899), Premium (R2,899), Enterprise (R4,999)
- ❌ NO products named "Essential 50Mbps", "Standard 100Mbps", "Premium 200Mbps", "Business 200Mbps"

---

### Test 2: Test Coverage Checker API

```bash
# Create test coverage lead
curl -X POST https://circletel-staging.vercel.app/api/coverage/lead \
  -H "Content-Type: application/json" \
  -d '{"address":"1 Sandton Drive, Sandton","coordinates":{"lat":-26.10893,"lng":28.05659}}'

# Get packages for the lead (replace {leadId} with actual ID)
curl https://circletel-staging.vercel.app/api/coverage/packages?leadId={leadId}
```

**Expected Response**:
```json
{
  "available": true,
  "packages": [
    {"name": "SkyFibre Starter", "price": 799},
    {"name": "SkyFibre Plus", "price": 899},
    {"name": "SkyFibre Pro", "price": 1099},
    {"name": "SkyFibre SME Essential", "price": 1299},
    {"name": "SkyFibre SME Professional", "price": 1899},
    {"name": "SkyFibre SME Premium", "price": 2899},
    {"name": "SkyFibre SME Enterprise", "price": 4999}
  ]
}
```

---

### Test 3: E2E Browser Test

```bash
# Run Playwright test
```

1. Navigate to https://circletel-staging.vercel.app/
2. Enter address: "1 Sandton Drive, Sandton"
3. Click "Check coverage"
4. Verify packages page displays:
   - ✅ SkyFibre Starter - **R799/month**
   - ✅ SkyFibre Plus - **R899/month**
   - ✅ SkyFibre Pro - **R1,099/month**
   - ✅ SME products visible (if showing both consumer + business)
5. Take screenshot for documentation

---

## 📋 Complete Implementation Checklist

- [ ] **Step 1**: Deactivate mock products (rows 21-24)
- [ ] **Step 2**: Update SME pricing (rows 28-30 → R1,299, R1,899, R2,899)
- [ ] **Step 3**: Add SME Enterprise product (R4,999)
- [ ] **Test 1**: Verify database with `supabase-fetch` skill
- [ ] **Test 2**: Test API endpoint with curl
- [ ] **Test 3**: E2E browser test with Playwright
- [ ] **Documentation**: Update screenshots in docs
- [ ] **Deployment**: Push to staging, verify, push to production

---

## 🚀 Implementation Commands

### Quick Copy-Paste SQL (All Steps)

```sql
-- ============================================================================
-- STEP 1: Deactivate Mock Data
-- ============================================================================
UPDATE service_packages
SET active = false
WHERE name IN (
  'SkyFibre Essential 50Mbps',
  'SkyFibre Standard 100Mbps',
  'SkyFibre Premium 200Mbps',
  'SkyFibre Business 200Mbps'
);

-- ============================================================================
-- STEP 2: Update SME Pricing
-- ============================================================================
UPDATE service_packages SET price = 1299 WHERE name = 'SkyFibre SME Essential';
UPDATE service_packages SET price = 1899 WHERE name = 'SkyFibre SME Professional';
UPDATE service_packages SET price = 2899 WHERE name = 'SkyFibre SME Premium';

-- ============================================================================
-- STEP 3: Add SME Enterprise
-- ============================================================================
INSERT INTO service_packages (
  name, service_type, product_category,
  speed_down, speed_up, price,
  description, features, active
) VALUES (
  'SkyFibre SME Enterprise',
  'SkyFibre',
  'connectivity',
  200, 200, 4999,
  'Enterprise-grade connectivity with dedicated support. Maximum reliability for mission-critical operations.',
  '["200Mbps symmetrical", "Static IP included", "Unlimited business emails", "Unlimited cloud backup", "Enterprise router", "VPN service (25 users)", "24/7 priority support", "99.8% uptime SLA", "Dedicated account manager"]'::jsonb,
  true
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check active SkyFibre products
SELECT name, price, speed_down, speed_up, active
FROM service_packages
WHERE service_type = 'SkyFibre'
ORDER BY price;

-- Expected: 7 active products (Starter R799, Plus R899, Pro R1099, SME Essential R1299, SME Pro R1899, SME Premium R2899, SME Enterprise R4999)
-- Expected: 4 inactive products (mock data - Essential 50Mbps, Standard 100Mbps, etc.)

-- Count check
SELECT
  active,
  COUNT(*) as count
FROM service_packages
WHERE service_type = 'SkyFibre'
GROUP BY active;

-- Expected: active = true (7 rows), active = false (4 rows)
```

---

## 🎯 Why This Solution Works

### Advantages

1. **✅ No Code Changes Required**: API query stays the same, we just fix the data
2. **✅ Minimal Risk**: Only updating existing data, no schema changes
3. **✅ Preserves Mock Data**: Inactive rows kept for reference/rollback
4. **✅ Fast Implementation**: 30 minutes total (SQL + testing)
5. **✅ Immediate Effect**: Changes visible on next deployment/cache clear

### Future Considerations

**Option for Later**: Migrate to `products` table for single source of truth
- Move all package data to `products` table
- Update API to query `products` instead of `service_packages`
- Deprecate `service_packages` table
- Benefits: Consistent with admin backend, easier product management

**For Now**: Keep `service_packages` as the package catalog since:
- API already queries it
- Structure supports promotions (`promotion_price`, `promotion_months`)
- No code changes needed

---

## 📊 Expected Results

### Before Fix (Current State)
**Coverage Results Page**: Shows R299, R449, R699, R999 (30-55% lower than reality)

### After Fix (Target State)
**Coverage Results Page**: Shows R799, R899, R1,099 (Residential) + R1,299-R4,999 (SME optional)

**Impact**:
- ✅ Accurate customer-facing pricing
- ✅ Matches Excel source documents
- ✅ Prevents false expectations
- ✅ Builds customer trust

---

## 📁 Related Documentation

- **Pricing Analysis**: `docs/testing/SKYFIBRE_PRICING_ANALYSIS_2025-01-20.md`
- **Pricing Mismatch Issue**: `docs/testing/PRICING_MISMATCH_ISSUE_2025-01-20.md`
- **Consumer Journey Success**: `docs/testing/CONSUMER_JOURNEY_SUCCESS_2025-01-20.md`
- **Excel Sources**:
  - Residential: `docs/products/01_ACTIVE_PRODUCTS/SkyFibre/Residential/SkyFibre Residential Products - September 2025.xlsx`
  - SME: `docs/products/01_ACTIVE_PRODUCTS/SkyFibre/SME/SkyFibre SME Products - Budget Pricing - September 2025.xlsx`

---

**Created**: 2025-01-20
**Priority**: HIGH - Critical pricing error
**Estimated Time**: 30 minutes (SQL + testing)
**Next Step**: Execute SQL commands in Supabase Dashboard SQL Editor ✅
