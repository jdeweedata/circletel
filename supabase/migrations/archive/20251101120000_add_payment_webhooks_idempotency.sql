-- ============================================
-- Add payment_webhooks table for idempotency
-- ============================================
-- Purpose: Track processed NetCash webhooks to prevent duplicate processing
-- Created: 2025-11-01
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

CREATE POLICY "Admins can view payment webhooks"
ON payment_webhooks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND status = 'active'
  )
);

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
  END IF;
END $$;
