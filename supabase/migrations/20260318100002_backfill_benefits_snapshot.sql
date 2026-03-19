-- Backfill existing quote items with features from their linked service_packages
-- features is text[] in service_packages, convert to JSONB array for snapshot
-- Only sets raw features — formatted_benefits will be null for legacy items
-- The application code handles this gracefully via fallback logic
UPDATE business_quote_items bqi
SET benefits_snapshot = jsonb_build_object(
  'features', to_jsonb(COALESCE(sp.features, ARRAY[]::text[]))
)
FROM service_packages sp
WHERE bqi.package_id = sp.id
AND bqi.benefits_snapshot IS NULL;
