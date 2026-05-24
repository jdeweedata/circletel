-- Fix sync trigger to stop overwriting cost_price_zar with setup fee
-- cost_price_zar should hold actual monthly wholesale cost, not installation fee
CREATE OR REPLACE FUNCTION public.sync_service_package_pricing()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  base_slug TEXT;
  slug_counter INTEGER;
BEGIN
  -- If pricing object is updated, sync to root-level fields
  IF NEW.pricing IS NOT NULL THEN
    NEW.base_price_zar := (NEW.pricing->>'monthly')::numeric;
    -- DO NOT overwrite cost_price_zar from pricing.setup
    -- cost_price_zar holds actual monthly wholesale cost, not installation fee
    NEW.price := (NEW.pricing->>'monthly')::numeric;
    NEW.speed_down := COALESCE((NEW.pricing->>'download_speed')::integer, 0);
    NEW.speed_up := COALESCE((NEW.pricing->>'upload_speed')::integer, 0);
  END IF;

  -- If root-level fields are updated, sync to pricing object
  IF NEW.base_price_zar IS NOT NULL THEN
    NEW.pricing := jsonb_build_object(
      'monthly', COALESCE(NEW.base_price_zar, NEW.price, 0),
      'setup', COALESCE((NEW.pricing->>'setup')::numeric, 0),
      'download_speed', COALESCE(NEW.speed_down, 0),
      'upload_speed', COALESCE(NEW.speed_up, 0)
    );
  END IF;

  -- Auto-generate unique slug if not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      )
    );

    SELECT COUNT(*) + 1 INTO slug_counter
    FROM service_packages
    WHERE slug LIKE base_slug || '%'
      AND (TG_OP = 'INSERT' OR id != NEW.id);

    IF slug_counter > 1 THEN
      NEW.slug := base_slug || '-' || slug_counter;
    ELSE
      NEW.slug := base_slug;
    END IF;
  END IF;

  -- Sync status to active boolean
  NEW.active := (NEW.status = 'active');

  RETURN NEW;
END;
$function$;

-- Update cost_price_zar with actual monthly wholesale costs from product specs
-- SkyFibre Home
UPDATE service_packages SET cost_price_zar = 599 WHERE name = 'SkyFibre Home Plus' AND service_type = 'SkyFibre';
UPDATE service_packages SET cost_price_zar = 699 WHERE name = 'SkyFibre Home Max' AND service_type = 'SkyFibre' AND price = 999;
UPDATE service_packages SET cost_price_zar = 799 WHERE name = 'SkyFibre Home Ultra' AND service_type = 'SkyFibre';
UPDATE service_packages SET cost_price_zar = 739 WHERE name = 'SkyFibre Home Pro 50' AND service_type = 'SkyFibre';
UPDATE service_packages SET cost_price_zar = 839 WHERE name = 'SkyFibre Home Pro 100' AND service_type = 'SkyFibre';
UPDATE service_packages SET cost_price_zar = 939 WHERE name = 'SkyFibre Home Pro 200' AND service_type = 'SkyFibre';

-- SkyFibre SME
UPDATE service_packages SET cost_price_zar = 817.46 WHERE name = 'SkyFibre SME Essential' AND service_type = 'SkyFibre';
UPDATE service_packages SET cost_price_zar = 927.46 WHERE name = 'SkyFibre SME Professional' AND service_type = 'SkyFibre';
UPDATE service_packages SET cost_price_zar = 1037.46 WHERE name = 'SkyFibre SME Premium' AND service_type = 'SkyFibre';

-- BizFibreConnect (DFA)
UPDATE service_packages SET cost_price_zar = 1120.84 WHERE name = 'BizFibre Connect Lite' AND service_type = 'BizFibreConnect';
UPDATE service_packages SET cost_price_zar = 1120.84 WHERE name = 'BizFibre Connect Starter' AND service_type = 'BizFibreConnect';
UPDATE service_packages SET cost_price_zar = 1544.07 WHERE name = 'BizFibre Connect Plus' AND service_type = 'BizFibreConnect';
UPDATE service_packages SET cost_price_zar = 1852.59 WHERE name = 'BizFibre Connect Pro' AND service_type = 'BizFibreConnect';

-- WorkConnect SOHO
UPDATE service_packages SET cost_price_zar = 632.08 WHERE name = 'WorkConnect Starter' AND service_type = 'WorkConnect';
UPDATE service_packages SET cost_price_zar = 754.66 WHERE name = 'WorkConnect Plus' AND service_type = 'WorkConnect';
UPDATE service_packages SET cost_price_zar = 842.66 WHERE name = 'WorkConnect Pro' AND service_type = 'WorkConnect';
