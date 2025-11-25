---
name: Database Migration Manager
description: Guides Supabase database migrations for CircleTel - creates migrations, RLS policies, validates schema changes, and handles rollbacks
version: 1.0.0
dependencies: python>=3.8
---

# Database Migration Manager Skill

A comprehensive skill for managing Supabase database migrations in the CircleTel project. Handles migration creation, RLS policy setup, schema validation, and deployment workflows.

## When This Skill Activates

This skill automatically activates when you:
- Create a new database migration
- Add or modify database tables
- Set up Row Level Security (RLS) policies
- Need to test or validate migrations
- Want to rollback a migration
- Verify migration status
- Create indexes or triggers

**Keywords**: migration, database, schema, RLS, Supabase, SQL, table, create table, alter table, rollback

## Migration Workflow

### 1. Create New Migration

**Naming Convention**: `YYYYMMDDHHMMSS_description.sql`
- Use 14-digit timestamp for ordering
- Description in snake_case
- Store in `supabase/migrations/`

**Example**: `20251108120000_create_customer_invoices_table.sql`

**Generation Command**:
```bash
python .claude/skills/database-migration/scripts/generate_migration.py "create customer invoices table"
```

### 2. Migration Structure

Every migration should follow this structure:

```sql
-- Migration: [Description]
-- Created: [Date]
-- Purpose: [What this migration does]

-- ============================================
-- STEP 1: Create Tables
-- ============================================

CREATE TABLE IF NOT EXISTS public.table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Add your columns here
);

-- ============================================
-- STEP 2: Create Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_table_name_column
  ON public.table_name(column_name);

-- ============================================
-- STEP 3: Add Foreign Keys
-- ============================================

ALTER TABLE public.table_name
  ADD CONSTRAINT fk_table_name_reference
  FOREIGN KEY (reference_id) REFERENCES public.other_table(id)
  ON DELETE CASCADE;

-- ============================================
-- STEP 4: Enable RLS
-- ============================================

ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Create RLS Policies
-- ============================================

-- Policy: Users can read their own records
CREATE POLICY "policy_name_select" ON public.table_name
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own records
CREATE POLICY "policy_name_insert" ON public.table_name
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- STEP 6: Create Triggers (if needed)
-- ============================================

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_timestamp
  BEFORE UPDATE ON public.table_name
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

-- ============================================
-- STEP 7: Add Comments
-- ============================================

COMMENT ON TABLE public.table_name IS 'Description of what this table stores';
COMMENT ON COLUMN public.table_name.column IS 'Description of this column';
```

### 3. CircleTel-Specific Patterns

#### Customer Dashboard Tables

```sql
-- Customer services with lifecycle tracking
CREATE TABLE IF NOT EXISTS public.customer_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  account_number TEXT UNIQUE NOT NULL, -- CT-YYYY-NNNNN format
  service_package_id UUID REFERENCES public.service_packages(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),
  activation_date DATE,
  suspension_date DATE,
  cancellation_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### B2B Quote-to-Contract Tables

```sql
-- KYC sessions with JSONB data
CREATE TABLE IF NOT EXISTS public.kyc_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.business_quotes(id),
  session_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  extracted_data JSONB, -- Didit AI extracted data
  risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Partner Compliance Tables

```sql
-- Partner compliance documents
CREATE TABLE IF NOT EXISTS public.partner_compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  document_category TEXT NOT NULL, -- 13 FICA/CIPC categories
  document_url TEXT NOT NULL,
  document_number TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  is_required BOOLEAN DEFAULT false,
  is_sensitive BOOLEAN DEFAULT false,
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 4. RLS Policy Patterns

#### Customer Data Access

```sql
-- Customers can only see their own data
CREATE POLICY "customers_select_own" ON public.customers
  FOR SELECT
  USING (auth.uid() = id);

-- Admins can see all customer data
CREATE POLICY "admins_select_all_customers" ON public.customers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid()
    )
  );
```

#### Service Role Bypass (for API routes)

```sql
-- Service role can do everything
CREATE POLICY "service_role_all" ON public.table_name
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

#### Partner Portal Access

```sql
-- Partners can only access their own records
CREATE POLICY "partners_select_own" ON public.partner_compliance_documents
  FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM public.partners
      WHERE user_id = auth.uid()
    )
  );
```

