# Manual Migration Application Guide
**Date**: 2025-10-21
**Status**: ✅ READY - Fixed ON CONFLICT Error

---

## ⚠️ Issue Fixed

**Original Error**: `ERROR: 42P10: there is no unique or exclusion constraint matching the ON CONFLICT specification`

**Cause**: The `fttb_network_providers` table has no unique constraint on the `name` column

**Solution**: Created new migration file `20251021000011_cleanup_and_migrate_fixed.sql` that uses `IF NOT EXISTS` checks instead of `ON CONFLICT`

---

## 📋 Step-by-Step Instructions

### Step 1: Apply Infrastructure Migration (FIXED VERSION)

1. **Open Supabase Dashboard**:
   - Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql
   - Log in if needed

2. **Open Migration File**:
   - File location: `C:\Projects\circletel-nextjs\supabase\migrations\20251021000011_cleanup_and_migrate_fixed.sql`
   - Open in your text editor
   - **Select All** (Ctrl+A) and **Copy** (Ctrl+C)

3. **Paste into SQL Editor**:
   - In Supabase Dashboard, click **"New query"** button
   - **Paste** the entire migration SQL (Ctrl+V)
   - Click **"Run"** button (or press Ctrl+Enter)

4. **Verify Success**:
   - You should see notices in the output panel:
   ```
   ✓ Exactly 1 MTN provider has provider_code set
   Multi-Provider Architecture - COMPLETE
   ✓ MTN providers with code: 1
   ✓ Placeholder providers: 4
   ✓ Total providers with codes: 5
   ```

5. **If Error Occurs**:
   - Copy the error message
   - Check if any columns already exist
   - Verify MTN provider exists in table

---

### Step 2: Apply Products Migration

1. **Open Migration File**:
   - File location: `C:\Projects\circletel-nextjs\supabase\migrations\20251021000010_add_products_final.sql`
   - Open in your text editor
   - **Select All** (Ctrl+A) and **Copy** (Ctrl+C)

2. **Paste into SQL Editor**:
   - In Supabase Dashboard, click **"New query"** button again
   - **Paste** the entire migration SQL (Ctrl+V)
   - Click **"Run"** button

3. **Verify Success**:
   - You should see:
   ```
   ✓✓✓ All 15 products successfully added!
     - 4 HomeFibre (MTN)
     - 5 BizFibre (DFA)
     - 3 SkyFibre (MTN)
     - 3 MTN 5G (MTN)
   Added: 15 products
   MTN: 10 | DFA: 5
   ```

---

### Step 3: Verify Database State

Run this verification query in the SQL Editor:

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

**Total**: 15 products

---

## 🔍 Additional Verification Queries

### Check Providers
```sql
SELECT provider_code, display_name, enabled, priority, active
FROM fttb_network_providers
WHERE provider_code IN ('mtn', 'dfa')
ORDER BY priority;
```

**Expected**:
- `mtn` | MTN | - | 1 | true
- `dfa` | Dark Fibre Africa | - | 2 | true

### Check All Products
```sql
SELECT
  name,
  product_category,
  price,
  compatible_providers
FROM service_packages
WHERE compatible_providers IS NOT NULL
ORDER BY product_category, price;
```

Should return 15 rows.

### Check New Columns
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'fttb_network_providers'
  AND column_name IN ('provider_code', 'service_offerings', 'coverage_source')
