# Corrected Workflow for Order ORD-20251108-9841

**Customer**: Shaun Robertson (shaunr07@gmail.com)
**Order ID**: 052e143e-0b6f-48bb-a754-421d5864ba65
**Package**: SkyFibre Home Plus (R899.00/month)
**Current Status**: installation_in_progress

---

## ⚠️ CRITICAL CORRECTION

### What We Discovered:
The NetCash payment document (`AccPayNowTransactionCardReport.docx`) shows **R1.00**, NOT R899.00.

This is a **payment method verification charge**, not the actual monthly fee payment.

### What This Means:

| What We Thought | What It Actually Is |
|-----------------|---------------------|
| ❌ R899.00 paid upfront | ✅ R1.00 verification only |
| ❌ Order is paid | ✅ Order is NOT paid yet |
| ❌ Ready to activate immediately | ✅ Ready to activate with Dec 1st billing |
| ❌ Pro-rata billing needed | ✅ No pro-rata - free until Dec 1st |

---

## Understanding Payment Method Verification

### What is the R1.00 charge?

NetCash debit order mandates require a **verification payment** to confirm:
1. ✅ Bank account is valid
2. ✅ Customer has authorized debit orders
3. ✅ Payment details are correct
4. ✅ Mandate is active and ready

The R1.00 charge is **immediately refunded** or used as credit toward the first billing cycle.

### When will R899.00 be charged?

**First billing**: December 1st, 2025
- Amount: R899.00 (full monthly fee)
- Method: Automatic debit order via NetCash
- Frequency: 1st of each month thereafter

### What happens Nov 22 - Nov 30?

Customer gets **9 days FREE service** while installation is completed and service is activated.

---

## Corrected SQL Script

### ❌ Old Script (INCORRECT):
- File: `MANUAL_PAYMENT_FIX_ORD-20251108-9841.sql.OLD-INCORRECT`
- Problem: Records R899.00 as paid
- Problem: Marks order as paid
- Problem: Would trigger immediate billing

### ✅ New Script (CORRECT):
- File: `PAYMENT_METHOD_VERIFICATION_ORD-20251108-9841.sql`
- Records: R1.00 verification payment
- Creates: Active debit order payment method
- Sets: First billing date = December 1st, 2025
- Keeps: Order payment_status = 'pending'

---

## Step-by-Step Workflow

### Step 1: Run SQL Script ⏳ (DO THIS NOW)

**Location**: `PAYMENT_METHOD_VERIFICATION_ORD-20251108-9841.sql`

**How to Run**:
1. Open Supabase Dashboard: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng
2. Navigate to: SQL Editor
3. Copy entire contents of `PAYMENT_METHOD_VERIFICATION_ORD-20251108-9841.sql`
4. Paste into new query
5. Click "Run"

**What It Does**:
- ✅ Records R1.00 verification payment transaction
- ✅ Creates debit order payment method (mandate_status = 'active')
- ✅ Sets order payment_method = 'Debit Order'
- ✅ Sets next_billing_date = '2025-12-01'
- ✅ Sets billing_cycle_day = 1
- ✅ Keeps payment_status = 'pending' (NOT paid)
- ✅ Keeps total_paid = 0.00

**Expected Output**:
```
✓ Verification payment created (R1.00)
✓ Payment method active (debit order mandate verified)
✓ Order configured for Dec 1st billing

ORDER STATUS:
- order_number: ORD-20251108-9841
- current_status: installation_in_progress
- payment_status: pending ⏳ (NOT paid yet)
- payment_method: Debit Order ✅
- amount_paid: 0.00 ZAR ⏳
- first_billing_date: 2025-12-01 ✅
- billing_cycle_day: 1 ✅

PAYMENT METHOD:
- method_type: debit_order ✅
- mandate_status: active ✅
- verification_amount: 1.00 ✅
- first_billing_date: 2025-12-01 ✅
```

---

### Step 2: Complete Installation 📸 (NEXT)

**URL**: https://www.circletel.co.za/admin/orders/052e143e-0b6f-48bb-a754-421d5864ba65

**Actions**:
1. Click **"Complete Installation"** button
2. Upload **physical installation proof**:
   - ✅ Photos of installed router/ONT equipment
   - ✅ Photos of cable installation
   - ✅ Signed technician forms
   - ❌ **NOT** the NetCash payment document
3. Add notes:
   ```
   Installation completed successfully.
   - SkyFibre Home Plus installed
   - Customer confirmed internet working
   - Signal strength: Excellent
   - Equipment: Router configured and tested
   ```
4. Click **"Complete Installation"**

**Result**:
- Order status: `installation_in_progress` → `installation_completed` ✅

---

### Step 3: Activate Service 🚀 (FINAL STEP)

**When**: After installation completion

**Actions**:
1. Click **"Activate Service"** button
2. System validates:
   - ✅ Installation document uploaded
   - ✅ Payment method verified (mandate_status = 'active')
3. **CRITICAL**: Set billing parameters:
   - **Activation Date**: Today (2025-11-22)
   - **First Billing Date**: **December 1st, 2025** ⚠️ IMPORTANT
   - **Monthly Amount**: R899.00
   - **Billing Cycle**: 1st of month
   - **Pro-rata Charge**: **R0.00** (no charge until Dec 1st)
