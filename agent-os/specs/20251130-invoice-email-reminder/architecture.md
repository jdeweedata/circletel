# Architecture: Invoice Email Reminder Automation

**Spec ID**: 20251130-invoice-email-reminder

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INVOICE REMINDER SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │  Scheduler   │     │    Admin     │     │   Manual     │                │
│  │  (pg_cron)   │     │  Dashboard   │     │   Trigger    │                │
│  │  Daily 8AM   │     │  UI Button   │     │   API Call   │                │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘                │
│         │                    │                    │                         │
│         │                    │                    │                         │
│         ▼                    ▼                    ▼                         │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │                    TRIGGER LAYER                              │          │
│  │  ┌─────────────────────┐  ┌─────────────────────────────┐   │          │
│  │  │ invoice-reminder    │  │ /api/admin/billing/         │   │          │
│  │  │ Edge Function       │  │ send-reminders              │   │          │
│  │  │ (Supabase)          │  │ (Next.js API)               │   │          │
│  │  └──────────┬──────────┘  └──────────────┬──────────────┘   │          │
│  └─────────────┼────────────────────────────┼───────────────────┘          │
│                │                            │                               │
│                └────────────┬───────────────┘                               │
│                             ▼                                               │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │                    SERVICE LAYER                              │          │
│  │                                                               │          │
│  │  ┌─────────────────────────────────────────────────────────┐ │          │
│  │  │              InvoiceReminderService                      │ │          │
│  │  │                                                          │ │          │
│  │  │  ┌──────────────────┐  ┌───────────────────────────┐   │ │          │
│  │  │  │ findInvoices     │  │ processReminders()        │   │ │          │
│  │  │  │ NeedingReminder()│  │ - Query invoices          │   │ │          │
│  │  │  │                  │  │ - Send emails             │   │ │          │
│  │  │  │ Query:           │  │ - Update records          │   │ │          │
│  │  │  │ status='sent'    │  │ - Log audit               │   │ │          │
│  │  │  │ due_date=now+5   │  │                           │   │ │          │
│  │  │  │ reminder=null    │  │                           │   │ │          │
│  │  │  └──────────────────┘  └───────────────────────────┘   │ │          │
│  │  └─────────────────────────────────────────────────────────┘ │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                             │                                               │
│                             ▼                                               │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │                    INTEGRATION LAYER                          │          │
│  │                                                               │          │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │          │
│  │  │   Supabase     │  │    Resend      │  │   Audit Log    │  │          │
│  │  │   Database     │  │    Email API   │  │                │  │          │
│  │  │                │  │                │  │                │  │          │
│  │  │ customer_      │  │ Send email     │  │ invoice_       │  │          │
│  │  │ invoices       │  │ with template  │  │ audit_log      │  │          │
│  │  │                │  │                │  │                │  │          │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Flow Diagram

