-- Migration: Add billing columns to consumer_orders table
-- Date: 2025-11-22
-- Purpose: Support custom billing start dates and pro-rata billing calculations

-- Add billing start date (separate from activation date)
ALTER TABLE consumer_orders
ADD COLUMN IF NOT EXISTS billing_start_date DATE;

COMMENT ON COLUMN consumer_orders.billing_start_date IS 'Date when billing starts (may be different from activation_date for free trial periods)';

-- Add next billing date (when the next charge will occur)
ALTER TABLE consumer_orders
ADD COLUMN IF NOT EXISTS next_billing_date DATE;

COMMENT ON COLUMN consumer_orders.next_billing_date IS 'Date of the next scheduled billing charge';

-- Add billing cycle day (1st, 5th, 15th, 25th of month)
ALTER TABLE consumer_orders
ADD COLUMN IF NOT EXISTS billing_cycle_day INTEGER;

COMMENT ON COLUMN consumer_orders.billing_cycle_day IS 'Day of the month for recurring billing (1, 5, 15, or 25)';

-- Add pro-rata amount (initial partial month charge)
ALTER TABLE consumer_orders
ADD COLUMN IF NOT EXISTS prorata_amount NUMERIC(10, 2) DEFAULT 0.00;

COMMENT ON COLUMN consumer_orders.prorata_amount IS 'Pro-rata charge for partial first billing period';

-- Add pro-rata days (number of days in partial period)
ALTER TABLE consumer_orders
ADD COLUMN IF NOT EXISTS prorata_days INTEGER DEFAULT 0;

COMMENT ON COLUMN consumer_orders.prorata_days IS 'Number of days in the pro-rata billing period';

-- Add index on next_billing_date for efficient billing queries
CREATE INDEX IF NOT EXISTS idx_consumer_orders_next_billing_date
ON consumer_orders(next_billing_date)
WHERE billing_active = true AND status = 'active';

COMMENT ON INDEX idx_consumer_orders_next_billing_date IS 'Optimize queries for finding orders due for billing';

-- Add index on billing_cycle_day for grouping by billing cycle
CREATE INDEX IF NOT EXISTS idx_consumer_orders_billing_cycle_day
ON consumer_orders(billing_cycle_day)
WHERE billing_active = true AND status = 'active';

COMMENT ON INDEX idx_consumer_orders_billing_cycle_day IS 'Optimize queries for grouping orders by billing cycle day';

-- Add constraint to ensure billing_cycle_day is valid (1, 5, 15, or 25)
ALTER TABLE consumer_orders
ADD CONSTRAINT check_billing_cycle_day
CHECK (billing_cycle_day IS NULL OR billing_cycle_day IN (1, 5, 15, 25));

-- Add constraint to ensure billing_start_date is not before activation_date
ALTER TABLE consumer_orders
ADD CONSTRAINT check_billing_start_after_activation
CHECK (billing_start_date IS NULL OR activation_date IS NULL OR billing_start_date >= activation_date);

-- Update existing active orders to set billing_start_date = activation_date if null
UPDATE consumer_orders
SET
  billing_start_date = activation_date,
  next_billing_date = activation_date + INTERVAL '1 month',
  billing_cycle_day = EXTRACT(DAY FROM activation_date)::INTEGER
WHERE
  status = 'active'
  AND billing_active = true
  AND activation_date IS NOT NULL
  AND billing_start_date IS NULL;

-- Verify the migration
DO $$
DECLARE
  v_column_count INTEGER;
BEGIN
  -- Check all columns were added
  SELECT COUNT(*) INTO v_column_count
  FROM information_schema.columns
  WHERE table_name = 'consumer_orders'
  AND column_name IN ('billing_start_date', 'next_billing_date', 'billing_cycle_day', 'prorata_amount', 'prorata_days');

  IF v_column_count = 5 THEN
    RAISE NOTICE '✓ Migration successful: All 5 billing columns added to consumer_orders';
  ELSE
    RAISE WARNING '⚠ Migration incomplete: Only % of 5 billing columns were added', v_column_count;
  END IF;
END $$;
