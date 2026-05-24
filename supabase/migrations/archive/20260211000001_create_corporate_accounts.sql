/**
 * Migration: Create Corporate Accounts System
 *
 * Purpose: Enable enterprise/corporate client management with parent-child
 * account structure for organizations like Unjani Clinics (252+ sites).
 *
 * Features:
 * - Parent corporate accounts with multi-contact support
 * - Child site accounts with auto-generated account numbers (CT-{CODE}-{NNN})
 * - Integration with PPPoE credential system
 * - Site status tracking for provisioning workflow
 *
 * Related: Corporate Client Management System
 * Author: Claude Code
 * Date: 2026-02-11
 */

-- ============================================================================
-- PHASE 1: Enum Types
-- ============================================================================

-- Corporate account status
CREATE TYPE corporate_account_status AS ENUM (
  'active',
  'suspended',
  'pending',
  'archived'
);

-- Corporate site status
CREATE TYPE corporate_site_status AS ENUM (
  'pending',        -- Awaiting setup
  'ready',          -- Ready for installation
  'provisioned',    -- PPPoE credentials created
  'active',         -- Service active
  'suspended',      -- Service suspended
  'decommissioned'  -- Site removed
);

-- ============================================================================
-- PHASE 2: Corporate Accounts Table (Parent Entity)
-- ============================================================================

CREATE TABLE corporate_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Corporate Identity
  corporate_code VARCHAR(10) UNIQUE NOT NULL,           -- 'UNJ', 'ABC', etc.
  company_name VARCHAR(255) NOT NULL,
  trading_name VARCHAR(255),
  registration_number VARCHAR(50),                       -- CIPC registration
  vat_number VARCHAR(20),

  -- Primary Contact (Corporate HQ)
  primary_contact_name VARCHAR(255) NOT NULL,
  primary_contact_email VARCHAR(255) NOT NULL,
  primary_contact_phone VARCHAR(20),
  primary_contact_position VARCHAR(100),

  -- Billing Contact (Finance Department)
  billing_contact_name VARCHAR(255),
  billing_contact_email VARCHAR(255),
  billing_contact_phone VARCHAR(20),

  -- Technical Contact (IT Department)
  technical_contact_name VARCHAR(255),
  technical_contact_email VARCHAR(255),
  technical_contact_phone VARCHAR(20),

  -- Corporate Address (Headquarters)
  physical_address JSONB,                                -- { street, city, province, postal_code }
  postal_address JSONB,

  -- Account Details
  account_status corporate_account_status DEFAULT 'active',

  -- Financial
  credit_limit DECIMAL(12, 2) DEFAULT 0,
  payment_terms INTEGER DEFAULT 30,                      -- Days
  billing_cycle VARCHAR(20) DEFAULT 'monthly',           -- monthly, quarterly, annually

  -- Stats (cached, updated by trigger)
  total_sites INTEGER DEFAULT 0,
  active_sites INTEGER DEFAULT 0,
  pending_sites INTEGER DEFAULT 0,

  -- Contract Details
  contract_start_date DATE,
  contract_end_date DATE,
  contract_value DECIMAL(12, 2),
  expected_sites INTEGER,                                -- Target deployment count

  -- Industry/Metadata
  industry VARCHAR(100),
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,

  -- Constraints
  CONSTRAINT corporate_code_uppercase CHECK (corporate_code = UPPER(corporate_code)),
  CONSTRAINT corporate_code_alphanumeric CHECK (corporate_code ~ '^[A-Z0-9]+$')
);

-- Comments
COMMENT ON TABLE corporate_accounts IS 'Parent corporate/enterprise accounts for multi-site clients';
COMMENT ON COLUMN corporate_accounts.corporate_code IS 'Unique short code used in site account numbers (e.g., UNJ for Unjani)';
COMMENT ON COLUMN corporate_accounts.total_sites IS 'Cached count of all sites, updated by trigger';

-- ============================================================================
-- PHASE 3: Corporate Sites Table (Child Locations)
-- ============================================================================

