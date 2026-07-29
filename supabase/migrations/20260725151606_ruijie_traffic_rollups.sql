-- Network performance: persist Ruijie traffic rollups for Health + Analytics dashboards
-- Written by Inngest after ruijie/sync.completed; read by admin APIs (service role / admin RLS)

CREATE TABLE IF NOT EXISTS public.ruijie_traffic_rollups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id text NOT NULL,
  group_name text,
  captured_at timestamptz NOT NULL DEFAULT now(),
  hours_window integer NOT NULL DEFAULT 1,
  total_rx_bytes bigint NOT NULL DEFAULT 0,
  total_tx_bytes bigint NOT NULL DEFAULT 0,
  avg_rx_bps double precision NOT NULL DEFAULT 0,
  avg_tx_bps double precision NOT NULL DEFAULT 0,
  peak_rx_bps double precision NOT NULL DEFAULT 0,
  peak_tx_bps double precision NOT NULL DEFAULT 0,
  raw_summary jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ruijie_traffic_rollups IS
  'Hourly Ruijie network traffic aggregates per group, for System Health / Analytics dashboards';

ALTER TABLE public.ruijie_traffic_rollups
  ADD CONSTRAINT ruijie_traffic_rollups_group_captured_window_key
  UNIQUE (group_id, captured_at, hours_window);

CREATE INDEX IF NOT EXISTS idx_ruijie_traffic_rollups_group_time
  ON public.ruijie_traffic_rollups (group_id, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_ruijie_traffic_rollups_time
  ON public.ruijie_traffic_rollups (captured_at DESC);

ALTER TABLE public.ruijie_traffic_rollups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can read traffic rollups"
  ON public.ruijie_traffic_rollups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE admin_users.email = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Service role full access traffic rollups"
  ON public.ruijie_traffic_rollups
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
