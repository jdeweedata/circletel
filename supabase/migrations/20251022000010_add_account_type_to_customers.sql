-- Add account_type column to customers table
-- This was causing 500 errors during customer creation
-- Created: 2025-10-22

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'personal'
CHECK (account_type IN ('personal', 'business'));

-- Add comment
COMMENT ON COLUMN customers.account_type IS 'Type of customer account: personal or business';

-- Update existing rows to have default value
UPDATE customers
SET account_type = 'personal'
WHERE account_type IS NULL;

-- Make it NOT NULL after setting defaults
ALTER TABLE customers
ALTER COLUMN account_type SET NOT NULL;