```
                                    DAILY 08:00 SAST
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              pg_cron TRIGGER                                 │
│                                                                              │
│   SELECT cron.schedule('invoice-reminder-daily', '0 6 * * *', ...);        │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         invoice-reminder Edge Function                       │
│                                                                              │
│  1. Initialize Supabase client with service role                            │
│  2. Call InvoiceReminderService.processReminders()                          │
│  3. Return summary response                                                  │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         InvoiceReminderService                               │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Step 1: Query invoices needing reminders                            │   │
│  │                                                                      │   │
│  │   SELECT * FROM customer_invoices ci                                │   │
│  │   JOIN customers c ON ci.customer_id = c.id                         │   │
│  │   WHERE ci.status = 'sent'                                          │   │
│  │     AND ci.due_date = CURRENT_DATE + INTERVAL '5 days'              │   │
│  │     AND ci.reminder_sent_at IS NULL                                 │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                        │
│                                     ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Step 2: For each invoice, send reminder email                       │   │
│  │                                                                      │   │
│  │   FOR invoice IN invoices:                                          │   │
│  │     ├─ Build email data (invoice details, customer info)            │   │
│  │     ├─ Render email template                                        │   │
│  │     ├─ Send via Resend API                                          │   │
│  │     ├─ Update invoice: reminder_sent_at, reminder_count             │   │
│  │     └─ Log to invoice_audit_log                                     │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                        │
│                                     ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Step 3: Return batch result                                         │   │
│  │                                                                      │   │
│  │   {                                                                  │   │
│  │     processed: 15,                                                   │   │
│  │     sent: 14,                                                        │   │
│  │     failed: 1,                                                       │   │
│  │     errors: [{ invoice_id, error }]                                 │   │
│  │   }                                                                  │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          customer_invoices                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  EXISTING COLUMNS:                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ id              UUID PRIMARY KEY                                    │    │
│  │ customer_id     UUID REFERENCES customers(id)                       │    │
│  │ invoice_number  VARCHAR(20) UNIQUE                                  │    │
│  │ invoice_date    DATE                                                │    │
│  │ due_date        DATE                                                │    │
│  │ status          VARCHAR(20) ('draft','sent','paid','overdue',...)   │    │
│  │ total_amount    DECIMAL(10,2)                                       │    │
│  │ amount_paid     DECIMAL(10,2)                                       │    │
│  │ pdf_url         TEXT                                                │    │
│  │ ...                                                                 │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  NEW COLUMNS (this feature):                                                │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ reminder_sent_at   TIMESTAMPTZ     -- When reminder was sent       │    │
│  │ reminder_count     INTEGER = 0     -- Number of reminders sent     │    │
│  │ reminder_error     TEXT            -- Last error message (if any)  │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  NEW INDEX:                                                                  │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ idx_customer_invoices_reminder_pending                              │    │
│  │ ON (due_date)                                                       │    │
│  │ WHERE status = 'sent' AND reminder_sent_at IS NULL                  │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

                                     │
                                     │ JOINS
                                     ▼

┌─────────────────────────────────────────────────────────────────────────────┐
│                              customers                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  id              UUID PRIMARY KEY                                           │
│  first_name      TEXT                                                       │
│  last_name       TEXT                                                       │
│  email           TEXT                                                       │
│  account_number  VARCHAR(20)                                                │
│  ...                                                                        │
└─────────────────────────────────────────────────────────────────────────────┘

                                     │
                                     │ AUDIT LOGS TO
                                     ▼

┌─────────────────────────────────────────────────────────────────────────────┐
│                           invoice_audit_log                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  id              UUID PRIMARY KEY                                           │
│  invoice_id      UUID REFERENCES customer_invoices(id)                      │
│  action          VARCHAR(50) -- 'reminder_sent', 'reminder_failed'          │
│  new_data        JSONB       -- { reminder_sent_at, recipient_email, ... }  │
│  created_at      TIMESTAMPTZ                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Email Template Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     INVOICE DUE REMINDER EMAIL                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  HEADER (CircleTel Orange #F5831F)                                  │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │  ⏰ Payment Reminder                                           │  │   │
│  │  │  Invoice ${invoice_number} due in ${days_until_due} days       │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  CONTENT                                                            │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │  Hello ${customer_name},                                       │  │   │
│  │  │                                                                │  │   │
│  │  │  This is a friendly reminder that payment for your invoice    │  │   │
│  │  │  is due in 5 days.                                            │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────── INFO BOX ──────────────────────────┐  │   │
│  │  │  Invoice Number:    ${invoice_number}                         │  │   │
│  │  │  Invoice Date:      ${invoice_date}                           │  │   │
│  │  │  Due Date:          ${due_date}                               │  │   │
│  │  │  Amount Due:        R ${amount_due}                           │  │   │
│  │  │  Service:           ${service_description}                    │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  │                                                                      │   │
│  │  ┌──────────────────── PAYMENT OPTIONS ──────────────────────────┐  │   │
│  │  │  Pay Online:        [Pay Now Button]                          │  │   │
│  │  │  EFT:               CircleTel (Pty) Ltd                       │  │   │
│  │  │                     Bank: FNB                                 │  │   │
│  │  │                     Account: 12345678                         │  │   │
│  │  │                     Ref: ${invoice_number}                    │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  │                                                                      │   │
│  │  [View Invoice PDF Button]                                          │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  FOOTER                                                             │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │  CircleTel (Pty) Ltd                                          │  │   │
│  │  │  support@circletel.co.za | 0860 CIRCLE (0860 247 253)         │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. API Contract

### Edge Function: invoice-reminder

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  POST https://agyjovdugmtopasyvlng.supabase.co/functions/v1/invoice-reminder│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  REQUEST HEADERS:                                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}                   │ │
│  │  Content-Type: application/json                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  REQUEST BODY (optional):                                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  {                                                                    │ │
│  │    "days_before_due": 5,        // Optional, default 5               │ │
│  │    "dry_run": false,            // Optional, preview mode            │ │
│  │    "invoice_ids": ["uuid1"]     // Optional, specific invoices       │ │
│  │  }                                                                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  RESPONSE (200 OK):                                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  {                                                                    │ │
│  │    "success": true,                                                   │ │
│  │    "processed": 15,                                                   │ │
│  │    "sent": 14,                                                        │ │
│  │    "failed": 1,                                                       │ │
│  │    "dry_run": false,                                                  │ │
│  │    "errors": [                                                        │ │
│  │      { "invoice_id": "xxx", "error": "Invalid email address" }       │ │
│  │    ],                                                                 │ │
│  │    "duration_ms": 2345                                                │ │
│  │  }                                                                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Admin API: send-reminders

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  POST /api/admin/billing/send-reminders                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  REQUEST HEADERS:                                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Authorization: Bearer ${ADMIN_SESSION_TOKEN}                         │ │
│  │  Content-Type: application/json                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  REQUEST BODY:                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  {                                                                    │ │
│  │    "invoice_ids": ["uuid1", "uuid2"],  // Optional                   │ │
│  │    "days_before_due": 5,                // Optional                   │ │
│  │    "dry_run": true                      // Optional                   │ │
│  │  }                                                                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  RESPONSE (200 OK):                                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  {                                                                    │ │
│  │    "success": true,                                                   │ │
│  │    "message": "Reminders processed successfully",                     │ │
│  │    "processed": 2,                                                    │ │
│  │    "sent": 2,                                                         │ │
│  │    "failed": 0,                                                       │ │
│  │    "dry_run": true                                                    │ │
│  │  }                                                                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ERROR RESPONSES:                                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  401: { "success": false, "error": "Unauthorized" }                   │ │
│  │  403: { "success": false, "error": "Admin access required" }          │ │
│  │  500: { "success": false, "error": "Failed to process reminders" }    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. File Structure

```
circletel-nextjs/
├── app/
│   └── api/
│       └── admin/
│           └── billing/
│               └── send-reminders/
│                   └── route.ts           # Admin API endpoint
│
├── lib/
│   ├── billing/
│   │   ├── compliant-billing-service.ts   # Existing (no changes needed)
│   │   └── invoice-reminder-service.ts    # NEW: Reminder business logic
│   │
│   └── notifications/
│       └── notification-service.ts        # MODIFY: Add email template
│
├── supabase/
│   ├── functions/
│   │   └── invoice-reminder/
│   │       └── index.ts                   # NEW: Edge Function
│   │
│   └── migrations/
│       └── 20251130_invoice_reminder_tracking.sql  # NEW: Schema changes
│
└── agent-os/
    └── specs/
        └── 20251130-invoice-email-reminder/
            ├── README.md
            ├── SPEC.md
            ├── TASKS.md
            ├── PROGRESS.md
            └── architecture.md            # This file
