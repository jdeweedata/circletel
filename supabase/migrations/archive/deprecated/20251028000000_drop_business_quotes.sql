-- Clean up existing business quotes schema
-- Run this FIRST, then run the full migration

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS business_quote_signatures CASCADE;
DROP TABLE IF EXISTS business_quote_versions CASCADE;
DROP TABLE IF EXISTS business_quote_items CASCADE;
DROP TABLE IF EXISTS business_quote_terms CASCADE;
DROP TABLE IF EXISTS business_quotes CASCADE;

-- Drop types
DROP TYPE IF EXISTS quote_item_type CASCADE;
DROP TYPE IF EXISTS quote_status CASCADE;

-- Verification query (should return empty after cleanup)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%quote%';
