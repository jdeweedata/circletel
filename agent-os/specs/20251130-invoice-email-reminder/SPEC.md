# Specification: Invoice Email Reminder Automation

**Spec ID**: 20251130-invoice-email-reminder
**Version**: 1.0
**Created**: 2025-11-30
**Status**: Ready for Implementation

---

## 1. Overview

### 1.1 Description

Implement an automated system that sends invoice reminder emails to customers exactly 5 calendar days before their payment due date. The system will run daily, identify invoices with due dates 5 days in the future, and dispatch personalized reminder emails with invoice details and payment links.

### 1.2 Goals

- **G1**: Reduce late payments by proactively reminding customers
- **G2**: Automate manual reminder process for billing team
- **G3**: Provide visibility into reminder status for admin users
- **G4**: Maintain audit trail of all sent reminders

### 1.3 Non-Goals

- **NG1**: Multiple reminder emails (only 5-day reminder in scope)
- **NG2**: SMS or WhatsApp reminders (future enhancement)
- **NG3**: Customer opt-out preferences (future enhancement)
- **NG4**: Reminder for overdue invoices (separate feature)

---

## 2. User Stories

### US-1: Automated Daily Reminder Processing

**As a** billing administrator
**I want** the system to automatically send invoice reminders daily
**So that** customers receive timely payment notifications without manual intervention

**Acceptance Criteria**:
- [ ] System runs daily at 08:00 SAST (06:00 UTC)
- [ ] Identifies all invoices with status 'sent' and due_date = today + 5 days
- [ ] Sends personalized email to each customer
- [ ] Logs each sent reminder with timestamp
- [ ] Prevents duplicate reminders for same invoice

**Story Points**: 5

---

### US-2: Invoice Reminder Email Template

**As a** customer
**I want** to receive a clear, informative reminder email
**So that** I understand what invoice is due and how to pay

