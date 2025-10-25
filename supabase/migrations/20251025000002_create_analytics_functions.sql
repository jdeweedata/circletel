-- Analytics helper functions

-- Time series aggregation function
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

-- Get province statistics
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

-- Get error distribution
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
  -- Get total errors
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

-- Get provider performance comparison
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

-- Comment on functions
COMMENT ON FUNCTION get_coverage_time_series IS 'Returns time-series data for coverage check requests';
COMMENT ON FUNCTION get_province_statistics IS 'Returns statistics grouped by province';
COMMENT ON FUNCTION get_error_distribution IS 'Returns error distribution with percentages';
COMMENT ON FUNCTION get_provider_performance IS 'Returns performance metrics by provider';
