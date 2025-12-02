# Task Breakdown: Unified Payment & Billing Architecture

## Task Groups Overview

| Group | Agent Role | Points | Priority | Dependencies |
|-------|------------|--------|----------|--------------|
| TG-1 | database-engineer | 5 | High | None |
| TG-2 | backend-engineer | 13 | High | TG-1 |
| TG-3 | frontend-engineer | 3 | Medium | TG-2 |
| TG-4 | testing-engineer | 5 | High | TG-2 |
| TG-5 | ops-engineer | 3 | Medium | TG-2, TG-3 |

---

## TG-1: Database Schema Updates (5 points)

**Agent**: database-engineer
**Priority**: High
**Dependencies**: None

### T1.1: Add payment sync tracking columns (3 points)

**File**: `supabase/migrations/YYYYMMDD_payment_sync_tracking.sql`

```sql
-- Add ZOHO payment sync tracking to customer_payments
ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS zoho_payment_id TEXT;
ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS zoho_sync_status TEXT DEFAULT 'pending';
ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS zoho_last_synced_at TIMESTAMPTZ;
ALTER TABLE customer_payments ADD COLUMN IF NOT EXISTS zoho_last_sync_error TEXT;

-- Create index for sync status queries
CREATE INDEX IF NOT EXISTS idx_customer_payments_zoho_sync_status
ON customer_payments(zoho_sync_status);

-- Add constraint for valid sync statuses
ALTER TABLE customer_payments ADD CONSTRAINT chk_zoho_sync_status
CHECK (zoho_sync_status IN ('pending', 'syncing', 'synced', 'failed', 'skipped'));
```

**Acceptance Criteria**:
- [ ] Migration applies cleanly to staging
- [ ] Columns are nullable (backward compatible)
- [ ] Index created for query performance
- [ ] Constraint validates sync status values

### T1.2: Add payment audit log entries (2 points)

**File**: Same migration or separate

```sql
-- Ensure payment_sync_logs has proper structure
CREATE TABLE IF NOT EXISTS payment_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES customer_payments(id),
  invoice_id UUID REFERENCES customer_invoices(id),
  zoho_payment_id TEXT,
  sync_status TEXT NOT NULL,
  attempt_number INT DEFAULT 1,
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_sync_logs_payment_id
ON payment_sync_logs(payment_id);
```

**Acceptance Criteria**:
- [ ] Audit log table created
- [ ] Foreign key to customer_payments
- [ ] Indexes for common queries

---

## TG-2: Backend Services (13 points)

**Agent**: backend-engineer
**Priority**: High
**Dependencies**: TG-1

### T2.1: Create Payment Sync Service (5 points)

**File**: `lib/payments/payment-sync-service.ts`

```typescript
/**
 * Payment Sync Service
 *
 * Orchestrates payment recording to ZOHO Billing as "offline payments"
 * Called after NetCash webhook confirms successful payment
 */

export interface PaymentSyncRequest {
  payment_id: string;
  invoice_id: string;
  customer_id: string;
  amount: number;
  payment_method: string;
  reference: string;
  transaction_date: string;
}

export interface PaymentSyncResult {
  success: boolean;
  zoho_payment_id?: string;
  error?: string;
  retry_scheduled?: boolean;
}

export async function syncPaymentToZoho(
  request: PaymentSyncRequest
): Promise<PaymentSyncResult>

export async function retryFailedPaymentSyncs(
  limit?: number
): Promise<{ processed: number; succeeded: number; failed: number }>
```

**Implementation Details**:
1. Look up invoice's ZOHO invoice ID
2. Map NetCash payment method to ZOHO payment_mode
3. Call `ZohoBillingClient.recordPayment()`
4. Update `customer_payments.zoho_sync_status`
5. Log to `payment_sync_logs`

**Acceptance Criteria**:
- [ ] Successfully records payments in ZOHO as offline payments
- [ ] Maps payment methods correctly (card→creditcard, eft→banktransfer, etc.)
- [ ] Handles missing ZOHO invoice ID gracefully
- [ ] Implements 3-retry logic with exponential backoff
- [ ] Updates sync status after each attempt

