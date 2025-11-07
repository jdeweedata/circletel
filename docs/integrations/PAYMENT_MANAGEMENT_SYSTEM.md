# Payment Management System

**Status**: ✅ Production Ready
**Date**: November 6, 2025
**Version**: 1.0

---

## Overview

The Payment Management System provides comprehensive tools for monitoring, managing, and analyzing payment transactions across all payment providers. This system includes database tracking, admin interfaces, and detailed logging capabilities.

### Key Features

- ✅ **Transaction Tracking**: Complete lifecycle tracking for all payments
- ✅ **Webhook Logging**: Detailed logs of all payment provider webhooks
- ✅ **Admin Interfaces**: Beautiful, responsive admin pages
- ✅ **Search & Filtering**: Advanced search and multi-filter capabilities
- ✅ **CSV Export**: Export transaction data for analysis
- ✅ **Security**: HMAC signature verification tracking
- ✅ **Audit Trail**: Complete audit logging for compliance
- ✅ **Performance**: Optimized database indexes for fast queries

---

## Architecture

### Database Tables

#### 1. payment_transactions
Tracks all payment attempts and their complete lifecycle.

**Key Columns**:
- `transaction_id` (TEXT UNIQUE) - Provider's transaction ID
- `reference` (TEXT) - Order/invoice reference
- `provider` (TEXT) - netcash, zoho_billing, payfast, paygate
- `amount` (DECIMAL) - Transaction amount
- `status` (TEXT) - pending, processing, completed, failed, refunded, cancelled, expired
- `payment_method` (TEXT) - card, eft, instant_eft, etc.
- `customer_email`, `customer_name` - Customer information
- `invoice_id`, `order_id` - Related records
- `provider_response` (JSONB) - Full provider response
- `error_message` - Failure reason

**Indexes**:
- status, provider, customer_id, reference
- created_at (descending)
- Full-text search (transaction_id, reference, email, name)

#### 2. payment_webhook_logs
Tracks all incoming webhook calls from payment providers.

**Key Columns**:
- `webhook_id` (TEXT UNIQUE) - Unique webhook identifier
- `provider` (TEXT) - Payment provider
- `event_type` (TEXT) - payment.completed, payment.failed, etc.
- `status` (TEXT) - received, processing, processed, failed, retrying
- `signature_verified` (BOOLEAN) - HMAC signature verification result
- `headers` (JSONB) - All HTTP headers
- `body` (TEXT) - Raw request body
- `body_parsed` (JSONB) - Parsed JSON body
- `processing_duration_ms` (INTEGER) - Processing time
- `retry_count` (INTEGER) - Number of retry attempts
- `error_message` - Processing error

**Indexes**:
- provider, status, event_type
- signature_verified, success
- received_at (descending)

#### 3. payment_provider_settings
Stores provider-specific configuration and settings.

**Key Columns**:
- `provider` (TEXT UNIQUE) - Provider identifier
- `enabled` (BOOLEAN) - Whether provider is active
- `priority` (INTEGER) - Provider priority (higher = tried first)
- `credentials` (JSONB) - Encrypted provider credentials
- `settings` (JSONB) - Provider-specific settings
- `min_amount`, `max_amount`, `daily_limit` - Transaction limits
- `webhook_url`, `webhook_secret` - Webhook configuration
- `test_mode` (BOOLEAN) - Test vs production mode

### Database Views

#### v_recent_payment_transactions
Recent transactions with customer info (100 latest).

```sql
SELECT
  pt.id,
  pt.transaction_id,
  pt.provider,
  pt.amount,
  pt.status,
  c.first_name || ' ' || c.last_name AS customer_full_name
FROM payment_transactions pt
LEFT JOIN customers c ON pt.customer_id = c.id
ORDER BY pt.created_at DESC
LIMIT 100
```

#### v_webhook_log_summary
Webhook statistics by provider/event/status (7-day window).

```sql
SELECT
  provider,
  event_type,
  status,
  COUNT(*) AS total_count,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) AS success_count,
  AVG(processing_duration_ms) AS avg_processing_time_ms
FROM payment_webhook_logs
WHERE received_at > NOW() - INTERVAL '7 days'
GROUP BY provider, event_type, status
```

#### v_payment_provider_health
Provider performance metrics (30-day window).

