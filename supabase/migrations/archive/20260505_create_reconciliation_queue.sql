-- =============================================================================
-- Payment Reconciliation Queue
-- Handles unmatched or uncertain payment matches requiring admin review
-- =============================================================================
-- Description: Create reconciliation_queue table for payment matching workflow
--              Add reconciliation tracking columns to payment_transactions
-- Version: 1.0
-- Created: 2026-05-05
-- =============================================================================

-- =============================================================================
-- 1. Create reconciliation_queue Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.reconciliation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Source of the payment
    source VARCHAR(20) NOT NULL,
    -- Valid values: 'netcash_webhook', 'netcash_statement', 'zoho_cashbook', 'manual'
    source_reference TEXT NOT NULL,
    -- External reference (NetCash txn ID, Zoho txn ID, etc.)
    source_date DATE,
    -- Date from the source system

    -- Payment details
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',
    payment_method VARCHAR(50),
    -- Payment method: 'eft', 'card', 'ozow', 'debit_order', 'cash', etc.
    payer_reference TEXT,
    -- What the payer put as reference (e.g., invoice number, account number)
    payer_name TEXT,
    -- Name from bank statement / source system
    payer_email TEXT,

    -- Matching analysis
    match_confidence DECIMAL(3, 2) DEFAULT 0.00,
    -- Confidence score 0.00 to 1.00
    match_method VARCHAR(50),
    -- How match was determined: 'invoice_number', 'paynow_transaction_ref', 'account_number', 'amount_date', 'manual'
    suggested_customer_id UUID REFERENCES public.customers(id),
    -- Best-guess customer match
    suggested_invoice_id UUID REFERENCES public.customer_invoices(id),
    -- Best-guess invoice match

    -- Linked payment transaction (if one was already created)
    payment_transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,

    -- Queue status
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- Valid values: 'pending', 'approved', 'rejected', 'auto_matched'

    -- Admin resolution
    resolved_by UUID REFERENCES auth.users(id),
    -- Admin user who resolved this entry
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    final_customer_id UUID REFERENCES public.customers(id),
    -- Confirmed customer after admin review
    final_invoice_id UUID REFERENCES public.customer_invoices(id),
    -- Confirmed invoice after admin review

    -- Raw source data for debugging
    raw_data JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Check constraints
ALTER TABLE public.reconciliation_queue
    ADD CONSTRAINT reconciliation_queue_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'auto_matched')),

    ADD CONSTRAINT reconciliation_queue_source_check
    CHECK (source IN ('netcash_webhook', 'netcash_statement', 'zoho_cashbook', 'manual')),

    ADD CONSTRAINT reconciliation_queue_match_confidence_check
    CHECK (match_confidence >= 0.00 AND match_confidence <= 1.00),

    ADD CONSTRAINT reconciliation_queue_amount_check
    CHECK (amount > 0);

-- Indexes for performance
CREATE INDEX idx_reconciliation_queue_status
ON public.reconciliation_queue(status) WHERE status = 'pending';

CREATE INDEX idx_reconciliation_queue_source
ON public.reconciliation_queue(source);

CREATE UNIQUE INDEX idx_reconciliation_queue_source_reference
ON public.reconciliation_queue(source, source_reference)
WHERE status IN ('pending', 'approved');
-- Allow duplicate references only for rejected entries (don't block reprocessing)

CREATE INDEX idx_reconciliation_queue_suggested_customer
ON public.reconciliation_queue(suggested_customer_id) WHERE suggested_customer_id IS NOT NULL;

CREATE INDEX idx_reconciliation_queue_payment_transaction
ON public.reconciliation_queue(payment_transaction_id) WHERE payment_transaction_id IS NOT NULL;

CREATE INDEX idx_reconciliation_queue_created_at
ON public.reconciliation_queue(created_at DESC);

-- Updated timestamp trigger
CREATE TRIGGER trigger_reconciliation_queue_updated_at
    BEFORE UPDATE ON public.reconciliation_queue
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.reconciliation_queue IS
'Queue for unmatched or uncertain payment matches requiring admin review and resolution';

COMMENT ON COLUMN public.reconciliation_queue.source IS
'Source of the payment: webhook, daily statement, Zoho cashbook, or manual entry';

COMMENT ON COLUMN public.reconciliation_queue.source_reference IS
'External transaction ID or reference from the source system';

COMMENT ON COLUMN public.reconciliation_queue.match_confidence IS
'Automated confidence score (0.00-1.00) for match quality';

COMMENT ON COLUMN public.reconciliation_queue.match_method IS
'How the match was determined (invoice number, reference text, amount+date, etc.)';

COMMENT ON COLUMN public.reconciliation_queue.suggested_customer_id IS
'Automated best-guess customer match based on matching logic';

COMMENT ON COLUMN public.reconciliation_queue.payment_transaction_id IS
'Link to payment_transactions if a transaction was already created before confirmation';

COMMENT ON COLUMN public.reconciliation_queue.status IS
'Queue entry status: pending (awaiting review), approved (matched), rejected (no match), auto_matched (high confidence)';

COMMENT ON COLUMN public.reconciliation_queue.resolved_by IS
'Admin user ID who resolved this entry';

COMMENT ON COLUMN public.reconciliation_queue.resolved_at IS
'Timestamp when admin resolved (approved/rejected) this entry';

COMMENT ON COLUMN public.reconciliation_queue.final_customer_id IS
'Confirmed customer ID after admin review (overrides suggested)';

COMMENT ON COLUMN public.reconciliation_queue.final_invoice_id IS
'Confirmed invoice ID after admin review (overrides suggested)';

COMMENT ON COLUMN public.reconciliation_queue.raw_data IS
'Raw data from source system for debugging and audit purposes';

-- =============================================================================
-- 2. Add Reconciliation Columns to payment_transactions
-- =============================================================================

ALTER TABLE public.payment_transactions
ADD COLUMN IF NOT EXISTS reconciliation_source VARCHAR(20),
ADD COLUMN IF NOT EXISTS reconciliation_queue_id UUID REFERENCES public.reconciliation_queue(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payment_transactions_reconciliation_queue
ON public.payment_transactions(reconciliation_queue_id) WHERE reconciliation_queue_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_transactions_reconciliation_source
ON public.payment_transactions(reconciliation_source) WHERE reconciliation_source IS NOT NULL;

COMMENT ON COLUMN public.payment_transactions.reconciliation_source IS
'How this payment was reconciled: webhook, daily_statement, eft_cashbook, monthly_sweep, manual, auto_matched';

COMMENT ON COLUMN public.payment_transactions.reconciliation_queue_id IS
'Link to reconciliation_queue entry if this payment went through admin review process';

-- =============================================================================
-- 3. RLS Policies for reconciliation_queue
-- =============================================================================

ALTER TABLE public.reconciliation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users have full access to reconciliation queue"
    ON public.reconciliation_queue
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Service role can also read/write (for backend jobs)
GRANT ALL ON public.reconciliation_queue TO service_role;

-- =============================================================================
-- 4. Grant Permissions
-- =============================================================================

GRANT SELECT, INSERT, UPDATE ON public.reconciliation_queue TO service_role;
GRANT DELETE ON public.reconciliation_queue TO service_role;

-- =============================================================================
-- Migration Complete
-- =============================================================================
-- Next Steps:
-- 1. Create admin dashboard page to display pending reconciliation queue
-- 2. Implement reconciliation matching service (lib/services/reconciliation-service.ts)
-- 3. Add webhook handler for NetCash payment notifications
-- 4. Implement daily statement import from NetCash/Zoho
-- =============================================================================
