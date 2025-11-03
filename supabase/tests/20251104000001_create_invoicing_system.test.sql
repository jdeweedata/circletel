-- Test Suite: Invoicing System
-- Migration: 20251104000001_create_invoicing_system.sql
-- Created: 2025-11-04
-- Tests: 6 focused tests

-- Test 1: Tables created successfully
DO $$
BEGIN
  PERFORM 1/COUNT(*) FROM information_schema.tables WHERE table_name = 'invoices';
  PERFORM 1/COUNT(*) FROM information_schema.tables WHERE table_name = 'payment_transactions';
  PERFORM 1/COUNT(*) FROM information_schema.tables WHERE table_name = 'billing_cycles';
  PERFORM 1/COUNT(*) FROM information_schema.tables WHERE table_name = 'payment_methods';
  RAISE NOTICE 'Test 1 PASSED: All 4 tables created successfully';
EXCEPTION WHEN division_by_zero THEN
  RAISE EXCEPTION 'Test 1 FAILED: One or more tables missing';
END $$;

-- Test 2: Invoice number auto-generation (INV-YYYY-NNN format)
DO $$
DECLARE
  test_invoice_number TEXT;
  expected_pattern TEXT;
BEGIN
  -- Insert test invoice (assuming contracts table exists from Sprint 2)
  INSERT INTO invoices (
    contract_id,
    customer_id,
    items,
    subtotal,
    vat_amount,
    total_amount,
    due_date
  ) VALUES (
    (SELECT id FROM contracts LIMIT 1),
    (SELECT id FROM customers LIMIT 1),
    '[{"description": "Test Service", "quantity": 1, "unit_price": 799.00, "total": 799.00}]'::JSONB,
    799.00,
    119.85,
    918.85,
    CURRENT_DATE + INTERVAL '30 days'
  )
  RETURNING invoice_number INTO test_invoice_number;

  -- Check format INV-YYYY-NNN
  expected_pattern := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-%';

  IF test_invoice_number LIKE expected_pattern THEN
    RAISE NOTICE 'Test 2 PASSED: Invoice number % matches pattern %', test_invoice_number, expected_pattern;
  ELSE
    RAISE EXCEPTION 'Test 2 FAILED: Invoice number % does not match expected pattern', test_invoice_number;
  END IF;

  -- Cleanup
  DELETE FROM invoices WHERE invoice_number = test_invoice_number;
END $$;

-- Test 3: Foreign key constraints (contract_id RESTRICT)
DO $$
DECLARE
  test_contract_id UUID;
  test_customer_id UUID;
  test_invoice_id UUID;
BEGIN
  -- Create test contract
  SELECT id INTO test_contract_id FROM contracts LIMIT 1;
  SELECT customer_id INTO test_customer_id FROM contracts WHERE id = test_contract_id;

  -- Insert invoice
  INSERT INTO invoices (
    contract_id,
    customer_id,
    items,
    subtotal,
    vat_amount,
    total_amount,
    due_date
  ) VALUES (
    test_contract_id,
    test_customer_id,
    '[{"description": "Test", "quantity": 1, "unit_price": 500.00, "total": 500.00}]'::JSONB,
    500.00,
    75.00,
    575.00,
    CURRENT_DATE + INTERVAL '30 days'
  )
  RETURNING id INTO test_invoice_id;

  -- Try to delete contract (should fail with RESTRICT)
  BEGIN
    DELETE FROM contracts WHERE id = test_contract_id;
    RAISE EXCEPTION 'Test 3 FAILED: Contract deletion should have been restricted';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'Test 3 PASSED: Foreign key RESTRICT constraint working correctly';
  END;

  -- Cleanup
  DELETE FROM invoices WHERE id = test_invoice_id;
END $$;

-- Test 4: CHECK constraints on status and payment_method
DO $$
BEGIN
  -- Test invalid invoice status
  BEGIN
    INSERT INTO invoices (
      contract_id,
      customer_id,
      items,
      subtotal,
      vat_amount,
      total_amount,
      due_date,
      status
    ) VALUES (
      (SELECT id FROM contracts LIMIT 1),
      (SELECT id FROM customers LIMIT 1),
      '[]'::JSONB,
      0, 0, 0,
      CURRENT_DATE,
      'invalid_status'
    );
    RAISE EXCEPTION 'Test 4a FAILED: Invalid status should have been rejected';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'Test 4a PASSED: Status CHECK constraint working';
  END;

  -- Test invalid payment_method
  BEGIN
    INSERT INTO invoices (
      contract_id,
      customer_id,
      items,
      subtotal,
      vat_amount,
      total_amount,
      due_date,
      payment_method
    ) VALUES (
      (SELECT id FROM contracts LIMIT 1),
      (SELECT id FROM customers LIMIT 1),
      '[]'::JSONB,
      0, 0, 0,
      CURRENT_DATE,
      'bitcoin'
    );
    RAISE EXCEPTION 'Test 4b FAILED: Invalid payment_method should have been rejected';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'Test 4b PASSED: Payment method CHECK constraint working';
  END;

  RAISE NOTICE 'Test 4 PASSED: All CHECK constraints validated';
