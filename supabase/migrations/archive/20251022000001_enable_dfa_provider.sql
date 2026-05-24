-- =====================================================
-- Enable DFA Provider and Configure API Settings
-- Created: 2025-10-22
-- Purpose: Activate DFA provider for coverage checking
-- =====================================================

-- Enable DFA provider with ArcGIS REST API configuration
UPDATE fttb_network_providers
SET
  active = true,
  coverage_source = 'api',
  coverage_api_url = 'https://gisportal.dfafrica.co.za/server/rest/services/API',
  coverage_api_type = 'arcgis_rest',
  api_version = 'ArcGIS REST API 10.x',
  api_documentation_url = 'https://gisportal.dfafrica.co.za/arcgis/rest/services',
  service_offerings = '["fibre"]'::jsonb,
  api_credentials = '{
    "endpoints": {
      "connected_buildings": "/DFA_Connected_Buildings/MapServer/0/query",
      "near_net": "/Promotions/MapServer/1/query",
      "ductbank": "/API_BasedOSPLayers/MapServer/1/query"
    },
    "spatial_reference": {
      "input_wkid": 102100,
      "output_wkid": 4326
    },
    "coverage_types": {
      "connected": "Active DFA fiber connection available",
      "near_net": "Fiber extension available (within 100-200m)",
      "no_coverage": "No DFA coverage at this location"
    },
    "query_timeout_ms": 5000,
    "cache_ttl_seconds": 300
  }'::jsonb,
  priority = 2,
  updated_at = NOW()
WHERE provider_code = 'dfa';

-- Verify the update
SELECT
  provider_code,
  display_name,
  active,
  coverage_source,
  coverage_api_url,
  coverage_api_type,
  priority,
  service_offerings,
  api_credentials->>'endpoints' as endpoints_config
FROM fttb_network_providers
WHERE provider_code = 'dfa';

-- Verify both active providers
SELECT
  provider_code,
  display_name,
  active,
  priority,
  service_offerings
FROM fttb_network_providers
WHERE active = true
ORDER BY priority;
