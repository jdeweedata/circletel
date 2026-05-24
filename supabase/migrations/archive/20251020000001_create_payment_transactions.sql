-- Create payment_transactions table for tracking all payment transactions
-- Supports multiple payment providers (Netcash, PayFast, etc.)

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Order Reference
  order_id UUID NOT NULL, -- Generic reference to any order type
  order_type VARCHAR(50) NOT NULL, -- 'consumer', 'business', etc.
  order_number VARCHAR(100) NOT NULL,

  -- Transaction Details
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ZAR' NOT NULL,

  -- Payment Provider
  payment_provider VARCHAR(50) NOT NULL, -- 'netcash', 'payfast', etc.
  provider_reference VARCHAR(255), -- Transaction reference from provider
  provider_transaction_id VARCHAR(255), -- Provider's internal transaction ID

  -- Status
  status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
  payment_method VARCHAR(50), -- 'card', 'eft', 'credit', etc.

  -- Customer Info
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),

  -- Timestamps
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,

  -- Additional Data
  metadata JSONB DEFAULT '{}', -- Flexible storage for provider-specific data
  failure_reason TEXT,
  refund_reason TEXT,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id, order_type);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_number ON payment_transactions(order_number);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_ref ON payment_transactions(provider_reference);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer_email ON payment_transactions(customer_email);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created ON payment_transactions(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_transactions_updated_at();

-- Comments
COMMENT ON TABLE payment_transactions IS 'Stores all payment transactions across different order types and payment providers';
COMMENT ON COLUMN payment_transactions.order_type IS 'Type of order: consumer, business, etc.';
COMMENT ON COLUMN payment_transactions.status IS 'Transaction status: pending, completed, failed, refunded';
COMMENT ON COLUMN payment_transactions.payment_provider IS 'Payment gateway used: netcash, payfast, etc.';
COMMENT ON COLUMN payment_transactions.provider_reference IS 'Unique transaction reference from payment provider';
