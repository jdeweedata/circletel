-- Product-line governance + quote hygiene (16 Aug 2026)
-- product_lines is the exec/sales/finance system of record.
-- CPS/BRD/FSD remain git artifacts attached by path.

-- ---------------------------------------------------------------------------
-- 1. Expire stale / test quotes (keep history)
-- ---------------------------------------------------------------------------
UPDATE public.business_quotes
SET
  status = 'expired',
  expired_at = COALESCE(expired_at, now()),
  updated_at = now()
WHERE status IS DISTINCT FROM 'rejected'
  AND status IS DISTINCT FROM 'expired'
  AND (
    company_name ILIKE '%Automated Test%'
    OR contact_email ILIKE '%testcompany.co.za%'
    OR (valid_until IS NOT NULL AND valid_until < CURRENT_DATE)
  );

UPDATE public.cpq_sessions
SET status = 'expired'
WHERE status = 'draft'
  AND created_at < now() - interval '30 days';

-- ---------------------------------------------------------------------------
-- 2. product_lines
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  lifecycle_stage text NOT NULL DEFAULT 'draft'
    CHECK (lifecycle_stage = ANY (ARRAY['idea','draft','active','inactive','archived'])),
  sellability text NOT NULL DEFAULT 'not_gate_1'
    CHECK (sellability = ANY (ARRAY[
      'sell_now','selective','attach_only','collect_dont_scale','not_gate_1','sunset'
    ])),
  revenue_model text NOT NULL DEFAULT 'circletel_mrr'
    CHECK (revenue_model = ANY (ARRAY['circletel_mrr','dealer_commission','hybrid'])),
  channel text NOT NULL DEFAULT 'own_platform'
    CHECK (channel = ANY (ARRAY['mtn_wholesale','dfa','skytel_dealer','own_platform'])),
  gate1_eligible boolean NOT NULL DEFAULT false,
  msc_flag boolean NOT NULL DEFAULT false,
  target_market text,
  list_arpu_zar numeric(12,2),
  list_arpu_incl_vat_zar numeric(12,2),
  min_margin_pct numeric(5,2) NOT NULL DEFAULT 25,
  cps_path text,
  brd_path text,
  fsd_path text,
  cps_status text NOT NULL DEFAULT 'missing'
    CHECK (cps_status = ANY (ARRAY['missing','draft','current','stale'])),
  brd_status text NOT NULL DEFAULT 'missing'
    CHECK (brd_status = ANY (ARRAY['missing','draft','current','stale'])),
  fsd_status text NOT NULL DEFAULT 'missing'
    CHECK (fsd_status = ANY (ARRAY['missing','draft','current','stale'])),
  cps_version text,
  brd_version text,
  fsd_version text,
  brd_required boolean NOT NULL DEFAULT false,
  fsd_required boolean NOT NULL DEFAULT false,
  finance_approved_at timestamptz,
  finance_approved_by uuid,
  finance_approval_notes text,
  live_mrr_match text,
  price_drift_notes text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.product_line_skus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_line_id uuid NOT NULL REFERENCES public.product_lines(id) ON DELETE CASCADE,
  source_table text NOT NULL,
  source_id text NOT NULL,
  sku text,
  UNIQUE (source_table, source_id)
);

CREATE TABLE IF NOT EXISTS public.product_bundle_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_line_id uuid NOT NULL REFERENCES public.product_lines(id) ON DELETE CASCADE,
  component_role text NOT NULL
    CHECK (component_role = ANY (ARRAY['connectivity','cpe','licence'])),
  name text NOT NULL,
  source text NOT NULL
    CHECK (source = ANY (ARRAY['skytel_helios','rectron','m365_csp','service_package'])),
  helios_includes_cpe boolean NOT NULL DEFAULT false,
  default_monthly_excl numeric(12,2),
  default_cost_excl numeric(12,2),
  amortise_months integer,
  package_sku text,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS product_lines_sellability_idx ON public.product_lines (sellability);
CREATE INDEX IF NOT EXISTS product_line_skus_line_idx ON public.product_line_skus (product_line_id);
CREATE INDEX IF NOT EXISTS product_bundle_components_line_idx ON public.product_bundle_components (product_line_id);

COMMENT ON TABLE public.product_lines IS
  'Governance layer for CircleTel sellable lines. SKUs stay in existing catalogue tables.';
COMMENT ON TABLE public.product_bundle_components IS
  'BOM for CircleConnect/OTG-style bundles: SkyTel SIM + Rectron CPE + M365 CSP.';

