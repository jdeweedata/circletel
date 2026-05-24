-- ============================================
-- RBAC System: Role Templates & Permissions
-- ============================================

-- Create role_templates table
CREATE TABLE IF NOT EXISTS role_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  department TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('executive', 'management', 'staff', 'support')),
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_role_templates_department ON role_templates(department);
CREATE INDEX IF NOT EXISTS idx_role_templates_level ON role_templates(level);
CREATE INDEX IF NOT EXISTS idx_role_templates_is_default ON role_templates(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_role_templates_is_active ON role_templates(is_active);

-- Create trigger for updated_at
CREATE TRIGGER role_templates_updated_at_trigger
  BEFORE UPDATE ON role_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();

-- Update admin_users table to support new RBAC
ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS role_template_id TEXT REFERENCES role_templates(id),
ADD COLUMN IF NOT EXISTS custom_permissions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS job_title TEXT;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_admin_users_role_template_id ON admin_users(role_template_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_department ON admin_users(department);

-- Function to get effective permissions for a user
CREATE OR REPLACE FUNCTION get_user_permissions(user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_permissions JSONB;
  v_template_permissions JSONB;
  v_custom_permissions JSONB;
BEGIN
  -- Get user's role template permissions
  SELECT COALESCE(rt.permissions, '[]'::jsonb)
  INTO v_template_permissions
  FROM admin_users au
  LEFT JOIN role_templates rt ON rt.id = au.role_template_id
  WHERE au.id = user_id;

  -- Get user's custom permissions
  SELECT COALESCE(custom_permissions, '[]'::jsonb)
  INTO v_custom_permissions
  FROM admin_users
  WHERE id = user_id;

  -- Merge permissions (custom permissions override template)
  v_permissions := v_template_permissions || v_custom_permissions;

  RETURN v_permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
  user_id UUID,
  permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_permissions JSONB;
BEGIN
  v_permissions := get_user_permissions(user_id);
  RETURN v_permissions ? permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default role templates
INSERT INTO role_templates (id, name, description, department, level, permissions, is_default, color, icon)
VALUES
  -- Executive
  ('super_admin', 'Super Administrator', 'Complete system access for system administrators', 'IT', 'executive',
   '["dashboard:view","dashboard:view_analytics","dashboard:view_reports","dashboard:export_data","products:view","products:create","products:edit","products:delete","products:approve","products:publish","products:manage_pricing","products:view_costs","coverage:view","coverage:edit","coverage:manage_providers","coverage:run_tests","coverage:view_analytics","customers:view","customers:edit","customers:delete","customers:view_personal_info","customers:export","orders:view","orders:create","orders:edit","orders:cancel","orders:process","orders:refund","billing:view","billing:manage_invoices","billing:process_payments","billing:view_revenue","billing:manage_subscriptions","billing:export_reports","finance:view_all","finance:approve_expenses","finance:manage_budgets","finance:view_profit_loss","finance:export_financial_data","cms:view","cms:create","cms:edit","cms:publish","cms:delete","marketing:view","marketing:create_campaigns","marketing:edit_campaigns","marketing:manage_promotions","marketing:view_analytics","sales:view","sales:manage_leads","sales:view_pipeline","sales:close_deals","sales:view_commissions","operations:view","operations:manage_workflows","operations:manage_inventory","operations:manage_logistics","support:view_tickets","support:respond_tickets","support:close_tickets","support:view_customer_history","integrations:view","integrations:configure","integrations:manage_zoho","integrations:manage_api_keys","users:view","users:create","users:edit","users:delete","users:manage_roles","users:view_activity","access_requests:view","access_requests:approve","access_requests:reject","system:view_logs","system:manage_settings","system:manage_security","system:perform_backups","system:view_audit_trail"]'::jsonb,
   true, 'red', 'Shield'),

  ('ceo', 'Chief Executive Officer', 'Full system access with all permissions', 'Executive', 'executive',
   '["dashboard:view","dashboard:view_analytics","dashboard:view_reports","dashboard:export_data","products:view","products:create","products:edit","products:delete","products:approve","products:publish","products:manage_pricing","products:view_costs","coverage:view","coverage:edit","coverage:manage_providers","coverage:run_tests","coverage:view_analytics","customers:view","customers:edit","customers:delete","customers:view_personal_info","customers:export","orders:view","orders:create","orders:edit","orders:cancel","orders:process","orders:refund","billing:view","billing:manage_invoices","billing:process_payments","billing:view_revenue","billing:manage_subscriptions","billing:export_reports","finance:view_all","finance:approve_expenses","finance:manage_budgets","finance:view_profit_loss","finance:export_financial_data","cms:view","cms:create","cms:edit","cms:publish","cms:delete","marketing:view","marketing:create_campaigns","marketing:edit_campaigns","marketing:manage_promotions","marketing:view_analytics","sales:view","sales:manage_leads","sales:view_pipeline","sales:close_deals","sales:view_commissions","operations:view","operations:manage_workflows","operations:manage_inventory","operations:manage_logistics","support:view_tickets","support:respond_tickets","support:close_tickets","support:view_customer_history","integrations:view","integrations:configure","integrations:manage_zoho","integrations:manage_api_keys","users:view","users:create","users:edit","users:delete","users:manage_roles","users:view_activity","access_requests:view","access_requests:approve","access_requests:reject","system:view_logs","system:manage_settings","system:manage_security","system:perform_backups","system:view_audit_trail"]'::jsonb,
   false, 'purple', 'Crown'),

  -- Product Management
  ('product_manager', 'Product Manager', 'Manages product catalog, pricing, and approvals', 'Product', 'management',
   '["dashboard:view","dashboard:view_analytics","products:view","products:create","products:edit","products:delete","products:approve","products:publish","products:manage_pricing","products:view_costs","coverage:view","coverage:view_analytics","cms:view","cms:edit","orders:view","customers:view"]'::jsonb,
   true, 'orange', 'Package'),

  -- Sales
  ('sales_manager', 'Sales Manager', 'Manages sales team, pipeline, and revenue targets', 'Sales', 'management',
   '["dashboard:view","dashboard:view_analytics","sales:view","sales:manage_leads","sales:view_pipeline","sales:close_deals","sales:view_commissions","customers:view","customers:edit","orders:view","orders:create","products:view","billing:view","billing:view_revenue"]'::jsonb,
   false, 'rose', 'Target'),

  ('sales_rep', 'Sales Representative', 'Handles customer sales, leads, and order creation', 'Sales', 'staff',
   '["dashboard:view","sales:view","sales:manage_leads","sales:view_pipeline","sales:close_deals","customers:view","customers:edit","orders:view","orders:create","products:view","coverage:view"]'::jsonb,
   false, 'pink', 'UserCheck'),

  -- Finance
  ('finance_manager', 'Finance Manager', 'Manages financial operations, budgets, and reporting', 'Finance', 'management',
   '["dashboard:view","dashboard:view_reports","billing:view","billing:manage_invoices","billing:process_payments","billing:view_revenue","billing:manage_subscriptions","billing:export_reports","finance:view_all","finance:approve_expenses","finance:manage_budgets","finance:view_profit_loss","finance:export_financial_data","products:view","products:view_costs","customers:view","orders:view","sales:view","sales:view_commissions"]'::jsonb,
   false, 'emerald', 'TrendingUp'),

  -- Support
  ('support_manager', 'Support Manager', 'Oversees customer support operations and team', 'Support', 'management',
   '["dashboard:view","dashboard:view_analytics","support:view_tickets","support:respond_tickets","support:close_tickets","support:view_customer_history","customers:view","customers:edit","customers:view_personal_info","orders:view","orders:edit","orders:cancel","products:view","coverage:view"]'::jsonb,
   false, 'sky', 'Headphones'),

  ('support_agent', 'Support Agent', 'Handles customer inquiries and support tickets', 'Support', 'staff',
   '["dashboard:view","support:view_tickets","support:respond_tickets","support:close_tickets","support:view_customer_history","customers:view","customers:view_personal_info","orders:view","products:view","coverage:view"]'::jsonb,
   false, 'blue', 'MessageCircle'),

  -- Content/Marketing
  ('content_editor', 'Content Editor', 'Creates and manages website content and marketing materials', 'Marketing', 'staff',
   '["dashboard:view","cms:view","cms:create","cms:edit","cms:publish","cms:delete","marketing:view","marketing:view_analytics","products:view"]'::jsonb,
   true, 'purple', 'FileEdit'),

  -- Viewer
  ('viewer', 'Viewer', 'Basic read-only access to public information', 'General', 'support',
   '["dashboard:view","products:view"]'::jsonb,
   true, 'zinc', 'Book')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  department = EXCLUDED.department,
  level = EXCLUDED.level,
  permissions = EXCLUDED.permissions,
  is_default = EXCLUDED.is_default,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  updated_at = NOW();

-- Update existing admin users to use role templates
UPDATE admin_users
SET role_template_id = 'super_admin'
WHERE role = 'super_admin';

UPDATE admin_users
SET role_template_id = 'product_manager'
WHERE role = 'product_manager';

UPDATE admin_users
SET role_template_id = 'content_editor'
WHERE role = 'editor';

UPDATE admin_users
SET role_template_id = 'viewer'
WHERE role = 'viewer';

-- Enable RLS on role_templates
ALTER TABLE role_templates ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view role templates
CREATE POLICY role_templates_select_all
  ON role_templates
  FOR SELECT
  USING (is_active = true);

-- Policy: Super admins can manage role templates
CREATE POLICY role_templates_manage_super_admin
  ON role_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id::text = auth.uid()::text
      AND role_template_id = 'super_admin'
      AND is_active = true
    )
  );

-- Update pending_admin_users to use role templates
ALTER TABLE pending_admin_users
ADD COLUMN IF NOT EXISTS requested_role_template_id TEXT REFERENCES role_templates(id);

-- Drop old role column constraint and add new one
ALTER TABLE pending_admin_users
DROP CONSTRAINT IF EXISTS pending_admin_users_requested_role_check;

-- Create view for user permissions
CREATE OR REPLACE VIEW admin_user_permissions AS
SELECT
  au.id,
  au.email,
  au.full_name,
  au.role,
  au.role_template_id,
  rt.name as role_template_name,
  rt.department,
  rt.level,
  get_user_permissions(au.id) as effective_permissions,
  au.is_active
FROM admin_users au
LEFT JOIN role_templates rt ON rt.id = au.role_template_id
WHERE au.is_active = true;

-- Grant permissions
GRANT SELECT ON admin_user_permissions TO authenticated;

-- Comment on tables
COMMENT ON TABLE role_templates IS 'Predefined role templates with associated permissions for RBAC system';
COMMENT ON COLUMN admin_users.role_template_id IS 'Reference to the role template defining base permissions';
COMMENT ON COLUMN admin_users.custom_permissions IS 'Additional or overriding permissions specific to this user';
COMMENT ON FUNCTION get_user_permissions IS 'Returns the effective permissions for a user (template + custom)';
COMMENT ON FUNCTION user_has_permission IS 'Checks if a user has a specific permission';
