-- Coverage leads: assignment + first-response SLA columns for follow-up queue (F1).
-- Apply manually to shared DB (no CI migration runner).

ALTER TABLE public.coverage_leads
  ADD COLUMN IF NOT EXISTS assigned_admin_id uuid REFERENCES public.admin_users(id),
  ADD COLUMN IF NOT EXISTS first_response_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS first_responded_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_coverage_leads_followup_queue
  ON public.coverage_leads (status, first_response_due_at, created_at DESC);
