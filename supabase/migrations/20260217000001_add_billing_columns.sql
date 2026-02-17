-- Add billing columns to customer_services for monthly invoice generation
-- billing_day: Day of month to generate invoice (1-28)
-- last_invoice_date: Prevents duplicate billing in same month

ALTER TABLE customer_services
ADD COLUMN IF NOT EXISTS billing_day INTEGER DEFAULT 1
CHECK (billing_day >= 1 AND billing_day <= 28);

ALTER TABLE customer_services
ADD COLUMN IF NOT EXISTS last_invoice_date DATE;

-- Note: service_id column already exists on customer_invoices (added in earlier migration)
-- Skipping: ALTER TABLE customer_invoices ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES customer_services(id);

-- Index for efficient billing queries
CREATE INDEX IF NOT EXISTS idx_customer_services_billing
ON customer_services(status, billing_day)
WHERE status = 'active';

COMMENT ON COLUMN customer_services.billing_day IS 'Day of month (1-28) to generate invoice';
COMMENT ON COLUMN customer_services.last_invoice_date IS 'Date of last invoice to prevent duplicate billing';
