# Monthly Invoice Generation & Notification — Design Spec

**Date**: 2026-04-04  
**Status**: Approved  
**Author**: Jeffrey (via Claude Code brainstorming)

---

## Overview

Auto-generate invoices on the **25th of each month** for all customers whose `billing_day` falls within a configurable window (default: days 1–5). Notify each customer via **email** (full invoice detail + Pay Now link) and **SMS** (short link). Payment via existing NetCash Pay Now. Escalating reminders if unpaid by the due date (1st of month).

---

## Requirements

| # | Requirement |
|---|-------------|
| 1 | Invoices generated automatically on the 25th of each month |
| 2 | Only customers with `billing_day` in a configurable window are included |
| 3 | Duplicate guard: never generate two invoices for the same customer in the same month's 25th run |
| 4 | Email sent at generation time: full invoice detail, line items, Pay Now button |
| 5 | SMS sent at generation time: short message with Pay Now link (≤160 chars) |
| 6 | Payment via existing NetCash Pay Now (`paynow_url` on each invoice) |
| 7 | Escalating reminders: due date (1st), +3 days overdue, +7 days overdue |
| 8 | Billing day remains 1st of month — invoices generated 6 days early on the 25th |
| 9 | Configurable window stored in `billing_settings` — no deploy required to change |
| 10 | All operations retryable and observable via existing logging infrastructure |

---

## Architecture

```
25th of each month (06:00 SAST / 04:00 UTC)
  └── NEW: /api/cron/generate-invoices-25th  (Vercel cron: 0 4 25 * *)
        ├── Read billing_day_window from billing_settings (default: [1,2,3,4,5])
        ├── Query customer_services WHERE billing_day IN window AND status = 'active'
        ├── Skip if last_invoice_date >= current month's 25th  ← duplicate guard
        ├── For each customer:
        │     ├── generateCustomerInvoice() → row in customer_invoices, paynow_url set
        │     ├── UPDATE customer_services SET last_invoice_date = today
        │     └── inngest.send({ name: 'billing/invoice.generated', data: { invoice_id, customer_id } })
        └── Log { total, generated, skipped, failed } to cron_execution_log

billing/invoice.generated  (one event per customer)
  └── NEW: Inngest function: invoice-notification
        ├── step: fetch-invoice  → invoice + customer + paynow_url
        ├── step: send-email     → Resend: full invoice, line items, Pay Now button
        ├── step: send-sms       → Clickatell: short message + paynow_url
        └── step: update-invoice → SET emailed_at = now(), reminder_count = 0

Daily at 10:00 SAST (existing /api/cron/invoice-sms-reminders — EXTEND)
  └── MODIFIED: InvoiceSmsReminderService
        ├── Stage 0 (due today, days_overdue = 0):  "due today" reminder
        ├── Stage 1 (3 days overdue):  friendly reminder (existing)
        ├── Stage 2 (7 days overdue):  urgent notice (existing)
        └── Stage 3 (8+ days overdue): final notice (existing, unchanged)
```

---

## Files

| Action | File | Purpose |
|--------|------|---------|
| NEW | `app/api/cron/generate-invoices-25th/route.ts` | 25th cron: generate invoices + fire Inngest events |
| NEW | `lib/inngest/functions/invoice-notification.ts` | Inngest: email + SMS on invoice creation |
| MODIFY | `lib/billing/billing-settings-service.ts` | Add `billing_day_window: number[]` setting + getter |
| MODIFY | `lib/billing/invoice-sms-reminder-service.ts` | Add Stage 0 (due-date reminder) |
| MODIFY | `lib/inngest/index.ts` | Register `invoiceNotificationFunction` |
| MODIFY | `vercel.json` | Add cron entry `0 4 25 * *` |
| NEW | `supabase/migrations/YYYYMMDD_billing_day_window_setting.sql` | Seed `billing_day_window` in billing_settings |

---

## Data Design

### No new tables required

All required columns already exist on `customer_invoices` and `customer_services`.

### New billing setting

```sql
INSERT INTO billing_settings (setting_key, setting_value, customer_type, category, description)
VALUES (
  'billing_day_window',
  '[1,2,3,4,5]',
  'global',
  'billing_rules',
  'billing_day values included in the 25th-of-month invoice generation run'
)
ON CONFLICT (setting_key, customer_type) DO NOTHING;
```

### Duplicate guard query

```sql
SELECT cs.*
FROM customer_services cs
WHERE cs.billing_day = ANY(:window)
  AND cs.status = 'active'
  AND (
    cs.last_invoice_date IS NULL
    OR cs.last_invoice_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '24 days'
  )
```

### Existing columns used (no schema changes)

