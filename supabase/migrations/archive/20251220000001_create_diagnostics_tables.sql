-- =============================================================================
-- Diagnostics & Troubleshooting Module - Database Schema
-- =============================================================================
-- Description: Create tables for subscriber diagnostics, events, and health tracking
-- Version: 1.0
-- Created: 2025-12-20
-- =============================================================================
-- Architecture: Minimal Changes (Option A)
-- - Reuses existing customer_services.connection_id for Interstellio subscriber ID
-- - Links to support_tickets for auto-ticket creation
-- - Stores health status and event history per service
-- =============================================================================

-- =============================================================================
-- 1. Create subscriber_diagnostics Table
-- =============================================================================
-- Stores current health status and metrics for each customer service

CREATE TABLE IF NOT EXISTS public.subscriber_diagnostics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_service_id UUID NOT NULL UNIQUE REFERENCES public.customer_services(id) ON DELETE CASCADE,

    -- Interstellio Subscriber Reference (denormalized for faster lookups)
    interstellio_subscriber_id VARCHAR(100), -- Matches customer_services.connection_id

    -- Current Health Status
    health_status VARCHAR(20) NOT NULL DEFAULT 'unknown',
    health_score INTEGER DEFAULT 100, -- 0-100 score

    -- Session Status (from last check)
    is_session_active BOOLEAN DEFAULT false,
    last_session_start TIMESTAMPTZ,
    last_session_duration_seconds INTEGER DEFAULT 0,
    current_session_ip VARCHAR(45), -- IPv4 or IPv6
    nas_ip_address VARCHAR(45),

    -- Connection Quality Metrics
    total_sessions_today INTEGER DEFAULT 0,
    lost_carrier_count_today INTEGER DEFAULT 0,
    user_request_count_today INTEGER DEFAULT 0,
    session_timeout_count_today INTEGER DEFAULT 0,
    avg_session_duration_seconds INTEGER DEFAULT 0,

    -- Weekly Stats (for trend analysis)
    total_sessions_7days INTEGER DEFAULT 0,
    lost_carrier_count_7days INTEGER DEFAULT 0,
    total_online_seconds_7days INTEGER DEFAULT 0,

    -- Last Known Terminate Cause
    last_terminate_cause VARCHAR(50),
    last_disconnect_time TIMESTAMPTZ,

    -- Timestamps
    last_check_at TIMESTAMPTZ,
    last_event_at TIMESTAMPTZ,
    metrics_updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Check constraints
ALTER TABLE public.subscriber_diagnostics
    ADD CONSTRAINT subscriber_diagnostics_health_status_check
    CHECK (health_status IN ('healthy', 'warning', 'critical', 'offline', 'unknown')),

    ADD CONSTRAINT subscriber_diagnostics_health_score_check
    CHECK (health_score >= 0 AND health_score <= 100);

-- Indexes for performance
CREATE INDEX idx_subscriber_diagnostics_customer_service_id
ON public.subscriber_diagnostics(customer_service_id);

CREATE INDEX idx_subscriber_diagnostics_interstellio_id
ON public.subscriber_diagnostics(interstellio_subscriber_id)
WHERE interstellio_subscriber_id IS NOT NULL;

CREATE INDEX idx_subscriber_diagnostics_health_status
ON public.subscriber_diagnostics(health_status);

CREATE INDEX idx_subscriber_diagnostics_health_status_warning_critical
ON public.subscriber_diagnostics(health_status)
WHERE health_status IN ('warning', 'critical', 'offline');

CREATE INDEX idx_subscriber_diagnostics_session_active
ON public.subscriber_diagnostics(is_session_active);

CREATE INDEX idx_subscriber_diagnostics_last_check
ON public.subscriber_diagnostics(last_check_at DESC);

-- Updated timestamp trigger
CREATE TRIGGER trigger_subscriber_diagnostics_updated_at
    BEFORE UPDATE ON public.subscriber_diagnostics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.subscriber_diagnostics IS
'Stores current health status and connection metrics for each customer service (linked to Interstellio)';

COMMENT ON COLUMN public.subscriber_diagnostics.health_status IS
'Current health: healthy (>80), warning (50-80), critical (<50), offline (no session), unknown (never checked)';

