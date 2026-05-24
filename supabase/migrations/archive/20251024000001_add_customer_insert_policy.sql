-- Add INSERT policy for customers table to allow new user signup
-- Issue: Users can authenticate but can't create their customer record due to missing INSERT policy
-- Created: 2025-10-24

-- Enable RLS on customers table (should already be enabled, but ensure it)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Drop the policy if it already exists (for idempotency)
DROP POLICY IF EXISTS "Authenticated users can create own customer record" ON customers;

-- Allow authenticated users to INSERT their own customer record
-- This is needed during signup flow when auth.users record exists but customer record doesn't
CREATE POLICY "Authenticated users can create own customer record"
ON customers
FOR INSERT
TO authenticated
WITH CHECK (
  -- User can only insert a record with their own auth_user_id
  auth.uid() = auth_user_id
);

-- Also grant INSERT permission to authenticated users
GRANT INSERT ON customers TO authenticated;

-- Add comment for documentation
COMMENT ON POLICY "Authenticated users can create own customer record" ON customers
IS 'Allows authenticated users to create their customer profile during signup. Users can only create records linked to their own auth_user_id.';

-- Verify the policy by listing all policies on customers table
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'customers';

  RAISE NOTICE 'Total RLS policies on customers table: %', policy_count;
END $$;
