-- Provider API call telemetry — the raw call log behind /admin/integrations/api-health.
--
-- Spec: docs/superpowers/specs/2026-08-01-coverage-integrations-observability-split-design.md
--
-- NOT YET APPLIED. Staging and production share one Supabase project; this
-- requires explicit approval before running.
--
-- Grain: one row per outbound provider HTTP call. Rolled up hourly into
-- integration_api_metrics (which has existed since 20251116120000 with zero
-- writers) by /api/cron/provider-metrics-rollup, then pruned after 90 days.
--
-- PRIVACY: deliberately non-personal. No URL, query string, body, BBOX,
-- address, coordinates, API keys, free-text error messages, IP, user agent, or
-- linkage to a session/lead/customer. This keeps the table outside POPIA scope
-- so retention is an operations decision. Do not add identifying columns —
-- see the separate, unresolved coverage_check_logs exposure.

-- ---------------------------------------------------------------------------
-- 1. Allow 'public' as an integration type
-- ---------------------------------------------------------------------------
-- Four coverage upstreams are keyless public endpoints (MTN WMS is scraped with
-- browser-impersonation headers; ArcGIS, open-elevation and open-meteo are open)
-- and fit none of oauth/api_key/webhook_only. Recording them as 'api_key' would
-- state something false about half the coverage estate.
-- Adding a permitted value invalidates no existing row.

ALTER TABLE integration_registry
  DROP CONSTRAINT IF EXISTS integration_registry_integration_type_check;

ALTER TABLE integration_registry
  ADD CONSTRAINT integration_registry_integration_type_check
  CHECK (integration_type = ANY (ARRAY['oauth', 'api_key', 'webhook_only', 'public']));

-- ---------------------------------------------------------------------------
-- 2. Health provenance
-- ---------------------------------------------------------------------------
-- 'healthy' derived from 40 real customer checks and 'healthy' derived from one
-- synthetic ping are different claims and must not render identically.

ALTER TABLE integration_registry
  ADD COLUMN IF NOT EXISTS health_source text;

ALTER TABLE integration_registry
  DROP CONSTRAINT IF EXISTS integration_registry_health_source_check;

ALTER TABLE integration_registry
  ADD CONSTRAINT integration_registry_health_source_check
  CHECK (health_source IS NULL OR health_source = ANY (ARRAY['traffic', 'probe', 'none']));

-- ---------------------------------------------------------------------------
-- 3. Registry rows for the coverage upstreams
-- ---------------------------------------------------------------------------
-- mtn-coverage's base_url pointed at the marketing site (www.mtn.co.za), which
-- is what made its health probe meaningless — it proved a website renders.
-- NOTE: grep for readers of base_url before relying on this change.

UPDATE integration_registry
   SET integration_type = 'public',
       base_url         = 'https://mtnsi.mtn.co.za',
       description      = 'MTN WMS coverage layers (business + consumer)'
 WHERE slug = 'mtn-coverage';

INSERT INTO integration_registry
  (slug, name, description, integration_type, base_url, is_active, is_production_ready)