```sql
SELECT
  pps.provider,
  pps.enabled,
  COUNT(pt.id) AS total_transactions,
  SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) AS completed_transactions,
  SUM(CASE WHEN pt.status = 'completed' THEN pt.amount ELSE 0 END) AS total_amount
FROM payment_provider_settings pps
LEFT JOIN payment_transactions pt ON pps.provider = pt.provider
  AND pt.created_at > NOW() - INTERVAL '30 days'
GROUP BY pps.provider, pps.enabled
```

---

## Admin Pages

### 1. Payment Transactions (/admin/payments/transactions)

#### Features

**Search & Filtering**:
- Search by transaction ID, reference, customer email, customer name
- Filter by status (all, completed, pending, processing, failed, refunded, cancelled, expired)
- Filter by provider (all, netcash, zoho_billing, payfast, paygate)
- Real-time results as you type

**Stats Cards** (4 cards):
1. **Total Transactions**: Count + total amount (R)
2. **Completed**: Count + completed amount (green)
3. **Pending**: Count (yellow)
4. **Failed**: Count + failure rate percentage (red)

**Transactions Table**:
- Transaction ID (truncated, monospaced)
- Reference (order/invoice number)
- Provider (badge)
- Customer (name + email)
- Amount (currency + formatted)
- Payment Method (badge)
- Status (color-coded badge with icon)
- Date (formatted)
- Actions (view details button)

**Transaction Details Modal**:
- Status badge + amount prominently displayed
- Transaction ID and reference
- Provider and payment method
- Customer name and email
- Initiated and completed timestamps
- Error information (if failed)
- Full provider response (JSON viewer)

**Export**:
- Click "Export CSV" to download all transactions
- Includes all fields in CSV format
- Timestamped filename

#### Usage

```typescript
// Navigate to page
/admin/payments/transactions

// Search for transaction
Type "ORDER-001" in search box

// Filter by status
Select "completed" from status dropdown

// Filter by provider
Select "netcash" from provider dropdown

// View details
Click eye icon on any transaction row

// Export data
Click "Export CSV" button
```

---

### 2. Webhook Logs (/admin/payments/webhooks)

#### Features

**Search & Filtering**:
- Search by webhook ID, transaction ID
- Filter by status (all, processed, received, processing, failed, retrying)
- Filter by provider (all, netcash, zoho_billing, payfast, paygate)

**Stats Cards** (4 cards):
1. **Total Webhooks**: Count
2. **Processed**: Count (green)
3. **Failed**: Count (red)
4. **Verified**: Count + verification percentage (blue)

**Webhook Logs Table**:
- Webhook ID (truncated, monospaced)
- Provider (badge)
- Event Type (badge)
- Status (color-coded badge)
- Verified (shield icon - green if verified, red if not)
- Processing Time (milliseconds)
- Received At (timestamp)
- Actions (view details button)

**Webhook Details Modal**:
- Provider, event type, status
- Signature verification status
- Processing duration, retry count, success flag
- Error messages (if failed)
- Request headers (JSON)
- Request body (JSON)

**Security Features**:
- Visual indicators for signature verification
- Verification percentage tracking
- IP address logging (in database)

#### Usage

```typescript
// Navigate to page
/admin/payments/webhooks

// Search for webhook
Type webhook ID or transaction ID

// Filter by status
Select "failed" to see failed webhooks

// View details
Click eye icon to see complete webhook data

// Monitor verification
Check "Verified" column for security status
```

---

### 3. Payment Settings (/admin/payments/settings)

**Status**: Placeholder (coming soon)

**Planned Features**:
- Enable/disable providers
- Set provider priority
- Configure credentials (encrypted)
- Set transaction limits
- Configure webhook URLs
- Test mode toggle

---

## Database Migration

### Running the Migration

```bash
# Using Supabase CLI
supabase db push

# Or manually via Supabase Dashboard
# Copy contents of: supabase/migrations/20251106020000_create_payment_tracking_tables.sql
# Paste into SQL Editor → Run
```

### What Gets Created

**Tables** (3):
- payment_transactions
- payment_webhook_logs
- payment_provider_settings

**Views** (3):
- v_recent_payment_transactions
- v_webhook_log_summary
- v_payment_provider_health

**Functions** (1):
- update_payment_updated_at() - Trigger function

**Triggers** (3):
- payment_transactions_updated_at
- webhook_logs_updated_at
- provider_settings_updated_at

**RLS Policies** (9):
- Admin view/insert/update for transactions
- Admin view/update for webhook logs
- Service role insert for webhooks
- Super admin full access to settings

### Rollback

