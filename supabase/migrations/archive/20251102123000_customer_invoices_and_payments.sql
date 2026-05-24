-- =============================================================================
-- Customer Dashboard Production Readiness - Phase 1: Invoices & Payments
-- Task Group 1.4: Invoice and Payment Tables
-- =============================================================================
-- Description: Create customer_invoices, payment_methods, payment_transactions
--              with auto-numbering and VAT calculations
-- Version: 1.0
-- Created: 2025-11-02
-- =============================================================================

-- =============================================================================
-- 1. Create Invoice Auto-Numbering System
-- =============================================================================

-- Create invoice number sequence
CREATE SEQUENCE IF NOT EXISTS public.customer_invoice_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Grant usage on sequence
GRANT USAGE, SELECT ON SEQUENCE public.customer_invoice_number_seq TO service_role, authenticated;

-- Function to generate invoice number (INV-YYYY-NNNNN)
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_year INTEGER;
    next_number INTEGER;
    invoice_num TEXT;
BEGIN
    -- Get current year
    current_year := EXTRACT(YEAR FROM NOW());
    
    -- Get next sequence number
    next_number := nextval('public.customer_invoice_number_seq');
    
    -- Format: INV-YYYY-NNNNN (e.g., INV-2025-00001)
    invoice_num := 'INV-' || current_year || '-' || LPAD(next_number::TEXT, 5, '0');
    
    RETURN invoice_num;
END;
$$;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION public.generate_invoice_number() TO service_role;

-- =============================================================================
-- 2. Create customer_invoices Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.customer_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.customer_services(id) ON DELETE SET NULL,
    
    -- Invoice Dates
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    period_start DATE,
    period_end DATE,
    
    -- Amounts
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 15.00, -- South African VAT rate 15%
    vat_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    
    -- Computed column: amount_due (always current)
    amount_due DECIMAL(10, 2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    
    -- Line Items (JSONB array)
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Example structure:
    -- [
    --   {
    --     "description": "MTN Fibre 100Mbps - November 2025",
    --     "quantity": 1,
    --     "unit_price": 699.00,
    --     "amount": 699.00,
    --     "type": "recurring" | "installation" | "pro_rata" | "equipment" | "adjustment"
    --   }
    -- ]
    
    -- Invoice Type
    invoice_type VARCHAR(50) NOT NULL, -- recurring, installation, pro_rata, adjustment
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
    
    -- Payment Tracking
    paid_at TIMESTAMPTZ,
    payment_method VARCHAR(50), -- debit_order, card, eft, cash
    payment_reference VARCHAR(100),
    
    -- PDF Storage
    pdf_url TEXT, -- Supabase Storage signed URL
    pdf_generated_at TIMESTAMPTZ,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Check constraints
ALTER TABLE public.customer_invoices
    ADD CONSTRAINT customer_invoices_status_check
    CHECK (status IN ('unpaid', 'paid', 'partial', 'overdue', 'cancelled', 'refunded')),
    
    ADD CONSTRAINT customer_invoices_invoice_type_check
    CHECK (invoice_type IN ('recurring', 'installation', 'pro_rata', 'equipment', 'adjustment')),
    
    ADD CONSTRAINT customer_invoices_subtotal_check
    CHECK (subtotal >= 0),
    
    ADD CONSTRAINT customer_invoices_vat_rate_check
    CHECK (vat_rate >= 0 AND vat_rate <= 100),
    
    ADD CONSTRAINT customer_invoices_total_check
    CHECK (total_amount >= 0),
    
    ADD CONSTRAINT customer_invoices_amount_paid_check
    CHECK (amount_paid >= 0 AND amount_paid <= total_amount),
    
    ADD CONSTRAINT customer_invoices_due_date_check
    CHECK (due_date >= invoice_date);

-- Indexes for performance
CREATE INDEX idx_customer_invoices_customer_id 
ON public.customer_invoices(customer_id);

CREATE INDEX idx_customer_invoices_service_id 
ON public.customer_invoices(service_id) WHERE service_id IS NOT NULL;

CREATE INDEX idx_customer_invoices_status 
ON public.customer_invoices(status);

CREATE INDEX idx_customer_invoices_due_date 
ON public.customer_invoices(due_date) WHERE status IN ('unpaid', 'partial');

CREATE INDEX idx_customer_invoices_invoice_number 
ON public.customer_invoices(invoice_number);

CREATE INDEX idx_customer_invoices_invoice_date 
ON public.customer_invoices(invoice_date DESC);

-- Auto-generate invoice number trigger
CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := public.generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_invoice_number
    BEFORE INSERT ON public.customer_invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.set_invoice_number();

-- Updated timestamp trigger
CREATE TRIGGER trigger_customer_invoices_updated_at
    BEFORE UPDATE ON public.customer_invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.customer_invoices IS 
'Customer invoices with auto-numbering, VAT calculation, and computed amount_due';

COMMENT ON COLUMN public.customer_invoices.invoice_number IS 
'Unique invoice number in format INV-YYYY-NNNNN (e.g., INV-2025-00001)';

COMMENT ON COLUMN public.customer_invoices.amount_due IS 
'Computed column: total_amount - amount_paid (always current)';

COMMENT ON COLUMN public.customer_invoices.line_items IS 
'JSONB array of invoice line items with description, quantity, unit_price, amount, type';

-- =============================================================================
-- 3. Create customer_payment_methods Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.customer_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    
    -- Payment Method Type
    method_type VARCHAR(50) NOT NULL, -- debit_order, card, eft
    
    -- Display Info (Masked)
    display_name VARCHAR(100) NOT NULL, -- e.g., "Debit Order - FNB ***1234"
    last_four VARCHAR(4), -- Last 4 digits of account/card number
    
    -- Encrypted Full Details (JSONB)
    encrypted_details JSONB, -- Full bank account or card details (encrypted)
    -- Example for debit_order:
    -- {
    --   "bank_name": "First National Bank",
    --   "account_number": "encrypted_value",
    --   "account_type": "cheque" | "savings",
    --   "branch_code": "250655",
    --   "account_holder": "John Doe"
    -- }
    -- Example for card:
    -- {
    --   "card_number": "encrypted_value",
    --   "card_holder": "John Doe",
    --   "expiry_month": "12",
    --   "expiry_year": "2027",
    --   "card_type": "visa" | "mastercard"
    -- }
    
    -- NetCash eMandate Integration
    mandate_id VARCHAR(100) UNIQUE, -- NetCash mandate reference
    mandate_status VARCHAR(50), -- pending, active, cancelled, expired
    mandate_created_at TIMESTAMPTZ,
    mandate_approved_at TIMESTAMPTZ,
    max_debit_amount DECIMAL(10, 2), -- Maximum amount that can be debited
    
    -- Status
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ
);