COMMENT ON COLUMN public.subscriber_diagnostics.health_score IS
'Calculated score 0-100 based on session stability, disconnect frequency, and connection uptime';

COMMENT ON COLUMN public.subscriber_diagnostics.lost_carrier_count_today IS
'Number of Lost-Carrier disconnects today - indicates line/modem issues';

COMMENT ON COLUMN public.subscriber_diagnostics.interstellio_subscriber_id IS
'Denormalized from customer_services.connection_id for faster webhook lookups';

-- =============================================================================
-- 2. Create subscriber_events Table
-- =============================================================================
-- Stores webhook events and diagnostic history

CREATE TABLE IF NOT EXISTS public.subscriber_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_service_id UUID NOT NULL REFERENCES public.customer_services(id) ON DELETE CASCADE,
    diagnostics_id UUID REFERENCES public.subscriber_diagnostics(id) ON DELETE SET NULL,

    -- Interstellio Reference
    interstellio_subscriber_id VARCHAR(100) NOT NULL,

    -- Event Details
    event_type VARCHAR(50) NOT NULL,
    event_source VARCHAR(30) NOT NULL, -- 'webhook', 'health_check', 'manual', 'system'
    event_data JSONB DEFAULT '{}'::jsonb,

    -- Session Info at Time of Event
    session_active BOOLEAN,
    session_ip VARCHAR(45),
    nas_ip VARCHAR(45),
    terminate_cause VARCHAR(50),
    session_duration_seconds INTEGER,

    -- Analysis Results
    severity VARCHAR(20) DEFAULT 'info',
    health_impact INTEGER DEFAULT 0, -- Change in health score (-100 to +100)
    requires_action BOOLEAN DEFAULT false,
    action_taken VARCHAR(100),

    -- Ticket Reference (if auto-ticket was created)
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE SET NULL,

    -- Webhook Raw Data
    webhook_payload JSONB,
    webhook_received_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Check constraints
ALTER TABLE public.subscriber_events
    ADD CONSTRAINT subscriber_events_event_type_check
    CHECK (event_type IN (
        'session_start', 'session_end', 'lost_carrier', 'user_request',
        'session_timeout', 'admin_reset', 'port_error', 'nas_error',
        'health_check', 'status_change', 'alert_triggered', 'ticket_created',
        'nas_updated', 'authenticated'
    )),

    ADD CONSTRAINT subscriber_events_event_source_check
    CHECK (event_source IN ('webhook', 'health_check', 'manual', 'system')),

    ADD CONSTRAINT subscriber_events_severity_check
    CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical'));

-- Indexes for performance
CREATE INDEX idx_subscriber_events_customer_service_id
ON public.subscriber_events(customer_service_id);

CREATE INDEX idx_subscriber_events_interstellio_id
ON public.subscriber_events(interstellio_subscriber_id);

CREATE INDEX idx_subscriber_events_event_type
ON public.subscriber_events(event_type);

CREATE INDEX idx_subscriber_events_severity
ON public.subscriber_events(severity)
WHERE severity IN ('high', 'critical');

CREATE INDEX idx_subscriber_events_created_at
ON public.subscriber_events(created_at DESC);

CREATE INDEX idx_subscriber_events_requires_action
ON public.subscriber_events(requires_action)
WHERE requires_action = true;

CREATE INDEX idx_subscriber_events_ticket_id
ON public.subscriber_events(ticket_id)
WHERE ticket_id IS NOT NULL;

-- Composite index for event lookups by service and time
CREATE INDEX idx_subscriber_events_service_time
ON public.subscriber_events(customer_service_id, created_at DESC);

-- Comments
COMMENT ON TABLE public.subscriber_events IS
'Event log for subscriber diagnostics - stores webhooks, health checks, and status changes';

COMMENT ON COLUMN public.subscriber_events.event_type IS
'Type of event: session_start/end, lost_carrier, health_check, alert_triggered, etc.';

COMMENT ON COLUMN public.subscriber_events.event_source IS
'Origin: webhook (Interstellio), health_check (cron), manual (admin), system (auto)';

