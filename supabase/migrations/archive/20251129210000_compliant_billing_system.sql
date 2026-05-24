-- =============================================================================
-- SARS-Compliant Billing System Migration
-- =============================================================================
-- Description: Implements immutable invoices, audit logging, credit notes,
--              and auto-generation infrastructure for South African tax compliance
-- Version: 1.0
-- Created: 2025-11-29
-- =============================================================================

-- =============================================================================
-- 1. Invoice Audit Log Table
-- =============================================================================
-- Tracks ALL changes to invoices for SARS compliance and internal auditing

CREATE TABLE IF NOT EXISTS public.invoice_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.customer_invoices(id) ON DELETE CASCADE,
    
    -- Action tracking
    action VARCHAR(50) NOT NULL, -- 'created', 'status_changed', 'voided', 'pdf_generated', 'emailed'
    
    -- Change details
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    previous_data JSONB, -- Snapshot of changed fields before
    new_data JSONB,      -- Snapshot of changed fields after
    
    -- Actor information
    performed_by UUID REFERENCES auth.users(id),
    performed_by_email TEXT,
    performed_by_role TEXT,
    
    -- Context
    reason TEXT,         -- Required for status changes and voids
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for audit log queries
CREATE INDEX idx_invoice_audit_log_invoice_id ON public.invoice_audit_log(invoice_id);
CREATE INDEX idx_invoice_audit_log_action ON public.invoice_audit_log(action);
CREATE INDEX idx_invoice_audit_log_created_at ON public.invoice_audit_log(created_at DESC);
CREATE INDEX idx_invoice_audit_log_performed_by ON public.invoice_audit_log(performed_by);

-- RLS for audit log
ALTER TABLE public.invoice_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to audit log"
    ON public.invoice_audit_log
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admins can view audit logs"
    ON public.invoice_audit_log
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

COMMENT ON TABLE public.invoice_audit_log IS 
'SARS-compliant audit trail for all invoice changes. Immutable - records cannot be updated or deleted.';

-- =============================================================================
-- 2. Credit Notes Table
-- =============================================================================
-- For correcting invoices without editing them (SARS requirement)

-- Create credit note number sequence
CREATE SEQUENCE IF NOT EXISTS public.credit_note_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

GRANT USAGE, SELECT ON SEQUENCE public.credit_note_number_seq TO service_role, authenticated;

-- Function to generate credit note number (CN-YYYY-NNNNN)
CREATE OR REPLACE FUNCTION public.generate_credit_note_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_year INTEGER;
    next_number INTEGER;
    cn_num TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW());
    next_number := nextval('public.credit_note_number_seq');
    cn_num := 'CN-' || current_year || '-' || LPAD(next_number::TEXT, 5, '0');
    RETURN cn_num;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_credit_note_number() TO service_role;

CREATE TABLE IF NOT EXISTS public.credit_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_note_number VARCHAR(20) UNIQUE NOT NULL,
    
    -- Linked invoice (the one being credited)
    original_invoice_id UUID NOT NULL REFERENCES public.customer_invoices(id),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    
    -- Credit note details
    credit_note_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Amounts (should match or be less than original invoice)
    subtotal DECIMAL(10, 2) NOT NULL,
    vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 15.00,
    vat_amount DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- Line items (what's being credited)
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Reason (required for SARS)
    reason TEXT NOT NULL,
    reason_category VARCHAR(50) NOT NULL, -- 'billing_error', 'service_issue', 'cancellation', 'price_adjustment', 'duplicate', 'other'
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'issued', 'applied'
    applied_at TIMESTAMPTZ,
    
    -- PDF Storage
    pdf_url TEXT,
    pdf_generated_at TIMESTAMPTZ,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints
ALTER TABLE public.credit_notes
    ADD CONSTRAINT credit_notes_status_check
    CHECK (status IN ('draft', 'issued', 'applied')),
    
    ADD CONSTRAINT credit_notes_reason_category_check
    CHECK (reason_category IN ('billing_error', 'service_issue', 'cancellation', 'price_adjustment', 'duplicate', 'other')),
    
    ADD CONSTRAINT credit_notes_amounts_positive
    CHECK (subtotal >= 0 AND vat_amount >= 0 AND total_amount >= 0);

-- Indexes
CREATE INDEX idx_credit_notes_customer_id ON public.credit_notes(customer_id);
CREATE INDEX idx_credit_notes_original_invoice_id ON public.credit_notes(original_invoice_id);
CREATE INDEX idx_credit_notes_status ON public.credit_notes(status);
CREATE INDEX idx_credit_notes_credit_note_date ON public.credit_notes(credit_note_date DESC);

-- Auto-generate credit note number trigger
CREATE OR REPLACE FUNCTION public.set_credit_note_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.credit_note_number IS NULL OR NEW.credit_note_number = '' THEN
        NEW.credit_note_number := public.generate_credit_note_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_credit_note_number
    BEFORE INSERT ON public.credit_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_credit_note_number();

-- Updated timestamp trigger
CREATE TRIGGER trigger_credit_notes_updated_at
    BEFORE UPDATE ON public.credit_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to credit notes"
    ON public.credit_notes
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Customers can view own credit notes"
    ON public.credit_notes
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    );

