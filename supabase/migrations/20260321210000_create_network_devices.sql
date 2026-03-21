-- Network Devices: Unified inventory for all deployed hardware
-- Covers Tarana FWB routers, Tozed 5G CPEs, Ruijie APs, and SIM cards
-- Seeded with Unjani pilot data from March 2026 deployment

-- =============================================================================
-- Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS network_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  serial_number TEXT NOT NULL UNIQUE,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('tarana_router', 'tozed_cpe', 'ruijie_ap', 'sim_card')),
  model TEXT,

  -- Deployment
  site_name TEXT,
  channel TEXT CHECK (channel IN ('mtn_wholesale', 'arlan', 'dfa', 'internal')),
  province TEXT,
  area TEXT,
  technology TEXT,

  -- Network identifiers
  pppoe_username TEXT,
  sim_number TEXT,
  mtn_reference TEXT,
  ip_address TEXT,
  mac_address TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'deployed' CHECK (status IN ('deployed', 'active', 'offline', 'signal_issues', 'pending', 'reserved', 'decommissioned')),
  signal_notes TEXT,

  -- Linking
  consumer_order_id UUID REFERENCES consumer_orders(id) ON DELETE SET NULL,
  ruijie_device_sn TEXT REFERENCES ruijie_device_cache(sn) ON DELETE SET NULL,
  interstellio_subscriber_id TEXT,

  -- Financial
  monthly_cost NUMERIC(10,2),

  -- Timestamps
  deployed_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_network_devices_type ON network_devices(device_type);
CREATE INDEX idx_network_devices_site ON network_devices(site_name);
CREATE INDEX idx_network_devices_status ON network_devices(status);
CREATE INDEX idx_network_devices_channel ON network_devices(channel);
CREATE INDEX idx_network_devices_order ON network_devices(consumer_order_id) WHERE consumer_order_id IS NOT NULL;
CREATE INDEX idx_network_devices_pppoe ON network_devices(pppoe_username) WHERE pppoe_username IS NOT NULL;

-- =============================================================================
-- Seed: Tarana FWB Routers (MTN Wholesale — Unjani Pilot)
-- =============================================================================

INSERT INTO network_devices (serial_number, device_name, device_type, model, site_name, channel, province, area, technology, pppoe_username, mtn_reference, status, monthly_cost, deployed_at) VALUES
  ('S150F2224001002', 'Unjani Chloorkop – Tarana', 'tarana_router', 'Tarana G1 FWB', 'Unjani Chloorkop', 'mtn_wholesale', 'Gauteng', 'Ekurhuleni', 'Tarana FWB', 'CT-UNJ-006@circletel.co.za', 'E53993', 'active', 499.00, '2026-02-11'),
  ('S150F2224000967', 'Unjani Alexandra – Tarana', 'tarana_router', 'Tarana G1 FWB', 'Unjani Alexandra', 'mtn_wholesale', 'Gauteng', 'Johannesburg', 'Tarana FWB', 'CT-UNJ-002@circletel.co.za', 'E53994', 'active', 499.00, '2026-02-11'),
  ('S150F2224000981', 'Unjani Cosmo City – Tarana', 'tarana_router', 'Tarana G1 FWB', 'Unjani Cosmo City', 'mtn_wholesale', 'Gauteng', 'Johannesburg', 'Tarana FWB', 'CT-UNJ-007@circletel.co.za', 'E53995', 'active', 499.00, '2026-02-12'),
  ('S150F2224000953', 'Unjani Fleurhof – Tarana', 'tarana_router', 'Tarana G1 FWB', 'Unjani Fleurhof', 'mtn_wholesale', 'Gauteng', 'Johannesburg', 'Tarana FWB', 'CT-UNJ-008@circletel.co.za', 'E53997', 'active', 499.00, '2026-02-12'),
  ('S150F2224000963', 'Unjani Sky City – Tarana', 'tarana_router', 'Tarana G1 FWB', 'Unjani Sky City', 'mtn_wholesale', 'Gauteng', 'Klipwater', 'Tarana FWB', 'CT-UNJ-009@circletel.co.za', 'E53996', 'active', 499.00, '2026-02-13'),
  ('S150F2224001003', 'Unjani Heidelberg – Tarana', 'tarana_router', 'Tarana G1 FWB', 'Unjani Heidelberg', 'mtn_wholesale', 'Gauteng', 'Heidelberg', 'Tarana FWB', 'CT-UNJ-012@circletel.co.za', NULL, 'active', 499.00, '2026-02-16'),
  ('S150F2224000983', 'Unjani Tokoza – Tarana', 'tarana_router', 'Tarana G1 FWB', 'Unjani Tokoza', 'mtn_wholesale', 'Gauteng', 'Ekurhuleni', 'Tarana FWB', 'CT-UNJ-010@circletel.co.za', 'E53998', 'active', 499.00, '2026-02-18'),
  ('S150F2224000982', 'Unjani Soshanguve – Tarana', 'tarana_router', 'Tarana G1 FWB', 'Unjani Soshanguve', 'mtn_wholesale', 'Gauteng', 'Pretoria', 'Tarana FWB', 'CT-UNJ-025@circletel.co.za', NULL, 'active', 499.00, '2026-02-25'),
  ('S150F2224000947', 'Unjani Lens ext 10 – Tarana', 'tarana_router', 'Tarana G1 FWB', 'Unjani Lens ext 10', 'mtn_wholesale', 'Gauteng', 'Johannesburg', 'Tarana FWB', 'CT-UNJ-016@circletel.co.za', NULL, 'active', 499.00, '2026-02-26'),
  ('S150F2224000952', 'Unjani Phoenix – Tarana', 'tarana_router', 'Tarana G1 FWB', 'Unjani Phoenix', 'mtn_wholesale', 'KZN', 'Durban', 'Tarana FWB', 'CT-UNJ-021@circletel.co.za', NULL, 'signal_issues', 499.00, '2026-03-03');

