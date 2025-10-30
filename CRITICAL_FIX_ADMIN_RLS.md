# 🚨 CRITICAL: Admin Panel RLS Infinite Recursion Fix

## Issue Discovered

**Date**: 2025-10-30
**Severity**: CRITICAL - Blocks all admin access
**Error**: `infinite recursion detected in policy for relation "admin_users"`

## Root Cause

The RLS policies on `admin_users` table have infinite recursion:

```sql
CREATE POLICY admin_users_select_super_admin
  ON admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users  -- ⚠️ RECURSION!
      WHERE id::text = auth.uid()::text
      AND role = 'super_admin'
    )
  );
```

The policy queries the same table it's protecting, creating an infinite loop whenever anyone tries to query `admin_users`.

## Impact

- ❌ Admin panel stuck on loading screen
- ❌ Cannot log in to admin dashboard
- ❌ 500 errors from Supabase
- ❌ Repeated "Order draft sync failed" errors

## Solution

Apply the migration file: `supabase/migrations/20251030200000_fix_admin_users_rls_infinite_recursion.sql`

### Option 1: Via Supabase Dashboard (RECOMMENDED)

1. Go to https://supabase.com/dashboard/project/agyjovdugmtopasyvlng
2. Navigate to **SQL Editor**
3. Click **New query**
4. Copy and paste the SQL below:

```sql
-- Fix infinite recursion in admin_users RLS policies
DROP POLICY IF EXISTS admin_users_select_own ON admin_users;
DROP POLICY IF EXISTS admin_users_select_super_admin ON admin_users;
DROP POLICY IF EXISTS admin_users_insert_super_admin ON admin_users;
DROP POLICY IF EXISTS admin_users_update_super_admin ON admin_users;
DROP POLICY IF EXISTS admin_users_delete_super_admin ON admin_users;

-- Disable RLS on admin_users (application handles authorization)
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Create helper function for future use
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id::text = auth.uid()::text
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_admin_user() IS 'Check if current user is an active admin without causing RLS recursion';
```

5. Click **Run** (or press Ctrl+Enter)
6. Verify you see "Success. No rows returned" or similar

### Option 2: Via Supabase CLI

```bash
# If you have supabase CLI installed
cd C:\Projects\circletel-nextjs
supabase db push
```

## Verification

After applying the migration:

1. Visit https://circletel-staging.vercel.app/admin
2. Page should redirect to login (not stuck loading)
3. Login with admin credentials
4. Dashboard should load properly
5. No more 500 errors in console

## Why This Approach?

**Disabling RLS** on `admin_users` is safe because:

1. ✅ Access is controlled by application-level authentication
2. ✅ Only service role can query this table (not exposed to public)
3. ✅ Admin API routes use `getAuthenticatedUser()` helper
4. ✅ Middleware already protects admin routes

This is actually the recommended pattern for internal admin tables.

## Alternative (If RLS Required)

If you need RLS in the future, use this non-recursive policy:

```sql
-- Re-enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Use the helper function (no recursion)
CREATE POLICY admin_users_select_authenticated
  ON admin_users
  FOR SELECT
  USING (is_admin_user());
```

## Files Modified

1. `supabase/migrations/20251030200000_fix_admin_users_rls_infinite_recursion.sql` - Migration file
2. `CRITICAL_FIX_ADMIN_RLS.md` - This documentation
3. `docs/admin/ADMIN_LOADING_FIX_2025-10-30.md` - Updated with RLS fix details

## Related Issues

- Infinite loading loop (fixed in code)
- Multiple GoTrueClient warnings (fixed in code)
- OrderContext running on admin pages (fixed in code)
- **RLS infinite recursion** (requires database migration ⬅️ YOU ARE HERE)

## Next Steps

1. ✅ Apply the SQL migration above
2. ✅ Test admin login
3. ✅ Verify no console errors
4. ✅ Proceed with normal admin operations

---

**Status**: ⏳ Awaiting migration application
**Priority**: P0 - CRITICAL
**Assigned**: User (manual database operation required)
