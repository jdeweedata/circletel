-- Link portal support tickets to Zoho Desk so /unjani/support can show live status.

ALTER TABLE public.b2b_support_tickets
  ADD COLUMN IF NOT EXISTS zoho_ticket_id text,
  ADD COLUMN IF NOT EXISTS zoho_ticket_number text,
  ADD COLUMN IF NOT EXISTS desk_status_synced_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_b2b_support_tickets_zoho_ticket_id
  ON public.b2b_support_tickets (zoho_ticket_id)
  WHERE zoho_ticket_id IS NOT NULL;

COMMENT ON COLUMN public.b2b_support_tickets.zoho_ticket_id IS
  'Zoho Desk ticket id created from the B2B / Unjani portal';
COMMENT ON COLUMN public.b2b_support_tickets.zoho_ticket_number IS
  'Zoho Desk ticket number shown to portal users';
