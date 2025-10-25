-- Seed dashboard data for jeffrey@newgengroup.co.za

DO $$
DECLARE
  v_customer_id UUID;
  v_service_id UUID;
  v_customer_email TEXT := 'jeffrey@newgengroup.co.za';
BEGIN
  -- Get customer by email
  SELECT id INTO v_customer_id
  FROM customers
  WHERE email = v_customer_email;

  IF v_customer_id IS NULL THEN
    RAISE NOTICE '❌ Customer not found with email: %', v_customer_email;
    RETURN;
  END IF;

  -- Ensure customer is linked to auth user
  UPDATE customers
  SET auth_user_id = (SELECT id FROM auth.users WHERE email = v_customer_email)
  WHERE id = v_customer_id AND auth_user_id IS NULL;

  RAISE NOTICE '✅ Found customer: % (%)', v_customer_email, v_customer_id;

  -- Create test service
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
    'BizFibre Connect Pro',
    'fibre',
    'fibre_business',
    2999.00,
    0.00,
    'active',
    true,
    '456 Business Park, Johannesburg, Gauteng, 2000',
    CURRENT_DATE - INTERVAL '60 days',
    CURRENT_DATE - INTERVAL '55 days',
    100,
    100,
    'dfa',
    'Dark Fibre Africa',
    0,
    CURRENT_DATE - INTERVAL '55 days'
  ) 
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_service_id;

  IF v_service_id IS NULL THEN
    SELECT id INTO v_service_id
    FROM customer_services
    WHERE customer_id = v_customer_id AND active = true
    LIMIT 1;
    RAISE NOTICE '✅ Service already exists: %', v_service_id;
  ELSE
    RAISE NOTICE '✅ Created service: %', v_service_id;
  END IF;

  -- Create billing record
  INSERT INTO customer_billing (
    customer_id,
    account_balance,
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
    'debit_order',
    jsonb_build_object('bank', 'FNB', 'account_type', 'Business Cheque', 'last4', '9876'),
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
    updated_at = NOW();

  RAISE NOTICE '✅ Created/updated billing';

  -- Create invoices
  DELETE FROM customer_invoices WHERE customer_id = v_customer_id;
  
  INSERT INTO customer_invoices (
    customer_id, invoice_number, invoice_date, due_date,
    subtotal, tax_amount, total_amount, amount_paid, amount_due,
    status, paid_at, line_items
  ) VALUES 
  -- Paid invoice (last month)
  (
    v_customer_id,
    'INV-' || TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYYMM') || '-JDW001',
    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'),
    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '7 days',
    2999.00, 449.85, 3448.85, 3448.85, 0.00, 'paid',
    CURRENT_DATE - INTERVAL '20 days',
    jsonb_build_array(jsonb_build_object('description', 'BizFibre Connect Pro - Monthly Subscription', 'quantity', 1, 'unit_price', 2999.00, 'amount', 2999.00))
  ),
  -- Current invoice (sent)
  (
    v_customer_id,
    'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-JDW002',
    DATE_TRUNC('month', CURRENT_DATE),
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '7 days',
    2999.00, 449.85, 3448.85, 0.00, 3448.85, 'sent',
    NULL,
    jsonb_build_array(jsonb_build_object('description', 'BizFibre Connect Pro - Monthly Subscription', 'quantity', 1, 'unit_price', 2999.00, 'amount', 2999.00))
  );

  RAISE NOTICE '✅ Created 2 invoices';

  -- Create usage record
  IF v_service_id IS NOT NULL THEN
    INSERT INTO customer_usage (
      customer_id,
      service_id,
      month,
      year,
      data_used_gb,
      data_limit_gb
    ) VALUES (
      v_customer_id,
      v_service_id,
      EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
      0.00,
      NULL
    )
    ON CONFLICT (customer_id, service_id, month, year) DO NOTHING;

    RAISE NOTICE '✅ Created usage record';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ COMPLETED for jeffrey@newgengroup.co.za';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Customer ID: %', v_customer_id;
  RAISE NOTICE 'Service: BizFibre Connect Pro (R2,999/month)';
  RAISE NOTICE 'Status: Active';
  RAISE NOTICE 'Invoices: 2 (1 paid, 1 sent)';
  RAISE NOTICE '========================================';

END $$;

-- Verify
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
WHERE c.email = 'jeffrey@newgengroup.co.za';
