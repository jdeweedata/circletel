-- =============================================================================
-- DFA (Dark Fibre Africa) Buildings Cache Tables
-- =============================================================================
-- Caches building data from DFA ArcGIS API for:
-- - Faster queries (API is slow)
-- - Offline availability
-- - Analytics and filtering
-- - Admin visibility into DFA coverage
--
-- Pattern: Mirrors tarana_base_stations / tarana_sync_logs structure
-- =============================================================================

-- DFA Buildings table (cached from ArcGIS API)
CREATE TABLE dfa_buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- DFA identifiers
  object_id INTEGER NOT NULL,
  building_id TEXT,
  building_name TEXT,

  -- Location
  street_address TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,

  -- Coverage type: 'connected' (active fiber) or 'near-net' (within 200m)
  coverage_type TEXT NOT NULL CHECK (coverage_type IN ('connected', 'near-net')),

  -- Service availability (for connected buildings)
  ftth TEXT,                    -- Fiber to the Home status
  broadband TEXT,               -- Broadband availability

  -- Classification
  precinct TEXT,                -- DFA precinct/area
  promotion TEXT,               -- Current promotion status
  property_owner TEXT,          -- Building owner

  -- Metadata
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique per building per coverage type
  UNIQUE(object_id, coverage_type)
);

-- Indexes for common queries
CREATE INDEX idx_dfa_buildings_coverage_type ON dfa_buildings(coverage_type);
CREATE INDEX idx_dfa_buildings_precinct ON dfa_buildings(precinct);
CREATE INDEX idx_dfa_buildings_ftth ON dfa_buildings(ftth) WHERE ftth IS NOT NULL;
CREATE INDEX idx_dfa_buildings_broadband ON dfa_buildings(broadband) WHERE broadband IS NOT NULL;
CREATE INDEX idx_dfa_buildings_building_name ON dfa_buildings(building_name) WHERE building_name IS NOT NULL;
CREATE INDEX idx_dfa_buildings_last_synced ON dfa_buildings(last_synced_at);

-- PostGIS spatial index for proximity queries
CREATE INDEX idx_dfa_buildings_location ON dfa_buildings USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
);

-- Full-text search index for building name and address
CREATE INDEX idx_dfa_buildings_search ON dfa_buildings USING GIN (
  to_tsvector('english', COALESCE(building_name, '') || ' ' || COALESCE(street_address, '') || ' ' || COALESCE(building_id, ''))
);

-- =============================================================================
-- DFA Sync Logs table
-- =============================================================================
-- Tracks sync operations for monitoring and debugging

CREATE TABLE dfa_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Status tracking
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'completed_with_errors', 'failed', 'cancelled')),

  -- Counts
  connected_count INTEGER DEFAULT 0,    -- Connected buildings synced
  near_net_count INTEGER DEFAULT 0,     -- Near-net buildings synced
  records_fetched INTEGER DEFAULT 0,    -- Total records from API
  records_inserted INTEGER DEFAULT 0,   -- New records added
  records_updated INTEGER DEFAULT 0,    -- Existing records updated
  records_deleted INTEGER DEFAULT 0,    -- Stale records removed

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Error tracking
  error_message TEXT,

  -- Trigger info
  triggered_by TEXT CHECK (triggered_by IN ('cron', 'manual')),
  triggered_by_user_id UUID REFERENCES admin_users(id),

  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for status queries
CREATE INDEX idx_dfa_sync_logs_status ON dfa_sync_logs(status);
CREATE INDEX idx_dfa_sync_logs_created_at ON dfa_sync_logs(created_at DESC);

-- =============================================================================
-- RLS Policies
-- =============================================================================

-- DFA Buildings: Read-only for authenticated users, service role can write
ALTER TABLE dfa_buildings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dfa_buildings_read_authenticated" ON dfa_buildings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "dfa_buildings_service_role" ON dfa_buildings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- DFA Sync Logs: Admin read access, service role full access
ALTER TABLE dfa_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dfa_sync_logs_read_authenticated" ON dfa_sync_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "dfa_sync_logs_service_role" ON dfa_sync_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE dfa_buildings IS 'Cached DFA building data from ArcGIS API for BizFibre Connect coverage';
COMMENT ON TABLE dfa_sync_logs IS 'Logs for DFA building sync operations';

COMMENT ON COLUMN dfa_buildings.coverage_type IS 'connected = active fiber, near-net = within 200m of fiber';
COMMENT ON COLUMN dfa_buildings.ftth IS 'Fiber to the Home availability status';
COMMENT ON COLUMN dfa_buildings.precinct IS 'DFA precinct/coverage area classification';
