# Webhook Configuration Guide
## B2B Quote-to-Contract Workflow

**Version**: 1.0  
**Last Updated**: 2025-11-01  
**Spec**: `agent-os/specs/20251101-b2b-quote-to-contract-kyc/`

---

## 📋 Overview

The B2B workflow relies on 4 external webhook integrations:

| Service | Purpose | Security |
|---------|---------|----------|
| **Didit** | KYC verification callbacks | HMAC-SHA256 |
| **Zoho Sign** | Contract signature tracking | HMAC-SHA256 |
| **NetCash** | Payment confirmations | HMAC-SHA256 |
| **ICASA** | RICA approval/rejection | HMAC-SHA256 |

All webhooks use **timing-safe HMAC-SHA256 signature verification** to prevent forgery.

---

## 🔐 Security Best Practices

### 1. Webhook Secrets

**Generate Strong Secrets** (32+ bytes):
```bash
# Generate webhook secret
openssl rand -hex 32

# Example output:
# a7f3c9d2e8b1a4f5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9
```

**Store Securely**:
- ✅ Use environment variables (`.env.local`)
- ✅ Use secrets manager (Vercel Secrets, AWS Secrets Manager)
- ❌ NEVER commit secrets to git
- ❌ NEVER expose in client-side code

### 2. Signature Verification

All webhooks **MUST** verify signatures before processing:

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Timing-safe comparison prevents timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// In API route
export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-webhook-signature');
  const payload = await request.text();

  if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Process webhook...
}
```

### 3. Idempotency

All webhooks **MUST** implement idempotency to prevent duplicate processing:

```sql
-- Example: payment_webhooks table
CREATE TABLE payment_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id TEXT UNIQUE NOT NULL,  -- Idempotency key
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint prevents duplicates
CREATE UNIQUE INDEX idx_payment_webhooks_transaction_id 
ON payment_webhooks(transaction_id);
```

---

## 1️⃣ Didit KYC Webhook

### Configuration

**Webhook URL** (Production):
```
https://circletel.co.za/api/compliance/webhook/didit
```

**Webhook URL** (Staging):
```
https://staging.circletel.co.za/api/compliance/webhook/didit
```

### Environment Variables

Add to `.env.local`:
```bash
DIDIT_API_KEY=<your-api-key>
DIDIT_API_SECRET=<your-api-secret>
DIDIT_WEBHOOK_SECRET=<generate-with-openssl>
NEXT_PUBLIC_DIDIT_ENVIRONMENT=sandbox  # or production
```

### Didit Dashboard Setup

1. **Login** to Didit dashboard: https://dashboard.didit.me/
2. Navigate to **Settings** → **Webhooks**
3. Click **Add Webhook**
4. Fill in details:
   - **URL**: `https://circletel.co.za/api/compliance/webhook/didit`
   - **Events**: Select all:
     - `verification.completed`
     - `verification.failed`
     - `session.abandoned`
     - `session.expired`
   - **Secret**: Use generated webhook secret from environment variable
5. Click **Save**
6. Click **Test Webhook** to verify connectivity

### Webhook Events

| Event | Trigger | Workflow Action |
|-------|---------|-----------------|
| `verification.completed` | Customer completes KYC | Update KYC session, calculate risk tier, send email |
| `verification.failed` | Invalid documents | Update KYC session, notify customer |
| `session.abandoned` | Customer closes before completion | Update KYC session |
| `session.expired` | Session expires (7 days) | Update KYC session, notify sales |

### Request Headers

```
X-Didit-Signature: <hmac-sha256-signature>
Content-Type: application/json
```

### Request Body Example

```json
{
  "event_type": "verification.completed",
  "session_id": "didit-session-abc123",
  "quote_id": "QT-2025-001",
  "timestamp": "2025-11-01T12:34:56Z",
  "result": {
    "verified": true,
    "liveness_passed": true,
    "document_verified": true
  },
  "extracted_data": {
    "id_number": "8001015009087",
    "full_name": "John Doe",
    "date_of_birth": "1980-01-01",
    "liveness_score": 0.98,
    "document_authenticity": 0.95,
    "aml_flags": []
  }
}
```

