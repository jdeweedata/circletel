-- ============================================================================
-- Migration: Create Business Site Details Table
-- Description: Captures premises information and RFI (Ready for Installation) status
-- for B2B customer journey Stage 3: Site Details
-- Created: 2025-12-17
-- ============================================================================

-- Premises ownership enum
CREATE TYPE premises_ownership AS ENUM ('owned', 'leased');

-- Property type enum
CREATE TYPE property_type AS ENUM (
  'office',
  'retail',
  'warehouse',
  'industrial',
  'data_center',
  'mixed_use',
  'other'
);

-- Equipment location enum
CREATE TYPE equipment_location AS ENUM (
  'rack_mounted',
  'wall_mounted',
  'floor_standing',
  'other'
);

-- Site access type enum
CREATE TYPE site_access_type AS ENUM (
  '24_7',
  'business_hours',
  'appointment_only'
);

-- RFI status enum
CREATE TYPE rfi_status_type AS ENUM (
  'ready',       -- All 4 RFI items passed
  'pending',     -- Some RFI items passed (1-3)
  'not_ready'    -- No RFI items passed (0)
);

-- ============================================================================
-- Business Site Details Table
-- ============================================================================
CREATE TABLE business_site_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  business_customer_id UUID NOT NULL REFERENCES business_customers(id) ON DELETE CASCADE,
  journey_stage_id UUID REFERENCES business_journey_stages(id),
  quote_id UUID REFERENCES business_quotes(id),

  -- ============================================================================
  -- Premises Information
  -- ============================================================================
  premises_ownership premises_ownership NOT NULL,
  property_type property_type NOT NULL,
  building_name VARCHAR(255),
  floor_level VARCHAR(50),

  -- Installation Address (if different from business registered address)
  installation_address JSONB,  -- { street, suburb, city, province, postal_code }

  -- ============================================================================
  -- Equipment Location Details
  -- ============================================================================
  room_name VARCHAR(255) NOT NULL,  -- e.g., "Server Room", "Comms Room", "IT Room"
  equipment_location equipment_location NOT NULL,
  cable_entry_point TEXT,  -- Description of how fibre cable will enter the building

  -- ============================================================================
  -- RFI Checklist (Ready for Installation)
  -- All 4 must be TRUE for RFI status to be "ready"
  -- ============================================================================
  has_rack_facility BOOLEAN NOT NULL DEFAULT false,      -- Rack or facility available for equipment
  has_access_control BOOLEAN NOT NULL DEFAULT false,     -- Access control to room/facility documented
  has_air_conditioning BOOLEAN NOT NULL DEFAULT false,   -- Room is air-conditioned or well ventilated
  has_ac_power BOOLEAN NOT NULL DEFAULT false,           -- 220V 50Hz AC power available for PSU

  -- RFI Status (calculated by trigger)
  rfi_status rfi_status_type DEFAULT 'not_ready',
  rfi_notes TEXT,  -- Notes about what's missing or needs attention

  -- ============================================================================
  -- Access Information
  -- ============================================================================
  access_type site_access_type NOT NULL,
  access_instructions TEXT,  -- Special access requirements or notes

  -- Building Manager (required if premises_ownership = 'leased')
  building_manager_name VARCHAR(255),
  building_manager_phone VARCHAR(20),
  building_manager_email VARCHAR(255),

  -- ============================================================================
  -- Documentation
  -- ============================================================================
  site_photos JSONB DEFAULT '[]',  -- Array of storage URLs: [{url, filename, uploaded_at}]
  building_access_form_url TEXT,   -- URL to building access authorization form

  -- Landlord Consent (REQUIRED for leased premises before installation)
  landlord_consent_url TEXT,       -- URL to signed landlord consent/approval document
  landlord_consent_signed BOOLEAN DEFAULT false,  -- Has landlord signed consent?
  landlord_consent_signed_at TIMESTAMPTZ,
  landlord_name VARCHAR(255),      -- Landlord/property owner name
  landlord_contact VARCHAR(255),   -- Landlord contact (email or phone)

  -- ============================================================================
  -- Status & Workflow
  -- ============================================================================
  status VARCHAR(20) DEFAULT 'draft',  -- draft, submitted, under_review, approved, rejected
  admin_notes TEXT,
  rejection_reason TEXT,

  -- ============================================================================
  -- Timestamps
  -- ============================================================================
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),

  -- ============================================================================
  -- Constraints
  -- ============================================================================
  -- Building manager info required for leased premises (enforced in application)
  CONSTRAINT valid_site_photos CHECK (jsonb_typeof(site_photos) = 'array')
);

