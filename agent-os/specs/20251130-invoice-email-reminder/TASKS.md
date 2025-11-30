# Task Breakdown: Invoice Email Reminder Automation

**Spec ID**: 20251130-invoice-email-reminder
**Total Story Points**: 16
**Task Groups**: 4

---

## Summary

| Task Group | Agent Role | Story Points | Dependencies |
|------------|------------|--------------|--------------|
| TG-1 | database-engineer | 3 | None |
| TG-2 | backend-engineer | 8 | TG-1 |
| TG-3 | testing-engineer | 3 | TG-2 |
| TG-4 | ops-engineer | 2 | TG-2 |

---

## TG-1: Database Schema Changes

**Agent**: database-engineer
**Story Points**: 3
**Status**: Pending
**Dependencies**: None

### Description
Add reminder tracking columns to customer_invoices table and create optimized index for reminder queries.

### Tasks

- [ ] **TG-1.1**: Add reminder columns to customer_invoices (1 point)
  - Add `reminder_sent_at TIMESTAMPTZ`
  - Add `reminder_count INTEGER DEFAULT 0`
  - Add `reminder_error TEXT`

- [ ] **TG-1.2**: Create performance index (1 point)
  - Create partial index for reminder queries
  - Index on (due_date, status, reminder_sent_at)

- [ ] **TG-1.3**: Update RLS policies if needed (1 point)
  - Ensure service role can update reminder fields
  - Ensure admins can query reminder status

### Files to Create

```
supabase/migrations/20251130_invoice_reminder_tracking.sql
```

### Migration SQL

```sql
-- Add reminder tracking columns
ALTER TABLE public.customer_invoices
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reminder_error TEXT;

-- Create optimized index for reminder queries
CREATE INDEX IF NOT EXISTS idx_customer_invoices_reminder_pending
  ON public.customer_invoices(due_date)
  WHERE status = 'sent' AND reminder_sent_at IS NULL;

-- Comment
COMMENT ON COLUMN public.customer_invoices.reminder_sent_at IS
  'Timestamp when payment reminder email was sent';
COMMENT ON COLUMN public.customer_invoices.reminder_count IS
  'Number of reminder emails sent for this invoice';
```

### Acceptance Criteria

- [ ] Migration applies without errors
- [ ] Columns exist on customer_invoices table
- [ ] Index is created and used by reminder queries
- [ ] Rollback script prepared

---

## TG-2: Backend Implementation

**Agent**: backend-engineer
**Story Points**: 8
**Status**: Pending
**Dependencies**: TG-1

### Description
Implement the core reminder functionality including service layer, Edge Function, and admin API endpoint.

### Tasks

- [ ] **TG-2.1**: Create InvoiceReminderService (3 points)
  - Create `lib/billing/invoice-reminder-service.ts`
  - Implement `findInvoicesNeedingReminder()`
  - Implement `sendReminder()`
  - Implement `processReminders()`
  - Add error handling and logging

- [ ] **TG-2.2**: Add email template (2 points)
  - Add `invoice_due_reminder` to EmailTemplate type
  - Create email HTML template in `renderTemplate()`
  - Include: invoice details, amount, due date, payment link
  - Test template rendering

- [ ] **TG-2.3**: Create Edge Function (2 points)
  - Create `supabase/functions/invoice-reminder/index.ts`
  - Handle scheduled invocation
  - Process reminders in batches
  - Return summary response

- [ ] **TG-2.4**: Create Admin API endpoint (1 point)
  - Create `app/api/admin/billing/send-reminders/route.ts`
  - Implement POST handler
  - Add admin authentication check
  - Support dry-run mode
  - Log to admin_activity_log

### Files to Create

```
lib/billing/invoice-reminder-service.ts
supabase/functions/invoice-reminder/index.ts
app/api/admin/billing/send-reminders/route.ts
```

### Files to Modify

```
lib/notifications/notification-service.ts  (add template)
```

### Service Interface

```typescript
// lib/billing/invoice-reminder-service.ts

export interface ReminderResult {
  invoice_id: string;
  invoice_number: string;
  customer_email: string;
  success: boolean;
  error?: string;
}

export interface BatchReminderResult {
  processed: number;
  sent: number;
  failed: number;
  results: ReminderResult[];
  duration_ms: number;
}

export class InvoiceReminderService {
  static async findInvoicesNeedingReminder(daysBeforeDue: number = 5): Promise<Invoice[]>;
  static async sendReminder(invoiceId: string): Promise<ReminderResult>;
  static async processReminders(options?: {
    daysBeforeDue?: number;
    invoiceIds?: string[];
    dryRun?: boolean;
  }): Promise<BatchReminderResult>;
}
```

### Acceptance Criteria

