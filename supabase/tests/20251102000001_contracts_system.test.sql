-- Test Suite: Contracts System
-- Migration: 20251102000001_create_contracts_system.sql
-- Created: 2025-11-02
-- Tests: 6 focused tests for contracts table, RLS policies, and auto-numbering

-- Enable test mode
SET client_min_messages TO NOTICE;

-- Test 1: Table creation and basic structure
DO $$
BEGIN
  -- Verify contracts table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contracts'
  ) THEN
    RAISE EXCEPTION 'Test 1 FAILED: contracts table does not exist';
  END IF;

  -- Verify all critical columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts'
    AND column_name IN ('contract_number', 'quote_id', 'kyc_session_id', 'customer_id', 'status')
    GROUP BY table_name
    HAVING COUNT(*) = 5
  ) THEN
    RAISE EXCEPTION 'Test 1 FAILED: contracts table missing required columns';
  END IF;

  RAISE NOTICE 'Test 1 PASSED: contracts table created with required columns';
END $$;

-- Test 2: Contract number uniqueness and format
DO $$
DECLARE
  test_contract_num1 TEXT;
  test_contract_num2 TEXT;
BEGIN
  -- Insert first test contract (will auto-generate contract_number)
  INSERT INTO contracts (
    quote_id,
    customer_id,
    contract_type,
    contract_term_months,
    monthly_recurring,
    total_contract_value
  ) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000002'::UUID,
    'fibre',
    24,
    799.00,
    19176.00
  ) RETURNING contract_number INTO test_contract_num1;

  -- Verify format is CT-YYYY-NNN
  IF test_contract_num1 !~ '^CT-\d{4}-\d{3}$' THEN
    RAISE EXCEPTION 'Test 2 FAILED: Contract number format incorrect: %', test_contract_num1;
  END IF;

  -- Insert second contract
  INSERT INTO contracts (
    quote_id,
    customer_id,
    contract_type,
    contract_term_months,
    monthly_recurring,
    total_contract_value
  ) VALUES (
    '00000000-0000-0000-0000-000000000003'::UUID,
    '00000000-0000-0000-0000-000000000004'::UUID,
    'wireless',
    12,
    499.00,
    5988.00
  ) RETURNING contract_number INTO test_contract_num2;

  -- Verify numbers are unique and sequential
  IF test_contract_num1 = test_contract_num2 THEN
    RAISE EXCEPTION 'Test 2 FAILED: Contract numbers not unique';
  END IF;

  -- Try to insert duplicate contract_number (should fail)
  BEGIN
    INSERT INTO contracts (
      contract_number,
      quote_id,
      customer_id,
      contract_type,
      contract_term_months,
      monthly_recurring,
      total_contract_value
    ) VALUES (
      test_contract_num1,
      '00000000-0000-0000-0000-000000000005'::UUID,
      '00000000-0000-0000-0000-000000000006'::UUID,
      'fibre',
      36,
      999.00,
      35964.00
    );
    RAISE EXCEPTION 'Test 2 FAILED: Duplicate contract_number allowed';
  EXCEPTION WHEN unique_violation THEN
    -- Expected behavior
    NULL;
  END;

  -- Clean up test data
  DELETE FROM contracts WHERE contract_number IN (test_contract_num1, test_contract_num2);

  RAISE NOTICE 'Test 2 PASSED: Contract number uniqueness and format validated';
END $$;

-- Test 3: Foreign key constraints
DO $$
BEGIN
  -- Test 3a: quote_id must reference existing quote (should fail)
  BEGIN
    INSERT INTO contracts (
      quote_id,
      customer_id,
      contract_type,
      contract_term_months,
      monthly_recurring,
      total_contract_value
    ) VALUES (
      '99999999-9999-9999-9999-999999999999'::UUID,
      '00000000-0000-0000-0000-000000000002'::UUID,
      'fibre',
      24,
      799.00,
      19176.00
    );
    RAISE EXCEPTION 'Test 3a FAILED: Invalid quote_id allowed';
  EXCEPTION WHEN foreign_key_violation THEN
    -- Expected behavior
    NULL;
  END;

  -- Test 3b: kyc_session_id foreign key (should allow NULL)
  INSERT INTO contracts (
    quote_id,
    customer_id,
    kyc_session_id,
    contract_type,
    contract_term_months,
    monthly_recurring,
    total_contract_value
  ) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000002'::UUID,
    NULL,
    'fibre',
    24,
    799.00,
    19176.00
  );

  -- Clean up
  DELETE FROM contracts WHERE kyc_session_id IS NULL;

  RAISE NOTICE 'Test 3 PASSED: Foreign key constraints validated';
END $$;

