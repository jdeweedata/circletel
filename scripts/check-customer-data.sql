-- Check customer data to verify profile updates were saved

-- Check jeffrey@newgengroup.co.za customer record
SELECT 
  id,
  email,
  first_name,
  last_name,
  phone,
  business_name,
  business_registration,
  tax_number,
  account_type,
  updated_at,
  created_at
FROM customers
WHERE email = 'jeffrey@newgengroup.co.za';

-- Show all recent customer updates (last 10 minutes)
SELECT 
  email,
  first_name,
  last_name,
  phone,
  updated_at
FROM customers
WHERE updated_at > NOW() - INTERVAL '10 minutes'
ORDER BY updated_at DESC;
