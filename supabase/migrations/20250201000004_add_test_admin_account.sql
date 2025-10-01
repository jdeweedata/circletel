-- Add test admin account for development
-- NOTE: This creates a user in the admin_users table
-- The actual Supabase Auth user must be created separately via Supabase dashboard or API

-- Insert test admin user (Super Admin)
INSERT INTO admin_users (
  id,
  email,
  full_name,
  role,
  permissions,
  is_active
)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'admin@circletel.co.za',
  'Test Admin User',
  'super_admin',
  '{"all": true}'::jsonb,
  true
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active;

-- Insert test product manager
INSERT INTO admin_users (
  id,
  email,
  full_name,
  role,
  permissions,
  is_active
)
VALUES (
  'a0000000-0000-0000-0000-000000000002'::uuid,
  'product.manager@circletel.co.za',
  'Test Product Manager',
  'product_manager',
  '{"products": {"read": true, "write": true, "approve": true}, "coverage": {"read": true, "write": true}}'::jsonb,
  true
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active;

-- Insert test editor
INSERT INTO admin_users (
  id,
  email,
  full_name,
  role,
  permissions,
  is_active
)
VALUES (
  'a0000000-0000-0000-0000-000000000003'::uuid,
  'editor@circletel.co.za',
  'Test Editor',
  'editor',
  '{"products": {"read": true, "write": true}, "coverage": {"read": true}}'::jsonb,
  true
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active;

-- Insert test viewer
INSERT INTO admin_users (
  id,
  email,
  full_name,
  role,
  permissions,
  is_active
)
VALUES (
  'a0000000-0000-0000-0000-000000000004'::uuid,
  'viewer@circletel.co.za',
  'Test Viewer',
  'viewer',
  '{"products": {"read": true}, "coverage": {"read": true}}'::jsonb,
  true
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active;

-- Create a function to help create Supabase Auth users programmatically
-- Note: This can only be called from Edge Functions with service role key
CREATE OR REPLACE FUNCTION create_admin_auth_user(
  p_email TEXT,
  p_password TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- This is a helper function that documents the process
  -- Actual user creation must be done via Supabase Auth Admin API
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Use Supabase Auth Admin API to create users',
    'instructions', jsonb_build_object(
      'email', p_email,
      'password', p_password,
      'user_id', COALESCE(p_user_id, gen_random_uuid()),
      'endpoint', 'POST /auth/v1/admin/users'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Document test accounts
COMMENT ON TABLE admin_users IS 'Admin users table. Test accounts:
- admin@circletel.co.za (super_admin) - Password: admin123
- product.manager@circletel.co.za (product_manager) - Password: pm123
- editor@circletel.co.za (editor) - Password: editor123
- viewer@circletel.co.za (viewer) - Password: viewer123

NOTE: Passwords must be set in Supabase Auth via Dashboard or Admin API';
