-- Migration: Create MTN Business Deals Table
-- Description: Store MTN device + service bundle deals from Helios/iLula platforms
-- Date: 2025-11-04
-- Source: Helios and iLula Business Promos - Oct 2025 - Deals.xlsx

-- Create mtn_business_deals table
CREATE TABLE IF NOT EXISTS mtn_business_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Deal identification
  deal_id TEXT UNIQUE NOT NULL,
  deal_name TEXT NOT NULL,
  
  -- Device information
  device_name TEXT,
  device_category TEXT DEFAULT 'smartphone',
  device_status TEXT,
  
  -- Service package information
  price_plan TEXT NOT NULL,
  tariff_code TEXT,
  package_code TEXT,
  package_description TEXT,
  tariff_description TEXT,
  
  -- Contract terms
  contract_term INTEGER NOT NULL CHECK (contract_term IN (1, 3, 6, 12, 18, 24, 36)),
  
  -- Pricing (all in ZAR)
  monthly_price_incl_vat DECIMAL(10,2) NOT NULL,
  monthly_price_ex_vat DECIMAL(10,2) NOT NULL,
  device_payment_incl_vat DECIMAL(10,2) DEFAULT 0,
  
  -- Data & bundles
  total_data TEXT,
  data_bundle TEXT,
  total_minutes TEXT,
  anytime_minute_bundle TEXT,
  onnet_minute_bundle TEXT,
  sms_bundle TEXT,
  bundle_description TEXT,
  
  -- Inclusive price plan features
  inclusive_data TEXT,
  inclusive_minutes TEXT,
  inclusive_sms TEXT,
  inclusive_onnet_minutes TEXT,
  inclusive_ingroup_calling TEXT,
  
  -- Freebies
  free_sim BOOLEAN DEFAULT false,
  free_cli BOOLEAN DEFAULT false,
  free_itb BOOLEAN DEFAULT false,
  freebie_devices TEXT,
  freebie_priceplan TEXT,
  
  -- Availability & Channels
  available_helios BOOLEAN DEFAULT true,
  available_ilula BOOLEAN DEFAULT true,
  channel_visibility TEXT,
  device_range_applicability TEXT,
  
  -- Inventory
  inventory_status_main TEXT,
  inventory_status_freebie TEXT,
  
  -- Promotion dates
  promo_start_date DATE,
  promo_end_date DATE,
  
  -- Status
  active BOOLEAN DEFAULT true,
  
  -- Link to service_packages (optional - for future linking)
  service_package_id UUID REFERENCES service_packages(id),
  
  -- Metadata
  metadata JSONB,
  
  -- Audit timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_mtn_deals_deal_id ON mtn_business_deals(deal_id);
CREATE INDEX idx_mtn_deals_price_plan ON mtn_business_deals(price_plan);
CREATE INDEX idx_mtn_deals_device ON mtn_business_deals(device_name);
CREATE INDEX idx_mtn_deals_contract ON mtn_business_deals(contract_term);
CREATE INDEX idx_mtn_deals_active ON mtn_business_deals(active) WHERE active = true;
CREATE INDEX idx_mtn_deals_availability ON mtn_business_deals(available_helios, available_ilula) WHERE active = true;
CREATE INDEX idx_mtn_deals_promo_dates ON mtn_business_deals(promo_start_date, promo_end_date);
CREATE INDEX idx_mtn_deals_pricing ON mtn_business_deals(monthly_price_incl_vat);

-- Full text search index on device name and price plan
CREATE INDEX idx_mtn_deals_search ON mtn_business_deals USING gin(
  to_tsvector('english', 
    COALESCE(device_name, '') || ' ' || 
    COALESCE(price_plan, '') || ' ' || 
    COALESCE(deal_name, '')
  )
);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_mtn_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mtn_deals_updated_at
  BEFORE UPDATE ON mtn_business_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_mtn_deals_updated_at();

-- RLS Policies
ALTER TABLE mtn_business_deals ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read active deals
CREATE POLICY "Allow authenticated users to read active deals"
  ON mtn_business_deals
  FOR SELECT
  TO authenticated
  USING (active = true);

-- Allow service role full access
CREATE POLICY "Service role has full access to deals"
  ON mtn_business_deals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admin users can manage all deals
CREATE POLICY "Admin users can manage deals"
  ON mtn_business_deals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

-- Comments for documentation
COMMENT ON TABLE mtn_business_deals IS 'MTN business deals combining devices with service packages from Helios/iLula platforms';
COMMENT ON COLUMN mtn_business_deals.deal_id IS 'Unique deal identifier from MTN (e.g., 202508EBU2726)';
COMMENT ON COLUMN mtn_business_deals.device_name IS 'Device model name (e.g., Samsung Galaxy S25, Oppo Reno 14)';
COMMENT ON COLUMN mtn_business_deals.price_plan IS 'MTN price plan name (e.g., Made For Business M, My MTN Sky Gold)';
COMMENT ON COLUMN mtn_business_deals.contract_term IS 'Contract duration in months (1, 3, 6, 12, 18, 24, or 36)';
COMMENT ON COLUMN mtn_business_deals.monthly_price_incl_vat IS 'Monthly subscription price including 15% VAT';
COMMENT ON COLUMN mtn_business_deals.device_payment_incl_vat IS 'Once-off device payment including VAT';
COMMENT ON COLUMN mtn_business_deals.available_helios IS 'Deal available on Helios platform';
COMMENT ON COLUMN mtn_business_deals.available_ilula IS 'Deal available on iLula platform';
COMMENT ON COLUMN mtn_business_deals.promo_start_date IS 'Promotion start date';
COMMENT ON COLUMN mtn_business_deals.promo_end_date IS 'Promotion end date (deals expire after this)';
