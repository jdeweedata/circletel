-- Migration: Create Contracts System
-- Created: 2025-11-02
-- Description: Contracts table with digital signatures, KYC integration, and ZOHO CRM sync
-- Part of: B2B Quote-to-Contract Workflow (Task Group 5)

-- =====================================================
-- 1. CREATE CONTRACTS TABLE
-- =====================================================

CREATE TABLE contracts (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT UNIQUE NOT NULL, -- CT-YYYY-NNN (auto-generated)

  -- Foreign Keys
  quote_id UUID NOT NULL REFERENCES business_quotes(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  kyc_session_id UUID REFERENCES kyc_sessions(id) ON DELETE SET NULL,

  -- Contract Details
  contract_type TEXT NOT NULL CHECK (contract_type IN ('fibre', 'wireless', 'hybrid')),
  contract_term_months INTEGER NOT NULL CHECK (contract_term_months IN (12, 24, 36)),
  start_date DATE,
  end_date DATE,

  -- Pricing (all in ZAR)
  monthly_recurring DECIMAL(10,2) NOT NULL,
  once_off_fee DECIMAL(10,2) DEFAULT 0,
  installation_fee DECIMAL(10,2) DEFAULT 0,
  total_contract_value DECIMAL(10,2) NOT NULL,

  -- Digital Signature (ZOHO Sign Integration)
  zoho_sign_request_id TEXT UNIQUE,
  customer_signature_date TIMESTAMP WITH TIME ZONE,
  circletel_signature_date TIMESTAMP WITH TIME ZONE,
  fully_signed_date TIMESTAMP WITH TIME ZONE,
  signed_pdf_url TEXT,

  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN (
      'draft',
      'pending_signature',
      'partially_signed',
      'fully_signed',
      'active',
      'expired',
      'terminated'
    )
  ),

  -- ZOHO CRM Integration
  zoho_deal_id TEXT UNIQUE,
  last_synced_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE INDEXES
-- =====================================================

-- Foreign key indexes for fast lookups
CREATE INDEX idx_contracts_quote ON contracts(quote_id);
CREATE INDEX idx_contracts_customer ON contracts(customer_id);
CREATE INDEX idx_contracts_kyc_session ON contracts(kyc_session_id);

-- Status index for filtering
CREATE INDEX idx_contracts_status ON contracts(status);

-- ZOHO integration indexes
CREATE INDEX idx_contracts_zoho_sign ON contracts(zoho_sign_request_id);
CREATE INDEX idx_contracts_zoho_deal ON contracts(zoho_deal_id);

-- Date range queries
CREATE INDEX idx_contracts_created_at ON contracts(created_at);

-- =====================================================
-- 3. CONTRACT NUMBER GENERATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  sequence_num TEXT;
  next_sequence INTEGER;
BEGIN
  -- Get current year in YYYY format
  current_year := TO_CHAR(NOW(), 'YYYY');

  -- Get next sequence number for this year
  SELECT COUNT(*) + 1
  INTO next_sequence
  FROM contracts
  WHERE contract_number LIKE 'CT-' || current_year || '-%';

  -- Format as 3-digit zero-padded string
  sequence_num := LPAD(next_sequence::TEXT, 3, '0');

  -- Return formatted contract number: CT-YYYY-NNN
  RETURN 'CT-' || current_year || '-' || sequence_num;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION generate_contract_number() IS
  'Generates unique contract numbers in CT-YYYY-NNN format (e.g., CT-2025-001)';

-- =====================================================
-- 4. AUTO-NUMBERING TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_set_contract_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if contract_number is NULL
  IF NEW.contract_number IS NULL THEN
    NEW.contract_number := generate_contract_number();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_contract_number
  BEFORE INSERT ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_contract_number();

-- Add comment for documentation
COMMENT ON TRIGGER before_insert_contract_number ON contracts IS
  'Automatically generates contract_number before INSERT if not provided';

-- =====================================================
-- 5. UPDATED_AT TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_update_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_contracts_updated_at();

-- =====================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. RLS POLICIES
-- =====================================================

-- Policy 1: Customers SELECT own contracts
CREATE POLICY "customers_select_own_contracts" ON contracts
FOR SELECT
USING (
  customer_id = auth.uid()
);

COMMENT ON POLICY "customers_select_own_contracts" ON contracts IS
  'Customers can view their own contracts via customer_id = auth.uid()';

-- Policy 2: Sales reps SELECT contracts for own quotes
CREATE POLICY "sales_reps_select_own_quotes_contracts" ON contracts
FOR SELECT
USING (
  quote_id IN (
    SELECT id FROM business_quotes WHERE created_by = auth.uid()
  )
);

COMMENT ON POLICY "sales_reps_select_own_quotes_contracts" ON contracts IS
  'Sales representatives can view contracts for quotes they created';

-- Policy 3: Managers SELECT all contracts
CREATE POLICY "managers_select_all_contracts" ON contracts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND role IN ('manager', 'admin', 'super_admin')
  )
);

