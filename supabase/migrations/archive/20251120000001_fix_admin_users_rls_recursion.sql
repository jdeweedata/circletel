-- =====================================================================
-- Fix Admin Users RLS Infinite Recursion
-- Created: 2025-11-20
-- Purpose: Remove recursive RLS policies that cause infinite loops
-- =====================================================================

-- Drop the problematic policies that reference admin_users within admin_users policies
DROP POLICY IF EXISTS "Admins with permissions can insert admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins with permissions can update admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage role templates" ON role_templates;

-- Create security definer function to check admin status without triggering RLS
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function runs with elevated privileges (bypasses RLS)
  RETURN EXISTS (
    SELECT 1
    FROM admin_users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin', 'operations_manager', 'sales_manager')
    AND status = 'active'
  );
END;
$$;

-- Create security definer function to check super admin status
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_users
    WHERE id = auth.uid()
    AND role = 'super_admin'
    AND status = 'active'
  );
END;
$$;

-- Recreate INSERT policy using security definer function (no recursion)
CREATE POLICY "Admins can insert admin_users"
ON admin_users
FOR INSERT
TO authenticated
WITH CHECK (is_super_admin());

-- Recreate UPDATE policy using security definer function (no recursion)
CREATE POLICY "Admins can update admin_users"
ON admin_users
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id OR -- Can update own record
  is_super_admin()    -- Or is super admin
)
WITH CHECK (
  auth.uid() = id OR
  is_super_admin()
);

-- Fix role_templates policy to use security definer function
CREATE POLICY "Admins can manage role templates"
ON role_templates
FOR ALL
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;

-- =====================================================================
-- VERIFICATION
-- =====================================================================
-- Test that policies work:
-- SELECT * FROM admin_users WHERE is_active = true;
-- =====================================================================
