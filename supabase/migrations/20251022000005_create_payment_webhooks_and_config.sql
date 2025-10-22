-- Migration: Create Payment Webhooks and Configuration Tables
-- Task 3.3: Netcash Webhook Integration
-- Date: 2025-10-22

-- ==================================================================
-- 1. PAYMENT CONFIGURATION TABLE
-- ==================================================================
-- Stores Netcash API configuration per environment (test/production)
-- Only Super Admins can manage these settings

CREATE TABLE IF NOT EXISTS payment_configuration (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  environment TEXT NOT NULL CHECK (environment IN ('test', 'production')),
  provider TEXT NOT NULL DEFAULT 'netcash',

  -- Netcash Configuration
  service_key TEXT NOT NULL,
  pci_vault_key TEXT,
  merchant_id TEXT,
  webhook_secret TEXT NOT NULL,

  -- Webhook URLs
  accept_url TEXT,
  decline_url TEXT,
  notify_url TEXT,
  redirect_url TEXT,

  -- Return URLs
  return_url TEXT,
  cancel_url TEXT,

  -- Gateway URLs
  payment_submit_url TEXT NOT NULL,
  api_url TEXT NOT NULL,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT false,

  -- Audit
  created_by UUID REFERENCES admin_users(id),
  updated_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(environment, provider)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_payment_configuration_environment ON payment_configuration(environment, is_active);
CREATE INDEX IF NOT EXISTS idx_payment_configuration_provider ON payment_configuration(provider);

-- Add RLS policies
ALTER TABLE payment_configuration ENABLE ROW LEVEL SECURITY;

-- Super Admins can read all configurations
CREATE POLICY "Super Admins can view payment configuration" ON payment_configuration
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role_template_id = (
        SELECT id FROM role_templates WHERE name = 'Super Admin'
      )
    )
  );

-- Super Admins can insert configurations
CREATE POLICY "Super Admins can insert payment configuration" ON payment_configuration
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role_template_id = (
        SELECT id FROM role_templates WHERE name = 'Super Admin'
      )
    )
  );

-- Super Admins can update configurations
CREATE POLICY "Super Admins can update payment configuration" ON payment_configuration
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role_template_id = (
        SELECT id FROM role_templates WHERE name = 'Super Admin'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role_template_id = (
        SELECT id FROM role_templates WHERE name = 'Super Admin'
      )
    )
  );

-- ==================================================================
-- 2. PAYMENT WEBHOOKS TABLE
-- ==================================================================
-- Stores all webhook notifications from Netcash

CREATE TABLE IF NOT EXISTS payment_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Order Reference
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  payment_reference TEXT,

  -- Webhook Type
  webhook_type TEXT NOT NULL CHECK (webhook_type IN (
    'payment_success',
    'payment_failure',
    'payment_pending',
    'refund',
    'chargeback',
    'notify',
    'accepted',
    'declined',
    'redirect'
  )),

  -- Netcash Transaction Details
  netcash_transaction_id TEXT,
  netcash_reference TEXT,
  amount NUMERIC(10, 2),

  -- Processing Status
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN (
    'received',
    'processing',
    'processed',
    'failed',
    'duplicate'
  )),

  -- Webhook Data
  raw_payload JSONB NOT NULL,
  signature TEXT,
  signature_valid BOOLEAN,

  -- IP and Security
  source_ip TEXT,
  user_agent TEXT,

  -- Processing Details
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes for quick lookups
  CONSTRAINT unique_webhook_per_transaction UNIQUE(netcash_transaction_id, webhook_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_order_id ON payment_webhooks(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_payment_reference ON payment_webhooks(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_netcash_transaction_id ON payment_webhooks(netcash_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_status ON payment_webhooks(status);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_webhook_type ON payment_webhooks(webhook_type);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_created_at ON payment_webhooks(created_at DESC);

-- GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_raw_payload ON payment_webhooks USING GIN (raw_payload);

-- Add RLS policies for webhooks
ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;

-- Service role can insert webhooks (API endpoint)
CREATE POLICY "Service role can insert webhooks" ON payment_webhooks
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Admins with finance permissions can view webhooks
CREATE POLICY "Finance users can view webhooks" ON payment_webhooks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid())
      WHERE permission IN ('finance:view', 'payments:view')
    )
  );

-- Super Admins can update webhook status (for manual retry)
CREATE POLICY "Super Admins can update webhooks" ON payment_webhooks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role_template_id = (
        SELECT id FROM role_templates WHERE name = 'Super Admin'
      )
    )
  );

-- ==================================================================
-- 3. PAYMENT WEBHOOK AUDIT LOG
-- ==================================================================
-- Detailed audit trail for webhook processing

