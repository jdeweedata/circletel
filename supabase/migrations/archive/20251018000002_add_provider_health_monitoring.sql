-- Coverage Provider Management System - Health Monitoring & SSO
-- Phase 1B: Fixed migration using existing schema
-- Created: 2025-10-18

-- =====================================================
-- Table: provider_api_logs
-- Purpose: Log all provider API requests/responses for monitoring and debugging
-- =====================================================

CREATE TABLE IF NOT EXISTS provider_api_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES fttb_network_providers(id) ON DELETE CASCADE,

  -- Request details
  endpoint_type TEXT CHECK (endpoint_type IN ('feasibility', 'products', 'coverage', 'availability')),
  request_url TEXT NOT NULL,
  request_method TEXT DEFAULT 'POST',
  request_headers JSONB,
  request_body JSONB,

  -- Response details
  response_status INTEGER,
  response_body JSONB,
  response_time_ms INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  error_code TEXT,

  -- Location details (for geographic analysis)
  coordinates GEOGRAPHY(POINT, 4326),
  address TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_provider_api_logs_provider ON provider_api_logs(provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_api_logs_success ON provider_api_logs(provider_id, success);
CREATE INDEX IF NOT EXISTS idx_provider_api_logs_created ON provider_api_logs(created_at DESC) WHERE success = false;
CREATE INDEX IF NOT EXISTS idx_provider_api_logs_endpoint ON provider_api_logs(provider_id, endpoint_type, created_at DESC);

-- Comments
COMMENT ON TABLE provider_api_logs IS 'Logs all provider API requests and responses for monitoring, debugging, and performance analysis';
COMMENT ON COLUMN provider_api_logs.endpoint_type IS 'Type of API endpoint called (feasibility, products, coverage, availability)';
COMMENT ON COLUMN provider_api_logs.response_time_ms IS 'Response time in milliseconds';
COMMENT ON COLUMN provider_api_logs.coordinates IS 'Geographic coordinates for the coverage check (if applicable)';

-- =====================================================
-- Update existing provider_configuration with new settings
-- Purpose: Add provider management configuration
-- =====================================================

-- Insert default configuration using existing schema (config_key, config_value)
INSERT INTO provider_configuration (config_key, config_value, description) VALUES
  ('fallback_strategy', '{"type": "sequential", "maxProviders": 3, "timeout": 5000}'::JSONB, 'Provider fallback configuration - sequential checks with 5s timeout'),
  ('default_timeouts', '{"api": 5000, "static": 1000, "cache": 100}'::JSONB, 'Default timeout values in milliseconds for different provider types'),
  ('rate_limits', '{"rpm": 60, "hourly": 1000, "daily": 10000}'::JSONB, 'API rate limit settings to prevent abuse'),
  ('geographic_bounds', '{"north": -22.1, "south": -34.8, "east": 32.9, "west": 16.5}'::JSONB, 'South Africa bounding box for coordinate validation'),
  ('mtn_wholesale_products', '["MNS_10G", "MNS_20G", "MNS_50G", "MNS_100G", "MNS_200G", "MNS_500G", "MNS_1G"]'::JSONB, 'Enabled MTN Wholesale MNS products for feasibility checks')
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  description = EXCLUDED.description,
  updated_at = NOW();

-- =====================================================
-- Alter: fttb_network_providers table
-- Purpose: Add columns for health monitoring and SSO
-- =====================================================

-- Add new columns to existing fttb_network_providers table
ALTER TABLE fttb_network_providers
  ADD COLUMN IF NOT EXISTS last_health_check TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS health_status TEXT CHECK (health_status IN ('healthy', 'degraded', 'down', 'untested')) DEFAULT 'untested',
  ADD COLUMN IF NOT EXISTS success_rate_24h DECIMAL(5, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS avg_response_time_24h INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_successful_check TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sso_config JSONB,
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 99;

-- Comments for new columns
COMMENT ON COLUMN fttb_network_providers.sso_config IS 'SSO configuration (login URL, CAS Ticket, expiry timestamp) for MTN-style SSO authentication';
COMMENT ON COLUMN fttb_network_providers.health_status IS 'Current health status based on recent API calls (healthy >95%, degraded 80-95%, down <80%)';
COMMENT ON COLUMN fttb_network_providers.success_rate_24h IS 'Success rate percentage over last 24 hours calculated from provider_api_logs';
COMMENT ON COLUMN fttb_network_providers.avg_response_time_24h IS 'Average response time in milliseconds over last 24 hours';
COMMENT ON COLUMN fttb_network_providers.priority IS 'Provider priority for fallback logic (1 = highest priority)';

-- =====================================================
-- Data Migration: Insert/Update MTN Provider Configurations
-- =====================================================

-- MTN Wholesale (MNS) - Primary provider for business fibre
INSERT INTO fttb_network_providers (
  name,
  display_name,
  provider_type,
  technology,
  active,
  service_areas,
  priority,
  api_credentials,
  coverage_api_url,
  coverage_api_type,
  sso_config,
  health_status
) VALUES (
  'mtn_wholesale',
  'MTN Wholesale (MNS)',
  'wholesale',
  'FTTB',
  true,
  ARRAY['National'],
  1,
  '{
    "baseUrl": "https://ftool.mtnbusiness.co.za",
    "authMethod": "api_key",
    "apiKey": "bdaacbcae8ab77672e545649df54d0df",
    "rateLimitRpm": 60,
    "timeoutMs": 5000,
    "retryAttempts": 3,
    "retryDelayMs": 1000,
    "customHeaders": {
      "X-API-KEY": "bdaacbcae8ab77672e545649df54d0df",
      "Content-Type": "application/json"
    },
    "endpoints": {
      "feasibility": "/api/v1/feasibility/product/wholesale/mns/bulk",
      "products": "/api/v1/feasibility/product/wholesale/mns"
    }
  }'::JSONB,
  'https://asp-feasibility.mtnbusiness.co.za',
  'api',
  '{
    "enabled": true,
    "loginUrl": "https://asp-feasibility.mtnbusiness.co.za/auth/login",
    "casTicket": null,
    "expiryTimestamp": null,
    "autoRefreshEnabled": true,
    "autoRefreshCron": "0 */6 * * *"
  }'::JSONB,
  'healthy'
) ON CONFLICT (name) DO UPDATE SET
  api_credentials = EXCLUDED.api_credentials,
  sso_config = EXCLUDED.sso_config,
  priority = EXCLUDED.priority,
  coverage_api_url = EXCLUDED.coverage_api_url,
  coverage_api_type = EXCLUDED.coverage_api_type,
  health_status = EXCLUDED.health_status;

