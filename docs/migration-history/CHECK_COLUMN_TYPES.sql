-- Check the actual data types of customer_type and lead_source columns
SELECT
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'coverage_leads'
AND column_name IN ('customer_type', 'lead_source', 'email');
