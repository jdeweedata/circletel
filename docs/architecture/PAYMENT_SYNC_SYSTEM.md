# Payment Sync System Architecture

> **Spec ID**: 20251202-unified-payment-billing
> **Status**: Complete
> **Last Updated**: 2025-12-02

## Overview

The Payment Sync System provides automated synchronization of payment transactions between Supabase (source of truth) and ZOHO Billing (async mirror). It includes email notifications via Resend and comprehensive monitoring/alerting.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PAYMENT FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌────────────────┐     ┌────────────────────────────┐ │
│  │   NetCash    │────▶│  Webhook API   │────▶│     Supabase               │ │
│  │  Pay Now     │     │   /api/payments│     │  payment_transactions      │ │
│  │              │     │   /netcash/    │     │  customer_invoices         │ │
│  └──────────────┘     │   webhook      │     └────────────┬───────────────┘ │
│                       └────────┬───────┘                  │                 │
│                                │                          │                 │
│                                ▼                          ▼                 │
│                       ┌────────────────┐     ┌────────────────────────────┐ │
│                       │  Resend Email  │     │   ZOHO Billing             │ │
│                       │  (Receipt)     │     │   (Async Sync)             │ │
│                       └────────────────┘     └────────────────────────────┘ │
│                                                          ▲                  │
│                                                          │                  │
│  ┌──────────────────────────────────────────────────────┼──────────────────┐│
│  │                    BACKGROUND JOBS                    │                  ││
│  │  ┌─────────────────┐    ┌─────────────────┐          │                  ││
│  │  │ Retry Cron      │───▶│ Sync Service    │──────────┘                  ││
│  │  │ (every 4 hours) │    │                 │                             ││
│  │  └─────────────────┘    └─────────────────┘                             ││
│  │                                                                          ││
│  │  ┌─────────────────┐    ┌─────────────────┐                             ││
│  │  │ Monitor Cron    │───▶│ Alert Service   │───▶ Email/Webhook           ││
│  │  │ (every 4 hours) │    │                 │                             ││
│  │  └─────────────────┘    └─────────────────┘                             ││
│  └──────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Payment Types (`lib/payments/types.ts`)

Defines types and utilities for payment processing:

```typescript
// Payment sync status tracking
type PaymentSyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'skipped';

// ZOHO payment modes
type ZohoPaymentMode = 'check' | 'cash' | 'creditcard' | 'banktransfer' | 'bankremittance' | 'autotransaction' | 'others';

// NetCash to ZOHO mapping
const NETCASH_TO_ZOHO_PAYMENT_MODE = {
  credit_card: 'creditcard',
  eft: 'banktransfer',
  ozow: 'banktransfer',
  capitec_pay: 'banktransfer',
  mobicred: 'others',
  // ... etc
};

// Utility functions
getZohoPaymentMode(method: string): ZohoPaymentMode
formatPaymentMethod(method: string): string
```

### 2. Payment Sync Service (`lib/payments/payment-sync-service.ts`)

Orchestrates synchronization to ZOHO Billing:

```typescript
interface PaymentSyncRequest {
  payment_id: string;
  invoice_id: string;
  customer_id: string;
  amount: number;
  payment_method: string;
  reference: string;
  transaction_date: string;
}

interface PaymentSyncResult {
  success: boolean;
  zoho_payment_id?: string;
  error?: string;
  attempt_number?: number;
}

// Main sync function
async function syncPaymentToZohoBilling(request: PaymentSyncRequest): Promise<PaymentSyncResult>

// Batch retry function
async function retryFailedPaymentSyncs(limit?: number): Promise<{ processed: number; succeeded: number; failed: number }>
```

### 3. Payment Receipt Email (`emails/templates/consumer/payment-receipt.tsx`)

React Email template for payment confirmations:

```typescript
interface PaymentReceiptEmailProps {
  customerName: string;
  invoiceNumber: string;
  paymentAmount: string;
  paymentDate: string;
  paymentMethod: string;
  paymentReference: string;
  remainingBalance: string;
  invoiceUrl: string;
}
```

