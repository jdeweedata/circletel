# Apply B2B Workflow Migrations

## Quick Guide to Apply Migrations

### Step 1: Link to Supabase Project

```bash
npx supabase link --project-ref agyjovdugmtopasyvlng
```

You'll be prompted for:
- **Database password**: Your Supabase database password
- If you don't know it, go to Supabase dashboard → Settings → Database → Reset password

### Step 2: **BACKUP DATABASE FIRST** (Critical!)

Go to Supabase Dashboard:
1. https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/settings/general
2. Click "Pause project" then "Download backup" OR
3. Use SQL Editor to backup critical tables

### Step 3: Push Migrations

```bash
npx supabase db push
```

This will apply these 6 migrations in order:
1. `20251101000001_create_kyc_system.sql`
2. `20251101120000_add_payment_webhooks_idempotency.sql`
3. `20251102000001_create_contracts_system.sql`
4. `20251103000001_create_zoho_sync_system.sql`
5. `20251104000001_create_invoicing_system.sql`
6. `20251105000001_create_fulfillment_system.sql`

### Step 4: Verify Tables Created

```bash
npx supabase db remote
```

Then run this SQL:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'kyc_sessions',
  'contracts',
  'invoices',
  'payment_transactions',
  'billing_cycles',
  'payment_methods',
  'rica_submissions',
  'installation_schedules',
  'payment_webhooks'
);
```

Should return 9 rows.

### Step 5: Verify RLS Policies

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('kyc_sessions', 'contracts', 'invoices', 'rica_submissions');
```

All should have `rowsecurity = true`.

---

## Alternative: Manual Application via Supabase Dashboard

If `npx` doesn't work:

1. Go to https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql
2. Open each migration file in VS Code
3. Copy SQL content
4. Paste into Supabase SQL Editor
5. Click "Run"
6. Repeat for all 6 files **in chronological order**

---

## Troubleshooting

**If migration fails**:
1. Check error message in terminal
2. Look for duplicate table errors (may need to drop tables first)
3. Check if old migrations conflicting
4. Restore from backup if needed

**Common Issues**:
- "Table already exists": Drop table first or skip that migration
- "Permission denied": Make sure you're using service role key
- "Syntax error": Check migration SQL file for issues

---

## After Migration Success

1. ✅ Commit migration files to git:
   ```bash
   git add supabase/migrations/2025110*.sql
   git commit -m "feat: Add B2B Quote-to-Contract workflow migrations"
   ```

2. ✅ Update tasks.md to mark migrations as applied

3. ✅ Test the workflow end-to-end

4. ✅ Proceed with external service configuration (Didit, Zoho, etc.)
