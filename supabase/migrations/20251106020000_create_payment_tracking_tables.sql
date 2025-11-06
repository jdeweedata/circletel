-- Migration: Create Payment Tracking Tables
-- Date: 2025-11-06
-- Description: Tables for tracking payment transactions and webhook logs

-- ============================================================================
-- PAYMENT TRANSACTIONS TABLE
-- ============================================================================
-- Tracks all payment attempts and their lifecycle
-- Links to invoices and orders for complete payment history

CREATE TABLE IF NOT EXISTS payment_transactions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Transaction Identification
  transaction_id TEXT UNIQUE NOT NULL, -- Provider's transaction ID
  reference TEXT NOT NULL, -- Order/invoice reference
  provider TEXT NOT NULL, -- netcash, zoho_billing, payfast, paygate

  -- Amount Information
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ZAR',

  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'pending',
  -- pending, processing, completed, failed, refunded, cancelled, expired

  -- Payment Method
  payment_method TEXT, -- card, eft, instant_eft, debit_order, etc.
  payment_method_details JSONB, -- Additional details (last 4 digits, bank, etc.)

  -- Customer Information
  customer_email TEXT,
  customer_name TEXT,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Related Records
  invoice_id UUID,
  order_id UUID,

  -- Provider Response Data
  provider_reference TEXT, -- Provider's internal reference
  provider_response JSONB, -- Full provider response

  -- Metadata
  metadata JSONB, -- Additional custom data

  -- Error Tracking
  error_code TEXT,
  error_message TEXT,
  failure_reason TEXT,

  -- Timestamps
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,

  -- Indexes
  CONSTRAINT valid_status CHECK (status IN (
    'pending', 'processing', 'completed', 'failed',
    'refunded', 'cancelled', 'expired'
  )),
  CONSTRAINT valid_provider CHECK (provider IN (
    'netcash', 'zoho_billing', 'payfast', 'paygate'
  )),
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Indexes for performance
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_provider ON payment_transactions(provider);
CREATE INDEX idx_payment_transactions_customer ON payment_transactions(customer_id);
CREATE INDEX idx_payment_transactions_reference ON payment_transactions(reference);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at DESC);
CREATE INDEX idx_payment_transactions_invoice ON payment_transactions(invoice_id);
CREATE INDEX idx_payment_transactions_order ON payment_transactions(order_id);

-- Full-text search
CREATE INDEX idx_payment_transactions_search ON payment_transactions
USING gin(to_tsvector('english',
  COALESCE(transaction_id, '') || ' ' ||
  COALESCE(reference, '') || ' ' ||
  COALESCE(customer_email, '') || ' ' ||
  COALESCE(customer_name, '')
));

-- ============================================================================
-- PAYMENT WEBHOOK LOGS TABLE
-- ============================================================================
-- Tracks all incoming webhook calls from payment providers
-- Essential for debugging, compliance, and replay scenarios

CREATE TABLE IF NOT EXISTS payment_webhook_logs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Webhook Identification
  webhook_id TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  provider TEXT NOT NULL, -- netcash, zoho_billing, payfast, paygate
  event_type TEXT NOT NULL, -- payment.completed, payment.failed, refund.processed, etc.

  -- Request Data
  http_method TEXT NOT NULL DEFAULT 'POST',
  headers JSONB NOT NULL, -- All HTTP headers
  query_params JSONB, -- URL query parameters
  body TEXT NOT NULL, -- Raw request body
  body_parsed JSONB, -- Parsed JSON body

  -- Signature Verification
  signature TEXT, -- Webhook signature header
  signature_verified BOOLEAN NOT NULL DEFAULT false,
  signature_algorithm TEXT, -- hmac-sha256, etc.

  -- Processing Status
  status TEXT NOT NULL DEFAULT 'received',
  -- received, processing, processed, failed, retrying

  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_duration_ms INTEGER, -- Processing time in milliseconds

  -- Related Transaction
  transaction_id TEXT, -- Links to payment_transactions
  reference TEXT, -- Order/invoice reference from webhook

  -- Processing Results
  success BOOLEAN,
  error_message TEXT,
  error_stack TEXT,
  actions_taken JSONB, -- Array of actions performed (e.g., update order, send email)

  -- Response Data
  response_status_code INTEGER,
  response_body JSONB,

  -- Retry Information
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  last_retry_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,

  -- IP and Security
  source_ip TEXT,
  user_agent TEXT,

  -- Metadata
  metadata JSONB,

  -- Timestamps
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_webhook_status CHECK (status IN (
    'received', 'processing', 'processed', 'failed', 'retrying'
  )),
  CONSTRAINT valid_webhook_provider CHECK (provider IN (
    'netcash', 'zoho_billing', 'payfast', 'paygate'
  ))
);

-- Indexes for performance
CREATE INDEX idx_webhook_logs_provider ON payment_webhook_logs(provider);
CREATE INDEX idx_webhook_logs_status ON payment_webhook_logs(status);
CREATE INDEX idx_webhook_logs_event_type ON payment_webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_transaction ON payment_webhook_logs(transaction_id);
CREATE INDEX idx_webhook_logs_received_at ON payment_webhook_logs(received_at DESC);
CREATE INDEX idx_webhook_logs_signature_verified ON payment_webhook_logs(signature_verified);
CREATE INDEX idx_webhook_logs_success ON payment_webhook_logs(success);

-- ============================================================================
-- PAYMENT PROVIDER SETTINGS TABLE
-- ============================================================================
-- Stores provider-specific configuration and settings
-- Encrypted sensitive data, audit trail for changes

