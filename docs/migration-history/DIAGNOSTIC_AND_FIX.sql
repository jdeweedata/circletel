-- =============================================================================
-- DIAGNOSTIC AND FIX SCRIPT
-- Use this to diagnose and fix the "column email does not exist" error
-- =============================================================================

-- =============================================================================
-- STEP 1: DIAGNOSTIC - Check what exists
-- =============================================================================

-- Check if coverage_leads table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'coverage_leads'
) as table_exists;

-- Check what columns exist in coverage_leads (if table exists)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'coverage_leads'
ORDER BY ordinal_position;

-- Check what indexes exist for coverage_leads
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'coverage_leads';

-- Check if custom types exist
SELECT typname
FROM pg_type
WHERE typname IN ('customer_type', 'lead_source', 'order_status', 'quote_status', 'kyc_document_type', 'kyc_verification_status')
ORDER BY typname;

-- =============================================================================
-- STEP 2: CLEAN UP (Run this if you see issues above)
-- =============================================================================

-- Drop all indexes first (if they exist)
DROP INDEX IF EXISTS idx_coverage_leads_customer_type CASCADE;
DROP INDEX IF EXISTS idx_coverage_leads_status CASCADE;
DROP INDEX IF EXISTS idx_coverage_leads_email CASCADE;
DROP INDEX IF EXISTS idx_coverage_leads_phone CASCADE;
DROP INDEX IF EXISTS idx_coverage_leads_zoho_lead_id CASCADE;
DROP INDEX IF EXISTS idx_coverage_leads_created_at CASCADE;
DROP INDEX IF EXISTS idx_coverage_leads_next_follow_up CASCADE;

DROP INDEX IF EXISTS idx_consumer_orders_order_number CASCADE;
DROP INDEX IF EXISTS idx_consumer_orders_status CASCADE;
DROP INDEX IF EXISTS idx_consumer_orders_email CASCADE;
DROP INDEX IF EXISTS idx_consumer_orders_phone CASCADE;
DROP INDEX IF EXISTS idx_consumer_orders_created_at CASCADE;
DROP INDEX IF EXISTS idx_consumer_orders_installation_date CASCADE;

DROP INDEX IF EXISTS idx_business_quotes_quote_number CASCADE;
DROP INDEX IF EXISTS idx_business_quotes_status CASCADE;
DROP INDEX IF EXISTS idx_business_quotes_company_name CASCADE;
DROP INDEX IF EXISTS idx_business_quotes_contact_email CASCADE;
DROP INDEX IF EXISTS idx_business_quotes_sales_rep CASCADE;
DROP INDEX IF EXISTS idx_business_quotes_created_at CASCADE;
DROP INDEX IF EXISTS idx_business_quotes_valid_until CASCADE;

DROP INDEX IF EXISTS idx_kyc_documents_consumer_order CASCADE;
DROP INDEX IF EXISTS idx_kyc_documents_business_quote CASCADE;
DROP INDEX IF EXISTS idx_kyc_documents_verification_status CASCADE;
DROP INDEX IF EXISTS idx_kyc_documents_document_type CASCADE;
DROP INDEX IF EXISTS idx_kyc_documents_customer_email CASCADE;
DROP INDEX IF EXISTS idx_kyc_documents_expiry_date CASCADE;

DROP INDEX IF EXISTS idx_order_status_history_entity CASCADE;
DROP INDEX IF EXISTS idx_order_status_history_status_changed_at CASCADE;
DROP INDEX IF EXISTS idx_order_status_history_changed_by CASCADE;

