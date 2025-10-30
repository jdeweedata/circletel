-- Fix infinite recursion in admin_users RLS policies
-- The issue: policies were querying admin_users table within their own checks
-- Solution: Use service role bypass or simpler auth checks

-- Drop all existing RLS policies on admin_users
DROP POLICY IF EXISTS admin_users_select_own ON admin_users;
DROP POLICY IF EXISTS admin_users_select_super_admin ON admin_users;
DROP POLICY IF EXISTS admin_users_insert_super_admin ON admin_users;
DROP POLICY IF EXISTS admin_users_update_super_admin ON admin_users;
DROP POLICY IF EXISTS admin_users_delete_super_admin ON admin_users;

-- Disable RLS on admin_users to allow service role access
-- The application will handle authorization in the API routes
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Alternative: If we need RLS, use a simpler approach without self-reference
-- Create a function to check admin role (cached, no recursion)
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- This will be called by service role, so no RLS check
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id::text = auth.uid()::text
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- If RLS is needed in the future, use this function instead:
-- CREATE POLICY admin_users_select_authenticated
--   ON admin_users
--   FOR SELECT
--   USING (is_admin_user());

COMMENT ON FUNCTION is_admin_user() IS 'Check if current user is an active admin without causing RLS recursion';
