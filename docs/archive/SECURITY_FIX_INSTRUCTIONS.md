# 🚨 CRITICAL SECURITY FIX - RLS Enable Instructions

## Issue Summary

**10 CRITICAL security vulnerabilities** were found in your Supabase database where sensitive tables are accessible without authentication:

- ❌ admin_users (Admin credentials)
- ❌ customers (Personal data)
- ❌ consumer_orders (Order information)
- ❌ partners (Business data)
- ❌ partner_compliance_documents (FICA/CIPC documents)
- ❌ kyc_documents (KYC data)
- ❌ business_quotes (Quotes)
- ❌ coverage_leads (Leads)
- ❌ orders (Legacy orders)
- ⚠️ service_packages (Product catalog - should be public)
- ⚠️ fttb_network_providers (Providers - should be public)

## 🛠️ How to Fix (3 Steps)

### Step 1: Review the Migration

The migration file has been created at:
```
supabase/migrations/20251101000000_enable_rls_all_tables.sql
```

**What it does:**
- Enables RLS on all 12 critical tables
- Creates 40+ security policies
- Protects sensitive data with auth-based access
- Maintains public read access for product catalog
- Preserves service_role access for backend operations

### Step 2: Apply the Migration

**Option A: Using Supabase CLI (Recommended)**
```bash
# Make sure you're linked to your project
supabase link --project-ref agyjovdugmtopasyvlng

# Apply the migration
supabase db push

# Or apply specific migration
supabase migration up --version 20251101000000
```

**Option B: Using Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng
2. Navigate to: SQL Editor
3. Open the migration file: `supabase/migrations/20251101000000_enable_rls_all_tables.sql`
4. Copy the entire SQL content
5. Paste into SQL Editor
6. Click "Run"

**Option C: Using the apply script**
```bash
# Create and run the apply script
node scripts/apply-rls-migration.js
```

### Step 3: Verify the Fix

Run the security audit again to confirm all issues are resolved:

```bash
node scripts/check-rls-security.js
```

Expected output:
```
✅ SECURE:   admin_users                    - RLS enabled & blocking
✅ SECURE:   customers                      - RLS enabled & blocking
✅ SECURE:   consumer_orders                - RLS enabled & blocking
...
✅ No critical security issues found!
```

## 📋 Policy Summary

### Admin Users
- ✅ Only authenticated admins can read
- ✅ Only super_admins can create/update
- ✅ Service role maintains full access

### Customers
- ✅ Customers can only read/update their own data
- ✅ Service role for backend operations

### Consumer Orders
- ✅ Customers can only see their own orders
- ✅ Service role for order processing

### Partners
- ✅ Partners can only access their own data
- ✅ Admins can view all partners
- ✅ Service role for backend operations

### Partner Compliance Documents (FICA/CIPC)
- ✅ Partners can upload their own documents
- ✅ Partners can delete unverified documents
- ✅ Admins can access all documents for verification
- ✅ Service role for backend processing

### KYC Documents
- ✅ Users can only read their own KYC documents
- ✅ Service role for backend operations

### Business Quotes
- ✅ Users can only see their own quotes
- ✅ Admins can view all quotes
- ✅ Service role for quote generation

### Coverage Leads
- ✅ Public can insert (for coverage checker)
- ✅ Users can read their own leads
- ✅ Admins can view all leads

### Service Packages (Product Catalog)
- ✅ Public can read active packages
- ✅ Admins can manage packages

### Network Providers
- ✅ Public can read providers
- ✅ Admins can manage providers

## ⚠️ Important Notes

### Backend Services
Your backend services using `SUPABASE_SERVICE_ROLE_KEY` will continue to work because:
- Service role bypasses RLS
- All policies include service_role access

### Frontend Changes Required
After applying RLS, your frontend code needs to ensure:

1. **Users are authenticated** when accessing protected data:
```typescript
// ❌ BAD - Will fail after RLS
const { data } = await supabase.from('customers').select('*');

// ✅ GOOD - User must be authenticated
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  const { data } = await supabase.from('customers').select('*');
}
```

2. **Service role is used for admin operations**:
```typescript
// In API routes (server-side only)
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient(); // Uses service role
  const { data } = await supabase.from('admin_users').select('*');
}
```

### Testing After Migration

Test these scenarios:

**1. Anonymous access blocked:**
```bash
# Should fail with permission error
curl "https://agyjovdugmtopasyvlng.supabase.co/rest/v1/admin_users" \
  -H "apikey: YOUR_ANON_KEY"
```

**2. Authenticated access works:**
```javascript
// Login first
const { data: { session } } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password'
});

// Should work
const { data } = await supabase.from('customers').select('*');
```

**3. Public catalog access works:**
```bash
# Should work (public read enabled)
curl "https://agyjovdugmtopasyvlng.supabase.co/rest/v1/service_packages" \
  -H "apikey: YOUR_ANON_KEY"
```

## 🔒 Additional Security Recommendations

1. **Enable MFA for admin accounts**
   - Go to Supabase Dashboard → Authentication → Settings
   - Enable MFA for admin users

2. **Review service role key usage**
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` is only used server-side
   - Never expose service role key in client code
   - Check `.env.local` is in `.gitignore`

3. **Set up audit logging**
   - Monitor the `api_usage_logs` table
   - Set up alerts for unusual access patterns

4. **Regular security audits**
   - Run `node scripts/check-rls-security.js` monthly
   - Review policies when schema changes

5. **Storage bucket policies**
   - Apply RLS to storage buckets:
     - `partner-compliance-documents` bucket
     - Any user upload buckets

## 📚 Reference Materials

- **RLS Policies Guide**: `.claude/skills/supabase-manager/references/rls_policies.md`
- **CLI Commands**: `.claude/skills/supabase-manager/references/cli_commands.md`
- **Common Issues**: `.claude/skills/supabase-manager/references/common_issues.md`
- **Supabase Docs**: https://supabase.com/docs/guides/auth/row-level-security

## 🆘 Troubleshooting

### Migration fails with "policy already exists"
Some policies may already exist. Drop them first:
```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

### Frontend queries fail after migration
Check:
1. User is authenticated: `const { data: { user } } = await supabase.auth.getUser()`
2. User has access to the data (owns it or is admin)
3. Policy conditions match your use case

### Service role still has issues
Ensure:
1. `SUPABASE_SERVICE_ROLE_KEY` is set correctly in `.env.local`
2. Server-side code uses `createClient()` from `@/lib/supabase/server`
3. Not using anon key for backend operations

## ✅ Checklist

Before marking as complete:

- [ ] Reviewed migration SQL file
- [ ] Backed up database (optional but recommended)
- [ ] Applied migration via CLI or Dashboard
- [ ] Re-ran security audit (`node scripts/check-rls-security.js`)
- [ ] All critical issues resolved
- [ ] Tested frontend still works
- [ ] Tested admin panel still works
- [ ] Tested public pages (coverage checker, packages)
- [ ] Service role operations working
- [ ] Committed migration to git

---

**Status**: ⏳ PENDING - Apply migration immediately to secure database

**Priority**: 🔴 CRITICAL - Data breach risk until applied

**Estimated Time**: 5-10 minutes to apply and verify
