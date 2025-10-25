-- Coverage Analytics System
-- Tracks all coverage check requests for analytics and monitoring

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
  coverage_type VARCHAR(50), -- 'residential', 'business', etc.
  
  -- Provider information
  provider_code VARCHAR(50),
  provider_name VARCHAR(100),
  
  -- Response data
  status_code INTEGER NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  response_time_ms INTEGER NOT NULL,
  
  -- Coverage results
  has_coverage BOOLEAN,
  coverage_status VARCHAR(50), -- 'connected', 'near-net', 'none', etc.
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
  
  -- Indexes for common queries
  CONSTRAINT valid_coordinates CHECK (
    (latitude IS NULL AND longitude IS NULL) OR
    (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_coverage_logs_created_at ON coverage_check_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coverage_logs_provider ON coverage_check_logs(provider_code);
CREATE INDEX IF NOT EXISTS idx_coverage_logs_province ON coverage_check_logs(province);
CREATE INDEX IF NOT EXISTS idx_coverage_logs_success ON coverage_check_logs(success);
CREATE INDEX IF NOT EXISTS idx_coverage_logs_endpoint ON coverage_check_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_coverage_logs_lead_id ON coverage_check_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_coverage_logs_error_type ON coverage_check_logs(error_type) WHERE error_type IS NOT NULL;

-- Composite index for time-based analytics
CREATE INDEX IF NOT EXISTS idx_coverage_logs_analytics ON coverage_check_logs(created_at DESC, success, provider_code);

-- Provider health metrics (aggregated)
CREATE TABLE IF NOT EXISTS provider_health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_code VARCHAR(50) NOT NULL,
  
  -- Time window
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  period_type VARCHAR(20) NOT NULL, -- 'hour', 'day', 'week'
  
  -- Request metrics
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  success_rate DECIMAL(5, 2),
  
  -- Performance metrics
  avg_response_time_ms INTEGER,
  p50_response_time_ms INTEGER,
  p95_response_time_ms INTEGER,
  p99_response_time_ms INTEGER,
  min_response_time_ms INTEGER,
  max_response_time_ms INTEGER,
  
  -- Coverage metrics
  coverage_found INTEGER DEFAULT 0,
  coverage_not_found INTEGER DEFAULT 0,
  
  -- Error tracking
  error_count INTEGER DEFAULT 0,
  unique_error_types INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(provider_code, period_start, period_type)
);

CREATE INDEX IF NOT EXISTS idx_provider_health_period ON provider_health_metrics(provider_code, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_provider_health_type ON provider_health_metrics(period_type, period_start DESC);

-- Function to aggregate metrics
CREATE OR REPLACE FUNCTION aggregate_provider_metrics(
  p_provider_code VARCHAR,
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ,
  p_period_type VARCHAR
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_total INTEGER;
  v_successful INTEGER;
  v_failed INTEGER;
  v_avg_response INTEGER;
  v_p50 INTEGER;
  v_p95 INTEGER;
  v_p99 INTEGER;
  v_min INTEGER;
  v_max INTEGER;
  v_coverage_found INTEGER;
  v_coverage_not_found INTEGER;
  v_error_count INTEGER;
  v_unique_errors INTEGER;
BEGIN
  -- Calculate metrics
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE success = true),
    COUNT(*) FILTER (WHERE success = false),
    AVG(response_time_ms)::INTEGER,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_time_ms)::INTEGER,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms)::INTEGER,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms)::INTEGER,
    MIN(response_time_ms),
    MAX(response_time_ms),
    COUNT(*) FILTER (WHERE has_coverage = true),
    COUNT(*) FILTER (WHERE has_coverage = false),
    COUNT(*) FILTER (WHERE error_code IS NOT NULL),
    COUNT(DISTINCT error_type) FILTER (WHERE error_type IS NOT NULL)
  INTO
    v_total, v_successful, v_failed, v_avg_response,
    v_p50, v_p95, v_p99, v_min, v_max,
    v_coverage_found, v_coverage_not_found,
    v_error_count, v_unique_errors
  FROM coverage_check_logs
  WHERE
    (p_provider_code IS NULL OR provider_code = p_provider_code)
    AND created_at >= p_period_start
    AND created_at < p_period_end;

  -- Insert or update metrics
  INSERT INTO provider_health_metrics (
    provider_code,
    period_start,
    period_end,
    period_type,
    total_requests,
    successful_requests,
    failed_requests,
    success_rate,
    avg_response_time_ms,
    p50_response_time_ms,
    p95_response_time_ms,
    p99_response_time_ms,
    min_response_time_ms,
    max_response_time_ms,
    coverage_found,
    coverage_not_found,
    error_count,
    unique_error_types
  ) VALUES (
    COALESCE(p_provider_code, 'all'),
    p_period_start,
    p_period_end,
    p_period_type,
    v_total,
    v_successful,
    v_failed,
    CASE WHEN v_total > 0 THEN (v_successful::DECIMAL / v_total * 100) ELSE 0 END,
    v_avg_response,
    v_p50,
    v_p95,
    v_p99,
    v_min,
    v_max,
    v_coverage_found,
    v_coverage_not_found,
    v_error_count,
    v_unique_errors
  )
  ON CONFLICT (provider_code, period_start, period_type)
  DO UPDATE SET
    total_requests = EXCLUDED.total_requests,
    successful_requests = EXCLUDED.successful_requests,
    failed_requests = EXCLUDED.failed_requests,
    success_rate = EXCLUDED.success_rate,
    avg_response_time_ms = EXCLUDED.avg_response_time_ms,
    p50_response_time_ms = EXCLUDED.p50_response_time_ms,
    p95_response_time_ms = EXCLUDED.p95_response_time_ms,
    p99_response_time_ms = EXCLUDED.p99_response_time_ms,
    min_response_time_ms = EXCLUDED.min_response_time_ms,
    max_response_time_ms = EXCLUDED.max_response_time_ms,
    coverage_found = EXCLUDED.coverage_found,
    coverage_not_found = EXCLUDED.coverage_not_found,
    error_count = EXCLUDED.error_count,
    unique_error_types = EXCLUDED.unique_error_types,
    updated_at = NOW();
END;
$$;

-- Enable RLS
ALTER TABLE coverage_check_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_health_metrics ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies
CREATE POLICY "Admin read coverage logs" ON coverage_check_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Service role full access logs" ON coverage_check_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin read health metrics" ON provider_health_metrics
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Service role full access metrics" ON provider_health_metrics
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Comment on tables
COMMENT ON TABLE coverage_check_logs IS 'Logs all coverage check requests for analytics and monitoring';
COMMENT ON TABLE provider_health_metrics IS 'Aggregated provider health and performance metrics';
COMMENT ON FUNCTION aggregate_provider_metrics IS 'Aggregates coverage check logs into provider health metrics';
