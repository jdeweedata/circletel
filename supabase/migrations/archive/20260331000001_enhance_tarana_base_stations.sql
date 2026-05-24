/**
 * Enhance tarana_base_stations with hardware metadata
 *
 * Adds columns for BN hardware config that the TCS API already returns
 * but we currently discard: antenna height, azimuth, frequency band,
 * device connection status, and network hierarchy IDs.
 */

-- Antenna and RF config
ALTER TABLE tarana_base_stations ADD COLUMN IF NOT EXISTS height_m NUMERIC(8,2);
ALTER TABLE tarana_base_stations ADD COLUMN IF NOT EXISTS azimuth_deg NUMERIC(5,2);
ALTER TABLE tarana_base_stations ADD COLUMN IF NOT EXISTS band TEXT;

-- Device status (1 = connected, 0 = disconnected)
ALTER TABLE tarana_base_stations ADD COLUMN IF NOT EXISTS device_status INTEGER DEFAULT 0;

-- Network hierarchy IDs (for BN-RN matching)
ALTER TABLE tarana_base_stations ADD COLUMN IF NOT EXISTS region_id INTEGER;
ALTER TABLE tarana_base_stations ADD COLUMN IF NOT EXISTS market_id INTEGER;
ALTER TABLE tarana_base_stations ADD COLUMN IF NOT EXISTS site_id INTEGER;
ALTER TABLE tarana_base_stations ADD COLUMN IF NOT EXISTS cell_id INTEGER;
ALTER TABLE tarana_base_stations ADD COLUMN IF NOT EXISTS cell_name TEXT;
ALTER TABLE tarana_base_stations ADD COLUMN IF NOT EXISTS sector_id INTEGER;
ALTER TABLE tarana_base_stations ADD COLUMN IF NOT EXISTS sector_name TEXT;

-- Indexes for hierarchy lookups
CREATE INDEX IF NOT EXISTS idx_tarana_bs_site_id ON tarana_base_stations(site_id) WHERE site_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tarana_bs_market_id ON tarana_base_stations(market_id) WHERE market_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tarana_bs_device_status ON tarana_base_stations(device_status);

-- Comments
COMMENT ON COLUMN tarana_base_stations.height_m IS 'BN antenna height in meters above sea level (from TCS API)';
COMMENT ON COLUMN tarana_base_stations.azimuth_deg IS 'BN antenna azimuth in degrees (0-360, from TCS API)';
COMMENT ON COLUMN tarana_base_stations.band IS 'Radio frequency band (e.g., 5ghz)';
COMMENT ON COLUMN tarana_base_stations.device_status IS '1 = connected/active, 0 = disconnected';
COMMENT ON COLUMN tarana_base_stations.site_id IS 'TCS site ID for BN-RN hierarchy matching';
COMMENT ON COLUMN tarana_base_stations.cell_id IS 'TCS cell ID for BN-RN hierarchy matching';
