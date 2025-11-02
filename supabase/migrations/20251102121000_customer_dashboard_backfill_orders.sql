-- =============================================================================
-- Customer Dashboard Production Readiness - Phase 1: Data Backfill
-- Task Group 1.2: Data Backfill and Validation
-- =============================================================================
-- Description: Backfill customer_id and auth_user_id in existing consumer_orders
--              Handle orphaned records and validate data integrity
-- Version: 1.0
-- Created: 2025-11-02
-- =============================================================================

-- =============================================================================
-- 1. Create Validation Errors Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.validation_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    suggested_fix TEXT,
    record_details JSONB,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_validation_errors_table_name 
ON public.validation_errors(table_name);

CREATE INDEX IF NOT EXISTS idx_validation_errors_resolved 
ON public.validation_errors(resolved) WHERE NOT resolved;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.validation_errors TO service_role;
GRANT SELECT ON public.validation_errors TO authenticated;

-- =============================================================================
-- 2. Backfill customer_id in consumer_orders
-- =============================================================================

-- Backfill using email matching (most reliable)
WITH matched_orders AS (
    SELECT 
        co.id as order_id,
        c.id as customer_id,
        c.auth_user_id as auth_user_id
    FROM public.consumer_orders co
    INNER JOIN public.customers c ON LOWER(TRIM(co.email)) = LOWER(TRIM(c.email))
    WHERE co.customer_id IS NULL
)
UPDATE public.consumer_orders co
SET 
    customer_id = mo.customer_id,
    auth_user_id = mo.auth_user_id,
    updated_at = NOW()
FROM matched_orders mo
WHERE co.id = mo.order_id;

-- =============================================================================
-- 3. Identify and Log Orphaned Orders (No Matching Customer)
-- =============================================================================

INSERT INTO public.validation_errors (
    table_name,
    record_id,
    error_type,
    error_message,
    suggested_fix,
    record_details
)
SELECT 
    'consumer_orders' as table_name,
    co.id as record_id,
    'orphaned_order' as error_type,
    'Order has no matching customer record (email: ' || co.email || ')' as error_message,
    'Create customer record from order details or manually assign existing customer' as suggested_fix,
    jsonb_build_object(
        'order_number', co.order_number,
        'email', co.email,
        'first_name', co.first_name,
        'last_name', co.last_name,
        'phone', co.phone,
        'created_at', co.created_at,
        'status', co.status
    ) as record_details
FROM public.consumer_orders co
WHERE co.customer_id IS NULL
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 4. Validation Queries (for reporting)
-- =============================================================================

-- Query 1: Get backfill success rate
DO $$
DECLARE
    total_orders INTEGER;
    matched_orders INTEGER;
    orphaned_orders INTEGER;
    success_rate DECIMAL(5,2);
BEGIN
    SELECT COUNT(*) INTO total_orders FROM public.consumer_orders;
    SELECT COUNT(*) INTO matched_orders FROM public.consumer_orders WHERE customer_id IS NOT NULL;
    SELECT COUNT(*) INTO orphaned_orders FROM public.consumer_orders WHERE customer_id IS NULL;
    
    IF total_orders > 0 THEN
        success_rate := (matched_orders::DECIMAL / total_orders::DECIMAL) * 100;
    ELSE
        success_rate := 0;
    END IF;
    
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'BACKFILL VALIDATION REPORT';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Total Orders: %', total_orders;
    RAISE NOTICE 'Matched Orders: %', matched_orders;
    RAISE NOTICE 'Orphaned Orders: %', orphaned_orders;
    RAISE NOTICE 'Success Rate: %', success_rate || '%';
    RAISE NOTICE '=================================================================';
    
    IF success_rate < 95 THEN
        RAISE WARNING 'Success rate below 95%! Manual review required.';
    END IF;
END $$;

-- =============================================================================
-- 5. Create View for Orphaned Orders Report
-- =============================================================================

CREATE OR REPLACE VIEW public.v_orphaned_orders_report AS
SELECT 
    ve.id as error_id,
    ve.record_id as order_id,
    ve.record_details->>'order_number' as order_number,
    ve.record_details->>'email' as email,
    ve.record_details->>'first_name' as first_name,
    ve.record_details->>'last_name' as last_name,
    ve.record_details->>'phone' as phone,
    (ve.record_details->>'created_at')::TIMESTAMPTZ as order_created_at,
    ve.record_details->>'status' as order_status,
    ve.error_message,
    ve.suggested_fix,
    ve.resolved,
    ve.created_at as error_logged_at
FROM public.validation_errors ve
WHERE ve.table_name = 'consumer_orders'
  AND ve.error_type = 'orphaned_order'
  AND NOT ve.resolved
ORDER BY (ve.record_details->>'created_at')::TIMESTAMPTZ DESC;

-- Grant SELECT permission on view
GRANT SELECT ON public.v_orphaned_orders_report TO service_role, authenticated;

COMMENT ON VIEW public.v_orphaned_orders_report IS 
'Lists all consumer_orders that could not be matched to a customer record for manual review';