**Acceptance Criteria**:
- [ ] Email includes: Invoice number, amount due, due date
- [ ] Email includes: Customer name, service description
- [ ] Email includes: Link to view/download invoice PDF
- [ ] Email includes: Payment instructions or link
- [ ] Email uses CircleTel brand styling (orange #F5831F)
- [ ] Subject line: "Payment Reminder: Invoice [INV-XXXX] due in 5 days"

**Story Points**: 3

---

### US-3: Manual Reminder Trigger for Admin

**As an** admin user
**I want** to manually trigger reminder emails
**So that** I can send reminders outside the scheduled window or resend failed reminders

**Acceptance Criteria**:
- [ ] Admin can trigger reminders for specific invoice(s)
- [ ] Admin can trigger batch reminders for all due in 5 days
- [ ] Response shows success/failure count
- [ ] Action is logged in admin_activity_log

**Story Points**: 3

---

### US-4: Reminder Tracking and Audit

**As a** billing administrator
**I want** to see which invoices have received reminders
**So that** I can verify the system is working and troubleshoot issues

**Acceptance Criteria**:
- [ ] Invoice record shows reminder_sent_at timestamp
- [ ] Invoice record shows reminder_count
- [ ] Audit log captures all reminder send attempts
- [ ] Failed reminders are logged with error details

**Story Points**: 2

---

## 3. Technical Specification

### 3.1 Database Changes

#### 3.1.1 Modify `customer_invoices` Table

```sql
ALTER TABLE public.customer_invoices
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reminder_error TEXT;
```

#### 3.1.2 Create Index for Reminder Queries

```sql
CREATE INDEX idx_customer_invoices_reminder_due
  ON public.customer_invoices(due_date, status, reminder_sent_at)
  WHERE status = 'sent' AND reminder_sent_at IS NULL;
```

### 3.2 API Endpoints

#### 3.2.1 Edge Function: `invoice-reminder`

**Trigger**: Daily at 08:00 SAST via pg_cron or Supabase scheduled function

**Process**:
1. Query invoices: `status = 'sent' AND due_date = CURRENT_DATE + 5 AND reminder_sent_at IS NULL`
2. For each invoice, fetch customer email and invoice details
3. Render email template with invoice data
4. Send email via Resend API
5. Update invoice: `reminder_sent_at = NOW()`, `reminder_count = reminder_count + 1`
6. Log to `invoice_audit_log`

**Response**:
```json
{
  "success": true,
  "processed": 15,
  "sent": 14,
  "failed": 1,
  "errors": [{ "invoice_id": "xxx", "error": "Invalid email" }]
}
```

#### 3.2.2 Admin API: `POST /api/admin/billing/send-reminders`

**Request**:
```json
{
  "invoice_ids": ["uuid1", "uuid2"],  // Optional: specific invoices
  "days_before_due": 5,               // Optional: override default
  "dry_run": false                    // Optional: preview without sending
}
```

**Response**:
```json
{
  "success": true,
  "processed": 2,
  "sent": 2,
  "failed": 0,
  "dry_run": false
}
```

### 3.3 Email Template

**Template Name**: `invoice_due_reminder`

**Data Required**:
```typescript
interface InvoiceReminderData {
  customer_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  amount_due: number;  // total_amount - amount_paid
  service_description: string;
  pdf_url?: string;
  payment_url?: string;
  days_until_due: number;
}
```

### 3.4 Service Layer

#### 3.4.1 InvoiceReminderService

**Location**: `lib/billing/invoice-reminder-service.ts`

**Methods**:
```typescript
class InvoiceReminderService {
  // Find invoices due in N days that haven't received a reminder
  static async findInvoicesNeedingReminder(daysBeforeDue: number): Promise<Invoice[]>

  // Send reminder for a single invoice
  static async sendReminder(invoiceId: string): Promise<ReminderResult>

  // Process all invoices needing reminders
  static async processReminders(daysBeforeDue?: number): Promise<BatchReminderResult>

  // Get reminder status for an invoice
  static async getReminderStatus(invoiceId: string): Promise<ReminderStatus>
}
```

---

## 4. Architecture

### 4.1 Data Flow

```
┌─────────────────┐     ┌────────────────────┐     ┌──────────────┐
│   pg_cron /     │────▶│  invoice-reminder  │────▶│   Supabase   │
│ Supabase Sched  │     │   Edge Function    │     │   Database   │
└─────────────────┘     └────────┬───────────┘     └──────────────┘
                                 │
                                 ▼
                        ┌────────────────────┐
                        │ InvoiceReminder    │
                        │ Service            │
                        └────────┬───────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
┌──────────────┐       ┌──────────────────┐      ┌──────────────┐
│ Query        │       │ Email            │      │ Update       │
│ Invoices     │       │ Notification     │      │ Invoice      │
│ due in 5 days│       │ Service (Resend) │      │ Record       │
└──────────────┘       └──────────────────┘      └──────────────┘
```

### 4.2 Component Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                         Admin Dashboard                          │
│  ┌─────────────────┐                                            │
│  │ Manual Trigger  │──┐                                         │
│  │ Button          │  │                                         │
│  └─────────────────┘  │                                         │
└───────────────────────┼─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js)                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  POST /api/admin/billing/send-reminders                 │    │
│  │  - Auth check (admin only)                              │    │
│  │  - Validate request                                     │    │
│  │  - Call InvoiceReminderService                          │    │
│  │  - Log to admin_activity_log                            │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Service Layer                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  InvoiceReminderService                                 │    │
│  │  - findInvoicesNeedingReminder()                        │    │
│  │  - sendReminder()                                       │    │
│  │  - processReminders()                                   │    │
│  └────────────────────────────┬────────────────────────────┘    │
│                               │                                  │
│  ┌─────────────────┐    ┌────┴─────────────┐    ┌────────────┐ │
│  │ Compliant       │    │ Email            │    │ Supabase   │ │
│  │ BillingService  │    │ Notification     │    │ Client     │ │
│  │                 │    │ Service          │    │            │ │
│  └─────────────────┘    └──────────────────┘    └────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Risk Assessment

### 5.1 Risk Level: MEDIUM

### 5.2 Risk Factors

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Duplicate emails | Medium | Low | Track reminder_sent_at, check before sending |
| Email delivery failure | Medium | Low | Retry logic, error logging, admin visibility |
| Timezone issues | High | Medium | Use SAST consistently, test edge cases |
| Spam complaints | Medium | Low | Single reminder per invoice, professional content |
| Missing customer email | Low | Low | Skip with warning, log for admin review |
| High volume overload | Medium | Low | Rate limiting, batch processing |