### Testing

**Test Webhook Locally** (ngrok):
```bash
# Start ngrok tunnel
ngrok http 3000

# Copy ngrok URL (e.g., https://abc123.ngrok.io)
# Update Didit webhook URL temporarily:
# https://abc123.ngrok.io/api/compliance/webhook/didit

# Start local server
npm run dev:memory

# Trigger test verification in Didit dashboard
```

**Mock Webhook** (for automated tests):
```bash
curl -X POST http://localhost:3000/api/compliance/webhook/didit \
  -H "Content-Type: application/json" \
  -H "X-Didit-Signature: test-signature" \
  -d '{
    "event_type": "verification.completed",
    "session_id": "test-session-123",
    "quote_id": "QT-2025-001",
    "result": { "verified": true },
    "extracted_data": { "id_number": "8001015009087" }
  }'
```

---

## 2️⃣ Zoho Sign Webhook

### Configuration

**Webhook URL** (Production):
```
https://circletel.co.za/api/contracts/[contractId]/signature-webhook
```

**Note**: Zoho Sign requires per-request webhook URLs. We generate these dynamically when creating signature requests.

### Environment Variables

```bash
ZOHO_SIGN_CLIENT_ID=<your-client-id>
ZOHO_SIGN_CLIENT_SECRET=<your-client-secret>
ZOHO_SIGN_REFRESH_TOKEN=<your-refresh-token>
ZOHO_SIGN_WEBHOOK_SECRET=<generate-with-openssl>
```

### Zoho Sign API Console Setup

1. **Login** to Zoho API Console: https://api-console.zoho.com/
2. Navigate to **Zoho Sign**
3. Click **Add Client**
4. Fill in details:
   - **Client Name**: CircleTel Production
   - **Homepage URL**: https://circletel.co.za
   - **Authorized Redirect URIs**: https://circletel.co.za/api/auth/zoho/callback
5. Copy **Client ID** and **Client Secret**
6. Generate **Refresh Token**:
   - Use Zoho OAuth playground or follow: https://www.zoho.com/sign/api/oauth.html
   - Scopes required: `ZohoSign.documents.ALL`, `ZohoSign.webhooks.CREATE`

### Webhook Events

| Event | Trigger | Workflow Action |
|-------|---------|-----------------|
| `request.signed` | Customer signs contract | Check if all parties signed, generate invoice |
| `request.declined` | Customer declines | Update contract status, notify sales |
| `request.expired` | Signature request expires | Update contract status, notify customer |

### Request Body Example

```json
{
  "event_type": "request.signed",
  "request_id": "zoho-sign-abc123",
  "contract_id": "CT-2025-001",
  "signer_email": "john.doe@company.co.za",
  "signed_at": "2025-11-01T14:22:30Z",
  "all_signed": true,
  "document_url": "https://sign.zoho.com/documents/abc123/download"
}
```

### Dynamic Webhook URL Generation

Our code generates webhook URLs per signature request:

```typescript
// lib/integrations/zoho/sign-service.ts
const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/contracts/${contractId}/signature-webhook`;

const signRequest = await zohoSign.createSignatureRequest({
  document_id: documentId,
  signers: [
    { email: customerEmail, order: 1 },
    { email: 'admin@circletel.co.za', order: 2 }
  ],
  webhook_url: webhookUrl  // Dynamic per contract
});
```

---

## 3️⃣ NetCash Payment Webhook

### Configuration

**Webhook URL** (Production):
```
https://circletel.co.za/api/payments/webhook
```

**Webhook URL** (Staging):
```
https://staging.circletel.co.za/api/payments/webhook
```

### Environment Variables

```bash
NETCASH_SERVICE_KEY=<your-service-key>
NETCASH_MERCHANT_ID=<your-merchant-id>
NETCASH_WEBHOOK_SECRET=<generate-with-openssl>
```

### NetCash Dashboard Setup

1. **Login** to NetCash: https://merchant.netcash.co.za/
2. Navigate to **Settings** → **Webhooks**
3. Click **Add Webhook**
4. Fill in details:
   - **URL**: `https://circletel.co.za/api/payments/webhook`
   - **Events**: Select:
     - Payment Completed
     - Payment Failed
     - Payment Pending
   - **Secret**: Use generated webhook secret
