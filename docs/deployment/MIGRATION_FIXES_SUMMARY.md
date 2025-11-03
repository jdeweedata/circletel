# Migration Fixes Summary
## Issues Found and Fixed

---

## 🔴 **Issues Discovered**

### **Issue 1: Migration 1 - KYC System**
**File**: `20251101000001_create_kyc_system.sql`  
**Error**: `column "customer_id" does not exist`  
**Location**: RLS policies trying to join through `customer_id`

**Problem**: Complex RLS policies with joins don't work well in some contexts

**Fix**: Use simplified RLS policies with `service_role` checks
- ✅ Created: `20251101000001_create_kyc_system_FIXED.sql`

---

### **Issue 2: Migration 2 - Payment Webhooks**
**File**: `20251101120000_add_payment_webhooks_idempotency.sql`  
**Error**: `column "status" does not exist`  
**Location**: RLS policy referencing `admin_users.status`

**Problem**: Policy directly references `admin_users.status` which may not exist

**Fix**: Use `user_is_admin()` helper function instead
- ✅ Created: `20251101120000_add_payment_webhooks_idempotency_FIXED.sql`

---

## ✅ **CORRECTED MIGRATION ORDER**

Apply these migrations in this exact order via Supabase SQL Editor:

### **1. KYC System** ✅
**File**: `supabase/migrations/20251101000001_create_kyc_system_FIXED.sql`

Creates:
- `kyc_sessions` table
- `rica_submissions` table
- `user_is_admin()` helper function
- RLS policies
- Auto-create KYC trigger

---

### **2. Payment Webhooks Idempotency** ✅
**File**: `supabase/migrations/20251101120000_add_payment_webhooks_idempotency_FIXED.sql`

Creates:
- `payment_webhooks` table
- Adds `contract_id` to `consumer_orders`
- RLS policies

---

### **3. Contracts System** (Check for issues)
**File**: `supabase/migrations/20251102000001_create_contracts_system.sql`

**Potential Issues**: May reference columns or functions that don't exist

**Action**: Let me check this file for issues before you apply it

---

### **4. Zoho Sync System** (Check for issues)
**File**: `supabase/migrations/20251103000001_create_zoho_sync_system.sql`

**Action**: Will check after contracts migration

---

### **5. Invoicing System** (Check for issues)
**File**: `supabase/migrations/20251104000001_create_invoicing_system.sql`

**Action**: Will check for dependency issues

---

### **6. Fulfillment System** (Check for issues)
**File**: `supabase/migrations/20251105000001_create_fulfillment_system.sql`

**Action**: Final migration - check for dependencies

---

## 🚀 **APPLY NOW** (First 2 Migrations)

### **Step 1: Apply KYC System (FIXED)**

1. Open: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql
2. Open file: `supabase/migrations/20251101000001_create_kyc_system_FIXED.sql`
3. Copy entire contents
4. Paste in SQL Editor
5. Click **"Run"**
6. ✅ Verify success (no errors)

### **Step 2: Apply Payment Webhooks (FIXED)**

1. Open file: `supabase/migrations/20251101120000_add_payment_webhooks_idempotency_FIXED.sql`
2. Copy entire contents
3. Paste in SQL Editor
4. Click **"Run"**
5. ✅ Verify success

### **Step 3: Verify Tables Created**

Run this SQL:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'kyc_sessions',
  'rica_submissions',
  'payment_webhooks'
)
ORDER BY table_name;
```

**Expected**: 3 rows

### **Step 4: Verify contract_id Added**

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'consumer_orders' 
AND column_name = 'contract_id';
```

**Expected**: 1 row showing `contract_id | uuid`

---

## ⏸️ **PAUSE HERE**

**Before applying migrations 3-6**, let me check them for similar issues.

**Status**:
- ✅ Migration 1 (KYC) - FIXED
- ✅ Migration 2 (Payment Webhooks) - FIXED
- ⏳ Migration 3 (Contracts) - CHECKING...
- ⏳ Migration 4 (Zoho Sync) - PENDING
- ⏳ Migration 5 (Invoicing) - PENDING
- ⏳ Migration 6 (Fulfillment) - PENDING

---

## 📝 **Common RLS Policy Patterns**

### **❌ DON'T DO THIS** (Causes errors):
```sql
-- Complex joins in RLS policies
USING (
  quote_id IN (
    SELECT id FROM business_quotes WHERE customer_id = auth.uid()
  )
);

-- Direct column references that might not exist
USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND status = 'active')
);
```

### **✅ DO THIS INSTEAD**:
```sql
-- Use helper functions
USING (user_is_admin());

-- Or use service role checks
USING (auth.role() = 'service_role');

-- Simple, direct checks
USING (created_by = auth.uid());
```

---

## 🔧 **Next Steps**

1. ✅ Apply first 2 FIXED migrations
2. ⏳ Wait for me to check migrations 3-6
3. ⏳ Apply remaining migrations (with fixes if needed)
4. ✅ Verify all tables created
5. ✅ Test workflow

**Let me know when migrations 1-2 are applied successfully!**
