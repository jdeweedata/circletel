-- Fix email verification trigger to handle RLS policies
-- Issue: Trigger fails during email confirmation, causing "Error confirming user"
-- Created: 2025-10-24

-- Drop and recreate the trigger function with proper permissions
DROP TRIGGER IF EXISTS sync_customer_email_on_confirm ON auth.users;
DROP FUNCTION IF EXISTS sync_customer_email_verified();

-- Create improved trigger function that bypasses RLS
CREATE OR REPLACE FUNCTION sync_customer_email_verified()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- When auth.users email is confirmed, update customer record
  -- This runs with elevated privileges to bypass RLS
  IF NEW.email_confirmed_at IS NOT NULL AND
     (OLD IS NULL OR OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at != NEW.email_confirmed_at) THEN

    -- Update customers table (bypasses RLS due to SECURITY DEFINER)
    UPDATE customers
    SET
      email_verified = TRUE,
      updated_at = NOW()
    WHERE auth_user_id = NEW.id;

    -- Log for debugging (optional)
    RAISE NOTICE 'Email verified for user: %', NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER sync_customer_email_on_confirm
AFTER UPDATE ON auth.users
FOR EACH ROW
WHEN (NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION sync_customer_email_verified();

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION sync_customer_email_verified() TO postgres, authenticated, service_role;

-- Also update the last_login trigger with same fix
DROP TRIGGER IF EXISTS update_customer_last_login_on_signin ON auth.users;
DROP FUNCTION IF EXISTS update_customer_last_login();

CREATE OR REPLACE FUNCTION update_customer_last_login()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update last_login when user signs in
  IF NEW.last_sign_in_at IS NOT NULL AND
     (OLD IS NULL OR OLD.last_sign_in_at IS NULL OR OLD.last_sign_in_at != NEW.last_sign_in_at) THEN

    UPDATE customers
    SET
      last_login = NEW.last_sign_in_at,
      updated_at = NOW()
    WHERE auth_user_id = NEW.id;

    RAISE NOTICE 'Last login updated for user: %', NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER update_customer_last_login_on_signin
AFTER UPDATE ON auth.users
FOR EACH ROW
WHEN (NEW.last_sign_in_at IS NOT NULL)
EXECUTE FUNCTION update_customer_last_login();

GRANT EXECUTE ON FUNCTION update_customer_last_login() TO postgres, authenticated, service_role;

-- Verify triggers exist
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE event_object_table = 'users'
    AND event_object_schema = 'auth';

  RAISE NOTICE '=== TRIGGERS ON auth.users: % ===', trigger_count;
END $$;
