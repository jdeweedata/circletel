-- Add 'internal_test' account type for admin/testing customer accounts
-- This allows marking admin user accounts that were created as customers
-- for testing purposes, excluding them from ZOHO Billing sync
-- Created: 2025-11-20

-- Drop existing CHECK constraint
ALTER TABLE customers
DROP CONSTRAINT IF EXISTS customers_account_type_check;

-- Add new CHECK constraint with internal_test option
ALTER TABLE customers
ADD CONSTRAINT customers_account_type_check
CHECK (account_type IN ('personal', 'business', 'internal_test'));

-- Add comment
COMMENT ON COLUMN customers.account_type IS 'Type of customer account: personal, business, or internal_test (for admin/testing accounts)';
