# Netcash Webhook Integration Setup Guide

**Task 3.3: Netcash Webhook Integration**

Complete guide for setting up and managing Netcash payment webhooks in CircleTel.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Setup](#database-setup)
4. [Admin Configuration](#admin-configuration)
5. [Netcash Dashboard Setup](#netcash-dashboard-setup)
6. [Testing](#testing)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)
9. [Security Best Practices](#security-best-practices)

---

## Overview

The Netcash webhook integration provides:

- **Automated payment processing** - Real-time payment status updates
- **Order fulfillment** - Automatic service activation on successful payment
- **Email notifications** - Customer confirmations and admin alerts
- **Audit trail** - Complete webhook processing history
- **Retry mechanism** - Failed webhook recovery
- **Admin dashboard** - Monitoring and configuration UI

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Database Schema | `supabase/migrations/20251022000005_*.sql` | Tables: `payment_configuration`, `payment_webhooks`, `payment_webhook_audit` |
| Webhook Validator | `lib/payment/netcash-webhook-validator.ts` | Signature verification, IP whitelisting, payload validation |
| Webhook Processor | `lib/payment/netcash-webhook-processor.ts` | Business logic for payment success, failure, refunds, chargebacks |
| Webhook Endpoint | `app/api/payment/netcash/webhook/route.ts` | API route handling incoming webhooks |
| Admin Settings UI | `app/admin/payments/settings/page.tsx` | Configure test/production credentials |
| Monitoring Dashboard | `app/admin/payments/webhooks/page.tsx` | View webhook statistics and history |

---

## Architecture

### Webhook Processing Flow

```
Netcash → POST /api/payment/netcash/webhook
  │
  ├─[1]─> Rate Limiting Check (100 req/min per IP)
  │
  ├─[2]─> Fetch Active Payment Configuration (test/production)
  │
  ├─[3]─> Validate Webhook Request
  │        - HTTP method (POST)
  │        - IP whitelist (Netcash IPs)
  │        - HMAC-SHA256 signature
  │        - Payload structure
  │
  ├─[4]─> Check for Duplicate (Idempotency)
  │        - Transaction ID + Webhook Type
  │
  ├─[5]─> Log Webhook to Database
  │        - payment_webhooks table
  │        - Status: 'received'
  │
  ├─[6]─> Update Status to 'processing'
  │
  ├─[7]─> Route to Processor
  │        ├─> payment_success → Update order, send email, trigger activation
  │        ├─> payment_failure → Update order, send failure notification
  │        ├─> refund → Update order, send refund notification
  │        └─> chargeback → Update order, alert finance team
  │
  ├─[8]─> Update Status to 'processed' or 'failed'
  │
  └─[9]─> Return 200 OK (always, even on errors)
```

### Security Layers

1. **IP Whitelisting** - Only Netcash server IPs allowed
   - `196.33.252.0/24`
   - `41.203.154.0/24`
   - `102.165.16.0/24`

2. **HMAC-SHA256 Signature** - Cryptographic verification
   - Webhook secret stored in database
   - Signature calculated: `HMAC-SHA256(payload, secret)`
   - Timing-safe comparison

3. **Idempotency** - Prevents duplicate processing
   - Unique constraint: `(netcash_transaction_id, webhook_type)`

4. **Rate Limiting** - Prevents abuse
   - 100 requests per minute per IP
   - In-memory store (use Redis in production)

---

## Database Setup

### Step 1: Apply Migration

The webhook tables are created via Supabase migration:

```bash
# Migration file:
supabase/migrations/20251022000005_create_payment_webhooks_and_config.sql
```

**Apply via Supabase Dashboard:**

1. Go to Supabase Dashboard → SQL Editor
2. Paste the migration file contents
3. Click "Run"
4. Verify tables created:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('payment_configuration', 'payment_webhooks', 'payment_webhook_audit');

-- Should return 3 rows
```

### Step 2: Verify Test Configuration

The migration inserts a default test configuration:

```sql
SELECT * FROM payment_configuration WHERE environment = 'test';
```

Expected result:
- `environment`: `test`
- `provider`: `netcash`
- `service_key`: `7928c6de-219f-4b75-9408-ea0e8c8753b`
- `pci_vault_key`: `3143ee79-0c96-4909-968e-5a716fd19a65`
- `is_active`: `true`

---

## Admin Configuration

### Step 1: Access Payment Settings

1. **Login as Super Admin**
   - Navigate to: `https://yourdomain.com/admin/login`
   - Login with Super Admin credentials

2. **Access Payment Settings**
   - Navigate to: `/admin/payments/settings`
   - Only Super Admins can access this page (RBAC enforced)

### Step 2: Configure Test Environment

1. **Select "Test Environment" tab**

2. **Enter Credentials:**
   - **Service Key** (required): `7928c6de-219f-4b75-9408-ea0e8c8753b`
   - **PCI Vault Key** (optional): `3143ee79-0c96-4909-968e-5a716fd19a65`
   - **Merchant ID** (optional): `52340889417`

3. **Generate Webhook Secret:**
   - Click "Generate" button
   - Save the generated secret (32-character hex string)
   - **Important:** Copy this secret for Netcash dashboard setup

4. **Set URLs:**
   - **Payment Submit URL**: `https://sandbox.netcash.co.za/paynow/process`
   - **API URL**: `https://api.netcash.co.za`

5. **Enable Configuration:**
   - Set "Active Configuration" to **Enabled**

6. **Save:**
   - Click "Save Configuration"
   - Test connection with "Test Connection" button

### Step 3: Configure Production Environment

1. **Select "Production" tab**

2. **Enter Production Credentials:**
   - **DO NOT use test credentials in production**
   - Contact Netcash for production credentials

3. **Generate New Webhook Secret:**
   - Generate a **different** secret for production
   - Store securely (never commit to git)

4. **Set Production URLs:**
   - **Payment Submit URL**: `https://paynow.netcash.co.za/site/paynow.aspx`
   - **API URL**: `https://api.netcash.co.za`

5. **Enable Configuration:**
   - Set "Active Configuration" to **Enabled**
   - **Disable test environment** to prevent confusion

6. **Save:**
   - Click "Save Configuration"

---

## Netcash Dashboard Setup

### Step 1: Login to Netcash Dashboard

1. Go to: https://merchant.netcash.co.za/
2. Login with your merchant credentials

### Step 2: Navigate to Webhook Settings

1. Click **Account Settings** → **API Configuration**
2. Scroll to **Webhook URLs** section

### Step 3: Configure Webhook URL

1. **Add Webhook URL:**
   - Test: `https://your-test-domain.vercel.app/api/payment/netcash/webhook`
   - Production: `https://circletel.co.za/api/payment/netcash/webhook`

2. **Add Webhook Secret:**
   - Paste the webhook secret generated in admin UI
   - **Important:** Use the correct secret for test/production

3. **Select Webhook Events:**
   - ✅ Payment Approved
   - ✅ Payment Declined
   - ✅ Payment Cancelled
   - ✅ Refund Processed
   - ✅ Chargeback Initiated

4. **Set Webhook Method:**
   - Method: **POST**
   - Content-Type: **application/json**

5. **Save Configuration**

---

## Testing

### Manual Webhook Testing

#### Test 1: Successful Payment Webhook

```bash
curl -X POST https://your-domain.com/api/payment/netcash/webhook \
  -H "Content-Type: application/json" \
  -H "X-Netcash-Signature: YOUR_HMAC_SIGNATURE" \
  -d '{
    "Reference": "CT-1234567890-ABCD",
    "TransactionID": "TXN123456",
    "Status": "Approved",
    "Amount": "29900",
    "Extra1": "order-uuid-here",
    "Extra2": "CT-1234567890-ABCD",
    "Extra3": "customer@example.com"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "webhookId": "webhook-uuid",
  "processingTime": 245
}
```

#### Test 2: Health Check

```bash
curl https://your-domain.com/api/payment/netcash/webhook

# Expected Response:
{
  "status": "healthy",
  "environment": "test",
  "timestamp": "2025-10-22T12:00:00.000Z"
}
```

### Automated Testing

Use the Playwright E2E test suite:

```bash
# Run payment flow tests
npm run test:e2e -- payment-flow.spec.ts

# Test scenarios include:
# - Successful payment
# - Declined payment with retry
# - Insufficient funds
# - Expired card
# - Payment cancellation
# - Network timeout
```

### Netcash Sandbox Testing

**Test Card Numbers:**

| Card Number | CVV | Result |
|-------------|-----|--------|
| 4242 4242 4242 4242 | 123 | Approved |
| 4000 0000 0000 0002 | 123 | Declined |
| 4000 0000 0000 9995 | 123 | Insufficient Funds |
| 4000 0000 0000 0069 | 123 | Expired Card |
| 4000 0000 0000 0119 | 123 | Processing Error |

**Expiry Date:** Any future date (e.g., 12/25)

---

## Monitoring

### Access Webhook Dashboard

1. **Navigate to:** `/admin/payments/webhooks`
2. **Required Permission:** Finance View or Super Admin

### Dashboard Features

#### Statistics Cards (24-hour window)

- **Total Webhooks** - Count of all webhooks received
- **Success Rate** - Percentage of successfully processed webhooks
- **Failed Webhooks** - Count and percentage of failures
- **Avg Processing Time** - Average time in milliseconds

#### Webhook Table

- **Filters:**
  - Status (all, received, processing, processed, failed, duplicate)
  - Type (payment_success, payment_failure, refund, etc.)
  - Search (reference, transaction ID, order ID)

- **Columns:**
  - Status badge (color-coded)
  - Webhook type
  - Payment reference and transaction ID
  - Amount
  - Created and processed timestamps
  - Actions (view details, retry)

#### Webhook Details Modal

- Complete webhook information
- Raw JSON payload viewer
- Security details (signature valid, source IP)
- Error messages for failed webhooks
- Processing timeline

### SQL Monitoring Queries

```sql
-- Get webhook statistics (last 24 hours)
SELECT * FROM get_webhook_statistics(24);

-- Find failed webhooks
SELECT * FROM payment_webhooks
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 20;

-- Check webhook success rate
SELECT calculate_webhook_success_rate(24) AS success_rate_percent;

-- Find duplicate webhooks
SELECT * FROM payment_webhooks
WHERE status = 'duplicate'
ORDER BY created_at DESC;

-- Audit trail for specific order
SELECT
  pw.*,
  pwa.event_type,
  pwa.event_data,
  pwa.created_at AS audit_created_at
FROM payment_webhooks pw
LEFT JOIN payment_webhook_audit pwa ON pw.id = pwa.webhook_id
WHERE pw.order_id = 'YOUR_ORDER_ID'
ORDER BY pwa.created_at DESC;
```

---

## Troubleshooting

### Problem: Webhooks not being received

**Diagnosis:**
1. Check webhook URL in Netcash dashboard
2. Verify webhook endpoint is accessible:
   ```bash
   curl https://your-domain.com/api/payment/netcash/webhook
   # Should return: {"status": "healthy", ...}
   ```
3. Check deployment logs for errors

**Solution:**
- Ensure webhook URL is publicly accessible (no firewall blocking)
- Verify SSL certificate is valid
- Check Netcash dashboard for webhook delivery errors

### Problem: Signature validation failing

**Diagnosis:**
```sql
SELECT * FROM payment_webhooks
WHERE signature_valid = false
ORDER BY created_at DESC
LIMIT 10;
```

**Solution:**
1. Verify webhook secret matches in:
   - Admin UI (`/admin/payments/settings`)
   - Netcash dashboard
2. Check payload format matches expected structure
3. Review webhook validator logs

### Problem: Duplicate webhooks

**Diagnosis:**
```sql
SELECT * FROM payment_webhooks
WHERE status = 'duplicate'
ORDER BY created_at DESC;
```

**Solution:**
- This is expected behavior (Netcash may retry)
- Idempotency check prevents duplicate processing
- No action needed unless excessive duplicates

### Problem: Failed webhook processing

**Diagnosis:**
```sql
SELECT
  id,
  payment_reference,
  webhook_type,
  error_message,
  retry_count,
  created_at
FROM payment_webhooks
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 20;
```

**Solution:**
1. Check `error_message` column for details
2. Review webhook processor logs
3. Verify order exists in database
4. Check email service (Resend) is configured
5. Use retry functionality in dashboard

### Problem: Orders not updating

**Diagnosis:**
1. Check webhook was processed:
   ```sql
   SELECT * FROM payment_webhooks
   WHERE payment_reference = 'YOUR_REFERENCE'
   AND status = 'processed';
   ```

2. Check order status:
   ```sql
   SELECT id, payment_reference, payment_status, order_status, updated_at
   FROM orders
   WHERE payment_reference = 'YOUR_REFERENCE';
   ```

**Solution:**
- Verify webhook reached 'processed' status
- Check audit logs for order updates
- Review processor logic for payment type

---

## Security Best Practices

### 1. Webhook Secret Management

✅ **DO:**
- Generate unique secrets for test and production
- Store secrets in database (encrypted at rest)
- Rotate secrets periodically (every 6 months)
- Use strong secrets (32+ characters, high entropy)

❌ **DON'T:**
- Never commit secrets to git
- Don't use same secret for test and production
- Don't share secrets via email or chat
- Don't use predictable secrets

### 2. IP Whitelisting

✅ **DO:**
- Maintain updated Netcash IP whitelist
- Monitor for unauthorized IPs in logs
- Use CIDR notation for ranges

❌ **DON'T:**
- Don't disable IP whitelisting in production
- Don't add untrusted IPs to whitelist

### 3. RBAC Access Control

✅ **DO:**
- Limit payment settings access to Super Admins only
- Grant Finance team webhook monitoring access
- Use audit logs to track configuration changes

❌ **DON'T:**
- Don't grant unnecessary permissions
- Don't share Super Admin credentials

### 4. Monitoring and Alerts

✅ **DO:**
- Monitor webhook success rate (should be > 95%)
- Set up alerts for failed webhooks
- Review audit logs regularly
- Monitor processing time (should be < 500ms)

❌ **DON'T:**
- Don't ignore failed webhook alerts
- Don't disable signature validation
- Don't ignore duplicate webhook patterns

### 5. Production Deployment

✅ **DO:**
- Test thoroughly in sandbox environment
- Use environment-specific configurations
- Enable SSL/TLS for webhook endpoint
- Set up monitoring and logging
- Document production credentials securely

❌ **DON'T:**
- Don't deploy without testing
- Don't use test credentials in production
- Don't skip signature validation
- Don't expose sensitive data in logs

---

## Support and Contacts

### CircleTel Development Team

- **Technical Lead:** [Your Name]
- **Email:** dev@circletel.co.za
- **Slack:** #dev-payments

### Netcash Support

- **Merchant Support:** 0861 338 338
- **Email:** support@netcash.co.za
- **Developer Portal:** https://api.netcash.co.za/
- **Status Page:** https://status.netcash.co.za/

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-22 | 1.0.0 | Initial webhook integration release |

---

## Related Documentation

- [Netcash Integration Guide](./NETCASH-INTEGRATION-GUIDE.md)
- [Payment Flow Tests](../testing/payment-flow-tests.md)
- [Admin RBAC System](../rbac/RBAC_SYSTEM_GUIDE.md)
- [Supabase Setup](../setup/SUPABASE_AUTH_USER_CREATION.md)

---

**Last Updated:** 2025-10-22
**Maintained By:** CircleTel Development Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)
