# ✅ Post-Migration Verification Steps

## You just applied the RLS migration! 🎉

Now let's verify everything worked correctly.

## Step 1: Run Security Audit Again

```bash
node scripts/check-rls-security.js
```

### ✅ Expected Output (Success):

```
🔒 CircleTel Supabase Security Audit
======================================================================

📋 Checking RLS Status...

✅ SECURE:   service_packages              - RLS enabled & blocking
✅ SECURE:   coverage_leads                - RLS enabled & blocking
✅ SECURE:   orders                        - RLS enabled & blocking
✅ SECURE:   consumer_orders               - RLS enabled & blocking
✅ SECURE:   customers                     - RLS enabled & blocking
✅ SECURE:   admin_users                   - RLS enabled & blocking
✅ SECURE:   partners                      - RLS enabled & blocking
✅ SECURE:   partner_compliance_documents  - RLS enabled & blocking
✅ SECURE:   business_quotes               - RLS enabled & blocking
✅ SECURE:   kyc_documents                 - RLS enabled & blocking

======================================================================
📊 Security Audit Summary

✅ No critical security issues found!
✅ All tables appear to have proper RLS configuration.
```

### ❌ If You See Errors:

If you still see "CRITICAL" or "WARNING" messages, something didn't apply correctly.

**Troubleshooting:**
1. Check the Supabase Dashboard SQL Editor results panel for errors
2. Re-run the migration with error handling
3. Or ask me for help - I'll diagnose the issue

---

## Step 2: Test Public Access Still Works

The product catalog and coverage checker should still be publicly accessible:

```bash
# Test public package access (should work)
curl "https://agyjovdugmtopasyvlng.supabase.co/rest/v1/service_packages?select=id,name&limit=1" \
  -H "apikey: sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7" \
  -H "Content-Type: application/json"
```

**Expected:** JSON response with package data ✅

```bash
# Test admin access is blocked (should fail)
curl "https://agyjovdugmtopasyvlng.supabase.co/rest/v1/admin_users?select=*" \
  -H "apikey: sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7" \
  -H "Content-Type: application/json"
```

**Expected:** Error with status 403 or empty result ✅

---

## Step 3: Test Your Application

### Frontend Test Checklist:

**Test these critical flows:**

1. **Public Pages (No Auth Required):**
   - [ ] Homepage loads
   - [ ] Package catalog page loads
   - [ ] Coverage checker works
   - [ ] Package details page works

2. **Authenticated User Pages:**
   - [ ] User can log in
   - [ ] User can view their own orders
   - [ ] User can view their profile
   - [ ] User CANNOT see other users' data

3. **Admin Panel:**
   - [ ] Admin can log in
   - [ ] Admin can view all orders
   - [ ] Admin can view all customers
   - [ ] Admin can manage products

4. **Partner Portal:**
   - [ ] Partner can log in
   - [ ] Partner can view own data
   - [ ] Partner can upload documents
   - [ ] Partner CANNOT see other partners' data

### Start Development Server:

```bash
npm run dev:memory
```

Then test the flows above manually.

---

## Step 4: Check for Breaking Changes

### Common Issues After RLS:

#### Issue 1: "Permission denied" in frontend

**Symptom:** Frontend queries fail with permission errors

**Cause:** User is not authenticated when querying protected data

**Fix:**
```typescript
// ❌ BAD - Will fail if user not authenticated
const { data } = await supabase.from('customers').select('*');

// ✅ GOOD - Check auth first
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  const { data } = await supabase
    .from('customers')
    .select('*')
    .eq('id', user.id); // Only query own data
}
```

#### Issue 2: API routes not working

**Symptom:** Backend API calls fail

**Cause:** Not using service role key

**Fix:**
```typescript
// In API routes (server-side)
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient(); // Uses service role
  const { data } = await supabase.from('admin_users').select('*');
  // ✅ This works because service role bypasses RLS
}
```

#### Issue 3: Coverage checker not working

**Symptom:** Can't submit coverage checks

**Cause:** RLS policy for coverage_leads might be wrong

**Fix:** Already handled! The migration includes:
```sql
CREATE POLICY "Public can insert coverage leads"
ON "public"."coverage_leads"
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
```

This allows public submissions ✅

---

## Step 5: Commit the Migration

Once verified, commit to git:

```bash
git add supabase/migrations/20251101000000_enable_rls_all_tables.sql
git add SECURITY_FIX_INSTRUCTIONS.md
git add scripts/check-rls-security.js
git add scripts/apply-rls-migration.js
git add scripts/list-tables.js

git commit -m "security: Enable RLS on all tables with comprehensive policies

- Enable Row Level Security on 12 critical tables
- Create 40+ security policies for data protection
- Fix critical security vulnerabilities (admin_users, customers, orders, etc.)
- Maintain public read access for product catalog
- Preserve service_role access for backend operations
- Add security audit script for ongoing monitoring

Resolves: Critical data exposure vulnerabilities
Impact: All sensitive data now protected with auth-based access
Testing: Verified with scripts/check-rls-security.js

🤖 Generated with Claude Code (https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push
```

---

## Step 6: Monitor Going Forward

### Weekly Security Audit:

```bash
# Run weekly to ensure RLS is still enabled
node scripts/check-rls-security.js
```

### Review Logs:

```bash
# Check for suspicious access patterns
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { data } = await supabase
    .from('api_usage_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  console.log('Recent API calls:', data?.length || 0);
})();
"
```

---

## ✅ Checklist

Once you've completed all steps, check these off:

- [ ] ✅ Security audit shows "No critical issues"
- [ ] ✅ Public pages still work (homepage, packages, coverage checker)
- [ ] ✅ Authenticated users can access their own data
- [ ] ✅ Admin panel works with admin credentials
- [ ] ✅ Partner portal works with partner credentials
- [ ] ✅ Coverage checker accepts submissions
- [ ] ✅ Migration committed to git
- [ ] ✅ Team notified of security update

---

## 🎉 SUCCESS!

Your CircleTel database is now **properly secured** with Row Level Security!

**What changed:**
- 🔒 Sensitive data protected with authentication
- 🔐 User data isolated (can only see own data)
- 👮 Admin access controlled by roles
- 🌐 Public catalog still accessible
- 🛡️ Service role maintains backend access

**Security improvements:**
- ❌ Before: Anyone could read admin_users, customers, orders
- ✅ After: Only authenticated, authorized users can access data

---

Need help with anything? Just ask!
