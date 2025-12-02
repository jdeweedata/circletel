-- Migration: Create MTN Dealer Products Management System
-- Description: Manages MTN Business deals from Arlan Communications dealer network
-- Date: 2025-12-01
-- Purpose: Track deals, calculate commissions, manage product lifecycle

-- ============================================
-- MTN DEALER PRODUCTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS mtn_dealer_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Deal Identification (from MTN/Arlan)
  deal_id TEXT NOT NULL UNIQUE,                    -- e.g., "202304EBU8028"
  eppix_package TEXT,                              -- e.g., "V9917"
  eppix_tariff TEXT,                               -- e.g., "NOJ_23"
  
  -- Product Classification
  price_plan TEXT NOT NULL,                        -- e.g., "Made For Business M+"
  package_description TEXT,
  tariff_description TEXT,
  
  -- Technology Classification
  technology TEXT NOT NULL CHECK (technology IN ('LTE', '5G', 'LTE/5G')),
  
  -- Contract Terms
  contract_term INTEGER NOT NULL CHECK (contract_term IN (0, 12, 24, 36)),  -- 0 = month-to-month
  contract_term_label TEXT GENERATED ALWAYS AS (
    CASE contract_term
      WHEN 0 THEN 'Month-to-Month'
      WHEN 12 THEN '12 Months'
      WHEN 24 THEN '24 Months'
      WHEN 36 THEN '36 Months'
    END
  ) STORED,
  
  -- Device Information
  has_device BOOLEAN NOT NULL DEFAULT false,
  device_name TEXT,                                -- e.g., "Apple iPhone 16 Pro (256GB)"
  device_status TEXT CHECK (device_status IN ('Available', 'Out of Stock', 'EOL', 'CTB')),
  once_off_pay_in_incl_vat DECIMAL(10, 2) DEFAULT 0,  -- Device contribution
  
  -- Pricing (from MTN)
  mtn_price_incl_vat DECIMAL(10, 2) NOT NULL,      -- MTN's price incl VAT
  mtn_price_excl_vat DECIMAL(10, 2) NOT NULL,      -- MTN's price excl VAT
  
  -- CircleTel Markup
  markup_type TEXT CHECK (markup_type IN ('percentage', 'fixed')) DEFAULT 'percentage',
  markup_value DECIMAL(10, 2) DEFAULT 0,           -- e.g., 10 for 10% or R50
  
  -- Calculated Selling Price
  selling_price_excl_vat DECIMAL(10, 2) GENERATED ALWAYS AS (
    CASE markup_type
      WHEN 'percentage' THEN mtn_price_excl_vat * (1 + markup_value / 100)
      WHEN 'fixed' THEN mtn_price_excl_vat + markup_value
      ELSE mtn_price_excl_vat
    END
  ) STORED,
  selling_price_incl_vat DECIMAL(10, 2) GENERATED ALWAYS AS (
    CASE markup_type
      WHEN 'percentage' THEN mtn_price_excl_vat * (1 + markup_value / 100) * 1.15
      WHEN 'fixed' THEN (mtn_price_excl_vat + markup_value) * 1.15
      ELSE mtn_price_excl_vat * 1.15
    END
  ) STORED,
  
  -- Bundle Information
  data_bundle TEXT,                                -- e.g., "20.0GB"
  data_bundle_gb DECIMAL(10, 2),                   -- Numeric value for filtering
  anytime_minutes TEXT,                            -- e.g., "500min"
  anytime_minutes_value INTEGER,                   -- Numeric value
  on_net_minutes TEXT,
  on_net_minutes_value INTEGER,
  sms_bundle TEXT,
  sms_bundle_value INTEGER,
  
  -- Inclusive Price Plan Benefits
  inclusive_minutes TEXT,
  inclusive_data TEXT,
  inclusive_sms TEXT,
  inclusive_in_group_calling TEXT,
  inclusive_on_net_minutes TEXT,
  
  -- Freebies
  freebies_device TEXT,
  freebies_priceplan TEXT,
  free_sim BOOLEAN DEFAULT false,
  free_cli BOOLEAN DEFAULT false,
  free_itb BOOLEAN DEFAULT false,
  
  -- Deal Period
  promo_start_date DATE,
  promo_end_date DATE,
  -- Note: is_current_deal is computed in views, not as a generated column (CURRENT_DATE is not immutable)
  
  -- Channel Availability
  channel TEXT DEFAULT 'EBU All',
  available_on_helios BOOLEAN DEFAULT false,
  available_on_ilula BOOLEAN DEFAULT false,
  
  -- Commission Structure (from Arlan contract)
  commission_tier TEXT GENERATED ALWAYS AS (
    CASE
      WHEN mtn_price_incl_vat < 100 THEN 'R0-R99.99'
      WHEN mtn_price_incl_vat < 200 THEN 'R100-R199.99'
      WHEN mtn_price_incl_vat < 300 THEN 'R200-R299.99'
      WHEN mtn_price_incl_vat < 500 THEN 'R300-R499.99'
      WHEN mtn_price_incl_vat < 1000 THEN 'R500-R999.99'
      WHEN mtn_price_incl_vat < 2000 THEN 'R1000-R1999.99'
      ELSE 'R2000+'
    END
  ) STORED,
  mtn_commission_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE
      WHEN mtn_price_incl_vat < 100 THEN 4.75
      WHEN mtn_price_incl_vat < 200 THEN 5.75
      WHEN mtn_price_incl_vat < 300 THEN 7.25
      WHEN mtn_price_incl_vat < 500 THEN 8.75
      WHEN mtn_price_incl_vat < 1000 THEN 9.75
      WHEN mtn_price_incl_vat < 2000 THEN 11.75
      ELSE 13.75
    END
  ) STORED,
  circletel_commission_share DECIMAL(5, 2) DEFAULT 30.00,  -- 30% of MTN commission
  
  -- Product Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'inactive', 'archived')),
  inventory_status TEXT DEFAULT 'Available',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  import_batch_id TEXT,                            -- Track which import this came from
  source_file TEXT,                                -- Original source file
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),
  updated_by UUID REFERENCES admin_users(id)
);

