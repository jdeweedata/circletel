/**
 * Add GPS coordinate columns to corporate_sites
 *
 * Unjani Tarana FWB sites need GPS coordinates for:
 * 1. Coverage prediction model (RN location input)
 * 2. Distance calculation from BN to RN
 * 3. Map visualisation
 *
 * Coordinates will be populated from the TCS Portal API RN data
 * (RN lat/lng is returned by searchRadios for RNs) by matching
 * on tarana_rn_serial.
 */

-- Add coordinate columns
ALTER TABLE corporate_sites ADD COLUMN IF NOT EXISTS lat NUMERIC(10,6);
ALTER TABLE corporate_sites ADD COLUMN IF NOT EXISTS lng NUMERIC(10,6);
ALTER TABLE corporate_sites ADD COLUMN IF NOT EXISTS coordinates_source TEXT DEFAULT 'manual';
ALTER TABLE corporate_sites ADD COLUMN IF NOT EXISTS coordinates_updated_at TIMESTAMPTZ;

-- PostGIS spatial index for proximity queries
CREATE INDEX IF NOT EXISTS idx_corporate_sites_coords
  ON corporate_sites USING GIST (
    ST_SetSRID(ST_MakePoint(lng::float8, lat::float8), 4326)::geography
  )
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Standard index for non-null coordinate filtering
CREATE INDEX IF NOT EXISTS idx_corporate_sites_has_coords
  ON corporate_sites(id)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Comments
COMMENT ON COLUMN corporate_sites.lat IS 'Site latitude (from TCS API RN data or manual entry)';
COMMENT ON COLUMN corporate_sites.lng IS 'Site longitude (from TCS API RN data or manual entry)';
COMMENT ON COLUMN corporate_sites.coordinates_source IS 'Source of coordinates: tcs_api, manual, or geocoded';
COMMENT ON COLUMN corporate_sites.coordinates_updated_at IS 'When coordinates were last updated';
