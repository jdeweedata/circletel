# Migration Verification Guide

Complete checklist for verifying database migrations before deployment.

## Pre-Deployment Checklist

### 1. File Structure ✅

- [ ] Migration file in `supabase/migrations/` directory
- [ ] Filename follows pattern: `YYYYMMDDHHMMSS_description.sql`
- [ ] Description uses snake_case (no spaces or special characters)
- [ ] File committed to git with descriptive message

### 2. SQL Syntax ✅

Run validation script:
```bash
python .claude/skills/database-migration/scripts/validate_migration.py supabase/migrations/[file].sql
```

Check for:
- [ ] No syntax errors reported
- [ ] All warnings reviewed and addressed
- [ ] All SQL statements end with semicolon
- [ ] No hardcoded sensitive data (IDs, passwords, API keys)

### 3. Table Structure ✅

Every table should have:
- [ ] `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- [ ] `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- [ ] `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- [ ] All columns have appropriate data types
- [ ] CHECK constraints for enum-like columns
- [ ] NOT NULL constraints where appropriate
- [ ] DEFAULT values set for optional columns

### 4. Foreign Keys ✅

For each foreign key:
- [ ] References parent table with `REFERENCES parent(id)`
- [ ] Has ON DELETE behavior specified (CASCADE, SET NULL, RESTRICT)
- [ ] Parent table exists or will be created first
- [ ] Index created on foreign key column

Example:
```sql
customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE

CREATE INDEX idx_table_customer_id ON public.table(customer_id);
```

### 5. Indexes ✅

Check that indexes exist for:
- [ ] All foreign key columns
- [ ] Commonly filtered columns (status, date ranges)
- [ ] Composite indexes for multi-column queries
- [ ] Unique indexes for unique constraints
- [ ] Partial indexes for specific query patterns

Example:
```sql
-- Foreign key index
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);

-- Composite index
CREATE INDEX idx_orders_customer_status ON public.orders(customer_id, status);

-- Partial index
CREATE INDEX idx_orders_active ON public.orders(customer_id)
WHERE status = 'active';
```

### 6. Row Level Security (RLS) ✅

For tables with user data:
- [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` executed
- [ ] Service role policy exists (REQUIRED for API routes)
- [ ] User SELECT policy exists
- [ ] User INSERT policy exists (if applicable)
- [ ] User UPDATE policy exists (if applicable)
- [ ] User DELETE policy exists (if applicable)
- [ ] Admin policy exists for admin access

**CRITICAL**: Service role policy:
```sql
CREATE POLICY "service_role_all" ON public.table_name
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

### 7. Triggers ✅

If using triggers:
- [ ] Trigger function exists or is created in migration
- [ ] Trigger attached to correct table and events
- [ ] `updated_at` trigger created for timestamp updates

Example:
```sql
CREATE TRIGGER trigger_update_timestamp
  BEFORE UPDATE ON public.table_name
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();
```

### 8. Comments ✅

Documentation added:
- [ ] Table comment explains purpose
- [ ] Complex column comments added
- [ ] Business logic documented in comments

Example:
```sql
COMMENT ON TABLE public.customer_invoices IS 'Generated invoices for customer billing';
COMMENT ON COLUMN public.customer_invoices.status IS 'Invoice status: draft → issued → sent → paid';
```

## Local Testing Verification

### Step 1: Reset Database

```bash
npx supabase db reset
```

Expected output:
- [ ] "Applying migration..." for each migration
- [ ] No errors during migration application
- [ ] Database reset successful

### Step 2: Apply Migrations

```bash
npx supabase migration up
```

Check:
- [ ] All migrations applied successfully
- [ ] No SQL errors
- [ ] No foreign key constraint violations

### Step 3: Verify Schema

```bash
npx supabase db dump --schema public > schema_dump.sql
```

Review dump and verify:
- [ ] All tables created
- [ ] All indexes exist
- [ ] All foreign keys present
- [ ] All triggers created
- [ ] RLS enabled on tables

### Step 4: Test RLS Policies

Create test script: `test_rls.sql`

```sql
-- Test as authenticated user
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"test-user-id"}';

-- Should only return user's own records
SELECT * FROM public.table_name;

-- Should not return other users' records
SELECT * FROM public.table_name WHERE user_id != 'test-user-id';

-- Reset
RESET ROLE;
```

Run:
```bash
npx supabase db execute -f test_rls.sql
```

Verify:
- [ ] Users can only see their own data
- [ ] Users cannot see other users' data
- [ ] Admin role can see all data
- [ ] Service role can access all data

### Step 5: Test Queries

Create test queries file: `test_queries.sql`

```sql
-- Test basic CRUD operations
INSERT INTO public.table_name (user_id, name) VALUES (auth.uid(), 'Test');
SELECT * FROM public.table_name WHERE user_id = auth.uid();
UPDATE public.table_name SET name = 'Updated' WHERE id = 'test-id';
DELETE FROM public.table_name WHERE id = 'test-id';

