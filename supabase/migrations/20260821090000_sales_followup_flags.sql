-- Sales follow-up flags
--
-- Tracks which registered customers have already been flagged to the Sales desk,
-- so the backfill script and the daily Inngest job never double-ticket the same
-- person. One row per (customer, reason).
--
-- Context: between 13–20 Aug 2026, six customers registered accounts and then did
-- nothing — no order, no service, no onboarding submission — and nobody contacted
-- them. See docs + lib/sales/new-signup-followup.ts.

CREATE TABLE IF NOT EXISTS public.sales_followup_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  reason text NOT NULL DEFAULT 'registered_no_order',
  desk_ticket_id text,
  desk_ticket_number text,
  sales_alerted_at timestamptz,
  journey_snapshot jsonb,
  flagged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sales_followup_flags_customer_reason_key UNIQUE (customer_id, reason)
);

CREATE INDEX IF NOT EXISTS idx_sales_followup_flags_flagged_at
  ON public.sales_followup_flags (flagged_at DESC);

CREATE INDEX IF NOT EXISTS idx_sales_followup_flags_customer
  ON public.sales_followup_flags (customer_id);

-- Service-role only: written by the backfill script and the Inngest job, both of
-- which use the service-role client. No anon/authenticated policies by design.
ALTER TABLE public.sales_followup_flags ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.sales_followup_flags IS
  'Registered customers already flagged to the Sales desk for follow-up. Idempotency guard for scripts/flag-new-signups-to-sales.ts and the new-signup-followup Inngest job.';
COMMENT ON COLUMN public.sales_followup_flags.reason IS
  'Why they were flagged. Currently only registered_no_order.';
COMMENT ON COLUMN public.sales_followup_flags.sales_alerted_at IS
  'When the Sales team was notified about this flag (digest email to SALES_TEAM_EMAIL).';
COMMENT ON COLUMN public.sales_followup_flags.journey_snapshot IS
  'The SignupJourney at flag time, for auditing what Sales was told.';
