-- Add Ashwyn Watkins as Product Manager Admin
-- User ID: e1637830-fdb4-4e17-b98c-79930783e8b2
-- Email: watkins.ashwyn@gmail.com
-- Role: product_manager (can manage pricing/costs with approval workflow)
-- Date: 2025-11-28

-- Insert admin user record
INSERT INTO admin_users (
  id,
  email,
  full_name,
  role,
  role_template_id,
  department,
  job_title,
  permissions,
  custom_permissions,
  is_active,
  created_at,
  updated_at
)
VALUES (
  'e1637830-fdb4-4e17-b98c-79930783e8b2'::uuid,
  'watkins.ashwyn@gmail.com',
  'Ashwyn Watkins',
  'product_manager',
  'product_manager',
  'Product',
  'Product Manager',
  '{}'::jsonb,
  '[]'::jsonb,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'product_manager',
  role_template_id = 'product_manager',
  department = 'Product',
  job_title = 'Product Manager',
  is_active = true,
  updated_at = NOW();

-- Log the admin user creation in activity log
INSERT INTO admin_activity_log (
  admin_user_id,
  action,
  resource_type,
  resource_id,
  details
)
SELECT
  id,
  'admin_user_created',
  'admin_user',
  'e1637830-fdb4-4e17-b98c-79930783e8b2',
  jsonb_build_object(
    'email', 'watkins.ashwyn@gmail.com',
    'full_name', 'Ashwyn Watkins',
    'role_template', 'product_manager',
    'permissions_granted', ARRAY[
      'products:view',
      'products:create',
      'products:edit',
      'products:delete',
      'products:approve',
      'products:publish',
      'products:manage_pricing',
      'products:view_costs'
    ],
    'created_by', 'system_migration',
    'notes', 'Added as Product Manager with pricing/cost management capabilities'
  )
FROM admin_users
WHERE role_template_id = 'super_admin'
LIMIT 1;

-- Add comment for documentation
COMMENT ON TABLE admin_users IS 'Admin users table - Ashwyn Watkins (watkins.ashwyn@gmail.com) added as Product Manager on 2025-11-28';
