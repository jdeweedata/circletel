# Admin Login RLS Policy Fix - CRITICAL

## Issue Summary
Admin login at `https://www.circletel.co.za/admin/login` is timing out because the `admin_activity_log` table is **missing INSERT policies**. The login API cannot write audit logs due to RLS blocking the INSERT operation.

## Root Cause
The `admin_activity_log` table has RLS enabled but only has SELECT policies:
- `admin_activity_log_select_own` - Users can view their own activity
- `admin_activity_log_select_super_admin` - Super admins can view all activity

**Missing**: INSERT policies for service role and authenticated users

When the login API tries to insert an activity log record after authentication, RLS blocks it, causing the insert to fail/timeout, which blocks the entire login response.

## Solution
Add INSERT policies to allow:
1. **Service role** (backend API) to insert activity logs
2. **Authenticated admins** to insert their own activity logs

## Migration File
Location: `supabase/migrations/20251108090000_add_admin_activity_log_insert_policy.sql`

## Manual Application (REQUIRED)

Since the Supabase MCP is in read-only mode, you need to manually apply this migration:

### Option 1: Supabase Dashboard (FASTEST)
1. Go to https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql/new
2. Copy the contents of `supabase/migrations/20251108090000_add_admin_activity_log_insert_policy.sql`
3. Paste into the SQL editor
4. Click "Run" to execute

### Option 2: Local Supabase CLI
```bash
# Using environment variable for connection
npx supabase db push
```

## Verification

After applying the migration, verify the policies exist:

```sql
SELECT
  policyname,
  cmd,
  roles,
  with_check IS NOT NULL as has_check
FROM pg_policies
WHERE tablename = 'admin_activity_log'
ORDER BY cmd, policyname;
```

Expected output:
```
policyname                               | cmd    | roles              | has_check
-----------------------------------------|--------|--------------------|-----------
Admins can insert their own activity     | INSERT | {authenticated}    | true
Service role can insert activity logs    | INSERT | {service_role}     | true
admin_activity_log_select_own            | SELECT | {public}           | false
admin_activity_log_select_super_admin    | SELECT | {public}           | false
```

## Testing After Fix

### 1. Test Login Performance
```bash
node scripts/test-login-performance.js
```

Expected:
- Response time: < 2000ms
- Status: 200
- Success: true

### 2. Verify Audit Logs Written
```sql
SELECT
  created_at,
  action,
  resource_type,
  admin_user_id
FROM admin_activity_log
WHERE action = 'admin_login'
ORDER BY created_at DESC
LIMIT 5;
```

Should show recent login activity logs.

## Impact

**Before Fix**:
- Login times out after 30 seconds
- No audit logs written
- Admins cannot access system

**After Fix**:
- Login completes in < 2 seconds
- Audit logs successfully written
- Normal admin access restored

## Related Files
- `app/api/admin/login/route.ts` - Login API (async audit logging)
- `supabase/migrations/20251108090000_add_admin_activity_log_insert_policy.sql` - Migration
- `scripts/test-login-performance.js` - Performance testing

## Deployment Checklist

- [x] Create migration file
- [x] Apply migration to production via Supabase Dashboard
- [x] Verify INSERT policies exist
- [x] Test login (BLOCKED - Supabase Auth performance issue)
- [ ] Verify audit logs are being written (BLOCKED - Cannot login)
- [x] Commit migration file
- [x] Push to repository

---

**Created**: 2025-11-08
**Severity**: CRITICAL
**Status**: ⚠️ Migration applied, code deployed, but login still failing due to Supabase Auth service degradation
**Root Cause**: Supabase Auth service experiencing severe performance issues (324s token operations)
**Next Action Required**: Contact Supabase Support or wait for platform recovery
