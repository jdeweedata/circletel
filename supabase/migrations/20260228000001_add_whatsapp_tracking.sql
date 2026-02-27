-- =============================================================================
-- Migration: Add WhatsApp Tracking for Billing Notifications
-- Description: Adds WhatsApp message tracking to invoices and consent fields to customers
-- Author: Claude Code
-- Date: 2026-02-28
-- =============================================================================

-- =============================================================================
-- CUSTOMER INVOICES: WhatsApp Tracking
-- =============================================================================

-- Add WhatsApp tracking columns to customer_invoices
ALTER TABLE customer_invoices
ADD COLUMN IF NOT EXISTS whatsapp_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS whatsapp_message_id TEXT;

-- Add index for WhatsApp sent tracking (useful for bulk operations)
CREATE INDEX IF NOT EXISTS idx_customer_invoices_whatsapp_sent
ON customer_invoices (whatsapp_sent_at)
WHERE whatsapp_sent_at IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN customer_invoices.whatsapp_sent_at IS 'Timestamp when WhatsApp PayNow notification was sent';
COMMENT ON COLUMN customer_invoices.whatsapp_message_id IS 'Meta Cloud API message ID for delivery tracking';

-- =============================================================================
-- CUSTOMERS: WhatsApp Consent (POPIA Compliance)
-- =============================================================================

-- Add WhatsApp consent columns to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS whatsapp_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_consent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS whatsapp_consent_source TEXT;

-- Add constraint for valid consent sources
ALTER TABLE customers
DROP CONSTRAINT IF EXISTS customers_whatsapp_consent_source_check;

ALTER TABLE customers
ADD CONSTRAINT customers_whatsapp_consent_source_check
CHECK (whatsapp_consent_source IS NULL OR whatsapp_consent_source IN (
  'signup',           -- Checkbox during initial signup
  'sms_optin',        -- Opted in via SMS link
  'admin_import',     -- Admin confirmed prior consent
  'order_form',       -- Checkbox on order/checkout form
  'partner_registration' -- Partner portal registration
));

-- Index for customers with WhatsApp consent (for bulk notification targeting)
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp_consent
ON customers (whatsapp_consent)
WHERE whatsapp_consent = true;

-- Comments for documentation
COMMENT ON COLUMN customers.whatsapp_consent IS 'Whether customer consented to WhatsApp notifications (POPIA compliant)';
COMMENT ON COLUMN customers.whatsapp_consent_at IS 'Timestamp when consent was given';
COMMENT ON COLUMN customers.whatsapp_consent_source IS 'Source of consent: signup, sms_optin, admin_import, order_form, partner_registration';

-- =============================================================================
-- WHATSAPP OPT-IN TOKENS
-- =============================================================================

-- Table for SMS opt-in tokens (for existing customers to opt in via SMS link)
CREATE TABLE IF NOT EXISTS whatsapp_optin_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMPTZ,

  -- Prevent multiple active tokens per customer
  CONSTRAINT whatsapp_optin_tokens_one_active_per_customer
  UNIQUE (customer_id, used_at) -- Only one unused (NULL used_at) per customer
);

-- Index for token lookup
CREATE INDEX IF NOT EXISTS idx_whatsapp_optin_tokens_token
ON whatsapp_optin_tokens (token)
WHERE used_at IS NULL;

-- Index for cleanup of expired tokens
CREATE INDEX IF NOT EXISTS idx_whatsapp_optin_tokens_expires
ON whatsapp_optin_tokens (expires_at)
WHERE used_at IS NULL;

-- RLS policies
ALTER TABLE whatsapp_optin_tokens ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access to whatsapp_optin_tokens"
ON whatsapp_optin_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Comment for documentation
COMMENT ON TABLE whatsapp_optin_tokens IS 'Tokens for SMS-based WhatsApp opt-in flow. Sent to existing customers to confirm consent.';

-- =============================================================================
-- WHATSAPP MESSAGE LOG
-- =============================================================================

