# Billing Pay Now + SMS Automation

**Date**: 2026-02-10
**Task**: End-to-end billing automation with Pay Now links, email, and SMS notifications

## Summary

Implemented automated billing workflow that:
1. Generates NetCash Pay Now payment URLs
2. Sends email via Resend (verified domain)
3. Sends SMS via Clickatell (with short URL redirect)
4. Validates eMandate status (3-state: active/pending/none)

## Key Files Modified

- `lib/payments/netcash-service.ts` - Fixed table name `customer_invoices`
- `lib/billing/paynow-billing-service.ts` - Pay Now generation + notifications
- `lib/integrations/clickatell/sms-service.ts` - Lazy-load pattern
- `lib/integrations/didit/client.ts` - Lazy-load pattern
- `app/api/paynow/[ref]/route.ts` - Short URL redirect API

## Patterns

### 1. Lazy-Load External Services

**Problem**: Services that throw errors in constructor when env vars are missing break Next.js builds during "Collecting page data" phase.

**Solution**: Use lazy initialization with getter function.

```typescript
// BEFORE (breaks build)
export class ClickatellService {
  constructor() {
    if (!process.env.CLICKATELL_API_KEY) {
      throw new Error('API key not configured');
    }
  }
}
export const clickatellService = new ClickatellService();

// AFTER (build-safe)
export class ClickatellService {
  private config: Config | null = null;

  private getConfig(): Config {
    if (!this.config) {
      this.config = {
        apiKey: process.env.CLICKATELL_API_KEY || '',
      };
    }
    return this.config;
  }

  async sendSMS(params: SendSMSParams) {
    const config = this.getConfig();
    if (!config.apiKey) {
      return { success: false, error: 'API key not configured' };
    }
    // ... send SMS
  }
}
export const clickatellService = new ClickatellService();
```

### 2. API Routes for External Redirects

**Problem**: Next.js `redirect()` in Server Components doesn't work reliably for external URLs with complex query parameters.

**Solution**: Use API route with `NextResponse.redirect()`.

```typescript
// app/api/paynow/[ref]/route.ts
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ ref: string }> }
) {
  const { ref } = await context.params;

  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from('customer_invoices')
    .select('paynow_url, status')
    .eq('paynow_transaction_ref', ref)
    .single();

  if (!invoice?.paynow_url) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // External redirect works correctly in API routes
  return NextResponse.redirect(invoice.paynow_url);
}
```

### 3. SMS Short URL Pattern

**Problem**: NetCash Pay Now URLs are 400+ characters, SMS limit is 160 characters.

**Solution**: Store full URL in database, use short redirect URL in SMS.

```typescript
// Generate short URL for SMS
function getShortPaymentUrl(transactionRef: string): string {
  return `https://www.circletel.co.za/api/paynow/${transactionRef}`;
}

// SMS template uses short URL
const smsText = `Hi ${name}, inv ${invoiceNumber} (R${amount}) due. Pay: ${shortUrl}`;
// Example: "Hi Shaun, inv INV-2026-00002 (R899.00) due. Pay: circletel.co.za/api/paynow/CT-28bbc..."
```

### 4. Vercel Deployment Verification

**Problem**: Code changes not reflecting in production, unclear if deployment succeeded.

**Solution**: Use Vercel API to check deployment status and commit SHA.

```bash
# Check recent deployments
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v6/deployments?projectId=prj_xxx&limit=3" | \
  jq '.deployments[] | {state, meta: .meta.githubCommitSha}'

# Expected output:
# { "state": "READY", "meta": "abc123..." }
# { "state": "ERROR", "meta": "def456..." }
```

## Configuration Reference

### Resend Email
- Verified domain: `notify.circletel.co.za`
- From address: `billing@notify.circletel.co.za`
- Dashboard: https://resend.com/domains

### Clickatell SMS
- API: Platform API v1
- Base URL: `https://platform.clickatell.com/v1/message`
- Auth: API key in `Authorization` header (not Bearer)

### NetCash Pay Now
- URL format: `https://paynow.netcash.co.za/site/paynow.aspx?m1=...&m2=...`
- Transaction ref stored in `customer_invoices.paynow_transaction_ref`
- Full URL stored in `customer_invoices.paynow_url`

## Database Schema

```sql
-- customer_invoices table (NOT 'invoices')
ALTER TABLE customer_invoices ADD COLUMN IF NOT EXISTS
  paynow_url TEXT,
  paynow_transaction_ref TEXT,
  paynow_sent_at TIMESTAMPTZ,
  paynow_sent_via TEXT[], -- ['email', 'sms']
  payment_collection_method TEXT; -- 'paynow', 'debit_order'
```

## Testing

```bash
# Test billing cron (dry run)
curl -X POST "https://www.circletel.co.za/api/cron/process-billing-day" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'

# Test redirect URL
curl -sI "https://www.circletel.co.za/api/paynow/CT-xxx-yyy" | grep -E "^HTTP|^location"
# Expected: HTTP/2 307, location: https://paynow.netcash.co.za/...
```

## Mistakes to Avoid

1. **Wrong table name**: Use `customer_invoices` not `invoices` for billing queries
2. **Throwing in constructor**: Lazy-load services that need env vars
3. **Page redirect for external URLs**: Use API route with NextResponse.redirect()
4. **Unverified email domain**: Check Resend dashboard before configuring from address
5. **Long URLs in SMS**: Always use short URL redirect pattern
