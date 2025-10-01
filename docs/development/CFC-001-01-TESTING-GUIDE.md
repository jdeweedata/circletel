# CFC-001-01 Payment Integration Testing Guide

## Overview
This guide provides step-by-step instructions for testing the Netcash payment integration in the CircleTel order flow.

## Prerequisites
- Development server running (`npm run dev:memory`)
- `.env.local` configured with Netcash test credentials
- Supabase database migrations applied

## Test Environment
- **Netcash Environment**: Sandbox
- **Merchant ID**: 52340889417 (Circle Tel SA - Test account)
- **Test Card Details**: Use Netcash test cards (see below)

## Testing Checklist

### Phase 1: Order Creation API ✅
```bash
# Test order creation endpoint
curl -X POST http://localhost:3000/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test Customer",
    "customerEmail": "test@circletel.co.za",
    "customerPhone": "+27123456789",
    "packageId": "pkg-001",
    "serviceType": "fibre",
    "speedDown": 100,
    "speedUp": 50,
    "basePrice": 699.00,
    "installationFee": 299.00,
    "totalAmount": 998.00,
    "installationAddress": "123 Test Street, Cape Town",
    "coordinates": {"lat": -33.9249, "lng": 18.4241},
    "customerNotes": "Test order"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "payment_reference": "CT-{timestamp}-{digits}",
    "customer_email": "test@circletel.co.za",
    "customer_name": "Test Customer",
    "total_amount": 998,
    "payment_status": "pending",
    "order_status": "pending_payment",
    "created_at": "ISO timestamp"
  }
}
```

### Phase 2: Payment Initiation API ✅
```bash
# Test payment initiation (use order ID from Phase 1)
curl -X POST http://localhost:3000/api/payment/netcash/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "b3f59732-f3a5-4e8a-9199-4feeba7a3448",
    "amount": 998.00,
    "customerEmail": "test@circletel.co.za",
    "customerName": "Test Customer",
    "paymentReference": "CT-1759310810380-0037"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "paymentUrl": "https://sandbox.netcash.co.za/paynow/process?ServiceKey=...",
  "paymentReference": "CT-1759310810380-0037",
  "orderId": "b3f59732-f3a5-4e8a-9199-4feeba7a3448",
  "message": "Payment URL generated successfully"
}
```

### Phase 3: Webhook Health Check ✅
```bash
# Test webhook endpoint
curl http://localhost:3000/api/payment/netcash/webhook
```

**Expected Response**:
```json
{
  "status": "active",
  "service": "netcash-webhook",
  "timestamp": "2025-10-01T09:27:59.186Z",
  "message": "CircleTel Netcash webhook endpoint is operational"
}
```

### Phase 4: End-to-End UI Flow

#### Step 1: Navigate to Order Flow
1. Open browser: `http://localhost:3000/order/coverage`
2. Complete coverage check (select address)
3. Choose a package

#### Step 2: Account Information
1. Navigate to: `http://localhost:3000/order/account`
2. Fill in account details:
   - First Name
   - Last Name
   - Email
   - Phone
   - ID Number

#### Step 3: Contact Information
1. Navigate to: `http://localhost:3000/order/contact`
2. Verify contact details
3. Add any additional contact information

#### Step 4: Installation Details
1. Navigate to: `http://localhost:3000/order/installation`
2. Select preferred installation date
3. Add special instructions (optional)
4. Click "Next" to proceed to payment

#### Step 5: Payment Stage ⭐ NEW
1. Navigate to: `http://localhost:3000/order/payment`
2. Review order summary:
   - Package details
   - Pricing breakdown (base price + installation)
   - Installation timeline
   - Customer information
3. Click "Pay with Netcash" button
4. Verify redirect to Netcash sandbox URL

#### Step 6: Netcash Payment (Sandbox)
1. Complete payment on Netcash hosted page
2. Use test card details:
   - **Successful Payment**: Card Number `5200000000000015`
   - **Failed Payment**: Card Number `4000000000000002`