-- MTN Business (WMS) - Fallback provider for business services
INSERT INTO fttb_network_providers (
  name,
  display_name,
  provider_type,
  technology,
  active,
  service_areas,
  priority,
  api_credentials,
  coverage_api_url,
  coverage_api_type,
  health_status
) VALUES (
  'mtn_business_wms',
  'MTN Business (WMS)',
  'wholesale',
  'Mixed',
  true,
  ARRAY['National'],
  2,
  '{
    "baseUrl": "https://biz.mtn.co.za/arcgis/rest/services",
    "authMethod": "none",
    "timeoutMs": 5000,
    "retryAttempts": 3,
    "retryDelayMs": 1000,
    "customHeaders": {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Referer": "https://biz.mtn.co.za/",
      "Origin": "https://biz.mtn.co.za"
    },
    "endpoints": {
      "coverage": "/BusinessProduct_Production/MapServer/identify"
    }
  }'::JSONB,
  'https://biz.mtn.co.za/arcgis/rest/services',
  'api',
  'healthy'
) ON CONFLICT (name) DO UPDATE SET
  api_credentials = EXCLUDED.api_credentials,
  priority = EXCLUDED.priority,
  coverage_api_url = EXCLUDED.coverage_api_url,
  coverage_api_type = EXCLUDED.coverage_api_type,
  health_status = EXCLUDED.health_status;

-- MTN Consumer - Final fallback provider for consumer services
INSERT INTO fttb_network_providers (
  name,
  display_name,
  provider_type,
  technology,
  active,
  service_areas,
  priority,
  api_credentials,
  coverage_api_url,
  coverage_api_type,
  health_status
) VALUES (
  'mtn_consumer',
  'MTN Consumer',
  'retail',
  'Mixed',
  true,
  ARRAY['National'],
  3,
  '{
    "baseUrl": "https://supersonic.mtn.co.za/arcgis/rest/services",
    "authMethod": "none",
    "timeoutMs": 3000,
    "retryAttempts": 2,
    "retryDelayMs": 500,
    "customHeaders": {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Referer": "https://supersonic.mtn.co.za/",
      "Origin": "https://supersonic.mtn.co.za"
    },
    "endpoints": {
      "coverage": "/mtnsi/MapServer/identify"
    }
  }'::JSONB,
  'https://supersonic.mtn.co.za/arcgis/rest/services',
  'api',
  'healthy'
) ON CONFLICT (name) DO UPDATE SET
  api_credentials = EXCLUDED.api_credentials,
  priority = EXCLUDED.priority,
  coverage_api_url = EXCLUDED.coverage_api_url,
  coverage_api_type = EXCLUDED.coverage_api_type,
  health_status = EXCLUDED.health_status;