CREATE TABLE IF NOT EXISTS payment_webhook_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID REFERENCES payment_webhooks(id) ON DELETE CASCADE,

  -- Event Details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'webhook_received',
    'signature_verified',
    'signature_failed',
    'order_updated',
    'email_sent',
    'processing_failed',
    'retry_scheduled',
    'duplicate_detected'
  )),

  -- Event Data
  event_data JSONB,
  error_details TEXT,

  -- Timing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_payment_webhook_audit_webhook_id ON payment_webhook_audit(webhook_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_audit_event_type ON payment_webhook_audit(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_audit_created_at ON payment_webhook_audit(created_at DESC);

-- ==================================================================
-- 4. HELPER FUNCTIONS
-- ==================================================================

-- Function to get active payment configuration for environment
CREATE OR REPLACE FUNCTION get_active_payment_config(env TEXT DEFAULT 'production')
RETURNS TABLE (
  id UUID,
  environment TEXT,
  provider TEXT,
  service_key TEXT,
  pci_vault_key TEXT,
  merchant_id TEXT,
  webhook_secret TEXT,
  payment_submit_url TEXT,
  api_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.id,
    pc.environment,
    pc.provider,
    pc.service_key,
    pc.pci_vault_key,
    pc.merchant_id,
    pc.webhook_secret,
    pc.payment_submit_url,
    pc.api_url
  FROM payment_configuration pc
  WHERE pc.environment = env
    AND pc.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate webhook success rate
CREATE OR REPLACE FUNCTION calculate_webhook_success_rate(
  hours_ago INTEGER DEFAULT 24
)
RETURNS NUMERIC AS $$
DECLARE
  total_webhooks INTEGER;
  successful_webhooks INTEGER;
BEGIN
  -- Count total webhooks in period
  SELECT COUNT(*)
  INTO total_webhooks
  FROM payment_webhooks
  WHERE created_at >= NOW() - (hours_ago || ' hours')::INTERVAL;

  -- Count successful webhooks
  SELECT COUNT(*)
  INTO successful_webhooks
  FROM payment_webhooks
  WHERE created_at >= NOW() - (hours_ago || ' hours')::INTERVAL
    AND status = 'processed'
    AND signature_valid = true;

  -- Calculate percentage
  IF total_webhooks = 0 THEN
    RETURN 0;
  END IF;

  RETURN ROUND((successful_webhooks::NUMERIC / total_webhooks::NUMERIC) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to get webhook statistics
CREATE OR REPLACE FUNCTION get_webhook_statistics(
  hours_ago INTEGER DEFAULT 24
)
RETURNS TABLE (
  total_webhooks BIGINT,
  successful_webhooks BIGINT,
  failed_webhooks BIGINT,
  pending_webhooks BIGINT,
  duplicate_webhooks BIGINT,
  success_rate NUMERIC,
  avg_processing_time_ms NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'processed' AND signature_valid = true) as successful,
      COUNT(*) FILTER (WHERE status = 'failed') as failed,
      COUNT(*) FILTER (WHERE status IN ('received', 'processing')) as pending,
      COUNT(*) FILTER (WHERE status = 'duplicate') as duplicate,
      AVG(EXTRACT(EPOCH FROM (processed_at - created_at)) * 1000) FILTER (WHERE processed_at IS NOT NULL) as avg_time
    FROM payment_webhooks
    WHERE created_at >= NOW() - (hours_ago || ' hours')::INTERVAL
  )
  SELECT
    s.total,
    s.successful,
    s.failed,
    s.pending,
    s.duplicate,
    CASE
      WHEN s.total = 0 THEN 0
      ELSE ROUND((s.successful::NUMERIC / s.total::NUMERIC) * 100, 2)
    END as success_rate,
    ROUND(COALESCE(s.avg_time, 0), 2) as avg_processing_time_ms
  FROM stats s;
END;
$$ LANGUAGE plpgsql;

-- ==================================================================
-- 5. INSERT DEFAULT TEST CONFIGURATION
-- ==================================================================
-- Insert test environment configuration with provided credentials

INSERT INTO payment_configuration (
  environment,
  provider,
  service_key,
  pci_vault_key,
  webhook_secret,
  payment_submit_url,
  api_url,
  is_active
) VALUES (
  'test',
  'netcash',
  '7928c6de-219f-4b75-9408-ea0e8c8753b',
  '3143ee79-0c96-4909-968e-5a716fd19a65',
  'GENERATE_NEW_SECRET', -- Will be updated via admin UI
  'https://sandbox.netcash.co.za/paynow/process',
  'https://api.netcash.co.za',
  true
)
ON CONFLICT (environment, provider) DO UPDATE SET
  service_key = EXCLUDED.service_key,
  pci_vault_key = EXCLUDED.pci_vault_key,
  payment_submit_url = EXCLUDED.payment_submit_url,
  api_url = EXCLUDED.api_url,
  updated_at = NOW();

-- ==================================================================
-- 6. GRANT PERMISSIONS
-- ==================================================================

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant permissions on tables
GRANT SELECT, INSERT ON payment_webhooks TO service_role;
GRANT SELECT ON payment_configuration TO service_role;
GRANT INSERT ON payment_webhook_audit TO service_role;

-- ==================================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ==================================================================

COMMENT ON TABLE payment_configuration IS 'Stores payment gateway configuration per environment (test/production). Only Super Admins can manage.';
COMMENT ON TABLE payment_webhooks IS 'Stores all webhook notifications from payment gateways with full audit trail.';
COMMENT ON TABLE payment_webhook_audit IS 'Detailed audit log for webhook processing events.';
COMMENT ON FUNCTION get_active_payment_config IS 'Retrieves the active payment configuration for specified environment.';
COMMENT ON FUNCTION calculate_webhook_success_rate IS 'Calculates webhook processing success rate for specified time period.';
COMMENT ON FUNCTION get_webhook_statistics IS 'Returns comprehensive webhook statistics for monitoring dashboard.';
