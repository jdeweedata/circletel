-- Create admin_users table for role-based access control
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'product_manager', 'editor', 'viewer')),
  permissions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Create index on role for filtering
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_users_updated_at_trigger
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();

-- Insert default admin user (password should be set via Supabase Auth)
INSERT INTO admin_users (email, full_name, role, permissions, is_active)
VALUES
  ('admin@circletel.co.za', 'Admin User', 'super_admin', '{"all": true}'::jsonb, true)
ON CONFLICT (email) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Admin users can read their own record
CREATE POLICY admin_users_select_own
  ON admin_users
  FOR SELECT
  USING (auth.uid()::text = id::text);

-- Policy: Super admins can read all admin users
CREATE POLICY admin_users_select_super_admin
  ON admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id::text = auth.uid()::text
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- Policy: Super admins can insert admin users
CREATE POLICY admin_users_insert_super_admin
  ON admin_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id::text = auth.uid()::text
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- Policy: Super admins can update admin users
CREATE POLICY admin_users_update_super_admin
  ON admin_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id::text = auth.uid()::text
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- Policy: Super admins can delete (soft delete by setting is_active = false)
CREATE POLICY admin_users_delete_super_admin
  ON admin_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id::text = auth.uid()::text
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- Create a view for active admin users
CREATE OR REPLACE VIEW active_admin_users AS
SELECT
  id,
  email,
  full_name,
  role,
  permissions,
  last_login,
  created_at,
  updated_at
FROM admin_users
WHERE is_active = true;

-- Grant permissions on the view
GRANT SELECT ON active_admin_users TO authenticated;

-- Create admin activity log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for admin activity log
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_user_id ON admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action ON admin_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);

-- Enable RLS on admin activity log
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view their own activity
CREATE POLICY admin_activity_log_select_own
  ON admin_activity_log
  FOR SELECT
  USING (auth.uid()::text = admin_user_id::text);

-- Policy: Super admins can view all activity
CREATE POLICY admin_activity_log_select_super_admin
  ON admin_activity_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id::text = auth.uid()::text
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_activity_log (
    admin_user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent
  )
  VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_details,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
