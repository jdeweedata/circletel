# Architecture: Unified Payment & Billing

## System Context

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CIRCLETEL ECOSYSTEM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Customer   │    │ Admin Portal │    │   Partner    │                  │
│  │  Dashboard   │    │              │    │   Portal     │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────────────┘                  │
│         │                   │                                               │
│         └─────────┬─────────┘                                               │
│                   │                                                         │
│                   ▼                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      NEXT.JS APPLICATION                            │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │   │
│  │  │  API Routes     │  │  Server Actions │  │  Webhooks       │     │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                   │                                                         │
│                   ▼                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                 SUPABASE (SOURCE OF TRUTH)                          │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐           │   │
│  │  │ customers │ │ invoices  │ │ payments  │ │ sync_logs │           │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                   │                                                         │
│         ┌─────────┼─────────┬─────────────────┐                            │
│         │         │         │                 │                            │
│         ▼         ▼         ▼                 ▼                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐                  │
│  │ NetCash  │ │  Resend  │ │  ZOHO    │ │ Interstellio │                  │
│  │ Pay Now  │ │  Email   │ │ Billing  │ │    RICA      │                  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘                  │
│    Payment     Transact.     Reporting     Compliance                      │
│   Processing    Emails        Mirror                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Payment Flow Sequence

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Customer │    │ NetCash  │    │ Webhook  │    │ Supabase │    │  Resend  │
│          │    │ Pay Now  │    │ Handler  │    │   (SoT)  │    │  Email   │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │               │
     │  Pay Invoice  │               │               │               │
     │──────────────>│               │               │               │
     │               │               │               │               │
     │               │ Process       │               │               │
     │               │ Payment       │               │               │
     │               │ (20+ methods) │               │               │
     │               │               │               │               │
     │               │  Webhook POST │               │               │
     │               │──────────────>│               │               │
     │               │               │               │               │
     │               │               │ Verify Sig    │               │
     │               │               │───────────────│               │
     │               │               │               │               │
     │               │               │ 1. Record     │               │
     │               │               │    Payment    │               │
     │               │               │──────────────>│               │
     │               │               │               │               │
     │               │               │ 2. Update     │               │
     │               │               │    Invoice    │               │
     │               │               │──────────────>│               │
     │               │               │               │               │
     │               │               │ 3. Send       │               │
     │               │               │    Receipt    │               │
     │               │               │──────────────────────────────>│
     │               │               │               │               │
     │               │               │               │  Email Sent   │
     │<──────────────────────────────────────────────────────────────│
     │               │               │               │               │
     │               │               │ 4. Queue ZOHO │               │
     │               │               │    Sync       │               │
     │               │               │ (async)       │               │
     │               │               │               │               │
     │               │    HTTP 200   │               │               │
     │               │<──────────────│               │               │
     │               │               │               │               │
