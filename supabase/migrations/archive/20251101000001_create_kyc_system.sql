-- ============================================
-- KYC and RICA System
-- ============================================
-- Purpose: FICA-compliant KYC verification and RICA pairing
-- Features: Didit integration, risk scoring, RICA auto-submission
-- Created: 2025-11-01
-- Dependencies: business_quotes, consumer_orders tables

-- =====================================================
-- 1. ENABLE EXTENSIONS
-- =====================================================

-- Enable UUID generation (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 2. HELPER FUNCTIONS
-- =====================================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if current user exists in admin_users table
  RETURN EXISTS (
    SELECT 1
    FROM admin_users
    WHERE id = auth.uid()
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. KYC SESSIONS TABLE
-- =====================================================

CREATE TABLE kyc_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES business_quotes(id) ON DELETE CASCADE,
  didit_session_id TEXT UNIQUE NOT NULL,

  -- Flow Configuration
  flow_type TEXT CHECK (flow_type IN ('sme_light', 'consumer_light', 'full_kyc')) DEFAULT 'sme_light',
  user_type TEXT CHECK (user_type IN ('business', 'consumer')),

  -- Session Status
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed', 'abandoned', 'declined')) DEFAULT 'not_started',

  -- Extracted Data (Didit Response - JSONB)
  extracted_data JSONB, -- { id_number, company_reg, directors: [], proof_of_address, liveness_score }
  verification_result TEXT CHECK (verification_result IN ('approved', 'declined', 'pending_review')),
  risk_tier TEXT CHECK (risk_tier IN ('low', 'medium', 'high')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  webhook_received_at TIMESTAMPTZ,
  raw_webhook_payload JSONB
);

-- Indexes for kyc_sessions
CREATE INDEX idx_kyc_didit_session ON kyc_sessions(didit_session_id);
CREATE INDEX idx_kyc_quote ON kyc_sessions(quote_id);
CREATE INDEX idx_kyc_status ON kyc_sessions(status);
CREATE INDEX idx_kyc_verification_result ON kyc_sessions(verification_result);

-- =====================================================
-- 4. RICA SUBMISSIONS TABLE
-- =====================================================

CREATE TABLE rica_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kyc_session_id UUID REFERENCES kyc_sessions(id) ON DELETE SET NULL,
  order_id UUID REFERENCES consumer_orders(id) ON DELETE SET NULL,

  -- RICA Details
  iccid TEXT[], -- SIM card IDs (array for multiple SIMs)
  submitted_data JSONB, -- Didit-extracted + service details
  icasa_tracking_id TEXT,

  -- Status
  status TEXT CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')) DEFAULT 'pending',
  icasa_response JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ
);

-- Indexes for rica_submissions
CREATE INDEX idx_rica_tracking ON rica_submissions(icasa_tracking_id);
CREATE INDEX idx_rica_kyc_session ON rica_submissions(kyc_session_id);
CREATE INDEX idx_rica_order ON rica_submissions(order_id);
CREATE INDEX idx_rica_status ON rica_submissions(status);

-- =====================================================
-- 5. RLS POLICIES - kyc_sessions
-- =====================================================

-- Enable RLS on kyc_sessions
ALTER TABLE kyc_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can SELECT their own KYC sessions (via quote_id → customer_id match)
CREATE POLICY kyc_customer_select ON kyc_sessions
  FOR SELECT
  USING (
    quote_id IN (
      SELECT id FROM business_quotes WHERE customer_id = auth.uid()
    )
  );

-- Policy: Admins have ALL operations
CREATE POLICY kyc_admin_all ON kyc_sessions
  FOR ALL
  USING (user_is_admin())
  WITH CHECK (user_is_admin());

-- Policy: System can INSERT (for webhooks using service role key)
CREATE POLICY kyc_system_insert ON kyc_sessions
  FOR INSERT
  WITH CHECK (true);

-- Policy: System can UPDATE (for webhooks using service role key)
CREATE POLICY kyc_system_update ON kyc_sessions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 6. RLS POLICIES - rica_submissions
-- =====================================================

-- Enable RLS on rica_submissions
ALTER TABLE rica_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can SELECT their own RICA submissions
CREATE POLICY rica_customer_select ON rica_submissions
  FOR SELECT
  USING (
    kyc_session_id IN (
      SELECT ks.id
      FROM kyc_sessions ks
      JOIN business_quotes bq ON bq.id = ks.quote_id
      WHERE bq.customer_id = auth.uid()
    )
    OR
    order_id IN (
      SELECT id FROM consumer_orders WHERE customer_id = auth.uid()
    )
  );

-- Policy: Operations managers can SELECT all RICA submissions
-- Note: This assumes operations managers have a specific role or permission
-- For now, using admin check - can be refined based on RBAC implementation
CREATE POLICY rica_operations_select ON rica_submissions
  FOR SELECT
  USING (user_is_admin());

-- Policy: Admins have ALL operations
CREATE POLICY rica_admin_all ON rica_submissions
  FOR ALL
  USING (user_is_admin())
  WITH CHECK (user_is_admin());

-- Policy: System can INSERT and UPDATE (for webhooks)
CREATE POLICY rica_system_insert ON rica_submissions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY rica_system_update ON rica_submissions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 7. TRIGGER FUNCTION - Auto-create KYC session
-- =====================================================

-- Function to auto-create KYC session when quote is approved
CREATE OR REPLACE FUNCTION trigger_kyc_session()
RETURNS TRIGGER AS $$
DECLARE
  v_flow_type TEXT;
  v_user_type TEXT;
BEGIN
  -- Only create KYC session when quote status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN

    -- Determine flow type based on quote total
    -- Calculate total contract value (monthly * term + installation)
    IF (NEW.total_monthly * NEW.contract_term + NEW.total_installation) < 500000 THEN
      v_flow_type := 'sme_light';
    ELSE
      v_flow_type := 'full_kyc';
    END IF;

    -- Determine user type based on customer_type
    IF NEW.customer_type IN ('smme', 'enterprise') THEN
      v_user_type := 'business';
    ELSE
      v_user_type := 'consumer';
    END IF;

    -- Create KYC session placeholder
    -- Note: The actual didit_session_id will be set by the API when creating Didit session
    INSERT INTO kyc_sessions (
      quote_id,
      didit_session_id,
      flow_type,
      user_type,
      status
    ) VALUES (
      NEW.id,
      'pending_' || NEW.id::TEXT, -- Temporary ID, will be replaced by API
      v_flow_type,
      v_user_type,
      'not_started'
    )
    ON CONFLICT (didit_session_id) DO NOTHING; -- Prevent duplicates

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on business_quotes
DROP TRIGGER IF EXISTS auto_create_kyc_session ON business_quotes;
CREATE TRIGGER auto_create_kyc_session
  AFTER UPDATE ON business_quotes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_kyc_session();

-- =====================================================
-- 8. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE kyc_sessions IS 'Stores KYC verification sessions from Didit for FICA compliance';
COMMENT ON TABLE rica_submissions IS 'Stores RICA submissions paired with KYC data for SIM registration';

COMMENT ON COLUMN kyc_sessions.didit_session_id IS 'Unique session ID from Didit KYC verification service';
COMMENT ON COLUMN kyc_sessions.flow_type IS 'Determines verification depth: sme_light (<R500k), full_kyc (>=R500k)';
COMMENT ON COLUMN kyc_sessions.extracted_data IS 'JSONB containing ID number, company reg, directors, proof of address, liveness score';
COMMENT ON COLUMN kyc_sessions.risk_tier IS 'Calculated risk: low (>=80 score), medium (>=50), high (<50)';

COMMENT ON COLUMN rica_submissions.submitted_data IS 'Complete RICA payload including Didit-extracted KYC data';
COMMENT ON COLUMN rica_submissions.icasa_tracking_id IS 'ICASA tracking reference for RICA submission';

-- =====================================================
-- 9. ROLLBACK SCRIPT (commented out)
-- =====================================================

/*
-- To rollback this migration, run the following commands:

DROP TRIGGER IF EXISTS auto_create_kyc_session ON business_quotes;
DROP FUNCTION IF EXISTS trigger_kyc_session();
DROP TABLE IF EXISTS rica_submissions CASCADE;
DROP TABLE IF EXISTS kyc_sessions CASCADE;
DROP FUNCTION IF EXISTS user_is_admin();

-- Note: Extensions (uuid-ossp, pgcrypto) are NOT dropped as they may be used by other tables
*/
