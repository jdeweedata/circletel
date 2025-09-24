# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-09-24-mtn-dfa-coverage-integration/spec.md

> Created: 2025-09-24
> Version: 1.0.0

## Schema Changes

### New Tables

#### coverage_cache
Enhanced spatial caching system for multi-provider coverage data with PostGIS integration:

```sql
-- Enable PostGIS extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

CREATE TABLE coverage_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_hash TEXT NOT NULL UNIQUE, -- MD5 of lat,lng rounded to 4 decimals for deduplication
  coordinates GEOMETRY(Point, 4326) NOT NULL, -- WGS84 spatial coordinates
  address TEXT, -- Human-readable address string
  coverage_radius INTEGER DEFAULT 100, -- Coverage area radius in meters

  -- Provider-specific data storage
  provider_data JSONB NOT NULL, -- MTN WMS, DFA ArcGIS, CircleTel coverage details
  technologies TEXT[] NOT NULL, -- Available technologies: ['FIBRE', '4G', '5G', 'FIXED_WIRELESS']
  user_type TEXT CHECK (user_type IN ('consumer', 'business')) NOT NULL,

  -- Quality and reliability metrics
  confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
  signal_strength INTEGER, -- dBm for mobile providers
  overall_quality DECIMAL(3,2) CHECK (overall_quality BETWEEN 0.0 AND 10.0),

  -- Cache management
  cache_version INTEGER DEFAULT 1, -- For schema evolution
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  access_count INTEGER DEFAULT 1, -- Usage tracking for cache optimization
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spatial index for geographic queries (most important for performance)
CREATE INDEX idx_coverage_cache_spatial ON coverage_cache USING GIST (coordinates);

-- Hash index for exact location lookups
CREATE INDEX idx_coverage_cache_hash ON coverage_cache (location_hash);

-- Partial index for active cache entries (only non-expired)
CREATE INDEX idx_coverage_cache_active ON coverage_cache (expires_at, user_type)
WHERE expires_at > NOW();

-- Technology-specific queries
CREATE INDEX idx_coverage_cache_technologies ON coverage_cache USING GIN (technologies);

-- Quality-based filtering
CREATE INDEX idx_coverage_cache_quality ON coverage_cache (confidence_score, overall_quality)
WHERE confidence_score >= 70;
```

#### api_rate_limits
Provider API rate limiting and quota management:

```sql
CREATE TABLE api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL, -- 'MTN', 'DFA', 'CircleTel'
  endpoint_path TEXT NOT NULL, -- Specific API endpoint being limited
  api_key_hash TEXT, -- Hashed API key identifier for multi-key support

  -- Rate limiting metrics
  requests_count INTEGER DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  window_duration INTERVAL DEFAULT '1 hour',
  max_requests INTEGER NOT NULL,

  -- Usage patterns and optimization
  peak_usage_hour INTEGER, -- 0-23 hour of day with highest usage
  average_response_time INTEGER, -- milliseconds
  error_rate DECIMAL(5,4) DEFAULT 0.0, -- percentage of failed requests

  -- Management timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(provider_name, endpoint_path, window_start)
);

-- Index for real-time rate limit checks (critical for performance)
CREATE INDEX idx_rate_limits_check ON api_rate_limits
(provider_name, endpoint_path, window_start DESC)
WHERE window_start > (NOW() - INTERVAL '24 hours');

-- Provider-specific analytics
CREATE INDEX idx_rate_limits_provider ON api_rate_limits
(provider_name, created_at DESC);
```

#### coverage_reports
Business report generation and management:

```sql
CREATE TABLE coverage_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT NOT NULL UNIQUE, -- Client-facing batch identifier
  user_email TEXT, -- Optional user association
  customer_name TEXT, -- Business customer name for branding

  -- Report metadata
  report_type TEXT CHECK (report_type IN ('single', 'batch', 'business', 'executive')) NOT NULL,
  addresses_count INTEGER DEFAULT 1,
  total_sites_analyzed INTEGER,
  successful_sites INTEGER,
  failed_sites INTEGER,

  -- Report content and storage
  coverage_data JSONB NOT NULL, -- Raw coverage analysis results
  report_config JSONB, -- Report customization settings
  report_url TEXT, -- URL to generated PDF file
  report_size_bytes INTEGER, -- File size for storage management

  -- Business intelligence
  estimated_monthly_cost DECIMAL(10,2),
  recommended_provider TEXT,
  technologies_recommended TEXT[],

  -- Lifecycle management
  generation_time_ms INTEGER, -- Performance tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  download_count INTEGER DEFAULT 0,
  last_downloaded TIMESTAMP WITH TIME ZONE
);

-- Index for batch report retrieval (primary access pattern)
CREATE INDEX idx_coverage_reports_batch ON coverage_reports (batch_id);

-- Customer-specific report history
CREATE INDEX idx_coverage_reports_customer ON coverage_reports
(user_email, created_at DESC)
WHERE user_email IS NOT NULL;

-- Business analytics on report generation
CREATE INDEX idx_coverage_reports_analytics ON coverage_reports
(report_type, created_at DESC, addresses_count);
```

