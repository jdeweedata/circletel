# 🚀 START HERE - Complete Workflow Test

## What We're About to Test

A complete end-to-end product import and approval workflow:

```
Excel File → Import Script → Approval Queue → Admin UI → Approve → Database → Frontend
     ↓            ↓              ↓              ↓          ↓          ↓         ↓
  5 Products   Parse Data    Notifications   Review    Service   Products   Display
```

---

## 📋 Pre-Flight Checklist

Before we start, you need:

1. **Supabase Dashboard Access**
   - URL: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng
   - You should be logged in as project owner

2. **Excel File** (already have it)
   - Location: `docs/products/01_ACTIVE_PRODUCTS/BizFibreConnect/DFA Business Internet Access Service with ENNI-GNNI Infrastructure.xlsx`
   - Contains: 5 BizFibre Connect products

3. **Development Environment**
   - Node.js installed: ✅
   - Dependencies installed: ✅ (`npm install` already done)

---

## 🎬 The Complete Workflow (Step-by-Step)

### STEP 1: Apply Database Migration (⏱️ 2 minutes)

**Action Required:** You need to do this manually (Supabase MCP is read-only)

1. **Open Supabase SQL Editor:**

   https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql/new

2. **Copy the migration SQL:**
   ```bash
   # View the migration file:
   cat supabase/migrations/20251019000002_create_product_approval_system.sql

   # Or open it in your editor
   ```

3. **Paste into SQL Editor and click RUN**

4. **Verify tables created:**
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
   );
   ```

   **Expected:** 5 rows returned

---

### STEP 2: Test Database Setup (⏱️ 30 seconds)

Once migration is applied, run this:

```bash
node scripts/test-product-import-workflow.js
```

**Expected Output:**
```
✅ Passed:   11
❌ Failed:   0
🎉 ALL TESTS PASSED! Workflow is ready to use.
```

---

### STEP 3: Import Products (⏱️ 1 minute)

Run the import script:

```bash
node scripts/import-product-excel.js "docs/products/01_ACTIVE_PRODUCTS/BizFibreConnect/DFA Business Internet Access Service with ENNI-GNNI Infrastructure.xlsx"
```

**Expected Output:**
```
📦 Starting Product Import...
📖 Reading Excel file...
🔍 Parsing products...
   Found 5 products

💾 Creating product import record...
✅ Import record created: <uuid>

📋 Adding products to approval queue...
✅ Added 5 products to approval queue

📊 Import Summary
Import ID: <uuid>
Category: BizFibre Connect
Products: 5
Status: pending
View in admin: /admin/products/approvals/<uuid>
```

---

### STEP 4: Start Development Server (⏱️ 30 seconds)

In a **separate terminal**:

```bash
npm run dev
```

**Expected:** Server starts at `http://localhost:3006`

---

### STEP 5: Playwright E2E Test (⏱️ 5 minutes)

**Now I can help you!** Once steps 1-4 are complete, tell me and I'll:

1. **Navigate to admin login** (`http://localhost:3006/admin/login`)
2. **Login as admin** (admin@circletel.co.za / admin123)
3. **Navigate to product approvals** (`/admin/products/approvals`)
4. **Take screenshot** of pending products
5. **Click Approve** on first product
6. **Verify success** toast notification
7. **Switch to Approved tab**
8. **Take screenshot** of approved product
9. **Check notification bell** for updates
10. **Verify in database** that product was added to `service_packages`

---

## 🎭 Playwright Test Commands (For Me to Run)

Once you confirm steps 1-4 are done, I'll execute:

```javascript
// 1. Navigate to login
browser.navigate('http://localhost:3006/admin/login')
browser.takeScreenshot('1-login-page.png')

// 2. Login
browser.fillForm([
  { name: 'Email', type: 'textbox', value: 'admin@circletel.co.za' },
  { name: 'Password', type: 'textbox', value: 'admin123' }
])
browser.click('Sign In button')
browser.takeScreenshot('2-admin-dashboard.png')

// 3. Navigate to approvals
browser.navigate('http://localhost:3006/admin/products/approvals')
browser.takeScreenshot('3-pending-approvals.png')

// 4. Approve first product
browser.click('Approve button')
browser.takeScreenshot('4-product-approved.png')

// 5. Verify approved tab
browser.click('Approved tab')
browser.takeScreenshot('5-approved-tab.png')

// 6. Check notifications
browser.click('Notification bell')
browser.takeScreenshot('6-notifications.png')
```

---

## ✅ Success Criteria

After the complete workflow, you should have:

### Database State:
- ✅ 1 import record in `product_imports`
- ✅ 5 records in `product_approval_queue` (1 approved, 4 pending)
- ✅ 1 record in `service_packages` (the approved product)
- ✅ 1+ notifications in `notifications` table

### UI State:
- ✅ Admin panel shows 5 products initially
- ✅ After approval: 4 pending, 1 approved
- ✅ Notification bell shows unread count
- ✅ Notifications dropdown shows import notification

### Screenshots:
- ✅ Login page
- ✅ Admin dashboard
- ✅ Pending approvals (5 products)
- ✅ Product card details
- ✅ Success toast after approval
- ✅ Approved tab (1 product)
- ✅ Notifications dropdown

---

## 🚨 What to Do Right Now

### Option A: Apply Migration Manually

1. Open: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql/new
2. Copy: `supabase/migrations/20251019000002_create_product_approval_system.sql`
3. Paste and Run
4. Come back here and say "Migration applied"

### Option B: I Can Guide You Step-by-Step

Just say: **"Guide me through applying the migration"**

And I'll:
- Show you exactly what to copy
- Walk you through the Supabase Dashboard
- Verify each step works
- Then proceed with Playwright testing

---

## 📚 Documentation Reference

- **Quick Start**: `PRODUCT_IMPORT_QUICKSTART.md`
- **Complete Guide**: `docs/features/PRODUCT_APPROVAL_WORKFLOW_GUIDE.md`
- **Playwright Test Plan**: `PLAYWRIGHT_WORKFLOW_TEST.md`
- **Migration Instructions**: `APPLY_MIGRATION_NOW.md`

---

## ❓ Questions?

**Q: Do I need to create admin users first?**
A: No, the test uses existing admin users. If none exist, notifications won't be sent (but everything else works).

**Q: Will this affect my production data?**
A: No, this is in your dev database. The import script creates test records that can be cleaned up.

**Q: How long does this take?**
A: 5-10 minutes total (2 min migration + 8 min testing)

**Q: Can I skip the Playwright test?**
A: Yes! You can test manually in the browser instead.

---

## 🎯 Ready to Start?

Tell me one of these:

1. **"Migration applied"** → I'll proceed with E2E test
2. **"Guide me"** → I'll walk you through step-by-step
3. **"Skip to manual testing"** → I'll give you manual test instructions

What would you like to do?
