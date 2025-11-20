-- ============================================
-- Remove Outdated Role Constraint
-- ============================================
-- The admin_users.role column has a CHECK constraint that only allows
-- 4 legacy values: 'super_admin', 'product_manager', 'editor', 'viewer'.
--
-- With the RBAC system, we now use role_template_id to reference role templates,
-- and the role column should be able to store any role template ID.
--
-- This migration removes the restrictive constraint to allow all role template IDs.
-- ============================================

-- Drop the outdated role check constraint
ALTER TABLE admin_users
DROP CONSTRAINT IF EXISTS admin_users_role_check;

-- Add a comment explaining the change
COMMENT ON COLUMN admin_users.role IS 'Legacy role column - use role_template_id for RBAC system. This column can store any role template ID for backward compatibility.';

-- Verify that all existing admin_users have matching role and role_template_id
-- This is just a diagnostic query, not a constraint
DO $$
DECLARE
  mismatched_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO mismatched_count
  FROM admin_users
  WHERE role IS NOT NULL
    AND role_template_id IS NOT NULL
    AND role != role_template_id;

  IF mismatched_count > 0 THEN
    RAISE NOTICE 'Found % admin users with mismatched role and role_template_id', mismatched_count;
  ELSE
    RAISE NOTICE 'All admin users have matching role and role_template_id values';
  END IF;
END $$;