VALUES
  ('mtn-geocode', 'MTN Geocoding',
   'MTN address geocoding and NAD coordinate correction. Separate from coverage layers — fails independently.',
   'public', 'https://mtnsi.mtn.co.za/utils/geocode', true, true),

  ('dfa', 'DFA Fibre Coverage',
   'Dark Fibre Africa coverage and buildings. Served from an Esri/ArcGIS-hosted public FeatureServer.',
   'public', 'https://utility.arcgis.com/usrsvcs/servers/044304ebfe2140b18e6e50d1af16e9e0/rest/services/Hosted/PublicCoverage/FeatureServer',
   true, true),

  ('terrain-elevation', 'Terrain Elevation',
   'Elevation lookups for link prediction. Open-Elevation primary with Open-Meteo fallback — both are free public APIs with no SLA or contract.',
   'public', 'https://api.open-elevation.com', true, true)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. The raw call log
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS provider_api_calls (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_slug text NOT NULL REFERENCES integration_registry(slug) ON DELETE CASCADE,

  -- Normalised 'METHOD host/path[#Operation]'. Never a query string or body.
  operation        text NOT NULL,

  -- Coarse geography only. Province-level across South Africa is non-identifying
  -- at any realistic volume. Never a coordinate, address or geohash.
  province         text,

  duration_ms      integer NOT NULL CHECK (duration_ms >= 0),

  -- Transport + envelope validity, never the business outcome. A WMS 200 with an
  -- empty feature list is a SUCCESS (no coverage there is a valid answer); an
  -- ArcGIS 200 carrying an error envelope is a FAILURE.
  success          boolean NOT NULL,

  -- Constrained taxonomy only. Never a free-text message: a message can contain
  -- the request URL, reintroducing the coordinates and API key excluded above.
  error_code       text,

  cache_hit        boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Primary access pattern: per-integration time-window scans for the rollup, the
-- live in-progress-hour read, and passive health derivation.
CREATE INDEX IF NOT EXISTS idx_provider_api_calls_slug_created
  ON provider_api_calls (integration_slug, created_at DESC);

-- Prune scans by age across all integrations.
CREATE INDEX IF NOT EXISTS idx_provider_api_calls_created
  ON provider_api_calls (created_at);

ALTER TABLE provider_api_calls ENABLE ROW LEVEL SECURITY;

-- Mirrors the policies on integration_api_metrics.
DROP POLICY IF EXISTS "Admin users can view provider API calls" ON provider_api_calls;
CREATE POLICY "Admin users can view provider API calls"
  ON provider_api_calls FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
        AND admin_users.is_active = true
    )
  );

DROP POLICY IF EXISTS "Service role can manage provider API calls" ON provider_api_calls;
CREATE POLICY "Service role can manage provider API calls"
  ON provider_api_calls FOR ALL
  TO service_role
  WITH CHECK (true);

COMMENT ON TABLE provider_api_calls IS
  'Call-grain provider API telemetry. Non-personal by design — no URL, address, coordinates, IP or linkage. 90-day retention, pruned by /api/cron/provider-metrics-rollup.';

-- ---------------------------------------------------------------------------
-- 5. Hourly rollup
-- ---------------------------------------------------------------------------
-- Runs in SQL rather than the route because p95 needs percentile_cont over the
-- raw sample — the constraint that forced this table to exist. Do not
-- "simplify" this into incremental counters later; percentiles need the sample.
--
-- Idempotent: recomputes wholly from raw and upserts on the existing unique
-- constraint, so a retry or overlapping run cannot double-count.
--
-- Self-healing: targets the previous complete hour PLUS any hour that has raw
-- rows but no metrics row. The crontab runs on a single VPS that gets rebooted
-- and occasionally fills its disk; a previous-hour-only job would turn every
-- missed run into a permanent, undetected hole.
--
-- NOT populated: status_2xx/4xx/5xx (the raw log stores a success classification
-- and an error code, deliberately not the HTTP status) and rate_limit_* (MTN
-- publishes no rate-limit headers). Left at their defaults rather than invented.