4. Optional details:
   - Account Number: Auto-generated (CT-2025-XXXXX)
   - Connection ID: Provider circuit ID (if available)
5. Click **"Activate Service"**

**Result**:
- Order status: `installation_completed` → `active` ✅
- Service: LIVE! Internet working! 🎉
- Billing: Starts December 1st, 2025
- Customer: Free service until Dec 1st (9 days) 🎁

---

## Billing Timeline

### November 22nd - 30th (9 days)
- ✅ Service active and working
- ✅ Customer using internet
- 💰 **R0.00** - Free service period
- 🎁 Customer gets 9 days free

### December 1st, 2025
- 💳 **First automated debit order**: R899.00
- 🔁 Recurring billing starts
- 📧 Invoice generated and sent
- ✅ ZOHO Billing synced

### Ongoing (1st of each month)
- 💳 Automatic debit order: R899.00
- 📧 Invoice sent to customer
- ✅ Payment recorded in all systems

---

## What Changed from Original Plan

### Original Plan (WRONG):
1. ❌ Record R899.00 as paid
2. ❌ Mark order as paid
3. ❌ Calculate pro-rata billing for Nov 22-30
4. ❌ Charge customer ~R269.73 for partial month
5. ❌ Start billing immediately

### Corrected Plan (RIGHT):
1. ✅ Record R1.00 verification payment
2. ✅ Keep order as unpaid (pending)
3. ✅ Set first billing date = Dec 1st
4. ✅ NO pro-rata charge
5. ✅ Customer gets free service until Dec 1st
6. ✅ First charge: Dec 1st for R899.00

---

## Database State After SQL Script

### payment_transactions table:
```
transaction_id: NETCASH-VERIFY-052e143e
reference: ORD-20251108-9841-VERIFY
provider: netcash
amount: 1.00 (R1.00 verification)
currency: ZAR
status: completed
payment_method: Debit Order Verification
metadata: {
  "verification_only": true,
  "first_billing_date": "2025-12-01",
  "monthly_amount": 899.00
}
```

### consumer_orders table:
```
order_number: ORD-20251108-9841
status: installation_in_progress (unchanged)
payment_status: pending (NOT paid)
payment_method: Debit Order (updated)
total_paid: 0.00 (unchanged)
next_billing_date: 2025-12-01 (NEW)
billing_cycle_day: 1 (NEW)
```

### customer_payment_methods table:
```
customer_id: 96cbba3b-bfc8-4324-a3fe-1283f5f01689
method_type: debit_order (NEW)
display_name: NetCash Debit Order
mandate_status: active (verified ✅)
is_primary: true
is_active: true
encrypted_details: {
  "provider": "netcash",
  "verified": true,
  "verification_date": "2025-11-22",
  "verification_amount": 1.00,
  "first_billing_date": "2025-12-01",
  "monthly_amount": 899.00
}
```

---

## Future Automation (Prevent Manual Work)

### Current Situation:
- ❌ NetCash webhook URL not configured
- ❌ Manual processing required for this order
- ❌ Payment verification not automatic

### To Fix:
Contact **NetCash support** and configure this webhook URL:
```
https://www.circletel.co.za/api/payments/netcash/webhook
```

### After Webhook Configuration:
- ✅ Payment verifications automatic
- ✅ Order updates automatic
- ✅ Customer dashboard updates automatic
- ✅ Admin dashboard updates automatic
- ✅ ZOHO Billing syncs automatic
- ✅ No manual SQL scripts needed!

---

## Summary

### What You Need to Do:

1. ✅ **Run SQL Script** → `PAYMENT_METHOD_VERIFICATION_ORD-20251108-9841.sql`
   - Records R1.00 verification
   - Activates payment method
   - Sets Dec 1st billing

2. 📸 **Complete Installation**
   - Upload equipment photos
   - Upload installation forms
   - Add completion notes

3. 🚀 **Activate Service**
   - Set activation date = Today
   - Set first billing date = **Dec 1st, 2025**
   - No pro-rata charge
   - Service goes live!

4. 🎉 **Done!**
   - Customer has internet
   - Free service until Dec 1st
   - Automated billing starts Dec 1st
   - R899.00/month on 1st of each month

### What the Customer Gets:

- ✅ Internet service starting today (Nov 22)
- 🎁 Free service for 9 days (Nov 22-30)
- 💳 First charge: Dec 1st for R899.00
- 🔁 Monthly billing: 1st of each month
- 📧 Invoices and notifications automatic

---

**File References**:
- ✅ Correct SQL Script: `PAYMENT_METHOD_VERIFICATION_ORD-20251108-9841.sql`
- ❌ Old SQL Script: `MANUAL_PAYMENT_FIX_ORD-20251108-9841.sql.OLD-INCORRECT` (DO NOT USE)
- 📄 This Document: `ORDER_ORD-20251108-9841_CORRECTED_WORKFLOW.md`

**Questions?** Review the SQL script comments for detailed explanations of each step.
