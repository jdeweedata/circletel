# Manual Migration Application Guide

Since Supabase doesn't expose a direct SQL execution RPC by default, you'll need to apply the migration manually through the Supabase Dashboard.

## Method 1: Supabase Dashboard SQL Editor (Recommended)

### Steps:

1. **Open Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng

2. **Go to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Or go directly to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql/new

3. **Copy Migration SQL**
   - Open: `supabase/migrations/20251027000001_create_partners_system.sql`
   - Copy the entire contents (Ctrl+A, Ctrl+C)

4. **Paste and Execute**
   - Paste into the SQL Editor
   - Click "Run" or press Ctrl+Enter

5. **Verify Success**
   - Check for green "Success" message
   - No red error messages

### Expected Output:
```
Success. No rows returned
```

---

## Method 2: Supabase CLI (If Installed)

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link to project
supabase link --project-ref agyjovdugmtopasyvlng

# Apply migrations
supabase db push
```

---

## Method 3: PostgreSQL Client (Advanced)

If you have `psql` or another PostgreSQL client:

1. **Get Connection String**
   - Go to Project Settings > Database
   - Copy the "Connection string" (with password)

2. **Connect and Execute**
   ```bash
   psql "postgresql://postgres:[YOUR-PASSWORD]@db.agyjovdugmtopasyvlng.supabase.co:5432/postgres" -f supabase/migrations/20251027000001_create_partners_system.sql
   ```

---

## Verification Checklist

After applying the migration, verify the following in Supabase Dashboard:

### Tables Created (Table Editor)
- [ ] `partners` table exists
- [ ] `partner_kyc_documents` table exists
- [ ] `partner_lead_activities` table exists
- [ ] `coverage_leads` has new columns: `assigned_partner_id`, `partner_assigned_at`, `partner_notes`, `partner_last_contact`

### RLS Policies (Authentication > Policies)
- [ ] `partners` table has 4 policies
- [ ] `partner_kyc_documents` table has 4 policies
- [ ] `partner_lead_activities` table has 3 policies
- [ ] `coverage_leads` has 2 new partner-related policies

### Functions (Database > Functions)
- [ ] `update_partners_updated_at()` function exists
- [ ] `update_partner_lead_metrics()` function exists

### Triggers (Database > Triggers)
- [ ] `trigger_partners_updated_at` on `partners` table
- [ ] `trigger_update_partner_metrics` on `coverage_leads` table

---

## Troubleshooting

### Error: "relation already exists"
**Solution**: Tables already created. This is safe to ignore, or drop and recreate:
```sql
DROP TABLE IF EXISTS partner_lead_activities CASCADE;
DROP TABLE IF EXISTS partner_kyc_documents CASCADE;
DROP TABLE IF EXISTS partners CASCADE;
```

### Error: "column already exists"
**Solution**: Columns already added to `coverage_leads`. Safe to ignore or use `DROP COLUMN` first.

### Error: "policy already exists"
**Solution**: RLS policies already exist. Either ignore or drop first:
```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

### Error: "permission denied"
**Solution**: Ensure you're using the service role key or are logged in as project owner.

---

## Next Steps After Migration

1. **Create Storage Bucket**
   - Name: `partner-kyc-documents`
   - Public: No (private)
   - See: `docs/implementation/SUPABASE_STORAGE_SETUP.md`

2. **Test Partner Registration**
   - Access: http://localhost:3000/partners/onboarding
   - Create test partner account

3. **Verify RBAC Permissions**
   - Check that SALES_PARTNER role has correct permissions
   - Test permission gates in UI

---

## Support

If you encounter issues:
- Check Supabase logs in Dashboard > Logs
- Review migration SQL for syntax errors
- Contact dev team or check Supabase community

---

**Migration File**: `supabase/migrations/20251027000001_create_partners_system.sql`
**Documentation**: `docs/implementation/SALES_PARTNER_IMPLEMENTATION_PLAN.md`
**Storage Setup**: `docs/implementation/SUPABASE_STORAGE_SETUP.md`
