-- Migration: Create product_integrations table for Zoho catalogue sync
-- Date: 2025-11-15
-- Purpose: Store Zoho IDs and sync metadata for service_packages

-- Create product_integrations table
CREATE TABLE IF NOT EXISTS product_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_product_id UUID REFERENCES admin_products(id),
  service_package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,

  -- Zoho identifiers
  zoho_crm_product_id TEXT,
  zoho_billing_item_id TEXT,
  zoho_billing_plan_id TEXT,

  -- Sync status metadata
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'ok', 'failed')),
  last_synced_at TIMESTAMPTZ,
  last_sync_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_product_integration_service_package UNIQUE(service_package_id)
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_product_integrations_admin_product_id
  ON product_integrations(admin_product_id);

CREATE INDEX IF NOT EXISTS idx_product_integrations_service_package_id
  ON product_integrations(service_package_id);

CREATE INDEX IF NOT EXISTS idx_product_integrations_sync_status
  ON product_integrations(sync_status);

-- Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION update_product_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_product_integrations_updated_at
  BEFORE UPDATE ON product_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_product_integrations_updated_at();

-- Enable RLS and restrict direct access to admins
ALTER TABLE product_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view product integrations"
  ON product_integrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Service can insert product integrations"
  ON product_integrations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update product integrations"
  ON product_integrations FOR UPDATE
  USING (true);

CREATE POLICY "Admin users can delete product integrations"
  ON product_integrations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Comments for documentation
COMMENT ON TABLE product_integrations IS 'Mapping between CircleTel service_packages/admin_products and Zoho CRM/Billing entities';
COMMENT ON COLUMN product_integrations.admin_product_id IS 'Source admin_products.id for this offering (ProductSpecification)';
COMMENT ON COLUMN product_integrations.service_package_id IS 'Runtime service_packages.id for this offering (ProductOffering)';
COMMENT ON COLUMN product_integrations.zoho_crm_product_id IS 'Zoho CRM Product ID linked to this service package';
COMMENT ON COLUMN product_integrations.zoho_billing_item_id IS 'Zoho Billing Item ID linked to this service package';
COMMENT ON COLUMN product_integrations.zoho_billing_plan_id IS 'Zoho Billing Plan ID linked to this service package';
COMMENT ON COLUMN product_integrations.sync_status IS 'Zoho sync status: pending, ok, or failed';
COMMENT ON COLUMN product_integrations.last_synced_at IS 'Timestamp of last attempt to sync this product to Zoho';
COMMENT ON COLUMN product_integrations.last_sync_error IS 'Last sync error message, if any';
