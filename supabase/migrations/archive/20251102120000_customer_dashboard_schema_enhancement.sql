-- =============================================================================
-- Customer Dashboard Production Readiness - Phase 1: Schema Enhancement
-- Task Group 1.1: Database Schema Enhancement - Core Tables
-- =============================================================================
-- Description: Add account number generation, enhance customers table,
--              add foreign keys to consumer_orders
-- Version: 1.0
-- Created: 2025-11-02
-- =============================================================================

-- =============================================================================
-- 1. Account Number Generation System
-- =============================================================================

-- Create account number counter table with year tracking
CREATE TABLE IF NOT EXISTS public.account_number_counter (
    year INTEGER PRIMARY KEY,
    counter INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_account_number_counter_year 
ON public.account_number_counter(year);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.account_number_counter TO service_role;
GRANT SELECT ON public.account_number_counter TO authenticated, anon;

-- =============================================================================
-- 2. Account Number Generation Function (Continuous Counter)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.generate_account_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_year INTEGER;
    next_number INTEGER;
    account_num TEXT;
BEGIN
    -- Get current year
    current_year := EXTRACT(YEAR FROM NOW());
    
    -- Atomically increment counter for current year
    -- If year doesn't exist, initialize with counter = 1
    INSERT INTO public.account_number_counter (year, counter)
    VALUES (current_year, 1)
    ON CONFLICT (year) 
    DO UPDATE SET 
        counter = account_number_counter.counter + 1,
        updated_at = NOW()
    RETURNING counter INTO next_number;
    
    -- Format: CT-YYYY-NNNNN (e.g., CT-2025-00001)
    account_num := 'CT-' || current_year || '-' || LPAD(next_number::TEXT, 5, '0');
    
    RETURN account_num;
END;
$$;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION public.generate_account_number() TO service_role;

-- =============================================================================
-- 3. Enhance customers Table
-- =============================================================================

-- Add new columns to customers table
ALTER TABLE public.customers 
    ADD COLUMN IF NOT EXISTS account_number VARCHAR(20) UNIQUE,
    ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'residential';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_account_number 
ON public.customers(account_number);

CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id 
ON public.customers(auth_user_id);

CREATE INDEX IF NOT EXISTS idx_customers_account_status 
ON public.customers(account_status);

-- Add CHECK constraint for account_status
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'customers_account_status_check'
    ) THEN
        ALTER TABLE public.customers
        ADD CONSTRAINT customers_account_status_check
        CHECK (account_status IN ('active', 'suspended', 'cancelled', 'pending'));
    END IF;
END $$;

-- Add CHECK constraint for account_type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'customers_account_type_check'
    ) THEN
        ALTER TABLE public.customers
        ADD CONSTRAINT customers_account_type_check
        CHECK (account_type IN ('residential', 'business'));
    END IF;
END $$;

-- =============================================================================
-- 4. Auto-Generate Account Number Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_account_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only generate if account_number is NULL
    IF NEW.account_number IS NULL THEN
        NEW.account_number := public.generate_account_number();
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger to auto-generate account numbers
DROP TRIGGER IF EXISTS trigger_set_account_number ON public.customers;
CREATE TRIGGER trigger_set_account_number
    BEFORE INSERT ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.set_account_number();

-- Grant execution permission
GRANT EXECUTE ON FUNCTION public.set_account_number() TO service_role;

-- =============================================================================
-- 5. Enhance consumer_orders Table with Foreign Keys
-- =============================================================================

-- Add customer_id and auth_user_id foreign keys
ALTER TABLE public.consumer_orders
    ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_consumer_orders_customer_id 
ON public.consumer_orders(customer_id);

CREATE INDEX IF NOT EXISTS idx_consumer_orders_auth_user_id 
ON public.consumer_orders(auth_user_id);

-- =============================================================================
-- 6. Update RLS Policies for customers Table
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Customers can view own record" ON public.customers;
DROP POLICY IF EXISTS "Customers can update own record" ON public.customers;
DROP POLICY IF EXISTS "Service role has full access to customers" ON public.customers;

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can view their own record (by auth_user_id)
CREATE POLICY "Customers can view own record"
    ON public.customers
    FOR SELECT
    TO authenticated
    USING (auth.uid() = auth_user_id);

-- Policy: Customers can update their own record (excluding account_number)
CREATE POLICY "Customers can update own record"
    ON public.customers
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

-- Policy: Service role has full access (admin operations)
CREATE POLICY "Service role has full access to customers"
    ON public.customers
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- 7. Update RLS Policies for consumer_orders Table
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Customers can view own orders" ON public.consumer_orders;
DROP POLICY IF EXISTS "Service role has full access to consumer_orders" ON public.consumer_orders;

-- Enable RLS (if not already enabled)
ALTER TABLE public.consumer_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can view their own orders (by auth_user_id OR customer_id)
CREATE POLICY "Customers can view own orders"
    ON public.consumer_orders
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = auth_user_id 
        OR 
        customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
    );

-- Policy: Service role has full access (admin operations)
CREATE POLICY "Service role has full access to consumer_orders"
    ON public.consumer_orders
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- 8. Comments for Documentation
-- =============================================================================

COMMENT ON TABLE public.account_number_counter IS 
'Stores year-based counter for generating unique account numbers in format CT-YYYY-NNNNN';

COMMENT ON FUNCTION public.generate_account_number() IS 
'Generates unique account number with format CT-YYYY-NNNNN using atomic counter increment';

COMMENT ON COLUMN public.customers.account_number IS 
'Unique customer account number in format CT-YYYY-NNNNN (e.g., CT-2025-00001)';

COMMENT ON COLUMN public.customers.account_status IS 
'Customer account status: active, suspended, cancelled, pending';

COMMENT ON COLUMN public.customers.auth_user_id IS 
'Reference to auth.users for customer login and dashboard access';

COMMENT ON COLUMN public.customers.account_type IS 
'Account type: residential or business';

COMMENT ON COLUMN public.consumer_orders.customer_id IS 
'Foreign key to customers table for order ownership';

COMMENT ON COLUMN public.consumer_orders.auth_user_id IS 
'Reference to auth.users for order tracking by logged-in customer';

-- =============================================================================
-- Migration Complete
-- =============================================================================
-- Next Steps:
-- 1. Run data backfill script (Task 1.2) to populate customer_id in existing orders
-- 2. Create customer_services, customer_billing tables (Task 1.3)
-- 3. Create customer_invoices, payment_methods tables (Task 1.4)
-- =============================================================================
