-- Add composite indexes for consumer_orders performance optimization
-- These indexes improve query performance for the payment-method page API calls

-- Composite index for pending orders query (email + status + payment_status)
-- Used by: /api/orders/pending
CREATE INDEX IF NOT EXISTS idx_consumer_orders_pending_lookup
ON consumer_orders(email, status, payment_status)
WHERE status = 'pending' AND payment_status = 'pending';

-- Composite index for payment method check (email + payment_status)
-- Used by: /api/payment/method/check
CREATE INDEX IF NOT EXISTS idx_consumer_orders_payment_check
ON consumer_orders(email, payment_status)
WHERE payment_status = 'completed';

-- Add index on payment_status for general queries
CREATE INDEX IF NOT EXISTS idx_consumer_orders_payment_status
ON consumer_orders(payment_status);

COMMENT ON INDEX idx_consumer_orders_pending_lookup IS
'Optimizes queries for pending orders by email. Partial index reduces size by only indexing pending records.';

COMMENT ON INDEX idx_consumer_orders_payment_check IS
'Optimizes queries checking if customer has completed payment. Partial index for completed payments only.';

COMMENT ON INDEX idx_consumer_orders_payment_status IS
'General index for payment status filtering across all queries.';