-- ============================================
-- COMMISSION CALCULATION VIEW
-- ============================================

CREATE OR REPLACE VIEW v_mtn_dealer_commission_calculator AS
SELECT
  id,
  deal_id,
  price_plan,
  device_name,
  technology,
  contract_term,
  contract_term_label,
  has_device,
  
  -- Pricing
  mtn_price_incl_vat,
  mtn_price_excl_vat,
  markup_type,
  markup_value,
  selling_price_excl_vat,
  selling_price_incl_vat,
  
  -- Commission Calculation
  commission_tier,
  mtn_commission_rate,
  circletel_commission_share,
  
  -- Total Contract Value
  (mtn_price_incl_vat * contract_term) AS total_contract_value,
  
  -- MTN Commission (to Arlan)
  (mtn_price_incl_vat * contract_term * mtn_commission_rate / 100) AS mtn_commission_to_arlan,
  
  -- CircleTel Commission (30% of MTN commission)
  (mtn_price_incl_vat * contract_term * mtn_commission_rate / 100 * circletel_commission_share / 100) AS circletel_commission,
  
  -- CircleTel Commission Incl VAT
  (mtn_price_incl_vat * contract_term * mtn_commission_rate / 100 * circletel_commission_share / 100 * 1.15) AS circletel_commission_incl_vat,
  
  -- Effective Rate (CircleTel's % of total contract)
  (mtn_commission_rate * circletel_commission_share / 100) AS effective_commission_rate,
  
  -- Bundles
  data_bundle,
  anytime_minutes,
  sms_bundle,
  
  -- Status
  status,
  promo_start_date,
  promo_end_date,
  
  -- Computed: is deal currently active?
  (promo_start_date <= CURRENT_DATE AND (promo_end_date IS NULL OR promo_end_date >= CURRENT_DATE)) AS is_current_deal
  
FROM mtn_dealer_products
WHERE status = 'active';

-- ============================================
-- PRODUCT CATEGORIES VIEW (for filtering)
-- ============================================

CREATE OR REPLACE VIEW v_mtn_dealer_product_categories AS
SELECT DISTINCT
  technology,
  contract_term,
  contract_term_label,
  has_device,
  CASE WHEN has_device THEN 'With Device' ELSE 'SIM Only' END AS device_category,
  commission_tier,
  COUNT(*) AS product_count,
  MIN(mtn_price_incl_vat) AS min_price,
  MAX(mtn_price_incl_vat) AS max_price,
  AVG(mtn_price_incl_vat) AS avg_price
FROM mtn_dealer_products
WHERE status = 'active'
GROUP BY technology, contract_term, contract_term_label, has_device, commission_tier
ORDER BY technology, contract_term, has_device;

-- ============================================
-- DEAL PERIOD SUMMARY VIEW
-- ============================================

CREATE OR REPLACE VIEW v_mtn_dealer_deal_periods AS
SELECT
  promo_start_date,
  promo_end_date,
  COUNT(*) AS deal_count,
  COUNT(*) FILTER (WHERE promo_start_date <= CURRENT_DATE AND (promo_end_date IS NULL OR promo_end_date >= CURRENT_DATE)) AS active_deals,
  COUNT(*) FILTER (WHERE has_device) AS deals_with_device,
  COUNT(*) FILTER (WHERE NOT has_device) AS sim_only_deals,
  MIN(mtn_price_incl_vat) AS min_price,
  MAX(mtn_price_incl_vat) AS max_price
FROM mtn_dealer_products
WHERE status = 'active'
GROUP BY promo_start_date, promo_end_date
ORDER BY promo_start_date DESC;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_mtn_dealer_products_deal_id ON mtn_dealer_products(deal_id);
CREATE INDEX IF NOT EXISTS idx_mtn_dealer_products_technology ON mtn_dealer_products(technology);
CREATE INDEX IF NOT EXISTS idx_mtn_dealer_products_contract_term ON mtn_dealer_products(contract_term);
CREATE INDEX IF NOT EXISTS idx_mtn_dealer_products_has_device ON mtn_dealer_products(has_device);
CREATE INDEX IF NOT EXISTS idx_mtn_dealer_products_status ON mtn_dealer_products(status);
CREATE INDEX IF NOT EXISTS idx_mtn_dealer_products_price ON mtn_dealer_products(mtn_price_incl_vat);
CREATE INDEX IF NOT EXISTS idx_mtn_dealer_products_promo_dates ON mtn_dealer_products(promo_start_date, promo_end_date);
CREATE INDEX IF NOT EXISTS idx_mtn_dealer_products_device_name ON mtn_dealer_products(device_name) WHERE device_name IS NOT NULL;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE mtn_dealer_products ENABLE ROW LEVEL SECURITY;

-- Public can view active products
CREATE POLICY "public_view_active_mtn_dealer_products"
  ON mtn_dealer_products FOR SELECT
  USING (status = 'active');

-- Admins can manage all products
CREATE POLICY "admins_manage_mtn_dealer_products"
  ON mtn_dealer_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role_template_id IN (
        SELECT id FROM role_templates
        WHERE name IN ('Super Administrator', 'Product Manager', 'Sales Manager')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role_template_id IN (
        SELECT id FROM role_templates
        WHERE name IN ('Super Administrator', 'Product Manager', 'Sales Manager')
      )
    )
  );

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_mtn_dealer_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mtn_dealer_products_updated_at
  BEFORE UPDATE ON mtn_dealer_products
  FOR EACH ROW
  EXECUTE FUNCTION update_mtn_dealer_products_updated_at();

