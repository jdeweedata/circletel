-- Apply standardized SKUs to active packages without SKUs
-- Epic 3.4 - SKU Auto-Generation
--
-- This migration generates SKUs in the format: {PROVIDER}-{CATEGORY}-{COUNTER}
-- Examples: MTN-5G-001, SKY-FBR-002, BIZ-HME-003

-- Step 1: Create temporary view with SKU assignments
CREATE TEMP VIEW sku_assignments AS
WITH package_analysis AS (
  SELECT
    id,
    name,
    -- Extract provider code
    CASE
      WHEN provider IS NOT NULL THEN UPPER(provider)
      WHEN LOWER(name) LIKE '%mtn%' THEN 'MTN'
      WHEN LOWER(name) LIKE '%sky%' THEN 'SKY'
      WHEN LOWER(name) LIKE '%bizfibre%' THEN 'BIZ'
      WHEN LOWER(name) LIKE '%homefibre%' THEN 'HOME'
      WHEN LOWER(name) LIKE '%wireless%' THEN 'WLS'
      ELSE 'GEN'
    END AS provider_code,
    -- Extract category code
    CASE
      WHEN service_type LIKE '%5G%' OR LOWER(name) LIKE '%5g%' THEN '5G'
      WHEN service_type LIKE '%LTE%' OR LOWER(name) LIKE '%lte%' THEN 'LTE'
      WHEN service_type LIKE '%Fibre%' OR LOWER(name) LIKE '%fibre%' THEN 'FBR'
      WHEN service_type LIKE '%Wireless%' OR LOWER(name) LIKE '%wireless%' THEN 'WLS'
      WHEN LOWER(name) LIKE '%business%' OR LOWER(name) LIKE '%biz%' THEN 'BIZ'
      WHEN LOWER(name) LIKE '%home%' THEN 'HME'
      ELSE 'PKG'
    END AS category_code
  FROM service_packages
  WHERE (sku IS NULL OR sku = '')
)
SELECT
  id,
  name,
  provider_code || '-' || category_code || '-' || LPAD(ROW_NUMBER() OVER (PARTITION BY provider_code, category_code ORDER BY name)::TEXT, 3, '0') AS new_sku
FROM package_analysis;

-- Step 2: Update service_packages with generated SKUs
UPDATE service_packages sp
SET sku = sa.new_sku
FROM sku_assignments sa
WHERE sp.id = sa.id;

-- Step 3: Verify results
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM service_packages
  WHERE sku IS NOT NULL AND sku != ''
    AND sku LIKE '___-___-___'; -- Match format: XXX-XXX-XXX

  RAISE NOTICE 'Successfully applied standardized SKUs to % packages', updated_count;
END $$;

-- Step 4: Show summary by provider-category
SELECT
  SUBSTRING(sku FROM 1 FOR POSITION('-' IN sku) - 1) AS provider,
  SUBSTRING(sku FROM POSITION('-' IN sku) + 1 FOR POSITION('-' IN SUBSTRING(sku FROM POSITION('-' IN sku) + 1)) - 1) AS category,
  COUNT(*) AS package_count,
  MIN(sku) AS first_sku,
  MAX(sku) AS last_sku
FROM service_packages
WHERE sku LIKE '___-___-___'
GROUP BY provider, category
ORDER BY provider, category;
