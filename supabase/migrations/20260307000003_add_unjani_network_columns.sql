/**
 * Add Network Infrastructure Columns to Corporate Sites
 *
 * Extends corporate_sites with fields for:
 * - Network path type (CircleTel BNG vs MTN Breakout)
 * - Technology type (Tarana FWB, LTE/5G, etc.)
 * - Hardware serial numbers (Tarana RN, Ruijie AP, MTN LTE router)
 * - MTN static IP for LTE/5G sites
 * - Interstellio subscriber link for BNG sites
 *
 * @migration 20260307000003_add_unjani_network_columns
 */

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- Network path type
CREATE TYPE network_path_type AS ENUM (
  'circletel_bng',   -- PPPoE via CircleTel ECHO SP BNG (Interstellio RADIUS)
  'mtn_breakout'     -- Direct MTN LTE/5G internet breakout
);

-- Technology type
CREATE TYPE site_technology_type AS ENUM (
  'tarana_fwb',      -- Tarana Fixed Wireless Broadband
  'lte_5g',          -- MTN LTE/5G
  'ftth',            -- Fiber to the Home
  'fwa'              -- Fixed Wireless Access (generic)
);

-- =============================================================================
-- ADD COLUMNS TO CORPORATE_SITES
-- =============================================================================

ALTER TABLE corporate_sites ADD COLUMN IF NOT EXISTS network_path network_path_type;
ALTER TABLE corporate_sites ADD COLUMN IF NOT EXISTS technology site_technology_type;

-- Hardware serial numbers
ALTER TABLE corporate_sites ADD COLUMN IF NOT EXISTS tarana_rn_serial TEXT;           -- Tarana Remote Node serial
ALTER TABLE corporate_sites ADD COLUMN IF NOT EXISTS ruijie_ap_serial TEXT;           -- Ruijie WiFi AP serial
ALTER TABLE corporate_sites ADD COLUMN IF NOT EXISTS ruijie_ap_model TEXT;            -- e.g., RAP62-OD
ALTER TABLE corporate_sites ADD COLUMN IF NOT EXISTS mikrotik_serial TEXT;            -- MikroTik router serial

-- MTN LTE/5G specific fields
ALTER TABLE corporate_sites ADD COLUMN IF NOT EXISTS mtn_router_imei TEXT;            -- MTN LTE router IMEI
ALTER TABLE corporate_sites ADD COLUMN IF NOT EXISTS mtn_router_mac TEXT;             -- MTN LTE router MAC
ALTER TABLE corporate_sites ADD COLUMN IF NOT EXISTS mtn_static_ip INET;              -- Assigned MTN static IP
ALTER TABLE corporate_sites ADD COLUMN IF NOT EXISTS mtn_sim_number TEXT;             -- SIM card number
ALTER TABLE corporate_sites ADD COLUMN IF NOT EXISTS mtn_msisdn TEXT;                 -- Mobile number

-- Interstellio integration (for CircleTel BNG sites)
ALTER TABLE corporate_sites ADD COLUMN IF NOT EXISTS interstellio_subscriber_id TEXT; -- NebularStack subscriber ID
ALTER TABLE corporate_sites ADD COLUMN IF NOT EXISTS interstellio_status TEXT;        -- active, inactive, never_seen

-- Ruijie Cloud integration
ALTER TABLE corporate_sites ADD COLUMN IF NOT EXISTS ruijie_device_sn TEXT;           -- Ruijie Cloud device SN
ALTER TABLE corporate_sites ADD COLUMN IF NOT EXISTS ruijie_egress_ip INET;           -- Ruijie device egress IP