-- Update Phoenix signal notes
UPDATE network_devices SET signal_notes = 'PoE/RN under investigation' WHERE serial_number = 'S150F2224000952';

-- =============================================================================
-- Seed: Tozed 5G CPEs (Arlan MTN — Unjani Pilot)
-- =============================================================================

INSERT INTO network_devices (serial_number, device_name, device_type, model, site_name, channel, province, area, technology, pppoe_username, sim_number, mtn_reference, status, signal_notes, monthly_cost, deployed_at) VALUES
  ('X100PRO862378060205728', 'Unjani Sicelo – Tozed 5G', 'tozed_cpe', 'Tozed ZLT X100 PRO', 'Unjani Sicelo', 'arlan', 'Gauteng', 'Meyerton', '5G/LTE/FWA', 'CT-UNJ-011@circletel.co.za', '11360259181', 'SIM 11360259181', 'signal_issues', 'Signal strength – MTN investigating', 503.48, '2026-02-16'),
  ('X100PRO862378061530132', 'Unjani Barcelona – Tozed 5G', 'tozed_cpe', 'Tozed ZLT X100 PRO', 'Unjani Barcelona', 'arlan', 'Gauteng', 'Springs', 'LTE/5G', 'CT-UNJ-013@circletel.co.za', '11360259504', 'SIM 11360259504', 'signal_issues', 'Intermittent drops', 503.48, '2026-02-26'),
  ('X100PRO862378060803159', 'Unjani Oukasie – Tozed 5G', 'tozed_cpe', 'Tozed ZLT X100 PRO', 'Unjani Oukasie', 'arlan', 'North West', 'Brits', '5G/LTE/FWA', 'CT-UNJ-014@circletel.co.za', '11349666019', 'SIM 11349666019', 'signal_issues', 'Signal issues', 503.48, '2026-02-27'),
  ('X100PRO862378060745004', 'Unjani Nokaneng – Tozed 5G', 'tozed_cpe', 'Tozed ZLT X100 PRO', 'Unjani Nokaneng', 'arlan', 'Limpopo', 'Greater Tubatse', 'LTE Uncapped', 'CT-UNJ-017@circletel.co.za', '11349665979', 'SIM 11349665979', 'active', NULL, 503.48, '2026-03-02'),
  ('X100PRO862378061527104', 'Unjani Sweetwaters – Tozed 5G', 'tozed_cpe', 'Tozed ZLT X100 PRO', 'Unjani Sweetwaters', 'arlan', 'KZN', 'Pietermaritzburg', 'LTE/5G', 'CT-UNJ-020@circletel.co.za', '11360258936', 'SIM 11360258936', 'signal_issues', 'Intermittent signal', 503.48, '2026-03-03'),
  ('X100PRO862378061530355', 'Unjani New Hanover – Tozed 5G', 'tozed_cpe', 'Tozed ZLT X100 PRO', 'Unjani New Hanover', 'arlan', 'KZN', 'New Hanover', 'LTE/5G', 'CT-UNJ-023@circletel.co.za', '11349665987', 'SIM 11349665987', 'active', NULL, 503.48, '2026-03-04'),
  ('X100PRO862378060760458', 'Unjani Jabulani – Tozed 5G', 'tozed_cpe', 'Tozed ZLT X100 PRO', 'Unjani Jabulani', 'arlan', 'Gauteng', 'Soweto', '5G/LTE/FWA', 'CT-UNJ-015@circletel.co.za', '11349666027', 'SIM 11349666027', 'active', NULL, 503.48, '2026-03-06'),
  ('X100PRO86237806817050', 'Unjani Zamdela – Tozed 5G', 'tozed_cpe', 'Tozed ZLT X100 PRO', 'Unjani Zamdela', 'arlan', 'Free State', 'Sasolburg', '5G/LTE/FWA', 'CT-UNJ-019@circletel.co.za', '11349666035', 'SIM 11349666035', 'active', NULL, 503.48, '2026-03-09'),
  ('X100PRO862378061405509', 'Unjani Umsinga – Tozed 5G', 'tozed_cpe', 'Tozed ZLT X100 PRO', 'Unjani Umsinga', 'arlan', 'KZN', 'Tugela Ferry', 'LTE/5G', 'CT-UNJ-024@circletel.co.za', '11349666050', 'SIM 11349666050', 'active', NULL, 503.48, '2026-03-11');

