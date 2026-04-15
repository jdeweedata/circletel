-- Per-ticket snapshots for WhatsApp campaign leads
-- One row per Zoho Desk ticket tagged 'whatsapp-lead'

CREATE TABLE IF NOT EXISTS campaign_ticket_snapshots (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id           text UNIQUE NOT NULL,
  ticket_number       text,
  subject             text,
  status              text,
  assigned_agent      text,
  contact_name        text,
  contact_phone       text,
  contact_email       text,
  lead_name           text,
  lead_email          text,
  lead_phone          text,
  lead_address        text,
  insight_status      text NOT NULL DEFAULT 'awaiting_agent',
  insight_updated_at  timestamptz,
  is_signed_up        boolean NOT NULL DEFAULT false,
  order_id            text,
  zoho_created_at     timestamptz,
  first_response_at   timestamptz,
  closed_at           timestamptz,
  last_synced_at      timestamptz NOT NULL DEFAULT now(),
  conversations       jsonb NOT NULL DEFAULT '[]',
  conversation_count  int NOT NULL DEFAULT 0,
  tags                text[] NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_campaign_tickets_insight
  ON campaign_ticket_snapshots(insight_status);

CREATE INDEX IF NOT EXISTS idx_campaign_tickets_agent
  ON campaign_ticket_snapshots(assigned_agent);

CREATE INDEX IF NOT EXISTS idx_campaign_tickets_signed_up
  ON campaign_ticket_snapshots(is_signed_up);

CREATE INDEX IF NOT EXISTS idx_campaign_tickets_created
  ON campaign_ticket_snapshots(zoho_created_at DESC);
