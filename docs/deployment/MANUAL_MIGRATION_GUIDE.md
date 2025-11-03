# Manual Migration Application Guide
## B2B Workflow Database Setup

Since the CLI is having permission issues, let's apply migrations manually via the Supabase Dashboard.

---

## 🎯 **Step-by-Step Process** (15 minutes)

### **Step 1: Backup Database** ⚠️ CRITICAL

1. Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/settings/general
2. Scroll to "Pause project" section
3. Click **"Download backup"** (or use SQL backup below)

**SQL Backup Method**:
```sql
-- Run in SQL Editor to backup critical tables
SELECT * FROM business_quotes INTO backup_business_quotes;
SELECT * FROM admin_users INTO backup_admin_users;
SELECT * FROM customers INTO backup_customers;
-- etc.
```

---

### **Step 2: Open SQL Editor**

Go to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql

---

### **Step 3: Apply Migrations in Order**

Copy and paste each migration SQL **one at a time** in this exact order:

#### **Migration 1: KYC System** ✅
**File**: `supabase/migrations/20251101000001_create_kyc_system.sql`

1. Open the file in VS Code
2. Copy **entire contents**
3. Paste into Supabase SQL Editor
4. Click **"Run"**
5. Verify success (should see "Success. No rows returned")

#### **Migration 2: Payment Webhooks Idempotency** ✅
**File**: `supabase/migrations/20251101120000_add_payment_webhooks_idempotency.sql`

1. Open file
2. Copy contents
3. Paste in SQL Editor
4. Click **"Run"**

#### **Migration 3: Contracts System** ✅
**File**: `supabase/migrations/20251102000001_create_contracts_system.sql`

1. Open file
2. Copy contents
3. Paste in SQL Editor
4. Click **"Run"**

#### **Migration 4: Zoho Sync System** ✅
**File**: `supabase/migrations/20251103000001_create_zoho_sync_system.sql`

1. Open file
2. Copy contents
3. Paste in SQL Editor
4. Click **"Run"**

#### **Migration 5: Invoicing System** ✅
**File**: `supabase/migrations/20251104000001_create_invoicing_system.sql`

1. Open file
2. Copy contents
3. Paste in SQL Editor
4. Click **"Run"**

#### **Migration 6: Fulfillment System** ✅
**File**: `supabase/migrations/20251105000001_create_fulfillment_system.sql`

1. Open file
2. Copy contents
3. Paste in SQL Editor
4. Click **"Run"**

---

### **Step 4: Verify Migrations Applied**

Run this SQL to verify all tables created:

```sql
SELECT table_name, 
       (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
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
)
ORDER BY table_name;
```

**Expected Result**: 9 rows showing all tables

---

### **Step 5: Verify RLS Policies**

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'kyc_sessions', 
  'contracts', 
  'invoices', 
  'rica_submissions',
  'payment_webhooks'
)
ORDER BY tablename;
```

**Expected Result**: All tables show `rowsecurity = t` (true)

---

### **Step 6: Verify Functions & Triggers**

```sql
-- Check auto-numbering triggers exist
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE 'set_%_number%'
ORDER BY event_object_table;
```

**Expected Result**: Should see triggers for:
- `set_contract_number_trigger` on `contracts`
- `set_invoice_number_trigger` on `invoices`

---

## ✅ **Post-Migration Checklist**

After all migrations applied:

- [ ] All 9 tables created
- [ ] All tables have RLS enabled (`rowsecurity = true`)
- [ ] Auto-numbering triggers exist (contracts, invoices)
- [ ] No SQL errors in migration execution
- [ ] Backup saved (in case rollback needed)

---

## 🔧 **Troubleshooting**

### **Error: "relation already exists"**

If a table already exists from previous migrations:

```sql
-- Drop table and retry (WARNING: loses data)
DROP TABLE IF EXISTS kyc_sessions CASCADE;
-- Then re-run migration
```

### **Error: "permission denied"**

Make sure you're using the **SQL Editor** in Supabase Dashboard (not pgAdmin or other tools).

### **Error: "syntax error"**

1. Check you copied the **entire file** contents
2. Make sure no characters were lost in copy/paste
3. Try copying in smaller chunks

### **Migration order matters!**

Some migrations depend on others. Always apply in chronological order:
1. `20251101000001_` (KYC)
2. `20251101120000_` (Payment webhooks)
3. `20251102000001_` (Contracts)
4. `20251103000001_` (Zoho sync)
5. `20251104000001_` (Invoicing)
6. `20251105000001_` (Fulfillment)

---

## 🎉 **After Success**

Once all migrations applied:

1. **Commit migrations to git**:
   ```bash
   git add supabase/migrations/2025110*.sql
   git commit -m "feat: Add B2B Quote-to-Contract workflow database schema"
   git push
   ```

2. **Update tasks.md** to mark migrations as complete

3. **Test basic workflow**:
   - Create a test business quote
   - Verify KYC session can be created
   - Check contract generation works

4. **Proceed with external service setup**:
   - Configure Didit webhook
   - Setup Zoho Sign
   - Configure NetCash
   - Setup ICASA access

---

## 📞 **Need Help?**

If you encounter issues:
1. Check the SQL error message carefully
2. Try running migrations one at a time
3. Verify your Supabase account has admin access
4. Check if any tables from old migrations conflict

---

**Estimated Time**: 10-15 minutes  
**Difficulty**: Easy (copy/paste)  
**Risk**: Low (we have backup)
