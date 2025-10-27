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

  -- Status Management
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'under_review', 'approved', 'rejected', 'suspended')
  ),
  approval_notes TEXT,
  approved_by UUID REFERENCES admin_users(id),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,

  -- KYC Management
  kyc_status TEXT NOT NULL DEFAULT 'incomplete' CHECK (
    kyc_status IN ('incomplete', 'submitted', 'verified', 'rejected')
  ),
  kyc_verified_at TIMESTAMPTZ,

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
-- PARTNER KYC DOCUMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS partner_kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE NOT NULL,

  -- Document Details
  document_type TEXT NOT NULL CHECK (
    document_type IN (
      'id_document',
      'proof_of_address',
      'business_registration',
      'tax_certificate',
      'bank_statement',
      'other'
    )
  ),
  document_name TEXT NOT NULL,
  file_path TEXT NOT NULL,  -- Supabase Storage path
  file_size INTEGER,
  mime_type TEXT,

  -- Verification
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    verification_status IN ('pending', 'approved', 'rejected')
  ),
  verified_by UUID REFERENCES admin_users(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Timestamps
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
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
CREATE INDEX IF NOT EXISTS idx_partners_kyc_status ON partners(kyc_status);
CREATE INDEX IF NOT EXISTS idx_partners_email ON partners(email);

-- KYC Documents indexes
CREATE INDEX IF NOT EXISTS idx_partner_kyc_partner_id ON partner_kyc_documents(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_kyc_verification_status ON partner_kyc_documents(verification_status);

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
ALTER TABLE partner_kyc_documents ENABLE ROW LEVEL SECURITY;
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
-- PARTNER KYC DOCUMENTS POLICIES
-- ============================================

-- Partners can view own documents
CREATE POLICY "partners_view_own_documents"
  ON partner_kyc_documents FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Partners can upload documents
CREATE POLICY "partners_upload_documents"
  ON partner_kyc_documents FOR INSERT
  WITH CHECK (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Partners can delete own unverified documents
CREATE POLICY "partners_delete_own_unverified_documents"
  ON partner_kyc_documents FOR DELETE
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
    AND verification_status = 'pending'
  );

-- Admins can view all documents
CREATE POLICY "admins_view_all_documents"
  ON partner_kyc_documents FOR SELECT
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

-- Admins can manage documents
CREATE POLICY "admins_manage_documents"
  ON partner_kyc_documents FOR ALL
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
COMMENT ON TABLE partner_kyc_documents IS 'KYC verification documents for partner onboarding (BRS 5.3.1)';
COMMENT ON TABLE partner_lead_activities IS 'Activity tracking for partner lead management (BRS 5.3.2)';

COMMENT ON COLUMN partners.status IS 'Partner approval status: pending, under_review, approved, rejected, suspended';
COMMENT ON COLUMN partners.kyc_status IS 'KYC verification status: incomplete, submitted, verified, rejected';
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
