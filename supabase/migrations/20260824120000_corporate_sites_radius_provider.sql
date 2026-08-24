-- Per-site subscriber provisioning provider switch.

ALTER TABLE public.corporate_sites
  ADD COLUMN IF NOT EXISTS radius_provider text NOT NULL DEFAULT 'interstellio'
  CHECK (radius_provider IN ('interstellio', 'radius'));

COMMENT ON COLUMN public.corporate_sites.radius_provider IS
  'Subscriber provisioning provider: interstellio or radius.';
