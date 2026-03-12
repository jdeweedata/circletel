-- Migration: Add Zoho Books sync tracking columns
-- Purpose: Support automated sync to Zoho Books (accounting) instead of Zoho Billing
--
-- Key change: CircleTel is the billing system, Zoho Books is for accounting only
--
-- Tables affected:
-- - customers: zoho_books_contact_id, retry tracking
-- - customer_invoices: zoho_books_invoice_id, retry tracking
-- - payment_transactions: zoho_books_payment_id, retry tracking

-- ============================================================================
-- Customers Table
-- ============================================================================

-- Add Zoho Books contact ID (separate from Billing customer ID)
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS zoho_books_contact_id TEXT;

-- Add retry tracking columns
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS zoho_books_retry_count INTEGER DEFAULT 0;

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS zoho_books_next_retry_at TIMESTAMPTZ;

-- Create index for retry queries
CREATE INDEX IF NOT EXISTS idx_customers_zoho_books_retry
ON customers (zoho_books_next_retry_at)
WHERE zoho_sync_status = 'failed' AND zoho_books_retry_count < 5;

COMMENT ON COLUMN customers.zoho_books_contact_id IS 'Zoho Books contact ID (for accounting sync)';
COMMENT ON COLUMN customers.zoho_books_retry_count IS 'Number of sync retry attempts';
COMMENT ON COLUMN customers.zoho_books_next_retry_at IS 'Next scheduled retry time (exponential backoff)';

-- ============================================================================
-- Customer Invoices Table
-- ============================================================================

-- Add Zoho Books invoice ID (separate from Billing invoice ID)
ALTER TABLE customer_invoices
ADD COLUMN IF NOT EXISTS zoho_books_invoice_id TEXT;

-- Add retry tracking columns
ALTER TABLE customer_invoices
ADD COLUMN IF NOT EXISTS zoho_books_retry_count INTEGER DEFAULT 0;

ALTER TABLE customer_invoices
ADD COLUMN IF NOT EXISTS zoho_books_next_retry_at TIMESTAMPTZ;

-- Create index for retry queries
CREATE INDEX IF NOT EXISTS idx_invoices_zoho_books_retry
ON customer_invoices (zoho_books_next_retry_at)
WHERE zoho_sync_status = 'failed' AND zoho_books_retry_count < 5;

-- Create index for pending sync queries (ALL invoice types now sync)
CREATE INDEX IF NOT EXISTS idx_invoices_zoho_books_pending
ON customer_invoices (created_at)
WHERE zoho_books_invoice_id IS NULL AND zoho_sync_status = 'pending';

COMMENT ON COLUMN customer_invoices.zoho_books_invoice_id IS 'Zoho Books invoice ID (for accounting sync)';
COMMENT ON COLUMN customer_invoices.zoho_books_retry_count IS 'Number of sync retry attempts';
COMMENT ON COLUMN customer_invoices.zoho_books_next_retry_at IS 'Next scheduled retry time (exponential backoff)';

-- ============================================================================
-- Payment Transactions Table
-- ============================================================================

-- Add Zoho Books payment ID (separate from existing zoho_payment_id)
ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS zoho_books_payment_id TEXT;

-- Add retry tracking columns
ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS zoho_books_retry_count INTEGER DEFAULT 0;

ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS zoho_books_next_retry_at TIMESTAMPTZ;

-- Create index for retry queries
CREATE INDEX IF NOT EXISTS idx_payments_zoho_books_retry
ON payment_transactions (zoho_books_next_retry_at)
WHERE zoho_sync_status = 'failed' AND zoho_books_retry_count < 5;

-- Create index for pending sync queries (use completed_at column)
CREATE INDEX IF NOT EXISTS idx_payments_zoho_books_pending
ON payment_transactions (completed_at)
WHERE zoho_books_payment_id IS NULL
  AND zoho_sync_status = 'pending'
  AND status = 'completed';

COMMENT ON COLUMN payment_transactions.zoho_books_payment_id IS 'Zoho Books payment ID (for accounting sync)';
COMMENT ON COLUMN payment_transactions.zoho_books_retry_count IS 'Number of sync retry attempts';
COMMENT ON COLUMN payment_transactions.zoho_books_next_retry_at IS 'Next scheduled retry time (exponential backoff)';

-- ============================================================================
-- Helper function for exponential backoff calculation
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_zoho_books_next_retry(retry_count INTEGER)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  -- Exponential backoff: 5min, 15min, 1hr, 4hr, 24hr
  RETURN NOW() + CASE retry_count
    WHEN 0 THEN INTERVAL '5 minutes'
    WHEN 1 THEN INTERVAL '15 minutes'
    WHEN 2 THEN INTERVAL '1 hour'
    WHEN 3 THEN INTERVAL '4 hours'
    WHEN 4 THEN INTERVAL '24 hours'
    ELSE INTERVAL '24 hours'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_zoho_books_next_retry IS 'Calculate next retry time using exponential backoff';
