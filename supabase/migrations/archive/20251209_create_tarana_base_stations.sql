-- Tarana Base Stations Table for SkyFibre Coverage Accuracy
-- Source: BN-Report Excel (October 2025)
-- Migration: 20251209_create_tarana_base_stations

CREATE TABLE IF NOT EXISTS tarana_base_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number text NOT NULL UNIQUE,
  hostname text NOT NULL,
  site_name text NOT NULL,
  active_connections integer DEFAULT 0,
  market text,
  lat numeric(10,6) NOT NULL,
  lng numeric(10,6) NOT NULL,
  region text DEFAULT 'South Africa',
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create geographic index for proximity queries using PostGIS
-- Note: Cast to geography for distance calculations in meters
CREATE INDEX idx_tarana_base_stations_geography
ON tarana_base_stations
USING gist (
  (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography)
);

-- Create index for market filtering
CREATE INDEX idx_tarana_base_stations_market ON tarana_base_stations(market);

-- Create index for active connections filtering
CREATE INDEX idx_tarana_base_stations_connections ON tarana_base_stations(active_connections DESC);

-- Function to find nearest base station with distance
CREATE OR REPLACE FUNCTION find_nearest_tarana_base_station(
  p_lat numeric,
  p_lng numeric,
  p_limit integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  serial_number text,
  hostname text,
  site_name text,
  active_connections integer,
  market text,
  lat numeric,
  lng numeric,
  distance_km numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    t.id,
    t.serial_number,
    t.hostname,
    t.site_name,
    t.active_connections,
    t.market,
    t.lat,
    t.lng,
    ROUND(
      (ST_Distance(
        ST_SetSRID(ST_MakePoint(t.lng, t.lat), 4326)::geography,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
      ) / 1000)::numeric,
      2
    ) as distance_km
  FROM tarana_base_stations t
  ORDER BY ST_SetSRID(ST_MakePoint(t.lng, t.lat), 4326)::geography <->
           ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  LIMIT p_limit;
$$;

-- Grant access to authenticated users (read-only)
GRANT SELECT ON tarana_base_stations TO authenticated;
GRANT EXECUTE ON FUNCTION find_nearest_tarana_base_station TO authenticated;

-- Grant access to anon for public API coverage checks
GRANT SELECT ON tarana_base_stations TO anon;
GRANT EXECUTE ON FUNCTION find_nearest_tarana_base_station TO anon;

-- Enable RLS
ALTER TABLE tarana_base_stations ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read base station data (public coverage info)
CREATE POLICY "Base stations are publicly readable"
ON tarana_base_stations
FOR SELECT
USING (true);

-- Comment for documentation
COMMENT ON TABLE tarana_base_stations IS 'MTN Tarana base station locations for SkyFibre coverage validation. Imported from BN-Report Excel.';
COMMENT ON FUNCTION find_nearest_tarana_base_station IS 'Find nearest Tarana base stations to a given lat/lng with distance in km.';
