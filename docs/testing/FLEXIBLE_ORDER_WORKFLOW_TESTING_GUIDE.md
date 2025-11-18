# Flexible Order Workflow Testing Guide

**Document Version:** 1.0
**Last Updated:** 2025-01-18
**Purpose:** Production testing guide for flexible order workflow that allows installation scheduling before payment method registration

## Overview

This document provides comprehensive testing procedures for the new flexible order workflow implemented in the CircleTel admin system. The key change is that installation can now be scheduled at ANY point in the order lifecycle, including before payment method registration.

### What Changed

**Old Workflow (Rigid):**
```
pending → payment_method_pending → payment_method_registered → installation_scheduled → installation_in_progress → installation_completed → active
```

**New Workflow (Flexible):**
```
pending ──┬──→ payment_method_pending ──┬──→ payment_method_registered ──→ installation_scheduled
          │                               │                                          ↓
          └───────────────────────────────┴──→ installation_scheduled ←─────────────┘
                                                          ↓
                                          installation_in_progress ──→ installation_completed
                                                                                ↓
                                          ←──────── payment_method_pending ←───┤
                                                          ↓
                                          payment_method_registered ──→ active
```

**Key Flexibility Points:**
1. Can schedule installation directly from `pending` (skip payment registration entirely)
2. Can schedule installation from `payment_method_pending` (payment process in progress)
3. Can add payment method after installation is scheduled
4. Can add payment method after installation is completed
5. Can return to payment steps from `installation_completed` before activation

## Testing Environment

**Production URL:** https://www.circletel.co.za/admin/orders
**Test Account:** Use admin credentials with Orders module permissions
**Prerequisites:**
- Admin user with `orders:read` and `orders:write` permissions
- Test consumer orders in various statuses
- Access to order detail pages

---

## Test Suite 1: Status Transition Validation

### Test 1.1: Direct Installation Scheduling from Pending

**Objective:** Verify installation can be scheduled without requiring payment method first

**Steps:**
1. Navigate to `/admin/orders`
2. Find an order with status `pending`
3. Click "Update Status" action
4. In the status dropdown, verify `Installation Scheduled` is available
5. Select `Installation Scheduled`
6. Set installation date (tomorrow or later)
7. Add optional notes
8. Click "Update Status"

**Expected Results:**
✅ Status updates to `installation_scheduled`
✅ Installation date is saved
✅ Order appears in "Today's Installations" widget (if scheduled for today)
✅ Toast notification shows success
✅ Order history logs the change
✅ Customer receives installation scheduled email

**SQL Verification:**
```sql
SELECT
  id,
  order_number,
  status,
  installation_scheduled_date,
  updated_at
FROM consumer_orders
WHERE order_number = 'ORD-YYYY-NNNN';

SELECT * FROM order_status_history
WHERE entity_id = 'order-uuid'
ORDER BY created_at DESC
LIMIT 1;
```

---

### Test 1.2: Payment Registration After Installation Scheduled

**Objective:** Verify payment method can be added after installation is scheduled

**Steps:**
1. Find an order with status `installation_scheduled`
2. Click "Update Status"
3. Verify both `Payment Method Pending` and `Payment Method Registered` are available
4. Select `Payment Method Registered`
5. Add notes: "Customer registered payment method via dashboard"
6. Click "Update Status"

**Expected Results:**
✅ Status updates to `payment_method_registered`
✅ Installation date is preserved
✅ Order still appears in installation widgets
✅ Toast notification shows success

**SQL Verification:**
```sql
SELECT
  status,
  installation_scheduled_date,
  payment_method_id
FROM consumer_orders
WHERE order_number = 'ORD-YYYY-NNNN';
```

---

### Test 1.3: Payment Registration After Installation Completed

**Objective:** Verify payment method can be added after installation completes

**Steps:**
1. Find an order with status `installation_completed`
2. Click "Update Status"
3. Verify `Payment Method Pending` and `Payment Method Registered` are available
4. Select `Payment Method Registered`
5. Add notes: "Installation completed. Payment method added via customer dashboard."
6. Click "Update Status"

**Expected Results:**
✅ Status updates to `payment_method_registered`
✅ `installation_completed_at` timestamp is preserved
✅ Order can now transition to `active`

