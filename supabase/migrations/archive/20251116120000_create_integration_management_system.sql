-- Migration: Create Integration Management System
-- Purpose: Centralized integration, OAuth, webhook, and API health monitoring
-- Date: 2025-11-16
-- Epic: Admin Integration Management Module

-- ============================================================================
-- TABLE 1: integration_registry
-- Purpose: Master list of all third-party integrations with health status
-- ============================================================================
CREATE TABLE IF NOT EXISTS integration_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- e.g., 'zoho-crm', 'netcash', 'didit-kyc'
  name TEXT NOT NULL, -- e.g., 'Zoho CRM'
  description TEXT,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('oauth', 'api_key', 'webhook_only')),

  -- Configuration
  base_url TEXT, -- e.g., 'https://www.zohoapis.com'
  documentation_url TEXT,
  icon_url TEXT,

  -- Health Status
  health_status TEXT NOT NULL DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'degraded', 'down', 'unknown')),
  last_health_check_at TIMESTAMPTZ,
  health_check_enabled BOOLEAN DEFAULT true,

  -- Metrics (updated by health checks)
  uptime_percentage DECIMAL(5,2), -- Last 30 days
  avg_response_time_ms INTEGER,
  total_requests_30d INTEGER DEFAULT 0,
  failed_requests_30d INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_production_ready BOOLEAN DEFAULT false,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),
  updated_by UUID REFERENCES admin_users(id)
);

-- Indexes
CREATE INDEX idx_integration_registry_slug ON integration_registry(slug);
CREATE INDEX idx_integration_registry_health_status ON integration_registry(health_status);
CREATE INDEX idx_integration_registry_is_active ON integration_registry(is_active);

-- RLS Policies
ALTER TABLE integration_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view all integrations"
  ON integration_registry FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admin users with integrations:write can modify"
  ON integration_registry FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- ============================================================================
-- TABLE 2: integration_oauth_tokens
-- Purpose: Generalized OAuth token storage (replaces zoho_oauth_tokens)
-- ============================================================================
CREATE TABLE IF NOT EXISTS integration_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_slug TEXT NOT NULL REFERENCES integration_registry(slug) ON DELETE CASCADE,

  -- OAuth Configuration
  client_id TEXT NOT NULL,
  client_secret TEXT, -- Encrypted in application layer
  auth_url TEXT,
  token_url TEXT,
  scopes TEXT[], -- Array of OAuth scopes

  -- Tokens
  access_token TEXT, -- Encrypted in application layer
  refresh_token TEXT, -- Encrypted in application layer
  token_type TEXT DEFAULT 'Bearer',

  -- Token Lifecycle
  expires_at TIMESTAMPTZ,
  last_refreshed_at TIMESTAMPTZ,
  refresh_count INTEGER DEFAULT 0,

  -- OAuth Flow State
  oauth_state TEXT, -- CSRF protection token
  oauth_code_verifier TEXT, -- PKCE code verifier
  redirect_uri TEXT,

  -- Error Tracking
  last_error TEXT,
  last_error_at TIMESTAMPTZ,
  consecutive_failures INTEGER DEFAULT 0,

  -- Rate Limiting Protection
  rate_limit_cooldown_until TIMESTAMPTZ,
  rate_limit_hits JSONB DEFAULT '[]'::jsonb, -- Array of timestamps

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),

  -- Unique constraint: One active token per integration
  CONSTRAINT unique_active_integration_oauth UNIQUE (integration_slug, is_active)
);

-- Indexes
CREATE INDEX idx_integration_oauth_tokens_integration_slug ON integration_oauth_tokens(integration_slug);
CREATE INDEX idx_integration_oauth_tokens_expires_at ON integration_oauth_tokens(expires_at);
CREATE INDEX idx_integration_oauth_tokens_is_active ON integration_oauth_tokens(is_active);

-- RLS Policies
ALTER TABLE integration_oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view OAuth tokens (sensitive fields masked)"
  ON integration_oauth_tokens FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admin users with integrations:oauth:manage can modify"
  ON integration_oauth_tokens FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- ============================================================================
