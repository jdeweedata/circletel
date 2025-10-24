# Multi-Provider Architecture Migration Instructions

## Overview

This guide will help you apply two critical database migrations to enable the multi-provider coverage architecture for CircleTel.

**Project ID**: `agyjovdugmtopasyvlng`
**Dashboard URL**: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng

---

## Prerequisites

- Access to Supabase Dashboard
- Admin/Owner permissions on the project

---

## Migration 1: Multi-Provider Architecture Setup

### File Location
`supabase/migrations/20251021000006_cleanup_and_migrate.sql`

### What It Does
1. ✅ Adds new columns to `fttb_network_providers` table:
   - `provider_code` (TEXT, UNIQUE) - Unique identifier like 'mtn', 'metrofibre'
   - `service_offerings` (JSONB) - Array of services: ["fibre", "wireless", "5g", "lte"]
   - `api_version` (TEXT) - API version for provider integration
   - `api_documentation_url` (TEXT) - Link to provider's API docs
   - `coverage_source` (TEXT) - How coverage is obtained: 'api', 'static_file', 'postgis', 'hybrid'

2. ✅ Cleans up duplicate provider codes (sets existing MTN providers to NULL, then assigns code to first one only)

3. ✅ Sets MTN as the primary integrated provider with full configuration

4. ✅ Enhances `service_packages` table:
   - `compatible_providers` (TEXT[]) - Array of provider codes that can deliver this product
   - `provider_specific_config` (JSONB) - Provider-specific settings
   - `provider_priority` (INTEGER) - Default provider priority for routing

5. ✅ Creates new `provider_product_mappings` table:
   - Maps provider service types to CircleTel products
   - Allows complex transformations between provider APIs and CircleTel catalog
   - Supports multiple providers per product

6. ✅ Inserts placeholder providers (all disabled by default):
   - MetroFibre (code: 'metrofibre')
   - Openserve (code: 'openserve')
   - Dark Fibre Africa (code: 'dfa')
   - Vumatel (code: 'vumatel')

7. ✅ Creates indexes for performance:
   - `idx_fttb_network_providers_code` - Fast provider code lookups
   - `idx_fttb_network_providers_active` - Filter enabled providers
   - `idx_service_packages_providers` - GIN index for array containment queries
   - `idx_provider_product_mappings_*` - Multiple indexes for mapping lookups

8. ✅ Creates database views:
   - `v_active_providers` - Lists currently enabled providers with capabilities
   - `v_products_with_providers` - Products with their compatible provider details

### Steps to Apply

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql)

2. Click "New Query"

3. Copy the entire contents of:
   ```
   C:\Projects\circletel-nextjs\supabase\migrations\20251021000006_cleanup_and_migrate.sql
   ```

4. Paste into the SQL Editor

5. Click **"Run"** (or press Ctrl+Enter)

6. **Expected Output** (in the Results panel):
   ```
   ✓ Exactly 1 MTN provider has provider_code set
   ✓ MTN providers updated successfully (X rows)
   ✓ Placeholder providers created successfully (4 providers)
   ✓ Index idx_fttb_network_providers_code created
   ✓ Index idx_service_packages_providers (GIN) created

   ================================================
   Multi-Provider Architecture - COMPLETE
   ================================================

   Provider Summary:
     ✓ MTN providers with code: 1
     ✓ Placeholder providers: 4
     ✓ Total providers with codes: 5

   Database Objects:
     ✓ fttb_network_providers (enhanced)
     ✓ service_packages (enhanced)
     ✓ provider_product_mappings (created)
     ✓ v_active_providers (view)
     ✓ v_products_with_providers (view)

   Ready for Task 1A.2: Add MTN Products
   ================================================
   ```

7. ✅ If you see errors about "already exists" or "duplicate key", that's OK - the migration is idempotent.

---

## Migration 2: Add MTN Products

### File Location
`supabase/migrations/20251021000007_add_mtn_products.sql`

### What It Does
Inserts 13 MTN products into the `service_packages` table:

**Consumer HomeFibreConnect (4 products)**:
- 50Mbps @ R899/month
- 100Mbps @ R1,399/month (featured)
- 200Mbps @ R1,799/month (featured)
- 1Gbps @ R2,299/month (featured)

**Business BizFibreConnect (3 products)**:
- 100Mbps @ R1,899/month (99.5% SLA)
- 200Mbps @ R2,799/month (99.5% SLA, featured)
- 1Gbps @ R4,999/month (99.9% SLA, featured)

**Consumer 5G/LTE (3 products)**:
- 5G 100GB @ R349/month
- 5G 200GB @ R599/month (featured)
- LTE Uncapped @ R699/month (1TB soft cap, featured)

**Business 5G/LTE (3 products)**:
- 5G 200GB Business @ R499/month
- 5G 500GB Business @ R799/month (featured)
- LTE Uncapped Business @ R1,099/month (2TB soft cap, featured)

All products are linked to MTN via `compatible_providers = ARRAY['mtn']`.

### Steps to Apply

1. **WAIT** for Migration 1 to complete successfully

2. In Supabase SQL Editor, click "New Query"

3. Copy the entire contents of:
   ```
   C:\Projects\circletel-nextjs\supabase\migrations\20251021000007_add_mtn_products.sql
   ```

4. Paste into the SQL Editor

5. Click **"Run"** (or press Ctrl+Enter)

