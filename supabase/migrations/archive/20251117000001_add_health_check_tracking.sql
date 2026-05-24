-- Migration: Add health check tracking columns to integration_registry
-- Created: 2025-11-17
-- Purpose: Support automated 30-minute health check cron job with alert safeguards

-- Add health check tracking columns
ALTER TABLE integration_registry
ADD COLUMN consecutive_failures INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN last_alert_sent_at TIMESTAMPTZ,
ADD COLUMN health_check_interval_minutes INTEGER DEFAULT 30 NOT NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN integration_registry.consecutive_failures IS 'Number of consecutive health check failures (resets to 0 on success). Alert triggered at 3 failures.';
COMMENT ON COLUMN integration_registry.last_alert_sent_at IS 'Timestamp of last alert sent for this integration. Used to suppress duplicate alerts (max 1 per 6 hours).';
COMMENT ON COLUMN integration_registry.health_check_interval_minutes IS 'How often to check this integration (in minutes). Default: 30 minutes.';

-- Create index for efficient health check queries
-- This index helps the cron job quickly find integrations that need checking
CREATE INDEX idx_integration_health_status_active
ON integration_registry(health_status, is_active)
WHERE is_active = true;

-- Create index for alert suppression queries
CREATE INDEX idx_integration_last_alert
ON integration_registry(last_alert_sent_at)
WHERE last_alert_sent_at IS NOT NULL;
