-- Add Supabase Auth integration to customers table
-- Links customer records to Supabase auth.users
-- Created: 2025-10-23

-- Add auth_user_id column to link to Supabase Auth
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add password_reset_token for custom password reset flow (optional)
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP WITH TIME ZONE;

-- Create unique index on auth_user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_auth_user_id ON customers(auth_user_id);

-- Update email_verified to sync with Supabase Auth
-- This will be updated by triggers when auth.users email is confirmed
ALTER TABLE customers
ALTER COLUMN email_verified SET DEFAULT FALSE;

-- Add last_login timestamp
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Comments
COMMENT ON COLUMN customers.auth_user_id IS 'References Supabase auth.users - links customer to authenticated user';
COMMENT ON COLUMN customers.email_verified IS 'Synced with Supabase Auth email confirmation status';
COMMENT ON COLUMN customers.last_login IS 'Timestamp of last successful login';

-- =====================================================
-- RLS POLICIES FOR CUSTOMER SELF-SERVICE
-- =====================================================

-- Drop existing service role policies if they exist
DROP POLICY IF EXISTS "Service role can manage customers" ON customers;

-- Customer can view their own record
CREATE POLICY "Customers can view own profile"
ON customers
FOR SELECT
USING (auth.uid() = auth_user_id);

-- Customer can update their own profile (except auth_user_id)
CREATE POLICY "Customers can update own profile"
ON customers
FOR UPDATE
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- Service role can do everything (for API routes)
CREATE POLICY "Service role can manage all customers"
ON customers
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Admin users can view all customers (for admin panel)
CREATE POLICY "Admins can view all customers"
ON customers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.email = auth.jwt() ->> 'email'
    AND admin_users.is_active = true
  )
);

-- =====================================================
-- ORDERS TABLE RLS POLICIES
-- =====================================================

-- Customer can view their own orders
CREATE POLICY "Customers can view own orders"
ON orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM customers
    WHERE customers.id = orders.customer_id
    AND customers.auth_user_id = auth.uid()
  )
);

-- Customer can create orders for themselves
CREATE POLICY "Customers can create own orders"
ON orders
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM customers
    WHERE customers.id = orders.customer_id
    AND customers.auth_user_id = auth.uid()
  )
);

-- Service role can manage all orders
CREATE POLICY "Service role can manage all orders"
ON orders
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- CONSUMER_ORDERS TABLE RLS POLICIES
-- =====================================================

-- Check if consumer_orders table exists and add policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'consumer_orders') THEN

    -- Enable RLS if not already enabled
    ALTER TABLE consumer_orders ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Customers can view own consumer orders" ON consumer_orders;
    DROP POLICY IF EXISTS "Service role can manage all consumer orders" ON consumer_orders;

    -- Customer can view their own consumer orders
    EXECUTE 'CREATE POLICY "Customers can view own consumer orders"
    ON consumer_orders
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM customers
        WHERE customers.email = consumer_orders.email
        AND customers.auth_user_id = auth.uid()
      )
    )';

    -- Service role can manage all consumer orders
    EXECUTE 'CREATE POLICY "Service role can manage all consumer orders"
    ON consumer_orders
    FOR ALL
    USING (auth.role() = ''service_role'')
    WITH CHECK (auth.role() = ''service_role'')';

  END IF;
END $$;

-- =====================================================
-- KYC_DOCUMENTS TABLE RLS POLICIES
-- =====================================================

-- Check if kyc_documents table exists and add policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'kyc_documents') THEN

    -- Enable RLS if not already enabled
    ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Customers can view own kyc documents" ON kyc_documents;
    DROP POLICY IF EXISTS "Customers can upload own kyc documents" ON kyc_documents;
    DROP POLICY IF EXISTS "Service role can manage all kyc documents" ON kyc_documents;

    -- Customer can view their own KYC documents
    EXECUTE 'CREATE POLICY "Customers can view own kyc documents"
    ON kyc_documents
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM consumer_orders
        JOIN customers ON customers.email = consumer_orders.email
        WHERE kyc_documents.order_id = consumer_orders.id
        AND customers.auth_user_id = auth.uid()
      )
    )';

    -- Customer can upload KYC documents for their own orders
    EXECUTE 'CREATE POLICY "Customers can upload own kyc documents"
    ON kyc_documents
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM consumer_orders
        JOIN customers ON customers.email = consumer_orders.email
        WHERE kyc_documents.order_id = consumer_orders.id
        AND customers.auth_user_id = auth.uid()
      )
    )';

    -- Service role can manage all KYC documents
    EXECUTE 'CREATE POLICY "Service role can manage all kyc documents"
    ON kyc_documents
    FOR ALL
    USING (auth.role() = ''service_role'')
    WITH CHECK (auth.role() = ''service_role'')';

  END IF;
END $$;

-- =====================================================
-- HELPER FUNCTION: Sync email_verified from auth.users
-- =====================================================

CREATE OR REPLACE FUNCTION sync_customer_email_verified()
RETURNS TRIGGER AS $$
BEGIN
  -- When auth.users email is confirmed, update customer record
  IF NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at != NEW.email_confirmed_at) THEN
    UPDATE customers
    SET email_verified = TRUE,
        updated_at = NOW()
    WHERE auth_user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users (if not exists)
DROP TRIGGER IF EXISTS sync_customer_email_on_confirm ON auth.users;
CREATE TRIGGER sync_customer_email_on_confirm
AFTER UPDATE ON auth.users
FOR EACH ROW
WHEN (NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION sync_customer_email_verified();

-- =====================================================
-- HELPER FUNCTION: Update last_login on successful login
-- =====================================================

CREATE OR REPLACE FUNCTION update_customer_last_login()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_login when user logs in (last_sign_in_at changes)
  IF NEW.last_sign_in_at IS NOT NULL AND (OLD.last_sign_in_at IS NULL OR OLD.last_sign_in_at != NEW.last_sign_in_at) THEN
    UPDATE customers
    SET last_login = NEW.last_sign_in_at,
        updated_at = NOW()
    WHERE auth_user_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users for last_login
DROP TRIGGER IF EXISTS update_customer_last_login_on_signin ON auth.users;
CREATE TRIGGER update_customer_last_login_on_signin
AFTER UPDATE ON auth.users
FOR EACH ROW
WHEN (NEW.last_sign_in_at IS NOT NULL)
EXECUTE FUNCTION update_customer_last_login();

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant authenticated users access to their own customer data
GRANT SELECT, UPDATE ON customers TO authenticated;
GRANT SELECT ON orders TO authenticated;
GRANT SELECT ON kyc_documents TO authenticated;

-- Service role already has full access
-- No additional grants needed

COMMENT ON TABLE customers IS 'Customer records linked to Supabase Auth with RLS for self-service portal';