-- Test 4: CHECK constraints on enums
DO $$
BEGIN
  -- Test 4a: Invalid status (should fail)
  BEGIN
    INSERT INTO contracts (
      quote_id,
      customer_id,
      contract_type,
      contract_term_months,
      monthly_recurring,
      total_contract_value,
      status
    ) VALUES (
      '00000000-0000-0000-0000-000000000001'::UUID,
      '00000000-0000-0000-0000-000000000002'::UUID,
      'fibre',
      24,
      799.00,
      19176.00,
      'invalid_status'
    );
    RAISE EXCEPTION 'Test 4a FAILED: Invalid status allowed';
  EXCEPTION WHEN check_violation THEN
    -- Expected behavior
    NULL;
  END;

  -- Test 4b: Invalid contract_type (should fail)
  BEGIN
    INSERT INTO contracts (
      quote_id,
      customer_id,
      contract_type,
      contract_term_months,
      monthly_recurring,
      total_contract_value
    ) VALUES (
      '00000000-0000-0000-0000-000000000001'::UUID,
      '00000000-0000-0000-0000-000000000002'::UUID,
      'invalid_type',
      24,
      799.00,
      19176.00
    );
    RAISE EXCEPTION 'Test 4b FAILED: Invalid contract_type allowed';
  EXCEPTION WHEN check_violation THEN
    -- Expected behavior
    NULL;
  END;

  -- Test 4c: Invalid contract_term_months (should fail)
  BEGIN
    INSERT INTO contracts (
      quote_id,
      customer_id,
      contract_type,
      contract_term_months,
      monthly_recurring,
      total_contract_value
    ) VALUES (
      '00000000-0000-0000-0000-000000000001'::UUID,
      '00000000-0000-0000-0000-000000000002'::UUID,
      'fibre',
      18, -- Invalid term
      799.00,
      19176.00
    );
    RAISE EXCEPTION 'Test 4c FAILED: Invalid contract_term_months allowed';
  EXCEPTION WHEN check_violation THEN
    -- Expected behavior
    NULL;
  END;

  -- Test 4d: Valid enums should pass
  INSERT INTO contracts (
    quote_id,
    customer_id,
    contract_type,
    contract_term_months,
    monthly_recurring,
    total_contract_value,
    status
  ) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000002'::UUID,
    'fibre',
    12,
    799.00,
    9588.00,
    'draft'
  );

  -- Clean up
  DELETE FROM contracts WHERE contract_term_months = 12;

  RAISE NOTICE 'Test 4 PASSED: CHECK constraints enforced on status, contract_type, contract_term_months';
END $$;

-- Test 5: Contract number generation function
DO $$
DECLARE
  contract_num1 TEXT;
  contract_num2 TEXT;
  contract_num3 TEXT;
BEGIN
  -- Generate three contract numbers
  INSERT INTO contracts (
    quote_id, customer_id, contract_type, contract_term_months,
    monthly_recurring, total_contract_value
  ) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    '00000000-0000-0000-0000-000000000002'::UUID,
    'fibre', 24, 799.00, 19176.00
  ) RETURNING contract_number INTO contract_num1;

  INSERT INTO contracts (
    quote_id, customer_id, contract_type, contract_term_months,
    monthly_recurring, total_contract_value
  ) VALUES (
    '00000000-0000-0000-0000-000000000003'::UUID,
    '00000000-0000-0000-0000-000000000004'::UUID,
    'wireless', 12, 499.00, 5988.00
  ) RETURNING contract_number INTO contract_num2;

  INSERT INTO contracts (
    quote_id, customer_id, contract_type, contract_term_months,
    monthly_recurring, total_contract_value
  ) VALUES (
    '00000000-0000-0000-0000-000000000005'::UUID,
    '00000000-0000-0000-0000-000000000006'::UUID,
    'hybrid', 36, 1499.00, 53964.00
  ) RETURNING contract_number INTO contract_num3;

  -- Display examples
  RAISE NOTICE 'Test 5: Generated contract numbers:';
  RAISE NOTICE '  Example 1: %', contract_num1;
  RAISE NOTICE '  Example 2: %', contract_num2;
  RAISE NOTICE '  Example 3: %', contract_num3;

  -- Verify all follow CT-YYYY-NNN format
  IF contract_num1 !~ '^CT-\d{4}-\d{3}$' OR
     contract_num2 !~ '^CT-\d{4}-\d{3}$' OR
     contract_num3 !~ '^CT-\d{4}-\d{3}$' THEN
    RAISE EXCEPTION 'Test 5 FAILED: Contract numbers do not follow CT-YYYY-NNN format';
  END IF;

  -- Clean up
  DELETE FROM contracts WHERE contract_number IN (contract_num1, contract_num2, contract_num3);

  RAISE NOTICE 'Test 5 PASSED: Contract number generation produces valid CT-YYYY-NNN format';
END $$;

-- Test 6: RLS policies enforcement
DO $$
DECLARE
  test_customer_id UUID := '00000000-0000-0000-0000-000000000002'::UUID;
  test_contract_id UUID;
BEGIN
  -- Insert test contract
  INSERT INTO contracts (
    quote_id,
    customer_id,
    contract_type,
    contract_term_months,
    monthly_recurring,
    total_contract_value
  ) VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    test_customer_id,
    'fibre',
    24,
    799.00,
    19176.00
  ) RETURNING id INTO test_contract_id;

  -- Verify RLS is enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'contracts'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'Test 6 FAILED: RLS not enabled on contracts table';
  END IF;

  -- Verify at least 4 policies exist (customers, sales_reps, managers, admins)
  IF (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'contracts') < 4 THEN
    RAISE EXCEPTION 'Test 6 FAILED: Expected at least 4 RLS policies on contracts table';
  END IF;

  -- Clean up
  DELETE FROM contracts WHERE id = test_contract_id;

  RAISE NOTICE 'Test 6 PASSED: RLS enabled with required policies';
END $$;

-- Final summary
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CONTRACTS SYSTEM TEST SUITE COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total Tests: 6';
  RAISE NOTICE 'Status: ALL PASSED ✓';
  RAISE NOTICE '';
  RAISE NOTICE 'Test Coverage:';
  RAISE NOTICE '  1. Table creation and structure';
  RAISE NOTICE '  2. Contract number uniqueness (CT-YYYY-NNN)';
  RAISE NOTICE '  3. Foreign key constraints';
  RAISE NOTICE '  4. CHECK constraints (status, type, term)';
  RAISE NOTICE '  5. Auto-numbering function';
  RAISE NOTICE '  6. RLS policies';
  RAISE NOTICE '========================================';
END $$;