COMMENT ON COLUMN public.subscriber_events.severity IS
'Event severity: info, low, medium, high, critical';

COMMENT ON COLUMN public.subscriber_events.health_impact IS
'Change in health score caused by this event (-100 to +100)';

-- =============================================================================
-- 3. Extend support_tickets category for diagnostics
-- =============================================================================

-- Add 'diagnostics' category if not exists (using ALTER TABLE with new CHECK)
-- First, drop the existing constraint and recreate with new category
DO $$
BEGIN
    -- Check if constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'support_tickets_category_check'
        AND table_name = 'support_tickets'
    ) THEN
        ALTER TABLE public.support_tickets DROP CONSTRAINT support_tickets_category_check;
    END IF;

    -- Add new constraint with diagnostics category
    ALTER TABLE public.support_tickets
    ADD CONSTRAINT support_tickets_category_check
    CHECK (category IN ('technical', 'billing', 'installation', 'service', 'general', 'diagnostics'));
END $$;

COMMENT ON COLUMN public.support_tickets.category IS
'Ticket category: technical, billing, installation, service, general, diagnostics (auto-generated from health checks)';

-- =============================================================================
-- 4. Function to Auto-Create Diagnostics Record
-- =============================================================================
-- Creates diagnostics record when customer_service gets a connection_id

CREATE OR REPLACE FUNCTION public.create_subscriber_diagnostics_record()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create if connection_id is set (has Interstellio subscriber)
    IF NEW.connection_id IS NOT NULL AND NEW.connection_id != '' THEN
        INSERT INTO public.subscriber_diagnostics (
            customer_service_id,
            interstellio_subscriber_id,
            health_status,
            health_score
        )
        VALUES (
            NEW.id,
            NEW.connection_id,
            'unknown', -- Will be updated on first health check
            100 -- Start with perfect score
        )
        ON CONFLICT (customer_service_id) DO UPDATE SET
            interstellio_subscriber_id = EXCLUDED.interstellio_subscriber_id,
            updated_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on customer_services for connection_id updates
CREATE TRIGGER trigger_create_subscriber_diagnostics_record
    AFTER INSERT OR UPDATE OF connection_id ON public.customer_services
    FOR EACH ROW
    EXECUTE FUNCTION public.create_subscriber_diagnostics_record();

COMMENT ON FUNCTION public.create_subscriber_diagnostics_record() IS
'Auto-creates subscriber_diagnostics record when customer_service gets an Interstellio connection_id';

-- =============================================================================
-- 5. Function to Lookup Customer Service by Interstellio ID
-- =============================================================================
-- Used by webhook handler to find customer service from webhook payload

