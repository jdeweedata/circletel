-- =============================================================================
-- Customer Dashboard Production Readiness - Phase 1: Audit & Tracking
-- Task Group 1.5: Audit and Tracking Tables
-- =============================================================================
-- Description: Create usage_history, service_action_log, service_suspensions,
--              and cron_execution_log tables
-- Version: 1.0
-- Created: 2025-11-02
-- =============================================================================

-- =============================================================================
-- 1. Create usage_history Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.usage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES public.customer_services(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    
    -- Usage Date
    date DATE NOT NULL,
    
    -- Usage Metrics (in MB)
    upload_mb DECIMAL(12, 2) DEFAULT 0.00,
    download_mb DECIMAL(12, 2) DEFAULT 0.00,
    total_mb DECIMAL(12, 2) GENERATED ALWAYS AS (upload_mb + download_mb) STORED,
    
    -- Billing Cycle Tracking
    billing_cycle_start DATE,
    billing_cycle_end DATE,
    
    -- Data Source
    source VARCHAR(50) NOT NULL DEFAULT 'manual', -- interstellio, manual, estimated
    
    -- Metadata
    synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: One record per service per date
ALTER TABLE public.usage_history
    ADD CONSTRAINT usage_history_service_date_unique
    UNIQUE (service_id, date);

-- Check constraints
ALTER TABLE public.usage_history
    ADD CONSTRAINT usage_history_source_check
    CHECK (source IN ('interstellio', 'manual', 'estimated')),
    
    ADD CONSTRAINT usage_history_upload_check
    CHECK (upload_mb >= 0),
    
    ADD CONSTRAINT usage_history_download_check
    CHECK (download_mb >= 0);

-- Indexes for performance
CREATE INDEX idx_usage_history_service_id 
ON public.usage_history(service_id);

CREATE INDEX idx_usage_history_customer_id 
ON public.usage_history(customer_id);

CREATE INDEX idx_usage_history_date 
ON public.usage_history(date DESC);

CREATE INDEX idx_usage_history_billing_cycle 
ON public.usage_history(billing_cycle_start, billing_cycle_end) 
WHERE billing_cycle_start IS NOT NULL AND billing_cycle_end IS NOT NULL;

CREATE INDEX idx_usage_history_service_date_range 
ON public.usage_history(service_id, date DESC);

-- Updated timestamp trigger
CREATE TRIGGER trigger_usage_history_updated_at
    BEFORE UPDATE ON public.usage_history
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.usage_history IS 
'Daily usage tracking for customer services with billing cycle allocation';

COMMENT ON COLUMN public.usage_history.total_mb IS 
'Computed column: upload_mb + download_mb';

COMMENT ON COLUMN public.usage_history.source IS 
'Data source: interstellio (API sync), manual (admin entry), estimated (calculated)';

-- =============================================================================
-- 2. Create service_action_log Table (Audit Trail)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.service_action_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES public.customer_services(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Action Details
    action_type VARCHAR(50) NOT NULL, -- activate, suspend, reactivate, cancel, upgrade, downgrade, edit
    reason TEXT NOT NULL, -- Mandatory reason for audit compliance
    notes TEXT, -- Optional additional notes
    
    -- State Change Tracking
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    previous_data JSONB, -- Full service state before change
    new_data JSONB, -- Full service state after change
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Check constraints
ALTER TABLE public.service_action_log
    ADD CONSTRAINT service_action_log_action_type_check
    CHECK (action_type IN ('activate', 'suspend', 'reactivate', 'cancel', 'upgrade', 'downgrade', 'edit', 'create'));

-- Indexes for performance
CREATE INDEX idx_service_action_log_service_id 
ON public.service_action_log(service_id);

CREATE INDEX idx_service_action_log_customer_id 
ON public.service_action_log(customer_id);

CREATE INDEX idx_service_action_log_admin_user_id 
ON public.service_action_log(admin_user_id) WHERE admin_user_id IS NOT NULL;

CREATE INDEX idx_service_action_log_action_type 
ON public.service_action_log(action_type);

CREATE INDEX idx_service_action_log_created_at 
ON public.service_action_log(created_at DESC);

CREATE INDEX idx_service_action_log_service_created 
ON public.service_action_log(service_id, created_at DESC);

-- Comments
COMMENT ON TABLE public.service_action_log IS 
'Audit trail for all service management actions with mandatory reasons and state tracking';

COMMENT ON COLUMN public.service_action_log.reason IS 
'Mandatory reason for action (for audit compliance and customer service)';

COMMENT ON COLUMN public.service_action_log.previous_data IS 
'Full service record state before change (JSONB snapshot)';

COMMENT ON COLUMN public.service_action_log.new_data IS 
'Full service record state after change (JSONB snapshot)';

-- =============================================================================
-- 3. Create service_suspensions Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.service_suspensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES public.customer_services(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    
    -- Suspension Details
    suspension_type VARCHAR(50) NOT NULL, -- non_payment, customer_request, technical, fraud, policy_violation
    reason TEXT NOT NULL,
    
    -- Date Tracking
    suspended_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reactivated_at TIMESTAMPTZ,
    
    -- Billing Impact
    skip_billing BOOLEAN DEFAULT true, -- Whether to skip billing during suspension
    
    -- Suspension Initiated By
    suspended_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin user who suspended
    reactivated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin user who reactivated
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Check constraints
ALTER TABLE public.service_suspensions
    ADD CONSTRAINT service_suspensions_suspension_type_check
    CHECK (suspension_type IN ('non_payment', 'customer_request', 'technical', 'fraud', 'policy_violation', 'other'));

-- Indexes for performance
CREATE INDEX idx_service_suspensions_service_id 
ON public.service_suspensions(service_id);

CREATE INDEX idx_service_suspensions_customer_id 
ON public.service_suspensions(customer_id);

CREATE INDEX idx_service_suspensions_suspended_at 
ON public.service_suspensions(suspended_at DESC);

CREATE INDEX idx_service_suspensions_active 
ON public.service_suspensions(service_id, suspended_at DESC) 
WHERE reactivated_at IS NULL;

CREATE INDEX idx_service_suspensions_type 
ON public.service_suspensions(suspension_type);

-- Updated timestamp trigger
CREATE TRIGGER trigger_service_suspensions_updated_at
    BEFORE UPDATE ON public.service_suspensions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.service_suspensions IS 
'Tracks service suspension events with type, reason, and billing impact';

COMMENT ON COLUMN public.service_suspensions.skip_billing IS 
'Whether to skip recurring billing while service is suspended (default: true)';

COMMENT ON COLUMN public.service_suspensions.suspension_type IS 
'Type of suspension: non_payment, customer_request, technical, fraud, policy_violation';

-- =============================================================================
-- 4. Create cron_execution_log Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.cron_execution_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Job Identification
    job_name VARCHAR(100) NOT NULL, -- generate_invoices, sync_usage_data, process_debit_orders, etc.
    
    -- Execution Timing
    execution_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    execution_end TIMESTAMPTZ,
    duration_seconds INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (execution_end - execution_start))::INTEGER
    ) STORED,
    
    -- Execution Status
    status VARCHAR(20) NOT NULL DEFAULT 'running', -- running, completed, failed, partial
    
    -- Results
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    records_skipped INTEGER DEFAULT 0,
    
    -- Error Handling
    error_message TEXT,
    error_details JSONB, -- Structured error data
    
    -- Metadata
    trigger_source VARCHAR(50) DEFAULT 'vercel_cron', -- vercel_cron, manual, api
    triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- If manually triggered
    
    -- Execution Environment
    environment VARCHAR(20), -- production, staging, development
    
    -- Additional Details
    execution_details JSONB, -- Job-specific execution metadata
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Check constraints
ALTER TABLE public.cron_execution_log
    ADD CONSTRAINT cron_execution_log_status_check
    CHECK (status IN ('running', 'completed', 'failed', 'partial', 'cancelled')),
    
    ADD CONSTRAINT cron_execution_log_trigger_source_check
    CHECK (trigger_source IN ('vercel_cron', 'manual', 'api', 'scheduled')),
    
    ADD CONSTRAINT cron_execution_log_records_check
    CHECK (records_processed >= 0 AND records_failed >= 0 AND records_skipped >= 0);

-- Indexes for performance
CREATE INDEX idx_cron_execution_log_job_name 
ON public.cron_execution_log(job_name);

CREATE INDEX idx_cron_execution_log_status 
ON public.cron_execution_log(status);

CREATE INDEX idx_cron_execution_log_created_at 
ON public.cron_execution_log(created_at DESC);

CREATE INDEX idx_cron_execution_log_job_created 
ON public.cron_execution_log(job_name, created_at DESC);

CREATE INDEX idx_cron_execution_log_failed 
ON public.cron_execution_log(job_name, created_at DESC) 
WHERE status = 'failed';

-- Comments
COMMENT ON TABLE public.cron_execution_log IS 
'Tracks execution of scheduled cron jobs with timing, results, and error handling';

COMMENT ON COLUMN public.cron_execution_log.duration_seconds IS 
'Computed column: execution time in seconds (execution_end - execution_start)';

COMMENT ON COLUMN public.cron_execution_log.job_name IS 
'Cron job identifier: generate_invoices, sync_usage_data, process_debit_orders, etc.';

-- =============================================================================
-- 5. RLS Policies for usage_history
-- =============================================================================

ALTER TABLE public.usage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own usage history"
    ON public.usage_history
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Service role has full access to usage history"
    ON public.usage_history
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- 6. RLS Policies for service_action_log
-- =============================================================================

ALTER TABLE public.service_action_log ENABLE ROW LEVEL SECURITY;

-- Customers can view audit logs for their own services
CREATE POLICY "Customers can view own service audit logs"
    ON public.service_action_log
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    );