-- ============================================
-- HELPER FUNCTION: Parse bundle values
-- ============================================

CREATE OR REPLACE FUNCTION parse_bundle_value(bundle_text TEXT)
RETURNS DECIMAL AS $$
BEGIN
  IF bundle_text IS NULL OR bundle_text = '' THEN
    RETURN 0;
  END IF;
  
  -- Extract numeric value from strings like "20.0GB", "500min", "100sms"
  RETURN COALESCE(
    (regexp_match(bundle_text, '([0-9]+\.?[0-9]*)'))[1]::DECIMAL,
    0
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- HELPER FUNCTION: Calculate commission for a deal
-- ============================================

CREATE OR REPLACE FUNCTION calculate_mtn_dealer_commission(
  p_deal_id TEXT,
  p_quantity INTEGER DEFAULT 1
)
RETURNS TABLE (
  deal_id TEXT,
  price_plan TEXT,
  contract_term INTEGER,
  monthly_subscription DECIMAL,
  total_contract_value DECIMAL,
  mtn_commission_rate DECIMAL,
  mtn_commission_to_arlan DECIMAL,
  circletel_share_rate DECIMAL,
  circletel_commission DECIMAL,
  circletel_commission_incl_vat DECIMAL,
  quantity INTEGER,
  total_circletel_commission DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.deal_id,
    p.price_plan,
    p.contract_term,
    p.mtn_price_incl_vat AS monthly_subscription,
    (p.mtn_price_incl_vat * p.contract_term) AS total_contract_value,
    p.mtn_commission_rate,
    (p.mtn_price_incl_vat * p.contract_term * p.mtn_commission_rate / 100) AS mtn_commission_to_arlan,
    p.circletel_commission_share AS circletel_share_rate,
    (p.mtn_price_incl_vat * p.contract_term * p.mtn_commission_rate / 100 * p.circletel_commission_share / 100) AS circletel_commission,
    (p.mtn_price_incl_vat * p.contract_term * p.mtn_commission_rate / 100 * p.circletel_commission_share / 100 * 1.15) AS circletel_commission_incl_vat,
    p_quantity AS quantity,
    (p.mtn_price_incl_vat * p.contract_term * p.mtn_commission_rate / 100 * p.circletel_commission_share / 100 * p_quantity) AS total_circletel_commission
  FROM mtn_dealer_products p
  WHERE p.deal_id = p_deal_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- AUDIT LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS mtn_dealer_product_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES mtn_dealer_products(id) ON DELETE SET NULL,
  deal_id TEXT,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'import', 'status_change', 'price_change')),
  changes JSONB,
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  performed_by UUID REFERENCES admin_users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mtn_dealer_audit_product_id ON mtn_dealer_product_audit_log(product_id);
CREATE INDEX IF NOT EXISTS idx_mtn_dealer_audit_deal_id ON mtn_dealer_product_audit_log(deal_id);
CREATE INDEX IF NOT EXISTS idx_mtn_dealer_audit_action ON mtn_dealer_product_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_mtn_dealer_audit_performed_at ON mtn_dealer_product_audit_log(performed_at);

