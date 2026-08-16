-- SF-BIZ-100 includes the managed router on a 24-month contract.
-- Hardware: Reyee RG-EG105GW dealer cost R1,025 amortised over 24 months (R42.71/m).
-- Not an optional BYOD attach.

UPDATE public.product_cost_components c
SET
  is_optional = false,
  recurrence = 'amortised'::public.cost_recurrence_type,
  amortisation_months = 24,
  cost_amount = 1025.00,
  hardware_model = 'Reyee RG-EG105GW',
  hardware_dealer_cost = 1025.00,
  hardware_retail_value = 1499.00,
  description = 'Included on 24-month contract. Dealer cost R1,025 amortised over 24 months.',
  sort_order = 7,
  updated_at = now()
FROM public.service_packages sp
WHERE c.package_id = sp.id
  AND sp.sku = 'SF-BIZ-100'
  AND c.name = 'Managed Router (Reyee RG-EG105GW)';

UPDATE public.service_packages
SET
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('contract_months', 24),
  features = ARRAY[
    'Managed router included',
    '24-month contract',
    'Static IP address',
    'Uncapped — no FUP'
  ],
  cost_price_zar = 970.17,
  updated_at = now()
WHERE sku = 'SF-BIZ-100';
