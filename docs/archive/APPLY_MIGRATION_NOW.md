# 🚀 APPLY MIGRATION - DO THIS FIRST!

## Quick Steps (2 minutes)

### Step 1: Open Supabase Dashboard

Click this link: **https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql/new**

(This opens the SQL Editor directly)

### Step 2: Copy the Migration SQL

Open this file in your editor:
```
supabase/migrations/20251019000002_create_product_approval_system.sql
```

**Or use this command to view it:**
```bash
cat supabase/migrations/20251019000002_create_product_approval_system.sql
```

### Step 3: Paste and Run

1. **Copy ALL the SQL** (from the migration file)
2. **Paste** into the Supabase SQL Editor
3. Click **RUN** (or press Ctrl+Enter)

You should see: ✅ Success. No rows returned

### Step 4: Verify Tables Created

Run this in the SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'product_imports',
  'product_approval_queue',
  'notifications',
  'reminders',
  'product_approval_activity_log'
)
ORDER BY table_name;
```

Expected result: **5 rows** (the table names)

---

## After Migration is Applied

Once you've completed the above, come back here and I'll run the complete workflow test with Playwright!

**Next command to run:**
```bash
node scripts/test-product-import-workflow.js
```

This should now show: `🎉 ALL TESTS PASSED!`

---

## Troubleshooting

**If you get errors:**

1. **Foreign key errors**: Make sure `admin_users` and `role_templates` tables exist
2. **Permission errors**: You're logged in as the project owner, right?
3. **Syntax errors**: Copy the ENTIRE file, including comments

**Still stuck?** Let me know and I'll help debug!

---

**After migration is applied, we'll test:**
1. ✅ Import products from Excel
2. ✅ View in admin panel
3. ✅ Approve products via UI (with Playwright)
4. ✅ Check notifications
5. ✅ Verify products in database
