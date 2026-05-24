-- Migration: Create Partners System
-- Description: Creates tables and policies for Sales Partner portal (BRS 5.3)
-- Date: 2027-10-27
-- Author: Claude Code

-- ============================================
-- PARTNERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Business Information
  business_name TEXT NOT NULL,
  registration_number TEXT,
  vat_number TEXT,
  business_type TEXT NOT NULL CHECK (business_type IN ('sole_proprietor', 'company', 'partnership')),

  -- Contact Information
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  alternative_phone TEXT,

  -- Address
  street_address TEXT NOT NULL,
  suburb TEXT,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT NOT NULL,

  -- Banking Details (should be encrypted in production)
  bank_name TEXT,
  account_holder TEXT,
  account_number TEXT,
  account_type TEXT,
  branch_code TEXT,

  -- Partner Identification (generated on approval)
  partner_number TEXT UNIQUE,  -- e.g., "CTPL-2025-001" - Generated when status = 'approved'

  -- Commission Structure
  commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,  -- Commission percentage (e.g., 10.50 for 10.5%)
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (
    tier IN ('bronze', 'silver', 'gold', 'platinum')
  ),

  -- Status Management
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'under_review', 'approved', 'rejected', 'suspended')
  ),
  approval_notes TEXT,
  approved_by UUID REFERENCES admin_users(id),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,

  -- FICA/Compliance Management
  compliance_status TEXT NOT NULL DEFAULT 'incomplete' CHECK (
    compliance_status IN ('incomplete', 'submitted', 'under_review', 'verified', 'rejected')
  ),
  compliance_verified_at TIMESTAMPTZ,
  compliance_notes TEXT,

  -- Performance Metrics
  total_leads INTEGER NOT NULL DEFAULT 0,
  converted_leads INTEGER NOT NULL DEFAULT 0,
  total_commission_earned DECIMAL(10, 2) NOT NULL DEFAULT 0,
  pending_commission DECIMAL(10, 2) NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PARTNER COMPLIANCE DOCUMENTS TABLE (FICA/CIPC)
-- ============================================