-- Kayamandi: deployed but no router SN yet (using SIM as identifier)
INSERT INTO network_devices (serial_number, device_name, device_type, model, site_name, channel, province, area, technology, pppoe_username, sim_number, status, monthly_cost, deployed_at) VALUES
  ('KAYAMANDI-SIM-11360258928', 'Unjani Kayamandi – Tozed 5G', 'tozed_cpe', 'Tozed ZLT X100 PRO', 'Unjani Kayamandi', 'arlan', 'Western Cape', 'Stellenbosch', '5G/LTE', 'CT-UNJ-018@circletel.co.za', '11360258928', 'active', 503.48, '2026-03-13');

-- Durban: pending — awaiting router stock
INSERT INTO network_devices (serial_number, device_name, device_type, model, site_name, channel, province, area, technology, pppoe_username, sim_number, status, signal_notes, monthly_cost) VALUES
  ('DURBAN-SIM-11360258712', 'Unjani Durban – Tozed 5G', 'tozed_cpe', 'Tozed ZLT X100 PRO', 'Unjani Durban', 'arlan', 'KZN', 'Durban', 'LTE', 'CT-UNJ-022@circletel.co.za', '11360258712', 'pending', 'Awaiting router stock from Arlan', 503.48);

-- =============================================================================
-- Seed: Existing customer Tarana devices
-- =============================================================================

-- Shaun Robertson — active Tarana customer (E50932, 100 Mbps, R599)
INSERT INTO network_devices (serial_number, device_name, device_type, model, site_name, channel, province, area, technology, mtn_reference, status, monthly_cost, deployed_at, consumer_order_id) VALUES
  ('SHAUN-E50932', 'Shaun Robertson – Tarana', 'tarana_router', 'Tarana G1 FWB', 'Shaun Robertson Residence', 'mtn_wholesale', 'Gauteng', 'Boksburg', 'Tarana FWB', 'E50932', 'active', 599.00, '2025-11-08',
   (SELECT id FROM consumer_orders WHERE order_number = 'ORD-20251108-9841'));

