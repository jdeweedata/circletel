-- Migration: Add Product-Specific Commission Models
-- Description: Implements margin-share and flexible commission models for different product lines
-- Date: 2025-11-04
-- Purpose: Support multiple commission models (tiered revenue, margin-share, flat rate)

-- ============================================
-- PRODUCT COMMISSION CONFIGURATION TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS product_commission_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Product Identification
  product_line TEXT NOT NULL, -- 'mtn_deals', 'bizfibre_connect', 'skyfibre_business', 'homefibre_connect', 'managed_services'
  product_sku TEXT, -- Optional specific SKU (e.g., 'bizfibre_plus_50')
  product_name TEXT NOT NULL,

  -- Commission Model
  commission_model TEXT NOT NULL CHECK (
    commission_model IN ('tiered_revenue', 'margin_share', 'flat_rate', 'hybrid')
  ),

  -- For tiered_revenue model (uses commission_tier_config table)
  use_tier_config BOOLEAN DEFAULT false,

  -- For margin_share model
  margin_share_rate DECIMAL(5, 2), -- e.g., 20.00 for 20% of gross margin

  -- For flat_rate model
  flat_commission_rate DECIMAL(5, 2), -- e.g., 5.00 for 5% of revenue

  -- For hybrid model
  base_rate DECIMAL(5, 2),
  margin_bonus_rate DECIMAL(5, 2),

  -- Product Pricing (for reference and calculations)
  monthly_price DECIMAL(10, 2),
  monthly_cost DECIMAL(10, 2),
  monthly_margin DECIMAL(10, 2),
  margin_percentage DECIMAL(5, 2),

  -- Metadata
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_commission_model CHECK (
    (commission_model = 'tiered_revenue' AND use_tier_config = true) OR
    (commission_model = 'margin_share' AND margin_share_rate IS NOT NULL) OR
    (commission_model = 'flat_rate' AND flat_commission_rate IS NOT NULL) OR
    (commission_model = 'hybrid' AND base_rate IS NOT NULL AND margin_bonus_rate IS NOT NULL)
  )
);

-- ============================================
-- SEED DATA: BizFibre Connect Products
-- ============================================

INSERT INTO product_commission_config (
  product_line,
  product_sku,
  product_name,
  commission_model,
  margin_share_rate,
  monthly_price,
  monthly_cost,
  monthly_margin,
  margin_percentage,
  description,
  sort_order
) VALUES
  (
    'bizfibre_connect',
    'bizfibre_lite_10',
    'BizFibre Connect Lite 10/10 Mbps',
    'margin_share',
    20.00,
    1699.00,
    1139.00,
    560.00,
    33.0,
    'Entry-level business fibre with router included',
    1
  ),
  (
    'bizfibre_connect',
    'bizfibre_starter_25',
    'BizFibre Connect Starter 25/25 Mbps',
    'margin_share',
    20.00,
    1899.00,
    1142.00,
    757.00,
    39.8,
    'Small office business fibre with dual-WAN',
    2
  ),
  (
    'bizfibre_connect',
    'bizfibre_plus_50',
    'BizFibre Connect Plus 50/50 Mbps',
    'margin_share',
    20.00,
    2499.00,
    1565.00,
    934.00,
    37.4,
    'Growing SME business fibre with PoE',
    3
  ),
  (
    'bizfibre_connect',
    'bizfibre_pro_100',
    'BizFibre Connect Pro 100/100 Mbps',
    'margin_share',
    20.00,
    2999.00,
    1853.00,
    1146.00,
    38.2,
    'Medium business fibre with advanced security',
    4
  ),
  (
    'bizfibre_connect',
    'bizfibre_ultra_200',
    'BizFibre Connect Ultra 200/200 Mbps',
    'margin_share',
    20.00,
    4373.00,
    2997.00,
    1376.00,
    31.5,
    'Large office mission-critical business fibre',
    5
  );

-- ============================================
-- SEED DATA: SkyFibre Business Products
-- ============================================

