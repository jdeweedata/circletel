-- Seed Test Data for Customer Dashboard
-- Run this in Supabase SQL Editor after creating a test customer account

-- STEP 1: Find your test customer ID
-- Replace 'YOUR_EMAIL@example.com' with your actual test customer email
DO $$
DECLARE
  v_customer_id UUID;
  v_service_id UUID;
BEGIN
  -- Get customer ID (update email to match your test account)
  SELECT id INTO v_customer_id 
  FROM customers 
  WHERE email = 'YOUR_EMAIL@example.com' -- CHANGE THIS
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    RAISE NOTICE 'Customer not found. Please update the email in this script.';
    RETURN;
  END IF;

  RAISE NOTICE 'Found customer: %', v_customer_id;

  -- STEP 2: Create a test service
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
    contract_months
  ) VALUES (
    v_customer_id,
    'HomeFibre Connect 100',
    'fibre',
    'fibre_consumer',
    899.00,
    0.00,
    'active',
    true,
    '123 Main Street, Cape Town, 8001',
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE - INTERVAL '25 days',
    100,
    100,
    'dfa',
    'Dark Fibre Africa',
    0  -- month-to-month
  ) RETURNING id INTO v_service_id;

  RAISE NOTICE 'Created service: %', v_service_id;

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
      'account_type', 'Cheque',
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
    next_billing_date = EXCLUDED.next_billing_date;

  RAISE NOTICE 'Created/updated billing record';

  -- STEP 4: Create sample invoices
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
  -- Paid invoice from last month
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
  -- Current month invoice (sent, not paid yet)
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

  RAISE NOTICE 'Created 2 sample invoices';

  -- STEP 5: Create usage record (current month)
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
    0.00,  -- Uncapped, so usage tracking is optional
    NULL,  -- NULL = uncapped
    0.00,
    0.00
  )
  ON CONFLICT (customer_id, service_id, month, year) DO NOTHING;

  RAISE NOTICE 'Created usage record';

  RAISE NOTICE '✅ Test data created successfully!';
  RAISE NOTICE 'Customer ID: %', v_customer_id;
  RAISE NOTICE 'Service ID: %', v_service_id;
  RAISE NOTICE 'You can now test the dashboard at /dashboard';

END $$;

-- Verify the data was created
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
FROM customer_usage;
