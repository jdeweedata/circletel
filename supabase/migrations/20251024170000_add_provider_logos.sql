-- =====================================================
-- Add Provider Logo Support
-- Created: 2025-10-24
-- Purpose: Add logo columns to fttb_network_providers table and populate with CircleTel provider logos
-- =====================================================

-- STEP 1: Add logo-related columns to fttb_network_providers table
ALTER TABLE fttb_network_providers
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS logo_dark_url TEXT,
ADD COLUMN IF NOT EXISTS logo_light_url TEXT,
ADD COLUMN IF NOT EXISTS logo_format VARCHAR(10) DEFAULT 'svg',
ADD COLUMN IF NOT EXISTS logo_aspect_ratio DECIMAL(5,2);

-- STEP 2: Add comments for documentation
COMMENT ON COLUMN fttb_network_providers.logo_url IS 'Primary logo URL (default/main logo)';
COMMENT ON COLUMN fttb_network_providers.logo_dark_url IS 'Dark variant logo URL (for dark backgrounds)';
COMMENT ON COLUMN fttb_network_providers.logo_light_url IS 'Light variant logo URL (for light backgrounds)';
COMMENT ON COLUMN fttb_network_providers.logo_format IS 'Logo file format: svg, png, jpg';
COMMENT ON COLUMN fttb_network_providers.logo_aspect_ratio IS 'Logo width/height ratio for responsive scaling';

-- STEP 3: Update MTN provider with logo
UPDATE fttb_network_providers
SET
  logo_url = '/images/providers/mtn.png',
  logo_format = 'png',
  logo_aspect_ratio = 1.78  -- 3840/2160
WHERE provider_code = 'mtn';

-- STEP 4: Update DFA (Dark Fibre Africa) provider with logos
UPDATE fttb_network_providers
SET
  logo_url = '/images/providers/dfa-dark.png',
  logo_dark_url = '/images/providers/dfa-dark.png',
  logo_light_url = '/images/providers/dfa-white.png',
  logo_format = 'png',
  logo_aspect_ratio = 1.35  -- 1130/836
WHERE provider_code = 'dfa';

-- STEP 5: Update MetroFibre provider with logo
UPDATE fttb_network_providers
SET
  logo_url = '/images/providers/metrofibre.svg',
  logo_format = 'svg',
  logo_aspect_ratio = 2.15
WHERE provider_code = 'metrofibre';

-- STEP 6: Update Openserve provider with logo
UPDATE fttb_network_providers
SET
  logo_url = '/images/providers/openserve.svg',
  logo_format = 'svg',
  logo_aspect_ratio = 3.64
WHERE provider_code = 'openserve';

-- STEP 7: Update Vumatel provider with logo
UPDATE fttb_network_providers
SET
  logo_url = '/images/providers/vumatel.svg',
  logo_format = 'svg',
  logo_aspect_ratio = 5.88
WHERE provider_code = 'vumatel';

-- STEP 8: Create view for active providers with logos
CREATE OR REPLACE VIEW v_providers_with_logos AS
SELECT
  id,
  name,
  display_name,
  provider_code,
  provider_type,
  service_offerings,
  coverage_source,
  priority,
  logo_url,
  logo_dark_url,
  logo_light_url,
  logo_format,
  logo_aspect_ratio,
  active
FROM fttb_network_providers
WHERE active = true
  AND logo_url IS NOT NULL
ORDER BY priority ASC;

-- STEP 9: Create index for logo queries
CREATE INDEX IF NOT EXISTS idx_fttb_network_providers_logo
ON fttb_network_providers(provider_code, logo_url)
WHERE active = true AND logo_url IS NOT NULL;

-- STEP 10: Update v_products_with_providers view to include logo data
CREATE OR REPLACE VIEW v_products_with_providers AS
SELECT
  sp.id,
  sp.name,
  sp.service_type,
  sp.product_category,
  sp.customer_type,
  sp.speed_down,
  sp.speed_up,
  sp.price,
  sp.compatible_providers,
  sp.active,
  (
    SELECT json_agg(provider_info ORDER BY provider_info->>'priority')
    FROM (
      SELECT json_build_object(
        'provider_code', fnp.provider_code,
        'provider_name', fnp.display_name,
        'logo_url', fnp.logo_url,
        'logo_dark_url', fnp.logo_dark_url,
        'logo_light_url', fnp.logo_light_url,
        'logo_format', fnp.logo_format,
        'logo_aspect_ratio', fnp.logo_aspect_ratio,
        'active', fnp.active,
        'priority', fnp.priority
      ) AS provider_info
      FROM fttb_network_providers fnp
      WHERE fnp.provider_code = ANY(sp.compatible_providers)
      ORDER BY fnp.priority ASC
    ) AS ordered_providers
  ) AS provider_details
FROM service_packages sp
WHERE sp.active = true
  AND sp.compatible_providers IS NOT NULL
  AND array_length(sp.compatible_providers, 1) > 0;

-- STEP 11: Verification query
DO $$
DECLARE
  providers_with_logos INTEGER;
  total_active_providers INTEGER;
BEGIN
  SELECT COUNT(*) INTO providers_with_logos
  FROM fttb_network_providers
  WHERE active = true AND logo_url IS NOT NULL;

  SELECT COUNT(*) INTO total_active_providers
  FROM fttb_network_providers
  WHERE active = true;

  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Provider Logos - Migration Complete';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Logo Summary:';
  RAISE NOTICE '  ✓ Providers with logos: %', providers_with_logos;
  RAISE NOTICE '  ✓ Total active providers: %', total_active_providers;
  RAISE NOTICE '  ✓ Coverage: % %%', ROUND((providers_with_logos::DECIMAL / NULLIF(total_active_providers, 0) * 100), 2);
  RAISE NOTICE '';
  RAISE NOTICE 'Logo Locations:';
  RAISE NOTICE '  ✓ MTN: /images/providers/mtn.png (3840×2160, 31KB)';
  RAISE NOTICE '  ✓ DFA: /images/providers/dfa-dark.png, /images/providers/dfa-white.png';
  RAISE NOTICE '  ✓ MetroFibre: /images/providers/metrofibre.svg';
  RAISE NOTICE '  ✓ Openserve: /images/providers/openserve.svg';
  RAISE NOTICE '  ✓ Vumatel: /images/providers/vumatel.svg';
  RAISE NOTICE '';
  RAISE NOTICE 'Views Created:';
  RAISE NOTICE '  ✓ v_providers_with_logos (active providers with logos)';
  RAISE NOTICE '  ✓ v_products_with_providers (updated with logo data)';
  RAISE NOTICE '';
  RAISE NOTICE 'Ready for Component Implementation';
  RAISE NOTICE '================================================';
END $$;
