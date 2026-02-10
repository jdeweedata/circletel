-- =============================================================================
-- Fix Invalid Due Dates in customer_invoices
-- =============================================================================
-- Description: Fixes invoices where due_date is NULL, Unix epoch (1970), or invalid
-- Created: 2026-02-10
-- Issue: Some invoices have due_date = '1970-01-01' (Unix epoch) or NULL
-- =============================================================================

-- 1. Find and report affected invoices
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO affected_count
  FROM customer_invoices
  WHERE due_date IS NULL OR due_date < '2000-01-01';

  RAISE NOTICE 'Found % invoices with invalid due_date', affected_count;
END $$;

-- 2. Fix invoices where due_date is invalid
-- Strategy: Set due_date = period_end + 1 day (typical billing date)
-- If period_end is also NULL, use invoice_date + 7 days
UPDATE customer_invoices
SET
  due_date = COALESCE(
    (period_end::date + INTERVAL '1 day')::date,
    (invoice_date::date + INTERVAL '7 days')::date
  ),
  updated_at = NOW()
WHERE due_date IS NULL OR due_date < '2000-01-01';

-- 3. Report fix results
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM customer_invoices
  WHERE due_date IS NULL OR due_date < '2000-01-01';

  IF remaining_count = 0 THEN
    RAISE NOTICE 'All invalid due_dates have been fixed';
  ELSE
    RAISE WARNING 'Still have % invoices with invalid due_date - manual review needed', remaining_count;
  END IF;
END $$;

-- 4. Add NOT NULL constraint if not already present
-- This prevents future NULL due_dates
DO $$
BEGIN
  -- Check if column already has NOT NULL constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customer_invoices'
    AND column_name = 'due_date'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE customer_invoices ALTER COLUMN due_date SET NOT NULL;
    RAISE NOTICE 'Added NOT NULL constraint to due_date column';
  ELSE
    RAISE NOTICE 'due_date column already has NOT NULL constraint';
  END IF;
END $$;

-- =============================================================================
-- Migration Complete
-- =============================================================================