---

### Test 1.4: Installation Scheduling During Payment Process

**Objective:** Verify installation can be scheduled while payment registration is in progress

**Steps:**
1. Find an order with status `payment_method_pending`
2. Click "Update Status"
3. Select `Installation Scheduled`
4. Set installation date
5. Add notes: "Installation can proceed. Payment method to follow."
6. Click "Update Status"

**Expected Results:**
✅ Status updates to `installation_scheduled`
✅ Installation date is saved
✅ Payment pending status is effectively replaced

---

### Test 1.5: Invalid Transition Prevention

**Objective:** Verify invalid status transitions are still blocked

**Steps:**
1. Find an order with status `cancelled`
2. Click "Update Status"
3. Verify dropdown shows NO available statuses (cancelled is terminal)

**Expected Results:**
✅ No status options available (or only shows "Cancelled" as current)
✅ Cannot change status from cancelled

---

## Test Suite 2: Admin UI Quick Filters

### Test 2.1: "Needs Payment Method" Filter

**Objective:** Verify filter includes orders at all stages needing payment

**Steps:**
1. Navigate to `/admin/orders`
2. Click "Needs Payment Method" quick filter
3. Review filtered results

**Expected Results:**
✅ Shows orders with status:
   - `pending`
   - `payment_method_pending`
   - `installation_scheduled` (if no payment method)
   - `installation_in_progress` (if no payment method)

✅ Does NOT show:
   - `payment_method_registered`
   - `active`
   - `cancelled`

**Manual Verification:**
Check 5 random orders in filtered results. Confirm each has one of the expected statuses.

---

### Test 2.2: "Ready to Schedule" Filter

**Objective:** Verify filter shows orders ready for installation scheduling

**Steps:**
1. Click "Ready to Schedule" quick filter
2. Review filtered results

**Expected Results:**
✅ Shows orders with status:
   - `pending`
   - `payment_method_pending`
   - `payment_method_registered`

✅ Does NOT show:
   - `installation_scheduled` (already scheduled)
   - `installation_in_progress`
   - `installation_completed`
   - `active`

---

### Test 2.3: "Today's Installations" Widget

**Objective:** Verify widget shows all installations scheduled for today

**Steps:**
1. From dashboard, view "Today's Installations" widget
2. Click "View All" to see full list
3. Note the count

**Expected Results:**
✅ Shows count of orders where `installation_scheduled_date = today`
✅ Includes orders in statuses:
   - `installation_scheduled`
   - `installation_in_progress`

✅ Clicking "View All" filters orders page correctly

---

### Test 2.4: "Orders Requiring Attention" Widget

**Objective:** Verify widget captures orders needing admin action

**Steps:**
1. View "Orders Requiring Attention" widget
2. Check each order in the list

**Expected Results:**
✅ Shows orders with:
   - Status `pending` for >24 hours
   - Status `payment_method_pending` for >48 hours
   - Status `installation_scheduled` with date in past
   - Status `failed`

---

## Test Suite 3: Status Update Modal UI

### Test 3.1: All Statuses Displayed

**Objective:** Verify modal shows complete status list

**Steps:**
1. Open any order detail page
2. Click "Update Status"
3. Open the status dropdown

**Expected Results:**
✅ Dropdown includes ALL statuses:
   1. Pending
   2. Payment Method Pending
   3. Payment Method Registered
   4. Installation Scheduled
   5. Installation In Progress
   6. Installation Completed
   7. Active
   8. Suspended
   9. Failed
   10. Cancelled

✅ Each status has:
   - Label (e.g., "Installation Scheduled")
   - Description (e.g., "Installation date confirmed (payment method can be added later)")

---

### Test 3.2: Conditional Fields Rendering

**Objective:** Verify fields appear/disappear based on selected status

**Steps:**
1. Open status update modal
2. Select `Installation Scheduled`
3. Verify installation date field appears (required)
4. Change to `Cancelled`
5. Verify notes field becomes required
6. Change to `Active`
7. Verify both fields become optional

**Expected Results:**
✅ Installation date field:
   - Appears when status = `installation_scheduled`
   - Required when status = `installation_scheduled`
   - Hidden for other statuses

✅ Notes field:
   - Always visible
   - Required when status = `cancelled`
   - Optional for other statuses