### T2.2: Create Payment Types (1 point)

**File**: `lib/payments/types.ts`

```typescript
export type PaymentSyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'skipped';

export type ZohoPaymentMode =
  | 'check'
  | 'cash'
  | 'creditcard'
  | 'banktransfer'
  | 'bankremittance'
  | 'autotransaction'
  | 'others';

export interface PaymentRecord {
  id: string;
  invoice_id: string;
  customer_id: string;
  amount: number;
  payment_method: string;
  reference: string;
  status: string;
  zoho_payment_id?: string;
  zoho_sync_status: PaymentSyncStatus;
  zoho_last_synced_at?: string;
  zoho_last_sync_error?: string;
}

export const NETCASH_TO_ZOHO_PAYMENT_MODE: Record<string, ZohoPaymentMode> = {
  'credit_card': 'creditcard',
  'debit_card': 'creditcard',
  'eft': 'banktransfer',
  'instant_eft': 'banktransfer',
  'ozow': 'banktransfer',
  'mobicred': 'others',
  'payflex': 'others',
  'default': 'others'
};
```

**Acceptance Criteria**:
- [ ] All types match database schema
- [ ] Payment mode mapping is complete
- [ ] Exported for use in other modules

### T2.3: Create Payment Receipt Email Template (3 points)

**File**: `emails/templates/payment-receipt.tsx`

```tsx
import { EmailLayout } from '../components/EmailLayout';

interface PaymentReceiptProps {
  customerName: string;
  invoiceNumber: string;
  paymentAmount: string;
  paymentDate: string;
  paymentMethod: string;
  paymentReference: string;
  remainingBalance: string;
  invoiceUrl: string;
}

export const PaymentReceiptEmail = (props: PaymentReceiptProps) => {
  // React Email template implementation
};

export const subject = 'Payment Received - CircleTel Invoice ${invoiceNumber}';
```

