# ZOHO Billing Pre-Backfill Checklist

Complete this checklist before running the live ZOHO Billing backfill to ensure a smooth and successful data sync.

---

## 📋 Checklist Overview

**Estimated Time:** 30-45 minutes
**Last Updated:** 2025-11-20
**Prerequisites:** Database cleanup complete, Phase 4 monitoring dashboard deployed

---

## 1️⃣ Database Cleanup Verification

### ✅ Task 1.1: Verify Cleanup Execution

**Action:** Confirm database cleanup script has been executed successfully.

```bash
# Check if cleanup was run
node scripts/execute-test-data-cleanup.js
```

**Expected Output:**
- ✅ Migration applied successfully
- ✅ 4 accounts marked as internal_test
- ✅ 0 test customers remaining
- ✅ 13 production customers ready for sync

**Verification Command:**
```sql
-- Run in Supabase SQL Editor
SELECT
  COUNT(*) FILTER (WHERE account_type = 'internal_test') as internal_test_accounts,
  COUNT(*) FILTER (WHERE account_type != 'internal_test') as production_customers,
  COUNT(*) FILTER (WHERE zoho_billing_customer_id IS NOT NULL) as already_synced
FROM customers;
```

**Expected Results:**
- `internal_test_accounts`: 4
- `production_customers`: 13
- `already_synced`: 0

**Status:** [ ] COMPLETE

---

### ✅ Task 1.2: Verify No Test Data Remaining

**Action:** Check for any remaining test data in the database.

**Verification Commands:**
```sql
-- Check for test emails
SELECT id, email, account_type, account_number
FROM customers
WHERE email LIKE '%test%'
  OR email LIKE '%demo%'
  OR first_name ILIKE '%test%';

-- Check for validation payments
SELECT id, reference, customer_email, amount, status
FROM payment_transactions
WHERE reference LIKE 'PAYMENT-METHOD-VALIDATION%';
```

**Expected Results:**
- 0 rows returned for both queries

**Status:** [ ] COMPLETE

---

## 2️⃣ ZOHO Billing Manual Cleanup

### ✅ Task 2.1: Delete Test Customer from ZOHO

**Action:** Manually delete test customer from ZOHO Billing dashboard.

**Test Customer Details:**
- **ZOHO Customer ID:** `6179546000000820001`
- **Email:** `test@circletel.test`
- **Account Number:** CT-2025-XXXX (deleted from CircleTel DB)

**Steps:**
1. Open guide: `docs/zoho/MANUAL_CLEANUP_GUIDE.md`
2. Log into ZOHO Billing dashboard
3. Navigate to Customers → All Customers
4. Search for customer ID: `6179546000000820001`
5. Verify customer details match test account
6. Check for associated records (subscriptions, invoices, payments)
7. Delete customer (permanent action - verify first!)

**Verification:**
```bash
# Search ZOHO for deleted customer (should return 404)
curl -X GET "https://www.zohoapis.com/billing/v1/customers/6179546000000820001" \
  -H "Authorization: Zoho-oauthtoken YOUR_ACCESS_TOKEN"
```

**Expected Response:** 404 Not Found or "Customer does not exist"

**Status:** [ ] COMPLETE

---

## 3️⃣ ZOHO Billing Setup Verification

### ✅ Task 3.1: Verify ZOHO Account Access

**Action:** Confirm access to ZOHO Billing dashboard.

**Checklist:**
- [ ] Can log into ZOHO Billing: https://billing.zoho.com
- [ ] Organization selected: CircleTel (or your org name)
- [ ] Billing plan active (not expired trial)
- [ ] Admin/Owner permissions confirmed

**Status:** [ ] COMPLETE

---

### ✅ Task 3.2: Verify Products/Plans Published to ZOHO

**Action:** Check that service packages are synced to ZOHO Billing.

**Admin Dashboard Check:**
1. Navigate to: `/admin/products/catalog`
2. Check "ZOHO Status" column
3. All active packages should show "Published"

**Database Check:**
```sql
-- Check published products
SELECT
  sp.id,
  sp.product_name,
  sp.monthly_price,
  pi.zoho_billing_plan_id,
  pi.last_synced_at
FROM service_packages sp
LEFT JOIN product_integrations pi
  ON sp.id = pi.service_package_id
  AND pi.integration_type = 'zoho_billing'
WHERE sp.status = 'active'
ORDER BY sp.product_name;
```