6. **Expected Output**:
   ```
   ================================================
   MTN Products Added Successfully
   ================================================

   Product Breakdown:
     ✓ HomeFibreConnect (Consumer): 4 products
     ✓ BizFibreConnect (Business): 3 products
     ✓ 5G/LTE (Consumer): 3 products
     ✓ 5G/LTE (Business): 3 products

   Total MTN Products: 13

   ✓ All 13 MTN products successfully added!

   Ready for Task 1A.3: Provider Mapping Interface
   ================================================
   ```

7. ✅ If you see "ON CONFLICT" updates, that's fine - products will be updated if they already exist.

---

## Verification Queries

After both migrations complete, run these queries to verify everything is working:

### 1. Check Provider Product Mappings Table
```sql
SELECT COUNT(*) as total_mappings
FROM provider_product_mappings;
```
**Expected**: `0` (table is empty initially, populated during coverage checks)

### 2. Verify MTN Provider Configuration
```sql
SELECT
  id,
  name,
  provider_code,
  service_offerings,
  coverage_source,
  enabled
FROM fttb_network_providers
WHERE provider_code = 'mtn';
```
**Expected**: 1 row with:
- `provider_code`: `'mtn'`
- `service_offerings`: `["fibre", "wireless", "5g", "lte"]`
- `coverage_source`: `'api'`
- `enabled`: `true`

### 3. Check Placeholder Providers
```sql
SELECT
  provider_code,
  display_name,
  enabled
FROM fttb_network_providers
WHERE provider_code IN ('metrofibre', 'openserve', 'dfa', 'vumatel')
ORDER BY provider_code;
```
**Expected**: 4 rows, all with `enabled = false`

### 4. Count MTN Products by Category
```sql
SELECT
  product_category,
  COUNT(*) as count
FROM service_packages
WHERE 'mtn' = ANY(compatible_providers)
GROUP BY product_category
ORDER BY product_category;
```
**Expected**:
- `BizFibreConnect`: 3
- `HomeFibreConnect`: 4
- `MTN 5G Business`: 2
- `MTN 5G Consumer`: 2
- `MTN LTE Business`: 1
- `MTN LTE Consumer`: 1
**Total**: 13 products

### 5. Test Active Providers View
```sql
SELECT * FROM v_active_providers;
```
**Expected**: Shows only enabled providers (should include MTN)

### 6. Test Products with Providers View
```sql
SELECT
  name,
  compatible_providers,
  provider_details
FROM v_products_with_providers
WHERE 'mtn' = ANY(compatible_providers)
LIMIT 5;
```
**Expected**: Products with MTN in `compatible_providers` and populated `provider_details` JSON

---

## Troubleshooting

### Issue: "relation already exists"
**Solution**: This is normal for idempotent migrations. The `IF NOT EXISTS` clauses prevent errors.

### Issue: "duplicate key value violates unique constraint"
**Solution**:
1. Run this query to check for duplicates:
   ```sql
   SELECT provider_code, COUNT(*)
   FROM fttb_network_providers
   WHERE provider_code IS NOT NULL
   GROUP BY provider_code
   HAVING COUNT(*) > 1;
   ```
2. If duplicates exist, the migration will clean them up automatically.

### Issue: "column already exists"
**Solution**: The `ADD COLUMN IF NOT EXISTS` handles this gracefully. Safe to ignore.

### Issue: "MTN products count is not 13"
**Solution**:
1. Check if products were inserted:
   ```sql
   SELECT name FROM service_packages WHERE 'mtn' = ANY(compatible_providers);
   ```
2. Re-run Migration 2 (it's idempotent and will update existing products).

---

## Post-Migration Tasks

After both migrations complete successfully:

1. ✅ **Update Frontend Code** (if needed):
   - Coverage checker should now support multi-provider queries
   - Admin providers page will show new columns

2. ✅ **Test Coverage API**:
   - Visit `/coverage` page
   - Enter a test address
   - Verify MTN products appear in results

3. ✅ **Test Admin Providers Page**:
   - Go to `/admin/coverage/providers`
   - Verify MTN shows `provider_code = 'mtn'`
   - Verify placeholder providers are listed

4. ✅ **Test Products Page**:
   - Go to `/wireless` or `/admin/products`
   - Verify 13 MTN products are visible
   - Check that HomeFibreConnect, BizFibreConnect, and wireless products appear

---

## Next Steps (Future Development)

### Phase 1B: Provider Mapping Interface
- Create `/lib/coverage/providers/provider-registry.ts`
- Implement provider mapping interfaces
- Add provider-specific configuration loaders

### Phase 1C: MTN Product Mapper
- Create `/lib/coverage/providers/mtn/product-mapper.ts`
- Map MTN API responses to CircleTel products
- Handle HomeFibreConnect vs BizFibreConnect differentiation

### Phase 2: Additional Providers
- Enable MetroFibre (static KML files)
- Enable Openserve (static KML files)
- Integrate DFA API (when available)
- Enable Vumatel (static KML files)

---

## Support

If you encounter issues:
1. Check the Supabase Logs (Dashboard → Logs)
2. Review error messages for hints
3. Verify database permissions
4. Check that service role key has admin access

**Last Updated**: 2025-10-21
**Migration Version**: Phase 1A Complete
**Database Project**: agyjovdugmtopasyvlng
