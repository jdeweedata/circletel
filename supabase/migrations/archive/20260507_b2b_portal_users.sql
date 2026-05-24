-- Migration: B2B Portal Users & RLS Foundation
-- Purpose: Create portal user mapping table and RLS policies for the B2B customer portal.
-- b2b_portal_users maps Supabase auth users to corporate accounts/sites with role-based access.

-- ============================================================================
-- PHASE 1: b2b_portal_users table
-- ============================================================================

CREATE TABLE b2b_portal_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  site_id UUID REFERENCES corporate_sites(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'site_user')),
  display_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT unique_user_per_org UNIQUE (auth_user_id, organisation_id),
  CONSTRAINT site_user_requires_site CHECK (role != 'site_user' OR site_id IS NOT NULL)
);

CREATE INDEX idx_b2b_portal_users_auth ON b2b_portal_users(auth_user_id);
CREATE INDEX idx_b2b_portal_users_org ON b2b_portal_users(organisation_id);

COMMENT ON TABLE b2b_portal_users IS 'Maps Supabase auth users to corporate accounts for B2B portal access';
COMMENT ON COLUMN b2b_portal_users.role IS 'admin = head office (sees all sites), site_user = single site (nurse)';
COMMENT ON CONSTRAINT site_user_requires_site ON b2b_portal_users IS 'site_user role must have an assigned site';

CREATE TRIGGER update_b2b_portal_users_updated_at
  BEFORE UPDATE ON b2b_portal_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE b2b_portal_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on b2b_portal_users"
  ON b2b_portal_users FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Portal users can read own row"
  ON b2b_portal_users FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- ============================================================================
-- PHASE 2: Add corporate_account_id to customer_invoices for B2B billing
-- ============================================================================

ALTER TABLE customer_invoices
  ADD COLUMN IF NOT EXISTS corporate_account_id UUID REFERENCES corporate_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customer_invoices_corporate
  ON customer_invoices(corporate_account_id)
  WHERE corporate_account_id IS NOT NULL;

COMMENT ON COLUMN customer_invoices.corporate_account_id IS 'Links invoice to corporate account for B2B portal billing visibility';

-- ============================================================================
-- PHASE 3: RLS policies for portal access on existing tables
-- ============================================================================

-- 3a. corporate_sites: portal users see their org's sites (admin=all, site_user=own site)
CREATE POLICY "Portal users can view org sites"
  ON corporate_sites FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM b2b_portal_users pu
      WHERE pu.auth_user_id = auth.uid()
      AND pu.organisation_id = corporate_sites.corporate_id
      AND (pu.role = 'admin' OR pu.site_id = corporate_sites.id)
    )
  );

-- 3b. corporate_accounts: portal users see their own organisation
CREATE POLICY "Portal users can view own organisation"
  ON corporate_accounts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM b2b_portal_users pu
      WHERE pu.auth_user_id = auth.uid()
      AND pu.organisation_id = corporate_accounts.id
    )
  );

-- 3c. device_health_snapshots: portal users see snapshots for their org's devices
CREATE POLICY "Portal users can view org device health"
  ON device_health_snapshots FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM b2b_portal_users pu
      JOIN corporate_sites cs ON cs.corporate_id = pu.organisation_id
      WHERE pu.auth_user_id = auth.uid()
      AND cs.ruijie_device_sn = device_health_snapshots.device_sn
      AND (pu.role = 'admin' OR pu.site_id = cs.id)
    )
  );

-- 3d. customer_invoices: portal users see invoices linked to their corporate account
CREATE POLICY "Portal users can view org invoices"
  ON customer_invoices FOR SELECT TO authenticated
  USING (
    corporate_account_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM b2b_portal_users pu
      WHERE pu.auth_user_id = auth.uid()
      AND pu.organisation_id = customer_invoices.corporate_account_id
    )
  );

-- 3e. network_health_alerts: portal users see alerts for their org's devices
CREATE POLICY "Portal users can view org alerts"
  ON network_health_alerts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM b2b_portal_users pu
      JOIN corporate_sites cs ON cs.corporate_id = pu.organisation_id
      WHERE pu.auth_user_id = auth.uid()
      AND cs.ruijie_device_sn = network_health_alerts.device_sn
      AND (pu.role = 'admin' OR pu.site_id = cs.id)
    )
  );
