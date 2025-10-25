-- Simple Dashboard Test Data Seed
-- This will create a complete test customer with all dashboard data

-- STEP 1: Create or get test customer
DO $$
DECLARE
  v_customer_id UUID;
  v_service_id UUID;
  v_auth_user_id UUID;
BEGIN
  -- First, try to find an existing auth user
  SELECT id INTO v_auth_user_id 
  FROM auth.users 
  ORDER BY created_at DESC 
  LIMIT 1;

  IF v_auth_user_id IS NULL THEN
    RAISE NOTICE '❌ No auth users found. Please create an account first at /auth/login';
    RETURN;
  END IF;

  RAISE NOTICE 'Found auth user: %', v_auth_user_id;

  -- Check if customer already exists for this auth user
  SELECT id INTO v_customer_id
  FROM customers
  WHERE auth_user_id = v_auth_user_id;

  -- If no customer exists, create one
  IF v_customer_id IS NULL THEN
    INSERT INTO customers (
      auth_user_id,
      email,
      first_name,
      last_name,
      phone,
      created_at
    ) 
    SELECT 
      id,
      email,
      COALESCE(raw_user_meta_data->>'firstName', 'Test'),
      COALESCE(raw_user_meta_data->>'lastName', 'Customer'),
      COALESCE(raw_user_meta_data->>'phone', '+27123456789'),
      created_at
    FROM auth.users
    WHERE id = v_auth_user_id
    RETURNING id INTO v_customer_id;

    RAISE NOTICE '✅ Created customer: %', v_customer_id;
  ELSE
    RAISE NOTICE '✅ Found existing customer: %', v_customer_id;
  END IF;

  -- STEP 2: Create test service
  INSERT INTO customer_services (
    customer_id,
    package_name,
    service_type,
    product_category,
    monthly_price,
    setup_fee,
    status,
    active,
    installation_address,
    installation_date,
    activation_date,
    speed_down,
    speed_up,
    provider_code,
    provider_name,
    contract_months,
    contract_start_date
  ) VALUES (
    v_customer_id,
    'HomeFibre Connect 100',
    'fibre',
    'fibre_consumer',
    899.00,
    0.00,
    'active',
    true,
    '123 Main Street, Cape Town, Western Cape, 8001',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE - INTERVAL '25 days',
    100,
    100,
    'dfa',
    'Dark Fibre Africa',
    0,  -- month-to-month
    CURRENT_DATE - INTERVAL '25 days'
  ) 
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_service_id;

  IF v_service_id IS NULL THEN
    -- Service already exists, get it
    SELECT id INTO v_service_id
    FROM customer_services
    WHERE customer_id = v_customer_id
    AND active = true
    LIMIT 1;
    RAISE NOTICE '✅ Service already exists: %', v_service_id;
  ELSE
    RAISE NOTICE '✅ Created service: %', v_service_id;
  END IF;

  -- STEP 3: Create billing record
  INSERT INTO customer_billing (
    customer_id,
    account_balance,
    credit_limit,
    payment_method,
    payment_method_details,
    billing_day,
    next_billing_date,
    last_billing_date,
    payment_status,
    days_overdue
  ) VALUES (
    v_customer_id,
    0.00,
    0.00,
    'debit_order',
    jsonb_build_object(
      'bank', 'FNB',
      'account_type', 'Cheque Account',
      'last4', '1234'
    ),
    1,
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month',
    DATE_TRUNC('month', CURRENT_DATE),
    'current',
    0
  )
  ON CONFLICT (customer_id) DO UPDATE SET
    account_balance = EXCLUDED.account_balance,
    payment_method = EXCLUDED.payment_method,
    payment_method_details = EXCLUDED.payment_method_details,
    next_billing_date = EXCLUDED.next_billing_date,
    updated_at = NOW();

  RAISE NOTICE '✅ Created/updated billing record';

  -- STEP 4: Create sample invoices
  -- Delete existing invoices first to avoid duplicates
  DELETE FROM customer_invoices WHERE customer_id = v_customer_id;

  INSERT INTO customer_invoices (
    customer_id,
    invoice_number,
    invoice_date,
    due_date,
    subtotal,
    tax_amount,
    total_amount,
    amount_paid,
    amount_due,
    status,
    paid_at,
    line_items
  ) VALUES 
  -- Invoice 1: Paid (last month)
  (
    v_customer_id,
    'INV-' || TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYYMM') || '-001',
    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'),
    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '7 days',
    899.00,
    134.85,  -- 15% VAT
    1033.85,
    1033.85,
    0.00,
    'paid',
    CURRENT_DATE - INTERVAL '20 days',
    jsonb_build_array(
      jsonb_build_object(
        'description', 'HomeFibre Connect 100 - Monthly Subscription',
        'quantity', 1,
        'unit_price', 899.00,
        'amount', 899.00
      )
    )
  ),
  -- Invoice 2: Sent (current month)
  (
    v_customer_id,
    'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-001',
    DATE_TRUNC('month', CURRENT_DATE),
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '7 days',
    899.00,
    134.85,
    1033.85,
    0.00,
    1033.85,
    'sent',
    NULL,
    jsonb_build_array(
      jsonb_build_object(
        'description', 'HomeFibre Connect 100 - Monthly Subscription',
        'quantity', 1,
        'unit_price', 899.00,
        'amount', 899.00
      )
    )
  );

  RAISE NOTICE '✅ Created 2 invoices';

  -- STEP 5: Create usage record (optional for uncapped)
  IF v_service_id IS NOT NULL THEN
    INSERT INTO customer_usage (
      customer_id,
      service_id,
      month,
      year,
      data_used_gb,
      data_limit_gb,
      peak_usage_gb,
      off_peak_usage_gb
    ) VALUES (
      v_customer_id,
      v_service_id,
      EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
      0.00,
      NULL,  -- NULL = uncapped
      0.00,
      0.00
    )
    ON CONFLICT (customer_id, service_id, month, year) DO NOTHING;

    RAISE NOTICE '✅ Created usage record';
  END IF;

  -- Final summary
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TEST DATA CREATED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Customer ID: %', v_customer_id;
  RAISE NOTICE 'Service ID: %', v_service_id;
  RAISE NOTICE '';
  RAISE NOTICE 'You can now test the dashboard at:';
  RAISE NOTICE 'http://localhost:3004/dashboard';
  RAISE NOTICE '========================================';

END $$;

-- Verify the data
SELECT 
  'Customer Services' as table_name,
  COUNT(*) as record_count
FROM customer_services
UNION ALL
SELECT 
  'Customer Billing',
  COUNT(*)
FROM customer_billing
UNION ALL
SELECT 
  'Customer Invoices',
  COUNT(*)
FROM customer_invoices
UNION ALL
SELECT 
  'Customer Usage',
  COUNT(*)
FROM customer_usage
ORDER BY table_name;

-- Show the created data
SELECT 
  c.email,
  c.first_name || ' ' || c.last_name as customer_name,
  cs.package_name,
  cs.status as service_status,
  cs.monthly_price,
  cb.payment_status,
  cb.account_balance,
  (SELECT COUNT(*) FROM customer_invoices WHERE customer_id = c.id) as invoice_count
FROM customers c
LEFT JOIN customer_services cs ON c.id = cs.customer_id AND cs.active = true
LEFT JOIN customer_billing cb ON c.id = cb.customer_id
ORDER BY c.created_at DESC
LIMIT 5;
