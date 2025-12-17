-- ============================================================================
-- Migration: Create Business Customers Table
-- Description: B2B customer management with company details and journey tracking
-- Created: 2025-12-17
-- ============================================================================

-- Create company type enum
CREATE TYPE company_type AS ENUM (
  'pty_ltd',      -- (Pty) Ltd - Private Company
  'cc',           -- Close Corporation
  'sole_prop',    -- Sole Proprietor
  'npc',          -- Non-Profit Company
  'partnership',  -- Partnership
  'trust',        -- Trust
  'other'         -- Other
);

-- Create business account status enum
CREATE TYPE business_account_status AS ENUM (
  'pending_verification',  -- Awaiting KYC/CIPC verification
  'verification_in_progress',
  'active',                -- Verified and active
  'suspended',             -- Temporarily suspended
  'cancelled',             -- Account cancelled
  'dormant'                -- No active services
);

-- Create business KYC status enum
CREATE TYPE business_kyc_status AS ENUM (
  'not_started',
  'documents_pending',
  'under_review',
  'approved',
  'rejected',
  'expired'
);

-- ============================================================================
-- Business Customers Table
-- ============================================================================
CREATE TABLE business_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to Supabase Auth
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Company Information
  company_name VARCHAR(255) NOT NULL,
  trading_name VARCHAR(255),
  registration_number VARCHAR(50),  -- CIPC registration number
  vat_number VARCHAR(20),
  company_type company_type DEFAULT 'pty_ltd',

  -- Primary Contact (Decision Maker)
  primary_contact_name VARCHAR(255) NOT NULL,
  primary_contact_email VARCHAR(255) NOT NULL,
  primary_contact_phone VARCHAR(20),
  primary_contact_position VARCHAR(100),

  -- Billing Contact (may be different from primary)
  billing_contact_name VARCHAR(255),
  billing_contact_email VARCHAR(255),
  billing_contact_phone VARCHAR(20),

  -- Technical Contact
  technical_contact_name VARCHAR(255),
  technical_contact_email VARCHAR(255),
  technical_contact_phone VARCHAR(20),

  -- Addresses
  physical_address JSONB,  -- { street, city, province, postal_code, country }
  postal_address JSONB,    -- { street, city, province, postal_code, country }

  -- Account Details
  account_number VARCHAR(20) UNIQUE,  -- CT-B-YYYY-NNNNN format
  account_status business_account_status DEFAULT 'pending_verification',
  kyc_status business_kyc_status DEFAULT 'not_started',

  -- Financial
  credit_limit DECIMAL(12, 2) DEFAULT 0,
  payment_terms INTEGER DEFAULT 30,  -- Days

  -- Metadata
  industry VARCHAR(100),
  employee_count VARCHAR(50),  -- e.g., '1-10', '11-50', '51-200', '200+'
  annual_revenue VARCHAR(50),  -- e.g., '<1M', '1M-10M', '10M-50M', '50M+'

  -- Source tracking
  lead_source VARCHAR(100),
  referred_by UUID REFERENCES business_customers(id),
  partner_id UUID,  -- Reference to partners table if applicable

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ
);

-- ============================================================================
-- Auto-generate account number function
-- Format: CT-B-YYYY-NNNNN (e.g., CT-B-2025-00001)
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_business_account_number()
RETURNS TRIGGER AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  new_account_number TEXT;
BEGIN
  -- Get current year
  current_year := TO_CHAR(NOW(), 'YYYY');

  -- Get next sequence number for this year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(account_number FROM 'CT-B-' || current_year || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM business_customers
  WHERE account_number LIKE 'CT-B-' || current_year || '-%';

  -- Generate account number
  new_account_number := 'CT-B-' || current_year || '-' || LPAD(next_number::TEXT, 5, '0');

  NEW.account_number := new_account_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-generating account number
CREATE TRIGGER trigger_generate_business_account_number
  BEFORE INSERT ON business_customers
  FOR EACH ROW
  WHEN (NEW.account_number IS NULL)
  EXECUTE FUNCTION generate_business_account_number();

-- ============================================================================
-- Update timestamp trigger
-- ============================================================================
CREATE TRIGGER trigger_update_business_customers_updated_at
  BEFORE UPDATE ON business_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Indexes for performance
-- ============================================================================
CREATE INDEX idx_business_customers_auth_user ON business_customers(auth_user_id);
CREATE INDEX idx_business_customers_account_number ON business_customers(account_number);
CREATE INDEX idx_business_customers_company_name ON business_customers(company_name);
CREATE INDEX idx_business_customers_registration_number ON business_customers(registration_number);
CREATE INDEX idx_business_customers_status ON business_customers(account_status);
CREATE INDEX idx_business_customers_kyc_status ON business_customers(kyc_status);
CREATE INDEX idx_business_customers_primary_email ON business_customers(primary_contact_email);

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE business_customers ENABLE ROW LEVEL SECURITY;

-- Admin users can do everything (using correct column names: id and is_active)
CREATE POLICY "Admin full access to business_customers"
  ON business_customers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Business customers can view their own record
CREATE POLICY "Business customers can view own record"
  ON business_customers
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Business customers can update their own record (limited fields)
CREATE POLICY "Business customers can update own record"
  ON business_customers
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE business_customers IS 'B2B customer accounts with company information and verification status';
COMMENT ON COLUMN business_customers.account_number IS 'Auto-generated: CT-B-YYYY-NNNNN format';
COMMENT ON COLUMN business_customers.registration_number IS 'CIPC company registration number';
COMMENT ON COLUMN business_customers.kyc_status IS 'Business KYC/FICA verification status';
