-- ============================================================================
-- CircleTel Database Cleanup Script
-- Purpose: Remove test data before ZOHO Billing backfill (Phase 5)
-- Created: 2025-11-20
-- ============================================================================

-- This script removes all test data identified during the database audit
-- and prepares the database for production ZOHO Billing sync.

BEGIN;

-- ============================================================================
-- PHASE 1: Mark Internal Test Accounts
-- ============================================================================

-- Update 4 admin user accounts that were created as customers for testing
-- Mark them as 'internal_test' to exclude from ZOHO sync

UPDATE customers
SET account_type = 'internal_test'
WHERE email IN (
  'devadmin@circletel.co.za',
  'product.manager@circletel.co.za',
  'editor@circletel.co.za',
  'viewer@circletel.co.za'
);

-- Verify update
SELECT id, email, account_number, account_type
FROM customers
WHERE account_type = 'internal_test';

-- ============================================================================
-- PHASE 2: Delete Test Customer
-- ============================================================================

-- Delete test customer (already synced to ZOHO - manual cleanup required)
-- ZOHO Customer ID: 6179546000000820001 (must be deleted manually from ZOHO)

DELETE FROM customers
WHERE email = 'test@circletel.test'
AND id = '0adb9dac-6512-4bb0-8592-60fe74434c78';

-- ============================================================================
-- PHASE 3: Delete Test Business Quotes
-- ============================================================================

-- Delete 2 test business quotes

DELETE FROM business_quotes
WHERE id IN (
  '63328b37-7c0a-461e-b596-14af8df31050',  -- BQ-2025-015 (Test Company Ltd)
  'db1e8876-0db0-4b46-9787-719f81eb909b'   -- BQ-2025-001 (Test Enterprise Solutions)
);

-- ============================================================================
-- PHASE 4: Delete Test Admin User
-- ============================================================================

-- Delete test admin user account

DELETE FROM admin_users
WHERE email = 'finaltest@circletel.co.za'
AND id = '125dd25f-a66e-4854-a044-f3cf5db96ed8';

-- ============================================================================
-- PHASE 5: Delete Payment Validation Tests
-- ============================================================================

-- Delete 26 R1.00 payment validation test transactions

DELETE FROM payment_transactions
WHERE reference LIKE 'PAYMENT-METHOD-VALIDATION%'
AND customer_email = 'test@circletel.co.za'
AND status = 'pending'
AND amount = 1.00;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count remaining records by type
SELECT 'CUSTOMERS - Total' AS metric, COUNT(*) AS count FROM customers
UNION ALL
SELECT 'CUSTOMERS - Production' AS metric, COUNT(*) AS count FROM customers WHERE account_type IN ('personal', 'business')
UNION ALL
SELECT 'CUSTOMERS - Internal Test' AS metric, COUNT(*) AS count FROM customers WHERE account_type = 'internal_test'
UNION ALL
SELECT 'CUSTOMERS - With ZOHO ID' AS metric, COUNT(*) AS count FROM customers WHERE zoho_billing_customer_id IS NOT NULL
UNION ALL
SELECT 'BUSINESS QUOTES - Total' AS metric, COUNT(*) AS count FROM business_quotes
UNION ALL
SELECT 'ADMIN USERS - Total' AS metric, COUNT(*) AS count FROM admin_users
UNION ALL
SELECT 'PAYMENT TRANSACTIONS - Total' AS metric, COUNT(*) AS count FROM payment_transactions
UNION ALL
SELECT 'PAYMENT TRANSACTIONS - Completed' AS metric, COUNT(*) AS count FROM payment_transactions WHERE status = 'completed';

-- List production customers ready for ZOHO sync
SELECT
  id,
  account_number,
  email,
  first_name || ' ' || last_name AS full_name,
  account_type,
  status,
  zoho_billing_customer_id,
  zoho_sync_status
FROM customers
WHERE account_type IN ('personal', 'business')
AND zoho_billing_customer_id IS NULL
ORDER BY account_number;

-- ============================================================================
-- EXPECTED RESULTS
-- ============================================================================
-- After this cleanup:
-- - 4 customers marked as 'internal_test' (excluded from ZOHO sync)
-- - 17 production customers ready for ZOHO backfill
-- - 0 test business quotes
-- - 0 test admin users
-- - 0 payment validation tests
-- - 0 ZOHO billing customer IDs (all NULL - ready for fresh sync)
-- ============================================================================

COMMIT;

-- ============================================================================
-- MANUAL STEPS REQUIRED AFTER RUNNING THIS SCRIPT
-- ============================================================================
-- 1. Log into ZOHO Billing dashboard
-- 2. Navigate to Customers
-- 3. Search for Customer ID: 6179546000000820001
-- 4. Delete this test customer from ZOHO Billing
-- 5. Verify no orphaned subscriptions or invoices linked to this customer
-- 6. Proceed with Phase 5: ZOHO Billing backfill scripts
-- ============================================================================
