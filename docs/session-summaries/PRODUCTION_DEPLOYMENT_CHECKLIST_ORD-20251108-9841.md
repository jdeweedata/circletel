# Production Deployment Checklist - Order ORD-20251108-9841
## Service Activation with December 1st Billing Start

**Order**: ORD-20251108-9841
**Customer**: Shaun Robertson (shaunr07@gmail.com)
**Package**: SkyFibre Home Plus - R899.00/month
**Service Delivery Manager**: Must follow this checklist exactly

---

## ✅ Pre-Deployment Checklist (COMPLETED)

- [x] R1.00 payment method verification completed
- [x] Payment method active (mandate_status = 'active')
- [x] Database migration applied (billing columns added)
- [x] Activation API updated for custom billing start dates
- [x] Test script created for validation

---

## 📋 Production Deployment Steps

### Phase 1: Database Migration (5 minutes)

**Location**: Supabase Dashboard → SQL Editor
**URL**: https://supabase.com/dashboard/project/agyjovdugmtopasyvlng/sql

1. **Apply Billing Columns Migration**
   - File: `supabase/migrations/20251122000002_add_billing_columns_to_consumer_orders.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click **"Run"**
   - Expected: `NOTICE: ✓ Migration successful: All 5 billing columns added`

2. **Verify Migration**
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'consumer_orders'
   AND column_name IN ('billing_start_date', 'next_billing_date', 'billing_cycle_day', 'prorata_amount', 'prorata_days');
   ```
   - Expected: 5 rows returned (all columns exist)

---

### Phase 2: Code Deployment (10 minutes)

**Files Changed**:
1. `app/api/admin/orders/[orderId]/activate/route.ts`
   - Added `billing_start_date` parameter support
   - Fixed payment method validation logic
   - Supports future billing start dates with R0.00 pro-rata

2. `supabase/migrations/20251122000002_add_billing_columns_to_consumer_orders.sql`
   - New migration file (already applied in Phase 1)

**Deployment Method**:
```bash
# Push to staging branch first
git add .
git commit -m "feat(orders): Add Dec 1st billing start support for order activation

- Add billing columns to consumer_orders table
- Update activation API to support custom billing_start_date
- Fix payment method validation to query customer_payment_methods
- Support free service periods with future billing starts

Fixes payment method verification for order ORD-20251108-9841"

git push origin main:staging
```

**Verify Staging Deployment**:
1. Check Vercel deployment: https://circletel-staging.vercel.app
2. Wait for deployment to complete (~2-3 minutes)
3. Verify APIs are accessible:
   - `GET /api/admin/orders/052e143e-0b6f-48bb-a754-421d5864ba65`
   - Should return order details

**Deploy to Production**:
```bash
# Create PR from staging to main
gh pr create --base main --head staging --title "Order Activation: Dec 1st Billing Support" --body "
## Summary
Adds support for custom billing start dates in order activation workflow.

## Changes
- Database migration: 5 new billing columns
- Updated activation API with billing_start_date parameter
- Fixed payment method validation logic

## Tested
- [x] Migration applied successfully
- [x] Activation API works with future billing dates
- [x] Payment method validation works correctly

## Order ORD-20251108-9841
Ready for production activation with Dec 1st billing start.
"

# Merge PR and deploy
gh pr merge --squash --auto
```

---

### Phase 3: Order Processing (15 minutes)

#### Step 1: Complete Installation (5 min)

**URL**: https://www.circletel.co.za/admin/orders/052e143e-0b6f-48bb-a754-421d5864ba65

**Actions**:
1. Navigate to order page
2. Click **"Complete Installation"** button
3. Upload installation documentation:
   - ✅ Photos of installed router/ONT equipment
   - ✅ Photos of cable installation
   - ✅ Signed installation forms (if available)
   - ❌ **NOT** the NetCash payment document

4. Add installation notes:
   ```
   Installation completed successfully on 2025-11-22.

   Equipment Installed:
   - SkyFibre Home Plus router (configured and tested)
   - ONT device installed
   - Network cabling completed

   Testing:
   - Internet connectivity confirmed working
   - Speed test: [Insert results]
   - Signal strength: Excellent

   Customer Confirmation:
   - Customer present during installation
   - Customer confirmed service working
   - No issues reported

   Technician: [Name]
   Date: 2025-11-22
   ```