COMMENT ON TABLE public.credit_notes IS 
'Credit notes for reversing/correcting invoices. Required for SARS compliance - invoices cannot be edited once issued.';

-- =============================================================================
-- 3. Add Immutability Fields to customer_invoices
-- =============================================================================

-- Add fields for immutability and PDF storage
ALTER TABLE public.customer_invoices
    ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS locked_reason TEXT,
    ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS voided_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS void_reason TEXT,
    ADD COLUMN IF NOT EXISTS emailed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS email_attempts INTEGER DEFAULT 0;

-- Update status constraint to include 'voided'
ALTER TABLE public.customer_invoices DROP CONSTRAINT IF EXISTS customer_invoices_status_check;
ALTER TABLE public.customer_invoices DROP CONSTRAINT IF EXISTS valid_invoice_status;

ALTER TABLE public.customer_invoices
    ADD CONSTRAINT valid_invoice_status
    CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled', 'voided'));

-- =============================================================================
-- 4. Invoice Immutability Trigger
-- =============================================================================
-- Prevents editing of locked/sent invoices (SARS compliance)

CREATE OR REPLACE FUNCTION public.enforce_invoice_immutability()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow status changes and specific field updates even when locked
    IF OLD.is_locked = true THEN
        -- Only allow these fields to be updated on locked invoices
        IF (
            NEW.status IS DISTINCT FROM OLD.status OR
            NEW.amount_paid IS DISTINCT FROM OLD.amount_paid OR
            NEW.paid_at IS DISTINCT FROM OLD.paid_at OR
            NEW.payment_method IS DISTINCT FROM OLD.payment_method OR
            NEW.payment_reference IS DISTINCT FROM OLD.payment_reference OR
            NEW.pdf_url IS DISTINCT FROM OLD.pdf_url OR
            NEW.pdf_generated_at IS DISTINCT FROM OLD.pdf_generated_at OR
            NEW.emailed_at IS DISTINCT FROM OLD.emailed_at OR
            NEW.email_attempts IS DISTINCT FROM OLD.email_attempts OR
            NEW.voided_at IS DISTINCT FROM OLD.voided_at OR
            NEW.voided_by IS DISTINCT FROM OLD.voided_by OR
            NEW.void_reason IS DISTINCT FROM OLD.void_reason OR
            NEW.updated_at IS DISTINCT FROM OLD.updated_at
        ) THEN
            -- These changes are allowed
            RETURN NEW;
        END IF;
        
        -- Block changes to financial data
        IF (
            NEW.subtotal IS DISTINCT FROM OLD.subtotal OR
            NEW.vat_amount IS DISTINCT FROM OLD.vat_amount OR
            NEW.total_amount IS DISTINCT FROM OLD.total_amount OR
            NEW.line_items IS DISTINCT FROM OLD.line_items OR
            NEW.customer_id IS DISTINCT FROM OLD.customer_id OR
            NEW.invoice_number IS DISTINCT FROM OLD.invoice_number OR
            NEW.invoice_date IS DISTINCT FROM OLD.invoice_date OR
            NEW.due_date IS DISTINCT FROM OLD.due_date
        ) THEN
            RAISE EXCEPTION 'Cannot modify locked invoice. Use credit note for corrections.';
        END IF;
    END IF;
    
    -- Auto-lock invoice when status changes to 'sent'
    IF NEW.status = 'sent' AND OLD.status = 'draft' THEN
        NEW.is_locked := true;
        NEW.locked_at := NOW();
        NEW.locked_reason := 'Invoice sent to customer';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_enforce_invoice_immutability ON public.customer_invoices;