**Expected:**
- All active packages have `zoho_billing_plan_id` populated
- `last_synced_at` is recent (within last 7 days)

**If Not Published:**
```bash
# Publish unpublished products
# Navigate to /admin/products/catalog
# Select unpublished products
# Click "Publish Selected to ZOHO"
```

**Status:** [ ] COMPLETE

---

## 4️⃣ Environment Variables Verification

### ✅ Task 4.1: Verify Supabase Credentials

**Action:** Check Supabase environment variables exist.

```bash
# Check .env.local file
grep -E "^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=" .env.local
```

**Expected Output:**
```
NEXT_PUBLIC_SUPABASE_URL="https://agyjovdugmtopasyvlng.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."
```

**Status:** [ ] COMPLETE

---

### ✅ Task 4.2: Verify ZOHO API Credentials

**Action:** Check ZOHO Billing API credentials exist.

```bash
# Check .env.local file
grep -E "^(ZOHO_CLIENT_ID|ZOHO_CLIENT_SECRET|ZOHO_REFRESH_TOKEN|ZOHO_BILLING_ORGANIZATION_ID)=" .env.local
```

**Expected Output:**
```
ZOHO_CLIENT_ID="1000.XXXXXXXXXX"
ZOHO_CLIENT_SECRET="xxxxxxxxxxxxx"
ZOHO_REFRESH_TOKEN="1000.xxxxxxxxxxxxx"
ZOHO_BILLING_ORGANIZATION_ID="xxxxxxxxx"
```

**Status:** [ ] COMPLETE

---

### ✅ Task 4.3: Test ZOHO API Connectivity

**Action:** Verify ZOHO API credentials are valid and working.

**Test Script:**
```bash
# Test ZOHO API access
node -e "
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

async function testZohoAPI() {
  try {
    // Exchange refresh token for access token
    const tokenResponse = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
      params: {
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token'
      }
    });

    const accessToken = tokenResponse.data.access_token;
    console.log('✅ Access token obtained successfully');

    // Test API call - Get organization
    const orgResponse = await axios.get(
      'https://www.zohoapis.com/billing/v1/organizations/' + process.env.ZOHO_BILLING_ORGANIZATION_ID,
      {
        headers: { 'Authorization': 'Zoho-oauthtoken ' + accessToken }
      }
    );

    console.log('✅ ZOHO API connection successful');
    console.log('Organization:', orgResponse.data.organization.name);

  } catch (error) {
    console.error('❌ ZOHO API test failed:', error.message);
    process.exit(1);
  }
}

testZohoAPI();
"
```

**Expected Output:**
```
✅ Access token obtained successfully
✅ ZOHO API connection successful
Organization: CircleTel
```

**Status:** [ ] COMPLETE

---

## 5️⃣ Monitoring Dashboard Verification

### ✅ Task 5.1: Verify Admin Dashboard Access

**Action:** Check monitoring dashboard is deployed and accessible.

**Dashboard URL:** `/admin/zoho-sync`

**Checklist:**
- [ ] Dashboard loads without errors
- [ ] Overall sync statistics display (should show 0 synced)
- [ ] Recent activity log displays (should be empty or show cleanup)
- [ ] No failed syncs showing
- [ ] Filters and search working

**Status:** [ ] COMPLETE

---

### ✅ Task 5.2: Verify Sync Log Table Exists

**Action:** Check `zoho_sync_logs` table exists and is accessible.

```sql
-- Verify table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'zoho_sync_logs'
ORDER BY ordinal_position;

-- Check existing logs
SELECT
  entity_type,
  status,
  COUNT(*) as count
FROM zoho_sync_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY entity_type, status;
```

**Expected:**
- Table exists with all required columns
- May show recent cleanup activity logs

**Status:** [ ] COMPLETE

---

## 6️⃣ Dry-Run Verification

### ✅ Task 6.1: Run Full Dry-Run Test

**Action:** Execute complete backfill in dry-run mode to verify everything works.

```bash
# Run full dry-run
npm run zoho:backfill -- --dry-run
```