#### spatial_coverage_zones
Pre-computed coverage zones for performance optimization:

```sql
CREATE TABLE spatial_coverage_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name TEXT NOT NULL, -- Human-readable zone identifier
  provider_name TEXT NOT NULL,
  technology TEXT NOT NULL, -- 'FIBRE', '4G', '5G', 'FIXED_WIRELESS'

  -- Spatial definition
  coverage_area GEOMETRY(Polygon, 4326) NOT NULL, -- WGS84 coverage polygon
  center_point GEOMETRY(Point, 4326) NOT NULL, -- Zone center for distance calculations
  coverage_quality TEXT CHECK (coverage_quality IN ('excellent', 'good', 'fair', 'poor')) NOT NULL,

  -- Signal characteristics
  signal_strength_min INTEGER, -- Minimum dBm in zone
  signal_strength_max INTEGER, -- Maximum dBm in zone
  bandwidth_capacity_mbps INTEGER, -- Available bandwidth

  -- Administrative data
  last_surveyed TIMESTAMP WITH TIME ZONE,
  confidence_level DECIMAL(3,2) CHECK (confidence_level BETWEEN 0.0 AND 1.0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Primary spatial index for zone intersection queries
CREATE INDEX idx_spatial_zones_area ON spatial_coverage_zones USING GIST (coverage_area);

-- Center point index for distance-based queries
CREATE INDEX idx_spatial_zones_center ON spatial_coverage_zones USING GIST (center_point);

-- Provider and technology filtering
CREATE INDEX idx_spatial_zones_provider ON spatial_coverage_zones
(provider_name, technology, coverage_quality);
```

### Enhanced Existing Tables

#### Extend existing products table
```sql
-- Add spatial capabilities to existing products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS coverage_zones UUID[] REFERENCES spatial_coverage_zones(id),
ADD COLUMN IF NOT EXISTS service_area GEOMETRY(Polygon, 4326),
ADD COLUMN IF NOT EXISTS availability_algorithm TEXT DEFAULT 'basic';

-- Index for product-zone relationships
CREATE INDEX idx_products_coverage_zones ON products USING GIN (coverage_zones);

-- Spatial index for product service areas
CREATE INDEX idx_products_service_area ON products USING GIST (service_area);
```

## Database Functions

### Spatial Coverage Lookup Function
```sql
CREATE OR REPLACE FUNCTION get_coverage_for_point(
  input_lat DECIMAL,
  input_lng DECIMAL,
  search_radius INTEGER DEFAULT 500
) RETURNS TABLE(
  provider_name TEXT,
  technology TEXT,
  coverage_quality TEXT,
  signal_strength INTEGER,
  distance_meters DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    scz.provider_name,
    scz.technology,
    scz.coverage_quality,
    (scz.signal_strength_min + scz.signal_strength_max) / 2 as signal_strength,
    ST_Distance(
      ST_Transform(ST_SetSRID(ST_MakePoint(input_lng, input_lat), 4326), 3857),
      ST_Transform(scz.center_point, 3857)
    )::DECIMAL as distance_meters
  FROM spatial_coverage_zones scz
  WHERE ST_DWithin(
    ST_Transform(ST_SetSRID(ST_MakePoint(input_lng, input_lat), 4326), 3857),
    ST_Transform(scz.center_point, 3857),
    search_radius
  )
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql;
```

