# ZOHO Billing Integration - Testing Guide

## Overview

This guide explains how to test the ZOHO Billing integration (Phase 1 & 2).

**Status**: ✅ Phase 1 & 2 Complete (Database migrations + Sync services)

---

## What's Been Completed

### Phase 1 - Database Migrations ✅

All 4 migrations have been applied to production database:

1. **`customers` table** - Added ZOHO sync fields:
   - `zoho_billing_customer_id` (ZOHO Contact ID)
   - `zoho_sync_status` (pending/syncing/synced/failed/retrying)
   - `zoho_last_synced_at` (timestamp)
   - `zoho_last_sync_error` (error message)

2. **`customer_services` table** - Added ZOHO subscription tracking:
   - `zoho_subscription_id` (ZOHO Subscription ID)
   - Same sync status fields as above
   - Note: ZOHO auto-generates recurring invoices from subscriptions

3. **`customer_invoices` table** - Added ZOHO invoice tracking:
   - `zoho_billing_invoice_id` (ZOHO Invoice ID)
   - Same sync status fields
   - Note: Only manual invoice types are synced (installation, pro_rata, equipment, adjustment)

4. **`payment_transactions` table** - Added ZOHO payment tracking:
   - `zoho_payment_id` (ZOHO Payment ID)
   - Same sync status fields
   - Note: Payments mark invoices as paid in ZOHO

### Phase 2 - Sync Services ✅

Created 4 sync services with robust error handling:

1. **`lib/integrations/zoho/customer-sync-service.ts`**
   - Function: `syncCustomerToZohoBilling(customer_id)`
   - Maps CircleTel customer to ZOHO Contact
   - Uses `upsertCustomer()` to prevent duplicates

2. **`lib/integrations/zoho/subscription-sync-service.ts`**
   - Function: `syncSubscriptionToZohoBilling(service_id)`
   - Prerequisites: Customer synced + Product published
   - Creates ZOHO subscription (recurring invoices auto-generated)

3. **`lib/integrations/zoho/invoice-sync-service.ts`**
   - Function: `syncInvoiceToZohoBilling(invoice_id)`
   - Prerequisites: Customer synced
   - Maps line_items JSONB to ZOHO format
   - Only syncs manual invoice types

4. **`lib/integrations/zoho/payment-sync-service.ts`**
   - Function: `syncPaymentToZohoBilling(payment_id)`
   - Prerequisites: Customer synced, Invoice synced (if linked)
   - Records payment and marks ZOHO invoices as paid

**Billing Client Enhancement**:
- Added `createInvoice()` method to `lib/integrations/zoho/billing-client.ts`

---

## Testing Methods

### Method 1: API Endpoints (Recommended)

Test API endpoint has been created at `/api/test/zoho-sync/customer`

#### Test Customer Sync:
```bash
curl "http://localhost:3000/api/test/zoho-sync/customer?customer_id=0adb9dac-6512-4bb0-8592-60fe74434c78"
```

#### Find Customers Needing Sync:
```bash
curl "http://localhost:3000/api/test/zoho-sync/customer?action=find"
```

#### Check Sync Status:
```bash
curl "http://localhost:3000/api/test/zoho-sync/customer?action=status&customer_id=xxx"
```

### Method 2: Direct Database Testing

#### 1. Find Test Customer:
```sql
SELECT id, email, first_name, last_name, zoho_sync_status
FROM customers
WHERE email = 'test@circletel.test';
-- Result: 0adb9dac-6512-4bb0-8592-60fe74434c78
```

#### 2. Check Current Sync Status:
```sql
SELECT
  zoho_billing_customer_id,
  zoho_sync_status,
  zoho_last_synced_at,
  zoho_last_sync_error
FROM customers
WHERE id = '0adb9dac-6512-4bb0-8592-60fe74434c78';
```

#### 3. Find Active Services for Testing:
```sql
SELECT
  cs.id,
  cs.customer_id,
  cs.monthly_price,
  cs.status,
  cs.zoho_subscription_id,
  cs.zoho_sync_status,
  c.email as customer_email,
  sp.name as package_name,
  pi.zoho_billing_plan_id
FROM customer_services cs
JOIN customers c ON c.id = cs.customer_id
JOIN service_packages sp ON sp.id = cs.service_package_id
LEFT JOIN product_integrations pi ON pi.product_id = sp.id
WHERE cs.status = 'active'
  AND cs.zoho_subscription_id IS NULL
LIMIT 5;
```

#### 4. Find Manual Invoices for Testing:
```sql
SELECT
  ci.id,
  ci.invoice_number,
  ci.invoice_type,
  ci.total_amount,
  ci.zoho_billing_invoice_id,
  ci.zoho_sync_status,
  c.email as customer_email
FROM customer_invoices ci
JOIN customers c ON c.id = ci.customer_id
WHERE ci.invoice_type IN ('installation', 'pro_rata', 'equipment', 'adjustment')
  AND ci.zoho_billing_invoice_id IS NULL
LIMIT 5;
```