INSERT INTO product_commission_config (
  product_line,
  product_sku,
  product_name,
  commission_model,
  margin_share_rate,
  monthly_price,
  monthly_cost,
  monthly_margin,
  margin_percentage,
  description,
  sort_order
) VALUES
  (
    'skyfibre_business',
    'skyfibre_biz_50',
    'SkyFibre Business 50 Mbps',
    'margin_share',
    20.00,
    1999.00,
    1132.00,
    867.00,
    43.4,
    'Fixed wireless business connectivity 50 Mbps',
    1
  ),
  (
    'skyfibre_business',
    'skyfibre_biz_100',
    'SkyFibre Business 100 Mbps',
    'margin_share',
    20.00,
    2999.00,
    1432.00,
    1567.00,
    52.3,
    'Fixed wireless business connectivity 100 Mbps',
    2
  ),
  (
    'skyfibre_business',
    'skyfibre_biz_200',
    'SkyFibre Business 200 Mbps',
    'margin_share',
    20.00,
    4499.00,
    1832.00,
    2667.00,
    59.3,
    'Fixed wireless business connectivity 200 Mbps',
    3
  ),
  (
    'skyfibre_business',
    'skyfibre_biz_300',
    'SkyFibre Business 300 Mbps',
    'margin_share',
    20.00,
    5999.00,
    2926.00,
    3073.00,
    51.2,
    'Fixed wireless business connectivity 300 Mbps',
    4
  ),
  (
    'skyfibre_business',
    'skyfibre_biz_400',
    'SkyFibre Business 400 Mbps',
    'margin_share',
    20.00,
    7999.00,
    3493.00,
    4506.00,
    56.3,
    'Fixed wireless business connectivity 400 Mbps',
    5
  );

-- ============================================
-- MARGIN-SHARE COMMISSION CALCULATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION calculate_margin_commission(
  p_monthly_revenue DECIMAL,
  p_monthly_cost DECIMAL,
  p_contract_term_months INTEGER DEFAULT 24,
  p_margin_share_rate DECIMAL DEFAULT 20.00
)
RETURNS TABLE (
  monthly_revenue DECIMAL,
  monthly_cost DECIMAL,
  monthly_margin DECIMAL,
  margin_percentage DECIMAL,
  margin_share_rate DECIMAL,
  monthly_commission DECIMAL,
  contract_term INTEGER,
  total_contract_revenue DECIMAL,
  total_commission DECIMAL,
  total_commission_incl_vat DECIMAL
) AS $$
DECLARE
  v_monthly_margin DECIMAL;
  v_margin_percentage DECIMAL;
  v_monthly_commission DECIMAL;
  v_total_commission DECIMAL;
BEGIN
  -- Calculate monthly margin
  v_monthly_margin := p_monthly_revenue - p_monthly_cost;

  -- Calculate margin percentage
  v_margin_percentage := (v_monthly_margin / p_monthly_revenue) * 100;

  -- Calculate monthly commission
  v_monthly_commission := v_monthly_margin * (p_margin_share_rate / 100);

  -- Calculate total over contract term
  v_total_commission := v_monthly_commission * p_contract_term_months;

  RETURN QUERY
  SELECT
    p_monthly_revenue,
    p_monthly_cost,
    v_monthly_margin,
    v_margin_percentage,
    p_margin_share_rate,
    v_monthly_commission,
    p_contract_term_months,
    p_monthly_revenue * p_contract_term_months AS total_contract_revenue,
    v_total_commission,
    v_total_commission * 1.15 AS total_commission_incl_vat;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- PRODUCT-BASED COMMISSION CALCULATION
-- ============================================

CREATE OR REPLACE FUNCTION calculate_product_commission(
  p_product_sku TEXT,
  p_contract_term_months INTEGER DEFAULT 24
)
RETURNS TABLE (
  product_name TEXT,
  commission_model TEXT,
  monthly_revenue DECIMAL,
  monthly_cost DECIMAL,
  monthly_margin DECIMAL,
  margin_percentage DECIMAL,
  commission_rate DECIMAL,
  monthly_commission DECIMAL,
  total_commission DECIMAL,
  total_commission_incl_vat DECIMAL
) AS $$
DECLARE
  v_product RECORD;
  v_margin_result RECORD;
  v_tiered_result RECORD;
