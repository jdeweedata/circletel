-- =============================================================================
-- ZOHO Billing Integration - Phase 1: Subscription Sync Fields
-- =============================================================================
-- Description: Add ZOHO Billing sync fields to customer_services table
-- Version: 1.0
-- Created: 2025-01-20
-- =============================================================================

-- Add ZOHO Billing fields to customer_services table
ALTER TABLE public.customer_services
  ADD COLUMN IF NOT EXISTS zoho_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS zoho_sync_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS zoho_last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS zoho_last_sync_error TEXT;

-- Add check constraint for sync status
ALTER TABLE public.customer_services
  ADD CONSTRAINT customer_services_zoho_sync_status_check
  CHECK (zoho_sync_status IS NULL OR zoho_sync_status IN (
    'pending', 'syncing', 'synced', 'failed', 'retrying'
  ));

-- Create index for ZOHO Subscription ID lookups (performance)
CREATE INDEX IF NOT EXISTS idx_customer_services_zoho_subscription_id
  ON public.customer_services(zoho_subscription_id)
  WHERE zoho_subscription_id IS NOT NULL;

-- Create index for finding failed syncs
CREATE INDEX IF NOT EXISTS idx_customer_services_zoho_sync_status
  ON public.customer_services(zoho_sync_status)
  WHERE zoho_sync_status = 'failed';

-- Create composite index for active services needing sync
CREATE INDEX IF NOT EXISTS idx_customer_services_active_pending_sync
  ON public.customer_services(status, zoho_sync_status)
  WHERE status = 'active' AND zoho_sync_status = 'pending';

-- Comments
COMMENT ON COLUMN public.customer_services.zoho_subscription_id IS
'ZOHO Billing Subscription ID. Links CircleTel service to ZOHO recurring subscription. ZOHO auto-generates monthly invoices from subscriptions.';

COMMENT ON COLUMN public.customer_services.zoho_sync_status IS
'Subscription sync status: pending (not synced), syncing (in progress), synced (success), failed (permanent), retrying (temporary failure)';

COMMENT ON COLUMN public.customer_services.zoho_last_synced_at IS
'Timestamp of last successful sync to ZOHO Billing';

COMMENT ON COLUMN public.customer_services.zoho_last_sync_error IS
'Last error message if subscription sync failed. Used for debugging and retry logic.';

-- =============================================================================
-- Migration Complete
-- =============================================================================
-- Next: Run migration 20250120000012 for customer_invoices table
-- =============================================================================