---

### Test 3.3: Installation Date Validation

**Objective:** Verify installation date constraints

**Steps:**
1. Select `Installation Scheduled` status
2. Try to set date to yesterday
3. Try to set date to today
4. Try to set date to 61 days from now
5. Set valid date (tomorrow)

**Expected Results:**
✅ Cannot select past dates (date picker constraint)
✅ Cannot select today (min date = tomorrow)
✅ Cannot select dates >60 days out (max date constraint)
✅ Valid dates (tomorrow to +60 days) work correctly

---

## Test Suite 4: Integration & Workflow Tests

### Test 4.1: End-to-End Flexible Flow (Installation First)

**Objective:** Test complete workflow with installation before payment

**Steps:**
1. Create new order (or find `pending` order)
2. Update status: `pending` → `installation_scheduled` (set date to tomorrow)
3. Wait 1 minute, verify email sent
4. Update status: `installation_scheduled` → `installation_in_progress`
5. Update status: `installation_in_progress` → `installation_completed`
6. Update status: `installation_completed` → `payment_method_registered`
7. Update status: `payment_method_registered` → `active`

**Expected Results:**
✅ All transitions succeed
✅ Order progresses logically
✅ Installation date preserved throughout
✅ `installation_completed_at` timestamp recorded
✅ `activation_date` recorded at final step
✅ Customer receives notifications at each step

---

### Test 4.2: End-to-End Traditional Flow (Payment First)

**Objective:** Verify traditional workflow still functions

**Steps:**
1. Find order with status `pending`
2. Update: `pending` → `payment_method_pending`
3. Update: `payment_method_pending` → `payment_method_registered`
4. Update: `payment_method_registered` → `installation_scheduled` (set date)
5. Update: `installation_scheduled` → `installation_in_progress`
6. Update: `installation_in_progress` → `installation_completed`
7. Update: `installation_completed` → `active`

**Expected Results:**
✅ All transitions succeed (traditional flow preserved)
✅ Each step completes without errors

---

### Test 4.3: Partial Flow Reversal

**Objective:** Test flexibility to adjust workflow mid-stream

**Steps:**
1. Find order with status `installation_scheduled`
2. Realize installation needs rescheduling
3. Update: `installation_scheduled` → `installation_scheduled` (change date only)
4. Or update: `installation_scheduled` → `failed` (installation attempt failed)
5. Update: `failed` → `installation_scheduled` (reschedule)

**Expected Results:**
✅ Can update installation date without changing status
✅ Can mark as failed and reschedule
✅ Flexible workflow adapts to real-world scenarios

---

## Test Suite 5: Edge Cases & Error Handling

### Test 5.1: Cancellation from Any Status

**Objective:** Verify orders can be cancelled at any point

**Steps:**
1. Test cancellation from each status:
   - `pending`
   - `payment_method_pending`
   - `installation_scheduled`
   - `installation_in_progress`
   - `installation_completed`
   - `active`

**Expected Results:**
✅ Cancellation available from ALL statuses except `cancelled` and `suspended`
✅ Cancellation notes are required
✅ Cannot transition out of `cancelled` status

---

### Test 5.2: Missing Required Fields

**Objective:** Verify validation prevents invalid submissions

**Steps:**
1. Select `installation_scheduled`, leave date empty, submit
2. Select `cancelled`, leave notes empty, submit
3. Leave status unchanged, submit

**Expected Results:**
✅ Error: "Please select an installation date"
✅ Error: "Please provide a cancellation reason"
✅ Error: "Please select a status" (if no change)

---

### Test 5.3: Network Error Handling

**Objective:** Verify graceful error handling

**Steps:**
1. Open browser DevTools
2. Set network to "Offline"
3. Try to update order status
4. Re-enable network
5. Retry

