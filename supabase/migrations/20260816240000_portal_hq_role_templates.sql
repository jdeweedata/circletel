-- HQ role templates for the customer portal Team page.
-- Super User stays role = admin (one customer seat). Clinic site_user stays legacy-only.

ALTER TABLE public.b2b_portal_users
  DROP CONSTRAINT IF EXISTS b2b_portal_users_role_check;

ALTER TABLE public.b2b_portal_users
  ADD CONSTRAINT b2b_portal_users_role_check
  CHECK (role = ANY (ARRAY[
    'admin'::text,
    'site_user'::text,
    'finance'::text,
    'operations'::text,
    'viewer'::text
  ]));

ALTER TABLE public.b2b_portal_users
  DROP CONSTRAINT IF EXISTS site_user_requires_site;

ALTER TABLE public.b2b_portal_users
  ADD CONSTRAINT site_user_requires_site
  CHECK (role <> 'site_user' OR site_id IS NOT NULL);

ALTER TABLE public.b2b_portal_users
  DROP CONSTRAINT IF EXISTS hq_roles_have_no_site;

ALTER TABLE public.b2b_portal_users
  ADD CONSTRAINT hq_roles_have_no_site
  CHECK (role <> ALL (ARRAY['finance'::text, 'operations'::text, 'viewer'::text]) OR site_id IS NULL);

COMMENT ON COLUMN public.b2b_portal_users.role IS
  'admin = Super User (one customer seat); finance/operations/viewer = HQ templates; site_user = legacy clinic login';

COMMENT ON CONSTRAINT site_user_requires_site ON public.b2b_portal_users IS
  'Legacy site_user role must have an assigned site';

COMMENT ON CONSTRAINT hq_roles_have_no_site ON public.b2b_portal_users IS
  'HQ templates are organisation-wide and must not be tied to a clinic site';