-- ============================================
-- IMPORT BATCH TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS mtn_dealer_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT NOT NULL UNIQUE,
  source_file TEXT NOT NULL,
  import_date TIMESTAMPTZ DEFAULT NOW(),
  total_records INTEGER,
  imported_records INTEGER,
  skipped_records INTEGER,
  error_records INTEGER,
  errors JSONB,
  imported_by UUID REFERENCES admin_users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE mtn_dealer_products IS 'MTN Business dealer products from Arlan Communications (Helios/iLula deals)';
COMMENT ON COLUMN mtn_dealer_products.deal_id IS 'Unique deal identifier from MTN/Arlan system';
COMMENT ON COLUMN mtn_dealer_products.technology IS 'Network technology: LTE, 5G, or LTE/5G';
COMMENT ON COLUMN mtn_dealer_products.contract_term IS 'Contract duration in months (0 = month-to-month)';
COMMENT ON COLUMN mtn_dealer_products.mtn_commission_rate IS 'MTN commission rate to Arlan based on subscription tier';
COMMENT ON COLUMN mtn_dealer_products.circletel_commission_share IS 'CircleTel share of MTN commission (default 30% per Arlan contract)';
COMMENT ON VIEW v_mtn_dealer_commission_calculator IS 'Pre-calculated commission values for all active MTN dealer products';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