### Intelligent Cache Lookup Function
```sql
CREATE OR REPLACE FUNCTION get_cached_coverage(
  input_lat DECIMAL,
  input_lng DECIMAL,
  input_user_type TEXT DEFAULT 'consumer'
) RETURNS TABLE(
  cached_data JSONB,
  cache_age_minutes INTEGER,
  confidence_score INTEGER
) AS $$
DECLARE
  location_hash TEXT;
BEGIN
  -- Generate location hash for cache lookup
  location_hash := MD5(ROUND(input_lat::NUMERIC, 4)::TEXT || ',' || ROUND(input_lng::NUMERIC, 4)::TEXT);

  RETURN QUERY
  SELECT
    cc.provider_data as cached_data,
    EXTRACT(EPOCH FROM (NOW() - cc.updated_at))::INTEGER / 60 as cache_age_minutes,
    cc.confidence_score
  FROM coverage_cache cc
  WHERE cc.location_hash = get_cached_coverage.location_hash
    AND cc.user_type = input_user_type
    AND cc.expires_at > NOW()
  ORDER BY cc.updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
```

### Multi-Provider Coverage Analysis Function
```sql
CREATE OR REPLACE FUNCTION analyze_multi_provider_coverage(
  addresses JSONB -- Array of {lat, lng, address} objects
) RETURNS TABLE(
  address_index INTEGER,
  provider_analysis JSONB,
  best_option TEXT,
  estimated_cost DECIMAL
) AS $$
DECLARE
  addr JSONB;
  addr_index INTEGER := 0;
BEGIN
  FOR addr IN SELECT * FROM jsonb_array_elements(addresses)
  LOOP
    addr_index := addr_index + 1;

    RETURN QUERY
    SELECT
      addr_index,
      jsonb_agg(
        jsonb_build_object(
          'provider', provider_name,
          'technology', technology,
          'quality', coverage_quality,
          'signal_strength', signal_strength,
          'distance', distance_meters
        )
      ) as provider_analysis,
      (array_agg(provider_name ORDER BY
        CASE coverage_quality
          WHEN 'excellent' THEN 4
          WHEN 'good' THEN 3
          WHEN 'fair' THEN 2
          ELSE 1
        END DESC, distance_meters ASC
      ))[1] as best_option,
      CASE
        WHEN COUNT(*) > 0 THEN 899.00 -- Base business pricing
        ELSE 0.00
      END as estimated_cost
    FROM get_coverage_for_point(
      (addr->>'lat')::DECIMAL,
      (addr->>'lng')::DECIMAL,
      1000 -- 1km search radius for business
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

## Migrations

### Migration 1: Enable PostGIS and Create Base Tables
```sql
-- Migration: 20250924_001_enable_postgis_coverage_system.sql
-- Enable PostGIS extension and create coverage system base tables

BEGIN;

-- Enable spatial extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Verify PostGIS installation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'postgis'
  ) THEN
    RAISE EXCEPTION 'PostGIS extension is required but not available';
  END IF;
END $$;

-- Create coverage_cache table with all indexes
CREATE TABLE IF NOT EXISTS coverage_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_hash TEXT NOT NULL UNIQUE,
  coordinates GEOMETRY(Point, 4326) NOT NULL,
  address TEXT,
  coverage_radius INTEGER DEFAULT 100,
  provider_data JSONB NOT NULL,
  technologies TEXT[] NOT NULL,
  user_type TEXT CHECK (user_type IN ('consumer', 'business')) NOT NULL,
  confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
  signal_strength INTEGER,
  overall_quality DECIMAL(3,2) CHECK (overall_quality BETWEEN 0.0 AND 10.0),
  cache_version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  access_count INTEGER DEFAULT 1,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create all indexes for coverage_cache
CREATE INDEX IF NOT EXISTS idx_coverage_cache_spatial ON coverage_cache USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_coverage_cache_hash ON coverage_cache (location_hash);
CREATE INDEX IF NOT EXISTS idx_coverage_cache_active ON coverage_cache (expires_at, user_type) WHERE expires_at > NOW();
CREATE INDEX IF NOT EXISTS idx_coverage_cache_technologies ON coverage_cache USING GIN (technologies);
CREATE INDEX IF NOT EXISTS idx_coverage_cache_quality ON coverage_cache (confidence_score, overall_quality) WHERE confidence_score >= 70;

-- Create api_rate_limits table
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  endpoint_path TEXT NOT NULL,
  api_key_hash TEXT,
  requests_count INTEGER DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  window_duration INTERVAL DEFAULT '1 hour',
  max_requests INTEGER NOT NULL,
  peak_usage_hour INTEGER,
  average_response_time INTEGER,
  error_rate DECIMAL(5,4) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_name, endpoint_path, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_check ON api_rate_limits (provider_name, endpoint_path, window_start DESC) WHERE window_start > (NOW() - INTERVAL '24 hours');
