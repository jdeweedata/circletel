-- Add SkyFibre Business 100 Managed Router as an optional attach COS row.
-- CPS v2.0 §2.1: router is excluded from the base tier (BYOD or Managed Router R149/m).
-- FSD MOD_ROUTER: retail R149, direct cost R75. Hardware: Reyee RG-EG105GW (dealer R1,025).

INSERT INTO public.product_cost_components (
  package_id, name, category, cost_amount, recurrence, description, sort_order,
  is_optional, hardware_model, hardware_dealer_cost, hardware_retail_value
)
SELECT
  sp.id,
  'Managed Router (Reyee RG-EG105GW)',
  'hardware'::public.cost_component_category,
  75.00,
  'monthly'::public.cost_recurrence_type,
  'CPS §3 / FSD MOD_ROUTER. Not in base tier — attach at R149/m or BYOD.',
  7,
  true,
  'Reyee RG-EG105GW',
  1025.00,
  1499.00
FROM public.service_packages sp
WHERE sp.sku = 'SF-BIZ-100'
  AND NOT EXISTS (
    SELECT 1
    FROM public.product_cost_components c
    WHERE c.package_id = sp.id
      AND c.name = 'Managed Router (Reyee RG-EG105GW)'
  );
