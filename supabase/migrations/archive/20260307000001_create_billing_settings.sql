-- Migration: Create Billing Settings Table
-- Feature: Finance Settings Configuration Page
-- Date: 2026-03-07
--
-- Creates a configurable billing settings table to replace hardcoded values
-- throughout the billing system (VAT rate, due days, fees, reminder thresholds)

-- ==================================================================
-- 1. BILLING SETTINGS TABLE
-- ==================================================================
-- Stores configurable billing rules, fees, and reminder settings
-- Super Admins only can manage these settings

CREATE TABLE IF NOT EXISTS billing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Setting identification
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,

  -- Future: Different settings per customer type
  customer_type TEXT DEFAULT 'global' CHECK (customer_type IN ('global', 'business', 'consumer', 'partner')),

  -- Documentation
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('billing_rules', 'fees_charges', 'payment_methods', 'reminders', 'general')),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES admin_users(id),

  -- Constraints
  UNIQUE(setting_key, customer_type)
);

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_billing_settings_key ON billing_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_billing_settings_category ON billing_settings(category);
CREATE INDEX IF NOT EXISTS idx_billing_settings_customer_type ON billing_settings(customer_type);

-- ==================================================================
-- 2. ROW LEVEL SECURITY
-- ==================================================================

ALTER TABLE billing_settings ENABLE ROW LEVEL SECURITY;

-- Super Admins can read all billing settings
CREATE POLICY "Super Admins can view billing settings" ON billing_settings
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

-- Super Admins can insert billing settings
CREATE POLICY "Super Admins can insert billing settings" ON billing_settings
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

-- Super Admins can update billing settings
CREATE POLICY "Super Admins can update billing settings" ON billing_settings
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

-- Service role can read settings (for background jobs)
CREATE POLICY "Service role can read billing settings" ON billing_settings
  FOR SELECT
  TO service_role
  USING (true);

-- ==================================================================
-- 3. SEED DEFAULT VALUES
-- ==================================================================
-- Insert current hardcoded values as defaults

INSERT INTO billing_settings (setting_key, setting_value, category, description) VALUES
  -- Billing Rules
  ('vat_rate', '15.00', 'billing_rules', 'VAT percentage applied to invoices'),
  ('invoice_due_days', '7', 'billing_rules', 'Days until invoice is due for consumers'),
  ('b2b_due_days', '30', 'billing_rules', 'Days until invoice is due for B2B customers'),
  ('grace_period_days', '3', 'billing_rules', 'Grace period before late fees apply'),
  ('auto_suspend_days', '14', 'billing_rules', 'Days overdue before service suspension'),
  ('billing_dates', '[1, 5, 25, 30]', 'billing_rules', 'Available billing day options for customers'),

  -- Fees & Charges
  ('late_payment_fee', '100.00', 'fees_charges', 'Late payment fee in Rands'),
  ('reconnection_fee', '250.00', 'fees_charges', 'Service reconnection fee in Rands'),
  ('router_price', '99.00', 'fees_charges', 'Router rental/purchase price in Rands'),
  ('failed_debit_fee', '100.00', 'fees_charges', 'Failed debit order fee in Rands'),

  -- Reminder Settings
  ('email_reminder_days', '5', 'reminders', 'Days before due date to send email reminder'),
  ('sms_reminder_max', '3', 'reminders', 'Maximum SMS reminders per invoice'),
  ('sms_urgency_thresholds', '[3, 7]', 'reminders', 'Days overdue for urgency level escalation'),
  ('whatsapp_enabled', 'false', 'reminders', 'Enable WhatsApp reminders')
ON CONFLICT (setting_key, customer_type) DO NOTHING;

-- ==================================================================
-- 4. HELPER FUNCTIONS
-- ==================================================================

-- Function to get a billing setting value
CREATE OR REPLACE FUNCTION get_billing_setting(
  p_key TEXT,
  p_customer_type TEXT DEFAULT 'global'
)
RETURNS JSONB AS $$
DECLARE
  v_value JSONB;
