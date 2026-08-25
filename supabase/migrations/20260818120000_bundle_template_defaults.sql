-- Flyer builder defaults on product_lines + open BOM roles.
-- OTG / CircleConnect become editable working rows; last-approved live flyer
-- is stored in published_defaults so sell surfaces do not move until finance
-- signs a commercial change.

ALTER TABLE public.product_lines
  ADD COLUMN IF NOT EXISTS submitted_for_approval_at timestamptz,
  ADD COLUMN IF NOT EXISTS submitted_for_approval_by uuid,
  ADD COLUMN IF NOT EXISTS default_term_months integer NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS default_helios_includes_cpe boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_m365_seats integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_connectivity_cost_excl numeric(12,2),
  ADD COLUMN IF NOT EXISTS billed_incl_vat_zar numeric(12,2),
  ADD COLUMN IF NOT EXISTS published_package_id uuid REFERENCES public.service_packages(id),
  ADD COLUMN IF NOT EXISTS sales_blurb text,
  ADD COLUMN IF NOT EXISTS published_defaults jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'product_lines_default_term_months_check'
  ) THEN
    ALTER TABLE public.product_lines
      ADD CONSTRAINT product_lines_default_term_months_check
      CHECK (default_term_months = ANY (ARRAY[12, 24, 36]));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'product_lines_default_m365_seats_check'
  ) THEN
    ALTER TABLE public.product_lines
      ADD CONSTRAINT product_lines_default_m365_seats_check
      CHECK (default_m365_seats >= 0);
  END IF;
END $$;

COMMENT ON COLUMN public.product_lines.billed_incl_vat_zar IS
  'Flyer price incl VAT. list_arpu_incl_vat_zar stays the catalogue/list figure.';
COMMENT ON COLUMN public.product_lines.published_defaults IS
  'Last finance-approved composer defaults. Sell surfaces read this, not working columns.';

-- Widen BOM so v2 can add slots without another rewrite. v1 UI still uses
-- connectivity / cpe / licence only.
ALTER TABLE public.product_bundle_components
  ADD COLUMN IF NOT EXISTS component_config jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.product_bundle_components
  DROP CONSTRAINT IF EXISTS product_bundle_components_component_role_check;
ALTER TABLE public.product_bundle_components
  DROP CONSTRAINT IF EXISTS product_bundle_components_source_check;

ALTER TABLE public.product_bundle_components
  ADD CONSTRAINT product_bundle_components_component_role_check
    CHECK (component_role = ANY (ARRAY[
      'connectivity','cpe','licence',
      'access','labour','addon'
    ]));

ALTER TABLE public.product_bundle_components
  ADD CONSTRAINT product_bundle_components_source_check
    CHECK (source = ANY (ARRAY[
      'skytel_helios','rectron','m365_csp','service_package',
      'mtn_wholesale','dfa','supplier_product'
    ]));

-- Seed working columns from the two hardcoded flyers.
UPDATE public.product_lines
SET
  default_term_months = 12,
  default_helios_includes_cpe = false,
  default_m365_seats = 1,
  default_connectivity_cost_excl = 174,
  billed_incl_vat_zar = 399,
  published_defaults = NULL
WHERE code = 'otg';

UPDATE public.product_lines pl
SET
  default_term_months = 24,
  default_helios_includes_cpe = true,
  default_m365_seats = 0,
  default_connectivity_cost_excl = 390.43,
  billed_incl_vat_zar = 489,
  published_package_id = sp.id,
  published_defaults = jsonb_build_object(
    'termMonths', 24,
    'heliosIncludesCpe', true,
    'm365Seats', 0,
    'connectivityCostExcl', 390.43,
    'billedInclVat', 489,
    'packageSku', 'CC-5G-CON-035'
  )
FROM public.service_packages sp
WHERE pl.code = 'circleconnect-5g-essential'
  AND sp.sku = 'CC-5G-CON-035';

UPDATE public.product_lines
SET
  default_term_months = 24,
  default_helios_includes_cpe = true,
  default_m365_seats = 0,
  default_connectivity_cost_excl = 390.43,
  billed_incl_vat_zar = 489,
  published_defaults = jsonb_build_object(
    'termMonths', 24,
    'heliosIncludesCpe', true,
    'm365Seats', 0,
    'connectivityCostExcl', 390.43,
    'billedInclVat', 489,
    'packageSku', 'CC-5G-CON-035'
  )
WHERE code = 'circleconnect-5g-essential'
  AND published_defaults IS NULL;
