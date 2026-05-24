-- =============================================================================
-- Add Residential Address Fields to Consumer Orders
-- =============================================================================
-- Purpose: Store customer's current/residential address from KYC verification
-- This is separate from installation address (where service will be installed)
-- Created: 2025-11-30
-- =============================================================================

-- Add residential address fields to consumer_orders table
ALTER TABLE public.consumer_orders
    ADD COLUMN IF NOT EXISTS residential_address TEXT,
    ADD COLUMN IF NOT EXISTS residential_suburb TEXT,
    ADD COLUMN IF NOT EXISTS residential_city TEXT,
    ADD COLUMN IF NOT EXISTS residential_province TEXT,
    ADD COLUMN IF NOT EXISTS residential_postal_code TEXT,
    ADD COLUMN IF NOT EXISTS kyc_address_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS kyc_address_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS kyc_address_verified_by UUID REFERENCES admin_users(id) ON DELETE SET NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.consumer_orders.residential_address IS 'Customer current residential address from KYC proof of residence';
COMMENT ON COLUMN public.consumer_orders.residential_suburb IS 'Suburb of residential address';
COMMENT ON COLUMN public.consumer_orders.residential_city IS 'City of residential address';
COMMENT ON COLUMN public.consumer_orders.residential_province IS 'Province of residential address';
COMMENT ON COLUMN public.consumer_orders.residential_postal_code IS 'Postal code of residential address';
COMMENT ON COLUMN public.consumer_orders.kyc_address_verified IS 'Whether the residential address has been verified via KYC';
COMMENT ON COLUMN public.consumer_orders.kyc_address_verified_at IS 'Timestamp when residential address was verified';
COMMENT ON COLUMN public.consumer_orders.kyc_address_verified_by IS 'Admin user who verified the residential address';

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