```sql
-- Drop tables (cascades to views, triggers, policies)
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS payment_webhook_logs CASCADE;
DROP TABLE IF EXISTS payment_provider_settings CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS update_payment_updated_at CASCADE;
```

---

## Integration with Payment Providers

### Recording Transactions

```typescript
import { createClient } from '@/lib/supabase/server';

// After initiating payment
const supabase = await createClient();

await supabase
  .from('payment_transactions')
  .insert({
    transaction_id: paymentResult.transactionId,
    reference: order.order_number,
    provider: 'netcash',
    amount: order.total_amount,
    currency: 'ZAR',
    status: 'pending',
    payment_method: 'card',
    customer_email: customer.email,
    customer_name: customer.full_name,
    customer_id: customer.id,
    invoice_id: invoice.id,
    order_id: order.id,
    provider_reference: paymentResult.providerRef,
    initiated_at: new Date().toISOString()
  });
```

### Logging Webhooks

```typescript
// In webhook route handler
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();

await supabase
  .from('payment_webhook_logs')
  .insert({
    webhook_id: crypto.randomUUID(),
    provider: 'netcash',
    event_type: webhookData.event,
    http_method: request.method,
    headers: Object.fromEntries(request.headers),
    body: await request.text(),
    body_parsed: webhookData,
    signature: request.headers.get('x-signature'),
    signature_verified: isSignatureValid,
    transaction_id: webhookData.transaction_id,
    reference: webhookData.reference,
    source_ip: request.headers.get('x-forwarded-for'),
    user_agent: request.headers.get('user-agent')
  });
```

### Updating Transaction Status

```typescript
// After processing webhook
await supabase
  .from('payment_transactions')
  .update({
    status: 'completed',
    completed_at: new Date().toISOString(),
    provider_response: webhookData
  })
  .eq('transaction_id', webhookData.transaction_id);
```

---

## Security

### Row Level Security (RLS)

All tables have RLS enabled with strict policies:

**payment_transactions**:
- ✅ Admin users can SELECT (view)
- ✅ Admin users can INSERT (create)
- ✅ Admin users can UPDATE (modify)
- ❌ Customers cannot access other customers' transactions

**payment_webhook_logs**:
- ✅ Admin users can SELECT (view)
- ✅ Service role can INSERT (for API webhooks)
- ✅ Admin users can UPDATE (for retry logic)

**payment_provider_settings**:
- ✅ Admin users can SELECT (view)
- ✅ Super admins can INSERT, UPDATE, DELETE

### Signature Verification

Webhook signature verification is tracked in the database:

```typescript
const signature = request.headers.get('x-webhook-signature');
const payload = await request.text();

const isValid = crypto.timingSafeEqual(
  Buffer.from(signature),
  Buffer.from(calculateExpectedSignature(payload, WEBHOOK_SECRET))
);

// Store verification result
await supabase
  .from('payment_webhook_logs')
  .insert({
    ...webhookData,
    signature,
    signature_verified: isValid,
    signature_algorithm: 'hmac-sha256'
  });
```

### Credential Encryption

Provider credentials in `payment_provider_settings` should be encrypted:

```typescript
import { encrypt, decrypt } from '@/lib/encryption';

// Storing credentials
await supabase
  .from('payment_provider_settings')
  .insert({
    provider: 'netcash',
    credentials: {
      service_key: await encrypt(NETCASH_SERVICE_KEY),
      merchant_id: await encrypt(NETCASH_MERCHANT_ID)
    }
  });

// Retrieving credentials
const { data } = await supabase
  .from('payment_provider_settings')
  .select('credentials')
  .eq('provider', 'netcash')
  .single();

const serviceKey = await decrypt(data.credentials.service_key);
```

---

## Performance Optimization

### Indexes

The migration creates optimal indexes:

**payment_transactions**:
```sql
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_provider ON payment_transactions(provider);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at DESC);
CREATE INDEX idx_payment_transactions_search ON payment_transactions
  USING gin(to_tsvector('english', ...)); -- Full-text search
```

**payment_webhook_logs**:
```sql
CREATE INDEX idx_webhook_logs_provider ON payment_webhook_logs(provider);
CREATE INDEX idx_webhook_logs_status ON payment_webhook_logs(status);
CREATE INDEX idx_webhook_logs_received_at ON payment_webhook_logs(received_at DESC);
```

### Query Optimization