CREATE INDEX IF NOT EXISTS idx_rate_limits_provider ON api_rate_limits (provider_name, created_at DESC);

COMMIT;
```

### Migration 2: Business Reporting System
```sql
-- Migration: 20250924_002_create_reporting_system.sql
-- Create business reporting and spatial zone tables

BEGIN;

-- Create coverage_reports table
CREATE TABLE IF NOT EXISTS coverage_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT NOT NULL UNIQUE,
  user_email TEXT,
  customer_name TEXT,
  report_type TEXT CHECK (report_type IN ('single', 'batch', 'business', 'executive')) NOT NULL,
  addresses_count INTEGER DEFAULT 1,
  total_sites_analyzed INTEGER,
  successful_sites INTEGER,
  failed_sites INTEGER,
  coverage_data JSONB NOT NULL,
  report_config JSONB,
  report_url TEXT,
  report_size_bytes INTEGER,
  estimated_monthly_cost DECIMAL(10,2),
  recommended_provider TEXT,
  technologies_recommended TEXT[],
  generation_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  download_count INTEGER DEFAULT 0,
  last_downloaded TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_coverage_reports_batch ON coverage_reports (batch_id);
CREATE INDEX IF NOT EXISTS idx_coverage_reports_customer ON coverage_reports (user_email, created_at DESC) WHERE user_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coverage_reports_analytics ON coverage_reports (report_type, created_at DESC, addresses_count);

