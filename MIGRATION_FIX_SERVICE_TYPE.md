# Migration Fix: service_type Constraint Violation
**Date**: 2025-10-22
**Issue**: CHECK constraint violation on `service_packages.service_type`

---

## Problem

When applying the products migration `20251021000010_add_products_final.sql`, the following error occurred:

```
ERROR: 23514: new row for relation "service_packages" violates check constraint "service_packages_service_type_check"
DETAIL: Failing row contains (..., wireless, ..., SkyFibre, ...)
```

---

## Root Cause

The migration used `'wireless'` as the `service_type` for SkyFibre products:

```sql
('SkyFibre Starter', 'wireless', 'SkyFibre', 'consumer', ...)
```

However, the `service_packages` table has a CHECK constraint that only allows these values:

✅ **Allowed service_type values**:
- `'SkyFibre'`
- `'HomeFibreConnect'`
- `'BizFibreConnect'`
- `'All'`
- `'5g'`
- `'lte'`
- `'fixed_lte'`
- `'fibre'`
- `'uncapped_wireless'`

❌ **NOT allowed**: `'wireless'`

---

## Solution

Changed SkyFibre products from `'wireless'` to `'uncapped_wireless'`:

**Before** (❌ FAILED):
```sql
('SkyFibre Starter', 'wireless', 'SkyFibre', 'consumer', 50, 50, 799.00, ARRAY['mtn'], ...)
('SkyFibre Plus', 'wireless', 'SkyFibre', 'consumer', 100, 100, 899.00, ARRAY['mtn'], ...)
('SkyFibre Pro', 'wireless', 'SkyFibre', 'consumer', 200, 200, 1099.00, ARRAY['mtn'], ...)
```

**After** (✅ FIXED):
```sql
('SkyFibre Starter', 'uncapped_wireless', 'SkyFibre', 'consumer', 50, 50, 799.00, ARRAY['mtn'], ...)
('SkyFibre Plus', 'uncapped_wireless', 'SkyFibre', 'consumer', 100, 100, 899.00, ARRAY['mtn'], ...)
('SkyFibre Pro', 'uncapped_wireless', 'SkyFibre', 'consumer', 200, 200, 1099.00, ARRAY['mtn'], ...)
```

---

## Verification

To check allowed service_type values:

```sql
SELECT
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'service_packages'
  AND con.contype = 'c'
  AND con.conname LIKE '%service_type%';
```

---

## Files Updated

1. ✅ `supabase/migrations/20251021000010_add_products_final.sql`
   - Line 77: Changed `'wireless'` → `'uncapped_wireless'`
   - Line 81: Changed `'wireless'` → `'uncapped_wireless'`
   - Line 85: Changed `'wireless'` → `'uncapped_wireless'`

2. ✅ `MIGRATION_STATUS.md`
   - Added fix to "Corrections Made" section

3. ✅ `APPLY_MANUALLY.md`
   - Added troubleshooting section for this error

---

## Status

✅ **FIXED** - Migration file updated and ready to apply

The migration can now be applied without errors. All 15 products will be inserted successfully:
- 4 HomeFibre (service_type: `'fibre'`)
- 5 BizFibre (service_type: `'fibre'`)
- 3 SkyFibre (service_type: `'uncapped_wireless'`) ← FIXED
- 3 MTN 5G (service_type: `'5g'`)

---

**Next Step**: Apply the corrected migration via Supabase Dashboard SQL Editor