**Expected Results:**
✅ Error message: "Network error. Please check your connection and try again."
✅ Toast shows: "Network error - Failed to connect to server"
✅ Modal stays open (doesn't close on error)
✅ Retry succeeds after network restored

---

### Test 5.4: Concurrent Status Updates

**Objective:** Test behavior when multiple admins update same order

**Steps:**
1. Open order in two browser tabs (or two admin users)
2. In Tab 1: Update status to `installation_scheduled`
3. In Tab 2: Update status to `payment_method_registered` (before refreshing)
4. Submit Tab 1 first
5. Submit Tab 2 second

**Expected Results:**
✅ Tab 1 succeeds
✅ Tab 2 may succeed or fail depending on transition validity
✅ No data corruption
✅ Order history shows both attempts

**Note:** Current implementation doesn't have optimistic locking. Last write wins. Consider adding version control if concurrent updates become problematic.

---

## Test Suite 6: Customer Dashboard Compatibility

### Test 6.1: Customer View - Installation Scheduled

**Objective:** Verify customers see correct information when installation scheduled first

**Prerequisites:** Order in status `installation_scheduled` (no payment method yet)

**Steps:**
1. Log in as customer (test customer account)
2. Navigate to order details
3. Check displayed status
4. Check displayed installation date
5. Check payment method section

**Expected Results:**
✅ Status shows: "Installation Scheduled"
✅ Installation date displayed prominently
✅ Payment method section shows: "Not registered" or "Add Payment Method" CTA
✅ Customer can navigate to payment method registration

---

### Test 6.2: Customer Payment Registration Flow

**Objective:** Verify customers can register payment after installation scheduled

**Steps:**
1. Customer views order with status `installation_scheduled`
2. Customer clicks "Add Payment Method"
3. Customer completes NetCash eMandate form
4. Webhook updates order to `payment_method_registered`
5. Customer refreshes order page

**Expected Results:**
✅ Payment method CTA is accessible
✅ NetCash eMandate flow completes
✅ Webhook updates order status
✅ Installation date remains visible and unchanged
✅ Order now shows both installation date AND payment method

---

## Test Suite 7: Reporting & Analytics

### Test 7.1: Order Status Distribution

**Objective:** Verify dashboard widget reflects new statuses

**Steps:**
1. View "Order Status Distribution" widget
2. Check all status categories are represented

**Expected Results:**
✅ Widget shows counts for:
   - Pending
   - Payment Method Pending
   - Payment Method Registered
   - Installation Scheduled
   - Installation In Progress
   - Installation Completed
   - Active
   - Suspended
   - Failed
   - Cancelled

✅ Clicking a status filters orders page correctly

---

### Test 7.2: Status History Logging

**Objective:** Verify all status changes are logged

**Steps:**
1. Perform 3 status updates on a test order
2. Navigate to order detail page
3. View "Status History" section

**Expected Results:**
✅ All 3 changes appear in chronological order
✅ Each entry shows:
   - Old status
   - New status
   - Timestamp
   - Changed by (admin user)
   - Reason/notes (if provided)

**SQL Verification:**
```sql
SELECT
  old_status,
  new_status,
  change_reason,
  changed_by,
  status_changed_at
FROM order_status_history
WHERE entity_id = 'order-uuid'
ORDER BY status_changed_at DESC;
```

---

## Test Suite 8: Performance & Load Testing

### Test 8.1: Page Load Performance

**Objective:** Verify orders page loads efficiently with new filters

**Steps:**
1. Navigate to `/admin/orders` (ensure >100 orders in database)
2. Measure page load time (Network tab)
3. Apply "Needs Payment Method" filter
4. Measure filter response time
5. Switch to "Ready to Schedule" filter
6. Measure filter response time

**Expected Results:**
✅ Initial page load: <2 seconds
✅ Filter application: <500ms
✅ No console errors
✅ No memory leaks (check DevTools Memory tab)

---

### Test 8.2: Status Update API Performance

**Objective:** Verify status update API responds quickly

**Steps:**
1. Update order status (Network tab open)
2. Check API response time for `/api/admin/orders/[id]/status`
3. Perform 5 consecutive status updates (different orders)
4. Calculate average response time

**Expected Results:**
✅ Average response time: <1 second
✅ All updates succeed
✅ No 500 errors
✅ No duplicate history entries

---

## Regression Tests

### Regression Test 1: Payment-First Flow Still Works

**Objective:** Ensure traditional workflow not broken

**Steps:**
1. Complete Test 4.2 (End-to-End Traditional Flow)

**Expected Results:**
✅ All traditional transitions work
✅ No errors or unexpected behavior

---

### Regression Test 2: Existing Orders Unaffected

**Objective:** Verify existing orders remain functional

**Steps:**
1. Find orders last updated before deployment date
2. Open 5 random order detail pages
3. Check status display
4. Try updating status

**Expected Results:**
✅ Old orders display correctly
✅ Status update modal works
✅ No migration issues

---

## Known Limitations & Future Enhancements

### Current Limitations

1. **No Optimistic Locking:** Last write wins in concurrent updates
2. **Manual Notification Trigger:** Customer notifications not fully automated (TODOs in code)
3. **No Status Change Approval:** All admins can change to any valid status
4. **No Bulk Status Updates:** Must update orders individually

### Planned Enhancements

1. **Automated Notifications:** Complete email/SMS automation for all status changes (components/admin/orders/StatusUpdateModal.tsx:246, app/api/admin/orders/[orderId]/status/route.ts:234)
2. **Payment Method Tracking:** Link `payment_method_id` to order for better tracking
3. **Bulk Operations:** Allow selecting multiple orders and applying status changes
4. **Approval Workflow:** Require manager approval for critical status changes (e.g., cancellation)
5. **Customer Self-Service:** Allow customers to reschedule installations (within constraints)

---

## Troubleshooting

### Issue: Status Dropdown Empty

**Symptom:** Status update modal shows no options in dropdown
**Cause:** Order in terminal status (cancelled) or API error
**Solution:** Check order status in database, verify API endpoint responding

---

### Issue: Installation Date Not Saving

**Symptom:** Installation date field is filled but not saved
**Cause:** Status not set to `installation_scheduled`
**Solution:** Ensure status is `installation_scheduled` when setting date. Backend requires both.

---

### Issue: Filter Shows Incorrect Orders

**Symptom:** Quick filter shows orders that shouldn't match
**Cause:** Client-side filter logic or stale data
**Solution:**
1. Hard refresh page (Ctrl+Shift+R)
2. Check app/admin/orders/page.tsx:218-240 for filter logic
3. Verify order status in database

---

### Issue: Customer Email Not Sent

**Symptom:** Status updated but customer not notified
**Cause:** Email integration not fully implemented (TODO in code)
**Solution:**
1. Check order_status_history.customer_notified = false
2. Manually trigger notification or wait for automation implementation
3. See app/api/admin/orders/[orderId]/status/route.ts:246

---

## Test Checklist Summary

Use this checklist for quick production validation:

- [ ] Test 1.1: Direct installation scheduling from pending
- [ ] Test 1.2: Payment registration after installation scheduled
- [ ] Test 1.3: Payment registration after installation completed
- [ ] Test 1.4: Installation scheduling during payment process
- [ ] Test 1.5: Invalid transition prevention (cancelled)
- [ ] Test 2.1: "Needs Payment Method" filter accuracy
- [ ] Test 2.2: "Ready to Schedule" filter accuracy
- [ ] Test 2.3: "Today's Installations" widget accuracy
- [ ] Test 3.1: All statuses displayed in modal
- [ ] Test 3.2: Conditional fields rendering correctly
- [ ] Test 3.3: Installation date validation
- [ ] Test 4.1: End-to-end flexible flow (installation first)
- [ ] Test 4.2: End-to-end traditional flow (payment first)
- [ ] Test 5.1: Cancellation from multiple statuses
- [ ] Test 5.2: Required field validation
- [ ] Test 6.1: Customer view shows correct information
- [ ] Test 6.2: Customer payment registration flow
- [ ] Test 7.2: Status history logging
- [ ] Regression: Payment-first flow still works

---

## Sign-Off

**Tester Name:** _____________________
**Date:** _____________________
**Test Environment:** Production / Staging (circle one)
**Pass/Fail:** _____________________

**Notes:**
_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________

---

## Related Documentation

- **API Route:** `app/api/admin/orders/[orderId]/status/route.ts`
- **Admin Orders Page:** `app/admin/orders/page.tsx`
- **Status Update Modal:** `components/admin/orders/StatusUpdateModal.tsx`
- **Architecture:** `docs/architecture/ORDER_WORKFLOW.md` (if exists)
- **Customer Dashboard:** `app/dashboard/orders/[id]/page.tsx`

---

**End of Testing Guide**