-- Create spatial_coverage_zones table
CREATE TABLE IF NOT EXISTS spatial_coverage_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  technology TEXT NOT NULL,
  coverage_area GEOMETRY(Polygon, 4326) NOT NULL,
  center_point GEOMETRY(Point, 4326) NOT NULL,
  coverage_quality TEXT CHECK (coverage_quality IN ('excellent', 'good', 'fair', 'poor')) NOT NULL,
  signal_strength_min INTEGER,
  signal_strength_max INTEGER,
  bandwidth_capacity_mbps INTEGER,
  last_surveyed TIMESTAMP WITH TIME ZONE,
  confidence_level DECIMAL(3,2) CHECK (confidence_level BETWEEN 0.0 AND 1.0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spatial_zones_area ON spatial_coverage_zones USING GIST (coverage_area);
CREATE INDEX IF NOT EXISTS idx_spatial_zones_center ON spatial_coverage_zones USING GIST (center_point);
CREATE INDEX IF NOT EXISTS idx_spatial_zones_provider ON spatial_coverage_zones (provider_name, technology, coverage_quality);

COMMIT;
```

### Migration 3: Database Functions
```sql
-- Migration: 20250924_003_create_coverage_functions.sql
-- Create spatial analysis and caching functions

BEGIN;

-- Create spatial coverage lookup function
CREATE OR REPLACE FUNCTION get_coverage_for_point(
  input_lat DECIMAL,
  input_lng DECIMAL,
  search_radius INTEGER DEFAULT 500
) RETURNS TABLE(
  provider_name TEXT,
  technology TEXT,
  coverage_quality TEXT,
  signal_strength INTEGER,
  distance_meters DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    scz.provider_name,
    scz.technology,
    scz.coverage_quality,
    (scz.signal_strength_min + scz.signal_strength_max) / 2 as signal_strength,
    ST_Distance(
      ST_Transform(ST_SetSRID(ST_MakePoint(input_lng, input_lat), 4326), 3857),
      ST_Transform(scz.center_point, 3857)
    )::DECIMAL as distance_meters
  FROM spatial_coverage_zones scz
  WHERE ST_DWithin(
    ST_Transform(ST_SetSRID(ST_MakePoint(input_lng, input_lat), 4326), 3857),
    ST_Transform(scz.center_point, 3857),
    search_radius
  )
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql;

-- Create intelligent cache lookup function
CREATE OR REPLACE FUNCTION get_cached_coverage(
  input_lat DECIMAL,
  input_lng DECIMAL,
  input_user_type TEXT DEFAULT 'consumer'
) RETURNS TABLE(
  cached_data JSONB,
  cache_age_minutes INTEGER,
  confidence_score INTEGER
) AS $$
DECLARE
  location_hash TEXT;
BEGIN
  location_hash := MD5(ROUND(input_lat::NUMERIC, 4)::TEXT || ',' || ROUND(input_lng::NUMERIC, 4)::TEXT);

  RETURN QUERY
  SELECT
    cc.provider_data as cached_data,
    EXTRACT(EPOCH FROM (NOW() - cc.updated_at))::INTEGER / 60 as cache_age_minutes,
    cc.confidence_score
  FROM coverage_cache cc
  WHERE cc.location_hash = get_cached_coverage.location_hash
    AND cc.user_type = input_user_type
    AND cc.expires_at > NOW()
  ORDER BY cc.updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create multi-provider analysis function
CREATE OR REPLACE FUNCTION analyze_multi_provider_coverage(
  addresses JSONB
) RETURNS TABLE(
  address_index INTEGER,
  provider_analysis JSONB,
  best_option TEXT,
  estimated_cost DECIMAL
) AS $$
DECLARE
  addr JSONB;
  addr_index INTEGER := 0;
BEGIN
  FOR addr IN SELECT * FROM jsonb_array_elements(addresses)
  LOOP
    addr_index := addr_index + 1;

    RETURN QUERY
    SELECT
      addr_index,
      jsonb_agg(
        jsonb_build_object(
          'provider', provider_name,
          'technology', technology,
          'quality', coverage_quality,
          'signal_strength', signal_strength,
          'distance', distance_meters
        )
      ) as provider_analysis,
      (array_agg(provider_name ORDER BY
        CASE coverage_quality
          WHEN 'excellent' THEN 4
          WHEN 'good' THEN 3
          WHEN 'fair' THEN 2
          ELSE 1
        END DESC, distance_meters ASC
      ))[1] as best_option,
      CASE
        WHEN COUNT(*) > 0 THEN 899.00
        ELSE 0.00
      END as estimated_cost
    FROM get_coverage_for_point(
      (addr->>'lat')::DECIMAL,
      (addr->>'lng')::DECIMAL,
      1000
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMIT;
```

### Migration 4: Enhance Existing Tables
```sql
-- Migration: 20250924_004_enhance_products_table.sql
-- Add spatial capabilities to existing products table

BEGIN;

-- Add spatial columns to products table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'coverage_zones') THEN
    ALTER TABLE products ADD COLUMN coverage_zones UUID[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'service_area') THEN
    ALTER TABLE products ADD COLUMN service_area GEOMETRY(Polygon, 4326);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'availability_algorithm') THEN
    ALTER TABLE products ADD COLUMN availability_algorithm TEXT DEFAULT 'basic';
  END IF;
END $$;

-- Create indexes for new product columns
CREATE INDEX IF NOT EXISTS idx_products_coverage_zones ON products USING GIN (coverage_zones);
CREATE INDEX IF NOT EXISTS idx_products_service_area ON products USING GIST (service_area);
CREATE INDEX IF NOT EXISTS idx_products_algorithm ON products (availability_algorithm);

COMMIT;
```

## Performance Optimization Guidelines

### Spatial Query Performance
1. **Always use spatial indexes** - GIST indexes on geometry columns provide 10x-100x query performance improvements
2. **Coordinate transformation caching** - Transform to projected coordinate system (3857) for distance calculations to improve accuracy
3. **Search radius optimization** - Limit search radius to reasonable bounds (500m consumer, 1km business) to prevent expensive full-table scans
4. **Partial indexing strategy** - Index only active/valid records to reduce index size and improve cache hit rates

### Cache Management Strategy
1. **Intelligent TTL management** - 24-hour cache for stable areas, 4-hour cache for areas with frequent coverage changes
2. **Access pattern optimization** - Track usage frequency and extend cache TTL for frequently accessed locations
3. **Memory vs disk balance** - Keep hot spatial data in PostgreSQL shared buffers, cold data in regular storage
4. **Cleanup automation** - Automated cleanup of expired cache entries during low-traffic periods

### Rate Limiting Implementation
1. **Provider-specific limits** - Different rate limits per API provider based on their documented limits
2. **Exponential backoff** - Implement intelligent backoff when approaching rate limits
3. **Multi-key rotation** - Support multiple API keys per provider to increase effective rate limits
4. **Usage analytics** - Track peak hours and error rates to optimize request timing

### Business Reporting Optimization
1. **Batch processing** - Process multiple addresses in parallel with connection pooling
2. **Report caching** - Cache generated reports for identical parameter sets
3. **Incremental updates** - Update only changed coverage data rather than full regeneration
4. **Storage lifecycle** - Automatic cleanup of old reports with configurable retention periods