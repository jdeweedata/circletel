-- Link active CircleTel catalogue SKUs to parent product lines and
-- backfill SkyFibre Business 100 (SF-BIZ-100) from CPS v2.0.
-- Do not attach SKY-HOME-* to skyfibre-smb (different CPS).
-- Do not deactivate live SKUs — sellability is gated in application code.

INSERT INTO public.product_line_skus (product_line_id, source_table, source_id, sku)
SELECT pl.id, 'service_packages', sp.id::text, sp.sku
FROM public.service_packages sp
JOIN public.product_lines pl ON pl.code = 'skyfibre-smb'
WHERE sp.sku = 'SF-BIZ-100'
ON CONFLICT (source_table, source_id) DO NOTHING;

INSERT INTO public.product_line_skus (product_line_id, source_table, source_id, sku)
SELECT pl.id, 'service_packages', sp.id::text, sp.sku
FROM public.service_packages sp
JOIN public.product_lines pl ON pl.code = 'circleconnect-5g-essential'
WHERE sp.sku LIKE 'CC-5G-%'
  AND sp.active IS TRUE
ON CONFLICT (source_table, source_id) DO NOTHING;

INSERT INTO public.product_line_skus (product_line_id, source_table, source_id, sku)
SELECT pl.id, 'service_packages', sp.id::text, sp.sku
FROM public.service_packages sp
JOIN public.product_lines pl ON pl.code = 'bizfibreconnect'
WHERE (sp.sku LIKE 'DFA-BFC-%' OR sp.sku LIKE 'BIZ-FBR-%')
  AND sp.active IS TRUE
ON CONFLICT (source_table, source_id) DO NOTHING;

INSERT INTO public.product_line_skus (product_line_id, source_table, source_id, sku)
SELECT pl.id, 'service_packages', sp.id::text, sp.sku
FROM public.service_packages sp
JOIN public.product_lines pl ON pl.code = 'clinicconnect'
WHERE sp.sku = 'UNJ-MC-001'
ON CONFLICT (source_table, source_id) DO NOTHING;

-- CPS v2.0 Business 100: published retail R1,499 / TOTAL DIRECT COST R917.46.
-- The six §2.2 rows (incl. R10 support + R45 infra) sum to R927.46; the published
-- total cell omits R10. Package cost_price follows the published total; the
-- Pricing tab contribution uses summed monthly COS from these rows.
UPDATE public.service_packages
SET
  price = 1499,
  base_price_zar = 1499,
  cost_price_zar = 917.46,
  updated_at = now()
WHERE sku = 'SF-BIZ-100';

INSERT INTO public.product_cost_components (
  package_id, name, category, cost_amount, recurrence, amortisation_months, description, sort_order
)
SELECT
  sp.id,
  v.name,
  v.category::public.cost_component_category,
  v.cost_amount,
  v.recurrence::public.cost_recurrence_type,
  v.amortisation_months,
  v.description,
  v.sort_order
FROM public.service_packages sp
CROSS JOIN (
  VALUES
    ('MTN Wholesale (Tarana FWB)', 'provider', 599.00, 'monthly', NULL::integer, 'CPS §2.2 100 Mbps wholesale', 1),
    ('Static IP Address', 'addon_service', 50.00, 'monthly', NULL, 'CPS §2.2 static IP', 2),
    ('Infrastructure (BNG, Backhaul, CGNAT)', 'infrastructure', 45.00, 'monthly', NULL, 'CPS §2.2 infrastructure', 3),
    ('AgilityGIS BSS Platform', 'platform', 10.96, 'monthly', NULL, 'CPS §2.2 AgilityGIS', 4),
    ('Professional Installation', 'installation', 2550.00, 'amortised', 12, 'R2,550 amortised over 12 months', 5),
    ('Basic Business Support', 'support', 10.00, 'monthly', NULL, 'CPS §2.2 basic support', 6)
) AS v(name, category, cost_amount, recurrence, amortisation_months, description, sort_order)
WHERE sp.sku = 'SF-BIZ-100'
  AND NOT EXISTS (
    SELECT 1
    FROM public.product_cost_components c
    WHERE c.package_id = sp.id
      AND c.name = v.name
  );