-- ============================================================================
-- Auto-calculate RFI status trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_rfi_status()
RETURNS TRIGGER AS $$
DECLARE
  passed_count INTEGER;
BEGIN
  -- Count how many RFI items pass
  passed_count := 0;
  IF NEW.has_rack_facility THEN passed_count := passed_count + 1; END IF;
  IF NEW.has_access_control THEN passed_count := passed_count + 1; END IF;
  IF NEW.has_air_conditioning THEN passed_count := passed_count + 1; END IF;
  IF NEW.has_ac_power THEN passed_count := passed_count + 1; END IF;

  -- Set RFI status based on count
  IF passed_count = 4 THEN
    NEW.rfi_status := 'ready';
  ELSIF passed_count = 0 THEN
    NEW.rfi_status := 'not_ready';
  ELSE
    NEW.rfi_status := 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_rfi_status
  BEFORE INSERT OR UPDATE ON business_site_details
  FOR EACH ROW
  EXECUTE FUNCTION calculate_rfi_status();

-- ============================================================================
-- Update timestamp trigger
-- ============================================================================
CREATE TRIGGER trigger_update_site_details_updated_at
  BEFORE UPDATE ON business_site_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Indexes for performance
-- ============================================================================
CREATE INDEX idx_site_details_customer ON business_site_details(business_customer_id);
CREATE INDEX idx_site_details_quote ON business_site_details(quote_id);
CREATE INDEX idx_site_details_rfi_status ON business_site_details(rfi_status);
CREATE INDEX idx_site_details_status ON business_site_details(status);
CREATE INDEX idx_site_details_created ON business_site_details(created_at DESC);

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE business_site_details ENABLE ROW LEVEL SECURITY;

-- Admin users can do everything
CREATE POLICY "Admin full access to site_details"
  ON business_site_details
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Business customers can view their own site details
CREATE POLICY "Customers view own site_details"
  ON business_site_details
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_customers
      WHERE business_customers.id = business_site_details.business_customer_id
      AND business_customers.auth_user_id = auth.uid()
    )
  );

-- Business customers can insert their own site details
CREATE POLICY "Customers insert own site_details"
  ON business_site_details
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_customers
      WHERE business_customers.id = business_site_details.business_customer_id
      AND business_customers.auth_user_id = auth.uid()
    )
  );

-- Business customers can update their own site details (only if not yet approved)
CREATE POLICY "Customers update own site_details"
  ON business_site_details
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_customers
      WHERE business_customers.id = business_site_details.business_customer_id
      AND business_customers.auth_user_id = auth.uid()
    )
    AND status IN ('draft', 'submitted', 'rejected')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_customers
      WHERE business_customers.id = business_site_details.business_customer_id
      AND business_customers.auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE business_site_details IS 'B2B customer site details for installation readiness (Journey Stage 3)';
COMMENT ON COLUMN business_site_details.rfi_status IS 'Ready for Installation status: ready (all 4 items), pending (1-3 items), not_ready (0 items)';
COMMENT ON COLUMN business_site_details.has_rack_facility IS 'RFI: Is there a rack or facility to install the equipment?';
COMMENT ON COLUMN business_site_details.has_access_control IS 'RFI: Is there access control to the room/facility?';
COMMENT ON COLUMN business_site_details.has_air_conditioning IS 'RFI: Is the room air-conditioned or well ventilated?';
COMMENT ON COLUMN business_site_details.has_ac_power IS 'RFI: Is there a 220V 50Hz AC power plug for the PSU?';
COMMENT ON COLUMN business_site_details.site_photos IS 'JSON array of uploaded site photo URLs (minimum 1 required for submission)';
COMMENT ON COLUMN business_site_details.landlord_consent_signed IS 'REQUIRED for leased premises: Landlord must sign consent before installation can proceed';
COMMENT ON COLUMN business_site_details.landlord_consent_url IS 'URL to signed landlord consent/approval document (required for leased premises)';
