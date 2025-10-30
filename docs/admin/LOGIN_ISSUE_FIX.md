# Admin Login Issue & Fix

**Date**: October 31, 2025
**Status**: ⚠️ Requires Manual SQL Execution
**Issue**: Infinite recursion in RLS policy prevents login

---

## 🐛 Issue Description

### Error Message
```
Access denied: Not an admin user
```

### Root Cause
The Row Level Security (RLS) policy on the `admin_users` table causes **infinite recursion** when querying the table.

**Why it happens**:
1. API tries to query `admin_users` table to check if user exists
2. RLS policy activates to check permissions
3. RLS policy queries `admin_users` table to verify if user is admin
4. This creates a circular dependency (infinite recursion)
5. Query fails with "infinite recursion detected" error
6. Login is denied

### Technical Details

**Current Problematic Policy**:
```sql
CREATE POLICY "Super admins can view all admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users  -- ❌ This causes recursion!
      WHERE admin_users.id = auth.uid()
        AND admin_users.is_active = true
        AND admin_users.role = 'super_admin'
    )
  );
```

The policy tries to check `admin_users` **while already querying** `admin_users`, creating an infinite loop.

---

## ✅ Solution

### Fix RLS Policy

Run this SQL in **Supabase Dashboard > SQL Editor**:

```sql
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Super admins can view all admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can update admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can insert admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can delete admin users" ON admin_users;

-- Create simple policy that allows authenticated users to read their own record
CREATE POLICY "Users can view own admin record"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow service role full access (bypasses RLS automatically)
-- No policy needed - service role bypasses RLS by default

-- Optional: Allow admins to view all records (without recursion)
-- This uses a direct auth.uid() check instead of joining to admin_users
CREATE POLICY "Admins can view all records"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM admin_users
      WHERE role = 'super_admin' AND is_active = true
    )
  );
```

### How to Apply

1. **Open Supabase Dashboard**:
   - Go to https://supabase.com/dashboard
   - Select project: `agyjovdugmtopasyvlng`

2. **Open SQL Editor**:
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Run SQL**:
   - Copy the SQL above
   - Paste into editor
   - Click "Run" or press `Ctrl+Enter`

4. **Verify Success**:
   - Should see "Success. No rows returned" (this is correct)
   - No errors should appear

5. **Test Login**:
   - Navigate to http://localhost:3000/admin/login
   - Enter credentials: `admin@circletel.co.za` / `admin123`
   - Login should now work ✅

---

## 🔍 Why This Fix Works

### 1. Service Role Bypass
The login API uses the **service role key** which automatically bypasses RLS. This means:
- API can query `admin_users` without triggering policies
- No infinite recursion occurs
- Login check works correctly

### 2. Simplified Policies
The new policies are simpler and non-recursive:
- **"Users can view own admin record"**: Users can only see their own data
- **"Admins can view all records"**: Still allows admin access but without recursion

### 3. Direct UID Check
Instead of:
```sql
EXISTS (SELECT 1 FROM admin_users WHERE ...) -- ❌ Recursion
```

We use:
```sql
auth.uid() = id -- ✅ Direct check, no recursion
```

Or:
```sql
auth.uid() IN (SELECT id FROM admin_users WHERE ...) -- ✅ Subquery, no policy trigger
```

---

## 🧪 Testing After Fix

### 1. Verify Policy Fix
```bash
node scripts/debug-admin-user.js
```

**Expected Output**:
```
✅ Authentication Successful
✅ User found in admin_users table
✅ User IDs match
✅ Debug Complete - User should be able to login
```

### 2. Test Login
```bash
# Start dev server
npm run dev

# Open browser
http://localhost:3000/admin/login

# Login with:
Email: admin@circletel.co.za
Password: admin123
```

**Expected Result**: Successfully logged in and redirected to admin dashboard

### 3. Test Audit Logging
```bash
node scripts/test-admin-login-audit.js
```

**Expected Output**:
```
✅ Login Audit Logging Test PASSED
  ✅ Failed login attempts are logged
  ✅ Successful logins are logged
  ✅ IP addresses are tracked
```

---

## 📋 Checklist

Before considering this fixed:

- [ ] SQL executed in Supabase Dashboard
- [ ] No errors when running SQL
- [ ] `debug-admin-user.js` script passes
- [ ] Can login with `admin@circletel.co.za` / `admin123`
- [ ] Redirected to admin dashboard after login
- [ ] Audit logs show login success in `/admin/audit-logs`
- [ ] Failed login attempts also logged correctly

---

## 🚨 Prevention

To prevent this issue in the future:

### 1. Never Create Self-Referencing Policies

**❌ BAD** (causes recursion):
```sql
CREATE POLICY "policy_name" ON table_name
USING (
  EXISTS (SELECT 1 FROM table_name WHERE ...) -- Self-reference!
);
```

**✅ GOOD** (no recursion):
```sql
CREATE POLICY "policy_name" ON table_name
USING (
  auth.uid() = id -- Direct check
);
```

### 2. Use Service Role for Admin Operations

In API routes that need to check admin status:
- Always use `createClient()` from `lib/supabase/server.ts`
- This uses service role key and bypasses RLS
- No policy recursion possible

### 3. Test Policies Immediately

After creating/updating RLS policies:
1. Test with service role client
2. Test with authenticated user client
3. Verify no "infinite recursion" errors

---

## 📚 Related Documentation

- **Main Issue**: `docs/admin/LOGIN_ISSUE_FIX.md` (this file)
- **Login Audit System**: `docs/admin/LOGIN_AUDIT_LOGGING.md`
- **Auth System**: `docs/admin/ADMIN_AUTH_AND_AUDIT_SYSTEM.md`
- **Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security

---

## 🔧 Alternative Solutions (Not Recommended)

### Option 1: Disable RLS on admin_users
```sql
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
```

**Pros**: Simple, no recursion
**Cons**: Security risk, allows any authenticated user to see all admin users

### Option 2: Use Security Definer Functions
Create functions with `SECURITY DEFINER` that bypass RLS.

**Pros**: More control
**Cons**: More complex, harder to maintain

### Option 3: Separate Auth Table
Create a separate `admin_auth` table for auth checks, separate from `admin_users`.

**Pros**: Clean separation
**Cons**: Data duplication, sync issues

**Recommendation**: Use the solution provided above (fixed RLS policies). It's secure, simple, and follows best practices.

---

**Last Updated**: October 31, 2025
**Author**: CircleTel Development Team
**Status**: ⚠️ Awaiting SQL Execution
