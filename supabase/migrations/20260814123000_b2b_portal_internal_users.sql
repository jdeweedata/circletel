-- Hidden CircleTel support / operator portal accounts.
-- Customer Team list excludes is_internal; login still uses the same row.
-- Super User uniqueness is customer-only so support does not occupy the seat.

ALTER TABLE public.b2b_portal_users
  ADD COLUMN IF NOT EXISTS is_internal boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.b2b_portal_users.is_internal IS
  'CircleTel support/operator account: hidden from customer Team page; does not occupy the one customer Super User slot';

UPDATE public.b2b_portal_users
SET is_internal = true
WHERE email ILIKE '%@circletel.co.za'
  AND is_internal = false;

DROP INDEX IF EXISTS public.idx_b2b_portal_users_one_admin_per_org;

CREATE UNIQUE INDEX IF NOT EXISTS idx_b2b_portal_users_one_customer_admin_per_org
  ON public.b2b_portal_users (organisation_id)
  WHERE role = 'admin' AND is_internal = false;

COMMENT ON INDEX public.idx_b2b_portal_users_one_customer_admin_per_org IS
  'Enforces max one customer Super User (admin) per organisation; internal support admins are excluded';
