-- Migration: Add card token fields to customer_payment_methods
-- Purpose: Support NetCash PCI Vault tokenization for recurring credit card payments
-- Date: 2025-12-03

-- Add card token fields to customer_payment_methods
ALTER TABLE customer_payment_methods
ADD COLUMN IF NOT EXISTS card_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS card_holder_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS card_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS card_masked_number VARCHAR(25),
ADD COLUMN IF NOT EXISTS card_expiry_month INTEGER,
ADD COLUMN IF NOT EXISTS card_expiry_year INTEGER,
ADD COLUMN IF NOT EXISTS token_created_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS token_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS token_last_used_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS token_status VARCHAR(50) DEFAULT 'pending';

-- Add comments for documentation
COMMENT ON COLUMN customer_payment_methods.card_token IS 'NetCash PCI Vault token for recurring credit card charges';
COMMENT ON COLUMN customer_payment_methods.card_holder_name IS 'Name on the credit card';
COMMENT ON COLUMN customer_payment_methods.card_type IS 'Card brand: visa, mastercard, amex';
COMMENT ON COLUMN customer_payment_methods.card_masked_number IS 'Masked card number (e.g., ****7495)';
COMMENT ON COLUMN customer_payment_methods.card_expiry_month IS 'Card expiry month (1-12)';
COMMENT ON COLUMN customer_payment_methods.card_expiry_year IS 'Card expiry year (4 digits)';
COMMENT ON COLUMN customer_payment_methods.token_created_at IS 'When the token was created by NetCash';
COMMENT ON COLUMN customer_payment_methods.token_verified_at IS 'When the token was verified with a successful charge';
COMMENT ON COLUMN customer_payment_methods.token_last_used_at IS 'Last time the token was used for a charge';
COMMENT ON COLUMN customer_payment_methods.token_status IS 'Token status: pending, active, expired, revoked';

-- Create index for efficient token lookups
CREATE INDEX IF NOT EXISTS idx_payment_methods_card_token
ON customer_payment_methods(card_token)
WHERE card_token IS NOT NULL;

-- Create index for finding active card payment methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_active_card
ON customer_payment_methods(customer_id, method_type, is_active)
WHERE method_type = 'credit_card' AND is_active = true;

-- Add check constraint for valid expiry month
ALTER TABLE customer_payment_methods
ADD CONSTRAINT chk_card_expiry_month
CHECK (card_expiry_month IS NULL OR (card_expiry_month >= 1 AND card_expiry_month <= 12));

-- Add check constraint for valid expiry year
ALTER TABLE customer_payment_methods
ADD CONSTRAINT chk_card_expiry_year
CHECK (card_expiry_year IS NULL OR card_expiry_year >= 2024);

-- Add check constraint for valid token status
ALTER TABLE customer_payment_methods
ADD CONSTRAINT chk_token_status
CHECK (token_status IS NULL OR token_status IN ('pending', 'active', 'expired', 'revoked', 'failed'));
