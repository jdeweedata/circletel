-- Add missing INSERT policy for admin_activity_log table
-- This allows the service role to insert audit logs during login
--
-- Issue: Login API was timing out because INSERT into admin_activity_log
-- was blocked by RLS (no INSERT policy existed)

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Service role can insert activity logs" ON admin_activity_log;
DROP POLICY IF EXISTS "Admins can insert their own activity" ON admin_activity_log;

-- Create INSERT policy for service role
-- This is critical for login API to write audit logs
CREATE POLICY "Service role can insert activity logs"
ON admin_activity_log
FOR INSERT
TO service_role
WITH CHECK (true);

-- Also create a policy for authenticated admins to insert their own activity
CREATE POLICY "Admins can insert their own activity"
ON admin_activity_log
FOR INSERT
TO authenticated
WITH CHECK (
  admin_user_id::text = auth.uid()::text
  OR EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
      AND admin_users.role = 'super_admin'
  )
);

-- Verify RLS is enabled
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Add helpful comments
COMMENT ON POLICY "Service role can insert activity logs" ON admin_activity_log IS
'Allows service role (backend API) to insert activity logs for audit trail during login and other operations';

COMMENT ON POLICY "Admins can insert their own activity" ON admin_activity_log IS
'Allows authenticated admins to log their own activities, and super admins to log any activity';

-- Verify the policies were created
SELECT
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'admin_activity_log'
ORDER BY cmd, policyname;
