# Netcash Webhook Configuration Guide

**Date:** 2025-10-22
**Status:** Production Ready
**Integration:** CircleTel Payment Gateway

---

## Overview

CircleTel uses Netcash's webhook system to receive real-time payment notifications for:
- Payment acceptance
- Payment decline/rejection
- General payment status notifications

This document details the webhook configuration for both **test** and **production** Netcash accounts.

---

## Webhook Endpoints

### Test Account (52340)

**Base URL:** `https://integration-staging.agilitygis.com`

| Webhook Type | URL | Purpose |
|--------------|-----|---------|
| **Accept URL** | `/api/paymentgateway/webhook/netcash/paynow/accepted?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF` | Successful payment notifications |
| **Decline URL** | `/api/paymentgateway/webhook/netcash/paynow/rejected?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF` | Failed/rejected payment notifications |
| **Notify URL** | `/api/paymentgateway/webhook/netcash/notify?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF` | General payment status notifications |

**Account ID:** 52340
**Account Name:** Circle Tel SA - Test account

---

### Production Account (52552945156)

**Base URL:** `https://integration.agilitygis.com`

| Webhook Type | URL | Purpose |
|--------------|-----|---------|
| **Accept URL** | `/api/paymentgateway/webhook/netcash/paynow/accepted?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF` | Successful payment notifications |
| **Decline URL** | `/api/paymentgateway/webhook/netcash/paynow/rejected?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF` | Failed/rejected payment notifications |
| **Notify URL** | `/api/paymentgateway/webhook/netcash/notify?integratorKey=gFExoQEvXrsdu8Fp6a234f8ErfsusF5LTaEDF` | General payment status notifications |

**Account ID:** 52552945156
**Account Name:** Circle Tel SA

---

## Integration Architecture

### Current Setup (AgilityGIS Gateway)

CircleTel currently uses **AgilityGIS integration gateway** as an intermediary between Netcash and the CircleTel Next.js application:

```
Netcash → AgilityGIS Gateway → CircleTel Next.js App
         (staging/production)     (localhost/Vercel)
```

**AgilityGIS Gateway Responsibilities:**
- Receives Netcash webhook callbacks
- Validates webhook signatures
- Transforms Netcash payload to CircleTel format
- Forwards to CircleTel application endpoints
- Provides retry mechanism and logging

### CircleTel Direct Integration (Phase 1B Complete)

The **Phase 1B implementation** includes a **direct webhook integration** that can replace the AgilityGIS gateway:

```
Netcash → CircleTel Next.js App (Direct)
         /api/payment/netcash/webhook
```

**CircleTel Direct Webhook Features:**
- ✅ HMAC-SHA256 signature verification
- ✅ IP whitelist enforcement (3 Netcash IP ranges)
- ✅ Idempotency check (duplicate detection)
- ✅ Rate limiting (100 requests/minute per IP)
- ✅ Payment status processing (success, failure, refund, chargeback)
- ✅ Order status updates
- ✅ Email notifications
- ✅ Service activation trigger
- ✅ Admin monitoring dashboard
- ✅ Webhook retry mechanism

**Implementation Files:**
- `app/api/payment/netcash/webhook/route.ts` (542 lines)
- `lib/payment/netcash-webhook-validator.ts` (280 lines)
- `lib/payment/netcash-webhook-processor.ts` (420 lines)
- `app/admin/payments/webhooks/page.tsx` (350 lines)

---

## Migration Path

### Current State (Using AgilityGIS Gateway)

**Advantages:**
- ✅ Battle-tested integration
- ✅ Existing retry logic
- ✅ Logging and monitoring
- ✅ No changes to Netcash configuration

**Disadvantages:**
- ❌ Additional latency (extra hop)
- ❌ Dependency on third-party gateway
- ❌ Limited control over webhook processing
- ❌ Additional point of failure

### Future State (Direct Integration)

**Advantages:**
- ✅ Lower latency (direct connection)
- ✅ Full control over webhook processing
- ✅ No third-party dependencies
- ✅ Comprehensive admin monitoring
- ✅ Built-in security (HMAC, IP whitelist, rate limiting)

**Migration Steps:**