-- Service role (admins) have full access
CREATE POLICY "Service role has full access to service action log"
    ON public.service_action_log
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- 7. RLS Policies for service_suspensions
-- =============================================================================

ALTER TABLE public.service_suspensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own service suspensions"
    ON public.service_suspensions
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Service role has full access to service suspensions"
    ON public.service_suspensions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- 8. RLS Policies for cron_execution_log
-- =============================================================================

ALTER TABLE public.cron_execution_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access cron logs (admin/internal use only)
CREATE POLICY "Service role has full access to cron execution log"
    ON public.cron_execution_log
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- 9. Grant Permissions
-- =============================================================================

GRANT SELECT ON public.usage_history TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.usage_history TO service_role;

GRANT SELECT ON public.service_action_log TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.service_action_log TO service_role;

GRANT SELECT ON public.service_suspensions TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.service_suspensions TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.cron_execution_log TO service_role;

-- =============================================================================
-- Migration Complete - Phase 1 Foundation Complete!
-- =============================================================================
-- Database Schema Summary:
-- ✅ Task 1.1: Account number system, enhanced customers table, consumer_orders FKs
-- ✅ Task 1.2: Data backfill, validation errors, orphaned orders handling
-- ✅ Task 1.3: customer_services, customer_billing tables with RLS
-- ✅ Task 1.4: customer_invoices (auto-numbering), payment_methods, payment_transactions
-- ✅ Task 1.5: usage_history, service_action_log, service_suspensions, cron_execution_log
--
-- Next Steps (Phase 2):
-- 1. Implement billing service with pro-rata calculations (Task 2.1)
-- 2. Extend invoice generator for customer invoices (Task 2.2)
-- 3. Implement payment method management service (Task 2.3)
-- 4. Create invoice generation cron job (Task 2.4)
-- 5. Implement invoice and billing API endpoints (Tasks 2.5, 2.6, 2.7)
-- =============================================================================