CREATE TABLE IF NOT EXISTS partner_compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE NOT NULL,

  -- Document Category
  document_category TEXT NOT NULL CHECK (
    document_category IN (
      'fica_identity',       -- FICA: ID documents, passports
      'fica_address',        -- FICA: Proof of residential address
      'cipc_registration',   -- CIPC: CK1, CoR 14.3, Company Registration
      'cipc_profile',        -- CIPC: Company Profile (recent)
      'cipc_directors',      -- CIPC: CM1, List of Directors
      'cipc_founding',       -- CIPC: MOI, Founding Statement
      'tax_clearance',       -- SARS: Tax Clearance Certificate
      'vat_registration',    -- SARS: VAT Registration Certificate
      'bank_confirmation',   -- Banking: Bank confirmation letter
      'bank_statement',      -- Banking: Cancelled cheque or statement
      'business_address',    -- Business: Proof of business address
      'authorization',       -- Business: Resolution, signatory authorization
      'other'                -- Other supporting documents
    )
  ),

  -- Specific Document Type (within category)
  document_type TEXT NOT NULL,  -- e.g., "South African ID", "CK1", "Tax Clearance"
  document_name TEXT NOT NULL,  -- Original filename
  file_path TEXT NOT NULL,      -- Supabase Storage path
  file_size INTEGER,
  mime_type TEXT,

  -- Document Metadata
  document_number TEXT,          -- ID number, registration number, etc.
  issue_date DATE,
  expiry_date DATE,

  -- Verification
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    verification_status IN ('pending', 'approved', 'rejected', 'expired')
  ),
  verified_by UUID REFERENCES admin_users(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Requirements
  is_required BOOLEAN NOT NULL DEFAULT true,
  is_sensitive BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PARTNER LEAD ACTIVITIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS partner_lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES coverage_leads(id) ON DELETE CASCADE NOT NULL,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE NOT NULL,

  -- Activity Details
  activity_type TEXT NOT NULL CHECK (
    activity_type IN ('call', 'email', 'meeting', 'quote_sent', 'follow_up', 'note')
  ),
  subject TEXT,
  description TEXT,
  outcome TEXT,

  -- Next Action
  next_action TEXT,
  next_action_date TIMESTAMPTZ,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- EXTEND COVERAGE_LEADS FOR PARTNER ASSIGNMENT
-- ============================================

ALTER TABLE coverage_leads
ADD COLUMN IF NOT EXISTS assigned_partner_id UUID REFERENCES partners(id),
ADD COLUMN IF NOT EXISTS partner_assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS partner_notes TEXT,
ADD COLUMN IF NOT EXISTS partner_last_contact TIMESTAMPTZ;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Partners indexes
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_compliance_status ON partners(compliance_status);
CREATE INDEX IF NOT EXISTS idx_partners_email ON partners(email);
CREATE INDEX IF NOT EXISTS idx_partners_partner_number ON partners(partner_number);
CREATE INDEX IF NOT EXISTS idx_partners_tier ON partners(tier);

-- Compliance Documents indexes (FICA/CIPC)
CREATE INDEX IF NOT EXISTS idx_partner_compliance_docs_partner_id ON partner_compliance_documents(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_compliance_docs_category ON partner_compliance_documents(document_category);
CREATE INDEX IF NOT EXISTS idx_partner_compliance_docs_verification_status ON partner_compliance_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_partner_compliance_docs_expiry ON partner_compliance_documents(expiry_date);

-- Lead Activities indexes
CREATE INDEX IF NOT EXISTS idx_partner_activities_lead ON partner_lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_partner_activities_partner ON partner_lead_activities(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_activities_created_at ON partner_lead_activities(created_at DESC);

-- Coverage Leads partner assignment
CREATE INDEX IF NOT EXISTS idx_coverage_leads_partner ON coverage_leads(assigned_partner_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all partner tables
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_lead_activities ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PARTNERS TABLE POLICIES
-- ============================================

-- Partners can view their own data
CREATE POLICY "partners_view_own_data"
  ON partners FOR SELECT
  USING (user_id = auth.uid());

-- Partners can update own data (only when status is pending)
CREATE POLICY "partners_update_own_data"
  ON partners FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

-- Anyone can register as a partner (insert)
CREATE POLICY "partners_register"
  ON partners FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can view all partners
CREATE POLICY "admins_view_all_partners"
  ON partners FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role_template_id IN (
        SELECT id FROM role_templates
        WHERE name IN ('Super Administrator', 'Sales Manager', 'Chief Executive Officer')
      )
    )
  );

-- Admins can manage partners (update/delete)
CREATE POLICY "admins_manage_partners"
  ON partners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role_template_id IN (
        SELECT id FROM role_templates
        WHERE name IN ('Super Administrator', 'Sales Manager')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role_template_id IN (
        SELECT id FROM role_templates
        WHERE name IN ('Super Administrator', 'Sales Manager')
      )
    )
  );

-- ============================================
-- PARTNER COMPLIANCE DOCUMENTS POLICIES (FICA/CIPC)
-- ============================================

-- Partners can view own documents
CREATE POLICY "partners_view_own_compliance_documents"
  ON partner_compliance_documents FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Partners can upload documents
CREATE POLICY "partners_upload_compliance_documents"
  ON partner_compliance_documents FOR INSERT
  WITH CHECK (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Partners can delete own unverified documents
CREATE POLICY "partners_delete_own_unverified_compliance_documents"
  ON partner_compliance_documents FOR DELETE
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
    AND verification_status = 'pending'
  );

-- Admins can view all compliance documents
CREATE POLICY "admins_view_all_compliance_documents"
  ON partner_compliance_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role_template_id IN (
        SELECT id FROM role_templates
        WHERE name IN ('Super Administrator', 'Sales Manager')
      )
    )
  );

