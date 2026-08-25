-- Site usage report generation jobs and long-lived audit metadata.
CREATE TABLE IF NOT EXISTS public.site_usage_report_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
  period_preset text NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  site_ids uuid[] NOT NULL,
  include_provisioned boolean NOT NULL DEFAULT false,
  unjani_only boolean NOT NULL DEFAULT false,
  include_csv boolean NOT NULL DEFAULT false,
  patient_csv_path text,
  primary_sources jsonb NOT NULL DEFAULT '{}'::jsonb,
  outcome jsonb,
  error_message text,
  storage_path text,
  content_type text,
  byte_size bigint,
  expires_at timestamptz DEFAULT (now() + interval '14 days'),
  inngest_run_id text
);

CREATE INDEX IF NOT EXISTS idx_site_usage_report_jobs_created
  ON public.site_usage_report_jobs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_site_usage_report_jobs_expires
  ON public.site_usage_report_jobs (expires_at)
  WHERE expires_at IS NOT NULL AND storage_path IS NOT NULL;

ALTER TABLE public.site_usage_report_jobs ENABLE ROW LEVEL SECURITY;
-- Service-role only: intentionally no anon or authenticated policies.

-- Private artifact bucket. Service-role operations bypass storage object RLS;
-- intentionally no anon or authenticated storage policies are created.
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-usage-reports', 'site-usage-reports', false)
ON CONFLICT (id) DO NOTHING;