**Monitor Output For:**
- ✅ Phase 1: Customer backfill completes (13 customers)
- ✅ Phase 2: Subscription backfill completes (if any active services)
- ✅ Phase 3: Invoice backfill completes (if any manual invoices)
- ✅ Phase 4: Payment backfill completes (if any completed payments)
- ✅ No fatal errors
- ✅ All dry-run confirmations displayed

**Expected Summary:**
```
═══════════════════════════════════════════════════════════
📊 Backfill Summary
═══════════════════════════════════════════════════════════

✅ Phase 1: Customer Backfill
   Duration: X.XXs

✅ Phase 2: Subscription Backfill
   Duration: X.XXs

✅ Phase 3: Invoice Backfill
   Duration: X.XXs

✅ Phase 4: Payment Backfill
   Duration: X.XXs

═══════════════════════════════════════════════════════════
Total Duration: XX.XXs
Phases Completed: 4/4
═══════════════════════════════════════════════════════════

🔍 This was a DRY RUN. No actual changes were made to ZOHO.
```

**Status:** [ ] COMPLETE

---

### ✅ Task 6.2: Review Dry-Run Customer Details

**Action:** Verify correct customers will be synced (not internal test accounts).

**Expected Customers (13 total):**
1. ✅ ashwynw@newgengroup.co.za (CT-2025-00002) - Business
2. ✅ jdewee@gmail.com (CT-2025-00004) - Personal
3. ✅ watkins.ashwyn@gmail.com (CT-2025-00005) - Personal
4. ✅ melvinw@newgengroup.co.za (CT-2025-00006) - Personal
5. ✅ (Additional 9 production customers)

**Should NOT Include (4 internal test accounts):**
- ❌ devadmin@circletel.co.za (CT-2025-00022) - internal_test
- ❌ viewer@circletel.co.za (CT-2025-00019) - internal_test
- ❌ editor@circletel.co.za (CT-2025-00020) - internal_test
- ❌ product.manager@circletel.co.za (CT-2025-00021) - internal_test

**Status:** [ ] COMPLETE

---

## 7️⃣ Backup and Safety Measures

### ✅ Task 7.1: Create Database Backup

**Action:** Create Supabase database backup before running live sync.

**Supabase Dashboard:**
1. Navigate to: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng
2. Go to Database → Backups
3. Click "Create backup"
4. Name: "Pre-ZOHO-Backfill-2025-11-20"
5. Wait for completion
6. Download backup (optional but recommended)

**Status:** [ ] COMPLETE

---

### ✅ Task 7.2: Document Current State

**Action:** Record current database state for rollback reference.

```sql
-- Save current counts
SELECT
  'customers' as table_name,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE zoho_billing_customer_id IS NOT NULL) as synced
FROM customers
WHERE account_type != 'internal_test'

UNION ALL

SELECT
  'customer_services',
  COUNT(*),
  COUNT(*) FILTER (WHERE zoho_subscription_id IS NOT NULL)
FROM customer_services
WHERE status = 'active'

UNION ALL

SELECT
  'customer_invoices',
  COUNT(*),
  COUNT(*) FILTER (WHERE zoho_billing_invoice_id IS NOT NULL)
FROM customer_invoices
WHERE invoice_type IN ('installation', 'pro_rata', 'equipment', 'adjustment')

UNION ALL

SELECT
  'payment_transactions',
  COUNT(*),
  COUNT(*) FILTER (WHERE zoho_payment_id IS NOT NULL)
FROM payment_transactions
WHERE status = 'completed';
```

**Record Results Here:**
| Table | Total | Synced |
|-------|-------|--------|
| customers | _____ | _____ |
| customer_services | _____ | _____ |
| customer_invoices | _____ | _____ |
| payment_transactions | _____ | _____ |

**Status:** [ ] COMPLETE

---

## 8️⃣ Team Notification and Timing

### ✅ Task 8.1: Choose Appropriate Time

**Action:** Schedule backfill during low-traffic period.

**Recommended Times:**
- ✅ Outside business hours (after 6 PM or before 8 AM)
- ✅ Weekday evening or weekend
- ✅ When support team is available (in case of issues)