-- Check constraints
ALTER TABLE public.customer_payment_methods
    ADD CONSTRAINT customer_payment_methods_method_type_check
    CHECK (method_type IN ('debit_order', 'card', 'eft')),
    
    ADD CONSTRAINT customer_payment_methods_mandate_status_check
    CHECK (mandate_status IS NULL OR mandate_status IN ('pending', 'active', 'cancelled', 'expired'));

-- Indexes for performance
CREATE INDEX idx_customer_payment_methods_customer_id 
ON public.customer_payment_methods(customer_id);

CREATE INDEX idx_customer_payment_methods_is_primary 
ON public.customer_payment_methods(customer_id, is_primary) WHERE is_primary = true;

CREATE INDEX idx_customer_payment_methods_mandate_id 
ON public.customer_payment_methods(mandate_id) WHERE mandate_id IS NOT NULL;

CREATE INDEX idx_customer_payment_methods_is_active 
ON public.customer_payment_methods(customer_id, is_active) WHERE is_active = true;

-- Unique constraint: Only one primary payment method per customer
CREATE UNIQUE INDEX idx_customer_payment_methods_one_primary_per_customer
    ON public.customer_payment_methods(customer_id)
    WHERE is_primary = true AND is_active = true;

-- Updated timestamp trigger
CREATE TRIGGER trigger_customer_payment_methods_updated_at
    BEFORE UPDATE ON public.customer_payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.customer_payment_methods IS 
'Stores customer payment methods with encrypted details and NetCash eMandate integration';

COMMENT ON COLUMN public.customer_payment_methods.display_name IS 
'Masked display name for UI (e.g., "Debit Order - FNB ***1234")';

COMMENT ON COLUMN public.customer_payment_methods.encrypted_details IS 
'Encrypted full payment details (account number, card number, etc.)';

COMMENT ON COLUMN public.customer_payment_methods.mandate_id IS 
'NetCash eMandate reference ID for debit order authorization';

