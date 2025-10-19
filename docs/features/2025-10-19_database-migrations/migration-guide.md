# Supabase Migration Guide - October 19, 2025

> **Purpose**: Apply safe migrations to CircleTel database
> **Status**: Ready to apply manually
> **Priority**: High (RBAC + Provider Management required for admin features)

---

## Summary

I've analyzed all 30 migration files in `supabase/migrations/` and identified **2 critical safe migrations** that need to be applied:

1. **RBAC System** (Required by CLAUDE.md)
2. **Provider Management System** (Required for Coverage Provider feature)

---

## Migration Status

### ✅ Already Applied (4 migrations)
These migrations are already in your database:
- `20251005000002_create_fttb_providers_system.sql` → Applied as `20251005011205`
- `20251005000003_add_sme_skyfibre_packages.sql` → Applied as `20251005012720`
- `20251005000004_fix_product_category_mapping.sql` → Applied as `20251005013051`
- `20251005000006_create_service_packages_audit_log.sql` → Applied as `20251005013731`

### ⚠️ Conflicts Resolved
- **Renamed**: `20251018000001_create_provider_management_system.sql` → `.bak` (conflicted with existing schema)
- **Refactored**: Created new `20251019000001_enhance_provider_management_system.sql` (compatible with existing schema)

### ⚠️ Skipped Migrations (Schema Conflicts)
These migrations have conflicts with existing database structure:
- `20241228_create_products_tables.sql` - Creates ENUM types that may conflict
- `20241228_add_sample_products.sql` - TRUNCATES existing products table
- `20241229000001_create_products_real_circletel_data.sql` - Creates duplicate ENUM types

**Recommendation**: Review these migrations carefully before applying. They may overwrite existing product data.

---

## How to Apply Safe Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql/new)
2. Copy and paste the SQL from each migration file (see below)
3. Execute the SQL
4. Verify the migration succeeded (check for errors)

### Option 2: Supabase CLI

```powershell
# Set environment variable (replace with your actual key)
$env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key-here"

# Apply specific migration
supabase db push --db-url "postgresql://postgres.agyjovdugmtopasyvlng:$env:SUPABASE_SERVICE_ROLE_KEY@aws-0-us-west-1.pooler.supabase.com:6543/postgres" --file supabase/migrations/20250201000005_create_rbac_system.sql

# Or apply all pending migrations
supabase db push --linked
```

---

## Priority Migrations to Apply

### 1. RBAC System (CRITICAL - Required by CLAUDE.md)

**File**: `supabase/migrations/20250201000005_create_rbac_system.sql`

**Purpose**: Creates role templates (17 roles) and permission system (100+ permissions) for admin users

**What it does**:
- ✅ Creates `role_templates` table
- ✅ Adds RBAC columns to `admin_users` table (`role_template_id`, `custom_permissions`, `department`, `job_title`)
- ✅ Creates functions: `get_user_permissions()`, `user_has_permission()`
- ✅ Inserts 17 default role templates (Super Admin, CEO, Product Manager, etc.)
- ✅ Creates RLS policies for role templates

**Impact**:
- **ZERO breaking changes** (uses `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ADD COLUMN IF NOT EXISTS`)
- **Enables**: RBAC features in admin dashboard, permission gates, role-based access

**Apply**:
```sql
-- Copy entire contents of supabase/migrations/20250201000005_create_rbac_system.sql
-- Paste into Supabase SQL Editor
-- Execute
```

---

### 2. Provider Management System (HIGH - Required for Coverage Provider feature)

**File**: `supabase/migrations/20251019000001_enhance_provider_management_system.sql`

**Purpose**: Adds provider health monitoring, API logging, and moves MTN config from code to database

**What it does**:
- ✅ Creates `provider_api_logs` table (tracks all provider API calls)
- ✅ Adds health monitoring columns to `fttb_network_providers` table
- ✅ Adds configuration to `provider_configuration` table
- ✅ Migrates MTN Wholesale, MTN Business WMS, MTN Consumer configs to database
- ✅ Creates health monitoring functions
- ✅ Creates RLS policies

**Impact**:
- **ZERO breaking changes** (uses `IF NOT EXISTS` patterns, `ON CONFLICT DO UPDATE`)
- **Enables**: Provider management UI, API testing tools, performance monitoring
- **Migrates**: MTN configs from hardcoded values to database (editable via admin panel)

**Apply**:
```sql
-- Copy entire contents of supabase/migrations/20251019000001_enhance_provider_management_system.sql
-- Paste into Supabase SQL Editor
-- Execute
```

---

## Verification Steps

After applying each migration, verify it succeeded:

