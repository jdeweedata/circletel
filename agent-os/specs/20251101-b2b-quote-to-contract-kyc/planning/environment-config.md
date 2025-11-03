# Environment Configuration for B2B Quote-to-Contract Workflow

## Webhook URLs

### Staging Environment
**Base URL**: `https://circletel-staging.vercel.app/`

**Webhook Endpoints**:
- Didit KYC Webhook: `https://circletel-staging.vercel.app/api/compliance/webhook/didit`
- ZOHO Sign Webhook: `https://circletel-staging.vercel.app/api/contracts/webhook/zoho-sign`
- NetCash Payment Webhook: `https://circletel-staging.vercel.app/api/payments/webhook`
- RICA Status Webhook: `https://circletel-staging.vercel.app/api/activation/rica-webhook`

### Production Environment
**Base URL**: `https://circletel.co.za`

**Webhook Endpoints**:
- Didit KYC Webhook: `https://circletel.co.za/api/compliance/webhook/didit`
- ZOHO Sign Webhook: `https://circletel.co.za/api/contracts/webhook/zoho-sign`
- NetCash Payment Webhook: `https://circletel.co.za/api/payments/webhook`
- RICA Status Webhook: `https://circletel.co.za/api/activation/rica-webhook`

---

## Environment Variables

### Required for All Environments

```env
# App URL (determines webhook URLs)
NEXT_PUBLIC_APP_URL=https://circletel-staging.vercel.app/  # Staging
# NEXT_PUBLIC_APP_URL=https://circletel.co.za              # Production

# Didit KYC
DIDIT_API_KEY=<your-didit-api-key>
DIDIT_WEBHOOK_SECRET=<your-didit-webhook-secret>

# ZOHO CRM
ZOHO_CLIENT_ID=<your-zoho-client-id>
ZOHO_CLIENT_SECRET=<your-zoho-client-secret>
ZOHO_REFRESH_TOKEN=<your-zoho-refresh-token>

# ZOHO Sign
ZOHO_SIGN_API_KEY=<your-zoho-sign-api-key>
ZOHO_SIGN_WEBHOOK_SECRET=<your-zoho-sign-webhook-secret>

# NetCash Pay Now
NETCASH_SERVICE_KEY=<your-netcash-service-key>
NETCASH_MERCHANT_ID=<your-netcash-merchant-id>
NETCASH_WEBHOOK_SECRET=<your-netcash-webhook-secret>

# RICA System
RICA_API_URL=<rica-system-api-url>
RICA_API_KEY=<rica-api-key>
RICA_WEBHOOK_SECRET=<rica-webhook-secret>

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://agyjovdugmtopasyvlng.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Email (Resend)
RESEND_API_KEY=<your-resend-api-key>
```

---

## Webhook Registration

### Didit KYC
Register webhook in Didit dashboard:
- **Staging**: `https://circletel-staging.vercel.app/api/compliance/webhook/didit`
- **Production**: `https://circletel.co.za/api/compliance/webhook/didit`
- **Secret**: Use `DIDIT_WEBHOOK_SECRET` from environment variables
- **Events**: `verification.completed`, `verification.failed`, `session.abandoned`

### ZOHO Sign
Register webhook in ZOHO Sign settings:
- **Staging**: `https://circletel-staging.vercel.app/api/contracts/webhook/zoho-sign`
- **Production**: `https://circletel.co.za/api/contracts/webhook/zoho-sign`
- **Secret**: Use `ZOHO_SIGN_WEBHOOK_SECRET` from environment variables
- **Events**: `signature.completed`, `signature.declined`, `document.viewed`

### NetCash Pay Now
Register webhook in NetCash merchant portal:
- **Staging**: `https://circletel-staging.vercel.app/api/payments/webhook`
- **Production**: `https://circletel.co.za/api/payments/webhook`
- **Secret**: Use `NETCASH_WEBHOOK_SECRET` from environment variables
- **Events**: `payment.completed`, `payment.failed`, `payment.cancelled`

