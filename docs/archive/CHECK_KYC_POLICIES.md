# Check KYC Documents Policies

Run this SQL in Supabase Dashboard to see what policies exist on kyc_documents:

**🔗 [Open Supabase SQL Editor](https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql/new)**

```sql
-- Show ALL policies on kyc_documents table
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'kyc_documents';
```

**Please paste the results here so I can identify which policy is allowing anon access.**

Expected: Should be 2-3 policies, all for `authenticated` or `service_role` only.

If you see any policy with `roles: "{anon,authenticated}"` or `using_clause: "true"` for anon, that's the problem!
