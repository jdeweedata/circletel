-- Migration: Add retry tracking fields to product_integrations
-- Epic 2.5 - Enhanced sync failure handling + retries

-- Add retry tracking columns
ALTER TABLE product_integrations
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sync_error_details JSONB;

-- Create index for efficient retry queue queries
CREATE INDEX IF NOT EXISTS idx_product_integrations_retry_queue
ON product_integrations (next_retry_at, sync_status)
WHERE sync_status = 'failed' AND next_retry_at IS NOT NULL;

-- Add comment explaining the retry logic
COMMENT ON COLUMN product_integrations.retry_count IS 'Number of retry attempts made (0 = never retried, max 5)';
COMMENT ON COLUMN product_integrations.next_retry_at IS 'Timestamp when next retry should be attempted (NULL if no retry scheduled)';
COMMENT ON COLUMN product_integrations.last_retry_at IS 'Timestamp of last retry attempt';
COMMENT ON COLUMN product_integrations.sync_error_details IS 'Structured error details: { message, code, payload, stack }';

-- Update existing failed records to have retry scheduled
UPDATE product_integrations
SET
  next_retry_at = NOW() + INTERVAL '5 minutes',
  retry_count = 0
WHERE
  sync_status = 'failed'
  AND next_retry_at IS NULL;