CREATE TABLE IF NOT EXISTS payment_provider_settings (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Provider Identification
  provider TEXT UNIQUE NOT NULL,

  -- Configuration
  enabled BOOLEAN NOT NULL DEFAULT false,
  priority INTEGER NOT NULL DEFAULT 0, -- Higher priority providers tried first

  -- Credentials (Encrypted)
  credentials JSONB, -- Encrypted provider credentials

  -- Settings
  settings JSONB, -- Provider-specific settings

  -- Capabilities Override
  capabilities_override JSONB, -- Override default capabilities

  -- Limits
  min_amount DECIMAL(10,2),
  max_amount DECIMAL(10,2),
  daily_limit DECIMAL(10,2),

  -- Testing
  test_mode BOOLEAN NOT NULL DEFAULT true,
  test_credentials JSONB, -- Separate test credentials

  -- Webhook Configuration
  webhook_url TEXT,
  webhook_secret TEXT, -- Encrypted
  webhook_events TEXT[], -- Array of subscribed events

  -- Metadata
  metadata JSONB,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT valid_provider_setting CHECK (provider IN (
    'netcash', 'zoho_billing', 'payfast', 'paygate'
  )),
  CONSTRAINT positive_priority CHECK (priority >= 0)
);

-- Index
CREATE INDEX idx_payment_provider_settings_enabled ON payment_provider_settings(enabled);
CREATE INDEX idx_payment_provider_settings_priority ON payment_provider_settings(priority DESC);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_updated_at();

CREATE TRIGGER webhook_logs_updated_at
  BEFORE UPDATE ON payment_webhook_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_updated_at();

CREATE TRIGGER provider_settings_updated_at
  BEFORE UPDATE ON payment_provider_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_provider_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Admin users can view all payment transactions
CREATE POLICY admin_view_payment_transactions ON payment_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

-- Policy: Admin users can insert payment transactions
CREATE POLICY admin_insert_payment_transactions ON payment_transactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

-- Policy: Admin users can update payment transactions
CREATE POLICY admin_update_payment_transactions ON payment_transactions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

-- Policy: Admin users can view all webhook logs
CREATE POLICY admin_view_webhook_logs ON payment_webhook_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

-- Policy: Service role can insert webhook logs (for API)
CREATE POLICY service_insert_webhook_logs ON payment_webhook_logs
  FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS

-- Policy: Admin users can update webhook logs
CREATE POLICY admin_update_webhook_logs ON payment_webhook_logs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

-- Policy: Admin users can view provider settings
CREATE POLICY admin_view_provider_settings ON payment_provider_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

-- Policy: Super admin can modify provider settings
CREATE POLICY super_admin_modify_provider_settings ON payment_provider_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role = 'super_admin'
      AND admin_users.status = 'active'
    )
  );

-- ============================================================================
-- HELPFUL VIEWS
-- ============================================================================

-- View: Recent payment transactions with customer info
CREATE OR REPLACE VIEW v_recent_payment_transactions AS
SELECT
  pt.id,
  pt.transaction_id,
  pt.reference,
  pt.provider,
  pt.amount,
  pt.currency,
  pt.status,
  pt.payment_method,
  pt.customer_email,
  pt.customer_name,
  pt.initiated_at,
  pt.completed_at,
  pt.created_at,
  c.first_name || ' ' || c.last_name AS customer_full_name,
  c.phone AS customer_phone
FROM payment_transactions pt
LEFT JOIN customers c ON pt.customer_id = c.id
ORDER BY pt.created_at DESC
LIMIT 100;

-- View: Webhook log summary
CREATE OR REPLACE VIEW v_webhook_log_summary AS
SELECT
  provider,
  event_type,
  status,
  COUNT(*) AS total_count,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) AS success_count,
  SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) AS failure_count,
  AVG(processing_duration_ms) AS avg_processing_time_ms,
  MAX(received_at) AS last_received_at
FROM payment_webhook_logs
WHERE received_at > NOW() - INTERVAL '7 days'
GROUP BY provider, event_type, status
ORDER BY provider, event_type;

-- View: Payment provider health
CREATE OR REPLACE VIEW v_payment_provider_health AS
SELECT
  pps.provider,
  pps.enabled,
  pps.priority,
  pps.test_mode,
  COUNT(pt.id) AS total_transactions,
  SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) AS completed_transactions,
  SUM(CASE WHEN pt.status = 'failed' THEN 1 ELSE 0 END) AS failed_transactions,
  SUM(CASE WHEN pt.status = 'completed' THEN pt.amount ELSE 0 END) AS total_amount,
  AVG(CASE WHEN pt.status = 'completed'
    THEN EXTRACT(EPOCH FROM (pt.completed_at - pt.initiated_at))
    ELSE NULL
  END) AS avg_completion_time_seconds
FROM payment_provider_settings pps
LEFT JOIN payment_transactions pt ON pps.provider = pt.provider
  AND pt.created_at > NOW() - INTERVAL '30 days'
GROUP BY pps.provider, pps.enabled, pps.priority, pps.test_mode;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE payment_transactions IS 'Tracks all payment transactions across all providers';
COMMENT ON TABLE payment_webhook_logs IS 'Logs all incoming webhook calls from payment providers';
COMMENT ON TABLE payment_provider_settings IS 'Stores configuration for each payment provider';

COMMENT ON COLUMN payment_transactions.transaction_id IS 'Unique transaction ID from payment provider';
COMMENT ON COLUMN payment_transactions.reference IS 'Order or invoice reference number';
COMMENT ON COLUMN payment_webhook_logs.signature_verified IS 'Whether webhook signature was successfully verified';
COMMENT ON COLUMN payment_provider_settings.priority IS 'Higher priority providers are tried first for payments';
