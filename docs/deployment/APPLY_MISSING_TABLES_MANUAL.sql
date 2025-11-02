-- =============================================================================
-- MANUAL MIGRATION: Apply Missing Customer Dashboard Tables
-- =============================================================================
-- Date: 2025-11-02
-- Purpose: Manually apply missing tables from Customer Dashboard migrations
-- How to use: Copy this entire file and paste into Supabase Dashboard → SQL Editor → Run
-- =============================================================================
--
-- MISSING TABLES (6 Total):
-- 1. validation_errors
-- 2. customer_payment_methods
-- 3. usage_history
-- 4. service_action_log
-- 5. service_suspensions
-- 6. cron_execution_log
--
-- EXISTING TABLES (Already Applied):
-- ✅ customer_services
-- ✅ customer_billing
-- ✅ customer_invoices
-- ✅ payment_transactions
-- ✅ billing_cycles
--
-- =============================================================================

-- =============================================================================
-- TABLE 1: validation_errors
-- Source: 20251102121000_customer_dashboard_backfill_orders.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.validation_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    suggested_fix TEXT,
    record_details JSONB,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_validation_errors_table_name
ON public.validation_errors(table_name);

CREATE INDEX IF NOT EXISTS idx_validation_errors_resolved
ON public.validation_errors(resolved) WHERE NOT resolved;

-- RLS Policies
ALTER TABLE public.validation_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to validation errors"
    ON public.validation_errors
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Permissions
GRANT SELECT, INSERT, UPDATE ON public.validation_errors TO service_role;
GRANT SELECT ON public.validation_errors TO authenticated;

-- Comments
COMMENT ON TABLE public.validation_errors IS
'Tracks data validation errors during backfill and migration operations';

-- =============================================================================
-- TABLE 2: customer_payment_methods (CRITICAL)
-- Source: 20251102123000_customer_invoices_and_payments.sql
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
    encrypted_details JSONB,
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

-- Indexes
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

-- RLS Policies
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

CREATE POLICY "Service role has full access to payment methods"
    ON public.customer_payment_methods
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Permissions
GRANT SELECT ON public.customer_payment_methods TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.customer_payment_methods TO service_role;

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
-- TABLE 3: usage_history
-- Source: 20251102124000_audit_and_tracking_tables.sql
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

-- Unique constraint
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

-- Indexes
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

-- RLS Policies
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

-- Permissions
GRANT SELECT ON public.usage_history TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.usage_history TO service_role;

-- Comments
COMMENT ON TABLE public.usage_history IS
'Daily usage tracking for customer services with billing cycle allocation';

COMMENT ON COLUMN public.usage_history.total_mb IS
'Computed column: upload_mb + download_mb';

COMMENT ON COLUMN public.usage_history.source IS
'Data source: interstellio (API sync), manual (admin entry), estimated (calculated)';

-- =============================================================================
-- TABLE 4: service_action_log (Audit Trail)
-- Source: 20251102124000_audit_and_tracking_tables.sql
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

-- Indexes
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

-- RLS Policies
ALTER TABLE public.service_action_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own service audit logs"
    ON public.service_action_log
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Service role has full access to service action log"
    ON public.service_action_log
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Permissions
GRANT SELECT ON public.service_action_log TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.service_action_log TO service_role;

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
-- TABLE 5: service_suspensions
-- Source: 20251102124000_audit_and_tracking_tables.sql
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
    suspended_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reactivated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Check constraints
ALTER TABLE public.service_suspensions
    ADD CONSTRAINT service_suspensions_suspension_type_check
    CHECK (suspension_type IN ('non_payment', 'customer_request', 'technical', 'fraud', 'policy_violation', 'other'));

-- Indexes
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

-- RLS Policies
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

-- Permissions
GRANT SELECT ON public.service_suspensions TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.service_suspensions TO service_role;

-- Comments
COMMENT ON TABLE public.service_suspensions IS
'Tracks service suspension events with type, reason, and billing impact';

COMMENT ON COLUMN public.service_suspensions.skip_billing IS
'Whether to skip recurring billing while service is suspended (default: true)';

COMMENT ON COLUMN public.service_suspensions.suspension_type IS
'Type of suspension: non_payment, customer_request, technical, fraud, policy_violation';

-- =============================================================================
-- TABLE 6: cron_execution_log
-- Source: 20251102124000_audit_and_tracking_tables.sql
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

-- Indexes
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

-- RLS Policies
ALTER TABLE public.cron_execution_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to cron execution log"
    ON public.cron_execution_log
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Permissions
GRANT SELECT, INSERT, UPDATE ON public.cron_execution_log TO service_role;

-- Comments
COMMENT ON TABLE public.cron_execution_log IS
'Tracks execution of scheduled cron jobs with timing, results, and error handling';

COMMENT ON COLUMN public.cron_execution_log.duration_seconds IS
'Computed column: execution time in seconds (execution_end - execution_start)';

COMMENT ON COLUMN public.cron_execution_log.job_name IS
'Cron job identifier: generate_invoices, sync_usage_data, process_debit_orders, etc.';

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================

-- Run this after applying the migration to verify all tables exist:

SELECT
    tablename,
    schemaname,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'validation_errors',
    'customer_payment_methods',
    'usage_history',
    'service_action_log',
    'service_suspensions',
    'cron_execution_log'
)
ORDER BY tablename;

-- Expected: 6 rows, all with rls_enabled = true

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