### 5. Testing Migrations

**Step 1: Validate SQL Syntax**
```bash
# Check syntax without executing
python .claude/skills/database-migration/scripts/validate_migration.py supabase/migrations/20251108120000_create_customer_invoices_table.sql
```

**Step 2: Test on Local Supabase**
```bash
# Apply migration locally
npx supabase db reset
npx supabase migration up
```

**Step 3: Verify Schema**
```bash
# Check table was created
npx supabase db dump --schema public
```

**Step 4: Test RLS Policies**
```sql
-- Test as authenticated user
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"test-user-id"}';
SELECT * FROM public.table_name; -- Should only see own records
```

### 6. Deployment Workflow

**Step 1: Create Migration File**
```bash
python .claude/skills/database-migration/scripts/generate_migration.py "your migration description"
```

**Step 2: Write Migration SQL**
- Follow the structure template above
- Include all RLS policies
- Add indexes for performance
- Document with comments

**Step 3: Test Locally**
```bash
npx supabase db reset
npx supabase migration up
```

**Step 4: Verify Changes**
```bash
# Check tables
npx supabase db dump --schema public

# Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Step 5: Push to Staging Branch**
```bash
git add supabase/migrations/
git commit -m "feat: Add [description] migration"
git push origin feature/migration-name:staging
```

**Step 6: Test on Staging Database**
- Verify migration applies successfully
- Test data access with different user roles
- Check performance of queries

**Step 7: Merge to Production**
```bash
# Create PR: feature → main
# After approval, merge triggers auto-deployment
```

### 7. Rollback Procedures

**Method 1: Create Rollback Migration**
```sql
-- 20251108130000_rollback_customer_invoices.sql

-- Drop policies
DROP POLICY IF EXISTS "policy_name" ON public.table_name;

-- Disable RLS
ALTER TABLE public.table_name DISABLE ROW LEVEL SECURITY;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_name ON public.table_name;

-- Drop indexes
DROP INDEX IF EXISTS idx_table_name_column;

-- Drop table
DROP TABLE IF EXISTS public.table_name;
```

**Method 2: Supabase Dashboard**
1. Go to Supabase Dashboard → SQL Editor
2. Execute rollback SQL manually
3. Create migration file for record

**Method 3: Reset to Previous State**
```bash
# Local only - NOT for production!
npx supabase db reset
```

### 8. Common Migration Patterns

#### Add Column to Existing Table

```sql
-- Add column with default value
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Backfill existing records (if needed)
UPDATE public.customers
SET phone_verified = false
WHERE phone_verified IS NULL;
```

#### Modify Column Type

```sql
-- Change column type (careful with data loss!)
ALTER TABLE public.orders
ALTER COLUMN total_amount TYPE DECIMAL(10,2)
USING total_amount::DECIMAL(10,2);
```

#### Add Enum Type

```sql
-- Create enum type
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending', 'payment', 'kyc', 'installation', 'active', 'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Use enum in table
CREATE TABLE public.consumer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status order_status DEFAULT 'pending'
);
```

#### Create Junction Table (Many-to-Many)

```sql
-- Junction table for products and categories
CREATE TABLE IF NOT EXISTS public.product_categories (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, category_id)
);

CREATE INDEX idx_product_categories_product ON public.product_categories(product_id);
CREATE INDEX idx_product_categories_category ON public.product_categories(category_id);
```

### 9. Performance Optimization

#### Index Strategies

```sql
-- Single column index
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);

-- Composite index (order matters!)
CREATE INDEX idx_orders_customer_status ON public.orders(customer_id, status);

-- Partial index (for specific queries)
CREATE INDEX idx_orders_active ON public.orders(customer_id)
WHERE status = 'active';

-- Text search index
CREATE INDEX idx_products_name_search ON public.products
USING GIN (to_tsvector('english', name));
```

#### Query Optimization

```sql
-- Add index for foreign key
CREATE INDEX idx_customer_services_customer_id
  ON public.customer_services(customer_id);

-- Add index for status filtering
CREATE INDEX idx_customer_services_status
  ON public.customer_services(status)
