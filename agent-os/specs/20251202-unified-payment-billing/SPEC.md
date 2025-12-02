# Specification: Unified Payment & Billing Architecture

**Spec ID**: 20251202-unified-payment-billing
**Version**: 1.0
**Created**: 2025-12-02
**Status**: Ready for Implementation

---

## 1. Overview

### 1.1 Description

Establish a Supabase-first architecture for all payment and billing operations where:
- **Supabase PostgreSQL** is the single source of truth for payments, invoices, and customer billing data
- **NetCash Pay Now** handles payment processing with 20+ South African payment methods
- **Resend** sends all transactional emails (payment confirmations, invoices, reminders)
- **ZOHO Billing** receives async sync of payment data as "offline payments" for financial reporting/BI

This architecture ensures CircleTel operates independently of external CRM availability while maintaining accurate financial records in ZOHO for business intelligence.

### 1.2 Goals

- **G1**: Establish Supabase as the authoritative source for all payment/billing data
- **G2**: Send payment confirmation emails immediately via Resend (not ZOHO)
- **G3**: Sync payments to ZOHO Billing as "offline payments" for financial reporting
- **G4**: Ensure system resilience - CircleTel works even if ZOHO is unavailable
- **G5**: Maintain comprehensive audit trail for all payment events
- **G6**: Provide admin visibility into payment sync status and failures

### 1.3 Non-Goals

- **NG1**: Integrating NetCash directly with ZOHO Billing (not supported)
- **NG2**: Using ZOHO for sending transactional emails
- **NG3**: Real-time bidirectional sync with ZOHO (async is sufficient)
- **NG4**: Automated payment retries via ZOHO (handled by NetCash)
- **NG5**: ZOHO subscription billing automation (Supabase manages subscriptions)

### 1.4 Background

ZOHO Billing's payment gateway API only supports:
```
test_gateway, payflow_pro, stripe, 2checkout, authorize_net,
payments_pro, forte, worldpay, wepay
```