- [ ] Service correctly finds invoices due in 5 days
- [ ] Email template renders with all required data
- [ ] Edge Function processes reminders successfully
- [ ] Admin endpoint requires authentication
- [ ] Dry-run mode works correctly
- [ ] All actions are logged

---

## TG-3: Testing

**Agent**: testing-engineer
**Story Points**: 3
**Status**: Pending
**Dependencies**: TG-2

### Description
Create comprehensive tests for the reminder system.

### Tasks

- [ ] **TG-3.1**: Unit tests for InvoiceReminderService (2 points)
  - Test `findInvoicesNeedingReminder()` with various scenarios
  - Test `sendReminder()` success and failure cases
  - Test date calculation logic
  - Mock Supabase and email service

- [ ] **TG-3.2**: Integration tests (1 point)
  - Test full reminder flow
  - Test admin API endpoint
  - Test duplicate prevention

### Files to Create

```
lib/billing/__tests__/invoice-reminder-service.test.ts
app/api/admin/billing/send-reminders/__tests__/route.test.ts
```

### Test Scenarios

```typescript
describe('InvoiceReminderService', () => {
  describe('findInvoicesNeedingReminder', () => {
    it('finds invoices due in 5 days with status sent');
    it('excludes invoices that already received reminder');
    it('excludes invoices with status other than sent');
    it('handles empty result set');
  });

  describe('sendReminder', () => {
    it('sends email successfully');
    it('updates reminder_sent_at on success');
    it('increments reminder_count on success');
    it('logs error on email failure');
    it('handles missing customer email');
  });

  describe('processReminders', () => {
    it('processes multiple invoices');
    it('continues processing after individual failure');
    it('respects dry-run mode');
    it('returns accurate counts');
  });
});
```

### Acceptance Criteria

- [ ] All unit tests pass
- [ ] Test coverage > 80% for new code
- [ ] Edge cases are covered
- [ ] Mocks are properly isolated

---

## TG-4: Operations & Scheduling

**Agent**: ops-engineer
**Story Points**: 2
**Status**: Pending
**Dependencies**: TG-2

### Description
Set up scheduling and monitoring for the automated reminder system.

### Tasks

- [ ] **TG-4.1**: Configure scheduling (1 point)
  - Set up pg_cron job OR Vercel cron
  - Schedule for 08:00 SAST (06:00 UTC)
  - Test trigger mechanism

- [ ] **TG-4.2**: Set up monitoring (1 point)
  - Add logging for reminder runs
  - Create alert for high failure rate
  - Document runbook for troubleshooting

### Scheduling Options

**Option A: pg_cron (Recommended)**
```sql
-- Enable pg_cron extension (Supabase Pro)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily reminder job at 06:00 UTC (08:00 SAST)
SELECT cron.schedule(
  'invoice-reminder-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://agyjovdugmtopasyvlng.supabase.co/functions/v1/invoice-reminder',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

**Option B: Vercel Cron**
```json
// vercel.json addition
{
  "crons": [{
    "path": "/api/cron/invoice-reminders",
    "schedule": "0 6 * * *"
  }]
}
```

### Monitoring Checklist

- [ ] Edge Function logs visible in Supabase dashboard
- [ ] Failed reminders visible in invoice_audit_log
- [ ] Admin can view reminder status in billing dashboard
- [ ] Alert configured for > 10% failure rate

### Acceptance Criteria

- [ ] Scheduler runs daily at correct time
- [ ] Logs capture success/failure metrics
- [ ] Runbook documented for support team

---

## Implementation Order

```
Week 1:
├── TG-1: Database Changes (Day 1)
│   └── Migration, index, RLS
├── TG-2: Backend Implementation (Days 2-4)
│   ├── InvoiceReminderService
│   ├── Email template
│   ├── Edge Function
│   └── Admin API
└── TG-3: Testing (Day 5)
    └── Unit and integration tests

Week 2:
├── TG-4: Ops & Scheduling (Day 1)
│   └── Cron setup, monitoring
├── Staging Testing (Days 2-3)
└── Production Rollout (Days 4-5)
```

---

## Rollback Plan

1. **Disable Scheduler**
   ```sql
   SELECT cron.unschedule('invoice-reminder-daily');
   ```

2. **Revert Migration**
   ```sql
   ALTER TABLE public.customer_invoices
     DROP COLUMN IF EXISTS reminder_sent_at,
     DROP COLUMN IF EXISTS reminder_count,
     DROP COLUMN IF EXISTS reminder_error;

   DROP INDEX IF EXISTS idx_customer_invoices_reminder_pending;
   ```

3. **Remove Edge Function**
   - Delete from Supabase Dashboard → Edge Functions

4. **Revert Code**
   - Git revert the merge commit
