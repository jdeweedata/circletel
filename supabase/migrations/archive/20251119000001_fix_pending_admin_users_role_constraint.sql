-- Drop outdated check constraint on pending_admin_users.requested_role
-- The constraint only allowed 3 roles: product_manager, editor, viewer
-- But we have 25 role templates in the system

ALTER TABLE pending_admin_users
DROP CONSTRAINT IF EXISTS pending_admin_users_requested_role_check;

-- Add a foreign key constraint instead to ensure requested_role references valid role_templates
-- This is more maintainable and automatically validates against all role templates
ALTER TABLE pending_admin_users
ADD CONSTRAINT pending_admin_users_requested_role_template_fkey
FOREIGN KEY (requested_role_template_id)
REFERENCES role_templates(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_pending_admin_users_requested_role_template
ON pending_admin_users(requested_role_template_id);

-- Add comment for documentation
COMMENT ON COLUMN pending_admin_users.requested_role_template_id IS
'References role_templates.id - the role template requested by the user';
