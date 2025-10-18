SELECT 
  id,
  name,
  service_type,
  technology_type,
  provider,
  download_speed,
  upload_speed,
  price,
  promotion_price,
  cost_wholesale,
  is_active,
  created_at
FROM service_packages 
WHERE service_type ILIKE '%SkyFibre%' OR name ILIKE '%SkyFibre%'
ORDER BY created_at;
