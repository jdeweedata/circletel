-- Migration: Expand service_type constraint to support new product categories
-- This adds support for Cloud & Hosting, IT Managed Services, VoIP, and Security products

-- Drop the existing constraint
ALTER TABLE service_packages DROP CONSTRAINT IF EXISTS service_packages_service_type_check;

-- Add new constraint with expanded service types
-- Includes both legacy values and new product categories
ALTER TABLE service_packages ADD CONSTRAINT service_packages_service_type_check
CHECK (service_type IN (
  -- Legacy connectivity services (keep for backward compatibility)
  'SkyFibre',
  'HomeFibreConnect', 
  'BizFibreConnect',
  'All',
  '5g',
  'lte',
  'fixed_lte',
  'fibre',
  'uncapped_wireless',
  -- New: Case-insensitive variants (for form compatibility)
  '5G',
  'LTE',
  -- New: VoIP services
  'VoIP',
  'voip',
  -- New: Cloud & Hosting services
  'Hosting',
  'hosting',
  'Cloud_Services',
  'cloud_services',
  'cloud',
  -- New: IT Managed Services
  'IT_Support',
  'it_support',
  'managed_it',
  'Managed_IT',
  -- New: Security services
  'Security',
  'security',
  'cybersecurity',
  -- New: Hardware/CPE
  'cpe',
  'hardware',
  -- New: Generic/Other
  'other'
));

-- Add comment for documentation
COMMENT ON CONSTRAINT service_packages_service_type_check ON service_packages IS 
'Allowed service types: Connectivity (SkyFibre, HomeFibreConnect, BizFibreConnect, 5g/5G, lte/LTE, fixed_lte, fibre, uncapped_wireless), 
VoIP (VoIP, voip), Cloud & Hosting (Hosting, Cloud_Services, cloud), IT Services (IT_Support, managed_it), 
Security (Security, cybersecurity), Hardware (cpe, hardware), Other (other, All)';
