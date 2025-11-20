# ZOHO Billing Manual Cleanup Guide

**Purpose**: Remove test customer from ZOHO Billing before running backfill scripts
**Created**: 2025-11-20
**Prerequisite**: CircleTel database cleanup script must be executed first

---

## Overview

During ZOHO Billing integration testing (Phase 2), one test customer was synced to ZOHO Billing:

- **CircleTel Email**: test@circletel.test
- **CircleTel Customer ID**: 0adb9dac-6512-4bb0-8592-60fe74434c78
- **CircleTel Account**: CT-2025-00001
- **ZOHO Customer ID**: 6179546000000820001
- **Sync Date**: 2025-11-20
- **Status**: Syncing (with error - "(0 , _sync_service__WEBPACK_IMPORTED_MODULE_2__.logZohoSync) is not a function")

This test record must be **deleted from ZOHO Billing** before running backfill scripts to ensure clean production data.

---

## Prerequisites

✅ **Before starting this manual cleanup:**

1. CircleTel database cleanup script has been executed
2. Test customer (test@circletel.test) has been deleted from CircleTel database
3. You have admin access to ZOHO Billing dashboard
4. You have ZOHO Billing login credentials

---

## Step-by-Step Cleanup Instructions

### Step 1: Access ZOHO Billing Dashboard

1. Open browser and navigate to: https://billing.zoho.com
2. Log in with your ZOHO account credentials
3. Select the appropriate organization (CircleTel)

### Step 2: Locate Test Customer

**Option A: Search by Customer ID**
1. Navigate to **Customers** from the main menu
2. Use the search bar
3. Enter: `6179546000000820001`
4. Press Enter

**Option B: Search by Email**
1. Navigate to **Customers**
2. Use the search bar
3. Enter: `test@circletel.test`
4. Press Enter

**Option C: Search by Account Number**
1. Navigate to **Customers**
2. Use the search bar
3. Enter: `CT-2025-00001`
4. Press Enter

### Step 3: Verify Customer Details

Before deletion, verify you have the correct customer:

- **Customer ID**: 6179546000000820001
- **Email**: test@circletel.test
- **Name**: Test User
- **Account Number**: CT-2025-00001 (if visible)
- **Custom Field** (if configured): CircleTel Customer ID = 0adb9dac-6512-4bb0-8592-60fe74434c78

### Step 4: Check for Associated Records

Before deleting, check if the customer has any associated records:

1. Click on the customer to view details
2. Check the following tabs:
   - **Subscriptions**: Should be 0 (test customer had no services)
   - **Invoices**: Should be 0 (test customer had no invoices)
   - **Payments**: Should be 0 (test customer made no payments)
   - **Credits**: Should be 0

**If any records exist:**
- Delete subscriptions first
- Then delete invoices
- Then delete payments
- Finally delete the customer

### Step 5: Delete Customer

1. From the customer detail page, click **More** (⋮) or **Actions** dropdown
2. Select **Delete Customer**
3. ZOHO will show a confirmation dialog:
   - Review the warning message
   - Ensure no active subscriptions exist
4. Click **Delete** to confirm

### Step 6: Verify Deletion

1. Return to **Customers** list
2. Search again for `6179546000000820001` or `test@circletel.test`
3. Confirm: **No results found**

---

## Troubleshooting

### Issue: Customer has active subscription

**Solution**:
1. Navigate to customer's **Subscriptions** tab
2. Cancel or delete each subscription
3. Wait for subscriptions to be removed
4. Retry customer deletion

### Issue: Customer has unpaid invoices

**Solution**:
1. Navigate to customer's **Invoices** tab
2. Mark invoices as **Void** or **Delete** them
3. Retry customer deletion

### Issue: Cannot find customer by ID

**Possible causes**:
1. Customer may have already been deleted
2. Wrong ZOHO organization selected
3. Insufficient permissions

**Solution**:
- Try searching by email (test@circletel.test)
- Verify you're in the correct ZOHO organization
- Check with ZOHO admin if permissions needed

### Issue: "This customer cannot be deleted" error

**Possible causes**:
1. Customer has associated transactions
2. Customer has pending payments
3. Customer has active recurring invoices

**Solution**:
1. Review all tabs for associated records
2. Delete/void all associated records first
3. Retry customer deletion

---

## Post-Cleanup Verification

After deletion, verify:

✅ Customer search returns no results
✅ Customer ID (6179546000000820001) not found
✅ Email (test@circletel.test) not found
✅ No orphaned subscriptions or invoices

---

## Next Steps

After ZOHO manual cleanup is complete:

1. ✅ Verify CircleTel database has 17 production customers (no ZOHO IDs)
2. ✅ Verify ZOHO Billing has 0 customers
3. 🚀 **Proceed with Phase 5**: Run ZOHO Billing backfill scripts
4. 📊 Monitor sync dashboard at `/admin/zoho-sync`

---

## Cleanup Confirmation Checklist

- [ ] Logged into ZOHO Billing dashboard
- [ ] Located test customer (ID: 6179546000000820001)
- [ ] Verified customer details match test@circletel.test
- [ ] Checked for associated records (subscriptions, invoices, payments)
- [ ] Deleted any associated records
- [ ] Deleted test customer
- [ ] Verified deletion (search returns no results)
- [ ] Ready to proceed with Phase 5 backfill

---

## Notes

- **Data Loss**: This is a one-way operation. Deleted ZOHO customers cannot be recovered.
- **Production Safety**: This guide is specifically for the test customer only. Do NOT delete any other customers.
- **Audit Trail**: ZOHO Billing may maintain an audit log of deletions.
- **Backup**: Consider exporting customer data before deletion if needed for audit purposes.

---

**Last Updated**: 2025-11-20
**Prepared By**: Claude Code + CircleTel Development Team