ALTER TABLE public.product_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_line_skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_bundle_components ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_lines TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_line_skus TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_bundle_components TO service_role;
GRANT SELECT ON public.product_lines TO authenticated;
GRANT SELECT ON public.product_line_skus TO authenticated;
GRANT SELECT ON public.product_bundle_components TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Seed roadmap + flyer bundles
-- ---------------------------------------------------------------------------
INSERT INTO public.product_lines (
  code, name, lifecycle_stage, sellability, revenue_model, channel,
  gate1_eligible, msc_flag, target_market,
  list_arpu_zar, list_arpu_incl_vat_zar, min_margin_pct,
  cps_path, brd_path, fsd_path,
  cps_status, brd_status, fsd_status, cps_version, brd_version, fsd_version,
  brd_required, fsd_required, live_mrr_match, price_drift_notes, notes
) VALUES
(
  'skyfibre-smb', 'SkyFibre SMB', 'active', 'selective', 'circletel_mrr', 'mtn_wholesale',
  true, true, 'smb',
  1899, 2183.85, 25,
  'products/connectivity/fixed-wireless/SkyFibre_SMB_Commercial_Product_Spec_v2_0.md',
  'products/connectivity/fixed-wireless/SkyFibre_SMB_Business_Rules_Document_v1_0.md',
  'products/connectivity/fixed-wireless/SkyFibre_SMB_Functional_Specification_v1_0.md',
  'current', 'current', 'current', '2.0', '1.0', '1.0',
  true, false, 'SkyFibre', NULL,
  'Sell only where Tarana + CSP is orderable.'
),
(
  'clinicconnect', 'ClinicConnect', 'active', 'collect_dont_scale', 'circletel_mrr', 'own_platform',
  true, false, 'clinic',
  450, 517.50, 25,
  NULL, NULL, NULL,
  'missing', 'missing', 'missing', NULL, NULL, NULL,
  true, false, 'Unjani', NULL,
  'Collect AR. Do not scale to 75 sites. Docs missing.'
),
(
  'bizfibreconnect', 'BizFibreConnect', 'active', 'selective', 'circletel_mrr', 'dfa',
  true, true, 'smb',
  2999, 3448.85, 25,
  'products/connectivity/fibre/BizFibreConnect_DFA_Product_Overview_v2_0.md',
  NULL, NULL,
  'draft', 'missing', 'missing', '2.0', NULL, NULL,
  true, false, 'BizFibre', NULL,
  'DFA on-net only.'
),
(
  'skytel-dealer', 'SkyTel dealer (Helios standalone)', 'active', 'sell_now', 'dealer_commission', 'skytel_dealer',
  true, false, 'smb',
  NULL, NULL, 25,
  'products/wholesale/arlan/Arlan_Data_Connectivity_CPS_v1_0.md',
  'products/wholesale/arlan/Arlan_Data_Connectivity_BRD_v1_0.md',
  NULL,
  'stale', 'stale', 'missing', '1.0', '1.0', NULL,
  true, false, NULL,
  'CPS still names Arlan. Live dealer is SkyTel Mobile.',
  'Commission cash on MTN invoice. Not CircleTel MRR until on-biller.'
),
(
  'circleconnect-5g-essential', 'CircleConnect 5G Essential', 'active', 'sell_now', 'hybrid', 'skytel_dealer',
  true, false, 'smb',
  425.22, 489, 25,
  'products/wholesale/arlan/Arlan_Data_Connectivity_CPS_v1_0.md',
  NULL, NULL,
  'stale', 'missing', 'missing', '1.0', NULL, NULL,
  false, false, 'CircleConnect 5G',
  'Catalogue CC-5G-CON-035 list R449 excl vs flyer R489 incl (R425.22 excl).',
  'Flyer: 35 Mbps uncapped, 500GB FUP, free router, 24 months. Helios deal often includes CPE — do not double-count Rectron.'
),
(
  'otg', 'OTG — On the Go', 'draft', 'sell_now', 'hybrid', 'skytel_dealer',
  true, false, 'soho',
  346.96, 399, 25,
  NULL, NULL, NULL,
  'missing', 'missing', 'missing', NULL, NULL, NULL,
  true, false, NULL,
  NULL,
  'Flyer: MiFi + 20GB SIM + Microsoft 365 Business Standard, R399 pm / 12 months incl VAT. No CPS yet — finance must sign the BOM.'
),
(
  'managed-it', 'Managed IT', 'draft', 'attach_only', 'circletel_mrr', 'own_platform',
  false, false, 'smb',
  2999, 3448.85, 25,
  'products/managed-it/CircleTel_Managed_IT_Services_Commercial_Product_Spec_v2_0.md',
  'products/managed-it/CircleTel_Managed_IT_Services_Business_Rules_Document_v1_0.md',
  'products/managed-it/CircleTel_Managed_IT_Services_Functional_Specification_v1_0.md',
  'current', 'current', 'current', '2.0', '1.0', '1.0',
  true, true, NULL, NULL,
  'Attach on SkyFibre. Use /admin/mits-cpq.'
),
(
  'business-complete', 'Business Complete', 'draft', 'attach_only', 'hybrid', 'skytel_dealer',
  false, false, 'smb',
  NULL, NULL, 25,
  'products/bundles/BusinessComplete_Commercial_Product_Spec_v1_0.md',
  NULL, NULL,
  'current', 'missing', 'missing', '1.0', NULL, NULL,
  true, false, NULL, NULL,
  'Attach on SkyFibre quotes. Channel stamp still says Arlan.'
),
(
  'on-biller', 'On-biller SIMs', 'idea', 'not_gate_1', 'circletel_mrr', 'skytel_dealer',
  false, false, 'smb',
  NULL, NULL, 25,
  NULL, NULL, NULL,
  'missing', 'missing', 'missing', NULL, NULL, NULL,
  true, true, NULL, NULL,
  'Required before SkyTel SIMs bill as CircleTel MRR.'
),
(
  'parkconnect', 'ParkConnect (DUNE)', 'draft', 'not_gate_1', 'circletel_mrr', 'mtn_wholesale',
  false, false, 'venue',
  NULL, NULL, 25,
  'products/connectivity/fixed-wireless/DUNE_60GHz_Product_Portfolio_CircleTel_v1_1.md',
  NULL, NULL,
  'draft', 'missing', 'missing', '1.1', NULL, NULL,
  true, true, NULL, NULL, NULL
),
(
  'cloudwifi', 'CloudWiFi WaaS', 'draft', 'not_gate_1', 'circletel_mrr', 'own_platform',
  false, false, 'venue',
  NULL, NULL, 25,
  'products/connectivity/wifi-as-a-service/CircleTel_CloudWiFi_WaaS_Commercial_Product_Spec_v1_0.md',
  'products/connectivity/wifi-as-a-service/CloudWiFi_WaaS_Business_Rules_Document_v1_0.md',
  NULL,
  'current', 'current', 'missing', '1.0', '1.0', NULL,
  true, true, NULL, NULL, NULL
),
(
  'workconnect', 'WorkConnect SOHO', 'draft', 'not_gate_1', 'circletel_mrr', 'own_platform',
  false, false, 'soho',
  NULL, NULL, 25,
  'products/connectivity/soho/CircleTel_WorkConnect_SOHO_Product_Portfolio_v1_1.md',
  'products/connectivity/soho/WorkConnect_SOHO_Business_Rules_Document_v1_0.md',
  'products/connectivity/soho/WorkConnect_SOHO_Functional_Specification_v1_0.md',
  'draft', 'draft', 'stale', '1.1', '1.0', '1.0',
  true, true, NULL, NULL,
  'FSD gaps. Do not activate until system behaviour is complete.'
)
ON CONFLICT (code) DO NOTHING;