-- TABLE 3: integration_webhooks
-- Purpose: Webhook registry for all integrations
-- ============================================================================
CREATE TABLE IF NOT EXISTS integration_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_slug TEXT NOT NULL REFERENCES integration_registry(slug) ON DELETE CASCADE,

  -- Webhook Configuration
  webhook_name TEXT NOT NULL, -- e.g., 'payment_completed', 'kyc_verified'
  webhook_url TEXT NOT NULL, -- Full URL path
  http_method TEXT DEFAULT 'POST' CHECK (http_method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),

  -- Security
  signature_header TEXT, -- e.g., 'x-webhook-signature'
  signature_algorithm TEXT, -- e.g., 'hmac-sha256'
  webhook_secret TEXT, -- Encrypted in application layer

  -- Configuration
  expected_content_type TEXT DEFAULT 'application/json',
  timeout_seconds INTEGER DEFAULT 30,
  retry_enabled BOOLEAN DEFAULT true,
  max_retries INTEGER DEFAULT 3,

  -- Health
  is_enabled BOOLEAN DEFAULT true,
  last_received_at TIMESTAMPTZ,
  total_received INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),

  -- Unique constraint
  CONSTRAINT unique_webhook_per_integration UNIQUE (integration_slug, webhook_name)
);

-- Indexes
CREATE INDEX idx_integration_webhooks_integration_slug ON integration_webhooks(integration_slug);
CREATE INDEX idx_integration_webhooks_is_enabled ON integration_webhooks(is_enabled);
CREATE INDEX idx_integration_webhooks_webhook_name ON integration_webhooks(webhook_name);

-- RLS Policies
ALTER TABLE integration_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view webhooks"
  ON integration_webhooks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admin users with integrations:webhooks:manage can modify"
  ON integration_webhooks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- ============================================================================
-- TABLE 4: integration_webhook_logs
-- Purpose: Audit trail for all webhook executions (replaces payment_webhooks_log)
-- ============================================================================
CREATE TABLE IF NOT EXISTS integration_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES integration_webhooks(id) ON DELETE CASCADE,
  integration_slug TEXT NOT NULL REFERENCES integration_registry(slug) ON DELETE CASCADE,

  -- Request Details
  idempotency_key TEXT UNIQUE, -- Prevent duplicate processing
  http_method TEXT,
  request_headers JSONB,
  request_body JSONB,
  request_ip TEXT,

  -- Response Details
  response_status INTEGER,
  response_body JSONB,
  response_time_ms INTEGER,

  -- Signature Verification
  signature_valid BOOLEAN,
  signature_header_value TEXT,

  -- Processing Status
  processing_status TEXT NOT NULL CHECK (processing_status IN ('received', 'processing', 'completed', 'failed', 'retry')),
  processing_error TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Timestamps
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,

  -- Related Entities (for quick lookups)
  related_entity_type TEXT, -- e.g., 'invoice', 'kyc_session', 'contract'
  related_entity_id UUID
);

-- Indexes
CREATE INDEX idx_integration_webhook_logs_webhook_id ON integration_webhook_logs(webhook_id);
CREATE INDEX idx_integration_webhook_logs_integration_slug ON integration_webhook_logs(integration_slug);
CREATE INDEX idx_integration_webhook_logs_idempotency_key ON integration_webhook_logs(idempotency_key);
CREATE INDEX idx_integration_webhook_logs_processing_status ON integration_webhook_logs(processing_status);
CREATE INDEX idx_integration_webhook_logs_received_at ON integration_webhook_logs(received_at DESC);
CREATE INDEX idx_integration_webhook_logs_related_entity ON integration_webhook_logs(related_entity_type, related_entity_id);

-- RLS Policies
ALTER TABLE integration_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view webhook logs"
  ON integration_webhook_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Service role can insert (webhooks are system-generated)
CREATE POLICY "Service role can insert webhook logs"
  ON integration_webhook_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================================
-- TABLE 5: integration_api_metrics
-- Purpose: Track API rate limits, quotas, and performance metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS integration_api_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_slug TEXT NOT NULL REFERENCES integration_registry(slug) ON DELETE CASCADE,

  -- Time Window
  metric_date DATE NOT NULL,
  metric_hour INTEGER CHECK (metric_hour >= 0 AND metric_hour <= 23),

  -- Request Metrics
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,

  -- Performance Metrics
  avg_response_time_ms INTEGER,
  min_response_time_ms INTEGER,
  max_response_time_ms INTEGER,
  p95_response_time_ms INTEGER, -- 95th percentile

  -- Rate Limiting
  rate_limit_quota INTEGER, -- Max requests allowed
  rate_limit_remaining INTEGER, -- Requests remaining
  rate_limit_reset_at TIMESTAMPTZ,
  rate_limit_hits INTEGER DEFAULT 0, -- How many times we hit the limit

  -- HTTP Status Breakdown
  status_2xx INTEGER DEFAULT 0,
  status_4xx INTEGER DEFAULT 0,
  status_5xx INTEGER DEFAULT 0,

  -- Error Tracking
  top_errors JSONB DEFAULT '[]'::jsonb, -- Array of {error_message, count}

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: One metric per integration per hour
  CONSTRAINT unique_integration_metric_per_hour UNIQUE (integration_slug, metric_date, metric_hour)
);