-- Installation job reference
ALTER TABLE corporate_sites ADD COLUMN IF NOT EXISTS job_card_number TEXT;            -- e.g., JOB000168

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_corporate_sites_network_path ON corporate_sites(network_path);
CREATE INDEX IF NOT EXISTS idx_corporate_sites_technology ON corporate_sites(technology);
CREATE INDEX IF NOT EXISTS idx_corporate_sites_mtn_static_ip ON corporate_sites(mtn_static_ip) WHERE mtn_static_ip IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_corporate_sites_interstellio_id ON corporate_sites(interstellio_subscriber_id) WHERE interstellio_subscriber_id IS NOT NULL;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN corporate_sites.network_path IS 'Network path: circletel_bng (PPPoE/Interstellio) or mtn_breakout (direct MTN)';
COMMENT ON COLUMN corporate_sites.technology IS 'Connection technology: tarana_fwb, lte_5g, ftth, fwa';
COMMENT ON COLUMN corporate_sites.tarana_rn_serial IS 'Tarana Remote Node serial number (e.g., S150F2224001002)';
COMMENT ON COLUMN corporate_sites.ruijie_ap_serial IS 'Ruijie WiFi Access Point serial number';
COMMENT ON COLUMN corporate_sites.mtn_static_ip IS 'MTN-assigned static IP for remote router management';
COMMENT ON COLUMN corporate_sites.interstellio_subscriber_id IS 'NebularStack/Interstellio subscriber UUID for PPPoE sites';

-- =============================================================================
-- SEED UNJANI SITES DATA
-- =============================================================================

-- First, ensure Unjani corporate account exists
INSERT INTO corporate_accounts (
  corporate_code,
  company_name,
  trading_name,
  primary_contact_name,
  primary_contact_email,
  account_status,
  industry,
  expected_sites,
  notes
)
VALUES (
  'UNJ',
  'Unjani Clinics NPC',
  'Unjani Clinics',
  'Unjani Operations',
  'operations@unjaniclinics.co.za',
  'active',
  'Healthcare',
  25,
  'Unjani Clinic network - 25 primary healthcare facilities across South Africa'
)
ON CONFLICT (corporate_code) DO UPDATE SET
  expected_sites = 25,
  updated_at = NOW();

-- Get the Unjani corporate ID for site inserts
DO $$
DECLARE
  unjani_corp_id UUID;
