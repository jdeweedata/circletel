-- Hybrid Zoho Inventory sync: map SKUs, persist outbound adjustment ids,
-- and record inbound/outbound movement events. Additive only.

ALTER TABLE public.warehouse_skus
  ADD COLUMN IF NOT EXISTS zoho_item_id text;

ALTER TABLE public.warehouse_movements
  ADD COLUMN IF NOT EXISTS zoho_adjustment_id text;

ALTER TABLE public.warehouse_stock
  ADD COLUMN IF NOT EXISTS zoho_over_reserved_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS warehouse_skus_zoho_item_id_uidx
  ON public.warehouse_skus (zoho_item_id)
  WHERE zoho_item_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS warehouse_movements_zoho_adjustment_id_uidx
  ON public.warehouse_movements (zoho_adjustment_id)
  WHERE zoho_adjustment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.warehouse_zoho_sync_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL CHECK (direction = ANY (ARRAY['outbound'::text, 'inbound'::text])),
  sku text,
  qty numeric,
  zoho_id text,
  movement_id uuid REFERENCES public.warehouse_movements(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (
    status = ANY (ARRAY['success'::text, 'skipped'::text, 'failed'::text, 'exception'::text])
  ),
  error text,
  actor text NOT NULL DEFAULT 'warehouse-zoho-sync',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS warehouse_zoho_sync_events_created_idx
  ON public.warehouse_zoho_sync_events (created_at DESC);

CREATE INDEX IF NOT EXISTS warehouse_zoho_sync_events_sku_idx
  ON public.warehouse_zoho_sync_events (sku, created_at DESC);

ALTER TABLE public.warehouse_zoho_sync_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin users can read warehouse zoho sync events"
  ON public.warehouse_zoho_sync_events;
CREATE POLICY "Admin users can read warehouse zoho sync events"
  ON public.warehouse_zoho_sync_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = (auth.jwt() ->> 'email')));

DROP POLICY IF EXISTS "Service role full access warehouse zoho sync events"
  ON public.warehouse_zoho_sync_events;
CREATE POLICY "Service role full access warehouse zoho sync events"
  ON public.warehouse_zoho_sync_events FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON COLUMN public.warehouse_skus.zoho_item_id IS
  'Zoho Inventory item_id for hybrid stock-event sync. Unmapped SKUs are not pushed or pulled.';
COMMENT ON COLUMN public.warehouse_movements.zoho_adjustment_id IS
  'Idempotency key for outbound inventory adjustments (reference CT-WH-{movement.id}).';
COMMENT ON COLUMN public.warehouse_stock.zoho_over_reserved_at IS
  'Set when a Zoho inbound event would make qty_reserved exceed qty_on_hand. Reservations are not cleared.';
COMMENT ON TABLE public.warehouse_zoho_sync_events IS
  'Audit of Zoho Inventory hybrid events. qty_reserved is never written from Zoho.';
