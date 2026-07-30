-- WhatsApp Flow sessions: store Meta Flow token state + link to coverage_leads (F1).
-- Apply manually to shared DB (no CI migration runner).
-- NOTE: ALTER TYPE ... ADD VALUE cannot run inside a transaction block on some PG versions.

ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'whatsapp_flow';

CREATE TABLE public.whatsapp_flow_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_token text NOT NULL UNIQUE,
  flow_id text NOT NULL,
  flow_name text NOT NULL,
  phone text NOT NULL,
  entry_source text NOT NULL,
  source_campaign text,
  status text NOT NULL DEFAULT 'sent',
  response_payload jsonb,
  raw_webhook jsonb,
  coverage_lead_id uuid REFERENCES public.coverage_leads(id),
  whatsapp_message_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.whatsapp_flow_sessions ENABLE ROW LEVEL SECURITY;
-- service role only (no anon policies)