BEGIN
  SELECT id INTO unjani_corp_id FROM corporate_accounts WHERE corporate_code = 'UNJ';

  -- Insert/update Unjani sites with network data
  -- Site 1: Chloorkop (CT-UNJ-006)
  INSERT INTO corporate_sites (corporate_id, site_name, province, status, network_path, technology, tarana_rn_serial, mikrotik_serial, ruijie_ap_serial, job_card_number)
  VALUES (unjani_corp_id, 'Unjani Clinic - Chloorkop', 'Gauteng', 'active', 'circletel_bng', 'tarana_fwb', 'S150F2224001002', 'HHEOAENHM6W', 'G1U52HL002532', 'JOB000168')
  ON CONFLICT (corporate_id, site_number) DO UPDATE SET
    network_path = EXCLUDED.network_path,
    technology = EXCLUDED.technology,
    tarana_rn_serial = EXCLUDED.tarana_rn_serial,
    mikrotik_serial = EXCLUDED.mikrotik_serial,
    ruijie_ap_serial = EXCLUDED.ruijie_ap_serial,
    job_card_number = EXCLUDED.job_card_number,
    updated_at = NOW();

  -- Site 2: Alexandra (CT-UNJ-002)
  INSERT INTO corporate_sites (corporate_id, site_name, province, status, network_path, technology, tarana_rn_serial, mikrotik_serial, job_card_number)
  VALUES (unjani_corp_id, 'Unjani Clinic - Alexandra', 'Gauteng', 'active', 'circletel_bng', 'tarana_fwb', 'S150F2224000967', 'CB540B25C112/951', 'JOB000169')
  ON CONFLICT (corporate_id, site_number) DO UPDATE SET
    network_path = EXCLUDED.network_path,
    technology = EXCLUDED.technology,
    tarana_rn_serial = EXCLUDED.tarana_rn_serial,
    mikrotik_serial = EXCLUDED.mikrotik_serial,
    job_card_number = EXCLUDED.job_card_number,
    updated_at = NOW();

  -- Site 3: Cosmo City (CT-UNJ-007)
  INSERT INTO corporate_sites (corporate_id, site_name, province, status, network_path, technology, tarana_rn_serial, mikrotik_serial, job_card_number)
  VALUES (unjani_corp_id, 'Unjani Clinic - Cosmo City', 'Gauteng', 'active', 'circletel_bng', 'tarana_fwb', 'S150F2224000981', 'HJX0AHJVY9V', 'JOB000179')
  ON CONFLICT (corporate_id, site_number) DO UPDATE SET
    network_path = EXCLUDED.network_path,
    technology = EXCLUDED.technology,
    tarana_rn_serial = EXCLUDED.tarana_rn_serial,
    mikrotik_serial = EXCLUDED.mikrotik_serial,
    job_card_number = EXCLUDED.job_card_number,
    updated_at = NOW();

  -- Site 4: Fleurhof (CT-UNJ-008)
  INSERT INTO corporate_sites (corporate_id, site_name, province, status, network_path, technology, tarana_rn_serial, ruijie_ap_serial, job_card_number)
  VALUES (unjani_corp_id, 'Unjani Clinic - Fleurhof', 'Gauteng', 'active', 'circletel_bng', 'tarana_fwb', 'S150F2224000953', 'G1U20W5024986', 'JOB000181')
  ON CONFLICT (corporate_id, site_number) DO UPDATE SET
    network_path = EXCLUDED.network_path,
    technology = EXCLUDED.technology,
    tarana_rn_serial = EXCLUDED.tarana_rn_serial,
    ruijie_ap_serial = EXCLUDED.ruijie_ap_serial,
    job_card_number = EXCLUDED.job_card_number,
    updated_at = NOW();

  -- Site 5: Sky City (CT-UNJ-009)
  INSERT INTO corporate_sites (corporate_id, site_name, province, status, network_path, technology, tarana_rn_serial)
  VALUES (unjani_corp_id, 'Unjani Clinic - Sky City', 'Gauteng', 'active', 'circletel_bng', 'tarana_fwb', 'S150F2224000963')
  ON CONFLICT (corporate_id, site_number) DO UPDATE SET
    network_path = EXCLUDED.network_path,
    technology = EXCLUDED.technology,
    tarana_rn_serial = EXCLUDED.tarana_rn_serial,
    updated_at = NOW();

  -- Site 6: Sicelo (CT-UNJ-011) - MTN LTE
  INSERT INTO corporate_sites (corporate_id, site_name, province, status, network_path, technology, mtn_router_imei, mtn_router_mac, mtn_static_ip, job_card_number)
  VALUES (unjani_corp_id, 'Unjani Clinic - Sicelo', 'Gauteng', 'active', 'mtn_breakout', 'lte_5g', '862378060205728', '98A942D75353', '41.119.3.102', 'JOB000212')
  ON CONFLICT (corporate_id, site_number) DO UPDATE SET
    network_path = EXCLUDED.network_path,
    technology = EXCLUDED.technology,
    mtn_router_imei = EXCLUDED.mtn_router_imei,
    mtn_router_mac = EXCLUDED.mtn_router_mac,
    mtn_static_ip = EXCLUDED.mtn_static_ip,
    job_card_number = EXCLUDED.job_card_number,
    updated_at = NOW();

  -- Site 7: Heidelberg (CT-UNJ-012)
  INSERT INTO corporate_sites (corporate_id, site_name, province, status, network_path, technology, tarana_rn_serial, mikrotik_serial, job_card_number)
  VALUES (unjani_corp_id, 'Unjani Clinic - Heidelberg', 'Gauteng', 'active', 'circletel_bng', 'tarana_fwb', 'S150F2224001003', 'HJX0AYM90ES', 'JOB000213')
  ON CONFLICT (corporate_id, site_number) DO UPDATE SET
    network_path = EXCLUDED.network_path,
    technology = EXCLUDED.technology,
    tarana_rn_serial = EXCLUDED.tarana_rn_serial,
    mikrotik_serial = EXCLUDED.mikrotik_serial,
    job_card_number = EXCLUDED.job_card_number,
    updated_at = NOW();

  -- Site 8: Tokoza (CT-UNJ-010)
  INSERT INTO corporate_sites (corporate_id, site_name, province, status, network_path, technology, tarana_rn_serial, mikrotik_serial, ruijie_ap_serial, job_card_number)
  VALUES (unjani_corp_id, 'Unjani Clinic - Tokoza', 'Gauteng', 'active', 'circletel_bng', 'tarana_fwb', 'S150F2224000983', 'HJX0AV8GD3S', 'G1U52HL044467', 'JOB000196')
  ON CONFLICT (corporate_id, site_number) DO UPDATE SET
    network_path = EXCLUDED.network_path,
    technology = EXCLUDED.technology,
    tarana_rn_serial = EXCLUDED.tarana_rn_serial,
    mikrotik_serial = EXCLUDED.mikrotik_serial,
    ruijie_ap_serial = EXCLUDED.ruijie_ap_serial,
    job_card_number = EXCLUDED.job_card_number,
    updated_at = NOW();

  -- Site 9: Soshanguve (CT-UNJ-025)
  INSERT INTO corporate_sites (corporate_id, site_name, province, status, network_path, technology, tarana_rn_serial)
  VALUES (unjani_corp_id, 'Unjani Clinic - Soshanguve (Block P)', 'Gauteng', 'active', 'circletel_bng', 'tarana_fwb', 'S150F2224000982')
  ON CONFLICT (corporate_id, site_number) DO UPDATE SET
    network_path = EXCLUDED.network_path,
    technology = EXCLUDED.technology,
    tarana_rn_serial = EXCLUDED.tarana_rn_serial,
    updated_at = NOW();

  -- Site 10: Barcelona (CT-UNJ-013) - LTE
  INSERT INTO corporate_sites (corporate_id, site_name, province, status, network_path, technology)
  VALUES (unjani_corp_id, 'Unjani Clinic - Barcelona', 'Gauteng', 'active', 'mtn_breakout', 'lte_5g')
  ON CONFLICT (corporate_id, site_number) DO UPDATE SET
    network_path = EXCLUDED.network_path,
    technology = EXCLUDED.technology,
    updated_at = NOW();

  -- Site 11: Lens ext 10 (CT-UNJ-016)
  INSERT INTO corporate_sites (corporate_id, site_name, province, status, network_path, technology, tarana_rn_serial)
  VALUES (unjani_corp_id, 'Unjani Clinic - Lens ext 10', 'Gauteng', 'active', 'circletel_bng', 'tarana_fwb', 'S150F2224000947')
  ON CONFLICT (corporate_id, site_number) DO UPDATE SET
    network_path = EXCLUDED.network_path,
    technology = EXCLUDED.technology,
    tarana_rn_serial = EXCLUDED.tarana_rn_serial,
    updated_at = NOW();

  -- Site 12: Oukasie (CT-UNJ-014)
  INSERT INTO corporate_sites (corporate_id, site_name, province, status, network_path, technology)
  VALUES (unjani_corp_id, 'Unjani Clinic - Oukasie', 'North West', 'provisioned', 'circletel_bng', 'tarana_fwb')
  ON CONFLICT (corporate_id, site_number) DO UPDATE SET
    network_path = EXCLUDED.network_path,
    technology = EXCLUDED.technology,
    status = 'provisioned',
    updated_at = NOW();

  -- Site 13: Nokaneng (CT-UNJ-017) - LTE
  INSERT INTO corporate_sites (corporate_id, site_name, province, status, network_path, technology)
  VALUES (unjani_corp_id, 'Unjani Clinic - Nokaneng', 'Limpopo', 'active', 'mtn_breakout', 'lte_5g')
  ON CONFLICT (corporate_id, site_number) DO UPDATE SET
    network_path = EXCLUDED.network_path,
    technology = EXCLUDED.technology,
    updated_at = NOW();

  -- Site 14: Phoenix (CT-UNJ-021)
  INSERT INTO corporate_sites (corporate_id, site_name, province, status, network_path, technology)
  VALUES (unjani_corp_id, 'Unjani Clinic - Phoenix', 'KwaZulu-Natal', 'provisioned', 'circletel_bng', 'tarana_fwb')
  ON CONFLICT (corporate_id, site_number) DO UPDATE SET
    network_path = EXCLUDED.network_path,
    technology = EXCLUDED.technology,
    status = 'provisioned',
    updated_at = NOW();

  -- Site 15: Sweetwaters (CT-UNJ-020) - LTE
  INSERT INTO corporate_sites (corporate_id, site_name, province, status, network_path, technology)
  VALUES (unjani_corp_id, 'Unjani Clinic - Sweetwaters', 'KwaZulu-Natal', 'active', 'mtn_breakout', 'lte_5g')
  ON CONFLICT (corporate_id, site_number) DO UPDATE SET
    network_path = EXCLUDED.network_path,
    technology = EXCLUDED.technology,
    updated_at = NOW();

  -- Site 16: New Hanover (CT-UNJ-023) - LTE
  INSERT INTO corporate_sites (corporate_id, site_name, province, status, network_path, technology)
  VALUES (unjani_corp_id, 'Unjani Clinic - New Hanover', 'KwaZulu-Natal', 'active', 'mtn_breakout', 'lte_5g')
  ON CONFLICT (corporate_id, site_number) DO UPDATE SET
    network_path = EXCLUDED.network_path,
    technology = EXCLUDED.technology,
    updated_at = NOW();

  -- Site 17: Jabulani (CT-UNJ-015) - LTE
  INSERT INTO corporate_sites (corporate_id, site_name, province, status, network_path, technology, ruijie_ap_serial, ruijie_ap_model, ruijie_device_sn)
  VALUES (unjani_corp_id, 'Unjani Clinic - Jabulani', 'Gauteng', 'pending', 'mtn_breakout', 'lte_5g', 'G1UQ9C8000921', 'RAP62-OD', 'G1UQ9C8000921')
  ON CONFLICT (corporate_id, site_number) DO UPDATE SET
    network_path = EXCLUDED.network_path,
    technology = EXCLUDED.technology,
    ruijie_ap_serial = EXCLUDED.ruijie_ap_serial,
    ruijie_ap_model = EXCLUDED.ruijie_ap_model,
    ruijie_device_sn = EXCLUDED.ruijie_device_sn,
    updated_at = NOW();

  -- Site 18: Durban (CT-UNJ-022) - LTE
  INSERT INTO corporate_sites (corporate_id, site_name, province, status, network_path, technology)
  VALUES (unjani_corp_id, 'Unjani Clinic - Durban', 'KwaZulu-Natal', 'pending', 'mtn_breakout', 'lte_5g')
  ON CONFLICT (corporate_id, site_number) DO UPDATE SET
    network_path = EXCLUDED.network_path,
    technology = EXCLUDED.technology,
    updated_at = NOW();

  -- Site 19: Zamdela (CT-UNJ-019) - LTE
  INSERT INTO corporate_sites (corporate_id, site_name, province, status, network_path, technology)
  VALUES (unjani_corp_id, 'Unjani Clinic - Zamdela', 'Free State', 'pending', 'mtn_breakout', 'lte_5g')
  ON CONFLICT (corporate_id, site_number) DO UPDATE SET
    network_path = EXCLUDED.network_path,
    technology = EXCLUDED.technology,
    updated_at = NOW();

  -- Site 20: Kayamandi (CT-UNJ-018) - LTE
  INSERT INTO corporate_sites (corporate_id, site_name, province, status, network_path, technology)
  VALUES (unjani_corp_id, 'Unjani Clinic - Kayamandi', 'Western Cape', 'pending', 'mtn_breakout', 'lte_5g')
  ON CONFLICT (corporate_id, site_number) DO UPDATE SET
    network_path = EXCLUDED.network_path,
    technology = EXCLUDED.technology,
    updated_at = NOW();

  -- Site 21: Umsinga (CT-UNJ-024) - LTE
  INSERT INTO corporate_sites (corporate_id, site_name, province, status, network_path, technology)
  VALUES (unjani_corp_id, 'Unjani Clinic - Umsinga', 'KwaZulu-Natal', 'pending', 'mtn_breakout', 'lte_5g')
  ON CONFLICT (corporate_id, site_number) DO UPDATE SET
    network_path = EXCLUDED.network_path,
    technology = EXCLUDED.technology,
    updated_at = NOW();

  RAISE NOTICE 'Unjani sites seeded successfully';
END $$;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

DO $$
BEGIN
  -- Check columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'corporate_sites' AND column_name = 'network_path'
  ) THEN
    RAISE EXCEPTION 'Migration failed: network_path column not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'corporate_sites' AND column_name = 'mtn_static_ip'
  ) THEN
    RAISE EXCEPTION 'Migration failed: mtn_static_ip column not created';
  END IF;

  RAISE NOTICE 'Migration 20260307000003_add_unjani_network_columns completed successfully';
END $$;
