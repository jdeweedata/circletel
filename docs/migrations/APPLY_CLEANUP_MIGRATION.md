# Apply DFA Provider Cleanup Migration

## Instructions

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy the SQL below
3. Click **Run** to execute

## SQL to Execute

```sql
-- =====================================================
-- Cleanup Duplicate Provider Entries
-- Created: 2025-10-22
-- Purpose: Remove duplicate DFA entry and fix NULL provider_codes
-- =====================================================

-- Step 1: Delete duplicate DFA entry (the one with priority 99)
DELETE FROM fttb_network_providers
WHERE display_name = 'Dark Fibre Africa'
  AND (priority = 99 OR provider_code IS NULL);

-- Step 2: Update MTN providers to have proper provider_codes
-- MTN Business (WMS)
UPDATE fttb_network_providers
SET
  provider_code = 'mtn_business',
  service_offerings = '["fibre","wireless"]'::jsonb,
  updated_at = NOW()
WHERE display_name = 'MTN Business (WMS)'
  AND provider_code IS NULL;

-- MTN Consumer
UPDATE fttb_network_providers
SET
  provider_code = 'mtn_consumer',
  service_offerings = '["fibre","wireless","5g","lte"]'::jsonb,
  updated_at = NOW()
WHERE display_name = 'MTN Consumer'
  AND provider_code IS NULL;

-- Step 3: Verify cleanup - Run this to check results
SELECT
  provider_code,
  display_name,
  active,
  priority,
  service_offerings::text as service_offerings,
  coverage_source,
  coverage_api_type
FROM fttb_network_providers
WHERE active = true
ORDER BY priority;
```

## Expected Results

After running the cleanup, you should see:

| provider_code | display_name | active | priority | service_offerings |
|---------------|--------------|--------|----------|-------------------|
| mtn | MTN Wholesale (MNS) | true | 1 | ["fibre","wireless","5g","lte"] |
| dfa | Dark Fibre Africa | true | 2 | ["fibre"] |
| mtn_business | MTN Business (WMS) | true | 2 | ["fibre","wireless"] |
| mtn_consumer | MTN Consumer | true | 3 | ["fibre","wireless","5g","lte"] |

## Verification

Run this to ensure no NULL provider_codes remain:

```sql
SELECT
  COUNT(*) as null_provider_codes,
  array_agg(display_name) as affected_providers
FROM fttb_network_providers
WHERE provider_code IS NULL;
```

Expected result: `null_provider_codes: 0`

## Rollback (if needed)

If you need to undo the changes:

```sql
-- This is just for reference - you shouldn't need this
-- The duplicate DFA entry cannot be easily restored
-- But you can set provider_codes back to NULL if needed:

UPDATE fttb_network_providers
SET provider_code = NULL
WHERE provider_code IN ('mtn_business', 'mtn_consumer');
```

## Status

- ✅ **APPLIED**: Migration has been successfully applied
- 📁 **Migration File**: `supabase/migrations/20251022000002_cleanup_duplicate_providers.sql`
- 📅 **Applied Date**: October 22, 2025

## Verification Results

All provider codes are now properly set:

| provider_code | display_name | priority | service_offerings |
|---------------|--------------|----------|-------------------|
| mtn | MTN Wholesale (MNS) | 1 | ["fibre","wireless","5g","lte"] |
| mtn_business | MTN Business (WMS) | 2 | ["fibre","wireless"] |
| dfa | Dark Fibre Africa | 2 | ["fibre"] |
| mtn_consumer | MTN Consumer | 3 | ["fibre","wireless","5g","lte"] |

✅ No NULL provider_codes remaining
✅ Duplicate DFA entry removed
✅ All active providers have unique identifiers