COMMENT ON COLUMN public.customer_payment_methods.is_primary IS 
'Primary payment method used for auto-pay (only one per customer)';

-- =============================================================================
-- 4. Add FK to customer_billing for primary_payment_method_id
-- =============================================================================

ALTER TABLE public.customer_billing
    ADD CONSTRAINT fk_customer_billing_primary_payment_method
    FOREIGN KEY (primary_payment_method_id)
    REFERENCES public.customer_payment_methods(id)
    ON DELETE SET NULL;

-- =============================================================================
-- 5. Create payment_transactions Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id VARCHAR(100) UNIQUE NOT NULL, -- External transaction ID
    
    -- Relationships
    invoice_id UUID NOT NULL REFERENCES public.customer_invoices(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    payment_method_id UUID REFERENCES public.customer_payment_methods(id) ON DELETE SET NULL,
    
    -- Transaction Details
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ZAR',
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Payment Method
    payment_type VARCHAR(50) NOT NULL, -- debit_order, card, eft, cash
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    
    -- NetCash Integration
    netcash_reference VARCHAR(100),
    netcash_response JSONB, -- Full NetCash API response
    
    -- Processing
    processed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    refunded_at TIMESTAMPTZ,
    refund_reference VARCHAR(100),
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Check constraints
ALTER TABLE public.payment_transactions
    ADD CONSTRAINT payment_transactions_status_check
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
    
    ADD CONSTRAINT payment_transactions_payment_type_check
    CHECK (payment_type IN ('debit_order', 'card', 'eft', 'cash', 'other')),
    
    ADD CONSTRAINT payment_transactions_amount_check
    CHECK (amount > 0);

-- Indexes for performance
CREATE INDEX idx_payment_transactions_invoice_id 
ON public.payment_transactions(invoice_id);

CREATE INDEX idx_payment_transactions_customer_id 
ON public.payment_transactions(customer_id);

CREATE INDEX idx_payment_transactions_payment_method_id 
ON public.payment_transactions(payment_method_id) WHERE payment_method_id IS NOT NULL;

CREATE INDEX idx_payment_transactions_status 
ON public.payment_transactions(status);

CREATE INDEX idx_payment_transactions_transaction_id 
ON public.payment_transactions(transaction_id);

CREATE INDEX idx_payment_transactions_netcash_reference 
ON public.payment_transactions(netcash_reference) WHERE netcash_reference IS NOT NULL;

CREATE INDEX idx_payment_transactions_transaction_date 
ON public.payment_transactions(transaction_date DESC);

-- Updated timestamp trigger
CREATE TRIGGER trigger_payment_transactions_updated_at
    BEFORE UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.payment_transactions IS 
'Records all payment transactions with NetCash integration and status tracking';

COMMENT ON COLUMN public.payment_transactions.transaction_id IS 
'Unique external transaction ID (from payment gateway)';

COMMENT ON COLUMN public.payment_transactions.netcash_response IS 
'Full NetCash API response for debugging and audit';

-- =============================================================================
-- 6. RLS Policies for customer_invoices
-- =============================================================================

ALTER TABLE public.customer_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own invoices"
    ON public.customer_invoices
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Service role has full access to invoices"
    ON public.customer_invoices
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- 7. RLS Policies for customer_payment_methods
-- =============================================================================

ALTER TABLE public.customer_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own payment methods"
    ON public.customer_payment_methods
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Customers can manage own payment methods"
    ON public.customer_payment_methods
    FOR ALL
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

CREATE POLICY "Service role has full access to payment methods"
    ON public.customer_payment_methods
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- 8. RLS Policies for payment_transactions
-- =============================================================================

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own transactions"
    ON public.payment_transactions
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Service role has full access to transactions"
    ON public.payment_transactions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- 9. Grant Permissions
-- =============================================================================

GRANT SELECT, INSERT, UPDATE ON public.customer_invoices TO authenticated, service_role;
GRANT DELETE ON public.customer_invoices TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_payment_methods TO authenticated, service_role;

GRANT SELECT ON public.payment_transactions TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.payment_transactions TO service_role;

-- =============================================================================
-- Migration Complete
-- =============================================================================
-- Next Steps:
-- 1. Create usage_history, service_action_log, cron_execution_log (Task 1.5)
-- 2. Implement billing service with pro-rata calculations (Phase 2)
-- 3. Implement invoice generation service (Phase 2)
-- =============================================================================
