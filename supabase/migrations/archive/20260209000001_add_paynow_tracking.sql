/**
 * Migration: Add Pay Now Tracking to Customer Invoices
 *
 * Purpose: Enable automated billing workflow where non-eMandate customers
 * receive Pay Now payment links on billing due date.
 *
 * Changes:
 * 1. Add Pay Now tracking columns to customer_invoices
 * 2. Add customer_invoice_id FK to payment_transactions
 * 3. Create index for efficient webhook lookups
 *
 * Related: BILLING-001 Automated Billing Workflow
 * Author: Claude Code
 * Date: 2026-02-09
 */

-- ============================================================================
-- PHASE 1: Add Pay Now tracking columns to customer_invoices
-- ============================================================================

-- Pay Now URL generated for this invoice
ALTER TABLE customer_invoices
  ADD COLUMN IF NOT EXISTS paynow_url TEXT;

COMMENT ON COLUMN customer_invoices.paynow_url IS
  'NetCash Pay Now payment URL for this invoice';

-- Transaction reference for webhook reconciliation
ALTER TABLE customer_invoices
  ADD COLUMN IF NOT EXISTS paynow_transaction_ref VARCHAR(100);

COMMENT ON COLUMN customer_invoices.paynow_transaction_ref IS
  'Unique transaction reference for Pay Now payment (used in webhook lookup)';

-- Timestamp when Pay Now link was sent
ALTER TABLE customer_invoices
  ADD COLUMN IF NOT EXISTS paynow_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN customer_invoices.paynow_sent_at IS
  'When the Pay Now link was sent to customer';

-- Channels used to send Pay Now link (email, sms)
ALTER TABLE customer_invoices
  ADD COLUMN IF NOT EXISTS paynow_sent_via TEXT[] DEFAULT '{}';

COMMENT ON COLUMN customer_invoices.paynow_sent_via IS
  'Notification channels used to send Pay Now link, e.g., ["email", "sms"]';

-- Payment collection method used for this invoice
ALTER TABLE customer_invoices
  ADD COLUMN IF NOT EXISTS payment_collection_method VARCHAR(50);

COMMENT ON COLUMN customer_invoices.payment_collection_method IS
  'How payment was collected: debit_order, paynow, card, eft, manual';

-- ============================================================================
-- PHASE 2: Create index for webhook lookups
-- ============================================================================

-- Index for efficient lookup by transaction reference (used in payment webhooks)
CREATE INDEX IF NOT EXISTS idx_customer_invoices_paynow_ref
  ON customer_invoices(paynow_transaction_ref)
  WHERE paynow_transaction_ref IS NOT NULL;

-- Index for finding invoices by due date and status (used in billing day cron)
CREATE INDEX IF NOT EXISTS idx_customer_invoices_due_unpaid
  ON customer_invoices(due_date, status)
  WHERE status IN ('unpaid', 'draft', 'partial');

-- ============================================================================
-- PHASE 3: Link payment_transactions to customer_invoices
-- ============================================================================

-- Add foreign key to link payments to invoices
ALTER TABLE payment_transactions
  ADD COLUMN IF NOT EXISTS customer_invoice_id UUID
  REFERENCES customer_invoices(id) ON DELETE SET NULL;

COMMENT ON COLUMN payment_transactions.customer_invoice_id IS
  'Link to the customer invoice this payment is for';

-- Index for looking up payments by invoice
CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice
  ON payment_transactions(customer_invoice_id)
  WHERE customer_invoice_id IS NOT NULL;

-- ============================================================================
-- PHASE 4: Add tracking for failed debit orders
-- ============================================================================

-- Track debit order failure status for automatic Pay Now fallback
ALTER TABLE customer_invoices
  ADD COLUMN IF NOT EXISTS debit_order_failed_at TIMESTAMPTZ;

COMMENT ON COLUMN customer_invoices.debit_order_failed_at IS
  'Timestamp when debit order collection failed (triggers Pay Now fallback)';

ALTER TABLE customer_invoices
  ADD COLUMN IF NOT EXISTS debit_order_failure_reason TEXT;

COMMENT ON COLUMN customer_invoices.debit_order_failure_reason IS
  'Reason for debit order failure, e.g., insufficient_funds, account_closed';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify columns were added
DO $$
BEGIN
  -- Check customer_invoices columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_invoices' AND column_name = 'paynow_url'
  ) THEN
    RAISE EXCEPTION 'Migration failed: paynow_url column not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_invoices' AND column_name = 'paynow_transaction_ref'
  ) THEN
    RAISE EXCEPTION 'Migration failed: paynow_transaction_ref column not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_transactions' AND column_name = 'customer_invoice_id'
  ) THEN
    RAISE EXCEPTION 'Migration failed: customer_invoice_id column not created';
  END IF;

  RAISE NOTICE 'Migration 20260209000001_add_paynow_tracking completed successfully';
END $$;
