# Apply RLS Infinite Recursion Fix

## Issue
Email validation is failing with error:
```
Error: infinite recursion detected in policy for relation "admin_users"
Code: 42P17
```

## Root Cause
The "Admins can view all customers" RLS policy on the `customers` table queries `admin_users`, which has its own RLS policies that also query `admin_users`, creating infinite recursion:

```
customers (email validation)
  → "Admins can view all customers" policy
    → SELECT FROM admin_users
      → admin_users RLS policies
        → SELECT FROM admin_users (recursion!)
```

## Solution
Replace the recursive admin check with a simple public read policy for email validation.

## Steps to Apply Fix

### Option 1: Supabase Dashboard SQL Editor (RECOMMENDED)

1. Go to https://supabase.com/dashboard/project/agyjovdugmtopasyvlng
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `20251023000003_fix_customers_rls_infinite_recursion.sql`
5. Click **Run**
6. Verify success message

### Option 2: Command Line (if psql is configured)

```bash
# Set environment variable
$env:DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.agyjovdugmtopasyvlng.supabase.co:5432/postgres"

# Apply migration
psql $env:DATABASE_URL -f supabase/migrations/20251023000003_fix_customers_rls_infinite_recursion.sql
```

## Verification

After applying the migration, test email validation:

1. Go to https://circletel-staging.vercel.app/order/account
2. Type an email in the email field
3. Check browser console - should see no errors
4. Email availability should show "Checking availability..." then either:
   - "Email is available" (green checkmark)
   - "This email is already registered" (red X)

## Security Considerations

**Is public read on customers safe?**

✅ **Yes, this is safe** because:

1. We're only exposing email field **existence**, not the actual email data
2. Email validation is a standard UX pattern (e.g., Gmail, Facebook, Twitter all check email availability)
3. The `customers` table doesn't contain sensitive PII (password hashes are in Supabase Auth)
4. API route validates email format before querying
5. Service role still has full admin access for management operations

**Alternative Approach (More Restrictive)**

If you want to limit public access, you can modify the EmailAvailability component to call an API route that uses the service role key instead of direct Supabase client access. This would require:

1. Create `/api/customers/check-email` route
2. Use service role key on server side
3. Update EmailAvailability component to call this API

## Rollback (if needed)

If you need to revert this change:

```sql
-- Remove public read policy
DROP POLICY IF EXISTS "Public can read customers for email validation" ON customers;

-- Restore original admin-only policy (but this will bring back the recursion error!)
CREATE POLICY "Admins can view all customers"
ON customers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.email = auth.jwt() ->> 'email'
    AND admin_users.is_active = true
  )
);
```

**Note**: Rollback will restore the infinite recursion error. Only rollback if you plan to implement the alternative API route approach.

## Related Files

- Migration: `supabase/migrations/20251023000003_fix_customers_rls_infinite_recursion.sql`
- Component: `components/ui/email-availability.tsx`
- Original policy: `supabase/migrations/20251023000002_add_supabase_auth_to_customers.sql` (line 59-68)

---

**Created**: 2025-10-23
**Issue**: RLS infinite recursion blocking email validation
**Status**: Ready to apply