-- Table for tracking all WhatsApp messages sent (for analytics and debugging)
CREATE TABLE IF NOT EXISTS whatsapp_message_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Message details
  message_id TEXT, -- Meta Cloud API message ID
  wa_id TEXT, -- WhatsApp ID of recipient
  phone TEXT NOT NULL,
  template_name TEXT NOT NULL,

  -- Related entities
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES customer_invoices(id) ON DELETE SET NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'sent', -- sent, delivered, read, failed
  status_updated_at TIMESTAMPTZ,

  -- Error tracking
  error_code INTEGER,
  error_message TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT, -- 'cron', 'admin:user_id', 'api'

  -- Billing info from webhook
  billable BOOLEAN,
  pricing_category TEXT -- utility, authentication, marketing, service
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_log_customer
ON whatsapp_message_log (customer_id)
WHERE customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_log_invoice
ON whatsapp_message_log (invoice_id)
WHERE invoice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_log_message_id
ON whatsapp_message_log (message_id)
WHERE message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_log_created
ON whatsapp_message_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_log_status
ON whatsapp_message_log (status);

-- RLS policies
ALTER TABLE whatsapp_message_log ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access to whatsapp_message_log"
ON whatsapp_message_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE whatsapp_message_log IS 'Log of all WhatsApp messages sent via Meta Cloud API';
COMMENT ON COLUMN whatsapp_message_log.status IS 'Message status: sent, delivered, read, failed';
COMMENT ON COLUMN whatsapp_message_log.wa_id IS 'WhatsApp ID of the recipient (may differ from phone number)';

-- =============================================================================
-- ADMIN CONSENT IMPORT AUDIT
-- =============================================================================

-- Table for tracking admin bulk consent imports (audit trail)
CREATE TABLE IF NOT EXISTS whatsapp_consent_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Admin who performed the import
  admin_user_id UUID NOT NULL REFERENCES admin_users(id),

  -- Import details
  action TEXT NOT NULL, -- 'bulk_import', 'single_update', 'revoke'
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_count INTEGER, -- For bulk imports

  -- Audit trail
  reason TEXT, -- Admin's stated reason for the action
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for admin audit queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_consent_audit_admin
ON whatsapp_consent_audit (admin_user_id, created_at DESC);

-- RLS policies
ALTER TABLE whatsapp_consent_audit ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access to whatsapp_consent_audit"
ON whatsapp_consent_audit
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Comment for documentation
COMMENT ON TABLE whatsapp_consent_audit IS 'Audit trail for admin WhatsApp consent updates (POPIA compliance)';

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to log WhatsApp message
CREATE OR REPLACE FUNCTION log_whatsapp_message(
  p_message_id TEXT,
  p_wa_id TEXT,
  p_phone TEXT,
  p_template_name TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_invoice_id UUID DEFAULT NULL,
  p_created_by TEXT DEFAULT 'api'
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO whatsapp_message_log (
    message_id, wa_id, phone, template_name,
    customer_id, invoice_id, status, created_by
  )
  VALUES (
    p_message_id, p_wa_id, p_phone, p_template_name,
    p_customer_id, p_invoice_id, 'sent', p_created_by
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Function to update WhatsApp message status (called from webhook handler)
CREATE OR REPLACE FUNCTION update_whatsapp_message_status(
  p_message_id TEXT,
  p_status TEXT,
  p_error_code INTEGER DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_billable BOOLEAN DEFAULT NULL,
  p_pricing_category TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE whatsapp_message_log
  SET
    status = p_status,
    status_updated_at = now(),
    error_code = COALESCE(p_error_code, error_code),
    error_message = COALESCE(p_error_message, error_message),
    billable = COALESCE(p_billable, billable),
    pricing_category = COALESCE(p_pricing_category, pricing_category)
  WHERE message_id = p_message_id;

  RETURN FOUND;
END;
$$;

-- Function to get customers eligible for WhatsApp billing notifications
CREATE OR REPLACE FUNCTION get_whatsapp_eligible_customers(
  p_invoice_ids UUID[]
)
RETURNS TABLE (
  invoice_id UUID,
  invoice_number TEXT,
  customer_id UUID,
  customer_name TEXT,
  phone TEXT,
  total_amount NUMERIC,
  due_date DATE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ci.id AS invoice_id,
    ci.invoice_number,
    c.id AS customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    c.phone,
    ci.total_amount,
    ci.due_date
  FROM customer_invoices ci
  JOIN customers c ON c.id = ci.customer_id
  WHERE ci.id = ANY(p_invoice_ids)
    AND c.whatsapp_consent = true
    AND c.phone IS NOT NULL
    AND c.phone != ''
    AND ci.whatsapp_sent_at IS NULL; -- Not already sent
END;
$$;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant usage to authenticated users (for admin dashboard)
GRANT SELECT ON whatsapp_message_log TO authenticated;
GRANT SELECT ON whatsapp_consent_audit TO authenticated;
