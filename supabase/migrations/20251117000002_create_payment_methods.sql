-- ============================================================================
-- Payment Methods & NetCash eMandate Integration
-- ============================================================================
-- Description: Creates tables and functions for managing customer payment methods
--              and NetCash eMandate registration workflow
-- Date: 2025-11-17
-- Author: CircleTel Development Team
-- ============================================================================

-- ============================================================================
-- 1. PAYMENT METHODS TABLE
-- ============================================================================
-- Stores registered payment methods (bank accounts, credit cards) for recurring billing

CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES consumer_orders(id) ON DELETE SET NULL,

  -- Payment Method Details
  method_type VARCHAR(20) NOT NULL CHECK (method_type IN ('bank_account', 'credit_card')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'suspended', 'cancelled', 'expired', 'failed')),

  -- Bank Account Details (for bank_account type)
  bank_name VARCHAR(100),
  bank_account_name VARCHAR(100),
  bank_account_number_masked VARCHAR(20), -- Last 4 digits only (e.g., "****1234")
  bank_account_type VARCHAR(20) CHECK (bank_account_type IN ('current', 'savings', 'transmission')),
  branch_code VARCHAR(10),

  -- Credit Card Details (for credit_card type)
  card_type VARCHAR(20) CHECK (card_type IN ('visa', 'mastercard')),
  card_number_masked VARCHAR(20), -- Last 4 digits only (e.g., "****5678")
  card_holder_name VARCHAR(100),
  card_expiry_month INTEGER CHECK (card_expiry_month BETWEEN 1 AND 12),
  card_expiry_year INTEGER CHECK (card_expiry_year >= EXTRACT(YEAR FROM CURRENT_DATE)),

  -- NetCash Integration Fields
  netcash_account_reference VARCHAR(50) UNIQUE, -- Maps to AccountReference in NetCash
  netcash_mandate_reference VARCHAR(100),
  netcash_mandate_url TEXT,
  netcash_mandate_pdf_link TEXT,
  netcash_token VARCHAR(100), -- For credit card tokenization

  -- Mandate Details
  mandate_amount DECIMAL(10, 2),
  mandate_frequency VARCHAR(20) CHECK (mandate_frequency IN ('monthly', 'bimonthly', 'quarterly', 'biannually', 'annually', 'weekly', 'biweekly')),
  mandate_debit_day INTEGER CHECK (mandate_debit_day BETWEEN 1 AND 31 OR mandate_debit_day IS NULL),
  mandate_agreement_date DATE,
  mandate_signed_at TIMESTAMPTZ,
  mandate_active BOOLEAN DEFAULT FALSE,

  -- Additional Details
  is_primary BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_method VARCHAR(50), -- 'emandate', 'avs', 'manual'

  -- Custom Fields (from NetCash Field1-9)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_by UUID REFERENCES admin_users(id),

  -- Constraints
  CONSTRAINT valid_bank_account CHECK (
    method_type != 'bank_account' OR (
      bank_name IS NOT NULL AND
      bank_account_name IS NOT NULL AND
      bank_account_number_masked IS NOT NULL
    )
  ),
  CONSTRAINT valid_credit_card CHECK (
    method_type != 'credit_card' OR (
      card_type IS NOT NULL AND
      card_number_masked IS NOT NULL AND
      card_holder_name IS NOT NULL AND
      card_expiry_month IS NOT NULL AND
      card_expiry_year IS NOT NULL
    )
  )
);

-- Indexes
CREATE INDEX idx_payment_methods_customer ON payment_methods(customer_id);
CREATE INDEX idx_payment_methods_order ON payment_methods(order_id);
CREATE INDEX idx_payment_methods_status ON payment_methods(status);
CREATE INDEX idx_payment_methods_netcash_ref ON payment_methods(netcash_account_reference);
CREATE INDEX idx_payment_methods_primary ON payment_methods(customer_id, is_primary) WHERE is_primary = TRUE;

-- Comments
COMMENT ON TABLE payment_methods IS 'Registered payment methods for customers (bank accounts and credit cards)';
COMMENT ON COLUMN payment_methods.netcash_account_reference IS 'Unique reference for NetCash debit order master file';
COMMENT ON COLUMN payment_methods.mandate_signed_at IS 'Timestamp when customer digitally signed the mandate';
COMMENT ON COLUMN payment_methods.is_primary IS 'Primary payment method for recurring billing';

-- ============================================================================
-- 2. EMANDATE REQUESTS TABLE
-- ============================================================================
-- Tracks NetCash eMandate API requests and postback status