CREATE TRIGGER trigger_enforce_invoice_immutability
    BEFORE UPDATE ON public.customer_invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_invoice_immutability();

-- =============================================================================
-- 5. Auto-Audit Trigger for Invoices
-- =============================================================================

CREATE OR REPLACE FUNCTION public.audit_invoice_changes()
RETURNS TRIGGER AS $$
DECLARE
    action_type TEXT;
    prev_data JSONB;
    new_data_val JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        action_type := 'created';
        prev_data := NULL;
        new_data_val := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            action_type := 'status_changed';
        ELSIF NEW.voided_at IS NOT NULL AND OLD.voided_at IS NULL THEN
            action_type := 'voided';
        ELSIF NEW.pdf_url IS DISTINCT FROM OLD.pdf_url THEN
            action_type := 'pdf_generated';
        ELSIF NEW.emailed_at IS DISTINCT FROM OLD.emailed_at THEN
            action_type := 'emailed';
        ELSE
            action_type := 'updated';
        END IF;
        prev_data := to_jsonb(OLD);
        new_data_val := to_jsonb(NEW);
    END IF;
    
    INSERT INTO public.invoice_audit_log (
        invoice_id,
        action,
        previous_status,
        new_status,
        previous_data,
        new_data,
        performed_by,
        created_at
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        action_type,
        OLD.status,
        NEW.status,
        prev_data,
        new_data_val,
        auth.uid(),
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_audit_invoice_changes ON public.customer_invoices;
CREATE TRIGGER trigger_audit_invoice_changes
    AFTER INSERT OR UPDATE ON public.customer_invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_invoice_changes();

-- =============================================================================
-- 6. Billing Run Log Table
-- =============================================================================
-- Tracks automated billing runs for auditing and debugging

CREATE TABLE IF NOT EXISTS public.billing_run_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Run identification
    run_date DATE NOT NULL,
    run_type VARCHAR(50) NOT NULL, -- 'scheduled', 'manual', 'retry'
    billing_day INTEGER NOT NULL, -- 1, 5, 25, or 30
    
    -- Results
    status VARCHAR(20) NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed', 'partial'
    
    -- Counts
    customers_processed INTEGER DEFAULT 0,
    invoices_generated INTEGER DEFAULT 0,
    invoices_failed INTEGER DEFAULT 0,
    total_amount_billed DECIMAL(12, 2) DEFAULT 0,
    
    -- Details
    error_details JSONB DEFAULT '[]'::jsonb,
    invoice_ids UUID[] DEFAULT '{}',
    
    -- Timing
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    
    -- Actor
    triggered_by UUID REFERENCES auth.users(id),
    triggered_by_system BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX idx_billing_run_log_run_date ON public.billing_run_log(run_date DESC);
CREATE INDEX idx_billing_run_log_status ON public.billing_run_log(status);
CREATE INDEX idx_billing_run_log_billing_day ON public.billing_run_log(billing_day);

-- RLS
ALTER TABLE public.billing_run_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to billing run log"
    ON public.billing_run_log
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admins can view billing run logs"
    ON public.billing_run_log
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

COMMENT ON TABLE public.billing_run_log IS 
'Audit log for automated billing runs. Tracks success/failure of monthly invoice generation.';

-- =============================================================================
-- 7. Grant Permissions
-- =============================================================================

GRANT SELECT, INSERT ON public.invoice_audit_log TO service_role;
GRANT SELECT ON public.invoice_audit_log TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.credit_notes TO service_role;
GRANT SELECT ON public.credit_notes TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.billing_run_log TO service_role;
GRANT SELECT ON public.billing_run_log TO authenticated;

-- =============================================================================
-- Migration Complete
-- =============================================================================
-- Next Steps:
-- 1. Create Supabase Storage bucket for invoice PDFs
-- 2. Implement billing Edge Function for auto-generation
-- 3. Update admin UI for credit notes and audit viewing
-- =============================================================================