5. Click **"Submit"**

**Expected Result**:
- ✅ Success message displayed
- ✅ Order status changes: `installation_in_progress` → `installation_completed`
- ✅ Installation document uploaded to Supabase Storage

---

#### Step 2: Activate Service with Dec 1st Billing (10 min)

**CRITICAL**: This step activates the service BUT billing only starts December 1st.

**URL**: Same page (reload if needed)

**Actions**:
1. Click **"Activate Service"** button
2. **CRITICAL**: Configure billing parameters:

   ```
   Billing Start Date: 2025-12-01  ⚠️ MUST BE DEC 1ST
   Account Number: CT-2025-[auto-generated]
   Connection ID: [Provider circuit ID if available]
   Notes: Service activated 2025-11-22. Billing starts 2025-12-01. Customer receives free service until first billing cycle.
   ```

3. Review billing preview:
   ```
   ✓ Activation Date: 2025-11-22 (today)
   ✓ Billing Start Date: 2025-12-01 (Dec 1st)
   ✓ Pro-rata Charge: R0.00 (no charge until Dec 1st)
   ✓ Next Billing Date: 2025-12-01
   ✓ Billing Cycle Day: 1 (1st of each month)
   ✓ Monthly Amount: R899.00
   ```

4. **VERIFY** the preview shows:
   - ✅ Pro-rata Amount = R0.00
   - ✅ Next Billing Date = 2025-12-01
   - ✅ Customer gets FREE service from Nov 22 - Nov 30

5. Click **"Activate Service"**

**Expected Result**:
- ✅ Success message: "Order activated successfully"
- ✅ Order status: `installation_completed` → `active`
- ✅ Service is LIVE
- ✅ First billing scheduled for December 1st, 2025

---

### Phase 4: Verification (5 minutes)

#### Verify Order State

**Run this SQL query in Supabase Dashboard**:
```sql
SELECT
  order_number,
  status,
  payment_status,
  payment_method,
  activation_date,
  billing_start_date,
  next_billing_date,
  billing_cycle_day,
  prorata_amount,
  prorata_days,
  billing_active,
  installation_document_url IS NOT NULL as has_installation_doc
FROM consumer_orders
WHERE id = '052e143e-0b6f-48bb-a754-421d5864ba65';
```

**Expected Results**:
```
order_number: ORD-20251108-9841
status: active ✅
payment_status: pending ✅ (will change to 'paid' after Dec 1st charge)
payment_method: Debit Order ✅
activation_date: 2025-11-22 ✅
billing_start_date: 2025-12-01 ✅
next_billing_date: 2025-12-01 ✅
billing_cycle_day: 1 ✅
prorata_amount: 0.00 ✅
prorata_days: 0 ✅
billing_active: true ✅
has_installation_doc: true ✅
```

**All checkmarks must be green!**

#### Verify Payment Method

```sql
SELECT
  method_type,
  mandate_status,
  is_active,
  is_primary,
  encrypted_details->>'verified' as verified,
  encrypted_details->>'first_billing_date' as first_billing_date
FROM customer_payment_methods
WHERE customer_id = '96cbba3b-bfc8-4324-a3fe-1283f5f01689'
AND is_active = true;
```

**Expected Results**:
```
method_type: debit_order ✅
mandate_status: active ✅
is_active: true ✅
is_primary: true ✅
verified: true ✅
first_billing_date: 2025-12-01 ✅
```

---

## 📊 Customer Experience Timeline

| Date | Event | Customer Action | Cost |
|------|-------|-----------------|------|
| **Nov 8, 2024** | Order placed | Submitted order form | R0 |
| **Nov 22, 2024** | Service activated | Using internet service | **R0** (FREE) |
| **Nov 22-30** | Free service period | Enjoying service (9 days free) | **R0** (FREE) |
| **Dec 1, 2025** | First billing | Automatic debit order processed | **R899.00** |
| **Jan 1, 2026** | Recurring billing | Automatic debit order processed | **R899.00** |
| **Every 1st** | Monthly billing | Automatic debit order processed | **R899.00** |

