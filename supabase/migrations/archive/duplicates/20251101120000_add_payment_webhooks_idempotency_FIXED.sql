-- ============================================
-- Add payment_webhooks table for idempotency (FIXED)
-- ============================================
-- Purpose: Track processed NetCash webhooks to prevent duplicate processing
-- Created: 2025-11-01
-- Fixed: Removed problematic status check in RLS policy
-- Task: Task Group 10 - Payment Webhook Handler

-- Create payment_webhooks table (if not exists)
CREATE TABLE IF NOT EXISTS payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_transaction_id 
ON payment_webhooks(transaction_id);

-- RLS Policies (admins only)
ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Admins can view payment webhooks" ON payment_webhooks;

-- Create policy using the user_is_admin() function (created in previous migration)
CREATE POLICY "Admins can view payment webhooks"
ON payment_webhooks
FOR SELECT
TO authenticated
USING (user_is_admin());

-- Service role can do all operations
DROP POLICY IF EXISTS "Service role can manage payment webhooks" ON payment_webhooks;

CREATE POLICY "Service role can manage payment webhooks"
ON payment_webhooks
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Add contract_id to consumer_orders if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'consumer_orders' 
    AND column_name = 'contract_id'
  ) THEN
    ALTER TABLE consumer_orders 
    ADD COLUMN contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL;
    
    -- Add index for performance
    CREATE INDEX IF NOT EXISTS idx_consumer_orders_contract_id 
    ON consumer_orders(contract_id);
  END IF;
END $$;

-- Comments for documentation
COMMENT ON TABLE payment_webhooks IS 'Idempotency tracking for NetCash payment webhooks';
COMMENT ON COLUMN payment_webhooks.transaction_id IS 'Unique transaction ID from NetCash (idempotency key)';
COMMENT ON COLUMN payment_webhooks.payload IS 'Complete webhook payload for debugging';
