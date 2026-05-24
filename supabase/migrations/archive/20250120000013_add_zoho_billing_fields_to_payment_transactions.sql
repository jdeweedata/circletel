-- =============================================================================
-- ZOHO Billing Integration - Phase 1: Payment Sync Fields
-- =============================================================================
-- Description: Add ZOHO Billing sync fields to payment_transactions table
-- Version: 1.0
-- Created: 2025-01-20
-- =============================================================================

-- Add ZOHO Billing fields to payment_transactions table
ALTER TABLE public.payment_transactions
  ADD COLUMN IF NOT EXISTS zoho_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS zoho_sync_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS zoho_last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS zoho_last_sync_error TEXT;

-- Add check constraint for sync status
ALTER TABLE public.payment_transactions
  ADD CONSTRAINT payment_transactions_zoho_sync_status_check
  CHECK (zoho_sync_status IS NULL OR zoho_sync_status IN (
    'pending', 'syncing', 'synced', 'failed', 'retrying'
  ));

-- Create index for ZOHO Payment ID lookups (performance)
CREATE INDEX IF NOT EXISTS idx_payment_transactions_zoho_payment_id
  ON public.payment_transactions(zoho_payment_id)
  WHERE zoho_payment_id IS NOT NULL;

-- Create index for finding failed syncs
CREATE INDEX IF NOT EXISTS idx_payment_transactions_zoho_sync_status
  ON public.payment_transactions(zoho_sync_status)
  WHERE zoho_sync_status = 'failed';

-- Create composite index for completed payments needing sync
CREATE INDEX IF NOT EXISTS idx_payment_transactions_pending_sync
  ON public.payment_transactions(status, zoho_sync_status, processed_at)
  WHERE status = 'completed' AND zoho_sync_status = 'pending';

-- Comments
COMMENT ON COLUMN public.payment_transactions.zoho_payment_id IS
'ZOHO Billing Payment ID. Links CircleTel payment to ZOHO. Used to mark ZOHO invoices as paid and for reconciliation.';

COMMENT ON COLUMN public.payment_transactions.zoho_sync_status IS
'Payment sync status: pending (not synced), syncing (in progress), synced (success), failed (permanent), retrying (temporary failure)';

COMMENT ON COLUMN public.payment_transactions.zoho_last_synced_at IS
'Timestamp of last successful sync to ZOHO Billing';

COMMENT ON COLUMN public.payment_transactions.zoho_last_sync_error IS
'Last error message if payment sync failed. Contains API error details for debugging.';

-- =============================================================================
-- Migration Complete - Phase 1 Done
-- =============================================================================
-- All 4 database migrations complete:
-- ✅ customers - ZOHO Billing Customer tracking
-- ✅ customer_services - ZOHO Billing Subscription tracking
-- ✅ customer_invoices - ZOHO Billing Invoice tracking
-- ✅ payment_transactions - ZOHO Billing Payment tracking
--
-- Next Phase: Implement sync services in lib/integrations/zoho/
-- =============================================================================
