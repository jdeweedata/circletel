-- Manual migration script for analytics tables
-- Run this directly in Supabase SQL Editor or via psql

-- Step 1: Create analytics tables
BEGIN;

-- Coverage check logs table
CREATE TABLE IF NOT EXISTS coverage_check_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Request details
  request_id VARCHAR(100) UNIQUE,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL DEFAULT 'POST',
  
  -- Location data
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  province VARCHAR(100),
  city VARCHAR(100),
  
  -- Coverage type
  coverage_type VARCHAR(50),
  
  -- Provider information
  provider_code VARCHAR(50),
  provider_name VARCHAR(100),
  
  -- Response data
  status_code INTEGER NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  response_time_ms INTEGER NOT NULL,
  
  -- Coverage results
  has_coverage BOOLEAN,
  coverage_status VARCHAR(50),
  packages_found INTEGER DEFAULT 0,
  
  -- Error tracking
  error_code VARCHAR(100),
  error_message TEXT,
  error_type VARCHAR(100),
  
  -- Session tracking
  lead_id UUID,
  session_id VARCHAR(100),
  user_agent TEXT,
  ip_address INET,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_coordinates CHECK (
    (latitude IS NULL AND longitude IS NULL) OR
    (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coverage_logs_created_at ON coverage_check_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coverage_logs_provider ON coverage_check_logs(provider_code);
CREATE INDEX IF NOT EXISTS idx_coverage_logs_province ON coverage_check_logs(province);
CREATE INDEX IF NOT EXISTS idx_coverage_logs_success ON coverage_check_logs(success);
CREATE INDEX IF NOT EXISTS idx_coverage_logs_endpoint ON coverage_check_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_coverage_logs_lead_id ON coverage_check_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_coverage_logs_error_type ON coverage_check_logs(error_type) WHERE error_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coverage_logs_analytics ON coverage_check_logs(created_at DESC, success, provider_code);

-- Provider health metrics table
CREATE TABLE IF NOT EXISTS provider_health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_code VARCHAR(50) NOT NULL,
  
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  period_type VARCHAR(20) NOT NULL,
  
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  success_rate DECIMAL(5, 2),
  
  avg_response_time_ms INTEGER,
  p50_response_time_ms INTEGER,
  p95_response_time_ms INTEGER,
  p99_response_time_ms INTEGER,
  min_response_time_ms INTEGER,
  max_response_time_ms INTEGER,
  
  coverage_found INTEGER DEFAULT 0,
  coverage_not_found INTEGER DEFAULT 0,
  
  error_count INTEGER DEFAULT 0,
  unique_error_types INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(provider_code, period_start, period_type)
);

CREATE INDEX IF NOT EXISTS idx_provider_health_period ON provider_health_metrics(provider_code, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_provider_health_type ON provider_health_metrics(period_type, period_start DESC);

-- Enable RLS
ALTER TABLE coverage_check_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_health_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Admin read coverage logs" ON coverage_check_logs;
CREATE POLICY "Admin read coverage logs" ON coverage_check_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

DROP POLICY IF EXISTS "Service role full access logs" ON coverage_check_logs;
CREATE POLICY "Service role full access logs" ON coverage_check_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin read health metrics" ON provider_health_metrics;
CREATE POLICY "Admin read health metrics" ON provider_health_metrics
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

DROP POLICY IF EXISTS "Service role full access metrics" ON provider_health_metrics;
CREATE POLICY "Service role full access metrics" ON provider_health_metrics
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;

-- Step 2: Create analytics functions
BEGIN;

-- Time series function
CREATE OR REPLACE FUNCTION get_coverage_time_series(
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_interval TEXT DEFAULT '1 hour'
)
RETURNS TABLE (
  time_bucket TIMESTAMPTZ,
  total_requests BIGINT,
  successful_requests BIGINT,
  failed_requests BIGINT,
  success_rate NUMERIC,
  avg_response_time NUMERIC,
  min_response_time INTEGER,
  max_response_time INTEGER,
  error_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    date_trunc('hour', created_at) + 
      (EXTRACT(hour FROM created_at)::INTEGER / 
        CASE 
          WHEN p_interval = '4 hours' THEN 4
          WHEN p_interval = '1 day' THEN 24
          ELSE 1
        END * 
        CASE 
          WHEN p_interval = '4 hours' THEN 4
          WHEN p_interval = '1 day' THEN 24
          ELSE 1
        END
      ) * INTERVAL '1 hour' AS time_bucket,
    COUNT(*)::BIGINT AS total_requests,
    COUNT(*) FILTER (WHERE success = true)::BIGINT AS successful_requests,
    COUNT(*) FILTER (WHERE success = false)::BIGINT AS failed_requests,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE success = true)::NUMERIC / COUNT(*) * 100)
      ELSE 0 
    END AS success_rate,
    AVG(response_time_ms)::NUMERIC AS avg_response_time,
    MIN(response_time_ms) AS min_response_time,
    MAX(response_time_ms) AS max_response_time,
    COUNT(*) FILTER (WHERE error_code IS NOT NULL)::BIGINT AS error_count
  FROM coverage_check_logs
  WHERE created_at >= p_start_time
    AND created_at <= p_end_time
  GROUP BY time_bucket
  ORDER BY time_bucket ASC;
END;
$$;

-- Province statistics function
CREATE OR REPLACE FUNCTION get_province_statistics(
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ
)
RETURNS TABLE (
  province VARCHAR,
  total_requests BIGINT,
  successful_requests BIGINT,
  success_rate NUMERIC,
  avg_response_time NUMERIC,
  coverage_found BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ccl.province,
    COUNT(*)::BIGINT AS total_requests,
    COUNT(*) FILTER (WHERE ccl.success = true)::BIGINT AS successful_requests,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE ccl.success = true)::NUMERIC / COUNT(*) * 100)
      ELSE 0 
    END AS success_rate,
    AVG(ccl.response_time_ms)::NUMERIC AS avg_response_time,
    COUNT(*) FILTER (WHERE ccl.has_coverage = true)::BIGINT AS coverage_found
  FROM coverage_check_logs ccl
  WHERE ccl.created_at >= p_start_time
    AND ccl.created_at <= p_end_time
    AND ccl.province IS NOT NULL
  GROUP BY ccl.province
  ORDER BY total_requests DESC;