### RICA System
Register webhook with RICA provider:
- **Staging**: `https://circletel-staging.vercel.app/api/activation/rica-webhook`
- **Production**: `https://circletel.co.za/api/activation/rica-webhook`
- **Secret**: Use `RICA_WEBHOOK_SECRET` from environment variables
- **Events**: `rica.approved`, `rica.rejected`, `rica.pending`

---

## Implementation Pattern

### Dynamic Webhook URL Generation

```typescript
// lib/utils/webhook-urls.ts
export function getWebhookBaseURL(): string {
  // Use NEXT_PUBLIC_APP_URL if set, otherwise fallback to VERCEL_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (appUrl) {
    return appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
  }

  // Vercel auto-sets VERCEL_URL
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  // Local development fallback
  return 'http://localhost:3000';
}

export function getDiditWebhookURL(): string {
  return `${getWebhookBaseURL()}/api/compliance/webhook/didit`;
}

export function getZOHOSignWebhookURL(): string {
  return `${getWebhookBaseURL()}/api/contracts/webhook/zoho-sign`;
}

export function getNetCashWebhookURL(): string {
  return `${getWebhookBaseURL()}/api/payments/webhook`;
}

export function getRICAWebhookURL(): string {
  return `${getWebhookBaseURL()}/api/activation/rica-webhook`;
}
```

### Usage in Didit Session Creation

```typescript
// lib/integrations/didit/session-manager.ts
import { getDiditWebhookURL } from '@/lib/utils/webhook-urls';

export async function createKYCSessionForQuote(quoteId: string) {
  const sessionRequest: DiditSessionRequest = {
    type: 'kyc',
    jurisdiction: 'ZA',
    flow: flowType,
    features: ['id_verification', 'document_extraction', 'liveness', 'aml'],
    metadata: { quote_id: quoteId },
    redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/customer/quote/${quoteId}/kyc-complete`,
    webhook_url: getDiditWebhookURL(), // ✅ Uses correct staging/production URL
  };

  const { data } = await diditClient.post<DiditSessionResponse>('/sessions', sessionRequest);
  return data;
}
```

---

## Vercel Environment Variables Setup

### Staging Environment
Set in Vercel dashboard for `circletel-staging` project:
```
NEXT_PUBLIC_APP_URL=https://circletel-staging.vercel.app/
[All other environment variables from above]
```

### Production Environment
Set in Vercel dashboard for `circletel` production project:
```
NEXT_PUBLIC_APP_URL=https://circletel.co.za
[All other environment variables from above]
```

---

## Testing Webhooks

### Staging (Before Production Deployment)

1. **Register webhooks** with staging URL in all external services (Didit, ZOHO, NetCash, RICA)

2. **Test webhook delivery**:
   ```bash
   # Monitor webhook logs
   vercel logs --follow circletel-staging

   # Trigger test webhook
   curl -X POST https://circletel-staging.vercel.app/api/compliance/webhook/didit \
     -H "Content-Type: application/json" \
     -H "X-Didit-Signature: test-signature" \
     -d '{"event": "verification.completed", "sessionId": "test-123"}'
   ```

3. **Verify webhook processing**:
   - Check database updates (kyc_sessions table)
   - Check application logs
   - Verify error handling for invalid signatures

### Production (After Staging Validation)

1. **Update webhook URLs** in all external services to production URLs
2. **Monitor first few webhooks** closely in production
3. **Set up alerts** for webhook failures (Sentry/DataDog)

---

## Security Notes

1. **Webhook Secrets**: Never commit webhook secrets to repository. Use Vercel environment variables.
2. **Signature Verification**: All webhooks MUST verify HMAC-SHA256 signatures before processing.
3. **HTTPS Only**: All webhook URLs use HTTPS (no HTTP in production/staging).
4. **Rate Limiting**: Consider adding rate limiting to webhook endpoints to prevent abuse.

---

**Created**: 2025-11-01
**Updated**: 2025-11-01
**Maintained By**: Development Team
