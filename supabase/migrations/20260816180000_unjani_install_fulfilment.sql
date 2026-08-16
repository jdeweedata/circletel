-- CircleTel Unjani Connect kit warehouse + install orders.
-- Operator-maintained on-hand qty (not distributor Scoop/MiRO feeds).

CREATE TABLE IF NOT EXISTS public.warehouse_skus (
  sku text PRIMARY KEY,
  name text NOT NULL,
  description text,
  kit_role text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.warehouse_stock (
  sku text PRIMARY KEY REFERENCES public.warehouse_skus(sku) ON DELETE CASCADE,
  qty_on_hand integer NOT NULL DEFAULT 0 CHECK (qty_on_hand >= 0),
  qty_reserved integer NOT NULL DEFAULT 0 CHECK (qty_reserved >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.unjani_install_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL,
  coverage_check_id uuid REFERENCES public.b2b_coverage_checks(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  corporate_site_id uuid REFERENCES public.corporate_sites(id) ON DELETE SET NULL,
  field_job_id uuid REFERENCES public.field_jobs(id) ON DELETE SET NULL,
  technician_id uuid REFERENCES public.technicians(id) ON DELETE SET NULL,
  clinic_name text,
  address text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  contact_name text,
  contact_phone text,
  contact_email text,
  notes text,
  ordered_at timestamptz NOT NULL DEFAULT now(),
  fulfil_by_min date NOT NULL,
  fulfil_by_max date NOT NULL,
  visit_date date,
  stock_status text NOT NULL DEFAULT 'checking'
    CHECK (stock_status = ANY (ARRAY['checking'::text, 'reserved'::text, 'on_order'::text])),
  status text NOT NULL DEFAULT 'open'
    CHECK (status = ANY (ARRAY['open'::text, 'scheduled'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])),
  kit_issued_at timestamptz,
  survey_speedtest_path text,
  commission_speedtest_path text,
  survey_speedtest_uploaded_at timestamptz,
  commission_speedtest_uploaded_at timestamptz,
  job_card_path text,
  job_card_approved_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.warehouse_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL REFERENCES public.warehouse_skus(sku),
  movement_type text NOT NULL
    CHECK (movement_type = ANY (ARRAY['receive'::text, 'reserve'::text, 'issue'::text, 'release'::text])),
  qty integer NOT NULL CHECK (qty > 0),
  install_order_id uuid REFERENCES public.unjani_install_orders(id) ON DELETE SET NULL,
  replenishment_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE TABLE IF NOT EXISTS public.warehouse_replenishments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL REFERENCES public.warehouse_skus(sku),
  qty integer NOT NULL CHECK (qty > 0),
  ordered_at timestamptz NOT NULL DEFAULT now(),
  due_at date NOT NULL,
  received_at timestamptz,
  install_order_id uuid REFERENCES public.unjani_install_orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.warehouse_movements
  DROP CONSTRAINT IF EXISTS warehouse_movements_replenishment_id_fkey;
ALTER TABLE public.warehouse_movements
  ADD CONSTRAINT warehouse_movements_replenishment_id_fkey
  FOREIGN KEY (replenishment_id) REFERENCES public.warehouse_replenishments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_unjani_install_orders_org
  ON public.unjani_install_orders (organisation_id, ordered_at DESC);
CREATE INDEX IF NOT EXISTS idx_unjani_install_orders_coverage
  ON public.unjani_install_orders (coverage_check_id);
CREATE INDEX IF NOT EXISTS idx_unjani_install_orders_site
  ON public.unjani_install_orders (corporate_site_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_replenishments_open
  ON public.warehouse_replenishments (due_at)
  WHERE received_at IS NULL;

ALTER TABLE public.corporate_sites
  ADD COLUMN IF NOT EXISTS survey_speedtest_path text,
  ADD COLUMN IF NOT EXISTS commission_speedtest_path text;

COMMENT ON TABLE public.warehouse_skus IS
  'CircleTel-owned kit SKUs. Unjani Connect standard install: router + Wi-Fi AP.';
COMMENT ON TABLE public.unjani_install_orders IS
  'Operator install orders between coverage-confirmed and visit_booked. Fulfil window is 14–21 business days from ordered_at.';
COMMENT ON COLUMN public.warehouse_replenishments.due_at IS
  'Stock PO TAT: ordered_at plus 5 South African business days.';
COMMENT ON COLUMN public.corporate_sites.survey_speedtest_path IS
  'Before (survey) Ookla screenshot path in kyc-documents.';
COMMENT ON COLUMN public.corporate_sites.commission_speedtest_path IS
  'After (commissioning) Ookla screenshot path in kyc-documents.';

INSERT INTO public.warehouse_skus (sku, name, kit_role, description)
VALUES
  ('UNJ-KIT-ROUTER', 'Unjani Connect router', 'router', 'Standard Unjani Connect CPE from the helpdesk install guide'),
  ('UNJ-KIT-AP', 'Unjani Connect Wi-Fi access point', 'access_point', 'One AP per clinic install')
ON CONFLICT (sku) DO NOTHING;

INSERT INTO public.warehouse_stock (sku, qty_on_hand, qty_reserved)
VALUES
  ('UNJ-KIT-ROUTER', 5, 0),
  ('UNJ-KIT-AP', 5, 0)
ON CONFLICT (sku) DO NOTHING;

ALTER TABLE public.warehouse_skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_replenishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unjani_install_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin users can read warehouse skus" ON public.warehouse_skus;
CREATE POLICY "Admin users can read warehouse skus"
  ON public.warehouse_skus FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = (auth.jwt() ->> 'email')));

DROP POLICY IF EXISTS "Service role full access warehouse skus" ON public.warehouse_skus;
CREATE POLICY "Service role full access warehouse skus"
  ON public.warehouse_skus FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin users can read warehouse stock" ON public.warehouse_stock;
CREATE POLICY "Admin users can read warehouse stock"
  ON public.warehouse_stock FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = (auth.jwt() ->> 'email')));

DROP POLICY IF EXISTS "Service role full access warehouse stock" ON public.warehouse_stock;
CREATE POLICY "Service role full access warehouse stock"
  ON public.warehouse_stock FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin users can read warehouse movements" ON public.warehouse_movements;
CREATE POLICY "Admin users can read warehouse movements"
  ON public.warehouse_movements FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = (auth.jwt() ->> 'email')));

DROP POLICY IF EXISTS "Service role full access warehouse movements" ON public.warehouse_movements;
CREATE POLICY "Service role full access warehouse movements"
  ON public.warehouse_movements FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin users can read warehouse replenishments" ON public.warehouse_replenishments;
CREATE POLICY "Admin users can read warehouse replenishments"
  ON public.warehouse_replenishments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = (auth.jwt() ->> 'email')));

DROP POLICY IF EXISTS "Service role full access warehouse replenishments" ON public.warehouse_replenishments;
CREATE POLICY "Service role full access warehouse replenishments"
  ON public.warehouse_replenishments FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin users can read unjani install orders" ON public.unjani_install_orders;
CREATE POLICY "Admin users can read unjani install orders"
  ON public.unjani_install_orders FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.email = (auth.jwt() ->> 'email')));

DROP POLICY IF EXISTS "Service role full access unjani install orders" ON public.unjani_install_orders;
CREATE POLICY "Service role full access unjani install orders"
  ON public.unjani_install_orders FOR ALL TO service_role USING (true) WITH CHECK (true);
