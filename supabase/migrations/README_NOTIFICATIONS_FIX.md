# Notifications Schema Fix

## Issue
Two migrations created conflicting `notifications` table schemas:
1. `20251019000002_create_product_approval_system.sql` - Old schema without `deleted_at`
2. `20251024150316_create_notifications_system.sql` - New schema with `deleted_at`

When the new migration runs, `CREATE TABLE IF NOT EXISTS` skips creation because the table already exists with the old schema, causing index creation to fail.

## Solution
Created `20251106210000_fix_notifications_schema.sql` which:
- Drops the old notifications table
- Recreates it with the correct schema including `deleted_at`
- Adds proper indexes, RLS policies, and triggers

## How to Apply

### Option 1: Using Supabase CLI (Recommended)
```bash
# Connect to your project
npx supabase link --project-ref agyjovdugmtopasyvlng

# Push the migration
npx supabase db push
```

### Option 2: Manual SQL Execution
1. Go to Supabase Dashboard > SQL Editor
2. Copy contents of `20251106210000_fix_notifications_schema.sql`
3. Execute the SQL

### Option 3: Apply via API
```bash
# Using psql (if you have connection string)
psql "postgresql://..." -f supabase/migrations/20251106210000_fix_notifications_schema.sql
```

## Verification
After applying, verify the schema:
```sql
-- Check table structure
\d notifications

-- Should show columns including:
-- - deleted_at (timestamptz)
-- - is_read (boolean)
-- - is_dismissed (boolean)
-- - type (notification_type enum)

-- Check indexes
\d+ notifications

-- Should show indexes:
-- - idx_notifications_user_id
-- - idx_notifications_created_at
-- - idx_notifications_user_unread
-- - idx_notifications_type
-- - idx_notifications_priority
```

## Safety
- **Safe for production**: The migration drops and recreates the table, but since the notifications system isn't in active use yet, there's no data loss risk
- **Idempotent**: Can be run multiple times safely
- **No downtime**: The API has graceful fallback handling for missing tables

## Related Files
- `app/api/notifications/route.ts` - API with graceful error handling
- `supabase/migrations/20251019000002_create_product_approval_system.sql` - Old migration (notifications table now commented out)
- `supabase/migrations/20251024150316_create_notifications_system.sql` - New notifications system
