-- Migration: Add index for payment method query optimization
-- Date: 2025-11-10
-- Purpose: Fix timeout issues in payment method checks by optimizing
--          consumer_orders query performance on (email, payment_status)

-- Create partial index on consumer_orders for completed payments
-- This index speeds up queries checking if a customer has completed payments
-- Used by: /api/payment/method/check endpoint
CREATE INDEX IF NOT EXISTS idx_consumer_orders_email_payment_completed
ON consumer_orders(email, payment_status)
WHERE payment_status = 'completed';

-- Add comment for documentation
COMMENT ON INDEX idx_consumer_orders_email_payment_completed IS
'Partial index for fast payment method validation queries. Used to check if customer has completed orders when enabling stored payment methods.';

-- Analyze table to update query planner statistics
ANALYZE consumer_orders;
