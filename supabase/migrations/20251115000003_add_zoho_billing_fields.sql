-- Add Zoho Billing integration fields to product_integrations table
-- Epic 3.2 - Zoho Billing API Client

-- Add Zoho Billing tracking columns
ALTER TABLE product_integrations
ADD COLUMN IF NOT EXISTS zoho_billing_plan_id TEXT,
ADD COLUMN IF NOT EXISTS zoho_billing_item_id TEXT,
ADD COLUMN IF NOT EXISTS zoho_billing_hardware_item_id TEXT,
ADD COLUMN IF NOT EXISTS zoho_billing_sync_status TEXT CHECK (zoho_billing_sync_status IN ('ok', 'failed', 'pending')),
ADD COLUMN IF NOT EXISTS zoho_billing_last_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS zoho_billing_last_sync_error TEXT;

-- Add index for Zoho Billing plan lookups
CREATE INDEX IF NOT EXISTS idx_product_integrations_zoho_billing_plan
ON product_integrations (zoho_billing_plan_id)
WHERE zoho_billing_plan_id IS NOT NULL;

-- Add index for Zoho Billing item lookups
CREATE INDEX IF NOT EXISTS idx_product_integrations_zoho_billing_item
ON product_integrations (zoho_billing_item_id)
WHERE zoho_billing_item_id IS NOT NULL;

-- Add index for failed Billing syncs (for monitoring)
CREATE INDEX IF NOT EXISTS idx_product_integrations_billing_failed
ON product_integrations (zoho_billing_sync_status, zoho_billing_last_synced_at)
WHERE zoho_billing_sync_status = 'failed';

-- Add comments for documentation
COMMENT ON COLUMN product_integrations.zoho_billing_plan_id IS 'Zoho Billing Plan ID (recurring monthly subscription)';
COMMENT ON COLUMN product_integrations.zoho_billing_item_id IS 'Zoho Billing Item ID (one-time installation fee)';
COMMENT ON COLUMN product_integrations.zoho_billing_hardware_item_id IS 'Zoho Billing Item ID (hardware/router, if applicable)';
COMMENT ON COLUMN product_integrations.zoho_billing_sync_status IS 'Zoho Billing sync status: ok | failed | pending';
COMMENT ON COLUMN product_integrations.zoho_billing_last_synced_at IS 'Timestamp of last successful Zoho Billing sync';
COMMENT ON COLUMN product_integrations.zoho_billing_last_sync_error IS 'Last Zoho Billing sync error message (if failed)';
