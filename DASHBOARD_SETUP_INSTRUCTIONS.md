# Customer Dashboard Setup Instructions

**Status:** ✅ Database schema applied  
**Next:** Create test data and verify functionality

---

## Step 1: Create Test Data ✅ (Ready to Run)

### Option A: Using Supabase Dashboard (Recommended)

1. **Open Supabase SQL Editor:**
   - Go to your Supabase project
   - Click **SQL Editor** in left sidebar
   - Click **New Query**

2. **Run the seed script:**
   - Open `scripts/seed-dashboard-test-data.sql`
   - **IMPORTANT:** Update line 13 with your test customer email:
     ```sql
     WHERE email = 'YOUR_EMAIL@example.com' -- CHANGE THIS TO YOUR TEST EMAIL
     ```
   - Copy the entire script
   - Paste into Supabase SQL Editor
   - Click **Run**

3. **Verify success:**
   - You should see messages like:
     ```
     Found customer: [uuid]
     Created service: [uuid]
     Created/updated billing record
     Created 2 sample invoices
     Created usage record
     ✅ Test data created successfully!
     ```

### Option B: Manual Test Data Creation

If you don't have a test customer yet, create one first:

```sql
-- 1. Create test customer (if needed)
INSERT INTO customers (
  email,
  first_name,
  last_name,
  phone,
  auth_user_id
) VALUES (
  'test@circletel.co.za',
  'Test',
  'Customer',
  '+27123456789',
  'YOUR_AUTH_USER_ID_HERE'  -- Get this from auth.users table
);
```

Then run the seed script above.

---

## Step 2: Test the Dashboard

### A. Test API Endpoints

Use Thunder Client, Postman, or curl to test:

**1. Get Dashboard Summary:**
```bash
GET http://localhost:3004/api/dashboard/summary
Authorization: Bearer YOUR_SESSION_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "uuid",
      "email": "test@circletel.co.za",
      "firstName": "Test",
      "lastName": "Customer"
    },
    "services": [
      {
        "package_name": "HomeFibre Connect 100",
        "service_type": "fibre",
        "status": "active",
        "monthly_price": 899
      }
    ],
    "billing": {
      "account_balance": 0,
      "payment_method": "debit_order",
      "payment_status": "current"
    },
    "stats": {
      "activeServices": 1,
      "totalOrders": 0,
      "accountBalance": 0
    }
  }
}
```

**2. Get Services:**
```bash
GET http://localhost:3004/api/dashboard/services
Authorization: Bearer YOUR_SESSION_TOKEN
```

**3. Get Billing:**
```bash
GET http://localhost:3004/api/dashboard/billing
Authorization: Bearer YOUR_SESSION_TOKEN
```

### B. Test Dashboard Page

1. **Login as test customer:**
   - Go to `http://localhost:3004/auth/login`
   - Login with your test customer credentials

2. **Navigate to dashboard:**
   - Go to `http://localhost:3004/dashboard`

3. **What you should see:**
   - ✅ Welcome message with customer name
   - ✅ Stats cards showing:
     - Active Services: 1
     - Total Orders: 0
     - Account Balance: R0.00
     - Pending Orders: 0
   - ✅ Service card showing "HomeFibre Connect 100"
   - ✅ Billing card showing payment method
   - ✅ No loading spinner (data loaded)
   - ✅ No error messages

4. **What indicates it's working:**
   - Real customer name (not "Premium Family")
   - Real package name (not placeholder)
   - South African currency (R, not $)
   - Real data from database

---

## Step 3: Troubleshooting

### Issue: "Customer not found"

**Cause:** No customer record linked to auth user

**Fix:**
```sql
-- Check if customer exists
SELECT * FROM customers WHERE email = 'your@email.com';

-- If not, create one
INSERT INTO customers (email, first_name, last_name, auth_user_id)
VALUES ('your@email.com', 'First', 'Last', 'auth_user_id_from_auth_users_table');
```

### Issue: "Unauthorized" error

**Cause:** Session token not being sent

**Fix:**
- Check browser console for errors
- Verify `CustomerAuthProvider` is working
- Check session in browser DevTools → Application → Local Storage

### Issue: Dashboard shows "No data available"

**Cause:** API returned empty data

**Fix:**
1. Check browser console for API errors
2. Verify test data was created:
   ```sql
   SELECT COUNT(*) FROM customer_services;
   SELECT COUNT(*) FROM customer_billing;
   ```
3. Check API response in Network tab

### Issue: Dashboard shows placeholder data

**Cause:** Frontend not updated to use real data

**Fix:**
- The dashboard page needs Phase 2 UI updates
- Currently shows loading/error states correctly
- Full UI replacement coming in Phase 2

---

## Step 4: Verify Database Records

Run this query to see all your test data:

```sql
-- Customer info
SELECT 
  c.email,
  c.first_name,
  c.last_name,
  cs.package_name,
  cs.status as service_status,
  cb.payment_status,
  cb.account_balance,
  (SELECT COUNT(*) FROM customer_invoices WHERE customer_id = c.id) as invoice_count
FROM customers c
LEFT JOIN customer_services cs ON c.id = cs.customer_id AND cs.active = true
LEFT JOIN customer_billing cb ON c.id = cb.customer_id
WHERE c.email = 'YOUR_EMAIL@example.com';
```

**Expected Output:**
```
email                  | first_name | last_name | package_name           | service_status | payment_status | account_balance | invoice_count
-----------------------|------------|-----------|------------------------|----------------|----------------|-----------------|---------------
test@circletel.co.za  | Test       | Customer  | HomeFibre Connect 100  | active         | current        | 0.00            | 2
```

---

## Step 5: Next Steps (Phase 2)

Once test data is working:

1. **Complete dashboard UI** - Replace remaining placeholder content
2. **Add CircleTel branding** - Orange colors, logo
3. **Create additional pages:**
   - `/dashboard/services` - All services list
   - `/dashboard/billing` - Invoices and payment history
   - `/dashboard/orders` - Order tracking
   - `/dashboard/profile` - Edit profile

4. **Integrate with order flow:**
   - When order completes → create `customer_services` record
   - Generate monthly invoices
   - Update billing status

---

## Quick Reference

**Database Tables:**
- `customer_services` - Active subscriptions
- `customer_billing` - Payment info
- `customer_invoices` - Invoice history
- `customer_usage` - Data usage (optional)

**API Endpoints:**
- `GET /api/dashboard/summary` - Complete overview
- `GET /api/dashboard/services` - All services
- `GET /api/dashboard/billing` - Billing & invoices
- `GET /api/dashboard/orders` - Order history

**Test Data Script:**
- `scripts/seed-dashboard-test-data.sql`

**Documentation:**
- `docs/analysis/CUSTOMER_DASHBOARD_ANALYSIS.md` - Full analysis
- `PHASE1_DASHBOARD_COMPLETE.md` - Implementation summary

---

## Success Criteria ✅

- [ ] Test data created successfully
- [ ] API endpoints return real data
- [ ] Dashboard page loads without errors
- [ ] Customer name displays correctly
- [ ] Service information shows real package
- [ ] Billing info displays
- [ ] Stats cards show accurate counts
- [ ] No placeholder data visible

Once all checked, Phase 1 is complete! 🎉
