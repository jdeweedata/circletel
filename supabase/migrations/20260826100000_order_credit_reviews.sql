-- Credit risk reviews for consumer orders (Netcash Risk Reports).
-- Additive. Service-role / admin writes; no anon policies.

CREATE TABLE IF NOT EXISTS public.order_credit_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_order_id uuid NOT NULL REFERENCES public.consumer_orders(id) ON DELETE CASCADE,
  decision text NOT NULL DEFAULT 'UNCHECKED'
    CHECK (decision IN ('UNCHECKED', 'HARD_FAIL', 'FAIL', 'MARGINAL', 'PASS')),
  bureau text,
  report_id text,
  transaction_id text,
  purpose text,
  requested_at timestamptz,
  flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  financed_router_allowed boolean NOT NULL DEFAULT false,
  term_24_month_allowed boolean NOT NULL DEFAULT false,
  hardware_prepaid boolean NOT NULL DEFAULT false,
  alternatives text[] NOT NULL DEFAULT ARRAY[]::text[],
  private_note text,
  pdf_storage_path text,
  override_reason text,
  override_by uuid,
  reviewed_by uuid,
  updated_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (consumer_order_id)
);

CREATE INDEX IF NOT EXISTS idx_order_credit_reviews_decision
  ON public.order_credit_reviews (decision);

CREATE INDEX IF NOT EXISTS idx_order_credit_reviews_needs_review
  ON public.order_credit_reviews (consumer_order_id)
  WHERE decision = 'UNCHECKED';

COMMENT ON TABLE public.order_credit_reviews IS
  'Netcash / CircleTel credit decision per consumer order. HARD_FAIL and FAIL block financed router unless hardware_prepaid.';

ALTER TABLE public.order_credit_reviews ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.order_credit_reviews FROM anon, authenticated;
GRANT ALL ON public.order_credit_reviews TO service_role;
