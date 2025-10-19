# 🎭 Playwright Workflow Test Guide

## Overview

This guide walks you through testing the complete product approval workflow using Playwright MCP.

## Prerequisites

1. ✅ Migration applied (tables created)
2. ✅ Dev server running (`npm run dev`)
3. ✅ Products imported (via import script)
4. ✅ Admin user exists in database

---

## Workflow Test Steps

### Step 1: Verify Migration Applied

```bash
node scripts/test-product-import-workflow.js
```

Expected: `🎉 ALL TESTS PASSED!`

### Step 2: Import Products

```bash
node scripts/import-product-excel.js "docs/products/01_ACTIVE_PRODUCTS/BizFibreConnect/DFA Business Internet Access Service with ENNI-GNNI Infrastructure.xlsx"
```

Expected output:
```
✅ Import record created: <import-id>
✅ Added 5 products to approval queue
📊 Import Summary
View in admin: /admin/products/approvals/<import-id>
```

### Step 3: Start Development Server

```bash
npm run dev
```

Server should start on: `http://localhost:3006`

---

## Playwright Test Sequence

### Test 1: Navigate to Admin Login

**Playwright Commands:**
```
Navigate to: http://localhost:3006/admin/login
Take screenshot: admin-login-page.png
```

**Expected Result:**
- Login form visible
- Email and password fields present

### Test 2: Login as Admin

**Playwright Commands:**
```
Fill email field: admin@circletel.co.za
Fill password field: admin123
Click: Sign In button
Wait for navigation
Take screenshot: admin-dashboard.png
```

**Expected Result:**
- Redirect to `/admin` dashboard
- Admin sidebar visible

### Test 3: Navigate to Product Approvals

**Playwright Commands:**
```
Navigate to: http://localhost:3006/admin/products/approvals
Wait for page load
Take screenshot: product-approvals-pending.png
```

**Expected Result:**
- Page title: "Product Approvals"
- Filter tabs: Pending, Approved, Rejected
- Product cards visible (5 products)

### Test 4: Review Product Details

**Playwright Commands:**
```
Scroll to first product card
Take screenshot: product-card-details.png
Verify text present: "BizFibre Connect Lite"
Verify text present: "10/10 Mbps"
Verify text present: "R 1,699"
```

**Expected Result:**
- Product card shows:
  - Name: BizFibre Connect Lite
  - Speed: 10/10 Mbps
  - Price: R 1,699
  - Router: Reyee RG-EW1300G
  - Installation: R 2,500
  - Approve/Reject buttons

### Test 5: Approve First Product

**Playwright Commands:**
```
Click: Approve button (on first product)
Wait for success toast
Take screenshot: product-approved.png
Wait 2 seconds
Refresh page
Take screenshot: approved-product-moved.png
```

**Expected Result:**
- Success toast: "Product Approved"
- Product removed from Pending tab
- Pending count decreases (5 → 4)

### Test 6: Check Approved Tab

**Playwright Commands:**
```
Click: Approved tab
Wait for filter update
Take screenshot: approved-tab.png
Verify text present: "BizFibre Connect Lite"
```

**Expected Result:**
- Approved tab shows 1 product
- Product status badge: "approved"
- No Approve/Reject buttons (already processed)

### Test 7: Check Notifications

**Playwright Commands:**
```
Navigate to: http://localhost:3006/admin
Look for notification bell icon
Take screenshot: notification-bell.png
Click: Notification bell
Wait for dropdown
Take screenshot: notifications-dropdown.png
```

**Expected Result:**
- Notification bell has badge (unread count)
- Dropdown shows notification:
  - "New Product Import Ready for Review"
  - Message about 5 products

### Test 8: Verify in Database

**Playwright Commands:**
```
(Run via Node.js / Supabase query)
```

**Database Query:**
```sql
-- Check approved product in service_packages
SELECT id, name, speed, price, category, is_active
FROM service_packages
WHERE name = 'BizFibre Connect Lite'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
- 1 row returned
- `is_active` = true
- `category` = 'BizFibre Connect'

### Test 9: Reject a Product

**Playwright Commands:**
```
Navigate to: http://localhost:3006/admin/products/approvals
Click: Pending tab
Click: Reject button (on second product)
Wait for prompt dialog
Type: "Pricing needs review"
Submit dialog
Wait for success toast
Take screenshot: product-rejected.png
```

**Expected Result:**
- Success toast: "Product Rejected"
- Product removed from Pending
- Pending count decreases (4 → 3)

### Test 10: Check Rejected Tab

**Playwright Commands:**
```
Click: Rejected tab
Take screenshot: rejected-tab.png
Verify text present: "Pricing needs review"
```

**Expected Result:**
- Rejected tab shows 1 product
- Rejection reason visible: "Pricing needs review"

---

## Complete Test Results

After all tests, you should have:

- ✅ 1 product approved (in `service_packages`)
- ✅ 1 product rejected
- ✅ 3 products still pending
- ✅ 2+ notifications created
- ✅ Activity log entries for all actions

---

## Automated Playwright Test Script

I can help you run these tests automatically! Just tell me when:

1. Migration is applied
2. Dev server is running
3. You're ready to test

Then I'll use the Playwright MCP to:
- Navigate through all pages
- Fill forms
- Click buttons
- Take screenshots
- Verify results

---

## Manual Testing Checklist

If you want to test manually (without Playwright):

- [ ] Navigate to `/admin/products/approvals`
- [ ] See 5 pending products from Excel import
- [ ] Click Approve on first product
- [ ] Verify product moves to Approved tab
- [ ] Click Reject on second product
- [ ] Enter rejection reason
- [ ] Verify product moves to Rejected tab
- [ ] Check notification bell for updates
- [ ] Verify notifications show import info
- [ ] Query database to confirm product in `service_packages`

---

## Next Steps

Once migration is applied, let me know and I'll:

1. Run the E2E test script
2. Guide you through Playwright testing
3. Take screenshots at each step
4. Verify everything works end-to-end

**Ready to proceed?** Just confirm:
- [ ] Migration applied
- [ ] Tables created and verified
