-- Migration: Add SMS reminder fields to customer_invoices
-- Date: 2025-12-03
-- Description: Adds fields to track SMS payment reminders sent via Clickatell

-- Add SMS reminder tracking columns to customer_invoices
ALTER TABLE customer_invoices
ADD COLUMN IF NOT EXISTS sms_reminder_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sms_reminder_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sms_reminder_error TEXT;

-- Add index for efficient querying of invoices needing SMS reminders
CREATE INDEX IF NOT EXISTS idx_customer_invoices_sms_reminder
ON customer_invoices (status, due_date, sms_reminder_count, sms_reminder_sent_at)
WHERE status IN ('overdue', 'unpaid', 'partial');

-- Add comment for documentation
COMMENT ON COLUMN customer_invoices.sms_reminder_sent_at IS 'Timestamp of last SMS reminder sent via Clickatell';
COMMENT ON COLUMN customer_invoices.sms_reminder_count IS 'Number of SMS reminders sent (max 3)';
COMMENT ON COLUMN customer_invoices.sms_reminder_error IS 'Last SMS sending error message if any';

-- Grant permissions
GRANT SELECT, UPDATE ON customer_invoices TO authenticated;
GRANT SELECT, UPDATE ON customer_invoices TO service_role;
