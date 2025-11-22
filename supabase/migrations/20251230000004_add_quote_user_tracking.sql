-- Migration: Add user tracking columns to business_quotes
-- Date: 2025-11-10
-- Purpose: Add rejected_by and updated_by columns for complete audit trail

-- Add rejected_by column (tracks who rejected the quote)
ALTER TABLE business_quotes
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES admin_users(id);

-- Add updated_by column (tracks who last updated the quote)
ALTER TABLE business_quotes
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES admin_users(id);

-- Add comments for documentation
COMMENT ON COLUMN business_quotes.rejected_by IS
'Admin user who rejected this quote. NULL if not rejected or auto-rejected.';

COMMENT ON COLUMN business_quotes.updated_by IS
'Admin user who last updated this quote. Tracks all modifications for audit trail.';

-- Create index for performance (querying quotes by who rejected/updated them)
CREATE INDEX IF NOT EXISTS idx_business_quotes_rejected_by
ON business_quotes(rejected_by)
WHERE rejected_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_business_quotes_updated_by
ON business_quotes(updated_by)
WHERE updated_by IS NOT NULL;

-- Analyze table to update query planner statistics
ANALYZE business_quotes;
