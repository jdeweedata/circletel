-- =============================================================================
-- Debit Order Batch Tracking Tables
-- =============================================================================
-- Description: Tables for tracking debit order batch submissions to NetCash
-- Version: 1.0
-- Created: 2025-12-03
-- =============================================================================

-- =============================================================================
-- 1. Create debit_order_batches Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.debit_order_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id VARCHAR(100) UNIQUE NOT NULL,  -- NetCash batch ID
    batch_name VARCHAR(200) NOT NULL,
    
    -- Batch Statistics
    item_count INTEGER NOT NULL DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    
    -- Status Tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    -- pending, submitted, authorised, processing, processed, failed
    
    -- Timestamps
    submitted_at TIMESTAMPTZ,
    authorised_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    
    -- Results (populated after processing)
    successful_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    total_collected DECIMAL(12, 2) DEFAULT 0.00,
    
    -- Error tracking
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Check constraints
ALTER TABLE public.debit_order_batches
    ADD CONSTRAINT debit_order_batches_status_check
    CHECK (status IN ('pending', 'submitted', 'authorised', 'processing', 'processed', 'failed', 'cancelled'));

-- Indexes
CREATE INDEX idx_debit_order_batches_status 
ON public.debit_order_batches(status);

CREATE INDEX idx_debit_order_batches_submitted_at 
ON public.debit_order_batches(submitted_at DESC);

CREATE INDEX idx_debit_order_batches_batch_id 
ON public.debit_order_batches(batch_id);

-- Create updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_debit_batch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated timestamp trigger
CREATE TRIGGER trigger_debit_order_batches_updated_at
    BEFORE UPDATE ON public.debit_order_batches
    FOR EACH ROW
    EXECUTE FUNCTION public.update_debit_batch_updated_at();

-- Comments
COMMENT ON TABLE public.debit_order_batches IS 
'Tracks debit order batch submissions to NetCash for payment collection';

COMMENT ON COLUMN public.debit_order_batches.batch_id IS 
'NetCash batch ID returned after submission';

COMMENT ON COLUMN public.debit_order_batches.status IS 
'Batch status: pending (not submitted), submitted (sent to NetCash), authorised (approved for processing), processing (being collected), processed (complete), failed (error)';

-- =============================================================================
-- 2. Create debit_order_batch_items Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.debit_order_batch_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id VARCHAR(100) NOT NULL REFERENCES public.debit_order_batches(batch_id) ON DELETE CASCADE,
    
    -- Reference Information
    account_reference VARCHAR(50) NOT NULL,  -- Invoice/Order number sent to NetCash
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    invoice_id UUID,  -- Reference to customer_invoices if applicable
    order_id UUID,    -- Reference to consumer_orders if applicable
    
    -- Amount
    amount DECIMAL(10, 2) NOT NULL,
    action_date DATE NOT NULL,  -- Date the debit was scheduled for
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    -- pending, successful, unpaid, disputed
    
    -- Result Details (populated after reconciliation)
    transaction_code VARCHAR(10),
    unpaid_code VARCHAR(10),
    unpaid_reason TEXT,
    processed_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Check constraints
ALTER TABLE public.debit_order_batch_items
    ADD CONSTRAINT debit_order_batch_items_status_check
    CHECK (status IN ('pending', 'successful', 'unpaid', 'disputed', 'cancelled'));

-- Indexes
CREATE INDEX idx_debit_order_batch_items_batch_id 
ON public.debit_order_batch_items(batch_id);

CREATE INDEX idx_debit_order_batch_items_customer_id 
ON public.debit_order_batch_items(customer_id);

CREATE INDEX idx_debit_order_batch_items_account_reference 
ON public.debit_order_batch_items(account_reference);

CREATE INDEX idx_debit_order_batch_items_status 
ON public.debit_order_batch_items(status);

CREATE INDEX idx_debit_order_batch_items_action_date 
ON public.debit_order_batch_items(action_date);

-- Updated timestamp trigger
CREATE TRIGGER trigger_debit_order_batch_items_updated_at
    BEFORE UPDATE ON public.debit_order_batch_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_debit_batch_updated_at();

-- Comments
COMMENT ON TABLE public.debit_order_batch_items IS 
'Individual debit order items within a batch submission';

COMMENT ON COLUMN public.debit_order_batch_items.account_reference IS 
'Reference sent to NetCash (invoice number, order number, or service ID)';

COMMENT ON COLUMN public.debit_order_batch_items.unpaid_code IS 
'NetCash unpaid reason code if debit failed';

-- =============================================================================
-- 3. RLS Policies
-- =============================================================================

-- Enable RLS
ALTER TABLE public.debit_order_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debit_order_batch_items ENABLE ROW LEVEL SECURITY;

-- Service role has full access (admin/cron operations)
CREATE POLICY "Service role has full access to batches"
    ON public.debit_order_batches
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to batch items"
    ON public.debit_order_batch_items
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Authenticated users can view their own batch items
CREATE POLICY "Customers can view own batch items"
    ON public.debit_order_batch_items
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    );

-- =============================================================================
-- 4. Grant Permissions
-- =============================================================================

GRANT SELECT, INSERT, UPDATE ON public.debit_order_batches TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.debit_order_batch_items TO authenticated, service_role;

-- =============================================================================
-- Migration Complete
-- =============================================================================