BEGIN
  -- Get product configuration
  SELECT *
  INTO v_product
  FROM product_commission_config
  WHERE product_sku = p_product_sku
    AND is_active = true
    AND (effective_from IS NULL OR effective_from <= CURRENT_DATE)
    AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product SKU not found or inactive: %', p_product_sku;
  END IF;

  -- Calculate based on commission model
  IF v_product.commission_model = 'margin_share' THEN
    -- Use margin-share calculation
    SELECT *
    INTO v_margin_result
    FROM calculate_margin_commission(
      v_product.monthly_price,
      v_product.monthly_cost,
      p_contract_term_months,
      v_product.margin_share_rate
    );

    RETURN QUERY
    SELECT
      v_product.product_name,
      v_product.commission_model,
      v_margin_result.monthly_revenue,
      v_margin_result.monthly_cost,
      v_margin_result.monthly_margin,
      v_margin_result.margin_percentage,
      v_margin_result.margin_share_rate AS commission_rate,
      v_margin_result.monthly_commission,
      v_margin_result.total_commission,
      v_margin_result.total_commission_incl_vat;

  ELSIF v_product.commission_model = 'tiered_revenue' THEN
    -- Use tiered calculation (MTN Arlan model)
    SELECT *
    INTO v_tiered_result
    FROM calculate_tiered_commission(
      v_product.monthly_price,
      p_contract_term_months
    );

    RETURN QUERY
    SELECT
      v_product.product_name,
      v_product.commission_model,
      v_tiered_result.monthly_value AS monthly_revenue,
      NULL::DECIMAL AS monthly_cost,
      NULL::DECIMAL AS monthly_margin,
      v_tiered_result.effective_rate AS margin_percentage,
      v_tiered_result.effective_rate AS commission_rate,
      v_tiered_result.partner_commission / p_contract_term_months AS monthly_commission,
      v_tiered_result.partner_commission AS total_commission,
      v_tiered_result.partner_commission_incl_vat AS total_commission_incl_vat;

  ELSIF v_product.commission_model = 'flat_rate' THEN
    -- Flat rate of revenue
    RETURN QUERY
    SELECT
      v_product.product_name,
      v_product.commission_model,
      v_product.monthly_price,
      v_product.monthly_cost,
      NULL::DECIMAL AS monthly_margin,
      NULL::DECIMAL AS margin_percentage,
      v_product.flat_commission_rate AS commission_rate,
      (v_product.monthly_price * v_product.flat_commission_rate / 100) AS monthly_commission,
      (v_product.monthly_price * p_contract_term_months * v_product.flat_commission_rate / 100) AS total_commission,
      (v_product.monthly_price * p_contract_term_months * v_product.flat_commission_rate / 100 * 1.15) AS total_commission_incl_vat;

  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- UPDATE TRANSACTION TYPE CONSTRAINTS
-- ============================================

-- Update partner_commission_transactions to support new transaction types
ALTER TABLE partner_commission_transactions
  ADD COLUMN IF NOT EXISTS product_sku TEXT;

ALTER TABLE partner_commission_transactions
  ADD COLUMN IF NOT EXISTS product_commission_config_id UUID REFERENCES product_commission_config(id);

ALTER TABLE partner_commission_transactions
  ADD COLUMN IF NOT EXISTS commission_model TEXT;

-- Add check constraint for new transaction types
ALTER TABLE partner_commission_transactions
  DROP CONSTRAINT IF EXISTS partner_commission_transactions_transaction_type_check;

ALTER TABLE partner_commission_transactions
  ADD CONSTRAINT partner_commission_transactions_transaction_type_check
  CHECK (transaction_type IN (
    'lead_conversion',
    'monthly_recurring',
    'installation_fee',
    'upgrade',
    'adjustment',
    'payout',
    'margin_share',     -- NEW: For BizFibre/SkyFibre
    'tiered_revenue'    -- NEW: For MTN Deals
  ));

-- ============================================
-- CREATE HELPER FUNCTION FOR MARGIN-BASED TRANSACTIONS
-- ============================================