-- Link CircleConnect 5G 35 Mbps contract SKU when present
INSERT INTO public.product_line_skus (product_line_id, source_table, source_id, sku)
SELECT pl.id, 'service_packages', sp.id::text, sp.sku
FROM public.product_lines pl
JOIN public.service_packages sp ON sp.sku = 'CC-5G-CON-035'
WHERE pl.code = 'circleconnect-5g-essential'
ON CONFLICT (source_table, source_id) DO NOTHING;

INSERT INTO public.product_bundle_components (
  product_line_id, component_role, name, source, helios_includes_cpe,
  default_monthly_excl, default_cost_excl, amortise_months, package_sku, sort_order
)
SELECT pl.id, 'connectivity', 'MTN Uncapped 5G 35 Mbps', 'skytel_helios', true,
  425.22, 390.43, NULL, 'CC-5G-CON-035', 1
FROM public.product_lines pl WHERE pl.code = 'circleconnect-5g-essential';

INSERT INTO public.product_bundle_components (
  product_line_id, component_role, name, source, helios_includes_cpe,
  default_monthly_excl, default_cost_excl, amortise_months, package_sku, sort_order
)
SELECT pl.id, 'cpe', '5G CPE (Helios included unless upgraded)', 'rectron', true,
  0, 0, 24, NULL, 2
FROM public.product_lines pl WHERE pl.code = 'circleconnect-5g-essential';

INSERT INTO public.product_bundle_components (
  product_line_id, component_role, name, source, helios_includes_cpe,
  default_monthly_excl, default_cost_excl, amortise_months, package_sku, sort_order
)
SELECT pl.id, 'connectivity', '20GB mobile data SIM', 'skytel_helios', false,
  174, 174, NULL, NULL, 1
FROM public.product_lines pl WHERE pl.code = 'otg';

INSERT INTO public.product_bundle_components (
  product_line_id, component_role, name, source, helios_includes_cpe,
  default_monthly_excl, default_cost_excl, amortise_months, package_sku, sort_order
)
SELECT pl.id, 'cpe', 'MiFi router (Huawei E5576 / Vida M2)', 'rectron', false,
  30, 360, 12, NULL, 2
FROM public.product_lines pl WHERE pl.code = 'otg';

INSERT INTO public.product_bundle_components (
  product_line_id, component_role, name, source, helios_includes_cpe,
  default_monthly_excl, default_cost_excl, amortise_months, package_sku, sort_order
)
SELECT pl.id, 'licence', 'Microsoft 365 Business Standard', 'm365_csp', false,
  329, 270, NULL, NULL, 3
FROM public.product_lines pl WHERE pl.code = 'otg';
