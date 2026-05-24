/**
 * Create tarana_link_metrics — time-series signal data from deployed RN links
 *
 * Stores periodic snapshots of link performance metrics collected from
 * the TCS Portal API for each active Remote Node (RN). Used to:
 * 1. Monitor link health over time
 * 2. Calibrate the coverage prediction model
 * 3. Build BN-specific throughput-vs-distance curves
 */

CREATE TABLE IF NOT EXISTS tarana_link_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Device identifiers
  rn_serial_number TEXT NOT NULL,
  bn_serial_number TEXT REFERENCES tarana_base_stations(serial_number) ON DELETE SET NULL,

  -- Snapshot timestamp
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Signal quality metrics
  rssi_dbm NUMERIC(6,2),            -- Received signal strength (dBm, typically -40 to -100)
  sinr_db NUMERIC(6,2),             -- Signal-to-interference-plus-noise ratio (dB)
  noise_floor_dbm NUMERIC(6,2),     -- Noise floor (dBm)
  tx_power_dbm NUMERIC(6,2),        -- Transmit power (dBm)
  rx_power_dbm NUMERIC(6,2),        -- Receive power (dBm)

  -- Modulation and coding scheme
  mcs_dl INTEGER,                    -- Downlink MCS index
  mcs_ul INTEGER,                    -- Uplink MCS index

  -- Throughput
  throughput_dl_mbps NUMERIC(8,2),  -- Downlink throughput (Mbps)
  throughput_ul_mbps NUMERIC(8,2),  -- Uplink throughput (Mbps)

  -- Link geometry (for model calibration)
  distance_m NUMERIC(10,2),         -- Calculated BN-to-RN distance (meters)
  rn_lat NUMERIC(10,6),
  rn_lng NUMERIC(10,6),
  rn_height_m NUMERIC(8,2),         -- RN antenna height above sea level (meters)
  bn_lat NUMERIC(10,6),
  bn_lng NUMERIC(10,6),
  bn_height_m NUMERIC(8,2),         -- BN antenna height above sea level (meters)

  -- Link status
  link_status TEXT,                  -- e.g., 'connected', 'degraded', 'disconnected'
  uptime_seconds INTEGER,

  -- Raw API response for future field expansion
  raw_fields JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_tarana_lm_rn_serial_time
  ON tarana_link_metrics(rn_serial_number, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_tarana_lm_bn_serial_time
  ON tarana_link_metrics(bn_serial_number, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_tarana_lm_captured_at
  ON tarana_link_metrics(captured_at DESC);

-- Prevent exact duplicate snapshots
CREATE UNIQUE INDEX IF NOT EXISTS idx_tarana_lm_unique_snapshot
  ON tarana_link_metrics(rn_serial_number, captured_at);

-- RLS: admin can read, service role can write
ALTER TABLE tarana_link_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view link metrics"
  ON tarana_link_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Comments
COMMENT ON TABLE tarana_link_metrics IS 'Time-series signal quality snapshots from active Tarana RN links. Used for model calibration and link health monitoring.';
COMMENT ON COLUMN tarana_link_metrics.rn_serial_number IS 'Tarana Remote Node serial number';
COMMENT ON COLUMN tarana_link_metrics.bn_serial_number IS 'Associated Base Node serial (FK to tarana_base_stations)';
COMMENT ON COLUMN tarana_link_metrics.distance_m IS 'Haversine distance between RN and BN coordinates (metres)';
COMMENT ON COLUMN tarana_link_metrics.raw_fields IS 'Full TCS API fields response for this RN — preserves data for fields not yet in schema';
