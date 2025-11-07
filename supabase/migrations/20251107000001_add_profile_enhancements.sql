-- =============================================================================
-- Profile Screen Enhancements - Address Management & Preferences
-- =============================================================================
-- Description: Add service addresses, physical addresses (RICA/FICA),
--              and customer preferences to support comprehensive profile management
-- Version: 1.0
-- Created: 2025-11-07
-- =============================================================================

-- =============================================================================
-- 1. Add Preference Fields to customers Table
-- =============================================================================

ALTER TABLE public.customers
    ADD COLUMN IF NOT EXISTS language_preference VARCHAR(10) DEFAULT 'en',
    ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(20) DEFAULT 'email',
    ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Africa/Johannesburg';

-- Create index for language preference
CREATE INDEX IF NOT EXISTS idx_customers_language_preference
ON public.customers(language_preference);

-- Add CHECK constraint for language_preference (South African languages)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'customers_language_preference_check'
    ) THEN
        ALTER TABLE public.customers
        ADD CONSTRAINT customers_language_preference_check
        CHECK (language_preference IN ('en', 'af', 'zu', 'xh', 'st', 'tn', 'ss', 'nr', 've', 'ts', 'nd'));
    END IF;
END $$;

-- Add CHECK constraint for preferred_contact_method
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'customers_preferred_contact_method_check'
    ) THEN
        ALTER TABLE public.customers
        ADD CONSTRAINT customers_preferred_contact_method_check
        CHECK (preferred_contact_method IN ('email', 'phone', 'sms', 'whatsapp'));
    END IF;
END $$;

-- =============================================================================
-- 2. Create service_addresses Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.service_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Address Details
    location_name VARCHAR(100) NOT NULL, -- e.g., "Head Office", "Branch"
    service_type VARCHAR(50) NOT NULL, -- fibre, copper, voip, lte, etc.
    street_address TEXT NOT NULL,
    suburb VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    province VARCHAR(50) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,

    -- Installation Details
    installation_date DATE,
    installation_status VARCHAR(20) DEFAULT 'pending', -- pending, scheduled, active, inactive, cancelled

    -- Flags
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_addresses_customer_id
ON public.service_addresses(customer_id);

CREATE INDEX IF NOT EXISTS idx_service_addresses_auth_user_id
ON public.service_addresses(auth_user_id);

CREATE INDEX IF NOT EXISTS idx_service_addresses_is_primary
ON public.service_addresses(is_primary) WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_service_addresses_installation_status
ON public.service_addresses(installation_status);

-- Add CHECK constraint for service_type
ALTER TABLE public.service_addresses
ADD CONSTRAINT service_addresses_service_type_check
CHECK (service_type IN ('fibre', 'copper', 'voip', 'lte', 'wireless', 'satellite'));

-- Add CHECK constraint for installation_status
ALTER TABLE public.service_addresses
ADD CONSTRAINT service_addresses_installation_status_check
CHECK (installation_status IN ('pending', 'scheduled', 'active', 'inactive', 'cancelled', 'suspended'));

-- Add CHECK constraint for province (South African provinces)
ALTER TABLE public.service_addresses
ADD CONSTRAINT service_addresses_province_check
CHECK (province IN ('Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'));

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_addresses TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_addresses TO authenticated;

-- =============================================================================
-- 3. Create physical_addresses Table (RICA & FICA Compliance)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.physical_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Address Type
    address_type VARCHAR(20) NOT NULL, -- mailing, billing, both

    -- Mailing Address
    mailing_street_address TEXT,
    mailing_suburb VARCHAR(100),
    mailing_city VARCHAR(100),
    mailing_province VARCHAR(50),
    mailing_postal_code VARCHAR(10),

    -- Billing Address (if different)
    billing_same_as_mailing BOOLEAN DEFAULT true,
    billing_street_address TEXT,
    billing_suburb VARCHAR(100),
    billing_city VARCHAR(100),
    billing_province VARCHAR(50),
    billing_postal_code VARCHAR(10),

    -- RICA Compliance (Regulation of Interception of Communications Act)
    id_number VARCHAR(20), -- SA ID or Passport
    id_type VARCHAR(20), -- sa_id, passport, asylum

    -- FICA Compliance (Financial Intelligence Centre Act)
    business_registration_number VARCHAR(50), -- For business accounts
    tax_reference_number VARCHAR(20), -- SARS TRN
    fica_status VARCHAR(20) DEFAULT 'pending', -- pending, verified, rejected, expired
    fica_verified_at TIMESTAMPTZ,
    fica_verified_by UUID REFERENCES auth.users(id),
    fica_expiry_date DATE,

    -- Flags
    is_primary BOOLEAN DEFAULT false,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_physical_addresses_customer_id
ON public.physical_addresses(customer_id);

CREATE INDEX IF NOT EXISTS idx_physical_addresses_auth_user_id
ON public.physical_addresses(auth_user_id);

CREATE INDEX IF NOT EXISTS idx_physical_addresses_is_primary
ON public.physical_addresses(is_primary) WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_physical_addresses_fica_status
ON public.physical_addresses(fica_status);

CREATE INDEX IF NOT EXISTS idx_physical_addresses_id_number
ON public.physical_addresses(id_number);

