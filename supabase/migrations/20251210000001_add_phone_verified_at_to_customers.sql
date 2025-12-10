-- Migration: add_phone_verified_at_to_customers
-- Purpose: Enable phone OTP verification as a secondary authentication factor
-- This allows order creation with verified phone even without email verification

-- Add phone_verified_at column to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN customers.phone_verified_at IS 'Timestamp when phone number was verified via OTP. Enables order creation without email verification.';

-- Index for queries that check phone verification status
CREATE INDEX IF NOT EXISTS idx_customers_phone_verified ON customers(phone_verified_at)
WHERE phone_verified_at IS NOT NULL;
