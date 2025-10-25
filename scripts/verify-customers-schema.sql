-- Verify customers table schema includes business fields

-- Check if business columns exist
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customers'
  AND column_name IN ('business_name', 'business_registration', 'tax_number')
ORDER BY column_name;

-- Show all columns in customers table
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customers'
ORDER BY ordinal_position;

-- Check indexes on business fields
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'customers'
  AND indexname LIKE '%business%'
ORDER BY indexname;