```

---

## 7. Security Considerations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SECURITY MODEL                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  AUTHENTICATION:                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Edge Function:                                                       │ │
│  │  - Uses SUPABASE_SERVICE_ROLE_KEY                                     │ │
│  │  - Only callable by pg_cron or authenticated admin                    │ │
│  │  - Validates Authorization header                                     │ │
│  │                                                                        │ │
│  │  Admin API:                                                           │ │
│  │  - Requires authenticated session (cookies)                           │ │
│  │  - Checks admin_users table for admin role                            │ │
│  │  - Logs all actions to admin_activity_log                             │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  DATA ACCESS:                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  - Service role bypasses RLS                                          │ │
│  │  - Only reads invoices with status 'sent'                             │ │
│  │  - Only sends to customer.email (validated)                           │ │
│  │  - No sensitive data in email (no passwords, no full account details) │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  RATE LIMITING:                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  - reminder_count column prevents multiple reminders                  │ │
│  │  - reminder_sent_at prevents same-day duplicates                      │ │
│  │  - Batch processing with delays prevents email flood                  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Monitoring & Observability

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MONITORING POINTS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LOGS:                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  1. Edge Function Logs (Supabase Dashboard)                           │ │
│  │     - Invocation count                                                │ │
│  │     - Duration                                                        │ │
│  │     - Errors                                                          │ │
│  │                                                                        │ │
│  │  2. invoice_audit_log Table                                           │ │
│  │     - action = 'reminder_sent' or 'reminder_failed'                   │ │
│  │     - Query for daily summary                                         │ │
│  │                                                                        │ │
│  │  3. Admin Activity Log                                                │ │
│  │     - Manual triggers by admin users                                  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  METRICS:                                                                   │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  - Daily reminder count                                               │ │
│  │  - Success rate (%)                                                   │ │
│  │  - Failure rate (%)                                                   │ │
│  │  - Average processing time                                            │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ALERTS:                                                                    │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  - Failure rate > 10%                                                 │ │
│  │  - No reminders sent for 24 hours                                     │ │
│  │  - Edge Function timeout                                              │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```