NetCash (South Africa's leading payment processor) is **not supported**. Therefore, we cannot integrate NetCash payments directly into ZOHO Billing's payment gateway system.

However, ZOHO Billing's Payments API supports recording "offline payments" with modes:
```
check, cash, creditcard, banktransfer, bankremittance, autotransaction, others
```

This allows us to record NetCash payments in ZOHO as "banktransfer" or "others" for financial reporting purposes.

---

## 2. User Stories

### US-1: Automatic Payment Confirmation Email

**As a** customer who just paid an invoice
**I want** to receive an immediate payment confirmation email
**So that** I have proof of payment and peace of mind

**Acceptance Criteria**:
- [ ] Email sent within 30 seconds of payment confirmation
- [ ] Email includes: payment amount, date, method, invoice number
- [ ] Email includes: link to view receipt/invoice
- [ ] Email uses CircleTel brand styling
- [ ] Subject: "Payment Received - Invoice [INV-XXXX]"

**Story Points**: 3

---

### US-2: Payment Recording in Supabase

**As a** system administrator
**I want** all payments recorded immediately in Supabase
**So that** the customer dashboard and admin panel show accurate payment status

**Acceptance Criteria**:
- [ ] Payment recorded in `customer_payments` table
- [ ] Invoice status updated to 'paid' or 'partial'
- [ ] Payment method and transaction reference stored
- [ ] Timestamp recorded in SAST timezone
- [ ] Customer service status updated if applicable

**Story Points**: 3

---

### US-3: Async Payment Sync to ZOHO Billing

**As a** finance manager
**I want** payments synced to ZOHO Billing
**So that** I can generate financial reports and track revenue in ZOHO

**Acceptance Criteria**:
- [ ] Payment synced to ZOHO within 5 minutes of confirmation
- [ ] Payment recorded as "banktransfer" or "others" mode
- [ ] NetCash transaction ID included as reference_number
- [ ] Invoice in ZOHO marked as paid/partial
- [ ] Sync failure logged for retry

**Story Points**: 5

---

### US-4: Payment Sync Failure Handling

**As a** system administrator
**I want** failed ZOHO syncs to be logged and retryable
**So that** I can ensure ZOHO stays in sync for financial reporting

**Acceptance Criteria**:
- [ ] Failed syncs logged to `zoho_sync_logs` table
- [ ] Up to 3 retry attempts with exponential backoff
- [ ] Admin can view failed syncs in admin panel
- [ ] Admin can manually trigger retry
- [ ] Email alert for persistent failures (>3 attempts)

**Story Points**: 3

---

### US-5: Admin Payment Sync Dashboard

**As an** admin user
**I want** to view payment sync status
**So that** I can identify and resolve sync issues

**Acceptance Criteria**:
- [ ] Dashboard shows recent payment sync activity
- [ ] Failed syncs highlighted with error details
- [ ] Manual sync trigger button per payment
- [ ] Batch retry option for multiple failures
- [ ] Export failed syncs report

**Story Points**: 3

---

### US-6: Invoice Email via Resend (Not ZOHO)

**As a** customer
**I want** to receive invoice emails directly from CircleTel
**So that** I receive timely billing notifications regardless of ZOHO status

**Acceptance Criteria**:
- [ ] Invoice emails sent via Resend (not ZOHO)
- [ ] Uses existing `invoice_generated` template
- [ ] Sent immediately upon invoice creation
- [ ] Includes PDF attachment or download link
- [ ] Tracked in `notification_tracking` table

**Story Points**: 2

---

## 3. Technical Specification

### 3.1 Database Changes

#### 3.1.1 Modify `customer_payments` Table

```sql
ALTER TABLE public.customer_payments
  ADD COLUMN IF NOT EXISTS zoho_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS zoho_sync_status TEXT DEFAULT 'pending'
    CHECK (zoho_sync_status IN ('pending', 'syncing', 'synced', 'failed')),
  ADD COLUMN IF NOT EXISTS zoho_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS zoho_sync_error TEXT,
  ADD COLUMN IF NOT EXISTS zoho_sync_attempts INTEGER DEFAULT 0;

COMMENT ON COLUMN public.customer_payments.zoho_payment_id IS
  'ZOHO Billing payment_id after sync';
COMMENT ON COLUMN public.customer_payments.zoho_sync_status IS
  'Status of sync to ZOHO Billing';
```

#### 3.1.2 Create Index for Sync Queries

```sql
CREATE INDEX idx_customer_payments_zoho_sync
  ON public.customer_payments(zoho_sync_status, created_at)
  WHERE zoho_sync_status IN ('pending', 'failed');
```

#### 3.1.3 Add RLS Policies

```sql
-- Admins can view all payment sync status
CREATE POLICY "Admins can view payment sync status"
  ON public.customer_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Service role can update sync status
-- (Already handled by service role bypassing RLS)
```

### 3.2 API Endpoints

#### 3.2.1 Enhanced NetCash Webhook Handler

**Endpoint**: `POST /api/webhooks/netcash`

**Enhanced Flow**:
1. Validate NetCash signature (existing)
2. Parse payment notification (existing)
3. **Update Supabase** (blocking, critical):
   - Update `customer_invoices.status`
   - Insert into `customer_payments`
   - Update `customer_services.status` if applicable
4. **Send Resend Email** (blocking, important):
   - Call `EnhancedEmailService.sendPaymentReceipt()`
   - Log to `notification_tracking`
5. **Async ZOHO Sync** (non-blocking, best-effort):
   - Queue or fire-and-forget `syncPaymentToZoho()`
   - Log to `zoho_sync_logs`
6. Return 200 to NetCash

#### 3.2.2 Payment Sync Service

**Location**: `lib/payments/payment-sync-service.ts`

```typescript
export interface PaymentSyncResult {
  success: boolean;
  zoho_payment_id?: string;
  error?: string;
  attempt_number: number;
}

export class PaymentSyncService {
  // Sync a single payment to ZOHO Billing
  static async syncPaymentToZoho(paymentId: string): Promise<PaymentSyncResult>;

  // Find payments needing sync (pending or failed < 3 attempts)
  static async findPaymentsNeedingSync(limit?: number): Promise<Payment[]>;

  // Batch sync all pending payments
  static async processPendingSync(): Promise<BatchSyncResult>;

  // Get sync status for a payment
  static async getSyncStatus(paymentId: string): Promise<SyncStatus>;

  // Manual retry for admin
  static async retrySync(paymentId: string): Promise<PaymentSyncResult>;
}
```

#### 3.2.3 Admin API: Payment Sync Status

**Endpoint**: `GET /api/admin/payments/sync-status`

**Query Parameters**:
- `status`: Filter by sync status (pending, synced, failed)
- `limit`: Number of records (default 50)
- `offset`: Pagination offset

**Response**:
```json
{
  "success": true,
  "data": {
    "total": 150,
    "synced": 145,
    "pending": 3,
    "failed": 2,
    "payments": [
      {
        "id": "uuid",
        "invoice_id": "uuid",
        "invoice_number": "INV-2024-001",
        "amount": 799.00,
        "payment_date": "2025-12-02T10:30:00Z",
        "zoho_sync_status": "failed",
        "zoho_sync_error": "Customer not found in ZOHO",
        "zoho_sync_attempts": 3
      }
    ]
  }
}
```

#### 3.2.4 Admin API: Manual Sync Trigger

**Endpoint**: `POST /api/admin/payments/sync`

**Request**:
```json
{
  "payment_ids": ["uuid1", "uuid2"],  // Optional: specific payments
  "sync_all_pending": false,          // Optional: sync all pending
  "sync_all_failed": false            // Optional: retry all failed
}
```

**Response**:
```json
{
  "success": true,
  "processed": 5,
  "synced": 4,
  "failed": 1,
  "errors": [
    { "payment_id": "uuid", "error": "Customer not found" }
  ]
}
```

### 3.3 Email Templates

#### 3.3.1 Payment Receipt Template

**Template ID**: `payment_receipt`

**Data Required**:
```typescript
interface PaymentReceiptData {
  customerName: string;
  paymentAmount: string;           // Formatted: "R 799.00"
  paymentDate: string;             // "2 December 2025"
  paymentMethod: string;           // "EFT", "Card", etc.
  transactionReference: string;    // NetCash reference
  invoiceNumber: string;
  invoiceUrl: string;              // Link to view invoice
  receiptUrl: string;              // Link to view receipt
  serviceName?: string;            // If applicable
  accountNumber?: string;          // Customer account number
}
```

**Subject**: "Payment Received - Invoice {invoiceNumber}"

### 3.4 Service Layer Integration

#### 3.4.1 NetCash Webhook Processor Enhancement

**File**: `lib/payment/netcash-webhook-processor.ts`

Add after payment confirmation:
```typescript
// 1. Send payment confirmation email (immediate)
await EnhancedEmailService.sendPaymentReceipt({
  email: customer.email,
  customer_name: `${customer.first_name} ${customer.last_name}`,
  payment_amount: payment.amount,
  payment_date: payment.created_at,
  payment_method: payment.method_description,
  transaction_reference: payment.netcash_reference,
  invoice_number: invoice.invoice_number,
  invoice_id: invoice.id,
});

// 2. Queue ZOHO sync (async, best-effort)
PaymentSyncService.syncPaymentToZoho(payment.id).catch(err => {
  console.error('[Payment Sync] Failed:', err);
  // Error already logged by service
});
```

#### 3.4.2 ZOHO Billing Payment Recording

Use existing `ZohoBillingClient.recordPayment()`:

```typescript
await billingClient.recordPayment({
  customer_id: customer.zoho_billing_customer_id,
  payment_mode: 'banktransfer',  // or 'others'
  amount: payment.amount,
  date: payment.created_at.split('T')[0],
  reference_number: payment.netcash_reference,
  description: `NetCash payment for invoice ${invoice.invoice_number}`,
  invoices: [{
    invoice_id: invoice.zoho_billing_invoice_id,
    amount_applied: payment.amount
  }]
});
```

---

## 4. Architecture

### 4.1 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PAYMENT FLOW                                     │
└─────────────────────────────────────────────────────────────────────────┘

Customer Pays
     │
     ▼
┌─────────────────┐
│  NetCash Pay    │  Payment processed with 20+ ZA methods
│  Now Gateway    │  (EFT, Card, SnapScan, Ozow, etc.)
└────────┬────────┘
         │
         │ Webhook POST
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    /api/webhooks/netcash                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 1. Validate Signature (HMAC-SHA256)                             │   │
│  │ 2. Parse Payment Notification                                   │   │
│  │ 3. Find Invoice by Reference                                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└────────┬────────────────────────────────────────────────────────────────┘
         │
         │ ┌──────────────────────────────────────────────────────────────┐
         │ │                 CRITICAL PATH (Blocking)                     │
         │ └──────────────────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    SUPABASE (Source of Truth)                            │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │ UPDATE          │  │ INSERT          │  │ UPDATE                  │ │
│  │ customer_invoices│  │ customer_payments│  │ customer_services       │ │
│  │ status='paid'   │  │ (payment record)│  │ status='active'         │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘ │
└────────┬────────────────────────────────────────────────────────────────┘
         │
         │ ┌──────────────────────────────────────────────────────────────┐
         │ │                 IMPORTANT PATH (Blocking)                    │
         │ └──────────────────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    RESEND (Transactional Email)                          │
│                                                                          │
│  EnhancedEmailService.sendPaymentReceipt()                              │
│  ├─ Render payment_receipt template                                     │
│  ├─ Send via Resend API                                                 │
│  └─ Log to notification_tracking                                        │
└────────┬────────────────────────────────────────────────────────────────┘
         │
         │ ┌──────────────────────────────────────────────────────────────┐
         │ │                 BEST-EFFORT PATH (Non-Blocking)              │
         │ └──────────────────────────────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    ZOHO BILLING (Async Sync)                             │
│                                                                          │
│  PaymentSyncService.syncPaymentToZoho()                                 │
│  ├─ Record "offline payment" (banktransfer mode)                        │
│  ├─ Retry up to 3x with exponential backoff                             │
│  ├─ Log to zoho_sync_logs                                               │
│  └─ Update customer_payments.zoho_sync_status                           │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    RETURN 200 to NetCash                                 │
│  (System operates correctly even if ZOHO sync fails)                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                         │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────┐ │
│  │ Customer        │    │ Admin Payment   │    │ Admin Billing       │ │
│  │ Dashboard       │    │ Sync Dashboard  │    │ Reports             │ │
│  └────────┬────────┘    └────────┬────────┘    └─────────┬───────────┘ │
└───────────┼─────────────────────┼────────────────────────┼─────────────┘
            │                     │                        │
            ▼                     ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API LAYER (Next.js)                              │
│  ┌───────────────────┐  ┌────────────────────┐  ┌────────────────────┐ │
│  │ GET /api/dashboard│  │ GET /api/admin/    │  │ POST /api/admin/   │ │
│  │ /invoices         │  │ payments/sync-status│  │ payments/sync      │ │
│  └───────────────────┘  └────────────────────┘  └────────────────────┘ │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                 POST /api/webhooks/netcash                         │ │
│  │  - Validates signature                                             │ │
│  │  - Updates Supabase                                                │ │
│  │  - Sends Resend email                                              │ │
│  │  - Queues ZOHO sync                                                │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                                    │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐ │
│  │ PaymentSyncService  │  │ EnhancedEmailService│  │ ZohoBillingClient│ │
│  │                     │  │                     │  │                 │ │
│  │ - syncPaymentToZoho │  │ - sendPaymentReceipt│  │ - recordPayment │ │
│  │ - findPendingSync   │  │ - sendInvoice       │  │ - updateInvoice │ │
│  │ - processBatchSync  │  │ - sendReminder      │  │ - getPayment    │ │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────┘ │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    SUPABASE     │  │     RESEND      │  │  ZOHO BILLING   │
│   PostgreSQL    │  │   Email API     │  │      API        │
│                 │  │                 │  │                 │
│ - Source of     │  │ - Payment       │  │ - Financial     │
│   Truth         │  │   receipts      │  │   Reporting     │
│ - RLS Protected │  │ - Invoices      │  │ - Revenue BI    │
│ - Audit Logs    │  │ - Reminders     │  │ - Async Mirror  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## 5. Risk Assessment

### 5.1 Risk Level: MEDIUM

### 5.2 Risk Factors

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| ZOHO sync failure | Low | Medium | Supabase is source of truth; ZOHO is for reporting only |
| Email delivery failure | Medium | Low | Resend has high deliverability; retry logic in place |
| NetCash webhook failure | High | Low | Idempotent processing; webhook replay support |
| Data inconsistency | High | Low | Database transactions; comprehensive audit logging |
| ZOHO rate limiting | Low | Medium | Batch processing; exponential backoff |
| Customer not in ZOHO | Medium | Low | Auto-sync customer before payment sync |

### 5.3 Mitigations

1. **Supabase-First**: Payment is confirmed the moment Supabase is updated. ZOHO sync failure doesn't affect customer experience.

2. **Email Reliability**: Resend has 99.9%+ delivery rate. Failed emails logged for admin review.

3. **Idempotent Webhooks**: Use `netcash_reference` as idempotency key to prevent duplicate payment processing.

4. **Retry Logic**: 3 attempts with exponential backoff (1s, 2s, 4s) for ZOHO sync.

5. **Graceful Degradation**: If ZOHO is down, payments still work. Finance team can see pending syncs in admin.

6. **Audit Trail**: All payment events logged to `zoho_sync_logs` for debugging.

---

## 6. Success Criteria

### 6.1 Functional Criteria

- [ ] Payments recorded in Supabase within 500ms of webhook receipt
- [ ] Payment confirmation emails sent within 30 seconds
- [ ] ZOHO sync completed within 5 minutes (or logged as failed)
- [ ] No duplicate payments or emails
- [ ] Admin can view all sync statuses and trigger retries

### 6.2 Performance Criteria

- [ ] Webhook processing time < 2 seconds
- [ ] Email delivery rate > 95%
- [ ] ZOHO sync success rate > 90%
- [ ] Sync retry success rate > 80%

### 6.3 Business Criteria

- [ ] Finance team can generate accurate ZOHO reports within 24 hours
- [ ] Zero customer complaints about missing payment confirmations
- [ ] 100% payment visibility in customer dashboard

---

## 7. Testing Strategy

### 7.1 Unit Tests

- [ ] `PaymentSyncService.syncPaymentToZoho()` - success and failure cases
- [ ] `PaymentSyncService.findPaymentsNeedingSync()` - query logic
- [ ] Email template rendering with various data
- [ ] Retry logic with exponential backoff

### 7.2 Integration Tests

- [ ] Full payment flow: NetCash → Supabase → Email → ZOHO
- [ ] Partial payment handling
- [ ] ZOHO sync failure and retry
- [ ] Admin sync trigger API

### 7.3 E2E Tests

- [ ] Simulate NetCash webhook with test payment
- [ ] Verify email receipt in test inbox
- [ ] Verify ZOHO payment record created
- [ ] Admin dashboard shows correct sync status

---

## 8. Implementation Notes

### 8.1 Existing Infrastructure

The following components already exist and will be reused:

- **ZohoBillingClient.recordPayment()** (`lib/integrations/zoho/billing-client.ts:958-1000`)
  - Already supports offline payment recording
  - Tested with manual payments

- **EnhancedEmailService** (`lib/emails/enhanced-notification-service.ts`)
  - Resend integration complete
  - Template rendering system
  - Already has `sendPaymentReceived()` (similar to what we need)

- **NetCash Webhook Processor** (`lib/payment/netcash-webhook-processor.ts`)
  - Signature validation
  - Payment confirmation logic
  - Needs enhancement for email + ZOHO sync

- **zoho_sync_logs** table (existing)
  - Audit logging for ZOHO sync
  - Retry tracking

### 8.2 Configuration

**Environment Variables** (Already configured):
```env
# NetCash
NETCASH_SERVICE_KEY=xxx
NETCASH_ACCOUNT_KEY=xxx

# Resend
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@notifications.circletelsa.co.za

# ZOHO Billing
ZOHO_CLIENT_ID=xxx
ZOHO_CLIENT_SECRET=xxx
ZOHO_REFRESH_TOKEN=xxx
ZOHO_ORG_ID=xxx
```

### 8.3 ZOHO Payment Modes

When recording payments in ZOHO Billing, use these modes:

| Payment Method | ZOHO Mode |
|---------------|-----------|
| EFT / Bank Transfer | `banktransfer` |
| Credit Card | `creditcard` |
| Debit Order | `bankremittance` |
| SnapScan / Ozow | `others` |
| Cash (rare) | `cash` |

---

## 9. Dependencies

### 9.1 Internal Dependencies

- `lib/supabase/server.ts` - Database client
- `lib/emails/enhanced-notification-service.ts` - Email sending
- `lib/integrations/zoho/billing-client.ts` - ZOHO API client
- `lib/payment/netcash-webhook-processor.ts` - Webhook handling

### 9.2 External Dependencies

- **NetCash Pay Now** - Payment processing (already integrated)
- **Resend** - Email delivery (already configured)
- **ZOHO Billing** - Financial reporting (already configured)

---

## 10. Rollout Plan

### Phase 1: Development (Week 1)
- Implement database changes
- Build PaymentSyncService
- Create payment_receipt email template
- Enhance NetCash webhook processor

### Phase 2: Testing (Week 1-2)
- Unit tests
- Integration tests
- Staging environment testing with test payments

### Phase 3: Soft Launch (Week 2)
- Enable for new payments only
- Monitor email delivery and ZOHO sync
- Verify finance team can see payments in ZOHO

### Phase 4: Full Rollout (Week 2-3)
- Enable for all payments
- Backfill any unsynced historical payments
- Set up monitoring alerts
- Document for support team