**Selected Time:** ________________

**Status:** [ ] COMPLETE

---

### ✅ Task 8.2: Notify Team Members

**Action:** Inform relevant team members about backfill execution.

**Notify:**
- [ ] Development team
- [ ] Operations/DevOps
- [ ] Customer support team (in case customers notice changes)
- [ ] Management/stakeholders

**Notification Message Template:**
```
Subject: ZOHO Billing Backfill - [Date/Time]

Team,

We will be executing the ZOHO Billing data backfill on [DATE] at [TIME].

This will sync 13 production customers and their associated data
(subscriptions, invoices, payments) to ZOHO Billing.

Expected duration: 30-60 minutes
Impact: None expected (read/write operations on existing data)
Rollback plan: Database backup available

Please be on standby in case of any issues.

- Dev Team
```

**Status:** [ ] COMPLETE

---

## 9️⃣ Final Pre-Flight Checks

### ✅ Task 9.1: Review Backfill Guide

**Action:** Re-read the backfill guide to refresh on commands and procedures.

**Guide Location:** `docs/zoho/BACKFILL_GUIDE.md`

**Key Sections to Review:**
- [ ] Quick Start commands
- [ ] Troubleshooting section
- [ ] Rate limiting information
- [ ] Monitoring instructions
- [ ] Post-backfill verification steps

**Status:** [ ] COMPLETE

---

### ✅ Task 9.2: Prepare Terminal Windows

**Action:** Set up your terminal environment for monitoring.

**Recommended Setup:**
1. **Terminal 1:** Run backfill script
2. **Terminal 2:** Monitor database (Supabase SQL Editor open)
3. **Browser Tab 1:** Admin dashboard (`/admin/zoho-sync`)
4. **Browser Tab 2:** ZOHO Billing dashboard
5. **Browser Tab 3:** Supabase dashboard (for DB monitoring)

**Status:** [ ] COMPLETE

---

### ✅ Task 9.3: Clear Schedule

**Action:** Ensure you have dedicated time for backfill and monitoring.

**Time Required:**
- Backfill execution: 30-60 minutes
- Monitoring and verification: 30 minutes
- Buffer for troubleshooting: 1 hour
- **Total:** 2-2.5 hours

**Availability Confirmed:** [ ] YES

**Status:** [ ] COMPLETE

---

## 🚀 Ready for Launch Checklist

### Final Verification

**All Tasks Complete:**
- [ ] Section 1: Database Cleanup Verification (2 tasks)
- [ ] Section 2: ZOHO Billing Manual Cleanup (1 task)
- [ ] Section 3: ZOHO Billing Setup Verification (2 tasks)
- [ ] Section 4: Environment Variables Verification (3 tasks)
- [ ] Section 5: Monitoring Dashboard Verification (2 tasks)
- [ ] Section 6: Dry-Run Verification (2 tasks)
- [ ] Section 7: Backup and Safety Measures (2 tasks)
- [ ] Section 8: Team Notification and Timing (2 tasks)
- [ ] Section 9: Final Pre-Flight Checks (3 tasks)

**Total:** 19 tasks

---

## ✅ Execute Live Backfill

Once all checklist items are complete, proceed with:

```bash
# Execute live backfill
npm run zoho:backfill
```

**Monitor carefully and follow post-backfill verification in BACKFILL_GUIDE.md**

---

## 📞 Emergency Contacts

**In case of critical issues during backfill:**

1. **Stop Backfill:** Press `Ctrl+C` in terminal
2. **Check Logs:** Review `/admin/zoho-sync` for errors
3. **Database Status:** Run verification queries in Section 7.2
4. **Rollback:** Restore from Supabase backup if needed
5. **Escalate:** Contact senior developer or DevOps team

---

## 📝 Checklist Completion Log

**Completed By:** ________________
**Date:** ________________
**Time Started:** ________________
**Time Completed:** ________________
**All Tasks Complete:** [ ] YES / [ ] NO
**Ready for Live Backfill:** [ ] YES / [ ] NO

**Notes/Issues:**
```
[Add any notes, issues encountered, or deviations from checklist]
```

---

**Version:** 1.0
**Last Updated:** 2025-11-20
**Next Review:** After successful backfill completion
