-- ============================================
-- MTN Coverage Aggregation with 5-Min Caching
-- ============================================

-- 1. Create cached coverage results table
CREATE TABLE IF NOT EXISTS mtn_coverage_cache (
    cache_key VARCHAR(255) PRIMARY KEY,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    coverage_results JSONB NOT NULL,
    cache_expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mtn_cache_coords 
ON mtn_coverage_cache(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_mtn_cache_expires 
ON mtn_coverage_cache(cache_expires_at, is_active);

-- 3. Automatic cleanup function (remove expired cache)
CREATE OR REPLACE FUNCTION cleanup_expired_mtn_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM mtn_coverage_cache 
    WHERE cache_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 4. Function to get cached MTN coverage or fetch fresh data
CREATE OR REPLACE FUNCTION get_mtn_coverage_with_cache(
    p_latitude DECIMAL,
    p_longitude DECIMAL,
    p_cache_minutes INTEGER DEFAULT 5
)
RETURNS JSONB AS $$
DECLARE
    v_cache_key VARCHAR;
    v_cached_result JSONB;
    v_fresh_result JSONB;
BEGIN
    -- Generate cache key
    v_cache_key := 'mtn_coverage_' || ROUND(p_latitude::numeric * 1000000) || '_' || ROUND(p_longitude::numeric * 1000000);
    
    -- Check for valid cache entry
    SELECT coverage_results INTO v_cached_result
    FROM mtn_coverage_cache
    WHERE cache_key = v_cache_key 
    AND cache_expires_at > NOW()
    AND is_active = true;
    
    IF v_cached_result IS NOT NULL THEN
        -- Return cached result
        RETURN jsonb_build_object(
            'source', 'cache',
            'data', v_cached_result,
            'cached_at', NOW()
        );
    ELSE
        -- Fetch fresh data (simulate MTN API call)
        v_fresh_result := jsonb_build_object(
            'coverage_available', CASE WHEN RANDOM() > 0.3 THEN true ELSE false END,
            'service_types', CASE 
                WHEN RANDOM() > 0.7 THEN jsonb_build_array('4G', '5G')
                WHEN RANDOM() > 0.4 THEN jsonb_build_array('4G')
                ELSE jsonb_build_array()
            END,
            'signal_strength', (RANDOM() * 100)::integer,
            'download_speed', (RANDOM() * 100 + 10)::integer,
            'upload_speed', (RANDOM() * 50 + 5)::integer,
            'network_id', '65501',
            'lata', '001',
            'technology', CASE WHEN RANDOM() > 0.6 THEN '5G' ELSE '4G' END,
            'latency', (RANDOM() * 50 + 10)::integer,
            'fetched_at', NOW()
        );
        
        -- Cache the fresh result
        INSERT INTO mtn_coverage_cache (
            cache_key, latitude, longitude, coverage_results, 
            cache_expires_at, is_active
        ) VALUES (
            v_cache_key, p_latitude, p_longitude, v_fresh_result,
            NOW() + (p_cache_minutes || ' minutes')::INTERVAL,
            true
        )
        ON CONFLICT (cache_key) DO UPDATE SET
            coverage_results = v_fresh_result,
            cache_expires_at = EXCLUDED.cache_expires_at,
            is_active = true;
        
        -- Return fresh result
        RETURN jsonb_build_object(
            'source', 'fresh',
            'data', v_fresh_result,
            'cached_at', NOW()
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. Function for batch coverage aggregation
CREATE OR REPLACE FUNCTION aggregate_mtn_coverage_stats()

RETURNS TABLE(
    total_checks BIGINT,
    cache_hits BIGINT,
    cache_misses BIGINT,
    hit_ratio DECIMAL(5,2),
    avg_cache_age_minutes DECIMAL(8,2),
    expired_entries BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_checks,
        COUNT(*) FILTER (WHERE is_active = true AND cache_expires_at > NOW()) as active_cache_entries,
        COUNT(*) FILTER (WHERE is_active = true AND cache_expires_at <= NOW()) as expired_entries,
        ROUND(
            (COUNT(*) FILTER (WHERE cache_expires_at > NOW())::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2
        ) as hit_ratio,
        ROUND(AVG(EXTRACT(EPOCH FROM (cache_expires_at - created_at)) / 60), 2) as avg_cache_age_minutes,
        COUNT(*) FILTER (WHERE cache_expires_at <= NOW()) as expired_count
    FROM mtn_coverage_cache;
END;
$$ LANGUAGE plpgsql;

-- 6. Materialized View for real-time coverage analytics (refresh every 5 min)
CREATE MATERIALIZED VIEW IF NOT EXISTS mtn_coverage_analytics AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour_bucket,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE coverage_results ->> 'coverage_available' = 'true') as available_count,
    AVG((coverage_results ->> 'download_speed')::INTEGER) as avg_download_speed,
    AVG((coverage_results ->> 'signal_strength')::INTEGER) as avg_signal_strength,
    COUNT(*) FILTER (WHERE coverage_results ->> 'technology' = '5G') as five_g_requests
FROM mtn_coverage_cache
WHERE is_active = true
GROUP BY DATE_TRUNC('hour', created_at);

-- 7. Index for materialized view
CREATE INDEX IF NOT EXISTS idx_mtn_analytics_hour
ON mtn_coverage_analytics(hour_bucket);

-- 8. Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_mtn_coverage_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mtn_coverage_analytics;
END;
$$ LANGUAGE plpgsql;

-- 9. Set up automatic cleanup and analytics refresh
-- Add to your cron job or pg_scheduler:
-- SELECT pg_cron.schedule('cleanup-mtn-cache', '*/10 * * * *', 'SELECT cleanup_expired_mtn_cache();');
-- SELECT pg_cron.schedule('refresh-mtn-analytics', '*/5 * * * *', 'SELECT refresh_mtn_coverage_analytics();');

-- Usage Examples:
-- 1. Get coverage with caching:
-- SELECT get_mtn_coverage_with_cache(-26.1205, 28.0293);
--
-- 2. Check cache performance:
-- SELECT * FROM aggregate_mtn_coverage_stats();
--
-- 3. View recent analytics:
-- SELECT * FROM mtn_coverage_analytics 
-- ORDER BY hour_bucket DESC LIMIT 24;
