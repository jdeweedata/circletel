# Error: RLS Policy 403

**ID**: ERR-002
**Category**: api
**Severity**: high
**Occurrences**: 5
**Last Seen**: 2026-02-11

## Signature

```
new row violates row-level security policy for table "..."
403 Forbidden
RLS blocked
API route returns empty data or 403
Supabase query succeeds locally but fails in API
```

## Root Cause

API route uses service role client but table has no service role policy. The API needs elevated access but RLS blocks it.

```typescript
// API Route
const supabase = await createClient() // Service role
const { data } = await supabase
  .from('customers')
  .select() // BLOCKED by RLS!
```

```sql
-- Only customer policy exists
SELECT policyname FROM pg_policies WHERE tablename = 'customers';
-- Result: customer_select_own (no service_role policy!)
```

## Solution

Add service role policy to table:

```sql
-- Migration: YYYYMMDD_add_service_role_policy_tablename.sql
CREATE POLICY "service_role_all" ON public.table_name
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

Or for read-only access:

```sql
CREATE POLICY "service_role_read" ON public.table_name
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');
```

## Prevention

1. **When creating tables with RLS**, always add service role policy
2. **Check RLS policies** before deploying new API routes
3. **Use migration template** that includes service role policy

```sql
-- Standard RLS template
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

-- User access
CREATE POLICY "users_own" ON public.new_table
  FOR ALL USING (auth.uid() = user_id);

-- Service role (API) access
CREATE POLICY "service_role_all" ON public.new_table
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

## Validation Checklist

- [ ] API returns 200 OK
- [ ] Data returned correctly
- [ ] Customer can still only see own data
- [ ] Admin can see all data
- [ ] Service role queries work

## Debugging Steps

1. **Check RLS policies**:
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE tablename = 'your_table';
   ```

2. **Test as service role** in Supabase SQL editor

3. **Verify API uses correct client**:
   ```typescript
   import { createClient } from '@/lib/supabase/server'
   const supabase = await createClient() // Must be service role
   ```

## Related

- **File**: `lib/supabase/server.ts`
- **Commit**: `19890b5 - fix: Change dashboard summary API to use service role`
- **Skill**: `database-migration` (includes RLS templates)

## Occurrences Log

| Date | Table | Resolution Time |
|------|-------|-----------------|
| 2026-02-11 | customer_services | 15min |
| 2026-02-09 | billing_history | 10min |
| 2026-02-07 | customers | 20min |
