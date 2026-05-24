-- =============================================================================
-- ZOHO Billing Integration - Phase 1: Customer Sync Fields
-- =============================================================================
-- Description: Add ZOHO Billing sync fields to customers table
-- Version: 1.0
-- Created: 2025-01-20
-- =============================================================================

-- Add ZOHO Billing fields to customers table
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS zoho_billing_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS zoho_sync_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS zoho_last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS zoho_last_sync_error TEXT;

-- Add check constraint for sync status
ALTER TABLE public.customers
  ADD CONSTRAINT customers_zoho_sync_status_check
  CHECK (zoho_sync_status IS NULL OR zoho_sync_status IN (
    'pending', 'syncing', 'synced', 'failed', 'retrying'
  ));

-- Create index for ZOHO ID lookups (performance)
CREATE INDEX IF NOT EXISTS idx_customers_zoho_billing_id
  ON public.customers(zoho_billing_customer_id)
  WHERE zoho_billing_customer_id IS NOT NULL;

-- Create index for finding failed syncs
CREATE INDEX IF NOT EXISTS idx_customers_zoho_sync_status
  ON public.customers(zoho_sync_status)
  WHERE zoho_sync_status = 'failed';

-- Comments
COMMENT ON COLUMN public.customers.zoho_billing_customer_id IS
'ZOHO Billing Contact ID for this customer. Used for linking CircleTel customer to ZOHO Billing.';

COMMENT ON COLUMN public.customers.zoho_sync_status IS
'Sync status: pending (not synced), syncing (in progress), synced (success), failed (permanent), retrying (temporary failure)';

COMMENT ON COLUMN public.customers.zoho_last_synced_at IS
'Timestamp of last successful sync to ZOHO Billing';

COMMENT ON COLUMN public.customers.zoho_last_sync_error IS
'Last error message if sync failed. Used for debugging and admin dashboard.';

-- =============================================================================
-- Migration Complete
-- =============================================================================
-- Next: Run migration 20250120000011 for customer_services table
-- =============================================================================
