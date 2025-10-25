-- Verify customer is linked to auth user
-- Run this on STAGING database

-- Check auth users
SELECT 
  'Auth Users' as table_name,
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Check customers
SELECT 
  'Customers' as table_name,
  id,
  email,
  auth_user_id,
  first_name,
  last_name
FROM customers
ORDER BY created_at DESC
LIMIT 5;

-- Check if jeffrey@newgengroup.co.za is properly linked
SELECT 
  'Customer-Auth Link Check' as status,
  c.email as customer_email,
  c.auth_user_id as customer_auth_id,
  au.id as auth_user_id,
  au.email as auth_email,
  CASE 
    WHEN c.auth_user_id = au.id THEN '✅ LINKED'
    WHEN c.auth_user_id IS NULL THEN '❌ NO AUTH_USER_ID'
    ELSE '❌ MISMATCH'
  END as link_status
FROM customers c
LEFT JOIN auth.users au ON c.email = au.email
WHERE c.email = 'jeffrey@newgengroup.co.za';

-- If not linked, here's the fix:
-- UPDATE customers 
-- SET auth_user_id = (SELECT id FROM auth.users WHERE email = 'jeffrey@newgengroup.co.za')
-- WHERE email = 'jeffrey@newgengroup.co.za';