CREATE OR REPLACE FUNCTION public.find_customer_service_by_interstellio_id(p_interstellio_id VARCHAR)
RETURNS TABLE (
    customer_service_id UUID,
    customer_id UUID,
    customer_name VARCHAR,
    customer_email VARCHAR,
    package_name VARCHAR,
    service_status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cs.id AS customer_service_id,
        cs.customer_id,
        CONCAT(c.first_name, ' ', c.last_name)::VARCHAR AS customer_name,
        c.email::VARCHAR AS customer_email,
        cs.package_name::VARCHAR,
        cs.status::VARCHAR AS service_status
    FROM public.customer_services cs
    JOIN public.customers c ON cs.customer_id = c.id
    WHERE cs.connection_id = p_interstellio_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.find_customer_service_by_interstellio_id(VARCHAR) IS
'Finds customer service record by Interstellio subscriber ID (connection_id)';

-- =============================================================================
-- 6. RLS Policies for subscriber_diagnostics
-- =============================================================================

-- Enable RLS
ALTER TABLE public.subscriber_diagnostics ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access (admin operations, webhooks)
CREATE POLICY "Service role has full access to diagnostics"
    ON public.subscriber_diagnostics
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy: Customers can view their own diagnostics
CREATE POLICY "Customers can view own diagnostics"
    ON public.subscriber_diagnostics
    FOR SELECT
    TO authenticated
    USING (
        customer_service_id IN (
            SELECT cs.id FROM public.customer_services cs
            WHERE cs.customer_id IN (
                SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
            )
        )
    );

-- =============================================================================
-- 7. RLS Policies for subscriber_events
-- =============================================================================

-- Enable RLS
ALTER TABLE public.subscriber_events ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access (webhooks, cron jobs)
CREATE POLICY "Service role has full access to events"
    ON public.subscriber_events
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy: Customers can view their own events
CREATE POLICY "Customers can view own events"
    ON public.subscriber_events
    FOR SELECT
    TO authenticated
    USING (
        customer_service_id IN (
            SELECT cs.id FROM public.customer_services cs
            WHERE cs.customer_id IN (
                SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
            )
        )
    );

-- =============================================================================
-- 8. Grant Permissions
-- =============================================================================

GRANT SELECT, INSERT, UPDATE ON public.subscriber_diagnostics TO authenticated, service_role;
GRANT DELETE ON public.subscriber_diagnostics TO service_role;

GRANT SELECT, INSERT ON public.subscriber_events TO authenticated, service_role;
GRANT DELETE ON public.subscriber_events TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.find_customer_service_by_interstellio_id(VARCHAR) TO service_role;

-- =============================================================================
-- 9. Create View for Admin Dashboard
-- =============================================================================

CREATE OR REPLACE VIEW public.v_subscriber_diagnostics_summary AS
SELECT
    sd.id AS diagnostics_id,
    sd.customer_service_id,
    cs.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    c.email AS customer_email,
    c.phone AS customer_phone,
    cs.package_name,
    cs.status AS service_status,
    cs.installation_address,

    -- Diagnostics
    sd.health_status,
    sd.health_score,
    sd.is_session_active,
    sd.current_session_ip,
    sd.last_session_start,
    sd.last_session_duration_seconds,

    -- Today's metrics
    sd.total_sessions_today,
    sd.lost_carrier_count_today,
    sd.avg_session_duration_seconds,

    -- 7-day metrics
    sd.total_sessions_7days,
    sd.lost_carrier_count_7days,
    sd.total_online_seconds_7days,

    -- Last event
    sd.last_terminate_cause,
    sd.last_disconnect_time,
    sd.last_check_at,
    sd.last_event_at,
    sd.interstellio_subscriber_id,

    -- Recent event counts (subquery)
    (SELECT COUNT(*) FROM public.subscriber_events se
     WHERE se.customer_service_id = cs.id
     AND se.created_at > NOW() - INTERVAL '24 hours') AS events_24h,

    (SELECT COUNT(*) FROM public.subscriber_events se
     WHERE se.customer_service_id = cs.id
     AND se.severity IN ('high', 'critical')
     AND se.created_at > NOW() - INTERVAL '24 hours') AS critical_events_24h

FROM public.subscriber_diagnostics sd
JOIN public.customer_services cs ON sd.customer_service_id = cs.id
JOIN public.customers c ON cs.customer_id = c.id
WHERE cs.status = 'active';

COMMENT ON VIEW public.v_subscriber_diagnostics_summary IS
'Admin dashboard view combining diagnostics, customer, and service data for active services';

-- Grant access to view
GRANT SELECT ON public.v_subscriber_diagnostics_summary TO service_role;

-- =============================================================================
-- Migration Complete
-- =============================================================================
-- Tables created:
--   1. subscriber_diagnostics - Health status per customer service
--   2. subscriber_events - Event log for webhooks/health checks
--
-- Extensions:
--   - Added 'diagnostics' category to support_tickets
--   - Created auto-create trigger for diagnostics records
--   - Created lookup function for webhook handler
--   - Created admin summary view
--
-- Next Steps:
--   1. Create TypeScript types (lib/diagnostics/types.ts)
--   2. Create analyzer service (lib/diagnostics/analyzer.ts)
--   3. Create webhook handler (app/api/webhooks/interstellio/diagnostics/route.ts)
--   4. Create admin API (app/api/admin/diagnostics/route.ts)
--   5. Create cron job (app/api/cron/diagnostics-health-check/route.ts)
--   6. Create admin UI (app/admin/diagnostics/page.tsx)
-- =============================================================================