-- Add CHECK constraint for address_type
ALTER TABLE public.physical_addresses
ADD CONSTRAINT physical_addresses_address_type_check
CHECK (address_type IN ('mailing', 'billing', 'both'));

-- Add CHECK constraint for id_type
ALTER TABLE public.physical_addresses
ADD CONSTRAINT physical_addresses_id_type_check
CHECK (id_type IN ('sa_id', 'passport', 'asylum_seeker', 'refugee'));

-- Add CHECK constraint for fica_status
ALTER TABLE public.physical_addresses
ADD CONSTRAINT physical_addresses_fica_status_check
CHECK (fica_status IN ('pending', 'verified', 'rejected', 'expired', 'under_review'));

-- Add CHECK constraint for provinces
ALTER TABLE public.physical_addresses
ADD CONSTRAINT physical_addresses_mailing_province_check
CHECK (mailing_province IN ('Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'));

ALTER TABLE public.physical_addresses
ADD CONSTRAINT physical_addresses_billing_province_check
CHECK (billing_province IN ('Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'));

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.physical_addresses TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.physical_addresses TO authenticated;

-- =============================================================================
-- 4. Create Trigger to Update updated_at
-- =============================================================================

-- Create or replace the update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create triggers for service_addresses
DROP TRIGGER IF EXISTS trigger_update_service_addresses_updated_at ON public.service_addresses;
CREATE TRIGGER trigger_update_service_addresses_updated_at
    BEFORE UPDATE ON public.service_addresses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Create triggers for physical_addresses
DROP TRIGGER IF EXISTS trigger_update_physical_addresses_updated_at ON public.physical_addresses;
CREATE TRIGGER trigger_update_physical_addresses_updated_at
    BEFORE UPDATE ON public.physical_addresses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- =============================================================================
-- 5. RLS Policies for service_addresses
-- =============================================================================

ALTER TABLE public.service_addresses ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can view their own service addresses
CREATE POLICY "Customers can view own service addresses"
    ON public.service_addresses
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = auth_user_id
        OR
        customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
    );

-- Policy: Customers can insert their own service addresses
CREATE POLICY "Customers can insert own service addresses"
    ON public.service_addresses
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = auth_user_id
        OR
        customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
    );

-- Policy: Customers can update their own service addresses
CREATE POLICY "Customers can update own service addresses"
    ON public.service_addresses
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = auth_user_id
        OR
        customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
    )
    WITH CHECK (
        auth.uid() = auth_user_id
        OR
        customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
    );

-- Policy: Customers can delete their own service addresses
CREATE POLICY "Customers can delete own service addresses"
    ON public.service_addresses
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = auth_user_id
        OR
        customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
    );

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to service_addresses"
    ON public.service_addresses
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- 6. RLS Policies for physical_addresses
-- =============================================================================

ALTER TABLE public.physical_addresses ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can view their own physical addresses
CREATE POLICY "Customers can view own physical addresses"
    ON public.physical_addresses
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = auth_user_id
        OR
        customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
    );

-- Policy: Customers can insert their own physical addresses
CREATE POLICY "Customers can insert own physical addresses"
    ON public.physical_addresses
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = auth_user_id
        OR
        customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
    );

-- Policy: Customers can update their own physical addresses
CREATE POLICY "Customers can update own physical addresses"
    ON public.physical_addresses
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = auth_user_id
        OR
        customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
    )
    WITH CHECK (
        auth.uid() = auth_user_id
        OR
        customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
    );

-- Policy: Customers can delete their own physical addresses
CREATE POLICY "Customers can delete own physical addresses"
    ON public.physical_addresses
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = auth_user_id
        OR
        customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
    );

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to physical_addresses"
    ON public.physical_addresses
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- 7. Comments for Documentation
-- =============================================================================

COMMENT ON TABLE public.service_addresses IS
'Stores customer service installation addresses (e.g., fibre, copper, VOIP installations)';

COMMENT ON TABLE public.physical_addresses IS
'Stores customer physical addresses for billing and RICA/FICA compliance';

COMMENT ON COLUMN public.customers.language_preference IS
'Customer preferred language (ISO 639-1 codes for South African languages)';

COMMENT ON COLUMN public.customers.preferred_contact_method IS
'Customer preferred contact method: email, phone, sms, whatsapp';

COMMENT ON COLUMN public.service_addresses.location_name IS
'Friendly name for the service location (e.g., "Head Office", "Warehouse")';

COMMENT ON COLUMN public.service_addresses.service_type IS
'Type of service at this address: fibre, copper, voip, lte, wireless, satellite';

COMMENT ON COLUMN public.physical_addresses.fica_status IS
'FICA verification status for compliance with Financial Intelligence Centre Act';

COMMENT ON COLUMN public.physical_addresses.id_number IS
'SA ID number or passport number for RICA compliance';

-- =============================================================================
-- Migration Complete
-- =============================================================================
-- This migration adds:
-- 1. Customer preference fields (language, contact method)
-- 2. service_addresses table for tracking service installations
-- 3. physical_addresses table for RICA/FICA compliance
-- 4. Full RLS policies for security
-- =============================================================================
