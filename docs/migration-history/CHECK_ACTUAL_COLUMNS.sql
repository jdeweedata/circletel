-- Check exactly what columns exist in coverage_leads
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'coverage_leads'
ORDER BY ordinal_position;