-- =====================================================
-- RLS Policies
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE provider_api_logs ENABLE ROW LEVEL SECURITY;

-- provider_api_logs policies
CREATE POLICY "Admin users can view all API logs"
  ON provider_api_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert API logs"
  ON provider_api_logs
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to calculate provider success rate (last 24 hours)
CREATE OR REPLACE FUNCTION calculate_provider_success_rate_24h(p_provider_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_requests INTEGER;
  successful_requests INTEGER;
  success_rate DECIMAL(5, 2);
BEGIN
  -- Count total requests in last 24 hours
  SELECT COUNT(*) INTO total_requests
  FROM provider_api_logs
  WHERE provider_id = p_provider_id
    AND created_at >= NOW() - INTERVAL '24 hours';

  -- If no requests, return 0
  IF total_requests = 0 THEN
    RETURN 0.00;
  END IF;

  -- Count successful requests
  SELECT COUNT(*) INTO successful_requests
  FROM provider_api_logs
  WHERE provider_id = p_provider_id
    AND created_at >= NOW() - INTERVAL '24 hours'
    AND success = true;

  -- Calculate percentage
  success_rate := (successful_requests::DECIMAL / total_requests::DECIMAL) * 100;

  RETURN ROUND(success_rate, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate average response time (last 24 hours)
CREATE OR REPLACE FUNCTION calculate_provider_avg_response_time_24h(p_provider_id UUID)
RETURNS INTEGER AS $$
DECLARE
  avg_time INTEGER;
BEGIN
  SELECT COALESCE(AVG(response_time_ms)::INTEGER, 0) INTO avg_time
  FROM provider_api_logs
  WHERE provider_id = p_provider_id
    AND created_at >= NOW() - INTERVAL '24 hours'
    AND success = true
    AND response_time_ms IS NOT NULL;

  RETURN avg_time;
END;
$$ LANGUAGE plpgsql;

-- Function to update provider health metrics
CREATE OR REPLACE FUNCTION update_provider_health_metrics(p_provider_id UUID)
RETURNS VOID AS $$
DECLARE
  success_rate DECIMAL(5, 2);
  avg_response_time INTEGER;
  health_status TEXT;
BEGIN
  -- Calculate metrics
  success_rate := calculate_provider_success_rate_24h(p_provider_id);
  avg_response_time := calculate_provider_avg_response_time_24h(p_provider_id);

  -- Determine health status
  IF success_rate >= 95 THEN
    health_status := 'healthy';
  ELSIF success_rate >= 80 THEN
    health_status := 'degraded';
  ELSE
    health_status := 'down';
  END IF;

  -- Update provider
  UPDATE fttb_network_providers
  SET
    success_rate_24h = success_rate,
    avg_response_time_24h = avg_response_time,
    health_status = health_status,
    last_health_check = NOW(),
    last_successful_check = CASE
      WHEN success_rate > 0 THEN (
        SELECT MAX(created_at)
        FROM provider_api_logs
        WHERE provider_id = p_provider_id AND success = true
      )
      ELSE last_successful_check
    END
  WHERE id = p_provider_id;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION calculate_provider_success_rate_24h IS 'Calculates provider API success rate over last 24 hours';
COMMENT ON FUNCTION calculate_provider_avg_response_time_24h IS 'Calculates average API response time over last 24 hours (successful requests only)';
COMMENT ON FUNCTION update_provider_health_metrics IS 'Updates provider health metrics (success rate, avg response time, health status) based on last 24 hours of API logs';

-- =====================================================
-- Indexes for performance
-- =====================================================

-- Index for provider priority sorting (used in fallback logic)
CREATE INDEX IF NOT EXISTS idx_fttb_providers_priority
  ON fttb_network_providers(priority ASC, active DESC)
  WHERE active = true;

-- Index for provider health monitoring
CREATE INDEX IF NOT EXISTS idx_fttb_providers_health
  ON fttb_network_providers(health_status, last_health_check DESC);

-- =====================================================
-- Migration Complete
-- =====================================================

-- Log migration success
DO $$
BEGIN
  RAISE NOTICE 'Provider Health Monitoring migration completed successfully';
  RAISE NOTICE 'Created tables: provider_api_logs';
  RAISE NOTICE 'Updated table: fttb_network_providers (added health columns, sso_config, priority)';
  RAISE NOTICE 'Updated table: provider_configuration (added provider management settings)';
  RAISE NOTICE 'Inserted/Updated configurations: MTN Wholesale, MTN Business WMS, MTN Consumer';
  RAISE NOTICE 'Created helper functions: calculate_provider_success_rate_24h, calculate_provider_avg_response_time_24h, update_provider_health_metrics';
END $$;