5. Click **Save**
6. **Important**: Enable IP whitelisting for NetCash IPs

### IP Whitelisting

Add NetCash IPs to firewall/Vercel settings:
```
196.38.180.0/24
41.185.8.0/24
```

### Webhook Events

| Event | Trigger | Workflow Action |
|-------|---------|-----------------|
| `payment.completed` | Payment success | Update invoice, create order, trigger RICA |
| `payment.failed` | Payment declined | Update invoice, notify customer |
| `payment.pending` | Awaiting confirmation | Update invoice status |

### Request Body Example

```json
{
  "event_type": "payment.completed",
  "transaction_id": "netcash-txn-123456",
  "invoice_id": "INV-2025-001",
  "amount": 1498.00,
  "currency": "ZAR",
  "status": "completed",
  "payment_method": "card",
  "customer_email": "john.doe@company.co.za",
  "timestamp": "2025-11-01T15:45:20Z",
  "card_last4": "1234",
  "payment_reference": "REF-ABC123"
}
```

### Idempotency

NetCash may send duplicate webhooks. Our implementation uses `transaction_id` as idempotency key:

```typescript
// Check if already processed
const { data: existing } = await supabase
  .from('payment_webhooks')
  .select('id')
  .eq('transaction_id', transaction_id)
  .single();

if (existing) {
  return NextResponse.json({ message: 'Already processed' }, { status: 200 });
}
```

---

## 4️⃣ ICASA RICA Webhook

### Configuration

**Webhook URL** (Production):
```
https://circletel.co.za/api/activation/rica-webhook
```

**Webhook URL** (Test):
```
https://test.circletel.co.za/api/activation/rica-webhook
```

### Environment Variables

```bash
ICASA_API_KEY=<your-icasa-api-key>
ICASA_API_SECRET=<your-icasa-api-secret>
ICASA_WEBHOOK_SECRET=<generate-with-openssl>
NEXT_PUBLIC_ICASA_ENVIRONMENT=test  # or production
```

### ICASA Portal Setup

1. **Apply for access** at: https://www.icasa.org.za/
2. Complete RICA Operator registration
3. Navigate to **API Settings** → **Webhooks**
4. Add webhook:
   - **URL**: `https://circletel.co.za/api/activation/rica-webhook`
   - **Environment**: Production or Test
   - **Secret**: Use generated webhook secret
5. Submit for approval
6. Wait for ICASA approval (1-2 weeks)

### Webhook Events

| Event | Trigger | Workflow Action |
|-------|---------|-----------------|
| `rica.approved` | RICA approved by ICASA | Activate service, send credentials email |
| `rica.rejected` | RICA rejected | Notify admin, request resubmission |
| `rica.pending` | Additional info required | Notify admin with requirements |

### Request Body Example

```json
{
  "event_type": "rica.approved",
  "tracking_id": "RICA-2025-123456",
  "order_id": "ORD-2025-001",
  "approved_at": "2025-11-01T16:30:00Z",
  "approval_reference": "APPR-789",
  "service_lines": [
    {
      "iccid": "8927123456789012345",
      "status": "active",
      "activation_date": "2025-11-01T16:30:00Z"
    }
  ]
}
```

---

## 🧪 Testing Webhooks

### Local Testing with ngrok

```bash
# 1. Start ngrok
ngrok http 3000

# 2. Update webhook URLs temporarily
# Didit: https://abc123.ngrok.io/api/compliance/webhook/didit
# NetCash: https://abc123.ngrok.io/api/payments/webhook

# 3. Start local server
npm run dev:memory

# 4. Trigger webhook from service dashboard

# 5. Check logs
tail -f logs/webhooks.log
```

### Automated Testing

**Unit Tests** (`__tests__` files):
```bash
npm run test -- app/api/payments/webhook/__tests__/webhook.test.ts
npm run test -- lib/compliance/__tests__/rica-submission.test.ts
```

**E2E Tests** (Playwright):
```bash
npm run test:e2e -- tests/e2e/b2b-quote-to-contract-full-flow.spec.ts
```

