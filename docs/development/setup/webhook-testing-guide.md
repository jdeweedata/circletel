# Webhook Testing Guide for Local Development

**Story**: CFC-001-01 Payment Integration
**Component**: Netcash Webhook Handler
**Purpose**: Test payment webhooks in local development environment

---

## Table of Contents

1. [Overview](#overview)
2. [Setup with Ngrok](#setup-with-ngrok)
3. [Manual Webhook Testing](#manual-webhook-testing)
4. [Automated Testing Script](#automated-testing-script)
5. [Webhook Payload Examples](#webhook-payload-examples)
6. [Troubleshooting](#troubleshooting)

---

## Overview

Payment webhooks are POST requests from Netcash to your application when payment status changes. In production, Netcash sends webhooks directly to your public URL. In local development, you need a tunnel service like **ngrok** to expose your localhost.

**Webhook Flow:**
```
Customer Pays → Netcash Gateway → Webhook POST → Your API
                                   ↓
                            Verify Signature
                                   ↓
                            Update Order Status
                                   ↓
                            Send Email Confirmation
```

---

## Setup with Ngrok

### Install Ngrok

```bash
# Option 1: npm (recommended)
npm install -g ngrok

# Option 2: Download binary
# Visit: https://ngrok.com/download
# Extract and add to PATH

# Verify installation
ngrok version
```

### Start Ngrok Tunnel

```bash
# Start your dev server first
npm run dev

# In a new terminal, start ngrok
ngrok http 3006

# Output:
# Forwarding: https://abc123def.ngrok.io -> http://localhost:3006
```

### Configure Netcash Webhook URL

1. Log in to **Netcash Sandbox Dashboard**
2. Navigate to **Settings → Webhooks**
3. Add webhook URL: `https://abc123def.ngrok.io/api/payment/netcash/webhook`
4. Set method: **POST**
5. Add custom header (optional):
   ```
   X-Netcash-Environment: sandbox
   ```

### Test Webhook Delivery

```bash
# Make a test payment using sandbox card
# Card: 4000000000000002, CVV: 123

# Monitor ngrok requests:
# Visit: http://localhost:4040
# (Ngrok web interface shows all requests)
```

---

## Manual Webhook Testing

For quick testing without completing full payment flow:

### Using cURL

```bash
# Successful payment webhook
curl -X POST http://localhost:3006/api/payment/netcash/webhook \
  -H "Content-Type: application/json" \
  -H "X-Netcash-Signature: $(echo -n '{"transaction_id":"TEST001","status":"completed","payment_reference":"CT-1738367200-4829","amount":"799.00"}' | openssl dgst -sha256 -hmac 'your_webhook_secret' | awk '{print $2}')" \
  -d '{
    "transaction_id": "TEST001",
    "status": "completed",
    "payment_reference": "CT-1738367200-4829",
    "amount": "799.00",
    "payment_method": "card",
    "card_last4": "0002",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }'
```

### Using Postman

1. **Create New Request**:
   - Method: `POST`
   - URL: `http://localhost:3006/api/payment/netcash/webhook`

2. **Set Headers**:
   ```
   Content-Type: application/json
   X-Netcash-Signature: [computed signature]
   ```

3. **Request Body** (raw JSON):
   ```json
   {
     "transaction_id": "TEST001",
     "status": "completed",
     "payment_reference": "CT-1738367200-4829",
     "amount": "799.00",
     "payment_method": "card",
     "card_last4": "0002",
     "timestamp": "2025-02-01T12:00:00Z"
   }
   ```

4. **Compute Signature** (Pre-request Script):
   ```javascript
   const crypto = require('crypto');
   const secret = pm.environment.get('NETCASH_WEBHOOK_SECRET');
   const body = pm.request.body.raw;

   const signature = crypto
     .createHmac('sha256', secret)
     .update(body)
     .digest('hex');

   pm.request.headers.add({
     key: 'X-Netcash-Signature',
     value: signature
   });
   ```

---

## Automated Testing Script

Create a Node.js test script for rapid webhook testing:

### Create Test Script

```bash
# Create script file
touch scripts/test-webhook.js
```

### Script Content

```javascript
// scripts/test-webhook.js
const crypto = require('crypto');
const fetch = require('node-fetch');

// Configuration
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3006/api/payment/netcash/webhook';
const WEBHOOK_SECRET = process.env.NETCASH_WEBHOOK_SECRET || 'your_webhook_secret';

// Test scenarios
const testScenarios = [
  {
    name: 'Successful Payment',
    payload: {
      transaction_id: 'TEST_SUCCESS_001',
      status: 'completed',
      payment_reference: 'CT-1738367200-4829',
      amount: '799.00',
      payment_method: 'card',
      card_last4: '0002',
      timestamp: new Date().toISOString()
    }
  },
  {
    name: 'Failed Payment',
    payload: {
      transaction_id: 'TEST_FAILED_002',
      status: 'failed',
      payment_reference: 'CT-1738367200-4830',
      amount: '799.00',
      payment_method: 'card',
      error_code: 'insufficient_funds',
      error_message: 'Insufficient funds',
      timestamp: new Date().toISOString()
    }
  },
  {
    name: 'Invalid Signature',
    payload: {
      transaction_id: 'TEST_INVALID_003',
      status: 'completed',
      payment_reference: 'CT-1738367200-4831',
      amount: '799.00',
      timestamp: new Date().toISOString()
    },
    invalidSignature: true
  }
];

// Generate signature
function generateSignature(payload, secret) {
  const payloadString = JSON.stringify(payload);
  return crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex');
}

// Send webhook
async function sendWebhook(scenario) {
  const payload = scenario.payload;
  const payloadString = JSON.stringify(payload);

  const signature = scenario.invalidSignature
    ? 'invalid_signature_12345'
    : generateSignature(payload, WEBHOOK_SECRET);

  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`📦 Payload:`, payload);
  console.log(`🔐 Signature: ${signature.substring(0, 10)}...`);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Netcash-Signature': signature
      },
      body: payloadString
    });

    const responseData = await response.json();

    if (response.ok) {
      console.log(`✅ Success: ${response.status}`);
      console.log(`📨 Response:`, responseData);
    } else {
      console.log(`❌ Failed: ${response.status}`);
      console.log(`📨 Response:`, responseData);
    }
  } catch (error) {
    console.error(`💥 Error:`, error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Webhook Tests...');
  console.log(`🔗 Webhook URL: ${WEBHOOK_URL}`);
  console.log(`🔑 Using Secret: ${WEBHOOK_SECRET.substring(0, 5)}...`);

  for (const scenario of testScenarios) {
    await sendWebhook(scenario);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay between tests
  }

  console.log('\n✨ All tests completed!');
}

// Execute
runTests().catch(console.error);
```

### Run Test Script

```bash
# Set environment variables
export WEBHOOK_URL=http://localhost:3006/api/payment/netcash/webhook
export NETCASH_WEBHOOK_SECRET=your_webhook_secret

# Run tests
node scripts/test-webhook.js
```

### Expected Output

```
🚀 Starting Webhook Tests...
🔗 Webhook URL: http://localhost:3006/api/payment/netcash/webhook
🔑 Using Secret: your_w...

🧪 Testing: Successful Payment
📦 Payload: { transaction_id: 'TEST_SUCCESS_001', ... }
🔐 Signature: 8a3f5c2b1d...
✅ Success: 200
📨 Response: { success: true, orderId: '...' }

🧪 Testing: Failed Payment
📦 Payload: { transaction_id: 'TEST_FAILED_002', ... }
🔐 Signature: 7b2c4a1e3f...
✅ Success: 200
📨 Response: { success: true, orderId: '...' }

🧪 Testing: Invalid Signature
📦 Payload: { transaction_id: 'TEST_INVALID_003', ... }
🔐 Signature: invalid_si...
❌ Failed: 401
📨 Response: { error: 'Invalid signature' }

✨ All tests completed!
```

---

## Webhook Payload Examples

### 1. Successful Payment

```json
{
  "transaction_id": "NC_20250201_001234",
  "status": "completed",
  "payment_reference": "CT-1738367200-4829",
  "amount": "799.00",
  "currency": "ZAR",
  "payment_method": "card",
  "card_type": "visa",
  "card_last4": "0002",
  "cardholder_name": "John Doe",
  "timestamp": "2025-02-01T14:30:00Z",
  "merchant_id": "100012345"
}
```

### 2. Failed Payment (Declined)

```json
{
  "transaction_id": "NC_20250201_001235",
  "status": "failed",
  "payment_reference": "CT-1738367200-4830",
  "amount": "799.00",
  "currency": "ZAR",
  "payment_method": "card",
  "error_code": "card_declined",
  "error_message": "Card declined by issuer",
  "timestamp": "2025-02-01T14:32:00Z",
  "merchant_id": "100012345"
}
```

### 3. Failed Payment (Insufficient Funds)

```json
{
  "transaction_id": "NC_20250201_001236",
  "status": "failed",
  "payment_reference": "CT-1738367200-4831",
  "amount": "799.00",
  "currency": "ZAR",
  "payment_method": "card",
  "error_code": "insufficient_funds",
  "error_message": "Insufficient funds available",
  "timestamp": "2025-02-01T14:35:00Z",
  "merchant_id": "100012345"
}
```

### 4. Refunded Payment

```json
{
  "transaction_id": "NC_20250201_001234",
  "status": "refunded",
  "payment_reference": "CT-1738367200-4829",
  "amount": "799.00",
  "refund_amount": "799.00",
  "refund_reason": "Customer request",
  "currency": "ZAR",
  "timestamp": "2025-02-02T10:00:00Z",
  "merchant_id": "100012345"
}
```

---

## Troubleshooting

### Issue 1: Webhook Returns 401 Unauthorized

**Symptom**: Every webhook request returns 401 status.

**Possible Causes**:
1. Signature mismatch (different secret keys)
2. Incorrect signature computation
3. Body modified after signature generation

**Debug Steps**:
```bash
# 1. Verify webhook secret matches
echo "App Secret: $NETCASH_WEBHOOK_SECRET"
# Compare with Netcash dashboard secret

# 2. Log signature computation in webhook handler
# Add to /api/payment/netcash/webhook/route.ts:
console.log('[DEBUG] Received signature:', receivedSignature);
console.log('[DEBUG] Computed signature:', computedSignature);
console.log('[DEBUG] Body:', requestBody);

# 3. Test with simple payload
curl -X POST http://localhost:3006/api/payment/netcash/webhook \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'
```

### Issue 2: Ngrok Tunnel Disconnects

**Symptom**: Webhook URL becomes unreachable after some time.

**Solution**:
```bash
# Free ngrok tunnels expire after 2 hours
# Restart ngrok and update webhook URL in Netcash dashboard

# Or upgrade to ngrok paid plan for persistent URLs
ngrok http 3006 --region eu --hostname your-custom-domain.ngrok.io
```

### Issue 3: Database Update Fails

**Symptom**: Webhook processes but order status doesn't update.

**Debug Steps**:
```sql
-- Check if order exists
SELECT * FROM orders WHERE payment_reference = 'CT-1738367200-4829';

-- Check audit logs
SELECT * FROM payment_audit_logs
WHERE order_id = 'your-order-id'
ORDER BY created_at DESC;

-- Check for errors
SELECT
  event_type,
  status,
  netcash_response->>'error_message' as error
FROM payment_audit_logs
WHERE event_type = 'payment_failed';
```

### Issue 4: Email Not Sending After Webhook

**Symptom**: Webhook succeeds but no email received.

**Debug Steps**:
```bash
# 1. Check Resend logs
# Visit: https://resend.com/logs

# 2. Verify email sending in webhook handler
# Add debug logs:
console.log('[DEBUG] Attempting to send email to:', order.customer_email);
console.log('[DEBUG] Email result:', emailResult);

# 3. Test email independently
curl -X POST http://localhost:3006/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","orderId":"test-123"}'
```

### Issue 5: Duplicate Webhook Processing

**Symptom**: Same webhook received multiple times, causing duplicate updates.

**Solution**: Implement idempotency key checking:
```typescript
// In webhook handler, check if transaction already processed
const existingLog = await supabase
  .from('payment_audit_logs')
  .select('id')
  .eq('order_id', order.id)
  .eq('netcash_response->transaction_id', transactionId)
  .single();

if (existingLog.data) {
  console.log('[WEBHOOK] Duplicate webhook, skipping');
  return NextResponse.json({ success: true, message: 'Duplicate' });
}
```

---

## Webhook Security Best Practices

### 1. Always Verify Signatures
```typescript
if (!verifySignature(body, signature, secret)) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

### 2. Use HTTPS in Production
```bash
# Never use HTTP for webhook URLs in production
# ❌ http://circletel.co.za/api/payment/webhook
# ✅ https://circletel.co.za/api/payment/webhook
```

### 3. Implement Rate Limiting
```typescript
// Future enhancement: Add rate limiting middleware
// Limit: 100 requests per minute per IP
```

### 4. Log All Webhook Events
```typescript
// Always create audit log, even for failures
await supabase.from('payment_audit_logs').insert({
  order_id: orderId,
  event_type: 'webhook_received',
  status: webhookStatus,
  netcash_response: webhookPayload,
  signature_valid: isSignatureValid
});
```

### 5. Handle Idempotency
```typescript
// Check for duplicate transactions before processing
// Use transaction_id as idempotency key
```

---

## Testing Checklist

Before marking webhook implementation as complete:

- [ ] Successful payment webhook updates order to `completed`
- [ ] Failed payment webhook updates order to `failed`
- [ ] Invalid signature returns 401 status
- [ ] Email sent after successful payment
- [ ] Audit log created for all webhook events
- [ ] Duplicate webhooks handled correctly
- [ ] Error handling logs errors without crashing
- [ ] Webhook works through ngrok tunnel
- [ ] Signature verification uses timing-safe comparison
- [ ] All test scenarios pass (success, failure, refund)

---

## Resources

- **Netcash Webhook Docs**: https://developer.netcash.co.za/webhooks
- **Ngrok Documentation**: https://ngrok.com/docs
- **Postman Collections**: Create collection for all webhook scenarios
- **Internal Docs**: [CFC-001-01-payment-integration.md](../stories/CFC-001-01-payment-integration.md)

---

**Webhook Testing Setup Complete! 🎉**

You can now test payment webhooks locally using ngrok, manual cURL commands, or the automated test script. Use this guide as reference throughout CFC-001-01 development.

**Next Step**: Implement the webhook handler in `/app/api/payment/netcash/webhook/route.ts`