-- Drop all triggers
DROP TRIGGER IF EXISTS update_coverage_leads_updated_at ON coverage_leads CASCADE;
DROP TRIGGER IF EXISTS update_consumer_orders_updated_at ON consumer_orders CASCADE;
DROP TRIGGER IF EXISTS update_business_quotes_updated_at ON business_quotes CASCADE;
DROP TRIGGER IF EXISTS update_kyc_documents_updated_at ON kyc_documents CASCADE;
DROP TRIGGER IF EXISTS calculate_business_quote_totals ON business_quotes CASCADE;
DROP TRIGGER IF EXISTS track_consumer_order_status ON consumer_orders CASCADE;
DROP TRIGGER IF EXISTS track_business_quote_status ON business_quotes CASCADE;
DROP TRIGGER IF EXISTS track_coverage_lead_status ON coverage_leads CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS generate_quote_number() CASCADE;
DROP FUNCTION IF EXISTS calculate_quote_totals() CASCADE;
DROP FUNCTION IF EXISTS track_status_change() CASCADE;

-- Drop all tables in correct order (respects foreign keys)
DROP TABLE IF EXISTS order_status_history CASCADE;
DROP TABLE IF EXISTS kyc_documents CASCADE;
DROP TABLE IF EXISTS business_quotes CASCADE;
DROP TABLE IF EXISTS consumer_orders CASCADE;
DROP TABLE IF EXISTS coverage_leads CASCADE;

-- Drop all types
DROP TYPE IF EXISTS kyc_verification_status CASCADE;
DROP TYPE IF EXISTS kyc_document_type CASCADE;
DROP TYPE IF EXISTS quote_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS lead_source CASCADE;
DROP TYPE IF EXISTS customer_type CASCADE;

-- =============================================================================
-- STEP 3: VERIFY CLEANUP
-- =============================================================================

-- Verify all tables dropped
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('coverage_leads', 'consumer_orders', 'business_quotes', 'kyc_documents', 'order_status_history');
-- Should return 0 rows

-- Verify all types dropped
SELECT typname
FROM pg_type
WHERE typname IN ('customer_type', 'lead_source', 'order_status', 'quote_status', 'kyc_document_type', 'kyc_verification_status');
-- Should return 0 rows

-- =============================================================================
-- STEP 4: NOW RUN THE FULL MIGRATION
-- =============================================================================

-- After cleanup, copy and paste the ENTIRE contents of:
-- supabase/migrations/20251019000003_create_customer_journey_system.sql
-- into a NEW query and run it.

-- =============================================================================
-- STEP 5: VERIFICATION AFTER MIGRATION
-- =============================================================================

-- Check all tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('coverage_leads', 'consumer_orders', 'business_quotes', 'kyc_documents', 'order_status_history')
ORDER BY table_name;
-- Should return 5 rows

-- Check coverage_leads has email column
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'coverage_leads'
AND column_name = 'email';
-- Should return 1 row with column_name = 'email'

-- Check all indexes created
SELECT tablename, COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('coverage_leads', 'consumer_orders', 'business_quotes', 'kyc_documents', 'order_status_history')
GROUP BY tablename
ORDER BY tablename;
-- Should show indexes for each table

-- Test functions
SELECT generate_order_number();
-- Should return: ORD-YYYYMMDD-XXXX

SELECT generate_quote_number();
-- Should return: QTE-YYYYMMDD-XXXX

-- =============================================================================
-- QUICK TEST
-- =============================================================================

-- Test inserting a coverage lead
INSERT INTO coverage_leads (
  customer_type,
  first_name,
  last_name,
  email,
  phone,
  address,
  city,
  province,
  lead_source,
  status
) VALUES (
  'consumer',
  'Test',
  'User',
  'test@example.com',
  '+27821234567',
  '123 Test Street',
  'Johannesburg',
  'Gauteng',
  'coverage_checker',
  'new'
) RETURNING id, email, created_at;

-- Verify insert worked
SELECT COUNT(*) as total_leads FROM coverage_leads;
-- Should return: 1

-- Clean up test data
DELETE FROM coverage_leads WHERE email = 'test@example.com';

-- Final verification
SELECT COUNT(*) FROM coverage_leads;
-- Should return: 0

-- =============================================================================
-- SUCCESS!
-- =============================================================================

-- If you got here without errors, your migration is working correctly.
-- You can now proceed with Phase 2 implementation.
