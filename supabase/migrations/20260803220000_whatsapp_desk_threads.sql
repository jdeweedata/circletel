-- WhatsApp ↔ Zoho Desk support bridge thread mapping
-- Maps inbound WhatsApp senders to open Desk tickets for two-way sync.

CREATE TABLE IF NOT EXISTS public.whatsapp_desk_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wa_from text NOT NULL,
  desk_ticket_id text NOT NULL,
  desk_ticket_number text,
  contact_name text,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed')),
  last_inbound_wa_message_id text,
  last_synced_comment_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_desk_threads_wa_from_open_uidx
  ON public.whatsapp_desk_threads (wa_from)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS whatsapp_desk_threads_status_idx
  ON public.whatsapp_desk_threads (status);

CREATE INDEX IF NOT EXISTS whatsapp_desk_threads_desk_ticket_id_idx
  ON public.whatsapp_desk_threads (desk_ticket_id);

COMMENT ON TABLE public.whatsapp_desk_threads IS
  'Maps WhatsApp Cloud API senders to Zoho Desk tickets for support bridge (inbound + comment sync outbound).';

ALTER TABLE public.whatsapp_desk_threads ENABLE ROW LEVEL SECURITY;

-- Service-role / backend only — no anon/authenticated policies (intentional).