CREATE OR REPLACE FUNCTION create_margin_commission(
  p_partner_id UUID,
  p_lead_id UUID,
  p_order_id UUID,
  p_product_sku TEXT,
  p_contract_term_months INTEGER,
  p_description TEXT
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_commission RECORD;
  v_product RECORD;
BEGIN
  -- Get product config
  SELECT *
  INTO v_product
  FROM product_commission_config
  WHERE product_sku = p_product_sku
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product SKU not found: %', p_product_sku;
  END IF;

  -- Calculate commission
  SELECT *
  INTO v_commission
  FROM calculate_product_commission(
    p_product_sku,
    p_contract_term_months
  );

  -- Insert transaction
  INSERT INTO partner_commission_transactions (
    partner_id,
    lead_id,
    order_id,
    product_sku,
    product_commission_config_id,
    commission_model,
    transaction_type,
    monthly_subscription_value,
    contract_term_months,
    total_contract_value,
    commission_rate,
    amount,
    status,
    description
  ) VALUES (
    p_partner_id,
    p_lead_id,
    p_order_id,
    p_product_sku,
    v_product.id,
    v_product.commission_model,
    'margin_share',
    v_product.monthly_price,
    p_contract_term_months,
    v_product.monthly_price * p_contract_term_months,
    v_commission.commission_rate,
    v_commission.total_commission,
    'pending',
    p_description || ' (' || v_product.product_name || ')'
  )
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PRODUCT COMMISSION COMPARISON VIEW
-- ============================================

CREATE OR REPLACE VIEW v_product_commission_comparison AS
SELECT
  product_line,
  product_name,
  commission_model,
  monthly_price,
  monthly_cost,
  monthly_margin,
  margin_percentage,
  CASE
    WHEN commission_model = 'margin_share' THEN margin_share_rate
    WHEN commission_model = 'flat_rate' THEN flat_commission_rate
    WHEN commission_model = 'tiered_revenue' THEN NULL
  END AS commission_rate,

  -- Calculate 24-month commission
  CASE
    WHEN commission_model = 'margin_share' THEN
      (monthly_margin * margin_share_rate / 100) * 24
    WHEN commission_model = 'flat_rate' THEN
      (monthly_price * flat_commission_rate / 100) * 24
    WHEN commission_model = 'tiered_revenue' THEN
      -- Would need to calculate based on tier
      NULL
  END AS commission_24_months,

  -- Monthly commission
  CASE
    WHEN commission_model = 'margin_share' THEN
      monthly_margin * margin_share_rate / 100
    WHEN commission_model = 'flat_rate' THEN
      monthly_price * flat_commission_rate / 100
  END AS commission_per_month,

  is_active,
  sort_order
FROM product_commission_config
WHERE is_active = true
ORDER BY product_line, sort_order;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_product_commission_config_product_line
  ON product_commission_config(product_line);

CREATE INDEX IF NOT EXISTS idx_product_commission_config_sku
  ON product_commission_config(product_sku)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_product_commission_config_model
  ON product_commission_config(commission_model);

CREATE INDEX IF NOT EXISTS idx_partner_transactions_product_sku
  ON partner_commission_transactions(product_sku)
  WHERE product_sku IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_partner_transactions_commission_model
  ON partner_commission_transactions(commission_model)
  WHERE commission_model IS NOT NULL;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE product_commission_config ENABLE ROW LEVEL SECURITY;

-- Everyone can view active product commission configs
CREATE POLICY "public_view_active_product_commissions"
  ON product_commission_config FOR SELECT
  USING (is_active = true);

-- Only admins can manage product commission config
CREATE POLICY "admins_manage_product_commissions"
  ON product_commission_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role_template_id IN (
        SELECT id FROM role_templates
        WHERE name IN ('Super Administrator', 'Finance Manager')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role_template_id IN (
        SELECT id FROM role_templates
        WHERE name IN ('Super Administrator', 'Finance Manager')
      )
    )
  );

-- ============================================
-- EXAMPLE USAGE
-- ============================================

-- Example 1: Calculate BizFibre Plus commission
-- SELECT * FROM calculate_product_commission('bizfibre_plus_50', 24);
-- Result: R4,483.20 total commission over 24 months (R186.80/month)

-- Example 2: Calculate SkyFibre Business 100 commission
-- SELECT * FROM calculate_product_commission('skyfibre_biz_100', 24);
-- Result: R7,521.60 total commission over 24 months (R313.40/month)

-- Example 3: Create actual commission transaction for BizFibre
-- SELECT create_margin_commission(
--   '<partner_uuid>',
--   '<lead_uuid>',
--   '<order_uuid>',
--   'bizfibre_plus_50',
--   24,
--   'SME Office Fibre Installation'
-- );

-- Example 4: Compare all products
-- SELECT * FROM v_product_commission_comparison ORDER BY commission_24_months DESC;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE product_commission_config IS 'Product-specific commission configuration supporting multiple commission models (tiered_revenue, margin_share, flat_rate, hybrid)';
COMMENT ON FUNCTION calculate_margin_commission IS 'Calculate partner commission based on gross margin sharing model (default 20%)';
COMMENT ON FUNCTION calculate_product_commission IS 'Universal commission calculator that automatically applies correct model based on product SKU';
COMMENT ON FUNCTION create_margin_commission IS 'Create commission transaction for margin-share products (BizFibre/SkyFibre)';
COMMENT ON VIEW v_product_commission_comparison IS 'Side-by-side comparison of commission earnings across all product lines';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