END $$;

-- Test 5: Payment transactions link to invoices correctly
DO $$
DECLARE
  test_invoice_id UUID;
  test_transaction_id UUID;
  test_customer_id UUID;
BEGIN
  -- Create test invoice
  SELECT customer_id INTO test_customer_id FROM customers LIMIT 1;

  INSERT INTO invoices (
    contract_id,
    customer_id,
    items,
    subtotal,
    vat_amount,
    total_amount,
    due_date
  ) VALUES (
    (SELECT id FROM contracts WHERE customer_id = test_customer_id LIMIT 1),
    test_customer_id,
    '[{"description": "Monthly Service", "quantity": 1, "unit_price": 799.00, "total": 799.00}]'::JSONB,
    799.00,
    119.85,
    918.85,
    CURRENT_DATE + INTERVAL '30 days'
  )
  RETURNING id INTO test_invoice_id;

  -- Create payment transaction
  INSERT INTO payment_transactions (
    invoice_id,
    customer_id,
    transaction_id,
    amount,
    payment_method
  ) VALUES (
    test_invoice_id,
    test_customer_id,
    'TEST-TXN-001',
    918.85,
    'card'
  )
  RETURNING id INTO test_transaction_id;

  -- Verify link
  PERFORM 1/COUNT(*) FROM payment_transactions
  WHERE id = test_transaction_id AND invoice_id = test_invoice_id;

  RAISE NOTICE 'Test 5 PASSED: Payment transaction linked correctly to invoice';

  -- Cleanup
  DELETE FROM payment_transactions WHERE id = test_transaction_id;
  DELETE FROM invoices WHERE id = test_invoice_id;
EXCEPTION WHEN division_by_zero THEN
  RAISE EXCEPTION 'Test 5 FAILED: Payment transaction not linked to invoice';
END $$;

-- Test 6: RLS policies enforce correct access control
DO $$
DECLARE
  test_customer_id UUID;
  test_invoice_id UUID;
  accessible_count INTEGER;
BEGIN
  -- Get test customer
  SELECT id INTO test_customer_id FROM customers LIMIT 1;

  -- Create test invoice
  INSERT INTO invoices (
    contract_id,
    customer_id,
    items,
    subtotal,
    vat_amount,
    total_amount,
    due_date
  ) VALUES (
    (SELECT id FROM contracts WHERE customer_id = test_customer_id LIMIT 1),
    test_customer_id,
    '[{"description": "Test Service", "quantity": 1, "unit_price": 500.00, "total": 500.00}]'::JSONB,
    500.00,
    75.00,
    575.00,
    CURRENT_DATE + INTERVAL '30 days'
  )
  RETURNING id INTO test_invoice_id;

  -- Simulate customer context (RLS policies should filter)
  SET ROLE authenticated;
  SET request.jwt.claim.sub TO test_customer_id::TEXT;

  -- Customer should see their own invoice
  SELECT COUNT(*) INTO accessible_count FROM invoices WHERE id = test_invoice_id;

  IF accessible_count = 1 THEN
    RAISE NOTICE 'Test 6a PASSED: Customer can SELECT own invoice';
  ELSE
    RAISE EXCEPTION 'Test 6a FAILED: Customer cannot access own invoice';
  END IF;

  -- Reset role
  RESET ROLE;

  -- Service role should have full access
  SET ROLE service_role;
  SELECT COUNT(*) INTO accessible_count FROM invoices WHERE id = test_invoice_id;

  IF accessible_count = 1 THEN
    RAISE NOTICE 'Test 6b PASSED: Service role has access to invoice';
  ELSE
    RAISE EXCEPTION 'Test 6b FAILED: Service role cannot access invoice';
  END IF;

  RESET ROLE;

  RAISE NOTICE 'Test 6 PASSED: RLS policies enforce correct access control';

  -- Cleanup
  DELETE FROM invoices WHERE id = test_invoice_id;
END $$;

-- Summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST SUITE SUMMARY ===';
  RAISE NOTICE 'Migration: 20251104000001_create_invoicing_system.sql';
  RAISE NOTICE 'Total Tests: 6';
  RAISE NOTICE 'Test 1: Table creation';
  RAISE NOTICE 'Test 2: Invoice number auto-generation (INV-YYYY-NNN)';
  RAISE NOTICE 'Test 3: Foreign key constraints (RESTRICT)';
  RAISE NOTICE 'Test 4: CHECK constraints (status, payment_method)';
  RAISE NOTICE 'Test 5: Payment transactions linked correctly';
  RAISE NOTICE 'Test 6: RLS policies enforce access control';
  RAISE NOTICE '=========================';
END $$;