3. After payment, verify redirect back to CircleTel

#### Step 7: Order Confirmation
1. Redirected to: `http://localhost:3000/order/confirmation`
2. Verify confirmation page displays:
   - Payment Reference
   - Transaction ID (from Netcash)
   - Success message
   - Next steps information

### Phase 5: Database Verification

#### Check Order Record
```sql
SELECT
  id,
  payment_reference,
  customer_name,
  customer_email,
  service_type,
  base_price,
  installation_fee,
  total_amount,
  payment_status,
  order_status,
  netcash_transaction_id,
  payment_date
FROM orders
WHERE payment_reference = 'CT-XXXXX-XXXX'
ORDER BY created_at DESC;
```

**Expected Values**:
- `payment_status`: 'completed' (after successful payment)
- `order_status`: 'payment_received'
- `netcash_transaction_id`: Populated from webhook
- `payment_date`: Set after webhook

#### Check Audit Logs
```sql
SELECT
  id,
  order_id,
  event_type,
  status,
  signature_valid,
  created_at
FROM payment_audit_logs
WHERE order_id = 'uuid-from-order'
ORDER BY created_at DESC;
```

**Expected Events**:
1. `payment_initiated` - When payment URL generated
2. `webhook_received` - When Netcash callback received
3. `payment_verified` - After signature verification

### Phase 6: Email Verification
1. Check for confirmation email sent to customer
2. Verify email contains:
   - Payment confirmation
   - Order reference
   - Amount paid
   - Service type
   - Next steps

## Test Cards (Netcash Sandbox)

### Successful Transactions
- **Card Number**: `5200000000000015`
- **CVV**: Any 3 digits
- **Expiry**: Any future date
- **Result**: Payment approved

### Failed Transactions
- **Card Number**: `4000000000000002`
- **CVV**: Any 3 digits
- **Expiry**: Any future date
- **Result**: Payment declined

### Cancelled Transactions
- Click "Cancel" button on Netcash payment page
- Should redirect to: `http://localhost:3006/order/payment`

## Troubleshooting

### Order Creation Fails
**Error**: `"null value in column 'customer_id' violates not-null constraint"`
**Solution**: Ensure migration to make customer_id nullable has been applied

### Payment Initiation Fails
**Error**: `"Payment gateway configuration error"`
**Solution**: Verify all environment variables in `.env.local`:
- `NETCASH_MERCHANT_ID`
- `NEXT_PUBLIC_NETCASH_SERVICE_KEY`
- `NETCASH_WEBHOOK_SECRET`
- `NETCASH_PAYMENT_URL`

### Webhook Not Receiving Callbacks
**Error**: Webhook never triggered after payment
**Solution**: For local testing, Netcash cannot reach localhost webhooks. Options:
1. Use ngrok to expose local server
2. Deploy to staging environment with public URL
3. Manually test webhook with curl

### Email Not Sending
**Error**: Confirmation email not received
**Solution**: Check Resend configuration:
- `RESEND_API_KEY` set in `.env.local`
- `RESEND_FROM_EMAIL` configured
- Check Resend dashboard for delivery status

## Next Steps After Testing

1. **Production Deployment**:
   - Update `.env` with production Netcash credentials
   - Configure production webhook URL
   - Test with real Netcash merchant account

2. **CRM Integration** (Future):
   - Sync completed orders to Zoho CRM
   - Create leads/deals automatically
   - Update `crm_synced` and `crm_lead_id` fields

3. **Email Templates** (Enhancement):
   - Design branded HTML email templates
   - Include order details and installation timeline
   - Add support contact information

4. **Order Management Dashboard** (Future):
   - Admin view of all orders
   - Payment status tracking
   - Failed payment retry mechanism

## Related Documentation
- [NETCASH-INTEGRATION-GUIDE.md](../setup/NETCASH-INTEGRATION-GUIDE.md)
- [SETUP-COMPLETE.md](../setup/SETUP-COMPLETE.md)
- [API Routes Documentation](../../app/api/README.md)