CREATE TABLE corporate_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent Reference
  corporate_id UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE RESTRICT,

  -- Site Identity (auto-generated)
  site_number INTEGER NOT NULL,                          -- Sequential within corporate
  account_number VARCHAR(20) UNIQUE,                     -- CT-UNJ-001 format

  -- Site Details
  site_name VARCHAR(255) NOT NULL,                       -- e.g., "Unjani Clinic - Soweto"
  site_code VARCHAR(50),                                 -- Internal reference (optional)

  -- Site Contact (Local Manager/Nurse)
  site_contact_name VARCHAR(255),
  site_contact_email VARCHAR(255),
  site_contact_phone VARCHAR(20),

  -- Installation Address
  installation_address JSONB NOT NULL,                   -- { street, city, province, postal_code }
  province VARCHAR(50),                                  -- Denormalized for filtering
  coordinates JSONB,                                     -- { lat, lng }

  -- Site Status
  status corporate_site_status DEFAULT 'pending',

  -- PPPoE Integration
  pppoe_credential_id UUID,                              -- FK added after table exists
  pppoe_username VARCHAR(100),                           -- Cached for quick reference

  -- Service Details
  package_id UUID,                                       -- Standard package for this site
  service_id UUID,                                       -- Link to customer_services
  monthly_fee DECIMAL(10, 2),

  -- Installation Checklist (RFI)
  has_rack_facility BOOLEAN DEFAULT false,
  has_access_control BOOLEAN DEFAULT false,
  has_air_conditioning BOOLEAN DEFAULT false,
  has_ac_power BOOLEAN DEFAULT false,
  rfi_status VARCHAR(20) DEFAULT 'not_ready',            -- not_ready, pending, approved
  rfi_notes TEXT,

  -- Site Access
  access_type VARCHAR(20) DEFAULT 'business_hours',      -- business_hours, 24_7, appointment
  access_instructions TEXT,
  landlord_consent_url TEXT,

  -- Installation Details
  installed_at TIMESTAMPTZ,
  installed_by VARCHAR(255),
  router_serial VARCHAR(100),
  router_model VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(corporate_id, site_number)
);

-- Comments
COMMENT ON TABLE corporate_sites IS 'Individual site/location accounts under a corporate parent';
COMMENT ON COLUMN corporate_sites.account_number IS 'Auto-generated in format CT-{CORP_CODE}-{NNN}';
COMMENT ON COLUMN corporate_sites.pppoe_username IS 'Cached PPPoE username for quick reference';

-- ============================================================================
-- PHASE 4: Account Number Generation
-- ============================================================================

/**
 * Generate unique account number for corporate site
 * Format: CT-{CORPORATE_CODE}-{3-DIGIT-NUMBER}
 * Example: CT-UNJ-001, CT-UNJ-002, CT-ABC-001
 */
CREATE OR REPLACE FUNCTION generate_corporate_site_account_number()
RETURNS TRIGGER AS $$
DECLARE
  corp_code VARCHAR(10);
  next_num INTEGER;
BEGIN
  -- Get corporate code from parent
  SELECT corporate_code INTO corp_code
  FROM corporate_accounts
  WHERE id = NEW.corporate_id;

  IF corp_code IS NULL THEN
    RAISE EXCEPTION 'Corporate account not found for id: %', NEW.corporate_id;
  END IF;

  -- Get next site number for this corporate
  SELECT COALESCE(MAX(site_number), 0) + 1 INTO next_num
  FROM corporate_sites
  WHERE corporate_id = NEW.corporate_id;

  -- Set values
  NEW.site_number := next_num;
  NEW.account_number := 'CT-' || corp_code || '-' || LPAD(next_num::TEXT, 3, '0');

  -- Auto-generate PPPoE username
  NEW.pppoe_username := NEW.account_number || '@circletel.co.za';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate account number on insert
CREATE TRIGGER trigger_generate_corporate_site_account_number
  BEFORE INSERT ON corporate_sites
  FOR EACH ROW
  WHEN (NEW.account_number IS NULL)
  EXECUTE FUNCTION generate_corporate_site_account_number();

