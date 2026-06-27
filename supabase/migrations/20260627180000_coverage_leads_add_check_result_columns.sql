-- Add coverage-check result columns to coverage_leads.
--
-- Several routes have long written to / read from these columns, but they were
-- never created — so the writes failed silently (PostgREST ignored unknown keys)
-- and the reads returned null. Affected code:
--   * app/api/coverage/packages/route.ts        (writes coverage_available, available_services, checked_at)
--   * app/api/coverage/lead-capture/route.ts     (writes coverage_available)
--   * app/api/admin/marketing/coverage-demand    (reads  coverage_available)
--   * app/api/coverage/check-async/route.ts      (reads  checked_at)
--
-- Adding the columns makes those existing reads/writes work as intended.

ALTER TABLE public.coverage_leads
  ADD COLUMN IF NOT EXISTS coverage_available boolean,
  ADD COLUMN IF NOT EXISTS available_services jsonb,
  ADD COLUMN IF NOT EXISTS checked_at timestamptz;

COMMENT ON COLUMN public.coverage_leads.coverage_available IS 'Whether any service coverage was found at the lead address on the last check.';
COMMENT ON COLUMN public.coverage_leads.available_services IS 'Array of technical service types found on the last coverage check (e.g. ["5g","lte"]).';
COMMENT ON COLUMN public.coverage_leads.checked_at IS 'Timestamp of the last coverage check for this lead.';

-- Index for the marketing coverage-demand dashboard, which filters on coverage_available.
CREATE INDEX IF NOT EXISTS idx_coverage_leads_coverage_available
  ON public.coverage_leads (coverage_available);
