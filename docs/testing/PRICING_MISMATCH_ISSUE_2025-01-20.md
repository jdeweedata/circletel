# Pricing Mismatch Issue - Service Packages vs Products

**Date**: 2025-01-20
**Severity**: ⚠️ **HIGH** - Customer-facing pricing incorrect
**Status**: 🔍 IDENTIFIED - Awaiting Decision

---

## 🚨 Executive Summary

The coverage checker is displaying **incorrect pricing** for SkyFibre products. The packages page shows mock/placeholder data from the `service_packages` table instead of the real product data from the `products` table.

### Visual Evidence

**What Customers See** (from coverage results page):
- SkyFibre Essential 50Mbps - **R299/month** (was R399 for 3 months)
- SkyFibre Standard 100Mbps - **R449/month** (was R599 for 3 months)
- SkyFibre Premium 200Mbps - **R699/month** (was R899 for 3 months)
- SkyFibre Business 200Mbps - **R999/month** (was R1199 for 3 months)

**What's Actually in the Database** (`products` table):
- SkyFibre SME 50 - **R749/month**
- SkyFibre SME 100 - **R999/month**
- SkyFibre SME 200 - **R1249/month**
- SkyFibre Essential - **R1399/month**

---

## 🔍 Root Cause Analysis

### Two Separate Product Tables

CircleTel has **TWO product tables** with different data:

#### 1. `products` Table (Real Products - Admin Backend)
- **Purpose**: Main product catalog managed via admin
- **Data Source**: Excel imports, admin UI
- **Used By**: Admin dashboard, product management
- **Status**: Contains real pricing and product details
- **SkyFibre Products**:
  ```
  SkyFibre SME 50     R749
  SkyFibre SME 100    R999
  SkyFibre SME 200    R1249
  SkyFibre Essential  R1399
  ```

#### 2. `service_packages` Table (Mock Data - Frontend)
- **Purpose**: Coverage check package recommendations
- **Data Source**: Migration scripts with placeholder data
- **Used By**: Coverage results page (`/packages/[leadId]`)
- **Status**: Contains outdated mock data
- **SkyFibre Products**:
  ```
  SkyFibre Essential 50Mbps   R299 (promo from R399)
  SkyFibre Standard 100Mbps   R449 (promo from R599)
  SkyFibre Premium 200Mbps    R699 (promo from R899)
  SkyFibre Business 200Mbps   R999 (promo from R1199)
  ```

### Where the Issue Manifests

**API Route**: `app/api/coverage/packages/route.ts` (Line 163-168)
```typescript
// Get available packages for the mapped product categories
const { data: packages, error: packagesError } = await supabase
  .from('service_packages')  // ❌ Querying wrong table!
  .select('*')
  .in('product_category', productCategories)
  .eq('active', true)
  .order('price', { ascending: true });
```

**Should be**:
```typescript
const { data: packages, error: packagesError } = await supabase
  .from('products')  // ✅ Query real products table
  .select('*')
  .in('service', productCategories)  // Map to 'service' column
  .eq('is_active', true)
  .order('price_monthly', { ascending: true });
```

---

## 📊 Data Comparison

### SkyFibre Products

| Product Name (Frontend) | Price (Frontend) | Product Name (Database) | Price (Database) | Difference |
|------------------------|------------------|-------------------------|------------------|------------|
| SkyFibre Essential 50Mbps | R299 | SkyFibre SME 50 | R749 | **-R450** ❌ |
| SkyFibre Standard 100Mbps | R449 | SkyFibre SME 100 | R999 | **-R550** ❌ |
| SkyFibre Premium 200Mbps | R699 | SkyFibre SME 200 | R1249 | **-R550** ❌ |
| SkyFibre Business 200Mbps | R999 | SkyFibre Essential | R1399 | **-R400** ❌ |

**Impact**: Customers see prices that are **30-55% lower** than actual prices!

---

## 🎯 Recommended Solutions

### Option 1: Use `products` Table (Recommended ⭐)

**Pros**:
- ✅ Single source of truth
- ✅ Managed via admin UI
- ✅ Consistent with backend
- ✅ Supports product imports

**Cons**:
- ⚠️ Need to update API route
- ⚠️ Need to map column names (price vs price_monthly)
- ⚠️ May need to add coverage-related fields

**Implementation**:
1. Update `app/api/coverage/packages/route.ts` to query `products` table
2. Map field names appropriately
3. Test coverage checker flow
4. Remove or deprecate `service_packages` table

---

### Option 2: Sync `service_packages` from `products`

**Pros**:
- ✅ Minimal code changes
- ✅ Keeps current architecture

**Cons**:
- ❌ Maintains two sources of truth
- ❌ Manual sync required
- ❌ Risk of drift

**Implementation**:
1. Create migration to populate `service_packages` from `products`
2. Create trigger to keep tables in sync
3. Update any conflicting column structures

---

### Option 3: Merge Tables

**Pros**:
- ✅ Permanent solution
- ✅ Single source of truth
- ✅ Clean architecture

**Cons**:
- ⚠️ Requires data migration
- ⚠️ May break existing queries
- ⚠️ Needs thorough testing

**Implementation**:
1. Add coverage-related columns to `products` table
2. Migrate data from `service_packages` to `products`
3. Update all queries to use `products`
4. Drop `service_packages` table

---

## 🔧 Quick Fix (Temporary)

