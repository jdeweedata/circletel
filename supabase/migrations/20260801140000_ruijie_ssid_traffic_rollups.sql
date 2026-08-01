-- SSID STA session-byte hour rollups for Unjani Site Network Usage Reports (Staff).
-- Wayfinder #672 / #675 / #678. Written by a dedicated 5-min sampler (#679); not group flow.
-- Do NOT extend ruijie_traffic_rollups — different grain, source, and retention (90d).

CREATE TABLE IF NOT EXISTS public.ruijie_ssid_traffic_rollups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_sn text NOT NULL,
  ssid text NOT NULL,
  hour_bucket timestamptz NOT NULL,
  hours_window integer NOT NULL DEFAULT 1,
  corporate_site_id uuid REFERENCES public.corporate_sites(id) ON DELETE SET NULL,
  rx_bytes bigint NOT NULL DEFAULT 0,
  tx_bytes bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ruijie_ssid_traffic_rollups_hours_window_chk CHECK (hours_window = 1),
  CONSTRAINT ruijie_ssid_traffic_rollups_sn_ssid_hour_key
    UNIQUE (device_sn, ssid, hour_bucket)
);

COMMENT ON TABLE public.ruijie_ssid_traffic_rollups IS
  'Hourly STA session-byte deltas per AP SN + allow-listed SSID. Forward-only sampled telemetry for Usage Reports Staff period GB (90d retention).';

COMMENT ON COLUMN public.ruijie_ssid_traffic_rollups.hour_bucket IS
  'UTC hour start (timestamptz). Sampler sums 5-min positive deltas into this bucket.';

COMMENT ON COLUMN public.ruijie_ssid_traffic_rollups.corporate_site_id IS
  'Denormalized site link at write time from network_devices / ruijie_device_cache; null if unlinked.';

COMMENT ON COLUMN public.ruijie_ssid_traffic_rollups.rx_bytes IS
  'Summed positive wifiDown deltas for the hour (client download).';

COMMENT ON COLUMN public.ruijie_ssid_traffic_rollups.tx_bytes IS
  'Summed positive wifiUp deltas for the hour (client upload).';

CREATE INDEX IF NOT EXISTS idx_ruijie_ssid_rollups_site_ssid_hour
  ON public.ruijie_ssid_traffic_rollups (corporate_site_id, ssid, hour_bucket DESC)
  WHERE corporate_site_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ruijie_ssid_rollups_sn_hour
  ON public.ruijie_ssid_traffic_rollups (device_sn, hour_bucket DESC);

CREATE INDEX IF NOT EXISTS idx_ruijie_ssid_rollups_hour
  ON public.ruijie_ssid_traffic_rollups (hour_bucket DESC);

ALTER TABLE public.ruijie_ssid_traffic_rollups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can read ssid traffic rollups"
  ON public.ruijie_ssid_traffic_rollups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE admin_users.email = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Service role full access ssid traffic rollups"
  ON public.ruijie_ssid_traffic_rollups
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Last-seen STA counters for positive-delta computation between 5-min samples.
CREATE TABLE IF NOT EXISTS public.ruijie_ssid_sta_sample_state (
  device_sn text NOT NULL,
  mac text NOT NULL,
  ssid text NOT NULL,
  last_wifi_up bigint NOT NULL DEFAULT 0,
  last_wifi_down bigint NOT NULL DEFAULT 0,
  sampled_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ruijie_ssid_sta_sample_state_pkey
    PRIMARY KEY (device_sn, mac, ssid)
);

COMMENT ON TABLE public.ruijie_ssid_sta_sample_state IS
  'Checkpoint of last STA session byte counters (wifiUp/wifiDown) per AP+MAC+SSID for sampler deltas. Prune rows not seen ~24–48h.';

CREATE INDEX IF NOT EXISTS idx_ruijie_ssid_sta_sample_state_sampled
  ON public.ruijie_ssid_sta_sample_state (sampled_at);

ALTER TABLE public.ruijie_ssid_sta_sample_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can read ssid sta sample state"
  ON public.ruijie_ssid_sta_sample_state
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users
      WHERE admin_users.email = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Service role full access ssid sta sample state"
  ON public.ruijie_ssid_sta_sample_state
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
