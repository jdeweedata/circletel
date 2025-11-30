# Invoice Email Reminder Automation

**Spec ID**: 20251130-invoice-email-reminder
**Status**: Ready for Implementation
**Priority**: High
**Total Story Points**: 16

## Overview

Automate sending invoice emails to customers 5 calendar days before the payment due date. This ensures customers receive timely reminders and reduces late payments.

## Key Deliverables

- [ ] Edge Function for daily reminder processing
- [ ] Invoice due reminder email template
- [ ] Reminder tracking in database
- [ ] Admin API for manual triggering
- [ ] Audit logging for sent reminders

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/invoice-reminder/index.ts` | Edge Function for scheduled reminders |
| `app/api/admin/billing/send-reminders/route.ts` | Manual trigger endpoint |
| `lib/billing/invoice-reminder-service.ts` | Business logic service |
| `supabase/migrations/YYYYMMDD_invoice_reminder_tracking.sql` | Database changes |

## Files to Modify

| File | Changes |
|------|---------|
| `lib/notifications/notification-service.ts` | Add invoice_due_reminder template |
| `lib/billing/compliant-billing-service.ts` | Add reminder methods |

## Quick Start

```bash
# Review the full specification
cat agent-os/specs/20251130-invoice-email-reminder/SPEC.md

# Check task breakdown
cat agent-os/specs/20251130-invoice-email-reminder/TASKS.md

# Track progress
cat agent-os/specs/20251130-invoice-email-reminder/PROGRESS.md
```

## Task Groups

1. **Database Engineer** (3 points) - Schema changes, RLS policies
2. **Backend Engineer** (8 points) - Edge Function, API route, service
3. **Frontend Engineer** (0 points) - No UI changes required
4. **Testing Engineer** (3 points) - Unit tests, integration tests
5. **Ops Engineer** (2 points) - Cron scheduling, monitoring

## Risk Level

**Medium** - Existing infrastructure is in place, but email timing and spam prevention need careful handling.
