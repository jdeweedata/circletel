-- Migration: Add missing TCS KPI columns to tarana_link_metrics and tarana_base_stations
-- Purpose: Enable population of path loss, INR, PER, RF distance, and network profile
--          from TCS API (TMQ v5 kpi/aggregate or TMQ v1 radios/search) in Inngest collection cycle.
-- Source:  TCS KPI Reference (Tarana TCS v1.8+ field definitions)

-- ── tarana_link_metrics: Add KPI columns ──────────────────────────────────────

ALTER TABLE tarana_link_metrics
  ADD COLUMN IF NOT EXISTS path_loss_db            NUMERIC(8,2)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS inr_carrier_0_db         NUMERIC(6,2)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS inr_carrier_1_db         NUMERIC(6,2)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sensitivity_loss_0_db    NUMERIC(6,2)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sensitivity_loss_1_db    NUMERIC(6,2)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dl_per_pct               NUMERIC(5,2)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ul_per_pct               NUMERIC(5,2)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rf_distance_m            NUMERIC(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dl_peak_rate_mbps        NUMERIC(8,2)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ul_peak_rate_mbps        NUMERIC(8,2)  DEFAULT NULL;

COMMENT ON COLUMN tarana_link_metrics.path_loss_db         IS 'RF path loss in dB from TCS (link/kpi/state/pathloss or equivalent). More accurate than FSPL model for calibration.';
COMMENT ON COLUMN tarana_link_metrics.inr_carrier_0_db     IS 'Interference-to-Noise Ratio carrier 0, dB. >10 dB indicates severe interference regardless of RSSI.';
COMMENT ON COLUMN tarana_link_metrics.inr_carrier_1_db     IS 'Interference-to-Noise Ratio carrier 1, dB (dual-carrier deployments only).';
COMMENT ON COLUMN tarana_link_metrics.sensitivity_loss_0_db IS 'Sensitivity loss carrier 0, dB. Indicates interference-induced receiver degradation.';
COMMENT ON COLUMN tarana_link_metrics.sensitivity_loss_1_db IS 'Sensitivity loss carrier 1, dB.';
COMMENT ON COLUMN tarana_link_metrics.dl_per_pct           IS 'Downlink Packet Error Rate, percent. High PER at good RSSI indicates interference.';
COMMENT ON COLUMN tarana_link_metrics.ul_per_pct           IS 'Uplink Packet Error Rate, percent.';
COMMENT ON COLUMN tarana_link_metrics.rf_distance_m        IS 'RF-measured distance in metres from TCS (more accurate than GPS haversine for link budget).';
COMMENT ON COLUMN tarana_link_metrics.dl_peak_rate_mbps    IS 'Peak DL throughput rate observed in collection window, Mbps.';
COMMENT ON COLUMN tarana_link_metrics.ul_peak_rate_mbps    IS 'Peak UL throughput rate observed in collection window, Mbps.';

-- ── tarana_base_stations: Add network profile and bandwidth ───────────────────

ALTER TABLE tarana_base_stations
  ADD COLUMN IF NOT EXISTS network_profile_id   INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bandwidth_mhz        INTEGER DEFAULT NULL;

COMMENT ON COLUMN tarana_base_stations.network_profile_id IS 'Tarana network profile: 1=4.5:1 DL:UL 15km, 2=4:1 30km, 5=2.67:1 15km, 6=1.75:1 15km. Affects tier eligibility.';
COMMENT ON COLUMN tarana_base_stations.bandwidth_mhz       IS 'Operational RF bandwidth in MHz (20, 40, or 80). Affects max throughput capacity. Our tier thresholds assume 40 MHz.';

-- ── Indexes for analytics queries ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tarana_link_metrics_path_loss
  ON tarana_link_metrics (path_loss_db)
  WHERE path_loss_db IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarana_link_metrics_inr
  ON tarana_link_metrics (inr_carrier_0_db)
  WHERE inr_carrier_0_db IS NOT NULL;
