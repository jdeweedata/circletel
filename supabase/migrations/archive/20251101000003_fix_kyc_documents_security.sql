-- =====================================================================
-- Fix KYC Documents Security
-- Generated: 2025-11-01
-- Purpose: Remove dangerous policy allowing anon to read ALL KYC documents
-- =====================================================================

-- CRITICAL: This policy allows ANONYMOUS users to read ALL KYC documents!
-- KYC documents contain highly sensitive personal identification data

-- =====================================================================
-- Drop the DANGEROUS public read policy
-- =====================================================================

-- This is EXTREMELY DANGEROUS - allows anon to read all KYC docs!
DROP POLICY IF EXISTS "Allow public to select KYC documents" ON "public"."kyc_documents";

-- Also drop the public insert (redundant with secure customer policy)
DROP POLICY IF EXISTS "Allow public to insert KYC documents" ON "public"."kyc_documents";

-- Drop redundant service role policy (we have a better one)
DROP POLICY IF EXISTS "Service role can manage all kyc documents" ON "public"."kyc_documents";

-- =====================================================================
-- Secure policies that remain:
-- =====================================================================
-- ✅ "Users can read own kyc documents"
--    - authenticated only
--    - filters by consumer_order_id matching customer's orders
--
-- ✅ "Customers can view own kyc documents"
--    - public role but checks auth.uid() via customer email
--    - secure because it joins through consumer_orders and customers
--
-- ✅ "Customers can upload own kyc documents"
--    - public role but checks auth.uid() via customer email
--    - secure because it validates ownership
--
-- ✅ "Admins can read all kyc documents"
--    - authenticated only
--    - checks user is in admin_users table
--
-- ✅ "Allow admins to update KYC documents"
--    - authenticated only
--    - checks user is active admin
--
-- ✅ "Allow admins to delete KYC documents"
--    - authenticated only
--    - checks user is active admin
--
-- ✅ "Service role full access to kyc documents"
--    - service_role only
--    - for backend operations

-- =====================================================================
-- VERIFICATION
-- =====================================================================

-- After running, verify no policies allow anon SELECT:
--
-- SELECT policyname, roles, cmd, qual::text as using_clause
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename = 'kyc_documents'
--   AND 'anon' = ANY(roles)
--   AND cmd = 'SELECT';
--
-- Expected result: NO ROWS

-- Also verify the secure policies exist:
--
-- SELECT policyname, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename = 'kyc_documents'
-- ORDER BY policyname;
--
-- Expected: 7 policies, none allowing anon SELECT

-- =====================================================================
-- SECURITY IMPACT
-- =====================================================================
-- BEFORE: Anonymous users could read ALL KYC documents (identity theft risk!)
-- AFTER:  Only authenticated users can read their own KYC documents
--         Admins can read all (with proper authentication)
--         Service role for backend operations
-- =====================================================================