### 5.3 Mitigations

1. **Duplicate Prevention**: Check `reminder_sent_at` before sending; use database transaction
2. **Error Handling**: Log all failures to `invoice_audit_log`; surface in admin dashboard
3. **Timezone**: Store all dates in UTC; convert to SAST for display and scheduling
4. **Rate Limiting**: Process in batches of 50; add delay between batches

---

## 6. Success Criteria

### 6.1 Functional Criteria

- [ ] Reminders sent automatically every day at 08:00 SAST
- [ ] Only invoices with status 'sent' receive reminders
- [ ] Only invoices due in exactly 5 days receive reminders
- [ ] No duplicate reminders for the same invoice
- [ ] Admin can trigger manual reminders
- [ ] All reminder activity is logged

### 6.2 Performance Criteria

- [ ] Process 100+ invoices in under 60 seconds
- [ ] Email delivery rate > 95%
- [ ] Edge Function execution time < 30 seconds

### 6.3 Business Criteria

- [ ] Reduce late payment rate by 15%
- [ ] Zero manual reminder emails required

---

## 7. Testing Strategy

### 7.1 Unit Tests

- [ ] `InvoiceReminderService.findInvoicesNeedingReminder()` - query logic
- [ ] `InvoiceReminderService.sendReminder()` - single invoice processing
- [ ] Email template rendering with various data scenarios
- [ ] Date calculation (5 days before due date)

### 7.2 Integration Tests

- [ ] Full reminder flow: query → send → update
- [ ] Admin API endpoint with auth
- [ ] Error handling for missing email
- [ ] Duplicate prevention

### 7.3 E2E Tests

- [ ] Scheduled trigger simulation
- [ ] Manual admin trigger via UI
- [ ] Email content verification (Resend test mode)

---

## 8. Implementation Notes

### 8.1 Existing Infrastructure

The following components already exist and will be reused:

- **EmailNotificationService** (`lib/notifications/notification-service.ts`)
  - Resend API integration
  - Template rendering system
  - Already has invoice-related templates

- **CompliantBillingService** (`lib/billing/compliant-billing-service.ts`)
  - Invoice CRUD operations
  - Audit logging pattern

- **billing-auto-generate Edge Function** (`supabase/functions/billing-auto-generate/`)
  - Pattern for scheduled billing operations
  - Error handling and logging patterns

### 8.2 Configuration

**Environment Variables**:
```env
# Already configured
RESEND_API_KEY=re_xxxxx
NEXT_PUBLIC_BASE_URL=https://www.circletel.co.za

# May need to add
REMINDER_DAYS_BEFORE_DUE=5
REMINDER_BATCH_SIZE=50
```

### 8.3 Scheduling Options

**Option A: Supabase pg_cron** (Recommended)
```sql
SELECT cron.schedule(
  'invoice-reminder-daily',
  '0 6 * * *',  -- 06:00 UTC = 08:00 SAST
  $$
  SELECT net.http_post(
    url := 'https://agyjovdugmtopasyvlng.supabase.co/functions/v1/invoice-reminder',
    headers := '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
  );
  $$
);
```

**Option B: Vercel Cron**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/admin/billing/send-reminders",
    "schedule": "0 6 * * *"
  }]
}
```

---

## 9. Dependencies

### 9.1 Internal Dependencies

- `lib/supabase/server.ts` - Database client
- `lib/notifications/notification-service.ts` - Email sending
- `lib/billing/compliant-billing-service.ts` - Invoice operations

### 9.2 External Dependencies

- **Resend** - Email delivery (already configured)
- **pg_cron** - Scheduling (Supabase Pro feature)

---

## 10. Rollout Plan

### Phase 1: Development (Week 1)
- Implement database changes
- Build InvoiceReminderService
- Create email template
- Build Edge Function

### Phase 2: Testing (Week 1-2)
- Unit tests
- Integration tests
- Staging environment testing

### Phase 3: Soft Launch (Week 2)
- Enable for 10% of customers (test group)
- Monitor delivery rates and errors
- Gather feedback

### Phase 4: Full Rollout (Week 3)
- Enable for all customers
- Set up monitoring alerts
- Document for support team
