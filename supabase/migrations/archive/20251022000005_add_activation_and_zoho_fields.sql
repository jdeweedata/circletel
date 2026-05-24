-- Migration: Add Service Activation and Zoho Integration Fields
-- Date: 2025-10-22
-- Purpose: Support service activation workflow with Zoho CRM, Books, and Billing integration

-- Add activation and Zoho integration fields to consumer_orders table
ALTER TABLE consumer_orders
ADD COLUMN IF NOT EXISTS account_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS service_start_date DATE,
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS zoho_crm_contact_id TEXT,
ADD COLUMN IF NOT EXISTS zoho_books_customer_id TEXT,
ADD COLUMN IF NOT EXISTS zoho_books_invoice_id TEXT,
ADD COLUMN IF NOT EXISTS zoho_billing_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS router_fee DECIMAL(10, 2) DEFAULT 0;

-- Add index on account_number for fast lookups
CREATE INDEX IF NOT EXISTS idx_consumer_orders_account_number
ON consumer_orders(account_number);

-- Add index on Zoho IDs for integration queries
CREATE INDEX IF NOT EXISTS idx_consumer_orders_zoho_crm_contact
ON consumer_orders(zoho_crm_contact_id);

CREATE INDEX IF NOT EXISTS idx_consumer_orders_zoho_books_customer
ON consumer_orders(zoho_books_customer_id);

-- Add comments for documentation
COMMENT ON COLUMN consumer_orders.account_number IS
'Unique customer account number (format: CT-YYYYMMDD-XXXXX)';

COMMENT ON COLUMN consumer_orders.service_start_date IS
'Date when the service was officially activated';

COMMENT ON COLUMN consumer_orders.activated_at IS
'Timestamp when the activation workflow completed';

COMMENT ON COLUMN consumer_orders.zoho_crm_contact_id IS
'Zoho CRM Contact ID for customer relationship management';

COMMENT ON COLUMN consumer_orders.zoho_books_customer_id IS
'Zoho Books Customer ID for billing and invoicing';

COMMENT ON COLUMN consumer_orders.zoho_books_invoice_id IS
'Zoho Books Invoice ID for installation/setup invoice';

COMMENT ON COLUMN consumer_orders.zoho_billing_subscription_id IS
'Zoho Billing Subscription ID for recurring monthly billing';

COMMENT ON COLUMN consumer_orders.router_fee IS
'One-time router/equipment fee charged to customer';

-- Create or replace function to auto-generate account number
CREATE OR REPLACE FUNCTION generate_account_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_account_number TEXT;
  date_part TEXT;
  random_part TEXT;
  attempts INT := 0;
  max_attempts INT := 10;
BEGIN
  -- Generate date part (YYYYMMDD)
  date_part := to_char(CURRENT_DATE, 'YYYYMMDD');

  -- Loop until we find a unique account number
  LOOP
    attempts := attempts + 1;

    -- Generate 5-character random alphanumeric code
    -- Excludes confusing characters (0, O, 1, I)
    random_part := array_to_string(
      ARRAY(
        SELECT substring('ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        FROM (ceil(random()*32))::int FOR 1)
        FROM generate_series(1, 5)
      ),
      ''
    );

    -- Construct account number
    new_account_number := 'CT-' || date_part || '-' || random_part;

    -- Check if it already exists
    IF NOT EXISTS (SELECT 1 FROM consumer_orders WHERE account_number = new_account_number) THEN
      RETURN new_account_number;
    END IF;

    -- Safety check to prevent infinite loop
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique account number after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION generate_account_number() IS
'Generates a unique account number in format CT-YYYYMMDD-XXXXX';

-- Optional: Create trigger to auto-generate account number on activation
-- (Currently handled by API, but this can be used as fallback)
CREATE OR REPLACE FUNCTION set_account_number_on_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If status changed to 'active' and account_number is not set
  IF NEW.status = 'active' AND (NEW.account_number IS NULL OR NEW.account_number = '') THEN
    NEW.account_number := generate_account_number();
    NEW.activated_at := COALESCE(NEW.activated_at, NOW());
    NEW.service_start_date := COALESCE(NEW.service_start_date, CURRENT_DATE);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger (optional - can be enabled if needed)
-- DROP TRIGGER IF EXISTS trigger_set_account_number ON consumer_orders;
-- CREATE TRIGGER trigger_set_account_number
--   BEFORE UPDATE ON consumer_orders
--   FOR EACH ROW
--   WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'active')
--   EXECUTE FUNCTION set_account_number_on_activation();

-- Validation: Check that migration was successful
DO $$
BEGIN
  -- Check if all columns were added
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consumer_orders' AND column_name = 'account_number'
  ) THEN
    RAISE EXCEPTION 'Migration failed: account_number column not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consumer_orders' AND column_name = 'zoho_crm_contact_id'
  ) THEN
    RAISE EXCEPTION 'Migration failed: zoho_crm_contact_id column not created';
  END IF;

  RAISE NOTICE 'Migration completed successfully: Service activation and Zoho integration fields added';
END $$;
