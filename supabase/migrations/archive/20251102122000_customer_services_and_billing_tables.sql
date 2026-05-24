-- =============================================================================
-- Customer Dashboard Production Readiness - Phase 1: Services & Billing
-- Task Group 1.3: Customer Services and Billing Tables
-- =============================================================================
-- Description: Create customer_services and customer_billing tables with RLS
-- Version: 1.0
-- Created: 2025-11-02
-- =============================================================================

-- =============================================================================
-- 1. Create customer_services Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.customer_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    
    -- Service Details
    service_type VARCHAR(50) NOT NULL, -- fibre, lte, 5g, wireless
    package_id UUID REFERENCES public.service_packages(id) ON DELETE SET NULL,
    package_name VARCHAR(200) NOT NULL,
    speed_download VARCHAR(50), -- e.g., "100Mbps"
    speed_upload VARCHAR(50), -- e.g., "50Mbps"
    data_cap VARCHAR(50), -- e.g., "Unlimited", "500GB"
    
    -- Installation Information
    installation_address TEXT NOT NULL,
    installation_suburb VARCHAR(100),
    installation_city VARCHAR(100),
    installation_province VARCHAR(100),
    installation_postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    connection_id VARCHAR(100) UNIQUE, -- Provider connection ID (e.g., Interstellio)
    
    -- Pricing
    monthly_price DECIMAL(10, 2) NOT NULL,
    installation_fee DECIMAL(10, 2) DEFAULT 0.00,
    router_fee DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Billing
    billing_date INTEGER NOT NULL, -- Day of month: 1, 5, 25, or 30
    next_billing_date DATE,
    last_billing_date DATE,
    
    -- Service Lifecycle
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    activation_date DATE,
    suspension_date DATE,
    cancellation_date DATE,
    cancellation_reason TEXT,
    
    -- Provider Information
    provider_name VARCHAR(100), -- MTN, Vodacom, Vumatel, etc.
    provider_order_id VARCHAR(100),
    
    -- Router/Equipment
    router_model VARCHAR(100),
    router_serial VARCHAR(100),
    router_included BOOLEAN DEFAULT false,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Check constraints
ALTER TABLE public.customer_services
    ADD CONSTRAINT customer_services_status_check
    CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),
    
    ADD CONSTRAINT customer_services_service_type_check
    CHECK (service_type IN ('fibre', 'lte', '5g', 'wireless', 'cpe')),
    
    ADD CONSTRAINT customer_services_billing_date_check
    CHECK (billing_date IN (1, 5, 25, 30)),
    
    ADD CONSTRAINT customer_services_monthly_price_check
    CHECK (monthly_price >= 0),
    
    ADD CONSTRAINT customer_services_installation_fee_check
    CHECK (installation_fee >= 0),
    
    ADD CONSTRAINT customer_services_router_fee_check
    CHECK (router_fee >= 0);

-- Indexes for performance
CREATE INDEX idx_customer_services_customer_id 
ON public.customer_services(customer_id);

CREATE INDEX idx_customer_services_status 
ON public.customer_services(status);

CREATE INDEX idx_customer_services_connection_id 
ON public.customer_services(connection_id) WHERE connection_id IS NOT NULL;

CREATE INDEX idx_customer_services_billing_date 
ON public.customer_services(billing_date) WHERE status = 'active';

CREATE INDEX idx_customer_services_next_billing_date 
ON public.customer_services(next_billing_date) WHERE status = 'active' AND next_billing_date IS NOT NULL;

CREATE INDEX idx_customer_services_activation_date 
ON public.customer_services(activation_date) WHERE activation_date IS NOT NULL;

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_customer_services_updated_at
    BEFORE UPDATE ON public.customer_services
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.customer_services IS 
'Stores active and historical customer services with lifecycle tracking';

COMMENT ON COLUMN public.customer_services.connection_id IS 
'External provider connection ID (e.g., Interstellio subscriber ID)';

COMMENT ON COLUMN public.customer_services.billing_date IS 
'Day of month for recurring billing (1, 5, 25, or 30 only)';

COMMENT ON COLUMN public.customer_services.status IS 
'Service status: pending (not activated), active (live), suspended (temporarily disabled), cancelled (terminated)';

