-- Fix customer auth_user_id link
-- Run this on STAGING if customer is not linked to auth user

DO $$
DECLARE
  v_auth_user_id UUID;
  v_customer_id UUID;
  v_email TEXT := 'jeffrey@newgengroup.co.za'; -- CHANGE THIS if needed
BEGIN
  -- Get auth user ID
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = v_email;

  IF v_auth_user_id IS NULL THEN
    RAISE NOTICE '❌ No auth user found with email: %', v_email;
    RETURN;
  END IF;

  RAISE NOTICE '✅ Found auth user: %', v_auth_user_id;

  -- Update customer record
  UPDATE customers
  SET auth_user_id = v_auth_user_id
  WHERE email = v_email
  RETURNING id INTO v_customer_id;

  IF v_customer_id IS NULL THEN
    RAISE NOTICE '❌ No customer found with email: %', v_email;
    RETURN;
  END IF;

  RAISE NOTICE '✅ Updated customer: %', v_customer_id;
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CUSTOMER LINKED TO AUTH USER';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Customer: %', v_email;
  RAISE NOTICE 'Auth User ID: %', v_auth_user_id;
  RAISE NOTICE 'Customer ID: %', v_customer_id;
  RAISE NOTICE '';
  RAISE NOTICE 'You can now login and access the dashboard!';
  RAISE NOTICE '========================================';

END $$;

-- Verify the link
SELECT 
  c.email,
  c.first_name || ' ' || c.last_name as name,
  c.auth_user_id,
  au.id as auth_id,
  CASE 
    WHEN c.auth_user_id = au.id THEN '✅ LINKED'
    ELSE '❌ NOT LINKED'
  END as status
FROM customers c
LEFT JOIN auth.users au ON c.email = au.email
WHERE c.email = 'jeffrey@newgengroup.co.za';
