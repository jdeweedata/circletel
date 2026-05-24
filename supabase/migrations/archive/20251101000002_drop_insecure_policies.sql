-- =====================================================================
-- Drop Insecure Pre-Existing Policies
-- Generated: 2025-11-01
-- Purpose: Remove old policies that allow anon access to sensitive data
-- =====================================================================

-- CRITICAL: These policies were found allowing anonymous access to sensitive data
-- They must be dropped before the RLS security is effective

-- =====================================================================
-- CUSTOMERS TABLE - Drop insecure anon access
-- =====================================================================

-- This policy allows anon to read ALL customer data - VERY DANGEROUS!
DROP POLICY IF EXISTS "Public read for email validation" ON "public"."customers";

-- Remove any duplicate old policies (keep only our new secure ones)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "public"."customers";
DROP POLICY IF EXISTS "Enable read for own profile" ON "public"."customers";
DROP POLICY IF EXISTS "Enable update for own profile" ON "public"."customers";

-- Note: Our secure policies remain:
-- - "Customers can read own data" (auth.uid() = auth_user_id)
-- - "Customers can update own data" (auth.uid() = auth_user_id)
-- - "Service role full access to customers" (service_role only)

-- =====================================================================
-- Check other tables for similar insecure policies
-- =====================================================================

-- Drop any policies that allow anon SELECT with USING (true)
-- These are dangerous and allow anonymous users to read all data

-- Admin Users (check for anon access - should NEVER exist)
DROP POLICY IF EXISTS "Public read for admin validation" ON "public"."admin_users";
DROP POLICY IF EXISTS "Enable read access" ON "public"."admin_users";
DROP POLICY IF EXISTS "Public access" ON "public"."admin_users";

-- Consumer Orders
DROP POLICY IF EXISTS "Public read orders" ON "public"."consumer_orders";
DROP POLICY IF EXISTS "Enable read for all users" ON "public"."consumer_orders";
DROP POLICY IF EXISTS "Public access" ON "public"."consumer_orders";

-- Partners
DROP POLICY IF EXISTS "Public read partners" ON "public"."partners";
DROP POLICY IF EXISTS "Enable read for all users" ON "public"."partners";
DROP POLICY IF EXISTS "Public access" ON "public"."partners";

-- Partner Compliance Documents (VERY SENSITIVE!)
DROP POLICY IF EXISTS "Public read documents" ON "public"."partner_compliance_documents";
DROP POLICY IF EXISTS "Enable read for all users" ON "public"."partner_compliance_documents";
DROP POLICY IF EXISTS "Public access" ON "public"."partner_compliance_documents";

-- KYC Documents (VERY SENSITIVE!)
DROP POLICY IF EXISTS "Public read kyc" ON "public"."kyc_documents";
DROP POLICY IF EXISTS "Enable read for all users" ON "public"."kyc_documents";
DROP POLICY IF EXISTS "Public access" ON "public"."kyc_documents";

-- Business Quotes
DROP POLICY IF EXISTS "Public read quotes" ON "public"."business_quotes";
DROP POLICY IF EXISTS "Enable read for all users" ON "public"."business_quotes";
DROP POLICY IF EXISTS "Public access" ON "public"."business_quotes";

-- Coverage Leads (should allow anon INSERT only, not SELECT)
DROP POLICY IF EXISTS "Public read leads" ON "public"."coverage_leads";
DROP POLICY IF EXISTS "Enable read for all users" ON "public"."coverage_leads";

-- Orders (legacy)
DROP POLICY IF EXISTS "Public read orders" ON "public"."orders";
DROP POLICY IF EXISTS "Enable read for all users" ON "public"."orders";
DROP POLICY IF EXISTS "Public access" ON "public"."orders";

-- Role Templates (should be auth only)
DROP POLICY IF EXISTS "Public read roles" ON "public"."role_templates";
DROP POLICY IF EXISTS "Public access" ON "public"."role_templates";

-- =====================================================================
-- KEEP: These policies are intentionally public (product catalog)
-- =====================================================================

-- DO NOT DROP these - they are intentionally public:
-- - "Public can read service packages" ON service_packages
-- - "Public can read network providers" ON fttb_network_providers
-- - "Public can insert coverage leads" ON coverage_leads (INSERT only)

-- =====================================================================
-- VERIFICATION QUERY
-- =====================================================================

-- After running this migration, verify no policies allow anon SELECT except:
-- - service_packages (product catalog)
-- - fttb_network_providers (provider list)
--
-- Run this query to check:
--
-- SELECT tablename, policyname, roles, cmd, qual::text as using_clause
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND 'anon' = ANY(roles)
--   AND cmd = 'SELECT'
--   AND tablename NOT IN ('service_packages', 'fttb_network_providers')
-- ORDER BY tablename;
--
-- Expected result: NO ROWS (or only coverage_leads with specific conditions)

-- =====================================================================
-- NOTES:
-- =====================================================================
-- This migration removes insecure policies found in production
-- After applying, re-run security audit: node scripts/check-rls-security.js
-- All sensitive data should now be protected from anonymous access
-- =====================================================================