For immediate resolution, update the `service_packages` table manually:

```sql
-- Update SkyFibre products to match real pricing
UPDATE service_packages
SET
  name = 'SkyFibre SME 50',
  price = 749,
  promotion_price = NULL,
  promotion_months = NULL
WHERE name = 'SkyFibre Essential 50Mbps';

UPDATE service_packages
SET
  name = 'SkyFibre SME 100',
  price = 999,
  promotion_price = NULL,
  promotion_months = NULL
WHERE name = 'SkyFibre Standard 100Mbps';

UPDATE service_packages
SET
  name = 'SkyFibre SME 200',
  price = 1249,
  promotion_price = NULL,
  promotion_months = NULL
WHERE name = 'SkyFibre Premium 200Mbps';

UPDATE service_packages
SET
  name = 'SkyFibre Essential',
  price = 1399,
  promotion_price = NULL,
  promotion_months = NULL
WHERE name = 'SkyFibre Business 200Mbps';
```

---

## 📝 Field Mapping Reference

### `service_packages` → `products` Mapping

| service_packages | products | Notes |
|------------------|----------|-------|
| `id` | `id` | UUID, same |
| `name` | `name` | Product name |
| `service_type` | `service` | e.g., "SkyFibre" |
| `product_category` | `category` | e.g., "connectivity" |
| `speed_down` | `speed_download` | Mbps download |
| `speed_up` | `speed_upload` | Mbps upload |
| `price` | `price_monthly` | Monthly price |
| `promotion_price` | N/A | Not in products table |
| `promotion_months` | N/A | Not in products table |
| `description` | `description` | Product description |
| `features` | `features` | JSONB array |
| `active` | `is_active` | Boolean |

---

## 🚀 Implementation Plan (Recommended)

### Phase 1: Immediate Fix (Option 1 - Use Products Table)

**Timeline**: 1-2 hours

1. **Update API Route** (`app/api/coverage/packages/route.ts`):
   ```typescript
   // Change query from service_packages to products
   const { data: packages, error: packagesError } = await supabase
     .from('products')
     .select('*')
     .in('service', productCategories)  // Map to service column
     .eq('is_active', true)
     .order('price_monthly', { ascending: true});
   ```

2. **Update Response Mapping**:
   ```typescript
   availablePackages = packages.map((pkg: any) => ({
     id: pkg.id,
     name: pkg.name,
     service_type: pkg.service,  // Changed from pkg.service_type
     product_category: pkg.category,  // Changed from pkg.product_category
     speed_down: pkg.speed_download,  // Changed from pkg.speed_down
     speed_up: pkg.speed_upload,  // Changed from pkg.speed_up
     price: pkg.price_monthly,  // Changed from pkg.price
     promotion_price: null,  // Products table doesn't have this
     promotion_months: null,  // Products table doesn't have this
     description: pkg.description,
     features: pkg.features || []
   }));
   ```

3. **Test Coverage Checker**:
   - Enter test address
   - Verify correct pricing appears
   - Check all package details

### Phase 2: Clean Up (Optional)

**Timeline**: 30 minutes

1. **Deprecate service_packages Table**:
   - Add comment to migration
   - Document for future removal

2. **Update Documentation**:
   - Update API documentation
   - Note table deprecation

---

## ✅ Verification Checklist

After implementing the fix:

- [ ] Coverage checker shows correct SkyFibre pricing
- [ ] All product details match admin backend
- [ ] Product names consistent across system
- [ ] No broken package cards
- [ ] Promotion pricing removed (if using products table)
- [ ] Database query performance acceptable
- [ ] Frontend displays correctly

---

## 📸 Evidence

**Screenshot**: `Screenshot 2025-10-20 070522.png`
- Shows incorrect pricing on coverage results page
- 4 SkyFibre packages with mock prices

**Database Query**:
```bash
# service_packages
 table (mock data)
powershell -File .claude/skills/supabase-fetch/run-supabase.ps1 -Operation service-packages

# products table (real data)
powershell -File .claude/skills/supabase-fetch/run-supabase.ps1 -Operation products
```

---

## 🎯 Next Steps

### Immediate Action Required

**Decision Needed**: Which solution to implement?
1. **Option 1** (Recommended): Use `products` table
2. **Option 2**: Sync `service_packages` from `products`
3. **Option 3**: Merge tables

### Once Decided

1. Implement chosen solution
2. Test coverage checker thoroughly
3. Update documentation
4. Deploy to staging
5. Verify pricing correctness
6. Deploy to production

---

## 📚 Related Files

- **API Route**: `app/api/coverage/packages/route.ts` (needs update)
- **Frontend**: `app/packages/[leadId]/page.tsx` (no changes needed)
- **Products Table**: Managed via admin UI
- **Service Packages**: Migration `20251019000002_add_missing_service_mappings_and_products.sql`

---

## 🔗 References

- **Admin Products**: https://circletel-staging.vercel.app/admin/products
- **Coverage Checker**: https://circletel-staging.vercel.app/
- **Database Tables**: Check via Supabase dashboard or supabase-fetch skill

---

**Created**: 2025-01-20
**Priority**: HIGH - Customer-facing pricing error
**Status**: Awaiting decision on implementation approach
**Impact**: All SkyFibre products showing incorrect pricing (30-55% lower)

**Next Step**: Choose implementation option and proceed with fix ✅