BEGIN
  -- Try customer-specific setting first
  SELECT setting_value INTO v_value
  FROM billing_settings
  WHERE setting_key = p_key
    AND customer_type = p_customer_type;

  -- Fall back to global if not found
  IF v_value IS NULL AND p_customer_type != 'global' THEN
    SELECT setting_value INTO v_value
    FROM billing_settings
    WHERE setting_key = p_key
      AND customer_type = 'global';
  END IF;

  RETURN v_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get billing setting as numeric
CREATE OR REPLACE FUNCTION get_billing_setting_numeric(
  p_key TEXT,
  p_customer_type TEXT DEFAULT 'global',
  p_default NUMERIC DEFAULT 0
)
RETURNS NUMERIC AS $$
DECLARE
  v_value JSONB;
BEGIN
  v_value := get_billing_setting(p_key, p_customer_type);

  IF v_value IS NULL THEN
    RETURN p_default;
  END IF;

  RETURN COALESCE((v_value #>> '{}')::NUMERIC, p_default);
EXCEPTION WHEN OTHERS THEN
  RETURN p_default;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get billing setting as integer
CREATE OR REPLACE FUNCTION get_billing_setting_int(
  p_key TEXT,
  p_customer_type TEXT DEFAULT 'global',
  p_default INTEGER DEFAULT 0
)
RETURNS INTEGER AS $$
BEGIN
  RETURN get_billing_setting_numeric(p_key, p_customer_type, p_default)::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get billing setting as boolean
CREATE OR REPLACE FUNCTION get_billing_setting_bool(
  p_key TEXT,
  p_customer_type TEXT DEFAULT 'global',
  p_default BOOLEAN DEFAULT false
)
RETURNS BOOLEAN AS $$
DECLARE
  v_value JSONB;
  v_text TEXT;
BEGIN
  v_value := get_billing_setting(p_key, p_customer_type);

  IF v_value IS NULL THEN
    RETURN p_default;
  END IF;

  v_text := v_value #>> '{}';
  RETURN COALESCE(v_text = 'true' OR v_text = '1', p_default);
EXCEPTION WHEN OTHERS THEN
  RETURN p_default;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================================
-- 5. AUDIT LOG TRIGGER
-- ==================================================================

-- Create audit log for billing settings changes
CREATE OR REPLACE FUNCTION log_billing_settings_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_audit_logs (
    admin_user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    ip_address,
    created_at
  ) VALUES (
    COALESCE(NEW.updated_by, auth.uid()),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      ELSE TG_OP
    END,
    'billing_settings',
    NEW.id::TEXT,
    CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    row_to_json(NEW),
    NULL,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS billing_settings_audit_trigger ON billing_settings;
CREATE TRIGGER billing_settings_audit_trigger
  AFTER INSERT OR UPDATE ON billing_settings
  FOR EACH ROW
  EXECUTE FUNCTION log_billing_settings_change();

-- ==================================================================
-- 6. UPDATE TIMESTAMP TRIGGER
-- ==================================================================

CREATE OR REPLACE FUNCTION update_billing_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS billing_settings_updated_at ON billing_settings;
CREATE TRIGGER billing_settings_updated_at
  BEFORE UPDATE ON billing_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_settings_timestamp();

-- ==================================================================
-- 7. GRANTS
-- ==================================================================

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT SELECT ON billing_settings TO service_role;

-- ==================================================================
-- 8. COMMENTS
-- ==================================================================

COMMENT ON TABLE billing_settings IS 'Configurable billing settings replacing hardcoded values. Super Admins only.';
COMMENT ON FUNCTION get_billing_setting IS 'Retrieves a billing setting value, with fallback to global.';
COMMENT ON FUNCTION get_billing_setting_numeric IS 'Retrieves a billing setting as numeric value.';
COMMENT ON FUNCTION get_billing_setting_int IS 'Retrieves a billing setting as integer value.';
COMMENT ON FUNCTION get_billing_setting_bool IS 'Retrieves a billing setting as boolean value.';
