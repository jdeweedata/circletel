-- ============================================
-- KYC System Database Tests
-- ============================================
-- Purpose: Focused tests for kyc_sessions and rica_submissions tables
-- Test Count: 8 focused tests
-- Created: 2025-11-01

-- =====================================================
-- Setup Test Environment
-- =====================================================

BEGIN;

-- Create test data: customer, admin, quote
INSERT INTO customers (id, email, first_name, last_name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'test@example.com', 'Test', 'Customer');

INSERT INTO admin_users (id, email, full_name, status) VALUES
  ('22222222-2222-2222-2222-222222222222', 'admin@circletel.co.za', 'Test Admin', 'active');

INSERT INTO business_quotes (
  id,
  quote_number,
  customer_id,
  customer_type,
  company_name,
  contact_name,
  contact_email,
  contact_phone,
  service_address,
  contract_term,
  subtotal_monthly,
  subtotal_installation,
  vat_amount_monthly,
  vat_amount_installation,
  total_monthly,
  total_installation,
  status
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'BQ-2025-001',
  '11111111-1111-1111-1111-111111111111',
  'smme',
  'Test Company',
  'Test Contact',
  'contact@test.com',
  '0123456789',
  '123 Test St',
  24,
  699.00,
  0.00,
  104.85,
  0.00,
  803.85,
  0.00,
  'draft'
);

-- =====================================================
-- TEST 1: KYC session creation with valid quote_id
-- =====================================================

DO $$
DECLARE
  v_kyc_id UUID;
BEGIN
  INSERT INTO kyc_sessions (
    quote_id,
    didit_session_id,
    flow_type,
    user_type,
    status
  ) VALUES (
    '33333333-3333-3333-3333-333333333333',
    'didit_test_session_001',
    'sme_light',
    'business',
    'not_started'
  ) RETURNING id INTO v_kyc_id;

  ASSERT v_kyc_id IS NOT NULL, 'Test 1 FAILED: KYC session not created';
  RAISE NOTICE 'Test 1 PASSED: KYC session created successfully';
END $$;

-- =====================================================
-- TEST 2: RICA submission creation with valid kyc_session_id
-- =====================================================

DO $$
DECLARE
  v_kyc_id UUID;
  v_rica_id UUID;
BEGIN
  -- Get the KYC session ID from previous test
  SELECT id INTO v_kyc_id
  FROM kyc_sessions
  WHERE didit_session_id = 'didit_test_session_001'
  LIMIT 1;

  INSERT INTO rica_submissions (
    kyc_session_id,
    iccid,
    submitted_data,
    status
  ) VALUES (
    v_kyc_id,
    ARRAY['89270123456789012345'],
    '{"id_number": "8001015009087", "company_reg": "2025/123456/07"}'::jsonb,
    'pending'
  ) RETURNING id INTO v_rica_id;

  ASSERT v_rica_id IS NOT NULL, 'Test 2 FAILED: RICA submission not created';
  RAISE NOTICE 'Test 2 PASSED: RICA submission created successfully';
END $$;

-- =====================================================
-- TEST 3: Foreign key constraint CASCADE on quote delete
-- =====================================================

DO $$
DECLARE
  v_test_quote_id UUID := '44444444-4444-4444-4444-444444444444';
  v_kyc_count INTEGER;
BEGIN
  -- Create test quote
  INSERT INTO business_quotes (
    id,
    quote_number,
    customer_id,
    customer_type,
    company_name,
    contact_name,
    contact_email,
    contact_phone,
    service_address,
    contract_term,
    total_monthly,
    total_installation,
    status
  ) VALUES (
    v_test_quote_id,
    'BQ-2025-002',
    '11111111-1111-1111-1111-111111111111',
    'smme',
    'Test Company 2',
    'Test Contact',
    'contact2@test.com',
    '0123456789',
    '456 Test Ave',
    12,
    500.00,
    0.00,
    'draft'
  );

  -- Create KYC session linked to quote
  INSERT INTO kyc_sessions (
    quote_id,
    didit_session_id,
    flow_type,
    user_type
  ) VALUES (
    v_test_quote_id,
    'didit_test_cascade_001',
    'sme_light',
    'business'
  );

  -- Delete the quote
  DELETE FROM business_quotes WHERE id = v_test_quote_id;

  -- Check if KYC session was also deleted (CASCADE)
  SELECT COUNT(*) INTO v_kyc_count
  FROM kyc_sessions
  WHERE didit_session_id = 'didit_test_cascade_001';

  ASSERT v_kyc_count = 0, 'Test 3 FAILED: KYC session not deleted on quote CASCADE';
  RAISE NOTICE 'Test 3 PASSED: CASCADE delete works correctly';
END $$;

-- =====================================================
-- TEST 4: CHECK constraints on status enums
-- =====================================================

DO $$
DECLARE
  v_error_raised BOOLEAN := FALSE;
BEGIN
  -- Try to insert invalid status
  BEGIN
    INSERT INTO kyc_sessions (
      quote_id,
      didit_session_id,
      flow_type,
      user_type,
      status
    ) VALUES (
      '33333333-3333-3333-3333-333333333333',
      'didit_invalid_status',
      'sme_light',
      'business',
      'invalid_status'  -- This should fail
    );
  EXCEPTION
    WHEN check_violation THEN
      v_error_raised := TRUE;
  END;

  ASSERT v_error_raised = TRUE, 'Test 4 FAILED: Invalid status was accepted';
  RAISE NOTICE 'Test 4 PASSED: Status CHECK constraint works';
