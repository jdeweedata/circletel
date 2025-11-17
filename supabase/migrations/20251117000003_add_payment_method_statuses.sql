-- ============================================================================
-- Add Payment Method Registration Statuses to order_status Enum
-- ============================================================================
-- Description: Adds missing payment method statuses that are referenced in the
--              validate_order_status_transition_simplified() function but were
--              never added to the order_status enum
-- Date: 2025-11-17
-- Author: CircleTel Development Team
-- ============================================================================

-- Add payment_method_pending status (after kyc_approved)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'payment_method_pending'
    AND enumtypid = 'order_status'::regtype
  ) THEN
    ALTER TYPE order_status ADD VALUE 'payment_method_pending' AFTER 'kyc_approved';
  END IF;
END $$;

-- Add payment_method_registered status (after payment_method_pending)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'payment_method_registered'
    AND enumtypid = 'order_status'::regtype
  ) THEN
    ALTER TYPE order_status ADD VALUE 'payment_method_registered' AFTER 'payment_method_pending';
  END IF;
END $$;

-- Add suspended status (after active, if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'suspended'
    AND enumtypid = 'order_status'::regtype
  ) THEN
    ALTER TYPE order_status ADD VALUE 'suspended' AFTER 'active';
  END IF;
END $$;

-- Verify the new statuses were added
SELECT enumlabel as status_value
FROM pg_enum
WHERE enumtypid = 'order_status'::regtype
ORDER BY enumsortorder;