| Table | Column | Usage |
|-------|--------|-------|
| `customer_services` | `billing_day` | Filter for window |
| `customer_services` | `last_invoice_date` | Duplicate guard + update after generation |
| `customer_invoices` | `paynow_url` | Included in email + SMS |
| `customer_invoices` | `emailed_at` | Set after email sent; idempotency guard |
| `customer_invoices` | `reminder_count` | Reset to 0 on new invoice; gated by reminder stages |
| `customer_invoices` | `due_date` | Set to billing_day (1st) of next month |

---

## Inngest Function: `invoice-notification`

```
id:          invoice-notification
name:        Invoice Notification
trigger:     billing/invoice.generated
retries:     3
concurrency: 10
```

### Steps

**step: fetch-invoice**
- Query `customer_invoices JOIN customers` for `invoice_id`
- Guard: if `emailed_at IS NOT NULL` → skip (already notified, idempotent)
- Throw if invoice not found

**step: send-email**
- Provider: Resend via existing `EmailChannel`
- From: `billing@notify.circletel.co.za`
- Subject: `Your CircleTel Invoice [INV-XXXX] — R[amount] due [date]`
- Body sections:
  1. Greeting with customer first name
  2. Invoice summary table: line items, subtotal, VAT 15%, total
  3. Due date (1st of next month) prominently displayed
  4. Pay Now button → `paynow_url`
  5. Footer: support hours + contact details via `CONTACT` constants

**step: send-sms**
- Provider: Clickatell via existing `ClickatellService`
- Template (≤160 chars):
  ```
  Hi [FirstName], your CircleTel invoice [INV-XXXX] for R[amount] is due [date]. Pay now: [paynow_url]
  ```
- If `customer.phone` is null: log warning, skip SMS, do not fail the function

**step: update-invoice**
- `SET emailed_at = now(), reminder_count = 0`

---

## Reminder Extension

The existing `InvoiceSmsReminderService` already handles stages 1–3 (days 1–3, 4–7, 8+ overdue). Add **Stage 0**:

| Stage | Trigger | SMS message |
|-------|---------|-------------|
| 0 (NEW) | `due_date = TODAY` AND `reminder_count = 0` AND `status != 'paid'` | "Hi [Name], your CircleTel invoice [INV-XXXX] for R[amount] is due today. Pay now: [url]" |
| 1 | 1–3 days overdue | Existing friendly reminder |
| 2 | 4–7 days overdue | Existing urgent notice |
| 3 | 8+ days overdue | Existing final notice |

`reminder_count` is incremented after each stage fires, preventing re-firing the same stage.

---

## Cron Route: `generate-invoices-25th`

```
POST /api/cron/generate-invoices-25th
Auth: Authorization: Bearer CRON_SECRET
Schedule: 0 4 25 * * (06:00 SAST)
maxDuration: 300s

Request body overrides (for testing):
  { dryRun: true }                → preview without writing
  { customerId: "uuid" }          → single customer only
  { billingDayWindow: [1, 2] }    → override window for this run

Response:
  { date, total, generated, skipped, failed, duration_ms, errors[] }
```

**Processing logic:**
1. Read `billing_day_window` from billing settings
2. Query eligible `customer_services` (window filter + duplicate guard)
3. For each service: generate invoice → update `last_invoice_date` → fire Inngest event
4. Wrap each customer in try/catch — one failure does not abort the batch
5. Log execution to `cron_execution_log`

---

## Error Handling

| Failure | Behaviour |
|---------|-----------|
| Invoice already exists for this month | Skip via duplicate guard, log as `skipped` |
| Invoice generation fails for one customer | Catch, log error, continue batch |
| Email send fails | Inngest retries up to 3× with backoff |
| SMS send fails | Inngest retries up to 3× with backoff; phone null → warning only |
| Entire cron fails | Vercel cron retries; `dryRun` mode available for diagnosis |
| `emailed_at` already set | Inngest function exits early (idempotent) |

---

## Testing

- `POST /api/cron/generate-invoices-25th` with `{ dryRun: true }` — preview eligible customers
- `POST /api/cron/generate-invoices-25th` with `{ customerId: "uuid" }` — generate for one customer
- Trigger `billing/invoice.generated` manually in Inngest dashboard for any invoice
- `POST /api/cron/invoice-sms-reminders` with single invoice override to test Stage 0

---

## Out of Scope

- WhatsApp notifications (not requested; `whatsapp_enabled` setting remains `false`)
- Debit order / eMandate collection (handled by existing `billing-day.ts` Inngest function)
- B2B contract invoice generation (handled by existing `createInvoiceFromContract`)
- Admin UI changes to billing settings (existing settings UI covers `billing_day_window`)