CREATE OR REPLACE FUNCTION rollup_provider_api_metrics(p_retention_days integer DEFAULT 90)
RETURNS TABLE (hours_rolled integer, rows_pruned integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hours  integer := 0;
  v_pruned integer := 0;
BEGIN
  WITH candidate AS (
    -- Every complete hour with raw rows inside the retention window.
    SELECT
      c.integration_slug,
      (date_trunc('hour', c.created_at))::date        AS metric_date,
      EXTRACT(hour FROM date_trunc('hour', c.created_at))::integer AS metric_hour,
      date_trunc('hour', c.created_at)                AS hour_start
    FROM provider_api_calls c
    WHERE c.created_at >= now() - make_interval(days => p_retention_days)
      AND c.created_at <  date_trunc('hour', now())
    GROUP BY 1, 2, 3, 4
  ),
  target AS (
    -- The previous complete hour, plus any hour with no metrics row yet (gap backfill).
    SELECT k.*
    FROM candidate k
    LEFT JOIN integration_api_metrics m
      ON  m.integration_slug = k.integration_slug
      AND m.metric_date      = k.metric_date
      AND m.metric_hour      = k.metric_hour
    WHERE m.id IS NULL
       OR k.hour_start = date_trunc('hour', now()) - interval '1 hour'
  ),
  agg AS (
    SELECT
      t.integration_slug,
      t.metric_date,
      t.metric_hour,
      count(*)::integer                                        AS total_requests,
      count(*) FILTER (WHERE c.success)::integer               AS successful_requests,
      count(*) FILTER (WHERE NOT c.success)::integer           AS failed_requests,
      avg(c.duration_ms)::integer                              AS avg_response_time_ms,
      min(c.duration_ms)::integer                              AS min_response_time_ms,
      max(c.duration_ms)::integer                              AS max_response_time_ms,
      percentile_cont(0.95) WITHIN GROUP (ORDER BY c.duration_ms)::integer AS p95_response_time_ms,
      COALESCE(
        (
          -- Top 5 error CODES. Never free-text messages: a message can carry the
          -- request URL, reintroducing the coordinates and API key the raw table excludes.
          SELECT jsonb_agg(e ORDER BY (e->>'count')::integer DESC)
          FROM (
            SELECT jsonb_build_object('error_code', c2.error_code, 'count', count(*)) AS e
            FROM provider_api_calls c2
            WHERE c2.integration_slug = t.integration_slug
              AND date_trunc('hour', c2.created_at) = t.hour_start
              AND c2.error_code IS NOT NULL
            GROUP BY c2.error_code
            ORDER BY count(*) DESC
            LIMIT 5
          ) top5
        ),
        '[]'::jsonb
      ) AS top_errors
    FROM target t
    JOIN provider_api_calls c
      ON  c.integration_slug = t.integration_slug
      AND date_trunc('hour', c.created_at) = t.hour_start
    GROUP BY t.integration_slug, t.metric_date, t.metric_hour, t.hour_start
  ),
  upserted AS (
    INSERT INTO integration_api_metrics (
      integration_slug, metric_date, metric_hour,
      total_requests, successful_requests, failed_requests,
      avg_response_time_ms, min_response_time_ms, max_response_time_ms,
      p95_response_time_ms, top_errors, updated_at
    )
    SELECT
      a.integration_slug, a.metric_date, a.metric_hour,
      a.total_requests, a.successful_requests, a.failed_requests,
      a.avg_response_time_ms, a.min_response_time_ms, a.max_response_time_ms,
      a.p95_response_time_ms, a.top_errors, now()
    FROM agg a
    ON CONFLICT (integration_slug, metric_date, metric_hour) DO UPDATE SET
      total_requests       = EXCLUDED.total_requests,
      successful_requests  = EXCLUDED.successful_requests,
      failed_requests      = EXCLUDED.failed_requests,
      avg_response_time_ms = EXCLUDED.avg_response_time_ms,
      min_response_time_ms = EXCLUDED.min_response_time_ms,
      max_response_time_ms = EXCLUDED.max_response_time_ms,
      p95_response_time_ms = EXCLUDED.p95_response_time_ms,
      top_errors           = EXCLUDED.top_errors,
      updated_at           = now()
    RETURNING 1
  )
  SELECT count(*)::integer INTO v_hours FROM upserted;

  WITH pruned AS (
    DELETE FROM provider_api_calls
    WHERE created_at < now() - make_interval(days => p_retention_days)
    RETURNING 1
  )
  SELECT count(*)::integer INTO v_pruned FROM pruned;

  RETURN QUERY SELECT v_hours, v_pruned;
END;
$$;

REVOKE ALL ON FUNCTION rollup_provider_api_metrics(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION rollup_provider_api_metrics(integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION rollup_provider_api_metrics(integer) TO service_role;

COMMENT ON FUNCTION rollup_provider_api_metrics(integer) IS
  'Recompute-from-raw hourly rollup into integration_api_metrics, with gap backfill and retention pruning. Idempotent. Called by /api/cron/provider-metrics-rollup.';