ORDER BY column_name;
```

Should return 3 columns.

---

## 🚨 Troubleshooting

### Problem: "service_type CHECK constraint violation"
**Error**: `new row for relation "service_packages" violates check constraint "service_packages_service_type_check"`

**Cause**: The migration used `'wireless'` as service_type, but the constraint only allows: `'SkyFibre'`, `'HomeFibreConnect'`, `'BizFibreConnect'`, `'All'`, `'5g'`, `'lte'`, `'fixed_lte'`, `'fibre'`, `'uncapped_wireless'`

**Solution**: ✅ FIXED in migration file - SkyFibre products now use `'uncapped_wireless'` instead of `'wireless'`

### Problem: "Column already exists"
**Solution**: The migration uses `ADD COLUMN IF NOT EXISTS`, so this shouldn't happen. If it does, the column was already added. Safe to continue.

### Problem: "Constraint already exists"
**Solution**: The migration uses `DROP CONSTRAINT IF EXISTS` before adding. If error persists, manually drop the constraint first.

### Problem: "Duplicate key value violates unique constraint"
**Solution**: Provider codes already exist. Run this to check:
```sql
SELECT provider_code, COUNT(*)
FROM fttb_network_providers
WHERE provider_code IS NOT NULL
GROUP BY provider_code
HAVING COUNT(*) > 1;
```

### Problem: "No MTN providers found"
**Solution**: Insert an MTN provider first:
```sql
INSERT INTO fttb_network_providers (name, display_name, provider_type, technology, priority, active)
VALUES ('MTN Business', 'MTN', 'wholesale', 'FTTB', 1, true);
```

---

## 📊 What Changed

### Database Schema
| Table | Changes |
|-------|---------|
| `fttb_network_providers` | Added 5 columns: `provider_code`, `service_offerings`, `api_version`, `api_documentation_url`, `coverage_source` |
| `service_packages` | Added 3 columns: `compatible_providers`, `provider_specific_config`, `provider_priority` |
| `provider_product_mappings` | **NEW TABLE** for mapping provider services to CircleTel products |

### Database Objects
| Object | Type | Purpose |
|--------|------|---------|
| `v_active_providers` | View | Lists active providers with capabilities |
| `v_products_with_providers` | View | Products with their provider details |
| `update_provider_product_mappings_updated_at()` | Function | Auto-update timestamp trigger |
| 6 indexes | Index | Performance optimization for queries |

### Providers Added/Updated
| Provider | Code | Status | Priority | Products |
|----------|------|--------|----------|----------|
| MTN | mtn | Enabled | 1 | 10 (HomeFibre, SkyFibre, 5G) |
| DFA | dfa | **Enabled** | 2 | 5 (BizFibre) |
| MetroFibre | metrofibre | Disabled | 10 | 0 (placeholder) |
| Openserve | openserve | Disabled | 11 | 0 (placeholder) |
| Vumatel | vumatel | Disabled | 13 | 0 (placeholder) |

---

## ✅ Success Criteria

After completing both migrations, you should have:

- ✅ 5 providers configured (MTN + DFA enabled, 3 placeholders disabled)
- ✅ 15 products added
- ✅ 2 views created
- ✅ 1 trigger function created
- ✅ 6 indexes created
- ✅ 1 new table (`provider_product_mappings`)
- ✅ No errors in SQL output
- ✅ Verification queries return expected results

---

## 📞 Next Steps

After successful migration:

1. **Test Coverage API**:
   ```bash
   npm run dev
   # Visit http://localhost:3006/coverage
   ```

2. **Test Admin Provider Page**:
   ```
   http://localhost:3006/admin/coverage/providers
   ```

3. **Verify Products Page**:
   ```
   http://localhost:3006/admin/products
   ```

4. **Update Frontend Integration**: Update coverage checking logic to use multi-provider architecture

---

**Files to Apply**:
1. `supabase/migrations/20251021000011_cleanup_and_migrate_fixed.sql` (Infrastructure - FIXED)
2. `supabase/migrations/20251021000010_add_products_final.sql` (Products)

**Documentation**:
- Status: `MIGRATION_STATUS.md`
- Full Guide: `APPLY_CORRECTED_MIGRATIONS.md`
- Verification: `docs/MIGRATION_PRODUCT_VERIFICATION.md`

---

**Last Updated**: 2025-10-21
**Status**: ✅ Ready to Apply (ON CONFLICT error fixed)