END;
$$;

-- Error distribution function
CREATE OR REPLACE FUNCTION get_error_distribution(
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ
)
RETURNS TABLE (
  error_type VARCHAR,
  error_count BIGINT,
  percentage NUMERIC,
  sample_message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_errors BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_total_errors
  FROM coverage_check_logs
  WHERE created_at >= p_start_time
    AND created_at <= p_end_time
    AND error_type IS NOT NULL;

  RETURN QUERY
  SELECT
    ccl.error_type,
    COUNT(*)::BIGINT AS error_count,
    CASE 
      WHEN v_total_errors > 0 THEN 
        (COUNT(*)::NUMERIC / v_total_errors * 100)
      ELSE 0 
    END AS percentage,
    (ARRAY_AGG(ccl.error_message ORDER BY ccl.created_at DESC))[1] AS sample_message
  FROM coverage_check_logs ccl
  WHERE ccl.created_at >= p_start_time
    AND ccl.created_at <= p_end_time
    AND ccl.error_type IS NOT NULL
  GROUP BY ccl.error_type
  ORDER BY error_count DESC;
END;
$$;

-- Provider performance function
CREATE OR REPLACE FUNCTION get_provider_performance(
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ
)
RETURNS TABLE (
  provider_code VARCHAR,
  provider_name VARCHAR,
  total_requests BIGINT,
  success_rate NUMERIC,
  avg_response_time NUMERIC,
  p95_response_time NUMERIC,
  coverage_rate NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ccl.provider_code,
    ccl.provider_name,
    COUNT(*)::BIGINT AS total_requests,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE ccl.success = true)::NUMERIC / COUNT(*) * 100)
      ELSE 0 
    END AS success_rate,
    AVG(ccl.response_time_ms)::NUMERIC AS avg_response_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY ccl.response_time_ms)::NUMERIC AS p95_response_time,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE ccl.has_coverage = true)::NUMERIC / COUNT(*) * 100)
      ELSE 0 
    END AS coverage_rate
  FROM coverage_check_logs ccl
  WHERE ccl.created_at >= p_start_time
    AND ccl.created_at <= p_end_time
    AND ccl.provider_code IS NOT NULL
  GROUP BY ccl.provider_code, ccl.provider_name
  ORDER BY total_requests DESC;
END;
$$;

COMMIT;

-- Verify tables were created
SELECT 'Tables created:' as status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('coverage_check_logs', 'provider_health_metrics');

SELECT 'Functions created:' as status;
SELECT proname FROM pg_proc WHERE proname LIKE 'get_%' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
