# Update Development Admin Email Migration

## Overview

This migration updates the development admin email from `admin@circletel.co.za` to `devadmin@circletel.co.za`.

**Target User ID**: `172c9f7c-7c32-43bd-8782-278df0d4a322`

## Why This Migration is Needed

The Supabase MCP connection has read-only access, so the email change must be applied manually using one of the methods below.

## Method 1: Supabase Dashboard (RECOMMENDED)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/agyjovdugmtopasyvlng)
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `20251106000000_update_development_admin_email.sql`
5. Click **Run**
6. Verify the success message: "SUCCESS: Admin email updated to devadmin@circletel.co.za in both tables"

## Method 2: Supabase CLI

```bash
# Make sure you're in the project root
cd C:\Projects\circletel-nextjs

# Apply the migration
supabase db push

# Or apply this specific migration
supabase migration up --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.agyjovdugmtopasyvlng.supabase.co:5432/postgres"
```

## Method 3: Direct SQL Execution

If you have direct database access, you can run the migration manually:

```sql
-- Copy and paste the contents of 20251106000000_update_development_admin_email.sql
-- into your SQL client (pgAdmin, DBeaver, etc.)
```

## Verification

After applying the migration, verify the change:

```sql
-- Check admin_users table
SELECT id, email, full_name, role
FROM admin_users
WHERE id = '172c9f7c-7c32-43bd-8782-278df0d4a322';

-- Check auth.users table
SELECT id, email, raw_user_meta_data->>'email' as meta_email
FROM auth.users
WHERE id = '172c9f7c-7c32-43bd-8782-278df0d4a322';
```

Both queries should show `devadmin@circletel.co.za`.

## Important Notes

1. **Update .env files**: After migration, update any `.env` files that reference the old email
2. **Update login credentials**: Use `devadmin@circletel.co.za` for future logins
3. **Password remains unchanged**: Only the email is updated, the password stays the same
4. **Auth sessions**: Existing sessions may need to be logged out and back in

## Rollback (if needed)

If you need to revert the change:

```sql
-- Rollback admin_users
UPDATE admin_users
SET email = 'admin@circletel.co.za', updated_at = NOW()
WHERE id = '172c9f7c-7c32-43bd-8782-278df0d4a322';

-- Rollback auth.users
UPDATE auth.users
SET
  email = 'admin@circletel.co.za',
  raw_user_meta_data = jsonb_set(raw_user_meta_data, '{email}', '"admin@circletel.co.za"'),
  updated_at = NOW()
WHERE id = '172c9f7c-7c32-43bd-8782-278df0d4a322';
```

## Migration Files

- **Migration**: `supabase/migrations/20251106000000_update_development_admin_email.sql`
- **Instructions**: This file (`README_UPDATE_ADMIN_EMAIL.md`)