WHERE status IN ('active', 'suspended');
```

### 10. Verification Checklist

Before deploying a migration:

- [ ] Migration file follows naming convention (YYYYMMDDHHMMSS_description.sql)
- [ ] All tables have PRIMARY KEY defined
- [ ] All tables have created_at and updated_at timestamps
- [ ] All foreign keys have ON DELETE behavior specified
- [ ] RLS is enabled on all tables with user data
- [ ] RLS policies exist for SELECT, INSERT, UPDATE, DELETE
- [ ] Service role policy exists for API access
- [ ] Indexes created for all foreign keys
- [ ] Indexes created for commonly filtered columns
- [ ] Comments added to tables and important columns
- [ ] Migration tested locally with `npx supabase db reset`
- [ ] RLS policies tested with different user roles
- [ ] No hardcoded IDs or sensitive data in migration
- [ ] Rollback plan documented

### 11. Troubleshooting

**Issue: RLS policy blocks all access**
```sql
-- Check current policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Temporarily disable RLS for debugging (local only!)
ALTER TABLE public.your_table DISABLE ROW LEVEL SECURITY;

-- Fix: Ensure service role policy exists
CREATE POLICY "service_role_all" ON public.your_table
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

**Issue: Migration fails with "relation already exists"**
```sql
-- Always use IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.table_name (...);
CREATE INDEX IF NOT EXISTS idx_name ON public.table_name(column);
```

**Issue: Foreign key constraint violation**
```sql
-- Check for orphaned records before adding FK
SELECT * FROM public.child_table
WHERE parent_id NOT IN (SELECT id FROM public.parent_table);

-- Delete or update orphaned records
DELETE FROM public.child_table
WHERE parent_id NOT IN (SELECT id FROM public.parent_table);

-- Then add constraint
ALTER TABLE public.child_table
  ADD CONSTRAINT fk_child_parent
  FOREIGN KEY (parent_id) REFERENCES public.parent_table(id);
```

### 12. CircleTel Migration History

**Core Tables** (Existing):
- `service_packages` - Products/packages
- `coverage_leads` - Coverage check results
- `customers` - Customer accounts
- `consumer_orders` - B2C orders
- `admin_users` - Admin accounts with RBAC

**B2B Tables** (Recent):
- `kyc_sessions` - Didit KYC verification
- `contracts` - Generated contracts (CT-YYYY-NNN)
- `invoices` - Invoices (INV-YYYY-NNN)
- `payment_transactions` - Payment records
- `rica_submissions` - RICA submissions

**Partner Tables** (Recent):
- `partners` - Partner business details
- `partner_compliance_documents` - FICA/CIPC docs

**Customer Dashboard Tables** (In Development):
- `customer_services` - Service lifecycle
- `customer_billing` - Billing configuration
- `customer_invoices` - Generated invoices
- `usage_history` - Interstellio sync

## Quick Reference Commands

```bash
# Generate new migration
python .claude/skills/database-migration/scripts/generate_migration.py "description"

# Validate migration
python .claude/skills/database-migration/scripts/validate_migration.py supabase/migrations/[file].sql

# Apply migrations locally
npx supabase db reset
npx supabase migration up

# Check migration status
npx supabase migration list

# Dump current schema
npx supabase db dump --schema public

# Test RLS policies
python .claude/skills/database-migration/scripts/test_rls.py
```

## Resources

- **Templates**: See `templates/` directory for migration templates
- **Examples**: See `examples/` directory for real CircleTel migrations
- **Scripts**: See `scripts/` directory for automation tools
- **Supabase Docs**: https://supabase.com/docs/guides/database

## Best Practices

1. **Always test locally first** - Use `npx supabase db reset` to verify
2. **Use transactions** - Wrap related changes in BEGIN/COMMIT blocks
3. **Add rollback migrations** - Document how to undo changes
4. **Index foreign keys** - Improve query performance
5. **Enable RLS by default** - Security first approach
6. **Use meaningful names** - Clear table, column, and constraint names
7. **Document with comments** - Explain purpose and business logic
8. **Version control** - Commit migrations with descriptive messages

---

**Version**: 1.0.0
**Last Updated**: 2025-11-08
**Maintained By**: CircleTel Development Team
