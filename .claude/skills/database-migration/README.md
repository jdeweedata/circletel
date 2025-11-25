# Database Migration Manager Skill

A comprehensive skill for managing Supabase database migrations in the CircleTel project.

## What This Skill Does

This skill helps you:
- **Create migrations** with proper naming conventions (YYYYMMDDHHMMSS_description.sql)
- **Set up RLS policies** for secure data access
- **Generate indexes** for optimal query performance
- **Validate migrations** before deployment
- **Test locally** with Supabase CLI
- **Deploy safely** to staging and production

## Quick Start

### 1. Generate a New Migration

```bash
python .claude/skills/database-migration/scripts/generate_migration.py "create customer invoices table"
```

This creates: `supabase/migrations/20251108120000_create_customer_invoices_table.sql`

### 2. Edit the Migration File

Open the generated file and modify the template:

```sql
-- Uncomment and modify the template
CREATE TABLE IF NOT EXISTS public.customer_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  invoice_number TEXT UNIQUE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Always enable RLS
ALTER TABLE public.customer_invoices ENABLE ROW LEVEL SECURITY;

-- Service role policy (REQUIRED for API routes)
CREATE POLICY "service_role_all" ON public.customer_invoices
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

### 3. Validate the Migration

```bash
python .claude/skills/database-migration/scripts/validate_migration.py supabase/migrations/20251108120000_create_customer_invoices_table.sql
```

### 4. Test Locally

```bash
# Reset and apply migrations
npx supabase db reset
npx supabase migration up

# Verify schema
npx supabase db dump --schema public
```

### 5. Deploy to Staging

```bash
git add supabase/migrations/
git commit -m "feat: Add customer invoices migration"
git push origin feature/invoices:staging
```

## File Structure

```
database-migration/
├── Skill.md                          # Main skill documentation
├── README.md                         # This file
├── scripts/
│   ├── generate_migration.py        # Generate new migration files
│   └── validate_migration.py        # Validate migration syntax
├── templates/
│   └── basic_table_template.sql     # Template for standard tables
└── examples/
    └── customer_invoices_example.sql # Real CircleTel example
```

## Common Patterns

### Create Table with RLS

```sql
CREATE TABLE IF NOT EXISTS public.table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index foreign keys
CREATE INDEX IF NOT EXISTS idx_table_name_user_id
  ON public.table_name(user_id);

-- Enable RLS
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- Service role policy (REQUIRED)
CREATE POLICY "service_role_all" ON public.table_name
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- User access policy
CREATE POLICY "users_select_own" ON public.table_name
  FOR SELECT
  USING (auth.uid() = user_id);
```

### Add Column to Existing Table

```sql
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Backfill existing records
UPDATE public.customers
SET phone_verified = false
WHERE phone_verified IS NULL;
```

### Create Junction Table (Many-to-Many)

```sql
CREATE TABLE IF NOT EXISTS public.product_categories (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, category_id)
);

CREATE INDEX idx_product_categories_product ON public.product_categories(product_id);
CREATE INDEX idx_product_categories_category ON public.product_categories(category_id);
```

## RLS Policy Patterns

### Customer Data Access

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

### Partner Portal Access

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

## Validation Checklist

Before deploying:

- [ ] Migration file follows naming convention (YYYYMMDDHHMMSS_description.sql)
- [ ] All tables have PRIMARY KEY
- [ ] All tables have created_at and updated_at timestamps
- [ ] Foreign keys have ON DELETE behavior
- [ ] RLS enabled on all user data tables
- [ ] Service role policy exists (REQUIRED for API routes)
- [ ] Indexes created for foreign keys
- [ ] Comments added to tables/columns
- [ ] Migration tested locally
- [ ] No hardcoded IDs or sensitive data

## Testing Commands

```bash
# Reset database (local only!)
npx supabase db reset

# Apply migrations
npx supabase migration up

# Check migration status
npx supabase migration list

# Dump current schema
npx supabase db dump --schema public

# View RLS policies
npx supabase db dump --schema public | grep POLICY
```

## Rollback Procedures

### Method 1: Create Rollback Migration

```sql
-- 20251108130000_rollback_customer_invoices.sql
DROP POLICY IF EXISTS "policy_name" ON public.table_name;
ALTER TABLE public.table_name DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.table_name CASCADE;
```

### Method 2: Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Execute rollback SQL manually
3. Create migration file for record

## CircleTel-Specific Tables

### Customer Dashboard
- `customer_services` - Service lifecycle tracking
- `customer_billing` - Billing configuration
- `customer_invoices` - Generated invoices
- `usage_history` - Interstellio API sync

### B2B Quote-to-Contract
- `kyc_sessions` - Didit KYC verification
- `contracts` - Generated contracts (CT-YYYY-NNN)
- `invoices` - Invoices (INV-YYYY-NNN)
- `rica_submissions` - RICA submissions

### Partner Portal
- `partners` - Partner business details
- `partner_compliance_documents` - FICA/CIPC docs

## Troubleshooting

### RLS blocks all access
```sql
-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Ensure service role policy exists
CREATE POLICY "service_role_all" ON public.your_table
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

### Foreign key constraint violation
```sql
-- Find orphaned records
SELECT * FROM public.child_table
WHERE parent_id NOT IN (SELECT id FROM public.parent_table);

-- Clean up
DELETE FROM public.child_table
WHERE parent_id NOT IN (SELECT id FROM public.parent_table);
```

## Best Practices

1. **Always test locally first** - Use `npx supabase db reset`
2. **Use transactions** - Wrap related changes in BEGIN/COMMIT
3. **Add rollback migrations** - Document how to undo changes
4. **Index foreign keys** - Improve query performance
5. **Enable RLS by default** - Security first approach
6. **Version control** - Commit migrations with descriptive messages

## Resources

- **Skill.md**: Complete migration workflow and patterns
- **Templates**: `templates/basic_table_template.sql`
- **Examples**: `examples/customer_invoices_example.sql`
- **Supabase Docs**: https://supabase.com/docs/guides/database

---

**Version**: 1.0.0
**Last Updated**: 2025-11-08
**Maintained By**: CircleTel Development Team