END $$;

-- =====================================================
-- TEST 5: JSONB extracted_data storage and retrieval
-- =====================================================

DO $$
DECLARE
  v_kyc_id UUID;
  v_extracted JSONB;
  v_liveness_score NUMERIC;
BEGIN
  INSERT INTO kyc_sessions (
    quote_id,
    didit_session_id,
    flow_type,
    user_type,
    extracted_data
  ) VALUES (
    '33333333-3333-3333-3333-333333333333',
    'didit_jsonb_test',
    'sme_light',
    'business',
    '{
      "id_number": "8001015009087",
      "company_reg": "2025/123456/07",
      "liveness_score": 0.95,
      "proof_of_address": {
        "type": "utility_bill",
        "address": "123 Test St"
      },
      "directors": [
        {"name": "John Doe", "id_number": "7501015009088"}
      ]
    }'::jsonb
  ) RETURNING id INTO v_kyc_id;

  -- Retrieve and validate JSONB data
  SELECT extracted_data INTO v_extracted
  FROM kyc_sessions
  WHERE id = v_kyc_id;

  v_liveness_score := (v_extracted->>'liveness_score')::numeric;

  ASSERT v_extracted->>'id_number' = '8001015009087', 'Test 5 FAILED: ID number mismatch';
  ASSERT v_liveness_score = 0.95, 'Test 5 FAILED: Liveness score mismatch';
  ASSERT jsonb_array_length(v_extracted->'directors') = 1, 'Test 5 FAILED: Directors array incorrect';

  RAISE NOTICE 'Test 5 PASSED: JSONB storage and retrieval works';
END $$;

-- =====================================================
-- TEST 6: RLS policy - customer SELECT own sessions
-- =====================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Set session to act as customer
  SET LOCAL role TO authenticated;
  PERFORM set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111"}', true);

  -- Customer should see their own KYC sessions
  SELECT COUNT(*) INTO v_count
  FROM kyc_sessions ks
  JOIN business_quotes bq ON bq.id = ks.quote_id
  WHERE bq.customer_id = '11111111-1111-1111-1111-111111111111';

  ASSERT v_count > 0, 'Test 6 FAILED: Customer cannot see their own KYC sessions';
  RAISE NOTICE 'Test 6 PASSED: RLS policy allows customer to SELECT own sessions';

  -- Reset role
  RESET role;
END $$;

-- =====================================================
-- TEST 7: RLS policy - admin ALL operations
-- =====================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Set session to act as admin
  SET LOCAL role TO authenticated;
  PERFORM set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222"}', true);

  -- Admin should see all KYC sessions
  SELECT COUNT(*) INTO v_count
  FROM kyc_sessions;

  ASSERT v_count > 0, 'Test 7 FAILED: Admin cannot see KYC sessions';
  RAISE NOTICE 'Test 7 PASSED: RLS policy allows admin ALL operations';

  -- Reset role
  RESET role;
END $$;

-- =====================================================
-- TEST 8: Trigger auto-creates KYC session on quote approval
-- =====================================================

DO $$
DECLARE
  v_kyc_count INTEGER;
  v_flow_type TEXT;
BEGIN
  -- Create a new quote in draft status
  INSERT INTO business_quotes (
    id,
    quote_number,
    customer_id,
    customer_type,
    company_name,
    contact_name,
    contact_email,
    contact_phone,
    service_address,
    contract_term,
    total_monthly,
    total_installation,
    status
  ) VALUES (
    '55555555-5555-5555-5555-555555555555',
    'BQ-2025-003',
    '11111111-1111-1111-1111-111111111111',
    'smme',
    'Trigger Test Company',
    'Test Contact',
    'trigger@test.com',
    '0123456789',
    '789 Trigger St',
    24,
    699.00,  -- Total will be 699*24 + 0 = 16,776 (< 500k = sme_light)
    0.00,
    'draft'
  );

  -- Update quote to approved (should trigger KYC session creation)
  UPDATE business_quotes
  SET status = 'approved'
  WHERE id = '55555555-5555-5555-5555-555555555555';

  -- Check if KYC session was created
  SELECT COUNT(*), MAX(flow_type) INTO v_kyc_count, v_flow_type
  FROM kyc_sessions
  WHERE quote_id = '55555555-5555-5555-5555-555555555555';

  ASSERT v_kyc_count = 1, 'Test 8 FAILED: KYC session not auto-created on quote approval';
  ASSERT v_flow_type = 'sme_light', 'Test 8 FAILED: Flow type incorrect (expected sme_light)';

  RAISE NOTICE 'Test 8 PASSED: Trigger auto-creates KYC session with correct flow_type';
END $$;

-- =====================================================
-- Cleanup Test Environment
-- =====================================================

ROLLBACK;

-- =====================================================
-- Test Summary
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'KYC SYSTEM DATABASE TESTS COMPLETED';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total Tests: 8';
  RAISE NOTICE 'All tests executed in transaction (rolled back)';
  RAISE NOTICE '============================================';
END $$;
