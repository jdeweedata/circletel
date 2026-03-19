-- Add 'WorkConnect' to service_type CHECK constraint
ALTER TABLE service_packages DROP CONSTRAINT IF EXISTS service_packages_service_type_check;
ALTER TABLE service_packages ADD CONSTRAINT service_packages_service_type_check
CHECK (service_type IN (
  'SkyFibre', 'HomeFibreConnect', 'BizFibreConnect', 'WorkConnect', 'All',
  '5g', 'lte', 'fixed_lte', 'fibre', 'uncapped_wireless', '5G', 'LTE',
  'VoIP', 'voip', 'Hosting', 'hosting', 'Cloud_Services', 'cloud_services', 'cloud',
  'IT_Support', 'it_support', 'managed_it', 'Managed_IT',
  'Security', 'security', 'cybersecurity', 'cpe', 'hardware', 'other'
));

-- Add 'soho' to customer_type CHECK constraint
ALTER TABLE service_packages DROP CONSTRAINT IF EXISTS service_packages_customer_type_check;
ALTER TABLE service_packages ADD CONSTRAINT service_packages_customer_type_check
CHECK (customer_type IN ('consumer', 'business', 'both', 'soho'));
