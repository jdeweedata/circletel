-- =============================================================================
-- VERIFY WHAT WAS SUCCESSFULLY CREATED
-- Run these queries to see exactly what exists
-- =============================================================================

-- Check what tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('coverage_leads', 'consumer_orders', 'business_quotes', 'kyc_documents', 'order_status_history')
ORDER BY table_name;

-- Check ALL columns in coverage_leads (including email!)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'coverage_leads'
ORDER BY ordinal_position;

-- Check indexes on coverage_leads
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'coverage_leads';

-- Check what enums exist
SELECT typname
FROM pg_type
WHERE typname IN ('customer_type', 'lead_source', 'order_status', 'quote_status', 'kyc_document_type', 'kyc_verification_status')
ORDER BY typname;

-- Check what functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('generate_order_number', 'generate_quote_number', 'calculate_quote_totals', 'update_updated_at_column', 'track_status_change')
ORDER BY routine_name;

-- =============================================================================
-- SUMMARY REPORT
-- =============================================================================

SELECT
  'Tables' as category,
  COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('coverage_leads', 'consumer_orders', 'business_quotes', 'kyc_documents', 'order_status_history')

UNION ALL

SELECT
  'Enums' as category,
  COUNT(*) as count
FROM pg_type
WHERE typname IN ('customer_type', 'lead_source', 'order_status', 'quote_status', 'kyc_document_type', 'kyc_verification_status')

UNION ALL

SELECT
  'Functions' as category,
  COUNT(*) as count
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('generate_order_number', 'generate_quote_number', 'calculate_quote_totals', 'update_updated_at_column', 'track_status_change')

UNION ALL

SELECT
  'Indexes on coverage_leads' as category,
  COUNT(*) as count
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'coverage_leads';

-- Expected:
-- Tables: 1-5 (depending on how far migration got)
-- Enums: 6
-- Functions: 0-5
-- Indexes: 7+ on coverage_leads
