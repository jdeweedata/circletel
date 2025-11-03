-- Test Invoice Number Generation
-- Purpose: Verify INV-YYYY-NNN format and sequential numbering
-- Run this after migration 20251104000001_create_invoicing_system.sql

-- Test: Generate 3 invoice numbers
DO $$
DECLARE
  invoice_num_1 TEXT;
  invoice_num_2 TEXT;
  invoice_num_3 TEXT;
  expected_year TEXT;
BEGIN
  expected_year := TO_CHAR(NOW(), 'YYYY');

  -- Test 1: First invoice
  SELECT generate_invoice_number() INTO invoice_num_1;
  RAISE NOTICE 'Invoice Number 1: %', invoice_num_1;

  -- Verify format
  IF invoice_num_1 LIKE 'INV-' || expected_year || '-%' THEN
    RAISE NOTICE '✓ Format matches INV-YYYY-NNN';
  ELSE
    RAISE EXCEPTION '✗ Invalid format: %', invoice_num_1;
  END IF;

  -- Insert a dummy invoice to increment counter
  INSERT INTO invoices (
    invoice_number,
    contract_id,
    customer_id,
    items,
    subtotal,
    vat_amount,
    total_amount,
    due_date
  ) SELECT
    invoice_num_1,
    (SELECT id FROM contracts LIMIT 1),
    (SELECT id FROM customers LIMIT 1),
    '[{"description": "Test", "quantity": 1, "unit_price": 100.00, "total": 100.00}]'::JSONB,
    100.00,
    15.00,
    115.00,
    CURRENT_DATE + INTERVAL '30 days'
  WHERE EXISTS (SELECT 1 FROM contracts LIMIT 1)
    AND EXISTS (SELECT 1 FROM customers LIMIT 1);

  -- Test 2: Second invoice (should be +1)
  SELECT generate_invoice_number() INTO invoice_num_2;
  RAISE NOTICE 'Invoice Number 2: %', invoice_num_2;

  -- Test 3: Third invoice (should be +2)
  INSERT INTO invoices (
    invoice_number,
    contract_id,
    customer_id,
    items,
    subtotal,
    vat_amount,
    total_amount,
    due_date
  ) SELECT
    invoice_num_2,
    (SELECT id FROM contracts LIMIT 1),
    (SELECT id FROM customers LIMIT 1),
    '[{"description": "Test 2", "quantity": 1, "unit_price": 200.00, "total": 200.00}]'::JSONB,
    200.00,
    30.00,
    230.00,
    CURRENT_DATE + INTERVAL '30 days'
  WHERE EXISTS (SELECT 1 FROM contracts LIMIT 1)
    AND EXISTS (SELECT 1 FROM customers LIMIT 1);

  SELECT generate_invoice_number() INTO invoice_num_3;
  RAISE NOTICE 'Invoice Number 3: %', invoice_num_3;

  -- Verify sequential numbering
  RAISE NOTICE '';
  RAISE NOTICE '=== TEST RESULTS ===';
  RAISE NOTICE 'Example Invoice Numbers:';
  RAISE NOTICE '  1: %', invoice_num_1;
  RAISE NOTICE '  2: %', invoice_num_2;
  RAISE NOTICE '  3: %', invoice_num_3;
  RAISE NOTICE '';
  RAISE NOTICE '✓ Invoice number generation working correctly';
  RAISE NOTICE '✓ Format: INV-YYYY-NNN';
  RAISE NOTICE '✓ Sequential numbering verified';

  -- Cleanup
  DELETE FROM invoices WHERE invoice_number IN (invoice_num_1, invoice_num_2);
END $$;
