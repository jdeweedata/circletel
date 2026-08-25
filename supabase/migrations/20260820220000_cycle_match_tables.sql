-- Cycle-match reconciliation (service × month).
-- billing_cycles already exists as contract recurring schedules — do not reuse it.
-- Service-role only (no anon/authenticated policies).

CREATE TABLE IF NOT EXISTS public.cycle_match_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_month date NOT NULL,
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'ready', 'failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  services_checked integer NOT NULL DEFAULT 0,
  triggered_by text NOT NULL DEFAULT 'cron'
    CHECK (triggered_by IN ('cron', 'manual')),
  triggered_by_user_id uuid,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cycle_match_runs_period
  ON public.cycle_match_runs (period_month DESC, started_at DESC);

CREATE TABLE IF NOT EXISTS public.billing_cycle_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.cycle_match_runs(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.customer_services(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  platform_amount_ex_vat numeric(12,2),
  platform_amount_incl_vat numeric(12,2),
  zoho_amount_ex_vat numeric(12,2),
  zoho_amount_incl_vat numeric(12,2),
  netcash_amount numeric(12,2),
  platform_record_id text,
  zoho_invoice_id uuid REFERENCES public.customer_invoices(id) ON DELETE SET NULL,
  zoho_invoice_number text,
  zoho_books_invoice_id text,
  netcash_ref text,
  match_state text NOT NULL
    CHECK (match_state IN ('matched_3', 'matched_2', 'unmatched', 'resolved')),
  pairwise jsonb NOT NULL DEFAULT '{}'::jsonb,
  variance numeric(12,2) NOT NULL DEFAULT 0,
  leak_type text
    CHECK (leak_type IN (
      'never_invoiced',
      'under_contract',
      'promo_expired',
      'cancelled_still_billing'
    )),
  exposure numeric(12,2) NOT NULL DEFAULT 0,
  recommended_action text,
  diagnosis text,
  pattern_key text,
  field_diff jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_cycle_matches_run
  ON public.billing_cycle_matches (run_id);
CREATE INDEX IF NOT EXISTS idx_billing_cycle_matches_state
  ON public.billing_cycle_matches (run_id, match_state);
CREATE INDEX IF NOT EXISTS idx_billing_cycle_matches_leak
  ON public.billing_cycle_matches (run_id, leak_type);

CREATE SEQUENCE IF NOT EXISTS public.billing_cycle_exception_seq START WITH 2400;

CREATE TABLE IF NOT EXISTS public.billing_cycle_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_code text NOT NULL UNIQUE,
  run_id uuid NOT NULL REFERENCES public.cycle_match_runs(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES public.billing_cycle_matches(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.customer_services(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  kind text NOT NULL,
  leak_type text,
  pattern_key text,
  diagnosis text NOT NULL,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'resolved', 'accepted')),
  variance numeric(12,2) NOT NULL DEFAULT 0,
  recoverable numeric(12,2) NOT NULL DEFAULT 0,
  cycles_affected integer NOT NULL DEFAULT 1,
  field_diff jsonb NOT NULL DEFAULT '[]'::jsonb,
  audit_events jsonb NOT NULL DEFAULT '[]'::jsonb,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_cycle_exceptions_run
  ON public.billing_cycle_exceptions (run_id, status);
CREATE INDEX IF NOT EXISTS idx_billing_cycle_exceptions_pattern
  ON public.billing_cycle_exceptions (pattern_key)
  WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_billing_cycle_exceptions_code
  ON public.billing_cycle_exceptions (display_code);

ALTER TABLE public.cycle_match_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_cycle_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_cycle_exceptions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.cycle_match_runs IS
  'Monthly three-way match runs (platform / Zoho / Netcash). Distinct from billing_cycles (contract schedules).';