Features:
- Displays payment details
- Shows "Paid in Full" or remaining balance
- Links to customer dashboard
- CircleTel branding

### 4. NetCash Webhook Handler (`app/api/payments/netcash/webhook/route.ts`)

Processes incoming payment notifications:

1. Validates webhook signature (HMAC-SHA256)
2. Stores payment in `payment_transactions` table
3. Updates invoice in `customer_invoices` table
4. Sends payment receipt email via Resend
5. Initiates ZOHO sync (non-blocking)
6. Logs to `webhook_logs` table

### 5. Retry Cron Job (`app/api/cron/payment-sync-retry/route.ts`)

Automatically retries failed syncs:

- **Schedule**: Every 4 hours (0:00, 4:00, 8:00, 12:00, 16:00, 20:00)
- **Limit**: 50 payments per run
- **Retry Logic**: Exponential backoff (5min base, 2x multiplier)
- **Max Attempts**: 5

### 6. Monitoring Cron Job (`app/api/cron/payment-sync-monitor/route.ts`)

Monitors sync health and sends alerts:

- **Schedule**: Every 4 hours (2:00, 6:00, 10:00, 14:00, 18:00, 22:00)
- **Checks**:
  - Failed sync count (threshold: 5)
  - Success rate (threshold: 95%)
  - Stale pending syncs (threshold: 4 hours)
  - Daily payment volume
- **Alerts**: Email via Resend, optional Slack/Discord webhook

## Database Schema

### payment_transactions

```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT UNIQUE,
  reference TEXT,
  customer_id UUID REFERENCES customers(id),
  invoice_id UUID REFERENCES customer_invoices(id),
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'ZAR',
  status TEXT, -- 'pending', 'completed', 'failed', 'cancelled'
  payment_method TEXT,
  provider TEXT DEFAULT 'netcash',

  -- ZOHO sync tracking
  zoho_sync_status TEXT, -- 'pending', 'syncing', 'synced', 'failed', 'skipped'
  zoho_payment_id TEXT,
  zoho_sync_attempts INT DEFAULT 0,
  zoho_last_sync_at TIMESTAMPTZ,
  zoho_sync_error TEXT,

  -- Timestamps
  initiated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### zoho_sync_logs

```sql
CREATE TABLE zoho_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT, -- 'customer', 'invoice', 'payment', 'subscription'
  entity_id UUID,
  operation TEXT, -- 'create', 'update', 'health_check'
  status TEXT, -- 'synced', 'failed'
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  attempt_number INT,
  duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoints

### Webhook

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/payments/netcash/webhook` | POST | Receive NetCash payment notifications |

### Admin APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/payments/sync-stats` | GET | Get sync statistics for dashboard |
| `/api/admin/billing/invoices/[id]` | GET | Get invoice details with payment history |

### Cron Jobs

| Endpoint | Schedule | Purpose |
|----------|----------|---------|
| `/api/cron/payment-sync-retry` | `0 */4 * * *` | Retry failed syncs |
| `/api/cron/payment-sync-monitor` | `0 2,6,10,14,18,22 * * *` | Health monitoring |

## Configuration

### Environment Variables

```env
# Required
RESEND_API_KEY=re_xxxx                  # Resend API key for emails
NETCASH_WEBHOOK_SECRET=xxxx             # Webhook signature verification

# ZOHO Integration
ZOHO_CLIENT_ID=xxxx
ZOHO_CLIENT_SECRET=xxxx
ZOHO_REFRESH_TOKEN=xxxx
ZOHO_ORG_ID=xxxx

# Alerting (Optional)
PAYMENT_ALERT_EMAIL=dev@circletel.co.za  # Alert recipient
PAYMENT_ALERT_WEBHOOK_URL=https://...    # Slack/Discord webhook

# Cron Security
CRON_SECRET=xxxx                         # Vercel Cron secret
```

### Thresholds

