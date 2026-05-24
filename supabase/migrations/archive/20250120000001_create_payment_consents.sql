/**
 * Payment Consents Tracking Table
 *
 * Logs customer consent for legal policies at the time of payment
 * Ensures POPIA compliance and provides audit trail for payment transactions
 *
 * Created: 2025-01-20
 * Related: NetCash legal compliance implementation
 */

-- Create payment_consents table
CREATE TABLE IF NOT EXISTS payment_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Transaction References
  payment_transaction_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
  order_id UUID REFERENCES consumer_orders(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES business_quotes(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Policy Versions Accepted
  terms_version TEXT NOT NULL,              -- e.g., "2025-01-20"
  privacy_version TEXT NOT NULL,
  payment_terms_version TEXT NOT NULL,
  refund_policy_version TEXT NOT NULL,

  -- Consent Flags
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  privacy_accepted BOOLEAN NOT NULL DEFAULT false,
  payment_terms_accepted BOOLEAN NOT NULL DEFAULT false,
  refund_policy_acknowledged BOOLEAN NOT NULL DEFAULT false,
  recurring_payment_authorized BOOLEAN DEFAULT false,
  marketing_consent BOOLEAN DEFAULT false,

  -- B2B-specific Consents (for business customers)
  data_processing_consent BOOLEAN DEFAULT false,
  third_party_disclosure_consent BOOLEAN DEFAULT false,
  business_verification_consent BOOLEAN DEFAULT false,

  -- Audit Trail
  ip_address TEXT,
  user_agent TEXT,
  consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  consent_type TEXT DEFAULT 'payment',  -- 'payment', 'quote', 'subscription', etc.
  additional_metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_payment_consents_transaction ON payment_consents(payment_transaction_id);
CREATE INDEX idx_payment_consents_order ON payment_consents(order_id);
CREATE INDEX idx_payment_consents_quote ON payment_consents(quote_id);
CREATE INDEX idx_payment_consents_email ON payment_consents(customer_email);
CREATE INDEX idx_payment_consents_customer ON payment_consents(customer_id);
CREATE INDEX idx_payment_consents_timestamp ON payment_consents(consent_timestamp);
CREATE INDEX idx_payment_consents_type ON payment_consents(consent_type);

-- Row Level Security (RLS)
ALTER TABLE payment_consents ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can view their own consents
CREATE POLICY "Customers can view own consents" ON payment_consents
  FOR SELECT
  USING (
    customer_email = auth.jwt() ->> 'email'
    OR customer_id = auth.uid()
  );

-- Policy: Service role can insert consents
CREATE POLICY "Service role can insert consents" ON payment_consents
  FOR INSERT
  WITH CHECK (true);

-- Policy: Service role can update consents
CREATE POLICY "Service role can update consents" ON payment_consents
  FOR UPDATE
  USING (true);

-- Policy: Admin users can view all consents
CREATE POLICY "Admin users can view all consents" ON payment_consents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt() ->> 'email'
      AND admin_users.is_active = true
    )
  );

-- Add comments for documentation
COMMENT ON TABLE payment_consents IS 'Tracks customer legal policy consent at payment time for POPIA compliance';
COMMENT ON COLUMN payment_consents.payment_transaction_id IS 'Reference to payment_transactions table';
COMMENT ON COLUMN payment_consents.terms_version IS 'Version of Terms & Conditions accepted (e.g., "2025-01-20")';
COMMENT ON COLUMN payment_consents.privacy_version IS 'Version of Privacy Policy accepted';
COMMENT ON COLUMN payment_consents.payment_terms_version IS 'Version of Payment Terms accepted';
COMMENT ON COLUMN payment_consents.refund_policy_version IS 'Version of Refund Policy acknowledged';
COMMENT ON COLUMN payment_consents.recurring_payment_authorized IS 'Customer authorized recurring payments (debit order)';
COMMENT ON COLUMN payment_consents.marketing_consent IS 'Customer opted in to marketing communications';
COMMENT ON COLUMN payment_consents.ip_address IS 'IP address of customer at time of consent';
COMMENT ON COLUMN payment_consents.consent_timestamp IS 'Exact timestamp when consent was given';
COMMENT ON COLUMN payment_consents.consent_type IS 'Type of consent flow (payment, quote, subscription, etc.)';

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_consents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_consents_updated_at_trigger
  BEFORE UPDATE ON payment_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_consents_updated_at();