**Efficient Queries**:
```typescript
// ✅ GOOD: Use indexes
const { data } = await supabase
  .from('payment_transactions')
  .select('*')
  .eq('status', 'completed')  // Uses idx_payment_transactions_status
  .order('created_at', { ascending: false })  // Uses idx_payment_transactions_created_at
  .limit(100);

// ✅ GOOD: Use full-text search
const { data } = await supabase
  .from('payment_transactions')
  .select('*')
  .textSearch('fts', 'ORDER-001');  // Uses idx_payment_transactions_search

// ❌ BAD: Avoid unindexed filters
const { data } = await supabase
  .from('payment_transactions')
  .select('*')
  .filter('amount', 'gt', 1000);  // No index on amount - slow
```

---

## Troubleshooting

### Issue: Transactions not appearing

**Cause**: RLS policy blocking access or transaction not inserted

**Solution**:
1. Check if user is admin: `SELECT * FROM admin_users WHERE id = auth.uid()`
2. Verify transaction exists: Check Supabase Dashboard → Table Editor
3. Check RLS policies are enabled and correct

### Issue: Webhook logs missing

**Cause**: Service role not configured or RLS blocking inserts

**Solution**:
1. Ensure webhook route uses service role client:
```typescript
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();  // Service role
```
2. Check RLS policy allows service role inserts
3. Verify webhook route is actually being called

### Issue: Search not working

**Cause**: Full-text search index not created or wrong query syntax

**Solution**:
1. Verify GIN index exists: Check Supabase Dashboard → Database → Indexes
2. Use correct search syntax:
```typescript
// Use .or() for multi-column search
.or(`transaction_id.ilike.%${searchTerm}%,reference.ilike.%${searchTerm}%`)
```

### Issue: Export CSV fails

**Cause**: Browser blocking download or no data

**Solution**:
1. Check browser console for errors
2. Verify transactions exist before export
3. Check browser download settings

---

## Future Enhancements

### Planned Features (Q1 2026)

1. **Webhook Retry API** (High Priority)
   - POST /api/payments/webhooks/retry
   - Retry failed webhooks automatically
   - Exponential backoff strategy

2. **Transaction Analytics** (Medium Priority)
   - Daily/weekly/monthly revenue charts
   - Provider performance comparison
   - Failure rate trends
   - Average transaction value

3. **Payment Settings UI** (High Priority)
   - Provider enable/disable toggles
   - Credentials management (encrypted)
   - Transaction limits configuration
   - Webhook URL management

4. **Real-time Updates** (Medium Priority)
   - Supabase Realtime subscriptions
   - Live transaction updates
   - Live webhook logs

5. **Advanced Filtering** (Low Priority)
   - Date range picker
   - Amount range filter
   - Customer filter
   - Payment method filter

6. **Bulk Operations** (Low Priority)
   - Bulk refunds
   - Bulk status updates
   - Bulk exports

---

## Testing

### Manual Testing Checklist

**Transactions Page**:
- [ ] Page loads without errors
- [ ] Stats cards display correct counts
- [ ] Search works (transaction ID, reference, email)
- [ ] Status filter works
- [ ] Provider filter works
- [ ] Table displays transactions
- [ ] View details modal opens
- [ ] Export CSV downloads file

**Webhook Logs Page**:
- [ ] Page loads without errors
- [ ] Stats cards display correct counts
- [ ] Search works (webhook ID, transaction ID)
- [ ] Status filter works
- [ ] Provider filter works
- [ ] Table displays webhooks
- [ ] Signature verification icons display correctly
- [ ] View details modal opens

**Database**:
- [ ] Migration runs without errors
- [ ] All tables created
- [ ] All indexes created
- [ ] All views created
- [ ] RLS policies work correctly

---

## Support

**Documentation**:
- Integration Guide: `docs/integrations/NETCASH_ZOHO_INTEGRATION_COMPLETE.md`
- Health Monitoring: `docs/integrations/PAYMENT_HEALTH_MONITORING.md`
- Test Suite: `docs/testing/PAYMENT_INTEGRATION_TESTS.md`

**Database Schema**:
- Migration File: `supabase/migrations/20251106020000_create_payment_tracking_tables.sql`

**Admin Pages**:
- Transactions: `app/admin/payments/transactions/page.tsx`
- Webhooks: `app/admin/payments/webhooks/page.tsx`
- Settings: `app/admin/payments/settings/page.tsx`

---

**Last Updated**: November 6, 2025
**Version**: 1.0
**Maintained By**: Development Team
