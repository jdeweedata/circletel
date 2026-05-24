-- Add 'managed' to allowed service_type values
ALTER TABLE service_packages DROP CONSTRAINT service_packages_service_type_check;

ALTER TABLE service_packages ADD CONSTRAINT service_packages_service_type_check
  CHECK (service_type::text = ANY (ARRAY[
    'SkyFibre','HomeFibreConnect','BizFibreConnect','WorkConnect','All',
    '5g','lte','fixed_lte','fibre','uncapped_wireless','5G','LTE',
    'VoIP','voip','Hosting','hosting','Cloud_Services','cloud_services','cloud',
    'IT_Support','it_support','managed_it','Managed_IT',
    'Security','security','cybersecurity','cpe','hardware','other',
    'managed'
  ]::text[]));

-- Insert Unjani Managed Connectivity product (SKU: UNJ-MC-001)
INSERT INTO service_packages (
  name, slug, sku, service_type, product_category, customer_type, market_segment,
  price, base_price_zar, cost_price_zar, speed_down, speed_up,
  description, features, pricing, metadata,
  active, status, is_featured, is_popular,
  compatible_providers, valid_from, valid_to, sort_order
) VALUES (
  'Unjani Managed Connectivity',
  'unjani-managed-connectivity',
  'UNJ-MC-001',
  'managed',
  'managed-connectivity',
  'business',
  'b2b-managed',
  450.00,
  450.00,
  450.00,
  10,
  10,
  'Managed connectivity for Unjani Clinics NPC — R450 excl. VAT/month per site. Technology-agnostic: Tarana FWB, MTN LTE 20Mbps, or MTN 5G 60Mbps based on site coverage. 24-month contract aligned with Unjani MSA.',
  ARRAY[
    'Managed connectivity — Tarana FWB, LTE, or 5G',
    'R450/month excl. VAT per site',
    '10–60 Mbps depending on technology',
    '95–99% uptime SLA',
    'Static IP included',
    '8x5 remote management',
    '24-month contract term'
  ],
  '{"setup": 0, "monthly": 450, "upload_speed": 10, "download_speed": 10}'::jsonb,
  '{
    "client": "Unjani Clinics NPC",
    "client_reg": "2014/089277/08",
    "contract_term_months": 24,
    "total_sites": 50,
    "active_sites": 22,
    "phase2_sites": 28,
    "escalation": {
      "year_1": "locked",
      "year_2": "CPI capped at 6%",
      "year_3_plus": "annual review based on actual costs"
    },
    "cost_breakdown": {
      "tarana_fwb_excl": 0,
      "mtn_lte_excl": 434,
      "mtn_5g_excl": 503
    },
    "msa_reference": "Circle Tel Agreement - Unjani - Execution version.pdf",
    "tdx_partnership": "TDX_Circle_Tel_MSA_Final.pdf",
    "arlan_deal": "OP19627",
    "billing_start": "2026-05-15",
    "sla": {
      "fibre_fwa_min_mbps": 25,
      "fibre_fwa_uptime": "99%",
      "lte_5g_min_mbps": 10,
      "lte_5g_target_mbps": 20,
      "lte_5g_uptime": "95%"
    }
  }'::jsonb,
  true,
  'active',
  false,
  false,
  ARRAY['tarana-fwb', 'mtn-lte', 'mtn-5g'],
  '2026-05-15T00:00:00Z'::timestamptz,
  NULL,
  100
);
