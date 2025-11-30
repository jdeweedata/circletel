-- =============================================================================
-- Invoice Reminder Tracking Migration
-- =============================================================================
-- Description: Adds columns to track invoice reminder emails sent to customers
--              5 calendar days before payment due date
-- Spec ID: 20251130-invoice-email-reminder
-- Created: 2025-11-30
-- =============================================================================

-- =============================================================================
-- 1. Add Reminder Tracking Columns to customer_invoices
-- =============================================================================

ALTER TABLE public.customer_invoices
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reminder_error TEXT;

-- Add column comments for documentation
COMMENT ON COLUMN public.customer_invoices.reminder_sent_at IS
  'Timestamp when payment reminder email was sent (5 days before due date)';

COMMENT ON COLUMN public.customer_invoices.reminder_count IS
  'Number of reminder emails sent for this invoice (prevents duplicates)';

COMMENT ON COLUMN public.customer_invoices.reminder_error IS
  'Last error message if reminder email failed to send';

-- =============================================================================
-- 2. Create Optimized Index for Reminder Queries
-- =============================================================================
-- This partial index speeds up the daily query to find invoices needing reminders:
-- SELECT * FROM customer_invoices
-- WHERE status = 'sent' AND due_date = CURRENT_DATE + 5 AND reminder_sent_at IS NULL

CREATE INDEX IF NOT EXISTS idx_customer_invoices_reminder_pending
  ON public.customer_invoices(due_date)
  WHERE status = 'sent' AND reminder_sent_at IS NULL;

-- =============================================================================
-- 3. Add Reminder Actions to Audit Log
-- =============================================================================
-- The invoice_audit_log table already exists from the compliant billing migration.
-- We'll use action values: 'reminder_sent', 'reminder_failed' for tracking.

-- No schema changes needed - just documenting the action values we'll use:
-- - 'reminder_sent': Successful reminder email sent
-- - 'reminder_failed': Reminder email failed to send

-- =============================================================================
-- Migration Complete
-- =============================================================================
-- Next Steps:
-- 1. Create InvoiceReminderService (lib/billing/invoice-reminder-service.ts)
-- 2. Add email template to notification-service.ts
-- 3. Create Edge Function (supabase/functions/invoice-reminder/)
-- 4. Create Admin API endpoint (/api/admin/billing/send-reminders)
-- =============================================================================