-- ============================================================================
-- PHASE 5: Site Count Trigger
-- ============================================================================

/**
 * Update cached site counts on corporate_accounts when sites change
 */
CREATE OR REPLACE FUNCTION update_corporate_site_counts()
RETURNS TRIGGER AS $$
DECLARE
  corp_id UUID;
BEGIN
  -- Determine which corporate to update
  IF TG_OP = 'DELETE' THEN
    corp_id := OLD.corporate_id;
  ELSE
    corp_id := NEW.corporate_id;
  END IF;

  -- Update counts
  UPDATE corporate_accounts
  SET
    total_sites = (
      SELECT COUNT(*) FROM corporate_sites
      WHERE corporate_id = corp_id
    ),
    active_sites = (
      SELECT COUNT(*) FROM corporate_sites
      WHERE corporate_id = corp_id AND status = 'active'
    ),
    pending_sites = (
      SELECT COUNT(*) FROM corporate_sites
      WHERE corporate_id = corp_id AND status IN ('pending', 'ready', 'provisioned')
    ),
    updated_at = NOW()
  WHERE id = corp_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for site count updates
CREATE TRIGGER trigger_update_corporate_site_counts
  AFTER INSERT OR UPDATE OR DELETE ON corporate_sites
  FOR EACH ROW
  EXECUTE FUNCTION update_corporate_site_counts();

-- ============================================================================
-- PHASE 6: Updated At Triggers
-- ============================================================================

-- Auto-update updated_at on corporate_accounts
CREATE TRIGGER trigger_corporate_accounts_updated_at
  BEFORE UPDATE ON corporate_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at on corporate_sites
CREATE TRIGGER trigger_corporate_sites_updated_at
  BEFORE UPDATE ON corporate_sites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PHASE 7: Indexes
-- ============================================================================

-- Corporate accounts indexes
CREATE INDEX idx_corporate_accounts_code ON corporate_accounts(corporate_code);
CREATE INDEX idx_corporate_accounts_status ON corporate_accounts(account_status);
CREATE INDEX idx_corporate_accounts_company_name ON corporate_accounts(company_name);

-- Corporate sites indexes
CREATE INDEX idx_corporate_sites_corporate_id ON corporate_sites(corporate_id);
CREATE INDEX idx_corporate_sites_account_number ON corporate_sites(account_number);
CREATE INDEX idx_corporate_sites_status ON corporate_sites(status);
CREATE INDEX idx_corporate_sites_province ON corporate_sites(province);
CREATE INDEX idx_corporate_sites_pppoe_username ON corporate_sites(pppoe_username)
  WHERE pppoe_username IS NOT NULL;

-- ============================================================================
-- PHASE 8: RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE corporate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_sites ENABLE ROW LEVEL SECURITY;

-- Service role has full access (admin operations)
CREATE POLICY "Service role full access on corporate_accounts"
  ON corporate_accounts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on corporate_sites"
  ON corporate_sites FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read (for API access)
CREATE POLICY "Authenticated users can read corporate_accounts"
  ON corporate_accounts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read corporate_sites"
  ON corporate_sites FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- PHASE 9: FK to pppoe_credentials (if table exists)
-- ============================================================================

-- Add FK constraint if pppoe_credentials table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'pppoe_credentials'
  ) THEN
    ALTER TABLE corporate_sites
      ADD CONSTRAINT fk_corporate_sites_pppoe_credential
      FOREIGN KEY (pppoe_credential_id)
      REFERENCES pppoe_credentials(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  -- Check tables created
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'corporate_accounts'
  ) THEN
    RAISE EXCEPTION 'Migration failed: corporate_accounts table not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'corporate_sites'
  ) THEN
    RAISE EXCEPTION 'Migration failed: corporate_sites table not created';
  END IF;

  -- Check trigger function exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'generate_corporate_site_account_number'
  ) THEN
    RAISE EXCEPTION 'Migration failed: account number function not created';
  END IF;

  RAISE NOTICE 'Migration 20260211000001_create_corporate_accounts completed successfully';
END $$;