#### 5. Find Completed Payments for Testing:
```sql
SELECT
  pt.id,
  pt.transaction_reference,
  pt.amount,
  pt.status,
  pt.zoho_payment_id,
  pt.zoho_sync_status,
  c.email as customer_email,
  ci.invoice_number
FROM payment_transactions pt
JOIN customers c ON c.id = pt.customer_id
LEFT JOIN customer_invoices ci ON ci.id = pt.invoice_id
WHERE pt.status = 'completed'
  AND pt.zoho_payment_id IS NULL
LIMIT 5;
```

#### 6. Check Sync Logs:
```sql
SELECT
  entity_type,
  entity_id,
  zoho_entity_id,
  status,
  attempt_number,
  error_message,
  created_at
FROM zoho_sync_logs
ORDER BY created_at DESC
LIMIT 10;
```

### Method 3: Test Scripts (Node.js)

Test scripts have been created but require compilation. To use them:

```bash
# Install tsx if not already installed
npm install -g tsx

# Test customer sync
tsx scripts/test-zoho-customer-sync.js [customer_id]

# Test subscription sync
tsx scripts/test-zoho-subscription-sync.js [service_id]

# Test invoice sync
tsx scripts/test-zoho-invoice-sync.js [invoice_id]

# Test payment sync
tsx scripts/test-zoho-payment-sync.js [payment_id]
```

---

## Expected Test Results

### Successful Customer Sync:
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "0adb9dac-6512-4bb0-8592-60fe74434c78",
      "email": "test@circletel.test",
      "name": "Test User"
    },
    "sync_result": {
      "success": true,
      "zoho_customer_id": "1234567890"
    },
    "sync_status": {
      "synced": true,
      "zoho_customer_id": "1234567890",
      "sync_status": "synced",
      "last_synced_at": "2025-01-20T17:00:00Z",
      "error": null
    },
    "sync_log": {
      "entity_type": "customer",
      "status": "success",
      "zoho_entity_id": "1234567890"
    },
    "duration_ms": 1234
  }
}
```

### Failed Sync (Missing Prerequisites):
```json
{
  "success": false,
  "error": "Service package not synced to ZOHO Billing. Please publish the product first."
}
```

---

## Prerequisites for Testing

### 1. Environment Variables
Ensure these are set in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<key>
ZOHO_CLIENT_ID=<id>
ZOHO_CLIENT_SECRET=<secret>
ZOHO_REFRESH_TOKEN=<token>
```

### 2. ZOHO API Access
- ZOHO Billing account must be active
- ZOHO API credentials must be valid
- Products/Plans must be published for subscription sync

### 3. Test Data
- Test customer: `test@circletel.test` (ID: `0adb9dac-6512-4bb0-8592-60fe74434c78`)
- Active services with published products
- Manual invoices (installation, pro-rata, etc.)
- Completed payment transactions

---

## Troubleshooting

### Issue: "Customer not synced to ZOHO"
**Solution**: The sync service will automatically sync the customer first. No action needed.

### Issue: "Service package not synced to ZOHO Billing"
**Solution**: Publish the product to ZOHO first via admin panel product publishing flow.

### Issue: "Invoice type 'recurring' should not be synced"
**Solution**: This is expected. Recurring invoices are auto-generated by ZOHO from subscriptions.

### Issue: "Payment is not completed"
**Solution**: Only completed payments can be synced. Ensure payment status is 'completed'.

### Issue: ZOHO API authentication errors
**Solution**: Check ZOHO credentials in environment variables. Ensure refresh token is valid.

---

## Next Steps

### Phase 3: Integration Triggers
Add automatic sync triggers at:
1. Customer registration (webhook)
2. Service activation (lifecycle hook)
3. Invoice generation (database trigger)
4. Payment completion (webhook)

### Phase 4: Monitoring Dashboard
Create admin dashboard widget showing:
- Sync status summary (synced/pending/failed counts)
- Recent sync activity
- Failed sync alerts
- Manual retry interface

### Phase 5: Data Backfill
Create scripts to backfill existing data:
- Backfill existing customers
- Backfill existing active subscriptions
- Validation and reconciliation

### Phase 6-8: Testing, Documentation, Deployment
- Comprehensive E2E testing
- Admin user guide
- Developer documentation
- Production deployment

---

## Summary

**✅ Completed**:
- 4 database migrations (all tables updated)
- 4 sync services (customer, subscription, invoice, payment)
- Billing client enhancement (createInvoice method)
- Test API endpoint (customer sync)
- Test scripts (4 files)

**⏳ Remaining**:
- Manual testing of all 4 sync services
- Integration triggers (Phase 3)
- Monitoring dashboard (Phase 4)
- Data backfill scripts (Phase 5)
- Testing & documentation (Phase 6-8)

**Architecture**: One-way sync (CircleTel → ZOHO Billing), Supabase-first, non-blocking async operations.

**Safe to Deploy**: Yes - All changes are additive, nullable columns, no breaking changes.
