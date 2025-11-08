-- =============================================================================
-- Backfill Account Numbers for Existing Customers
-- =============================================================================
-- Description: Assign account numbers to existing customers who don't have one
-- Created: 2025-11-08
-- =============================================================================

-- Update existing customers without account numbers
DO $$
DECLARE
    customer_record RECORD;
BEGIN
    -- Loop through all customers without account numbers
    FOR customer_record IN
        SELECT id
        FROM public.customers
        WHERE account_number IS NULL
        ORDER BY created_at ASC -- Assign in order of creation
    LOOP
        -- Generate and assign account number
        UPDATE public.customers
        SET account_number = public.generate_account_number()
        WHERE id = customer_record.id;
    END LOOP;

    RAISE NOTICE 'Account numbers backfilled successfully';
END $$;

-- Verify backfill
DO $$
DECLARE
    missing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_count
    FROM public.customers
    WHERE account_number IS NULL;

    IF missing_count > 0 THEN
        RAISE WARNING 'Still have % customers without account numbers', missing_count;
    ELSE
        RAISE NOTICE 'All customers now have account numbers';
    END IF;
END $$;