1. **Test Direct Integration:**
   ```bash
   # Update Netcash test account (52340)
   Accept URL: https://circletel-nextjs-dev.vercel.app/api/payment/netcash/webhook
   Decline URL: https://circletel-nextjs-dev.vercel.app/api/payment/netcash/webhook
   Notify URL: https://circletel-nextjs-dev.vercel.app/api/payment/netcash/webhook
   ```

2. **Configure Environment Variables:**
   ```env
   NETCASH_WEBHOOK_SECRET=<strong-32-char-secret>
   NETCASH_MERCHANT_ID=52340
   NETCASH_MERCHANT_KEY=<merchant-key>
   ```

3. **Run Test Transactions:**
   - Use Netcash test cards
   - Verify webhook delivery in admin dashboard
   - Check order status updates
   - Validate email notifications

4. **Monitor Performance:**
   - Check webhook success rate (target: >95%)
   - Monitor average response time (target: <2s)
   - Review error logs for issues

5. **Update Production:**
   ```bash
   # Update Netcash production account (52552945156)
   Accept URL: https://circletel.co.za/api/payment/netcash/webhook
   Decline URL: https://circletel.co.za/api/payment/netcash/webhook
   Notify URL: https://circletel.co.za/api/payment/netcash/webhook
   ```

---

## Webhook Payload Structure

### Netcash Standard Payload

```json
{
  "Reference": "CT-1234567890-ORDER",
  "TransactionID": "TXN-NETCASH-12345",
  "Status": "Approved",
  "Amount": "159900",
  "Extra1": "order-uuid-12345",
  "Extra2": "CT-1234567890-ORDER",
  "Extra3": "customer@example.com",
  "PaymentDate": "2025-10-22T10:30:00Z",
  "PaymentMethod": "Credit Card"
}
```

**Field Mapping:**
- `Reference` - Payment reference (matches order.payment_reference)
- `TransactionID` - Netcash transaction ID
- `Status` - Payment status (Approved, Declined, Cancelled)
- `Amount` - Amount in cents (1599.00 = 159900)
- `Extra1` - Order ID (UUID)
- `Extra2` - Duplicate of Reference
- `Extra3` - Customer email
- `PaymentDate` - ISO 8601 timestamp
- `PaymentMethod` - Payment method used

---

## Security Configuration

### HMAC Signature Verification

**Algorithm:** HMAC-SHA256

**Process:**
1. Netcash sends `X-Netcash-Signature` header with webhook
2. CircleTel generates signature from payload using shared secret
3. Compare signatures - reject if mismatch

**Implementation:**
```typescript
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');
```

### IP Whitelist

**Netcash IP Ranges:**
- `196.33.252.0/24`
- `41.203.154.0/24`
- `102.165.16.0/24`

**Implementation:** Checked via `X-Forwarded-For` or `X-Real-IP` headers

### Rate Limiting

**Limit:** 100 requests per minute per IP address
**Response:** 429 Too Many Requests with `Retry-After` header
**Implementation:** In-memory rate limiting (Redis recommended for production)

---

## Testing

### Test Cards (Netcash Test Environment)

| Card Number | CVV | Expiry | Result |
|-------------|-----|--------|--------|
| `4000000000000002` | 123 | Any future | ✅ Approved |
| `4000000000000010` | 123 | Any future | ❌ Declined |
| `4000000000009995` | 123 | Any future | ❌ Insufficient Funds |

### Manual Webhook Testing

**Using cURL:**
```bash
# Generate signature
PAYLOAD='{"Reference":"CT-TEST-123","TransactionID":"TXN-TEST","Status":"Approved","Amount":"100000","Extra1":"order-123"}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "test_webhook_secret_12345" | awk '{print $2}')

# Send webhook
curl -X POST https://localhost:3005/api/payment/netcash/webhook \
  -H "Content-Type: application/json" \
  -H "X-Netcash-Signature: $SIGNATURE" \
  -H "X-Forwarded-For: 196.33.252.1" \
  -d "$PAYLOAD"
```

### Automated Testing

