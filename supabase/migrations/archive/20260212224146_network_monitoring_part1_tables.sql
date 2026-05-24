-- Part 1: Core Tables (Run First)
-- Network Monitoring System

-- Provider Health Status
CREATE TABLE IF NOT EXISTS provider_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('up', 'degraded', 'down', 'maintenance')),
  latency_ms INTEGER,
  packet_loss_percent DECIMAL(5,2),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_source TEXT DEFAULT 'cron',
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer Connection Events
CREATE TABLE IF NOT EXISTS customer_connection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_service_id UUID REFERENCES customer_services(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('connected', 'disconnected', 'reconnected', 'failed')),
  terminate_cause TEXT,
  ip_address INET,
  nas_ip_address INET,
  session_duration_seconds INTEGER,
  source TEXT DEFAULT 'webhook',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Network Health Checks
CREATE TABLE IF NOT EXISTS network_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type TEXT NOT NULL,
  target TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'timeout')),
  response_time_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);
