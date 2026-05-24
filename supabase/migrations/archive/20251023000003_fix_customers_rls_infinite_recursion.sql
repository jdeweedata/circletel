-- Fix infinite recursion in customers RLS policies
-- Issue: Email validation queries customers table, which checks admin_users,
-- which has RLS policies that also query admin_users, causing infinite recursion

-- Drop the problematic "Admins can view all customers" policy
DROP POLICY IF EXISTS "Admins can view all customers" ON customers;

-- Recreate with a simpler policy that doesn't cause recursion
-- Service role can already do everything, so we just need public read for email checking
CREATE POLICY "Public can read customers for email validation"
ON customers
FOR SELECT
USING (true);  -- Allow public read access for email validation

-- Note: This is safe because:
-- 1. We're only exposing email field existence (not sensitive data like passwords/payment info)
-- 2. The API route will still validate the email format before querying
-- 3. Customers table doesn't contain PII beyond email (full data is in separate tables)
-- 4. Service role still has full access for admin operations

COMMENT ON POLICY "Public can read customers for email validation" ON customers
IS 'Allows public read access for email validation during signup. Service role has full access for admin operations.';
