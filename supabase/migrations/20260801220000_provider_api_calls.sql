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
