-- Add account_type column to customers table
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'personal' CHECK (account_type IN ('personal', 'business'));

-- Add index for account_type
CREATE INDEX IF NOT EXISTS idx_customers_account_type ON public.customers(account_type);

-- Add business-specific fields for future use
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_registration VARCHAR(100),
ADD COLUMN IF NOT EXISTS tax_number VARCHAR(50);

-- Comment
COMMENT ON COLUMN public.customers.account_type IS 'Type of account: personal or business';
COMMENT ON COLUMN public.customers.business_name IS 'Business name (for business accounts)';
COMMENT ON COLUMN public.customers.business_registration IS 'Business registration number';
COMMENT ON COLUMN public.customers.tax_number IS 'Tax/VAT number for business accounts';