CREATE TABLE IF NOT EXISTS emandate_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES consumer_orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Request Details
  request_type VARCHAR(20) NOT NULL DEFAULT 'synchronous'
    CHECK (request_type IN ('synchronous', 'batch')),
  status VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',          -- Request created, not yet sent to NetCash
      'sent',             -- Sent to NetCash, awaiting customer action
      'customer_notified',-- Email/SMS sent to customer with mandate URL
      'viewed',           -- Customer viewed the mandate form
      'signed',           -- Customer signed the mandate
      'declined',         -- Customer declined the mandate
      'expired',          -- Mandate URL expired
      'postback_received',-- Postback received from NetCash
      'completed',        -- Payment method successfully registered
      'failed',           -- Request failed
      'cancelled'         -- Request cancelled
    )),

  -- NetCash API Request Data
  netcash_service_key VARCHAR(100),
  netcash_account_reference VARCHAR(50),
  netcash_mandate_url TEXT,
  netcash_short_url TEXT,
  netcash_response_code VARCHAR(10),
  netcash_error_messages TEXT[],
  netcash_warnings TEXT[],

  -- Request Payload (for audit and retry)
  request_payload JSONB,

  -- Customer Communication
  notification_email VARCHAR(255),
  notification_phone VARCHAR(20),
  email_sent_at TIMESTAMPTZ,
  sms_sent_at TIMESTAMPTZ,

  -- Postback Data
  postback_received_at TIMESTAMPTZ,
  postback_data JSONB,
  postback_mandate_successful BOOLEAN,
  postback_reason_for_decline TEXT,
  postback_mandate_pdf_link TEXT,

  -- Timing
  expires_at TIMESTAMPTZ, -- Mandate URL expiry
  signed_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),

  -- Metadata
  ip_address INET,
  user_agent TEXT,
  notes TEXT
);

-- Indexes
CREATE INDEX idx_emandate_requests_order ON emandate_requests(order_id);
CREATE INDEX idx_emandate_requests_customer ON emandate_requests(customer_id);
CREATE INDEX idx_emandate_requests_status ON emandate_requests(status);
CREATE INDEX idx_emandate_requests_payment_method ON emandate_requests(payment_method_id);
CREATE INDEX idx_emandate_requests_netcash_ref ON emandate_requests(netcash_account_reference);
CREATE INDEX idx_emandate_requests_created_at ON emandate_requests(created_at DESC);

-- Comments
COMMENT ON TABLE emandate_requests IS 'Tracks NetCash eMandate API requests and customer signature workflow';
COMMENT ON COLUMN emandate_requests.netcash_short_url IS 'Short URL provided by NetCash for customer to sign mandate';
COMMENT ON COLUMN emandate_requests.postback_data IS 'Full postback payload from NetCash after customer signs mandate';

-- ============================================================================
-- 3. FUNCTIONS
-- ============================================================================

-- Function: Auto-update payment method updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_method_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_methods_update_timestamp
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_method_timestamp();

-- Function: Auto-update emandate request updated_at timestamp
CREATE OR REPLACE FUNCTION update_emandate_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER emandate_requests_update_timestamp
  BEFORE UPDATE ON emandate_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_emandate_request_timestamp();

-- Function: Set primary payment method (ensures only one primary per customer)
CREATE OR REPLACE FUNCTION set_primary_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = TRUE THEN
    -- Unset any existing primary payment method for this customer
    UPDATE payment_methods
    SET is_primary = FALSE
    WHERE customer_id = NEW.customer_id
      AND id != NEW.id
      AND is_primary = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_primary_payment_method
  BEFORE INSERT OR UPDATE ON payment_methods
  FOR EACH ROW
  WHEN (NEW.is_primary = TRUE)
  EXECUTE FUNCTION set_primary_payment_method();

-- Function: Auto-activate payment method when mandate is signed
CREATE OR REPLACE FUNCTION activate_payment_method_on_signature()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.mandate_signed_at IS NOT NULL AND OLD.mandate_signed_at IS NULL THEN
    NEW.status = 'active';
    NEW.activated_at = NEW.mandate_signed_at;
    NEW.is_verified = TRUE;
    NEW.verification_method = 'emandate';
    NEW.mandate_active = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_activate_on_signature
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION activate_payment_method_on_signature();

-- Function: Get customer's primary payment method
CREATE OR REPLACE FUNCTION get_primary_payment_method(p_customer_id UUID)
RETURNS TABLE (
  id UUID,
  method_type VARCHAR,
  status VARCHAR,
  bank_name VARCHAR,
  bank_account_name VARCHAR,
  bank_account_number_masked VARCHAR,
  card_type VARCHAR,
  card_number_masked VARCHAR,
  mandate_amount DECIMAL,
  mandate_frequency VARCHAR,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pm.id,
    pm.method_type,
    pm.status,
    pm.bank_name,
    pm.bank_account_name,
    pm.bank_account_number_masked,
    pm.card_type,
    pm.card_number_masked,
    pm.mandate_amount,
    pm.mandate_frequency,
    (pm.status = 'active' AND pm.mandate_active = TRUE) as is_active
  FROM payment_methods pm
  WHERE pm.customer_id = p_customer_id
    AND pm.is_primary = TRUE
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE emandate_requests ENABLE ROW LEVEL SECURITY;

-- Admin: Full access to payment methods
CREATE POLICY admin_payment_methods_all ON payment_methods
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Service role: Full access (for API routes serving customers)
CREATE POLICY service_role_payment_methods_all ON payment_methods
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Admin: Full access to emandate requests
CREATE POLICY admin_emandate_requests_all ON emandate_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Service role: Full access (for API routes serving customers)
CREATE POLICY service_role_emandate_requests_all ON emandate_requests
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 5. SAMPLE DATA (for testing)
-- ============================================================================

-- Note: Sample data would be added here for development/testing environments
-- Production migration should not include sample data

COMMENT ON SCHEMA public IS 'Payment Methods and NetCash eMandate integration - Migration 20251117000002';