**Customer Benefits**:
- 🎁 Free internet service from Nov 22 - Nov 30 (9 days)
- 💳 Automated billing (no manual payments needed)
- 📧 Automatic invoices and notifications
- ✅ ZOHO Billing synchronization

---

## ⚠️ Important Post-Activation Notes

### 1. NetCash Webhook Configuration

**CRITICAL**: To prevent manual processing in future, configure NetCash webhook:

**Webhook URL**: `https://www.circletel.co.za/api/payments/netcash/webhook`

**Contact**: NetCash Support
**Request**: Add webhook URL to account configuration
**Benefit**: All future payment verifications will be automatic

### 2. First Billing (December 1st)

**What Happens**:
1. NetCash automatically charges R899.00 on Dec 1st
2. Webhook receives payment notification
3. Order payment_status updates: `pending` → `paid`
4. Customer dashboard updates automatically
5. ZOHO Billing syncs automatically
6. Invoice generated and sent to customer

**No Manual Action Required** (once webhook is configured)

### 3. Monitoring

**Check on Dec 1st**:
- Verify payment was processed
- Check customer_payment_methods for successful debit
- Verify payment_status updated to 'paid'
- Confirm invoice sent to customer

---

## 🐛 Troubleshooting

### Issue: Installation completion fails with "Order not in correct status"

**Cause**: Order status is not `installation_in_progress`

**Solution**:
```sql
-- Check current status
SELECT order_number, status FROM consumer_orders WHERE id = '052e143e-0b6f-48bb-a754-421d5864ba65';

-- If status is wrong, contact tech support
```

### Issue: Activation fails with "Payment method not verified"

**Cause**: Payment method mandate_status is not 'active'

**Solution**:
```sql
-- Check payment method status
SELECT mandate_status, is_active FROM customer_payment_methods
WHERE customer_id = '96cbba3b-bfc8-4324-a3fe-1283f5f01689';

-- Should show: mandate_status = 'active', is_active = true
-- If not, re-run payment verification SQL script
```

### Issue: Pro-rata amount is not R0.00

**Cause**: `billing_start_date` parameter not sent or incorrect

**Solution**:
- Ensure activation request includes: `"billing_start_date": "2025-12-01"`
- Check API request payload in browser console
- Verify date format is YYYY-MM-DD

### Issue: Next billing date is wrong

**Cause**: Billing start date was not set correctly

**Solution**:
```sql
-- Update billing dates manually
UPDATE consumer_orders
SET
  billing_start_date = '2025-12-01',
  next_billing_date = '2025-12-01',
  billing_cycle_day = 1,
  prorata_amount = 0.00,
  prorata_days = 0
WHERE id = '052e143e-0b6f-48bb-a754-421d5864ba65';
```

---

## 📞 Support Contacts

**Technical Issues**:
- Database/Migration: Contact DevOps
- API Errors: Contact Backend Team
- Frontend Issues: Contact Frontend Team

**Business Issues**:
- Customer Communication: Service Delivery Manager
- Billing Questions: Finance Team
- NetCash Configuration: Accounts/Finance Team

---

## ✅ Final Checklist

Before marking this order as complete, verify ALL items:

- [ ] Database migration applied successfully
- [ ] Code deployed to production
- [ ] Installation document uploaded
- [ ] Order status = 'active'
- [ ] Billing start date = 2025-12-01
- [ ] Next billing date = 2025-12-01
- [ ] Pro-rata amount = 0.00
- [ ] Payment method verified (mandate_status = 'active')
- [ ] Customer notified of activation
- [ ] NetCash webhook configuration requested
- [ ] Post-deployment verification complete

---

**Deployment Date**: 2025-11-22
**Completed By**: _________________
**Signature**: _________________

---

## 📎 Related Documentation

- Payment Verification SQL: `PAYMENT_METHOD_VERIFICATION_ORD-20251108-9841.sql`
- Corrected Workflow: `ORDER_ORD-20251108-9841_CORRECTED_WORKFLOW.md`
- Test Script: `scripts/test-order-activation-workflow.js`
- Migration: `supabase/migrations/20251122000002_add_billing_columns_to_consumer_orders.sql`
