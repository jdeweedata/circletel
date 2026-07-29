-- Optimize hot PostGIS queries by storing reusable point geographies and
-- matching the RPC predicates/orderings to GiST-indexed columns.

ALTER TABLE public.tarana_base_stations
  ADD COLUMN IF NOT EXISTS location public.geography(Point, 4326)
  GENERATED ALWAYS AS (
    public.st_setsrid(
      public.st_makepoint((lng)::double precision, (lat)::double precision),
      4326
    )::public.geography
  ) STORED;

ALTER TABLE public.dfa_buildings
  ADD COLUMN IF NOT EXISTS location public.geography(Point, 4326)
  GENERATED ALWAYS AS (
    public.st_setsrid(
      public.st_makepoint(longitude, latitude),
      4326
    )::public.geography
  ) STORED;

ALTER TABLE public.sales_zones
  ADD COLUMN IF NOT EXISTS center_location public.geography(Point, 4326)
  GENERATED ALWAYS AS (
    public.st_setsrid(
      public.st_makepoint(center_lng, center_lat),
      4326
    )::public.geography
  ) STORED;

ALTER TABLE public.ward_demographics
  ADD COLUMN IF NOT EXISTS centroid_location public.geography(Point, 4326)
  GENERATED ALWAYS AS (
    CASE
      WHEN centroid_lng IS NULL OR centroid_lat IS NULL THEN NULL
      ELSE public.st_setsrid(
        public.st_makepoint(centroid_lng, centroid_lat),
        4326
      )::public.geography
    END
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_tarana_base_stations_location_gist
  ON public.tarana_base_stations
  USING gist (location);

CREATE INDEX IF NOT EXISTS idx_dfa_buildings_location_gist
  ON public.dfa_buildings
  USING gist (location);

CREATE INDEX IF NOT EXISTS idx_sales_zones_active_center_location_gist
  ON public.sales_zones
  USING gist (center_location)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_ward_demographics_centroid_location_gist
  ON public.ward_demographics
  USING gist (centroid_location)
  WHERE centroid_location IS NOT NULL;

COMMENT ON COLUMN public.tarana_base_stations.location IS
  'Generated PostGIS geography point for indexed Tarana proximity checks.';

COMMENT ON COLUMN public.dfa_buildings.location IS
  'Generated PostGIS geography point for indexed DFA nearest-building and radius checks.';

COMMENT ON COLUMN public.sales_zones.center_location IS
  'Generated PostGIS geography point for indexed sales-zone center distance checks.';

COMMENT ON COLUMN public.ward_demographics.centroid_location IS
  'Generated PostGIS geography point for indexed ward-centroid nearest-neighbor checks.';

CREATE OR REPLACE FUNCTION public.count_base_stations_in_radius(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision
) RETURNS TABLE(station_count integer, total_connections integer)
  LANGUAGE sql STABLE
  SET search_path TO 'public'
AS $$
  WITH search AS (
    SELECT public.st_setsrid(public.st_makepoint(p_lng, p_lat), 4326)::public.geography AS location
  )
  SELECT
    COUNT(*)::integer,
    COALESCE(SUM(t.active_connections), 0)::integer
  FROM public.tarana_base_stations t
  CROSS JOIN search
  WHERE t.location IS NOT NULL
    AND public.st_dwithin(t.location, search.location, p_radius_km * 1000);
$$;

CREATE OR REPLACE FUNCTION public.count_dfa_buildings_in_radius(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision
) RETURNS TABLE(connected_count integer, near_net_count integer)
  LANGUAGE sql STABLE
  SET search_path TO 'public'
AS $$
  WITH search AS (
    SELECT public.st_setsrid(public.st_makepoint(p_lng, p_lat), 4326)::public.geography AS location
  )
  SELECT
    COUNT(*) FILTER (WHERE d.coverage_type = 'connected')::integer,
    COUNT(*) FILTER (WHERE d.coverage_type = 'near-net')::integer
  FROM public.dfa_buildings d
  CROSS JOIN search
  WHERE d.location IS NOT NULL
    AND public.st_dwithin(d.location, search.location, p_radius_km * 1000);
$$;

CREATE OR REPLACE FUNCTION public.find_nearest_dfa_building(
  p_lat double precision,
  p_lng double precision,
  p_limit integer DEFAULT 3
) RETURNS TABLE(
  id uuid,
  building_name text,
  building_id text,
  street_address text,
  coverage_type text,
  ftth text,
  precinct text,
  latitude double precision,
  longitude double precision,
  distance_km numeric
)
  LANGUAGE sql STABLE
  SET search_path TO 'public'
AS $$
  WITH search AS (
    SELECT public.st_setsrid(public.st_makepoint(p_lng, p_lat), 4326)::public.geography AS location
  )
  SELECT
    d.id,
    d.building_name,
    d.building_id,
    d.street_address,
    d.coverage_type,
    d.ftth,
    d.precinct,
    d.latitude,
    d.longitude,
    ROUND((public.st_distance(d.location, search.location) / 1000)::numeric, 2) AS distance_km
  FROM public.dfa_buildings d
  CROSS JOIN search
  WHERE d.location IS NOT NULL
  ORDER BY d.location <-> search.location
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.find_nearest_tarana_base_station(
  p_lat numeric,
  p_lng numeric,
  p_limit integer DEFAULT 5
) RETURNS TABLE(
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
  LANGUAGE sql STABLE
  SET search_path TO 'public'
AS $$
  WITH search AS (
    SELECT public.st_setsrid(
      public.st_makepoint((p_lng)::double precision, (p_lat)::double precision),
      4326
    )::public.geography AS location
  )
  SELECT
    t.id,
    t.serial_number,
    t.hostname,
    t.site_name,
    t.active_connections,
    t.market,
    t.lat,
    t.lng,
    ROUND((public.st_distance(t.location, search.location) / 1000)::numeric, 2) AS distance_km
  FROM public.tarana_base_stations t
  CROSS JOIN search
  WHERE t.location IS NOT NULL
  ORDER BY t.location <-> search.location
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION public.find_nearest_tarana_base_station(p_lat numeric, p_lng numeric, p_limit integer) IS
  'Find nearest Tarana base stations to a given lat/lng with distance in km using the indexed generated location column.';

CREATE OR REPLACE FUNCTION public.aggregate_demand_by_ward(
  p_days integer DEFAULT 30
) RETURNS TABLE(
  ward_code text,
  check_count bigint,
  checks_with_coverage bigint,
  checks_no_coverage bigint,
  unique_sessions bigint
)
  LANGUAGE sql STABLE
  SET search_path TO 'public'
AS $$
  SELECT
    nearest_ward.ward_code,
    COUNT(*)::bigint AS check_count,
    COUNT(*) FILTER (WHERE ccl.has_coverage = true)::bigint AS checks_with_coverage,
    COUNT(*) FILTER (WHERE ccl.has_coverage = false)::bigint AS checks_no_coverage,
    COUNT(DISTINCT ccl.session_id)::bigint AS unique_sessions
  FROM public.coverage_check_logs ccl
  CROSS JOIN LATERAL (
    SELECT public.st_setsrid(
      public.st_makepoint((ccl.longitude)::double precision, (ccl.latitude)::double precision),
      4326
    )::public.geography AS location
  ) check_point
  CROSS JOIN LATERAL (
    SELECT wd.ward_code
    FROM public.ward_demographics wd
    WHERE wd.centroid_location IS NOT NULL
    ORDER BY wd.centroid_location <-> check_point.location
    LIMIT 1
  ) nearest_ward
  WHERE ccl.latitude IS NOT NULL
    AND ccl.longitude IS NOT NULL
    AND ccl.created_at >= NOW() - make_interval(days => p_days)
  GROUP BY nearest_ward.ward_code;
$$;

CREATE OR REPLACE FUNCTION public.discover_zone_candidates(
  p_min_fit_score numeric DEFAULT 40,
  p_province text DEFAULT NULL::text,
  p_max_existing_zone_distance_km numeric DEFAULT 3.0,
  p_limit integer DEFAULT 50
) RETURNS TABLE(
  ward_code text,
  ward_name text,
  municipality text,
  province text,
  centroid_lat double precision,
  centroid_lng double precision,
  demographic_fit_score numeric,
  pct_no_internet numeric,
  pct_income_above_r12800 numeric,
  pct_employed numeric,
  total_population integer,
  total_households integer,
  business_poi_count integer,
  office_poi_count integer,
  healthcare_poi_count integer,
  nearby_base_stations bigint,
  nearby_base_connections bigint,
  nearby_dfa_connected bigint,
  nearby_dfa_near_net bigint
)
  LANGUAGE sql STABLE
  SET search_path TO 'public'
AS $$
  SELECT
    wd.ward_code,
    wd.ward_name,
    wd.municipality,
    wd.province,
    wd.centroid_lat,
    wd.centroid_lng,
    wd.demographic_fit_score,
    wd.pct_no_internet,
    wd.pct_income_above_r12800,
    wd.pct_employed,
    wd.total_population,
    wd.total_households,
    wd.business_poi_count,
    wd.office_poi_count,
    wd.healthcare_poi_count,
    COALESCE(tarana.nearby_base_stations, 0)::bigint,
    COALESCE(tarana.nearby_base_connections, 0)::bigint,
    COALESCE(dfa.nearby_dfa_connected, 0)::bigint,
    COALESCE(dfa.nearby_dfa_near_net, 0)::bigint
  FROM public.ward_demographics wd
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::bigint AS nearby_base_stations,
      COALESCE(SUM(tbs.active_connections), 0)::bigint AS nearby_base_connections
    FROM public.tarana_base_stations tbs
    WHERE tbs.location IS NOT NULL
      AND public.st_dwithin(tbs.location, wd.centroid_location, 5000)
  ) tarana ON true
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) FILTER (WHERE db.coverage_type = 'connected')::bigint AS nearby_dfa_connected,
      COUNT(*) FILTER (WHERE db.coverage_type = 'near-net')::bigint AS nearby_dfa_near_net
    FROM public.dfa_buildings db
    WHERE db.location IS NOT NULL
      AND public.st_dwithin(db.location, wd.centroid_location, 3000)
  ) dfa ON true
  WHERE wd.demographic_fit_score >= p_min_fit_score
    AND (p_province IS NULL OR wd.province = p_province)
    AND wd.centroid_location IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.sales_zones sz
      WHERE sz.status = 'active'
        AND sz.center_location IS NOT NULL
        AND public.st_dwithin(
          sz.center_location,
          wd.centroid_location,
          p_max_existing_zone_distance_km * 1000
        )
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.zone_discovery_candidates zdc
      WHERE zdc.ward_code = wd.ward_code
        AND zdc.status = 'pending'
    )
  ORDER BY wd.demographic_fit_score DESC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.suggest_zones_from_demographics(
  p_min_fit_score numeric DEFAULT 50,
  p_province text DEFAULT NULL::text,
  p_limit integer DEFAULT 20
) RETURNS TABLE(
  ward_code text,
  ward_name text,
  municipality text,
  province text,
  centroid_lat double precision,
  centroid_lng double precision,
  demographic_fit_score numeric,
  pct_no_internet numeric,
  pct_income_above_r12800 numeric,
  total_population integer,
  total_households integer,
  business_poi_count integer,
  nearby_base_stations bigint
)
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT
    wd.ward_code,
    wd.ward_name,
    wd.municipality,
    wd.province,
    wd.centroid_lat,
    wd.centroid_lng,
    wd.demographic_fit_score,
    wd.pct_no_internet,
    wd.pct_income_above_r12800,
    wd.total_population,
    wd.total_households,
    wd.business_poi_count,
    COALESCE(tarana.nearby_base_stations, 0)::bigint AS nearby_base_stations
  FROM public.ward_demographics wd
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::bigint AS nearby_base_stations
    FROM public.tarana_base_stations tbs
    WHERE tbs.location IS NOT NULL
      AND public.st_dwithin(tbs.location, wd.centroid_location, 5000)
  ) tarana ON true
  WHERE wd.demographic_fit_score >= p_min_fit_score
    AND (p_province IS NULL OR wd.province = p_province)
    AND wd.centroid_location IS NOT NULL
  ORDER BY wd.demographic_fit_score DESC
  LIMIT p_limit;
$$;

ANALYZE public.tarana_base_stations;
ANALYZE public.dfa_buildings;
ANALYZE public.sales_zones;
ANALYZE public.ward_demographics;
