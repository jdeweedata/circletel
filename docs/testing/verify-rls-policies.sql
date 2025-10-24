-- Verify RLS policies on customers table
-- Run this in Supabase Dashboard SQL Editor to check current policies

-- Check if RLS is enabled
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'customers';

-- List all policies on customers table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies
WHERE tablename = 'customers'
ORDER BY cmd, policyname;

-- Check grants on customers table
SELECT
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'customers'
  AND grantee IN ('authenticated', 'anon', 'service_role')
ORDER BY grantee, privilege_type;
