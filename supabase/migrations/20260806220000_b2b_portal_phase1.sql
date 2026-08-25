-- B2B Portal Phase 1: one Super User (admin) per org + coverage check history

-- At most one Super User (role = admin) per organisation
CREATE UNIQUE INDEX IF NOT EXISTS idx_b2b_portal_users_one_admin_per_org
  ON public.b2b_portal_users (organisation_id)
  WHERE role = 'admin';

COMMENT ON INDEX public.idx_b2b_portal_users_one_admin_per_org IS
  'Enforces max one Super User (admin) per corporate organisation';

-- Coverage check audit trail for portal (and future B2B tenants)
CREATE TABLE IF NOT EXISTS public.b2b_coverage_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.corporate_accounts(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.b2b_portal_users(id) ON DELETE CASCADE,
  clinic_name text,
  address text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  results jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_b2b_coverage_checks_org
  ON public.b2b_coverage_checks (organisation_id, created_at DESC);

COMMENT ON TABLE public.b2b_coverage_checks IS
  'Portal coverage/feasibility checks (Tarana/FWB + LTE/5G) for B2B onboarding';

ALTER TABLE public.b2b_coverage_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on b2b_coverage_checks"
  ON public.b2b_coverage_checks FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Portal users can read own org coverage checks"
  ON public.b2b_coverage_checks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.b2b_portal_users pu
      WHERE pu.auth_user_id = auth.uid()
        AND pu.organisation_id = b2b_coverage_checks.organisation_id
    )
  );

CREATE POLICY "Portal admins can insert coverage checks"
  ON public.b2b_coverage_checks FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.b2b_portal_users pu
      WHERE pu.auth_user_id = auth.uid()
        AND pu.organisation_id = b2b_coverage_checks.organisation_id
        AND pu.role = 'admin'
        AND pu.id = b2b_coverage_checks.created_by
    )
  );

-- Note: Super Users list teammates via service-role portal team APIs
-- (avoid recursive RLS on b2b_portal_users).