**Acceptance Criteria**:
- [ ] Uses CircleTel brand colors (#F5831F, #1F2937)
- [ ] Shows payment details (amount, method, reference)
- [ ] Shows remaining balance if partial payment
- [ ] Includes link to view invoice
- [ ] Mobile responsive

### T2.4: Update NetCash Webhook Processor (3 points)

**File**: `lib/payment/netcash-webhook-processor.ts`

**Changes**:
1. After successful payment recorded in Supabase:
   - Call `syncPaymentToZoho()` (non-blocking, fire-and-forget)
   - Call `EnhancedEmailService.sendPaymentReceipt()` (blocking, must succeed)
2. Update invoice status in Supabase FIRST (source of truth)
3. Log all operations to audit trail

```typescript
// Add to existing processPayment function:
import { syncPaymentToZoho } from '@/lib/payments/payment-sync-service';
import { EnhancedEmailService } from '@/lib/emails/enhanced-notification-service';

// After payment recorded in Supabase:
// 1. Send receipt email (blocking - must succeed for customer experience)
const emailResult = await EnhancedEmailService.sendPaymentReceipt({
  invoice_id: payment.invoice_id,
  customer_id: payment.customer_id,
  email: customer.email,
  customer_name: customer.name,
  invoice_number: invoice.invoice_number,
  payment_amount: payment.amount,
  payment_date: payment.transaction_date,
  payment_method: payment.payment_method,
  payment_reference: payment.reference,
  remaining_balance: invoice.balance_due - payment.amount,
});

// 2. Sync to ZOHO (non-blocking - best effort for reporting)
syncPaymentToZoho({
  payment_id: payment.id,
  invoice_id: payment.invoice_id,
  customer_id: payment.customer_id,
  amount: payment.amount,
  payment_method: payment.payment_method,
  reference: payment.reference,
  transaction_date: payment.transaction_date,
}).catch(error => {
  console.error('[NetCashWebhook] ZOHO sync failed, will retry later:', error);
});
```

**Acceptance Criteria**:
- [ ] Email sent immediately after payment confirmation
- [ ] ZOHO sync is non-blocking (doesn't delay webhook response)
- [ ] Payment status updated in Supabase before external calls
- [ ] Errors logged but don't break payment flow

### T2.5: Update Enhanced Notification Service (1 point)

**File**: `lib/emails/enhanced-notification-service.ts`

**Changes**:
Add `sendPaymentReceipt` method:

```typescript
static async sendPaymentReceipt(payment: {
  invoice_id: string;
  customer_id: string;
  email: string;
  customer_name: string;
  invoice_number: string;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  payment_reference: string;
  remaining_balance: number;
}): Promise<EmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.circletel.co.za';

  return this.sendEmail({
    to: payment.email,
    templateId: 'payment_receipt',
    props: {
      customerName: payment.customer_name,
      invoiceNumber: payment.invoice_number,
      paymentAmount: `R ${payment.payment_amount.toFixed(2)}`,
      paymentDate: new Date(payment.payment_date).toLocaleDateString('en-ZA'),
      paymentMethod: formatPaymentMethod(payment.payment_method),
      paymentReference: payment.payment_reference,
      remainingBalance: `R ${payment.remaining_balance.toFixed(2)}`,
      invoiceUrl: `${baseUrl}/dashboard/invoices/${payment.invoice_id}`,
    },
    customerId: payment.customer_id,
  });
}
```

**Acceptance Criteria**:
- [ ] Method follows existing service patterns
- [ ] Formats amounts in ZAR currency
- [ ] Includes invoice URL for customer reference

---

## TG-3: Admin UI Updates (3 points)

**Agent**: frontend-engineer
**Priority**: Medium
**Dependencies**: TG-2

### T3.1: Add Payment Sync Status to Invoice Detail (2 points)

**File**: `components/admin/invoices/InvoicePaymentHistory.tsx` (or similar)

**Changes**:
- Show ZOHO sync status badge for each payment
- Add "Retry Sync" button for failed syncs
- Show sync error message on hover/click

**UI Components**:
```tsx
<Badge variant={getSyncStatusVariant(payment.zoho_sync_status)}>
  {payment.zoho_sync_status}
</Badge>

{payment.zoho_sync_status === 'failed' && (
  <Button size="sm" onClick={() => retrySync(payment.id)}>
    Retry ZOHO Sync
  </Button>
)}
```

**Acceptance Criteria**:
- [ ] Sync status visible for all payments
- [ ] Retry button triggers sync API
- [ ] Error details accessible

### T3.2: Add Payment Sync Dashboard Widget (1 point)

**File**: `components/admin/dashboard/PaymentSyncWidget.tsx`

**Features**:
- Count of pending/failed syncs
- Link to view failed syncs
- Quick action to retry all failed

**Acceptance Criteria**:
- [ ] Shows real-time sync statistics
- [ ] Highlights if failed syncs > 0
- [ ] Navigation to detailed view

---

## TG-4: Testing (5 points)

**Agent**: testing-engineer
**Priority**: High
**Dependencies**: TG-2

### T4.1: Unit Tests for Payment Sync Service (2 points)

**File**: `__tests__/lib/payments/payment-sync-service.test.ts`

**Test Cases**:
1. `syncPaymentToZoho` - successful sync
2. `syncPaymentToZoho` - ZOHO API error (should retry)
3. `syncPaymentToZoho` - missing ZOHO invoice ID (should skip)
4. `retryFailedPaymentSyncs` - processes correct payments
5. Payment mode mapping accuracy

**Acceptance Criteria**:
- [ ] 80%+ code coverage
- [ ] Mocks ZOHO API calls
- [ ] Tests retry logic

### T4.2: Integration Tests for Webhook Flow (2 points)

**File**: `__tests__/integration/netcash-webhook-payment-flow.test.ts`

**Test Cases**:
1. Full payment flow: webhook → Supabase → email → ZOHO
2. Email failure doesn't break payment recording
3. ZOHO failure doesn't break payment recording
4. Correct data in all systems after success

**Acceptance Criteria**:
- [ ] Tests complete flow end-to-end
- [ ] Uses test database
- [ ] Validates data consistency

### T4.3: Email Template Snapshot Tests (1 point)

**File**: `__tests__/emails/payment-receipt.test.tsx`

**Test Cases**:
1. Renders correctly with all props
2. Renders correctly with zero remaining balance
3. Mobile responsive layout

**Acceptance Criteria**:
- [ ] Snapshot matches expected output
- [ ] No broken links

---

## TG-5: Deployment & Monitoring (3 points)

**Agent**: ops-engineer
**Priority**: Medium
**Dependencies**: TG-2, TG-3

### T5.1: Add Payment Sync Retry Cron Job (1 point)

**File**: `app/api/cron/retry-payment-syncs/route.ts`

```typescript
export async function GET(request: NextRequest) {
  // Verify cron secret
  // Call retryFailedPaymentSyncs()
  // Log results
}
```

**Vercel Cron Config** (`vercel.json`):
```json
{
  "crons": [{
    "path": "/api/cron/retry-payment-syncs",
    "schedule": "0 */4 * * *"
  }]
}
```

**Acceptance Criteria**:
- [ ] Runs every 4 hours
- [ ] Secured with cron secret
- [ ] Logs execution results

### T5.2: Add Monitoring Alerts (1 point)

**Setup**:
- Alert if failed syncs > 10 in 24 hours
- Alert if email delivery rate < 95%
- Dashboard for sync health

**Acceptance Criteria**:
- [ ] Alerts configured in monitoring system
- [ ] Team notified of issues

### T5.3: Update Documentation (1 point)

**Files**:
- `docs/architecture/PAYMENT_BILLING_ARCHITECTURE.md` - New file
- `docs/architecture/ADMIN_SUPABASE_ZOHO_INTEGRATION.md` - Update with payment sync

**Acceptance Criteria**:
- [ ] Architecture documented
- [ ] Flow diagrams included
- [ ] Troubleshooting guide

---

## Task Summary by Agent

### database-engineer (5 points)
- T1.1: Payment sync tracking columns (3 pts)
- T1.2: Payment audit log entries (2 pts)

### backend-engineer (13 points)
- T2.1: Payment Sync Service (5 pts)
- T2.2: Payment Types (1 pt)
- T2.3: Payment Receipt Email Template (3 pts)
- T2.4: Update NetCash Webhook Processor (3 pts)
- T2.5: Update Enhanced Notification Service (1 pt)

### frontend-engineer (3 points)
- T3.1: Invoice Payment History UI (2 pts)
- T3.2: Payment Sync Dashboard Widget (1 pt)

### testing-engineer (5 points)
- T4.1: Unit Tests (2 pts)
- T4.2: Integration Tests (2 pts)
- T4.3: Email Template Tests (1 pt)

### ops-engineer (3 points)
- T5.1: Retry Cron Job (1 pt)
- T5.2: Monitoring Alerts (1 pt)
- T5.3: Documentation (1 pt)

---

## Execution Order

```
Week 1:
├── TG-1: Database Schema (database-engineer)
│   └── T1.1, T1.2

Week 1-2:
├── TG-2: Backend Services (backend-engineer)
│   ├── T2.1: Payment Sync Service
│   ├── T2.2: Payment Types
│   ├── T2.3: Email Template
│   ├── T2.4: Webhook Update
│   └── T2.5: Notification Service

Week 2:
├── TG-3: Admin UI (frontend-engineer)
│   ├── T3.1: Payment History UI
│   └── T3.2: Dashboard Widget
│
├── TG-4: Testing (testing-engineer)
│   ├── T4.1: Unit Tests
│   ├── T4.2: Integration Tests
│   └── T4.3: Email Tests

Week 3:
├── TG-5: Deployment (ops-engineer)
│   ├── T5.1: Cron Job
│   ├── T5.2: Monitoring
│   └── T5.3: Documentation
```
