-- Add business-related fields to customers table
-- These fields are used for business account customers

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_registration VARCHAR(100),
ADD COLUMN IF NOT EXISTS tax_number VARCHAR(100);

-- Add indexes for business fields
CREATE INDEX IF NOT EXISTS idx_customers_business_name ON customers(business_name) WHERE business_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_business_registration ON customers(business_registration) WHERE business_registration IS NOT NULL;

-- Add comments
COMMENT ON COLUMN customers.business_name IS 'Business/company name for business accounts';
COMMENT ON COLUMN customers.business_registration IS 'Business registration number (e.g., CK number in South Africa)';
COMMENT ON COLUMN customers.tax_number IS 'Tax number (e.g., VAT number in South Africa)';