```

---

## ZOHO Sync Flow (Async)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         ZOHO SYNC FLOW (Best-Effort)                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────┐                                                      │
│  │ Payment Record  │                                                      │
│  │ (Supabase)      │                                                      │
│  └────────┬────────┘                                                      │
│           │                                                               │
│           ▼                                                               │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐    │
│  │ Get Invoice     │────>│ Check ZOHO      │────>│ Has ZOHO        │    │
│  │ Details         │     │ Invoice ID      │     │ Invoice ID?     │    │
│  └─────────────────┘     └─────────────────┘     └────────┬────────┘    │
│                                                           │              │
│                                    ┌──────────────────────┴──────┐       │
│                                    │                             │       │
│                                    ▼                             ▼       │
│                          ┌─────────────────┐           ┌─────────────┐  │
│                          │ Map Payment     │           │ Skip Sync   │  │
│                          │ Method to ZOHO  │           │ (No ZOHO ID)│  │
│                          │ Mode            │           └─────────────┘  │
│                          └────────┬────────┘                            │
│                                   │                                      │
│                                   ▼                                      │
│                          ┌─────────────────┐                            │
│                          │ Call ZOHO API   │                            │
│                          │ recordPayment() │                            │
│                          └────────┬────────┘                            │
│                                   │                                      │
│                    ┌──────────────┴──────────────┐                      │
│                    │                             │                      │
│                    ▼                             ▼                      │
│           ┌─────────────────┐           ┌─────────────────┐            │
│           │ Success         │           │ Failure         │            │
│           │                 │           │                 │            │
│           │ Update status:  │           │ Retry up to 3x  │            │
│           │ 'synced'        │           │ with backoff    │            │
│           │                 │           │                 │            │
│           │ Store ZOHO      │           │ Update status:  │            │
│           │ payment_id      │           │ 'failed'        │            │
│           └─────────────────┘           └─────────────────┘            │
│                                                                         │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Payment Method Mapping

```
┌────────────────────────────────────────────────────────────────────────┐
│                    NETCASH TO ZOHO PAYMENT MODE MAPPING                 │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   NetCash Pay Now                     ZOHO Billing                      │
│   ┌──────────────────┐               ┌──────────────────┐              │
│   │                  │               │                  │              │
│   │  credit_card     │──────────────>│  creditcard      │              │
│   │  debit_card      │──────────────>│  creditcard      │              │
│   │                  │               │                  │              │
│   │  eft             │──────────────>│  banktransfer    │              │
│   │  instant_eft     │──────────────>│  banktransfer    │              │
│   │  ozow            │──────────────>│  banktransfer    │              │
│   │                  │               │                  │              │
│   │  mobicred        │──────────────>│  others          │              │
│   │  payflex         │──────────────>│  others          │              │
│   │  1voucher        │──────────────>│  others          │              │
│   │  zapper          │──────────────>│  others          │              │
│   │                  │               │                  │              │
│   │  (default)       │──────────────>│  others          │              │
│   │                  │               │                  │              │
│   └──────────────────┘               └──────────────────┘              │
│                                                                         │
│   ZOHO Billing Supported Payment Modes:                                 │
│   • check, cash, creditcard, banktransfer                              │
│   • bankremittance, autotransaction, others                            │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATABASE SCHEMA UPDATES                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  customer_payments (EXISTING - MODIFIED)                                 │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ id                    UUID PRIMARY KEY                              │ │
│  │ invoice_id            UUID REFERENCES customer_invoices(id)         │ │
│  │ customer_id           UUID REFERENCES customers(id)                 │ │
│  │ amount                DECIMAL(10,2) NOT NULL                        │ │
│  │ payment_method        TEXT NOT NULL                                 │ │
│  │ reference             TEXT                                          │ │
│  │ status                TEXT                                          │ │
│  │ transaction_date      TIMESTAMPTZ                                   │ │
│  │ created_at            TIMESTAMPTZ DEFAULT NOW()                     │ │
│  │ ─────────────────────────────────────────────────────────────────── │ │
│  │ + zoho_payment_id     TEXT                           (NEW)          │ │
│  │ + zoho_sync_status    TEXT DEFAULT 'pending'         (NEW)          │ │
│  │ + zoho_last_synced_at TIMESTAMPTZ                    (NEW)          │ │
│  │ + zoho_last_sync_error TEXT                          (NEW)          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  payment_sync_logs (NEW)                                                 │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()    │ │
│  │ payment_id            UUID REFERENCES customer_payments(id)         │ │
│  │ invoice_id            UUID REFERENCES customer_invoices(id)         │ │
│  │ zoho_payment_id       TEXT                                          │ │
│  │ sync_status           TEXT NOT NULL                                 │ │
│  │ attempt_number        INT DEFAULT 1                                 │ │
│  │ request_payload       JSONB                                         │ │
│  │ response_payload      JSONB                                         │ │
│  │ error_message         TEXT                                          │ │
│  │ created_at            TIMESTAMPTZ DEFAULT NOW()                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Sync Status Values:                                                     │
│  • pending  - Not yet attempted                                          │
│  • syncing  - Currently processing                                       │
│  • synced   - Successfully recorded in ZOHO                             │
│  • failed   - All retries exhausted                                      │
│  • skipped  - No ZOHO invoice ID (can't sync)                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
lib/
├── payments/
│   ├── payment-sync-service.ts      (NEW) Payment ZOHO sync orchestration
│   └── types.ts                     (NEW) Payment type definitions
│
├── payment/
│   └── netcash-webhook-processor.ts (MOD) Add email + ZOHO sync
│
├── integrations/
│   └── zoho/
│       ├── billing-client.ts        (EXISTS) Has recordPayment()
│       └── invoice-sync-service.ts  (EXISTS) Reference pattern
│
└── emails/
    ├── enhanced-notification-service.ts (MOD) Add sendPaymentReceipt()
    └── email-renderer.ts            (MOD) Register payment_receipt

emails/
└── templates/
    └── payment-receipt.tsx          (NEW) React Email template

supabase/
└── migrations/
    └── YYYYMMDD_payment_sync_tracking.sql (NEW)

app/
└── api/
    └── cron/
        └── retry-payment-syncs/
            └── route.ts             (NEW) Retry failed syncs

components/
└── admin/
    ├── invoices/
    │   └── InvoicePaymentHistory.tsx (MOD) Show sync status
    └── dashboard/
        └── PaymentSyncWidget.tsx    (NEW) Sync health widget
```

---

## Integration Points

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INTEGRATION DEPENDENCIES                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  NETCASH PAY NOW                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ • Webhook URL: /api/webhooks/netcash                            │    │
│  │ • Signature: HMAC-SHA256                                        │    │
│  │ • Methods: 20+ SA payment methods                               │    │
│  │ • Env: NETCASH_SERVICE_KEY, NETCASH_WEBHOOK_SECRET              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  RESEND EMAIL                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ • API: https://api.resend.com/emails                            │    │
│  │ • From: noreply@notifications.circletelsa.co.za                 │    │
│  │ • Templates: React Email (payment_receipt)                      │    │
│  │ • Env: RESEND_API_KEY                                           │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ZOHO BILLING                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ • API: https://billing.zoho.com/api/v1                          │    │
│  │ • Auth: OAuth2 (refresh token flow)                             │    │
│  │ • Endpoint: POST /customerpayments                              │    │
│  │ • payment_mode: banktransfer | creditcard | others              │    │
│  │ • Env: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  SUPABASE                                                                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ • Project: agyjovdugmtopasyvlng                                 │    │
│  │ • Tables: customer_payments, customer_invoices, payment_sync_logs│    │
│  │ • RLS: Service role for webhooks, anon for dashboard           │    │
│  │ • Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Error Handling Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ERROR HANDLING MATRIX                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Error Type           │ Action                    │ Customer Impact      │
│  ─────────────────────┼───────────────────────────┼───────────────────── │
│                       │                           │                      │
│  NetCash webhook      │ Return HTTP 200           │ None - payment       │
│  processing error     │ Log error, retry later    │ already processed    │
│                       │                           │                      │
│  Supabase write       │ Return HTTP 500           │ Payment may not      │
│  failure              │ Alert ops team            │ show in dashboard    │
│                       │                           │                      │
│  Resend email         │ Log error, continue       │ No receipt email     │
│  failure              │ Queue for retry           │ (can resend later)   │
│                       │                           │                      │
│  ZOHO sync            │ Mark as 'failed'          │ None - Supabase      │
│  failure              │ Retry via cron (3x)       │ is source of truth   │
│                       │                           │                      │
│  ZOHO invoice not     │ Mark as 'skipped'         │ None - not all       │
│  found                │ Don't retry               │ invoices in ZOHO     │
│                       │                           │                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Monitoring & Observability

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MONITORING SETUP                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  LOGS                                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ • [NetCashWebhook] Payment received: {invoice_id, amount}       │    │
│  │ • [PaymentSync] Syncing to ZOHO: {payment_id, invoice_id}       │    │
│  │ • [PaymentSync] Success: {zoho_payment_id}                      │    │
│  │ • [PaymentSync] Failed: {error, attempt_number}                 │    │
│  │ • [EmailService] Receipt sent: {message_id, email}              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  METRICS                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ • payment_sync_total          Counter of all sync attempts      │    │
│  │ • payment_sync_success        Counter of successful syncs       │    │
│  │ • payment_sync_failed         Counter of failed syncs           │    │
│  │ • payment_sync_latency_ms     Histogram of sync duration        │    │
│  │ • email_receipt_sent          Counter of receipt emails         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ALERTS                                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ • payment_sync_failed > 10 in 24h   → Slack #ops-alerts         │    │
│  │ • email_delivery_rate < 95%          → Email ops team           │    │
│  │ • zoho_api_errors > 5 in 1h          → PagerDuty                │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Security Considerations

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SECURITY CHECKLIST                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ✓ Webhook Signature Verification                                        │
│    • HMAC-SHA256 verification for NetCash webhooks                       │
│    • Reject requests with invalid signatures                             │
│                                                                          │
│  ✓ API Authentication                                                    │
│    • ZOHO OAuth2 with refresh token (stored in env vars)                │
│    • Resend API key (stored in env vars)                                │
│    • Supabase service role for webhook handlers                         │
│                                                                          │
│  ✓ Data Protection                                                       │
│    • No card numbers stored (NetCash tokenizes)                         │
│    • Audit logs for all payment operations                              │
│    • RLS policies on payment tables                                     │
│                                                                          │
│  ✓ Rate Limiting                                                         │
│    • ZOHO API: Max 100 req/min (built-in backoff)                       │
│    • Resend: 100 emails/second (well within limits)                     │
│                                                                          │
│  ✓ Error Handling                                                        │
│    • No sensitive data in error messages                                │
│    • Structured logging without PII                                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```