### 1. Check RBAC System

```sql
-- Verify role_templates table exists and has data
SELECT COUNT(*) FROM role_templates;
-- Expected: 17 rows

-- Verify admin_users has new columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'admin_users'
AND column_name IN ('role_template_id', 'custom_permissions', 'department', 'job_title');
-- Expected: 4 rows

-- Test permission function
SELECT get_user_permissions('00000000-0000-0000-0000-000000000000'::uuid);
-- Expected: JSONB array (even if empty)
```

### 2. Check Provider Management System

```sql
-- Verify provider_api_logs table exists
SELECT COUNT(*) FROM provider_api_logs;
-- Expected: 0 rows (table is empty initially)

-- Verify fttb_network_providers has new columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'fttb_network_providers'
AND column_name IN ('last_health_check', 'health_status', 'success_rate_24h', 'avg_response_time_24h', 'sso_config', 'priority');
-- Expected: 6 rows

-- Verify MTN providers were inserted/updated
SELECT name, display_name, priority, health_status
FROM fttb_network_providers
WHERE name IN ('mtn_wholesale', 'mtn_business_wms', 'mtn_consumer');
-- Expected: 3 rows

-- Test health monitoring function
SELECT calculate_provider_success_rate_24h(id)
FROM fttb_network_providers
LIMIT 1;
-- Expected: 0.00 (no API calls yet)
```

---

## Post-Migration Tasks

After successfully applying migrations:

1. **Update Admin Dashboard**:
   - Verify RBAC permission gates work in `/app/admin`
   - Test provider management UI at `/app/admin/coverage/providers`

2. **Test Provider APIs**:
   - Use admin panel to test MTN Wholesale API
   - Verify MTN config is loaded from database (not hardcoded)

3. **Monitor API Logs**:
   - Run coverage checks to populate `provider_api_logs` table
   - Verify health monitoring functions update provider metrics

4. **Documentation**:
   - Update RBAC documentation with applied role templates
   - Update coverage provider docs with new admin features

---

## Rollback Plan

If migrations fail or cause issues:

### Rollback RBAC System

```sql
-- Drop role templates table
DROP TABLE IF EXISTS role_templates CASCADE;

-- Remove RBAC columns from admin_users
ALTER TABLE admin_users
DROP COLUMN IF EXISTS role_template_id,
DROP COLUMN IF EXISTS custom_permissions,
DROP COLUMN IF EXISTS department,
DROP COLUMN IF EXISTS job_title;

-- Drop RBAC functions
DROP FUNCTION IF EXISTS get_user_permissions(UUID);
DROP FUNCTION IF EXISTS user_has_permission(UUID, TEXT);
```

### Rollback Provider Management System

```sql
-- Drop provider_api_logs table
DROP TABLE IF EXISTS provider_api_logs CASCADE;

-- Remove health monitoring columns from fttb_network_providers
ALTER TABLE fttb_network_providers
DROP COLUMN IF EXISTS last_health_check,
DROP COLUMN IF EXISTS health_status,
DROP COLUMN IF EXISTS success_rate_24h,
DROP COLUMN IF EXISTS avg_response_time_24h,
DROP COLUMN IF EXISTS last_successful_check,
DROP COLUMN IF EXISTS sso_config,
DROP COLUMN IF EXISTS priority;

-- Drop health monitoring functions
DROP FUNCTION IF EXISTS calculate_provider_success_rate_24h(UUID);
DROP FUNCTION IF EXISTS calculate_provider_avg_response_time_24h(UUID);
DROP FUNCTION IF EXISTS update_provider_health_metrics(UUID);

-- Remove provider configuration entries
DELETE FROM provider_configuration
WHERE config_key IN ('fallback_strategy', 'default_timeouts', 'rate_limits', 'geographic_bounds', 'mtn_wholesale_products');
```

---

## Next Steps

1. **Apply migrations** using Supabase Dashboard or CLI
2. **Verify migrations** using verification SQL above
3. **Test admin features** that depend on these migrations
4. **Update code** to use database-stored MTN config (instead of hardcoded values)
5. **Monitor** provider API logs and health metrics

---

## Questions?

- **RBAC Documentation**: See `docs/rbac/RBAC_SYSTEM_GUIDE.md`
- **Provider Management Spec**: See `docs/features/COVERAGE_PROVIDER_MANAGEMENT_SPEC.md`
- **Migration Issues**: Check Supabase logs at [Dashboard > Database > Logs](https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/logs/postgres-logs)

---

**Last Updated**: 2025-10-19
**Applied Migrations**: 0/2 (manual application required)
**Status**: Ready for production