-- Prins Mhlanga — active customer (Amoeba test site, 200 Mbps, R699)
INSERT INTO network_devices (serial_number, device_name, device_type, model, site_name, channel, province, area, technology, mtn_reference, status, monthly_cost, deployed_at, consumer_order_id) VALUES
  ('PRINS-E50343', 'Prins Mhlanga – Tarana', 'tarana_router', 'Tarana G1 FWB', 'Prins Mhlanga Residence', 'mtn_wholesale', 'Gauteng', 'Vanderbijlpark', 'Tarana FWB', 'E50343', 'active', 699.00, '2025-12-10',
   (SELECT id FROM consumer_orders WHERE order_number = 'ORD-20251210-6408'));

-- =============================================================================
-- Seed: Ruijie APs (link to existing ruijie_device_cache entries)
-- =============================================================================

INSERT INTO network_devices (serial_number, device_name, device_type, model, site_name, channel, technology, ruijie_device_sn, status)
SELECT
  sn,
  device_name,
  'ruijie_ap',
  COALESCE(NULLIF(model, ''), 'Ruijie AP'),
  CASE
    WHEN device_name ILIKE '%chloorkop%' THEN 'Unjani Chloorkop'
    WHEN device_name ILIKE '%barcelona%' THEN 'Unjani Barcelona'
    WHEN device_name ILIKE '%fleurhof%' THEN 'Unjani Fleurhof'
    WHEN device_name ILIKE '%jabulani%' THEN 'Unjani Jabulani'
    WHEN device_name ILIKE '%kayamandi%' THEN 'Unjani Kayamandi'
    WHEN device_name ILIKE '%lenasia%' THEN 'Unjani Lens ext 10'
    WHEN device_name ILIKE '%new%hanover%' THEN 'Unjani New Hanover'
    WHEN device_name ILIKE '%nokaneng%' THEN 'Unjani Nokaneng'
    WHEN device_name ILIKE '%oukasie%' THEN 'Unjani Oukasie'
    WHEN device_name ILIKE '%phoenix%' THEN 'Unjani Phoenix'
    WHEN device_name ILIKE '%sky%city%' THEN 'Unjani Sky City'
    WHEN device_name ILIKE '%soshanguve%' THEN 'Unjani Soshanguve'
    WHEN device_name ILIKE '%sweetwaters%' THEN 'Unjani Sweetwaters'
    WHEN device_name ILIKE '%thokoza%' OR device_name ILIKE '%tokoza%' THEN 'Unjani Tokoza'
    WHEN device_name ILIKE '%umsinga%' THEN 'Unjani Umsinga'
    WHEN device_name ILIKE '%zamdela%' THEN 'Unjani Zamdela'
    WHEN device_name ILIKE '%sicelo%' THEN 'Unjani Sicelo'
    WHEN device_name ILIKE '%cosmo%' THEN 'Unjani Cosmo City'
    WHEN device_name ILIKE '%heidel%' THEN 'Unjani Heidelberg'
    ELSE NULL
  END,
  CASE WHEN device_name ILIKE '%unjani%' THEN 'mtn_wholesale' ELSE 'internal' END,
  'WiFi',
  sn,
  CASE WHEN status = 'online' THEN 'active' ELSE 'offline' END
FROM ruijie_device_cache
ON CONFLICT (serial_number) DO NOTHING;

-- =============================================================================
-- Seed: Reserved SIMs (Rivonia)
-- =============================================================================

INSERT INTO network_devices (serial_number, device_name, device_type, model, site_name, channel, province, technology, sim_number, status) VALUES
  ('RIVONIA-SIM-11360259207', 'Rivonia Reserved 1', 'sim_card', 'MTN Business SIM', 'Rivonia (Reserved)', 'arlan', 'Gauteng', 'LTE/5G', '11360259207', 'reserved'),
  ('RIVONIA-SIM-11360258704', 'Rivonia Reserved 2', 'sim_card', 'MTN Business SIM', 'Rivonia (Reserved)', 'arlan', 'Gauteng', 'LTE/5G', '11360258704', 'reserved');