-- Indexes
CREATE INDEX idx_integration_api_metrics_integration_slug ON integration_api_metrics(integration_slug);
CREATE INDEX idx_integration_api_metrics_date ON integration_api_metrics(metric_date DESC);
CREATE INDEX idx_integration_api_metrics_created_at ON integration_api_metrics(created_at DESC);

-- RLS Policies
ALTER TABLE integration_api_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view API metrics"
  ON integration_api_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Service role can insert/update (metrics are system-generated)
CREATE POLICY "Service role can manage API metrics"
  ON integration_api_metrics FOR ALL
  TO service_role
  WITH CHECK (true);

-- ============================================================================
-- TABLE 6: integration_cron_jobs
-- Purpose: Registry of scheduled tasks for integrations
-- ============================================================================
CREATE TABLE IF NOT EXISTS integration_cron_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_slug TEXT REFERENCES integration_registry(slug) ON DELETE CASCADE,

  -- Job Configuration
  job_name TEXT UNIQUE NOT NULL, -- e.g., 'zoho-sync', 'health-checks'
  job_description TEXT,
  cron_schedule TEXT NOT NULL, -- e.g., '0 0 * * *'
  cron_timezone TEXT DEFAULT 'UTC',

  -- Execution Details
  endpoint_path TEXT NOT NULL, -- e.g., '/api/cron/zoho-sync'
  http_method TEXT DEFAULT 'GET',
  request_headers JSONB,
  request_body JSONB,
  timeout_seconds INTEGER DEFAULT 300,

  -- Status
  is_enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT CHECK (last_run_status IN ('success', 'partial', 'failed', 'timeout')),
  last_run_duration_ms INTEGER,
  last_run_error TEXT,

  -- Execution Stats
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,
  avg_duration_ms INTEGER,

  -- Health
  consecutive_failures INTEGER DEFAULT 0,
  max_consecutive_failures INTEGER DEFAULT 3, -- Alert threshold

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

-- Indexes
CREATE INDEX idx_integration_cron_jobs_integration_slug ON integration_cron_jobs(integration_slug);
CREATE INDEX idx_integration_cron_jobs_is_enabled ON integration_cron_jobs(is_enabled);
CREATE INDEX idx_integration_cron_jobs_last_run_at ON integration_cron_jobs(last_run_at DESC);

-- RLS Policies
ALTER TABLE integration_cron_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view cron jobs"
  ON integration_cron_jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admin users with integrations:cron:manage can modify"
  ON integration_cron_jobs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- ============================================================================
-- TABLE 7: integration_activity_log
-- Purpose: Audit trail for all admin actions on integrations
-- ============================================================================
CREATE TABLE IF NOT EXISTS integration_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_slug TEXT REFERENCES integration_registry(slug) ON DELETE CASCADE,

  -- Action Details
  action_type TEXT NOT NULL CHECK (action_type IN (
    'oauth_token_refreshed',
    'oauth_token_revoked',
    'webhook_enabled',
    'webhook_disabled',
    'webhook_tested',
    'health_check_run',
    'integration_enabled',
    'integration_disabled',
    'configuration_updated',
    'manual_sync_triggered',
    'cron_job_triggered'
  )),
  action_description TEXT,

  -- Actor
  performed_by UUID REFERENCES admin_users(id),
  performed_by_email TEXT, -- Denormalized for audit trail

  -- Context
  ip_address TEXT,
  user_agent TEXT,

  -- Changes
  before_state JSONB, -- Previous configuration/state
  after_state JSONB, -- New configuration/state

  -- Related Entities
  related_entity_type TEXT, -- e.g., 'oauth_token', 'webhook', 'cron_job'
  related_entity_id UUID,

  -- Result
  action_result TEXT CHECK (action_result IN ('success', 'failed', 'partial')),
  error_message TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_integration_activity_log_integration_slug ON integration_activity_log(integration_slug);
CREATE INDEX idx_integration_activity_log_action_type ON integration_activity_log(action_type);
CREATE INDEX idx_integration_activity_log_performed_by ON integration_activity_log(performed_by);
CREATE INDEX idx_integration_activity_log_created_at ON integration_activity_log(created_at DESC);

-- RLS Policies
ALTER TABLE integration_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view activity logs"
  ON integration_activity_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Service role can insert (logs are system-generated)
CREATE POLICY "Service role can insert activity logs"
  ON integration_activity_log FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================================
-- SEED DATA: Register existing integrations
-- ============================================================================