-- Test with indexes (check EXPLAIN output)
EXPLAIN ANALYZE SELECT * FROM public.table_name WHERE user_id = 'test-id';
```

Verify:
- [ ] INSERT works correctly
- [ ] SELECT returns expected data
- [ ] UPDATE modifies records
- [ ] DELETE removes records
- [ ] Indexes are used (check EXPLAIN output)

## Staging Deployment Verification

### Step 1: Deploy to Staging

```bash
git add supabase/migrations/
git commit -m "feat: Add [description] migration"
git push origin feature/migration-name:staging
```

### Step 2: Verify Staging Database

After auto-deployment:
- [ ] Check Supabase dashboard for migration status
- [ ] Review deployment logs for errors
- [ ] Verify tables exist in staging database

### Step 3: Test API Endpoints

Test related API routes:
```bash
# Test GET endpoint
curl https://circletel-staging.vercel.app/api/resource

# Test POST endpoint
curl -X POST https://circletel-staging.vercel.app/api/resource \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

Verify:
- [ ] API endpoints return expected data
- [ ] RLS policies allow service role access
- [ ] No 403 Forbidden errors from RLS
- [ ] Data is correctly filtered by user

### Step 4: Test Frontend

Navigate to relevant pages:
- [ ] Page loads without errors
- [ ] Data displays correctly
- [ ] User can perform CRUD operations
- [ ] Only user's own data is visible

## Production Deployment Verification

### Pre-Merge Checklist

Before merging to main:
- [ ] All staging tests passed
- [ ] Code review completed
- [ ] Migration validated by second developer
- [ ] Rollback plan documented
- [ ] Stakeholders notified of deployment

### Post-Deployment Monitoring

After merge and auto-deployment:
- [ ] Check Vercel deployment logs
- [ ] Verify Supabase migration status
- [ ] Monitor error tracking (Sentry/LogRocket)
- [ ] Test critical user flows
- [ ] Monitor database performance

### Health Checks

Run health checks:
```bash
# Check database connection
curl https://www.circletel.co.za/api/health

# Check migration status
npx supabase migration list --project-ref agyjovdugmtopasyvlng
```

Verify:
- [ ] All services responding
- [ ] No database connection errors
- [ ] Migration marked as applied
- [ ] No performance degradation

## Rollback Verification

If rollback is needed:

### Step 1: Create Rollback Migration

```sql
-- 20251108130000_rollback_[original_description].sql
DROP POLICY IF EXISTS "policy_name" ON public.table_name;
ALTER TABLE public.table_name DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.table_name CASCADE;
```

### Step 2: Test Rollback Locally

```bash
npx supabase db reset
npx supabase migration up
```

Verify:
- [ ] Tables removed successfully
- [ ] No orphaned dependencies
- [ ] Related data cleaned up

### Step 3: Deploy Rollback

```bash
git add supabase/migrations/[rollback_file].sql
git commit -m "fix: Rollback [description] migration"
git push origin hotfix/rollback:main
```

## Common Issues and Solutions

### Issue: RLS blocks all access

**Symptoms**: API returns 403 or empty data

**Check**:
```sql
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

**Fix**: Add service role policy:
```sql
CREATE POLICY "service_role_all" ON public.table_name
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

### Issue: Foreign key constraint violation

**Symptoms**: Migration fails with FK violation error

**Check**:
```sql
SELECT * FROM public.child_table
WHERE parent_id NOT IN (SELECT id FROM public.parent_table);
```

**Fix**: Clean orphaned records or adjust migration order

### Issue: Index not used in queries

**Symptoms**: Slow queries despite having index

**Check**:
```sql
EXPLAIN ANALYZE SELECT * FROM table WHERE column = 'value';
```

**Fix**: Ensure index matches query pattern (column order, WHERE conditions)

### Issue: Migration applies but data is missing

**Symptoms**: Table exists but queries return no data

**Check**: RLS policies with test user
```sql
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"test-user-id"}';
SELECT * FROM public.table_name;
```

**Fix**: Adjust RLS policies or verify data was inserted correctly

## Final Sign-Off

Before marking migration as complete:

- [ ] All pre-deployment checks passed
- [ ] Local testing successful
- [ ] Staging deployment verified
- [ ] Production deployment successful
- [ ] No errors in monitoring
- [ ] Documentation updated
- [ ] Team notified

**Approved By**: _________________
**Date**: _________________
**Migration File**: _________________

---

**Version**: 1.0.0
**Last Updated**: 2025-11-08
