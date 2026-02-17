# Monthly Invoice Automation Design

**Date**: 2026-02-17
**Status**: Approved
**Author**: Claude Code + User

## Overview

Automate monthly invoice generation for CircleTel customers with ZOHO Books sync and Pay Now notifications via Email + SMS.

## Requirements

| Requirement | Decision |
|-------------|----------|
| Trigger | Monthly billing cycle (1st of month @ 06:00 SAST) |
| GL Account | ZOHO's default Sales/Revenue account |
| Notifications | Email + SMS with Pay Now link |
| Source of Truth | CircleTel `customer_services` table |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MONTHLY BILLING CRON - /api/cron/generate-monthly-invoices                │
│  Runs: 1st of month @ 06:00 SAST (04:00 UTC)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐                                                        │
│  │ 1. QUERY        │  SELECT * FROM customer_services                      │
│  │    Active       │  WHERE status = 'active'                              │
│  │    Services     │  AND billing_day = 1                                  │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ 2. GENERATE     │  INSERT INTO customer_invoices                        │
│  │    Invoice      │  (customer_id, total_amount, line_items, ...)         │
│  │                 │  Invoice #: INV-2026-00XXX                            │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ 3. SYNC TO      │  syncInvoiceToZohoBilling(invoice_id)                 │
│  │    ZOHO Books   │  → Creates invoice in ZOHO                            │
│  │                 │  → Uses default Sales/Revenue GL                      │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐                                                        │
│  │ 4. GENERATE     │  PayNowBillingService.processPayNowForInvoice()       │
│  │    Pay Now +    │  → Generates NetCash Pay Now URL                      │
│  │    NOTIFY       │  → Sends Email via Resend                             │
│  │                 │  → Sends SMS via Clickatell                           │
│  └─────────────────┘                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Model

### Tables Involved (Existing)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `customer_services` | Source of billable services | `customer_id`, `package_id`, `status`, `monthly_price`, `billing_day` |
| `service_packages` | Package details for line items | `name`, `price`, `description` |
| `customer_invoices` | Generated invoices | `invoice_number`, `total_amount`, `zoho_billing_invoice_id`, `paynow_url` |
| `customers` | Customer contact info | `email`, `phone`, `zoho_billing_customer_id` |

### Schema Changes Required

```sql
-- Add billing_day to customer_services if not exists
ALTER TABLE customer_services
ADD COLUMN IF NOT EXISTS billing_day INTEGER DEFAULT 1;

-- Add last_invoice_date to prevent duplicate billing
ALTER TABLE customer_services
ADD COLUMN IF NOT EXISTS last_invoice_date DATE;
```

### Invoice Generation Query

```typescript
// Only bill services where:
// 1. status = 'active'
// 2. billing_day matches current day (1-28)
// 3. last_invoice_date is NOT in current month (prevents duplicates)

const servicesToBill = await supabase
  .from('customer_services')
  .select('*, customer:customers(*), package:service_packages(*)')
  .eq('status', 'active')
  .eq('billing_day', dayOfMonth)
  .or(`last_invoice_date.is.null,last_invoice_date.lt.${firstOfMonth}`);
```

## Components

### New Files

| File | Purpose |
|------|---------|
| `app/api/cron/generate-monthly-invoices/route.ts` | Main cron endpoint |
| `lib/billing/monthly-invoice-generator.ts` | Invoice generation logic |
| `supabase/migrations/20260217_add_billing_day_column.sql` | Schema migration |

### Existing Services (No Changes)

| File | Usage |
|------|-------|
| `lib/integrations/zoho/invoice-sync-service.ts` | `syncInvoiceToZohoBilling()` |
| `lib/billing/paynow-billing-service.ts` | `processPayNowForInvoice()` |
| `lib/integrations/clickatell/sms-service.ts` | SMS sending |

## Error Handling

### Strategy: Continue on failure, log everything

| Step | On Failure | Recovery |
|------|------------|----------|
| Invoice Generation | Skip service, log error | Manual retry via admin |
| ZOHO Sync | Continue to notify, mark `zoho_sync_status: 'failed'` | Existing retry endpoint |
| Email Send | Continue to SMS, log error | Resend via admin panel |
| SMS Send | Log error, continue to next service | Resend via admin panel |

### Duplicate Prevention

```typescript
// Before generating invoice, check if already billed this month
const existingInvoice = await supabase
  .from('customer_invoices')
  .select('id')
  .eq('service_id', service.id)
  .gte('invoice_date', firstOfMonth)
  .single();

if (existingInvoice.data) {
  return { skipped: true, reason: 'Already billed this month' };
}
```

## Testing

### Test Modes

| Mode | Command | Purpose |
|------|---------|---------|
| Dry Run | `POST {"dryRun": true}` | Preview what would be billed |
| Single Customer | `POST {"customerId": "xxx"}` | Test one customer |
| Full Run | `POST {"dryRun": false}` | Production billing |

### Test Customer

```json
{
  "id": "cb4837a2-ee97-4b85-b2ca-35886d6d56c2",
  "name": "Shaun Robertson",
  "email": "shaunr07@gmail.com",
  "phone": "0826574256"
}
```

### Manual Testing Checklist

- [ ] Create test customer with active service
- [ ] Run with `dryRun: true` - verify preview
- [ ] Run with `customerId` filter - single customer test
- [ ] Verify invoice in `customer_invoices`
- [ ] Verify invoice in ZOHO Books
- [ ] Verify email received with Pay Now link
- [ ] Verify SMS received with short Pay Now link
- [ ] Click Pay Now link - verify correct amount

## Deployment

### Vercel Cron Configuration

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-monthly-invoices",
      "schedule": "0 4 1 * *"
    }
  ]
}
```

*Note: 04:00 UTC = 06:00 SAST*

## Estimated Effort

**2-3 days** including testing
