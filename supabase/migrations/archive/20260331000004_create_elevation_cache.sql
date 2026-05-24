/**
 * Create elevation_cache — SRTM elevation data cache
 *
 * Caches elevation lookups from the Open-Elevation API (SRTM data)
 * to avoid repeated API calls during coverage prediction. Each entry
 * represents a ~11m × 11m grid cell (4 decimal places precision).
 *
 * Used by: lib/coverage/terrain/elevation-client.ts
 */

CREATE TABLE IF NOT EXISTS elevation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lat NUMERIC(10,6) NOT NULL,
  lng NUMERIC(10,6) NOT NULL,
  elevation_m NUMERIC(8,2) NOT NULL,
  source TEXT NOT NULL DEFAULT 'open_elevation',  -- open_elevation | open_meteo | manual
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint at 4 decimal place precision (~11m grid)
-- ROUND(x, 4) gives a grid cell of approximately 11m × 11m at SA latitudes
CREATE UNIQUE INDEX IF NOT EXISTS idx_elevation_cache_coords
  ON elevation_cache (ROUND(lat, 4), ROUND(lng, 4));

-- PostGIS index for spatial proximity queries (batch lookups)
CREATE INDEX IF NOT EXISTS idx_elevation_cache_spatial
  ON elevation_cache USING GIST (
    ST_SetSRID(ST_MakePoint(lng::float8, lat::float8), 4326)::geography
  );

-- TTL index — useful for cleanup jobs (elevation data doesn't change)
CREATE INDEX IF NOT EXISTS idx_elevation_cache_fetched_at
  ON elevation_cache(fetched_at DESC);

-- Public read access (elevation is not sensitive)
ALTER TABLE elevation_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read elevation cache"
  ON elevation_cache FOR SELECT
  TO anon, authenticated
  USING (true);

-- Comments
COMMENT ON TABLE elevation_cache IS 'SRTM elevation data cache. Key = (ROUND(lat,4), ROUND(lng,4)) for ~11m grid resolution.';
COMMENT ON COLUMN elevation_cache.elevation_m IS 'Elevation above mean sea level in meters (SRTM/WGS84)';
COMMENT ON COLUMN elevation_cache.source IS 'Data source: open_elevation, open_meteo, or manual';
