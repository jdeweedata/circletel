-- Migration: Update development admin email
-- Purpose: Change admin@circletel.co.za to devadmin@circletel.co.za
-- Created: 2025-11-06
-- Author: Development Team

-- Update admin_users table
UPDATE admin_users
SET
  email = 'devadmin@circletel.co.za',
  updated_at = NOW()
WHERE id = '172c9f7c-7c32-43bd-8782-278df0d4a322'
  AND email = 'admin@circletel.co.za';

-- Update auth.users table (Supabase Auth)
UPDATE auth.users
SET
  email = 'devadmin@circletel.co.za',
  raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{email}',
    '"devadmin@circletel.co.za"'
  ),
  updated_at = NOW()
WHERE id = '172c9f7c-7c32-43bd-8782-278df0d4a322'
  AND email = 'admin@circletel.co.za';

-- Verify the update
DO $$
DECLARE
  admin_email TEXT;
  auth_email TEXT;
BEGIN
  -- Check admin_users table
  SELECT email INTO admin_email
  FROM admin_users
  WHERE id = '172c9f7c-7c32-43bd-8782-278df0d4a322';

  -- Check auth.users table
  SELECT email INTO auth_email
  FROM auth.users
  WHERE id = '172c9f7c-7c32-43bd-8782-278df0d4a322';

  IF admin_email = 'devadmin@circletel.co.za' AND auth_email = 'devadmin@circletel.co.za' THEN
    RAISE NOTICE 'SUCCESS: Admin email updated to devadmin@circletel.co.za in both tables';
  ELSE
    RAISE WARNING 'FAILED: Email mismatch - admin_users: %, auth.users: %', admin_email, auth_email;
  END IF;
END $$;
