-- supabase/migrations/20260628000000_create_offer_spine.sql
-- Offer spine: canonical sellable unit above existing source tables.

CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  media jsonb DEFAULT '{}'::jsonb,
  customer_type text NOT NULL DEFAULT 'both'
    CHECK (customer_type IN ('consumer','business','both')),
  lifecycle_state text NOT NULL DEFAULT 'active'
    CHECK (lifecycle_state IN ('idea','draft','priced','approved','active','archived')),
  channel_visibility jsonb NOT NULL DEFAULT '["direct"]'::jsonb,
  base_price numeric(10,2) NOT NULL DEFAULT 0,
  source_uid text,                 -- UnifiedProduct.uid provenance
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','inactive','archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS offers_source_uid_key
  ON public.offers (source_uid) WHERE source_uid IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.offer_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  source_type text NOT NULL
    CHECK (source_type IN ('service_package','hardware','mtn_deal','supplier_product','labour','recurring')),
  source_id text NOT NULL,
  qty integer NOT NULL DEFAULT 1,
  role text NOT NULL DEFAULT 'primary'
    CHECK (role IN ('primary','addon','required')),
  unit_cost numeric(10,2) NOT NULL DEFAULT 0,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  label text NOT NULL,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS offer_components_offer_id_idx
  ON public.offer_components (offer_id);

CREATE TABLE IF NOT EXISTS public.offer_pricing_snapshot (
  offer_id uuid PRIMARY KEY REFERENCES public.offers(id) ON DELETE CASCADE,
  resolved_price numeric(10,2) NOT NULL,
  cost_buildup jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_cost numeric(10,2) NOT NULL DEFAULT 0,
  margin_pct integer NOT NULL DEFAULT 0,
  guardrail_status text NOT NULL DEFAULT 'pass'
    CHECK (guardrail_status IN ('pass','warning','fail')),
  computed_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: service role only (admin/server writes); no anon access in Phase 0.
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_pricing_snapshot ENABLE ROW LEVEL SECURITY;