-- =============================================================================
-- 6. Helper Function: Create Customer from Orphaned Order
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_customer_from_order(p_order_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_customer_id UUID;
    v_order_record RECORD;
BEGIN
    -- Get order details
    SELECT * INTO v_order_record
    FROM public.consumer_orders
    WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found: %', p_order_id;
    END IF;
    
    -- Check if customer already exists
    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE LOWER(TRIM(email)) = LOWER(TRIM(v_order_record.email));
    
    IF FOUND THEN
        -- Customer exists, just link the order
        UPDATE public.consumer_orders
        SET customer_id = v_customer_id,
            updated_at = NOW()
        WHERE id = p_order_id;
        
        -- Mark validation error as resolved
        UPDATE public.validation_errors
        SET resolved = true,
            resolved_at = NOW()
        WHERE record_id = p_order_id
          AND table_name = 'consumer_orders'
          AND error_type = 'orphaned_order';
          
        RETURN v_customer_id;
    END IF;
    
    -- Create new customer from order details
    INSERT INTO public.customers (
        first_name,
        last_name,
        email,
        phone,
        account_type,
        account_status
        -- account_number will be auto-generated by trigger
    )
    VALUES (
        v_order_record.first_name,
        v_order_record.last_name,
        v_order_record.email,
        v_order_record.phone,
        'residential', -- Default to residential
        'active'
    )
    RETURNING id INTO v_customer_id;
    
    -- Link order to new customer
    UPDATE public.consumer_orders
    SET customer_id = v_customer_id,
        updated_at = NOW()
    WHERE id = p_order_id;
    
    -- Mark validation error as resolved
    UPDATE public.validation_errors
    SET resolved = true,
        resolved_at = NOW()
    WHERE record_id = p_order_id
      AND table_name = 'consumer_orders'
      AND error_type = 'orphaned_order';
    
    RETURN v_customer_id;
END;
$$;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION public.create_customer_from_order(UUID) TO service_role;

COMMENT ON FUNCTION public.create_customer_from_order(UUID) IS 
'Creates a customer record from an orphaned order and links them together';

-- =============================================================================
-- 7. Validation Checks
-- =============================================================================

-- Check 1: Verify all customer_id references are valid
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM public.consumer_orders co
    WHERE co.customer_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.customers c WHERE c.id = co.customer_id);
    
    IF invalid_count > 0 THEN
        RAISE WARNING 'Found % orders with invalid customer_id references!', invalid_count;
        
        -- Log as validation errors
        INSERT INTO public.validation_errors (
            table_name,
            record_id,
            error_type,
            error_message,
            suggested_fix
        )
        SELECT 
            'consumer_orders',
            co.id,
            'invalid_customer_id',
            'Order references non-existent customer_id: ' || co.customer_id,
            'Set customer_id to NULL or create missing customer record'
        FROM public.consumer_orders co
        WHERE co.customer_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM public.customers c WHERE c.id = co.customer_id)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Check 2: Verify auth_user_id consistency between customers and orders
DO $$
DECLARE
    inconsistent_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO inconsistent_count
    FROM public.consumer_orders co
    INNER JOIN public.customers c ON co.customer_id = c.id
    WHERE co.auth_user_id IS NOT NULL
      AND c.auth_user_id IS NOT NULL
      AND co.auth_user_id != c.auth_user_id;
    
    IF inconsistent_count > 0 THEN
        RAISE WARNING 'Found % orders with inconsistent auth_user_id!', inconsistent_count;
        
        -- Log as validation errors
        INSERT INTO public.validation_errors (
            table_name,
            record_id,
            error_type,
            error_message,
            suggested_fix
        )
        SELECT 
            'consumer_orders',
            co.id,
            'inconsistent_auth_user_id',
            'Order auth_user_id (' || co.auth_user_id || ') does not match customer auth_user_id (' || c.auth_user_id || ')',
            'Update order auth_user_id to match customer record'
        FROM public.consumer_orders co
        INNER JOIN public.customers c ON co.customer_id = c.id
        WHERE co.auth_user_id IS NOT NULL
          AND c.auth_user_id IS NOT NULL
          AND co.auth_user_id != c.auth_user_id
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =============================================================================
-- 8. Final Validation Summary
-- =============================================================================

DO $$
DECLARE
    total_errors INTEGER;
    orphaned_count INTEGER;
    invalid_fk_count INTEGER;
    inconsistent_auth_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_errors 
    FROM public.validation_errors 
    WHERE NOT resolved;
    
    SELECT COUNT(*) INTO orphaned_count 
    FROM public.validation_errors 
    WHERE error_type = 'orphaned_order' AND NOT resolved;
    
    SELECT COUNT(*) INTO invalid_fk_count 
    FROM public.validation_errors 
    WHERE error_type = 'invalid_customer_id' AND NOT resolved;
    
    SELECT COUNT(*) INTO inconsistent_auth_count 
    FROM public.validation_errors 
    WHERE error_type = 'inconsistent_auth_user_id' AND NOT resolved;
    
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'VALIDATION ERRORS SUMMARY';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Total Unresolved Errors: %', total_errors;
    RAISE NOTICE '  - Orphaned Orders: %', orphaned_count;
    RAISE NOTICE '  - Invalid Customer FK: %', invalid_fk_count;
    RAISE NOTICE '  - Inconsistent Auth User: %', inconsistent_auth_count;
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Review errors: SELECT * FROM public.v_orphaned_orders_report;';
    RAISE NOTICE 'Resolve orphaned order: SELECT create_customer_from_order(''<order_id>'');';
    RAISE NOTICE '=================================================================';
END $$;

-- =============================================================================
-- Migration Complete
-- =============================================================================
-- Next Steps:
-- 1. Review orphaned orders: SELECT * FROM v_orphaned_orders_report;
-- 2. Manually resolve issues using create_customer_from_order() function
-- 3. Proceed to Task 1.3 (customer_services, customer_billing tables)
-- =============================================================================