**Run Playwright tests:**
```bash
# Run webhook integration tests
npx playwright test tests/e2e/payment-webhook.spec.ts

# Run specific test
npx playwright test -g "WH3: Should process payment success webhook"
```

---

## Monitoring

### Admin Dashboard

**URL:** `/admin/payments/webhooks`

**Features:**
- Real-time webhook logs
- Statistics cards (Total, Success Rate, Failed, Avg Processing Time)
- Filter by status (success, failed, pending)
- Search by transaction ID or reference
- Webhook details modal with raw JSON viewer
- Retry button for failed webhooks

**Metrics to Monitor:**
- **Success Rate:** Target >95%
- **Average Response Time:** Target <2s
- **Failed Webhooks:** Should be <5%
- **Duplicate Rate:** Should be 0%

### Health Check Endpoint

**URL:** `GET /api/payment/netcash/webhook`

**Response (Healthy):**
```json
{
  "status": "healthy",
  "environment": "production",
  "timestamp": "2025-10-22T10:30:00Z"
}
```

**Response (Unhealthy):**
```json
{
  "status": "unhealthy",
  "error": "No active payment configuration found",
  "timestamp": "2025-10-22T10:30:00Z"
}
```

---

## Troubleshooting

### Webhook Not Received

1. **Check Netcash Configuration:**
   - Verify URLs are correct in Netcash portal
   - Ensure no typos in URLs
   - Confirm account is active

2. **Check Firewall/Network:**
   - Verify Netcash IPs are not blocked
   - Check reverse proxy configuration (Vercel)
   - Ensure HTTPS is configured correctly

3. **Check Application Logs:**
   - Review admin webhook dashboard
   - Check Vercel function logs
   - Look for signature validation errors

### Webhook Signature Failed

1. **Verify Webhook Secret:**
   - Ensure `NETCASH_WEBHOOK_SECRET` matches Netcash configuration
   - Check for whitespace or special characters
   - Verify environment variable is loaded

2. **Check Payload Format:**
   - Ensure payload is valid JSON
   - Verify content-type header is `application/json`
   - Check for extra whitespace or BOM characters

### Duplicate Webhooks

1. **Idempotency Check:**
   - CircleTel automatically detects duplicates via `TransactionID`
   - Check `payment_webhooks` table for duplicate records
   - Review idempotency logic in webhook processor

2. **Netcash Retry Logic:**
   - Netcash retries failed webhooks automatically
   - Always return 200 status code (even for errors)
   - Log errors internally but don't fail the request

---

## Production Deployment Checklist

### Pre-Deployment

- [ ] Generate strong webhook secret (32+ characters)
- [ ] Configure environment variables in Vercel
- [ ] Set up Redis for distributed rate limiting (optional)
- [ ] Configure Sentry for error tracking
- [ ] Test webhook signature generation
- [ ] Verify IP whitelist is configured

### Deployment

- [ ] Deploy application to Vercel
- [ ] Update Netcash production account URLs
- [ ] Run smoke test with test card
- [ ] Monitor first 10 production transactions
- [ ] Verify email notifications are sent

### Post-Deployment

- [ ] Monitor webhook success rate (target >95%)
- [ ] Review error logs daily for first week
- [ ] Set up alerting for failed webhooks
- [ ] Document any issues encountered
- [ ] Train support team on webhook monitoring

---

## Support Contacts

**Netcash Support:**
- Email: support@netcash.co.za
- Phone: +27 11 305 0000
- Portal: https://merchant.netcash.co.za

**CircleTel Development Team:**
- Webhook Issues: Check `/admin/payments/webhooks` dashboard first
- Critical Failures: Alert development team immediately
- General Questions: Refer to this documentation

---

## References

- **Netcash API Documentation:** https://netcash.co.za/developers
- **CircleTel Webhook Implementation:** `app/api/payment/netcash/webhook/route.ts`
- **Test Results:** `docs/testing/PAYMENT_TEST_RESULTS.md`
- **Phase 1B Summary:** `docs/features/customer-journey/PHASE_1B_COMPLETION_SUMMARY.md`

---

**Last Updated:** 2025-10-22
**Version:** 1.0
**Status:** Production Ready

🤖 Generated with [Claude Code](https://claude.com/claude-code)