COMMENT ON POLICY "managers_select_all_contracts" ON contracts IS
  'Managers and above can view all contracts';

-- Policy 4: Admins ALL operations
CREATE POLICY "admins_all_contracts" ON contracts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

COMMENT ON POLICY "admins_all_contracts" ON contracts IS
  'Admins and super_admins have full CRUD access to all contracts';

-- Policy 5: Service role bypass (for webhooks and system operations)
CREATE POLICY "service_role_all_contracts" ON contracts
FOR ALL
USING (
  auth.jwt()->>'role' = 'service_role'
);

COMMENT ON POLICY "service_role_all_contracts" ON contracts IS
  'Service role (for API webhooks and system operations) has full access';

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant basic SELECT to authenticated users (RLS will filter)
GRANT SELECT ON contracts TO authenticated;

-- Grant INSERT/UPDATE/DELETE to service_role for webhook operations
GRANT ALL ON contracts TO service_role;

-- =====================================================
-- 9. TABLE COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE contracts IS
  'B2B service contracts with digital signatures, KYC integration, and ZOHO CRM sync';

COMMENT ON COLUMN contracts.contract_number IS
  'Unique contract identifier in CT-YYYY-NNN format (auto-generated)';

COMMENT ON COLUMN contracts.quote_id IS
  'Reference to originating business quote (RESTRICT delete to preserve history)';

COMMENT ON COLUMN contracts.kyc_session_id IS
  'Reference to KYC verification session (NULL if not yet verified)';

COMMENT ON COLUMN contracts.contract_type IS
  'Service type: fibre, wireless, or hybrid';

COMMENT ON COLUMN contracts.contract_term_months IS
  'Contract duration in months: 12, 24, or 36';

COMMENT ON COLUMN contracts.total_contract_value IS
  'Total contract value over term (monthly_recurring * term + once_off + installation)';

COMMENT ON COLUMN contracts.zoho_sign_request_id IS
  'ZOHO Sign request ID for digital signature tracking';

COMMENT ON COLUMN contracts.status IS
  'Contract lifecycle: draft → pending_signature → partially_signed → fully_signed → active';

COMMENT ON COLUMN contracts.zoho_deal_id IS
  'ZOHO CRM deal ID for bidirectional sync';

-- =====================================================
-- 10. ROLLBACK INSTRUCTIONS (COMMENTED)
-- =====================================================

-- To rollback this migration, execute the following commands:
--
-- -- Drop policies
-- DROP POLICY IF EXISTS "service_role_all_contracts" ON contracts;
-- DROP POLICY IF EXISTS "admins_all_contracts" ON contracts;
-- DROP POLICY IF EXISTS "managers_select_all_contracts" ON contracts;
-- DROP POLICY IF EXISTS "sales_reps_select_own_quotes_contracts" ON contracts;
-- DROP POLICY IF EXISTS "customers_select_own_contracts" ON contracts;
--
-- -- Drop triggers
-- DROP TRIGGER IF EXISTS before_update_contracts_updated_at ON contracts;
-- DROP TRIGGER IF EXISTS before_insert_contract_number ON contracts;
--
-- -- Drop functions
-- DROP FUNCTION IF EXISTS trigger_update_contracts_updated_at();
-- DROP FUNCTION IF EXISTS trigger_set_contract_number();
-- DROP FUNCTION IF EXISTS generate_contract_number();
--
-- -- Drop indexes
-- DROP INDEX IF EXISTS idx_contracts_created_at;
-- DROP INDEX IF EXISTS idx_contracts_zoho_deal;
-- DROP INDEX IF EXISTS idx_contracts_zoho_sign;
-- DROP INDEX IF EXISTS idx_contracts_status;
-- DROP INDEX IF EXISTS idx_contracts_kyc_session;
-- DROP INDEX IF EXISTS idx_contracts_customer;
-- DROP INDEX IF EXISTS idx_contracts_quote;
--
-- -- Drop table
-- DROP TABLE IF EXISTS contracts;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
