-- Interstellio subscriber inventory cache (vendor-cache sync → Supabase)
-- System of record for admin list reads; live API remains for disconnect/actions.

CREATE TABLE IF NOT EXISTS public.interstellio_subscriber_cache (
  id TEXT PRIMARY KEY,
  username TEXT,
  name TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  domain TEXT,
  tenant_id TEXT,
  service TEXT,
  profile TEXT,
  virtual TEXT,
  last_seen TIMESTAMPTZ,
  expire TIMESTAMPTZ,
  static_ip4 TEXT,
  uncapped_data BOOLEAN,
  raw_json JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interstellio_subscriber_cache_username
  ON public.interstellio_subscriber_cache (username);

CREATE INDEX IF NOT EXISTS idx_interstellio_subscriber_cache_enabled
  ON public.interstellio_subscriber_cache (enabled);

CREATE INDEX IF NOT EXISTS idx_interstellio_subscriber_cache_synced_at
  ON public.interstellio_subscriber_cache (synced_at DESC);

COMMENT ON TABLE public.interstellio_subscriber_cache IS
  'Mirrored Interstellio/NebularStack subscriber inventory from VPS vendor-cache sync';

COMMENT ON COLUMN public.interstellio_subscriber_cache.raw_json IS
  'Full API payload (no RADIUS passwords)';

ALTER TABLE public.interstellio_subscriber_cache ENABLE ROW LEVEL SECURITY;

-- Service role full access; authenticated admins read via existing admin patterns (service role in API)
CREATE POLICY interstellio_subscriber_cache_service_role_all
  ON public.interstellio_subscriber_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.interstellio_subscriber_cache TO service_role;
GRANT SELECT ON public.interstellio_subscriber_cache TO authenticated;
