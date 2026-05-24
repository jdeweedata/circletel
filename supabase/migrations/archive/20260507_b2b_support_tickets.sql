-- Migration: B2B Support Tickets
-- Purpose: Table for portal support ticket submissions with RLS scoped by organisation.

CREATE TABLE b2b_support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  site_id UUID REFERENCES corporate_sites(id) ON DELETE SET NULL,
  submitted_by UUID NOT NULL REFERENCES b2b_portal_users(id) ON DELETE CASCADE,
  subject VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_b2b_support_tickets_org ON b2b_support_tickets(organisation_id);
CREATE INDEX idx_b2b_support_tickets_submitted_by ON b2b_support_tickets(submitted_by);

ALTER TABLE b2b_support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on b2b_support_tickets"
  ON b2b_support_tickets FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Portal users can view org tickets"
  ON b2b_support_tickets FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM b2b_portal_users pu
      WHERE pu.auth_user_id = auth.uid()
      AND pu.organisation_id = b2b_support_tickets.organisation_id
    )
  );

CREATE POLICY "Portal users can insert tickets for their org"
  ON b2b_support_tickets FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM b2b_portal_users pu
      WHERE pu.auth_user_id = auth.uid()
      AND pu.organisation_id = b2b_support_tickets.organisation_id
      AND pu.id = b2b_support_tickets.submitted_by
    )
  );