-- Insert existing integrations into registry
INSERT INTO integration_registry (slug, name, description, integration_type, base_url, documentation_url, is_active, is_production_ready)
VALUES
  -- Zoho Integrations
  ('zoho-crm', 'Zoho CRM', 'Customer relationship management and sales automation', 'oauth', 'https://www.zohoapis.com', 'https://www.zoho.com/crm/developer/docs/', true, true),
  ('zoho-sign', 'Zoho Sign', 'Digital signature and contract management', 'oauth', 'https://sign.zoho.com/api', 'https://www.zoho.com/sign/api/', true, true),
  ('zoho-billing', 'Zoho Billing', 'Subscription billing and invoicing', 'oauth', 'https://www.zohoapis.com', 'https://www.zoho.com/billing/api/', true, true),

  -- Payment & KYC
  ('netcash', 'NetCash Pay Now', 'Payment gateway with 20+ payment methods', 'api_key', 'https://gateway.netcash.co.za', 'https://netcash.co.za/developers', true, true),
  ('didit-kyc', 'Didit KYC', 'FICA-compliant identity verification', 'webhook_only', 'https://api.didit.me', 'https://docs.didit.me', true, true),

  -- Communication
  ('clickatell', 'Clickatell SMS', 'SMS notification delivery', 'api_key', 'https://platform.clickatell.com', 'https://www.clickatell.com/developers/', true, true),
  ('resend', 'Resend Email', 'Transactional email delivery', 'api_key', 'https://api.resend.com', 'https://resend.com/docs', true, true),

  -- Infrastructure
  ('mtn-coverage', 'MTN Coverage API', 'Fibre coverage and availability checking', 'api_key', 'https://www.mtn.co.za', NULL, true, true),
  ('google-maps', 'Google Maps Platform', 'Address validation and geocoding', 'api_key', 'https://maps.googleapis.com', 'https://developers.google.com/maps', true, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Update integration health status based on recent metrics
CREATE OR REPLACE FUNCTION update_integration_health()
RETURNS TRIGGER AS $$
DECLARE
  v_health_status TEXT;
  v_success_rate DECIMAL(5,2);
BEGIN
  -- Calculate success rate from last hour
  SELECT
    CASE
      WHEN total_requests = 0 THEN 100.00
      ELSE ROUND((successful_requests::DECIMAL / total_requests::DECIMAL) * 100, 2)
    END
  INTO v_success_rate
  FROM integration_api_metrics
  WHERE integration_slug = NEW.integration_slug
  AND created_at >= NOW() - INTERVAL '1 hour'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Determine health status
  v_health_status := CASE
    WHEN v_success_rate >= 95 THEN 'healthy'
    WHEN v_success_rate >= 80 THEN 'degraded'
    ELSE 'down'
  END;

  -- Update integration registry
  UPDATE integration_registry
  SET
    health_status = v_health_status,
    last_health_check_at = NOW(),
    avg_response_time_ms = NEW.avg_response_time_ms,
    updated_at = NOW()
  WHERE slug = NEW.integration_slug;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update integration health when metrics are inserted
CREATE TRIGGER trigger_update_integration_health
AFTER INSERT OR UPDATE ON integration_api_metrics
FOR EACH ROW
EXECUTE FUNCTION update_integration_health();

-- Function: Record integration activity log (helper for API routes)
CREATE OR REPLACE FUNCTION log_integration_activity(
  p_integration_slug TEXT,
  p_action_type TEXT,
  p_action_description TEXT,
  p_performed_by UUID,
  p_action_result TEXT DEFAULT 'success',
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
  v_user_email TEXT;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email
  FROM admin_users
  WHERE id = p_performed_by;

  -- Insert activity log
  INSERT INTO integration_activity_log (
    integration_slug,
    action_type,
    action_description,
    performed_by,
    performed_by_email,
    action_result,
    error_message
  )
  VALUES (
    p_integration_slug,
    p_action_type,
    p_action_description,
    p_performed_by,
    v_user_email,
    p_action_result,
    p_error_message
  )
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE integration_registry IS 'Master registry of all third-party integrations with health monitoring';
COMMENT ON TABLE integration_oauth_tokens IS 'Generalized OAuth 2.0 token storage for all integrations';
COMMENT ON TABLE integration_webhooks IS 'Webhook endpoint registry for all integrations';
COMMENT ON TABLE integration_webhook_logs IS 'Audit trail for all webhook executions';
COMMENT ON TABLE integration_api_metrics IS 'API performance metrics and rate limit tracking';
COMMENT ON TABLE integration_cron_jobs IS 'Scheduled task registry for integration maintenance';
COMMENT ON TABLE integration_activity_log IS 'Audit trail for all admin actions on integrations';