| Setting | Default | Description |
|---------|---------|-------------|
| `FAILED_SYNC_THRESHOLD` | 5 | Alert if more failed syncs |
| `SUCCESS_RATE_THRESHOLD` | 95% | Alert if rate drops below |
| `PENDING_HOURS_THRESHOLD` | 4h | Alert if pending too long |
| `MAX_RETRY_ATTEMPTS` | 5 | Max sync retry attempts |

## Admin UI

### Invoice Detail Page (`/admin/billing/invoices/[id]`)

Displays:
- Invoice summary (number, amount, status, dates)
- Line items breakdown
- Payment history with ZOHO sync status per payment
- Sync status badges (Synced/Pending/Failed)

### Dashboard Widget (`PaymentSyncStatusWidget`)

Shows:
- Overall sync health (Healthy/Warning/Critical)
- Synced/Pending/Failed counts
- Payments processed today
- Recent failures list

## Error Handling

### Retry Strategy

1. **Immediate retry**: On transient network errors
2. **Exponential backoff**: 5min, 10min, 20min, 40min, 80min
3. **Max attempts**: 5 before marking as permanently failed
4. **Cron retry**: Picks up failed syncs every 4 hours

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `Invoice not found` | Missing invoice_id | Check invoice exists in Supabase |
| `Invoice not synced to ZOHO` | No zoho_invoice_id | Sync invoice first |
| `ZOHO API Error: Rate limit` | Too many requests | Automatic backoff |
| `Invalid payment mode` | Unknown payment method | Check NETCASH_TO_ZOHO_PAYMENT_MODE |

## Testing

### Test Files

| File | Tests | Coverage |
|------|-------|----------|
| `__tests__/lib/payments/payment-types.test.ts` | 35 | Types, mapping |
| `__tests__/lib/payments/payment-sync-service.test.ts` | 20 | Sync service |
| `__tests__/api/payments/webhook-integration.test.ts` | 22 | Webhook flow |
| `__tests__/emails/payment-receipt.test.tsx` | 25 | Email template |

### Running Tests

```bash
# Run all payment tests
npx jest __tests__/lib/payments/ __tests__/api/payments/ __tests__/emails/payment-receipt.test.tsx

# Run specific test file
npx jest __tests__/lib/payments/payment-types.test.ts
```

## Monitoring

### Health Check Endpoint

```bash
curl https://www.circletel.co.za/api/cron/payment-sync-monitor \
  -H "Authorization: Bearer $CRON_SECRET"
```

Response:
```json
{
  "success": true,
  "status": "healthy",
  "checks": [
    {
      "name": "Failed Syncs (24h)",
      "status": "pass",
      "value": 0,
      "threshold": 5
    },
    {
      "name": "Sync Success Rate (24h)",
      "status": "pass",
      "value": "100%",
      "threshold": "95%"
    }
  ],
  "processing_time_ms": 234
}
```

### Alert Notifications

Alerts are sent when status is `critical`:

1. **Email**: Sent via Resend to `PAYMENT_ALERT_EMAIL`
2. **Webhook**: Posted to `PAYMENT_ALERT_WEBHOOK_URL` (Slack/Discord compatible)

## Troubleshooting

### Payment Not Syncing

1. Check `payment_transactions.zoho_sync_status`
2. Check `zoho_sync_logs` for error details
3. Verify invoice has `zoho_invoice_id`
4. Check ZOHO API credentials

### Email Not Sent

1. Verify `RESEND_API_KEY` is set
2. Check Resend dashboard for delivery status
3. Check `webhook_logs` for email send result

### Cron Job Not Running

1. Verify `vercel.json` cron configuration
2. Check Vercel dashboard > Cron Jobs
3. Verify `CRON_SECRET` matches

## Related Documentation

- [Authentication System](./AUTHENTICATION_SYSTEM.md)
- [Admin-ZOHO Integration](./ADMIN_SUPABASE_ZOHO_INTEGRATION.md)
- [System Overview](./SYSTEM_OVERVIEW.md)

## Changelog

| Date | Change |
|------|--------|
| 2025-12-02 | Initial implementation |
| 2025-12-02 | Added monitoring and alerting |
| 2025-12-02 | Added comprehensive test suite |
