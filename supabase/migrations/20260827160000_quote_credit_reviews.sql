-- Credit risk reviews for business quotes (Netcash CD32 / CD31).
-- Additive. Service-role writes; no anon policies.

CREATE TABLE IF NOT EXISTS public.quote_credit_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_quote_id uuid NOT NULL REFERENCES public.business_quotes(id) ON DELETE CASCADE,
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
  override_signoffs jsonb,
  reviewed_by uuid,
  updated_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_quote_id)
);

CREATE INDEX IF NOT EXISTS idx_quote_credit_reviews_decision
  ON public.quote_credit_reviews (decision);

COMMENT ON TABLE public.quote_credit_reviews IS
  'Netcash / CircleTel company credit decision per business quote. Same decision enum as order_credit_reviews.';

ALTER TABLE public.quote_credit_reviews ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.quote_credit_reviews FROM anon, authenticated;
GRANT ALL ON public.quote_credit_reviews TO service_role;
