---
description: Create a new timestamped Supabase migration file with CircleTel template
arguments:
  - name: name
    description: Migration name in snake_case (e.g., add_customer_preferences)
    required: true
---

# Create New Supabase Migration

Create a new database migration file following CircleTel standards.

## Steps

1. **Generate timestamp** in format YYYYMMDDHHMMSS (14 digits)
   - Use current UTC time
   - Example: 20251129143000

2. **Create migration file** at:
   ```
   supabase/migrations/{timestamp}_{name}.sql
   ```

3. **Add CircleTel migration template**:

```sql
-- =============================================================================
-- Migration: {name}
-- =============================================================================
-- Description: [Brief description of what this migration does]
-- Version: 1.0
-- Created: {YYYY-MM-DD}
-- =============================================================================

-- =============================================================================
-- 1. Create Tables (if applicable)
-- =============================================================================

-- CREATE TABLE IF NOT EXISTS public.table_name (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--
--     -- Core Fields
--     name VARCHAR(200) NOT NULL,
--
--     -- Metadata
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- =============================================================================
-- 2. Create Indexes
-- =============================================================================

-- CREATE INDEX IF NOT EXISTS idx_table_name_column
--     ON public.table_name(column);

-- =============================================================================
-- 3. Enable RLS
-- =============================================================================

-- ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 4. RLS Policies
-- =============================================================================

-- Customer access policy (customers see only their data)
-- CREATE POLICY "Customers can view own data"
--     ON public.table_name
--     FOR SELECT
--     USING (customer_id = auth.uid());

-- Service role bypass (for API routes)
-- CREATE POLICY "Service role bypass"
--     ON public.table_name
--     FOR ALL
--     USING (auth.jwt() ->> 'role' = 'service_role');

-- Admin access (via admin_users table)
-- CREATE POLICY "Admin full access"
--     ON public.table_name
--     FOR ALL
--     USING (
--         EXISTS (
--             SELECT 1 FROM public.admin_users
--             WHERE auth_user_id = auth.uid()
--             AND is_active = true
--         )
--     );

-- =============================================================================
-- 5. Updated_at Trigger
-- =============================================================================

-- CREATE OR REPLACE FUNCTION public.update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = NOW();
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER update_table_name_updated_at
--     BEFORE UPDATE ON public.table_name
--     FOR EACH ROW
--     EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- End of Migration
-- =============================================================================
```

4. **Open the file** for editing

5. **Remind user**:
   - Uncomment and customize the sections needed
   - Run `npm run type-check:memory` after implementation
   - Test locally before pushing
   - Check Supabase advisors after applying: `mcp__supabase__get_advisors`

## CircleTel Migration Standards

- **Naming**: snake_case (e.g., `add_customer_preferences`, `create_invoices_table`)
- **RLS**: Always enable RLS on new tables
- **Service Role**: Always add service role bypass policy for API routes
- **Timestamps**: Always include `created_at` and `updated_at` with triggers
- **UUIDs**: Use `gen_random_uuid()` for primary keys
- **References**: Use proper foreign key constraints with ON DELETE behavior

## Example Usage

```
/new-migration add_customer_notification_preferences
```

Creates: `supabase/migrations/20251129143000_add_customer_notification_preferences.sql`