### Manual Webhook Testing

**cURL Example**:
```bash
# Generate signature
PAYLOAD='{"event_type":"payment.completed","transaction_id":"test-123"}'
SECRET="your-webhook-secret"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

# Send webhook
curl -X POST https://circletel.co.za/api/payments/webhook \
  -H "Content-Type: application/json" \
  -H "X-NetCash-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

---

## 📊 Monitoring & Logging

### Webhook Logs

All webhooks log to Supabase:
```sql
-- View recent webhooks
SELECT * FROM payment_webhooks ORDER BY processed_at DESC LIMIT 50;
SELECT * FROM kyc_sessions WHERE webhook_received_at IS NOT NULL;
SELECT * FROM rica_submissions WHERE webhook_processed_at IS NOT NULL;
```

### Error Alerts

Setup alerts for webhook failures:

**Vercel Integration** (Recommended):
```bash
# Install Vercel CLI
npm i -g vercel

# Setup log drains
vercel logs --since 1h | grep "Webhook failed"
```

**Custom Monitoring**:
```typescript
// lib/monitoring/webhook-monitor.ts
export async function alertWebhookFailure(
  service: string,
  error: Error,
  payload: any
) {
  // Send to Slack, PagerDuty, etc.
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
      text: `🚨 Webhook failure: ${service}`,
      blocks: [
        { type: 'section', text: { type: 'mrkdwn', text: `*Service*: ${service}` }},
        { type: 'section', text: { type: 'mrkdwn', text: `*Error*: ${error.message}` }}
      ]
    })
  });
}
```

---

## ⚠️ Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **401 Unauthorized** | Verify webhook secret matches environment variable |
| **Duplicate Processing** | Check idempotency implementation (transaction_id uniqueness) |
| **Webhook Not Received** | Verify URL is publicly accessible (use ngrok for local testing) |
| **Signature Mismatch** | Ensure using raw request body (not parsed JSON) for signature verification |
| **Timeout** | Optimize webhook handler - defer heavy processing to background jobs |

### Debugging Signature Verification

```typescript
// Add debug logging
const receivedSignature = request.headers.get('x-webhook-signature');
const payload = await request.text();

console.log('Received signature:', receivedSignature);
console.log('Payload:', payload);

const expectedSignature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');

console.log('Expected signature:', expectedSignature);
console.log('Match:', receivedSignature === expectedSignature);
```

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

- [ ] All webhook secrets generated and stored in Vercel Secrets
- [ ] Webhook URLs configured in all service dashboards
- [ ] IP whitelisting configured (NetCash)
- [ ] SSL certificates valid (HTTPS required)
- [ ] Test webhooks with production URLs (use staging first)
- [ ] Monitoring alerts configured (Slack/PagerDuty)
- [ ] Error logging setup (Sentry, Datadog, etc.)
- [ ] Backup webhook handler (retry queue)

### Vercel Secrets Setup

```bash
# Add secrets to Vercel
vercel secrets add didit-webhook-secret <secret>
vercel secrets add netcash-webhook-secret <secret>
vercel secrets add zoho-sign-webhook-secret <secret>
vercel secrets add icasa-webhook-secret <secret>

# Link to environment variables in Vercel dashboard
# Settings → Environment Variables → Add
# DIDIT_WEBHOOK_SECRET = @didit-webhook-secret
```

### Rollback Plan

If webhooks fail in production:

1. **Immediate**: Disable webhook in service dashboard
2. **Investigate**: Check error logs, identify root cause
3. **Fix**: Deploy hotfix or revert
4. **Replay**: Process missed webhooks from logs
5. **Re-enable**: Turn webhook back on after validation

---

## 📚 Additional Resources

- **Didit Docs**: https://docs.didit.me/webhooks
- **Zoho Sign API**: https://www.zoho.com/sign/api/
- **NetCash API**: https://docs.netcash.co.za/
- **ICASA RICA**: https://www.icasa.org.za/rica
- **HMAC Best Practices**: https://www.owasp.org/index.php/HMAC

---

**Last Updated**: 2025-11-01  
**Maintained By**: DevOps Team  
**Questions**: Contact devops@circletel.co.za
