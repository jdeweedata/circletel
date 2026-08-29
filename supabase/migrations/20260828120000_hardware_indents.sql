-- Cash CPE indent queue. Created only after NetCash checkout payment succeeds.

CREATE TABLE IF NOT EXISTS public.hardware_indents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_order_id UUID NOT NULL REFERENCES public.consumer_orders(id) ON DELETE CASCADE,
  hardware_product_id UUID REFERENCES public.circletel_hardware_products(id) ON DELETE SET NULL,
  supplier_sku TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'ordered', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (consumer_order_id)
);

CREATE INDEX IF NOT EXISTS idx_hardware_indents_status
  ON public.hardware_indents (status);

CREATE INDEX IF NOT EXISTS idx_hardware_indents_sku
  ON public.hardware_indents (supplier_sku);

COMMENT ON TABLE public.hardware_indents IS
  'Esquire indent rows created after paid cash-CPE checkout. Unpaid checkout creates none.';

ALTER TABLE public.hardware_indents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access hardware indents"
  ON public.hardware_indents
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
