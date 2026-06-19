-- Registry of Service Order T&C versions (append-only).
-- content_hash = sha256(JSON.stringify([title, ...terms, msa_reference])) — matches the app's
-- acceptance hashing in app/api/onboarding/submit/route.ts. Mirrors lib/onboarding/service-order-terms.ts.
-- Seeded (both versions) via scripts; rows: 2026-06-11 (superseded) and 2026-06-19 (current).

CREATE TABLE IF NOT EXISTS public.service_order_terms_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,
  title text NOT NULL,
  terms jsonb NOT NULL,
  msa_reference text NOT NULL,
  content_hash text NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  superseded_on date,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.service_order_terms_versions IS 'Registry of Service Order T&C versions (append-only). content_hash = sha256(JSON.stringify([title, ...terms, msa_reference])) matching app acceptance hashing. Mirrors lib/onboarding/service-order-terms.ts.';

-- Only one row may be current at a time.
CREATE UNIQUE INDEX IF NOT EXISTS service_order_terms_versions_one_current
  ON public.service_order_terms_versions ((is_current)) WHERE is_current;

ALTER TABLE public.service_order_terms_versions ENABLE ROW LEVEL SECURITY;