-- =============================================================================
-- 2. Create customer_billing Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.customer_billing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL UNIQUE REFERENCES public.customers(id) ON DELETE CASCADE,
    
    -- Balance Tracking
    account_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Negative = owed, Positive = credit
    credit_limit DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Payment Method (Primary)
    primary_payment_method_id UUID, -- FK added later when payment_methods table created
    payment_method_type VARCHAR(50), -- debit_order, card, eft
    payment_method_details JSONB, -- Encrypted/masked details
    
    -- Billing Preferences
    preferred_billing_date INTEGER DEFAULT 1, -- Day of month: 1, 5, 25, or 30
    auto_pay_enabled BOOLEAN DEFAULT false,
    paper_billing_enabled BOOLEAN DEFAULT false,
    email_invoices_enabled BOOLEAN DEFAULT true,
    sms_notifications_enabled BOOLEAN DEFAULT true,
    
    -- Communication Preferences
    billing_email VARCHAR(255),
    billing_phone VARCHAR(20),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Check constraints
ALTER TABLE public.customer_billing
    ADD CONSTRAINT customer_billing_preferred_billing_date_check
    CHECK (preferred_billing_date IN (1, 5, 25, 30)),
    
    ADD CONSTRAINT customer_billing_payment_method_type_check
    CHECK (payment_method_type IS NULL OR payment_method_type IN ('debit_order', 'card', 'eft', 'cash'));

-- Indexes for performance
CREATE INDEX idx_customer_billing_customer_id 
ON public.customer_billing(customer_id);

CREATE INDEX idx_customer_billing_account_balance 
ON public.customer_billing(account_balance) WHERE account_balance < 0;

CREATE INDEX idx_customer_billing_auto_pay 
ON public.customer_billing(auto_pay_enabled) WHERE auto_pay_enabled = true;

-- Updated timestamp trigger
CREATE TRIGGER trigger_customer_billing_updated_at
    BEFORE UPDATE ON public.customer_billing
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.customer_billing IS 
'Stores customer billing configuration and balance tracking (one-to-one with customers)';

COMMENT ON COLUMN public.customer_billing.account_balance IS 
'Current account balance: negative = customer owes money, positive = customer has credit';

COMMENT ON COLUMN public.customer_billing.preferred_billing_date IS 
'Customer-selected billing date (1, 5, 25, or 30 of each month)';

COMMENT ON COLUMN public.customer_billing.auto_pay_enabled IS 
'Whether automatic payment processing is enabled for recurring invoices';

-- =============================================================================
-- 3. Automatic customer_billing Record Creation
-- =============================================================================

-- Function to create billing record when customer is created
CREATE OR REPLACE FUNCTION public.create_customer_billing_record()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.customer_billing (
        customer_id,
        preferred_billing_date,
        email_invoices_enabled,
        sms_notifications_enabled
    )
    VALUES (
        NEW.id,
        1, -- Default to 1st of month
        true, -- Enable email invoices by default
        true -- Enable SMS notifications by default
    )
    ON CONFLICT (customer_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_customer_billing_record
    AFTER INSERT ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.create_customer_billing_record();

COMMENT ON FUNCTION public.create_customer_billing_record() IS 
'Automatically creates a customer_billing record when a new customer is created';

-- =============================================================================
-- 4. RLS Policies for customer_services
-- =============================================================================

-- Enable RLS
ALTER TABLE public.customer_services ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can view their own services
CREATE POLICY "Customers can view own services"
    ON public.customer_services
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    );

-- Policy: Customers can insert their own services (for self-service orders)
CREATE POLICY "Customers can create own services"
    ON public.customer_services
    FOR INSERT
    TO authenticated
    WITH CHECK (
        customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    );

-- Policy: Service role has full access (admin operations)
CREATE POLICY "Service role has full access to services"
    ON public.customer_services
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- 5. RLS Policies for customer_billing
-- =============================================================================

-- Enable RLS
ALTER TABLE public.customer_billing ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can view their own billing info
CREATE POLICY "Customers can view own billing"
    ON public.customer_billing
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    );

-- Policy: Customers can update their own billing preferences
CREATE POLICY "Customers can update own billing preferences"
    ON public.customer_billing
    FOR UPDATE
    TO authenticated
    USING (
        customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    );

-- Policy: Service role has full access (admin operations)
CREATE POLICY "Service role has full access to billing"
    ON public.customer_billing
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- 6. Grant Permissions
-- =============================================================================

GRANT SELECT, INSERT, UPDATE ON public.customer_services TO authenticated, service_role;
GRANT DELETE ON public.customer_services TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.customer_billing TO authenticated, service_role;
GRANT DELETE ON public.customer_billing TO service_role;

-- =============================================================================
-- Migration Complete
-- =============================================================================
-- Next Steps:
-- 1. Create customer_invoices, payment_methods, payment_transactions (Task 1.4)
-- 2. Create usage_history, service_action_log tables (Task 1.5)
-- 3. Implement billing service and invoice generation (Phase 2)
-- =============================================================================