-- Admins can manage compliance documents
CREATE POLICY "admins_manage_compliance_documents"
  ON partner_compliance_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role_template_id IN (
        SELECT id FROM role_templates
        WHERE name IN ('Super Administrator', 'Sales Manager')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role_template_id IN (
        SELECT id FROM role_templates
        WHERE name IN ('Super Administrator', 'Sales Manager')
      )
    )
  );

-- ============================================
-- PARTNER LEAD ACTIVITIES POLICIES
-- ============================================

-- Partners can view own activities
CREATE POLICY "partners_view_own_activities"
  ON partner_lead_activities FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Partners can add activities to assigned leads
CREATE POLICY "partners_add_activities"
  ON partner_lead_activities FOR INSERT
  WITH CHECK (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
    AND lead_id IN (
      SELECT id FROM coverage_leads WHERE assigned_partner_id = partner_id
    )
  );

-- Partners can update own activities
CREATE POLICY "partners_update_own_activities"
  ON partner_lead_activities FOR UPDATE
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Admins can view all activities
CREATE POLICY "admins_view_all_activities"
  ON partner_lead_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role_template_id IN (
        SELECT id FROM role_templates
        WHERE name IN ('Super Administrator', 'Sales Manager')
      )
    )
  );

-- ============================================
-- COVERAGE_LEADS PARTNER ASSIGNMENT POLICIES
-- ============================================

-- Update existing RLS policy to allow partners to view assigned leads
CREATE POLICY "partners_view_assigned_leads"
  ON coverage_leads FOR SELECT
  USING (
    assigned_partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Partners can update assigned leads (notes, last contact)
CREATE POLICY "partners_update_assigned_leads"
  ON coverage_leads FOR UPDATE
  USING (
    assigned_partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    assigned_partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for partners table
DROP TRIGGER IF EXISTS trigger_partners_updated_at ON partners;
CREATE TRIGGER trigger_partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_partners_updated_at();

-- Function to update partner metrics when leads are converted
CREATE OR REPLACE FUNCTION update_partner_lead_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total leads count when partner is assigned
  IF (TG_OP = 'UPDATE' AND OLD.assigned_partner_id IS NULL AND NEW.assigned_partner_id IS NOT NULL) THEN
    UPDATE partners
    SET total_leads = total_leads + 1
    WHERE id = NEW.assigned_partner_id;
  END IF;

  -- Update converted leads count when status changes to 'converted'
  IF (TG_OP = 'UPDATE' AND NEW.assigned_partner_id IS NOT NULL AND OLD.status != 'converted' AND NEW.status = 'converted') THEN
    UPDATE partners
    SET converted_leads = converted_leads + 1
    WHERE id = NEW.assigned_partner_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for coverage_leads to update partner metrics
DROP TRIGGER IF EXISTS trigger_update_partner_metrics ON coverage_leads;
CREATE TRIGGER trigger_update_partner_metrics
  AFTER INSERT OR UPDATE ON coverage_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_lead_metrics();

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE partners IS 'Sales partners who manage leads and earn commissions (BRS 5.3.1)';
COMMENT ON TABLE partner_compliance_documents IS 'FICA/CIPC compliance documents for partner onboarding - includes identity verification, company registration, tax compliance, and banking verification (BRS 5.3.1)';
COMMENT ON TABLE partner_lead_activities IS 'Activity tracking for partner lead management (BRS 5.3.2)';

COMMENT ON COLUMN partners.status IS 'Partner approval status: pending, under_review, approved, rejected, suspended';
COMMENT ON COLUMN partners.compliance_status IS 'FICA/CIPC compliance status: incomplete, submitted, under_review, verified, rejected';
COMMENT ON COLUMN partners.total_commission_earned IS 'Total lifetime commission earned (ZAR)';
COMMENT ON COLUMN partners.pending_commission IS 'Commission pending payout (ZAR)';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Note: Remember to create Supabase Storage bucket for KYC documents
-- Bucket name: 'partner-kyc-documents'
-- Public: false (private bucket with RLS)
-- File size limit: 10MB per file
-- Allowed file types: PDF, JPG, PNG
