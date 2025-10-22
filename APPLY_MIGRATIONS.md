# Apply Migrations - Quick Guide

## ✅ SQL Syntax Error Fixed

The view creation syntax error has been fixed in:
- `supabase/migrations/20251021000006_cleanup_and_migrate.sql` (line 224-253)

**Error was**: `ORDER BY fnp.priority ASC` inside `json_agg()` without proper subquery
**Fixed**: Wrapped in subquery with ordered aggregation

---

## 🚀 Quick Application Steps

### Option 1: Supabase Dashboard (RECOMMENDED - 2 minutes)

1. **Open SQL Editor**:
   ```
   https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql
   ```

2. **Apply Migration 1** (Multi-Provider Architecture):
   - Click **"New Query"**
   - Open: `supabase/migrations/20251021000006_cleanup_and_migrate.sql`
   - Copy ALL contents (Ctrl+A, Ctrl+C)
   - Paste into SQL Editor
   - Click **"Run"** or press **Ctrl+Enter**
   - ✅ Wait for: "Multi-Provider Architecture - COMPLETE"

3. **Apply Migration 2** (MTN Products):
   - Click **"New Query"**
   - Open: `supabase/migrations/20251021000007_add_mtn_products.sql`
   - Copy ALL contents
   - Paste into SQL Editor
   - Click **"Run"**
   - ✅ Wait for: "All 13 MTN products successfully added!"

4. **Verify** (run in SQL Editor):
   ```sql
   -- Should return 1
   SELECT COUNT(*) FROM fttb_network_providers WHERE provider_code = 'mtn';

   -- Should return 13
   SELECT COUNT(*) FROM service_packages WHERE 'mtn' = ANY(compatible_providers);

   -- Should return 4
   SELECT COUNT(*) FROM fttb_network_providers
   WHERE provider_code IN ('metrofibre', 'openserve', 'dfa', 'vumatel');

   -- Test the fixed view
   SELECT * FROM v_products_with_providers LIMIT 5;
   ```

---

### Option 2: PostgreSQL psql (if installed)

```bash
# Install PostgreSQL first if needed:
# https://www.postgresql.org/download/windows/

# Apply migrations
psql "postgresql://postgres:3BVHkEN4AD4sQQRz@db.agyjovdugmtopasyvlng.supabase.co:5432/postgres" -f supabase/migrations/20251021000006_cleanup_and_migrate.sql

psql "postgresql://postgres:3BVHkEN4AD4sQQRz@db.agyjovdugmtopasyvlng.supabase.co:5432/postgres" -f supabase/migrations/20251021000007_add_mtn_products.sql
```

---

## 📋 What Gets Created

### Migration 1: Multi-Provider Architecture
- ✅ Adds 5 new columns to `fttb_network_providers`
- ✅ Creates `provider_product_mappings` table
- ✅ Adds 3 new columns to `service_packages`
- ✅ Inserts 5 providers (MTN enabled, 4 placeholders disabled)
- ✅ Creates 6 indexes for performance
- ✅ Creates 2 views: `v_active_providers`, `v_products_with_providers`

### Migration 2: MTN Products
- ✅ Inserts 13 MTN products:
  - 4 HomeFibreConnect (Consumer)
  - 3 BizFibreConnect (Business)
  - 3 5G/LTE (Consumer)
  - 3 5G/LTE (Business)

---

## ⚠️ Important Notes

1. **Idempotent**: Both migrations are safe to run multiple times
2. **Order Matters**: Apply Migration 1 BEFORE Migration 2
3. **Ignore "already exists" errors**: These are expected for idempotent migrations
4. **Network Issue**: Direct PostgreSQL connection has IPv6 connectivity issues (use Dashboard instead)

---

## 🎯 Success Criteria

After both migrations:
- ✅ `provider_code` column exists on `fttb_network_providers`
- ✅ `compatible_providers` column exists on `service_packages`
- ✅ `provider_product_mappings` table exists
- ✅ 1 MTN provider with code 'mtn'
- ✅ 4 placeholder providers (metrofibre, openserve, dfa, vumatel)
- ✅ 13 MTN products linked via `compatible_providers`
- ✅ Views `v_active_providers` and `v_products_with_providers` work without errors

---

## 📞 Next Steps

After migrations complete:

1. **Test Coverage Checker**:
   - Visit: http://localhost:3006/coverage
   - Enter test address
   - Verify MTN products appear

2. **Test Admin Providers Page**:
   - Visit: http://localhost:3006/admin/coverage/providers
   - Verify MTN shows `provider_code = 'mtn'`

3. **Check Products Page**:
   - Visit: http://localhost:3006/wireless
   - Verify 13 MTN products display

---

## 📚 Documentation

- **Full Guide**: `docs/migration-instructions.md`
- **Architecture**: `docs/features/customer-journey/MULTI_PROVIDER_ARCHITECTURE.md`
- **Implementation Plan**: `docs/features/customer-journey/MERGED_IMPLEMENTATION_PLAN.md`

---

**Last Updated**: 2025-10-21 (SQL syntax fixed)
**Status**: Ready to apply ✅
