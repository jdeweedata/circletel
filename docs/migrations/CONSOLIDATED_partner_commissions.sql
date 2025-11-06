-- Migration: Create Partner Commission Transactions
-- Description: Creates detailed commission tracking for partners
-- Date: 2025-11-04

-- ============================================
-- PARTNER COMMISSION TRANSACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS partner_commission_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE NOT NULL,

  -- Transaction Details
  transaction_type TEXT NOT NULL CHECK (
    transaction_type IN ('lead_conversion', 'monthly_recurring', 'installation_fee', 'upgrade', 'adjustment', 'payout')
  ),

  -- Related Records
  lead_id UUID REFERENCES coverage_leads(id),
  order_id UUID, -- Can reference consumer_orders or orders

  -- Financial Details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  commission_rate DECIMAL(5, 2), -- Percentage at time of transaction

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'paid', 'cancelled')
  ),

  -- Payment Details
  paid_at TIMESTAMPTZ,
  payment_method TEXT, -- eft, bank_transfer, etc.
  payment_reference TEXT,

  -- Metadata
  description TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Approval
  approved_by UUID REFERENCES admin_users(id),
  approved_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_commission_transactions_partner_id
  ON partner_commission_transactions(partner_id);

CREATE INDEX IF NOT EXISTS idx_commission_transactions_lead_id
  ON partner_commission_transactions(lead_id);

CREATE INDEX IF NOT EXISTS idx_commission_transactions_order_id
  ON partner_commission_transactions(order_id);

CREATE INDEX IF NOT EXISTS idx_commission_transactions_status
  ON partner_commission_transactions(status);

CREATE INDEX IF NOT EXISTS idx_commission_transactions_created_at
  ON partner_commission_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_commission_transactions_paid_at
  ON partner_commission_transactions(paid_at DESC) WHERE paid_at IS NOT NULL;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE partner_commission_transactions ENABLE ROW LEVEL SECURITY;

-- Partners can view their own commission transactions
CREATE POLICY "partners_view_own_commissions"
  ON partner_commission_transactions FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Admins can view all commission transactions
CREATE POLICY "admins_view_all_commissions"
  ON partner_commission_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role_template_id IN (
        SELECT id FROM role_templates
        WHERE name IN ('Super Administrator', 'Sales Manager', 'Finance Manager')
      )
    )
  );

-- Admins can manage commission transactions
CREATE POLICY "admins_manage_commissions"
  ON partner_commission_transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role_template_id IN (
        SELECT id FROM role_templates
        WHERE name IN ('Super Administrator', 'Sales Manager', 'Finance Manager')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role_template_id IN (
        SELECT id FROM role_templates
        WHERE name IN ('Super Administrator', 'Sales Manager', 'Finance Manager')
      )
    )
  );

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Function to update partner commission totals when transaction changes
CREATE OR REPLACE FUNCTION update_partner_commission_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- When transaction is approved, add to pending_commission
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') THEN
    UPDATE partners
    SET pending_commission = pending_commission + NEW.amount
    WHERE id = NEW.partner_id;
  END IF;

  -- When transaction is paid, move from pending to total earned
  IF (TG_OP = 'UPDATE' AND NEW.status = 'paid' AND OLD.status != 'paid') THEN
    UPDATE partners
    SET
      pending_commission = pending_commission - NEW.amount,
      total_commission_earned = total_commission_earned + NEW.amount
    WHERE id = NEW.partner_id;
  END IF;

  -- When transaction is cancelled, subtract from pending
  IF (TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status = 'approved') THEN
    UPDATE partners
    SET pending_commission = pending_commission - OLD.amount
    WHERE id = OLD.partner_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for commission transactions
DROP TRIGGER IF EXISTS trigger_update_partner_commission_totals ON partner_commission_transactions;
CREATE TRIGGER trigger_update_partner_commission_totals
  AFTER INSERT OR UPDATE ON partner_commission_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_commission_totals();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_commission_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_commission_transactions_updated_at ON partner_commission_transactions;
CREATE TRIGGER trigger_commission_transactions_updated_at
  BEFORE UPDATE ON partner_commission_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_commission_transactions_updated_at();

-- ============================================
-- HELPER FUNCTION: Create commission for lead conversion
-- ============================================

CREATE OR REPLACE FUNCTION create_lead_conversion_commission(
  p_partner_id UUID,
  p_lead_id UUID,
  p_order_id UUID,
  p_amount DECIMAL,
  p_commission_rate DECIMAL,
  p_description TEXT
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  INSERT INTO partner_commission_transactions (
    partner_id,
    lead_id,
    order_id,
    transaction_type,
    amount,
    commission_rate,
    status,
    description
  ) VALUES (
    p_partner_id,
    p_lead_id,
    p_order_id,
    'lead_conversion',
    p_amount,
    p_commission_rate,
    'pending',
    p_description
  )
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE partner_commission_transactions IS 'Detailed commission transaction history for partners';
COMMENT ON COLUMN partner_commission_transactions.transaction_type IS 'Type of commission: lead_conversion, monthly_recurring, installation_fee, upgrade, adjustment, payout';
COMMENT ON COLUMN partner_commission_transactions.status IS 'Transaction status: pending (awaiting approval), approved (approved but not paid), paid (paid out), cancelled';
COMMENT ON FUNCTION create_lead_conversion_commission IS 'Helper function to create commission record when lead converts to order';

-- ============================================
-- SEED SAMPLE DATA (for testing)
-- ============================================

-- Note: In production, this would be created when orders are placed
-- For now, adding a comment showing how to create test data:

-- Example: Create sample commission for existing approved partners
-- INSERT INTO partner_commission_transactions (partner_id, transaction_type, amount, status, description)
-- SELECT
--   id,
--   'lead_conversion',
--   500.00,
--   'approved',
--   'Sample commission for testing'
-- FROM partners
-- WHERE status = 'approved'
-- LIMIT 5;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Migration: Add Tiered Commission Structure (MTN Arlan Model)
-- Description: Implements revenue-based tiered commission rates similar to MTN Arlan agreement
-- Date: 2025-11-04
-- Based on: Arlan Communications Sales Agreement Commission Structure

-- ============================================
-- COMMISSION TIER CONFIGURATION TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS commission_tier_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tier Definition
  tier_name TEXT NOT NULL,
  tier_order INTEGER NOT NULL,
  min_monthly_value DECIMAL(10, 2) NOT NULL,
  max_monthly_value DECIMAL(10, 2),

  -- Commission Rates (as percentages)
  base_commission_rate DECIMAL(5, 2) NOT NULL, -- e.g., 9.75 for 9.75%
  partner_share_rate DECIMAL(5, 2) NOT NULL DEFAULT 30.00, -- Partner gets X% of base commission
  effective_rate DECIMAL(5, 2) NOT NULL, -- Calculated: base_rate × (partner_share / 100)

  -- Metadata
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT positive_rates CHECK (base_commission_rate > 0 AND partner_share_rate > 0),
  CONSTRAINT valid_tier_order CHECK (tier_order > 0)
);

-- ============================================
-- SEED COMMISSION TIERS (MTN Arlan Model)
-- ============================================

INSERT INTO commission_tier_config (
  tier_name,
  tier_order,
  min_monthly_value,
  max_monthly_value,
  base_commission_rate,
  partner_share_rate,
  effective_rate,
  description
) VALUES
  (
    'Tier 1: Entry Level',
    1,
    0.00,
    99.99,
    4.75,
    30.00,
    1.425,  -- 4.75% × 30%
    'Basic packages: R0 - R99.99 per month'
  ),
  (
    'Tier 2: Standard',
    2,
    100.00,
    199.99,
    5.75,
    30.00,
    1.725,  -- 5.75% × 30%
    'Standard packages: R100 - R199.99 per month'
  ),
  (
    'Tier 3: Enhanced',
    3,
    200.00,
    299.99,
    7.25,
    30.00,
    2.175,  -- 7.25% × 30%
    'Enhanced packages: R200 - R299.99 per month'
  ),
  (
    'Tier 4: Premium',
    4,
    300.00,
    499.99,
    8.75,
    30.00,
    2.625,  -- 8.75% × 30%
    'Premium packages: R300 - R499.99 per month'
  ),
  (
    'Tier 5: Business',
    5,
    500.00,
    999.99,
    9.75,
    30.00,
    2.925,  -- 9.75% × 30%
    'Business packages: R500 - R999.99 per month'
  ),
  (
    'Tier 6: Corporate',
    6,
    1000.00,
    1999.99,
    11.75,
    30.00,
    3.525,  -- 11.75% × 30%
    'Corporate packages: R1,000 - R1,999.99 per month'
  ),
  (
    'Tier 7: Enterprise',
    7,
    2000.00,
    NULL, -- No upper limit
    13.75,
    30.00,
    4.125,  -- 13.75% × 30%
    'Enterprise packages: R2,000+ per month'
  );

-- ============================================
-- UPDATE PARTNER_COMMISSION_TRANSACTIONS
-- ============================================

-- Add tier tracking columns
ALTER TABLE partner_commission_transactions
ADD COLUMN IF NOT EXISTS monthly_subscription_value DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS contract_term_months INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS total_contract_value DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS commission_tier_id UUID REFERENCES commission_tier_config(id),
ADD COLUMN IF NOT EXISTS base_commission_rate DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS effective_commission_rate DECIMAL(5, 2);

-- Add comment
COMMENT ON COLUMN partner_commission_transactions.monthly_subscription_value IS 'Monthly subscription fee (excl VAT) used to determine commission tier';
COMMENT ON COLUMN partner_commission_transactions.total_contract_value IS 'Total contract value over term (monthly × term_months)';
COMMENT ON COLUMN partner_commission_transactions.commission_tier_id IS 'Reference to commission tier configuration used for calculation';

-- ============================================
-- COMMISSION CALCULATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION calculate_tiered_commission(
  p_monthly_subscription DECIMAL,
  p_contract_term_months INTEGER DEFAULT 24,
  p_transaction_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  tier_id UUID,
  tier_name TEXT,
  tier_order INTEGER,
  base_rate DECIMAL,
  partner_share_rate DECIMAL,
  effective_rate DECIMAL,
  monthly_value DECIMAL,
  contract_term INTEGER,
  total_contract_value DECIMAL,
  base_commission DECIMAL,
  partner_commission DECIMAL,
  partner_commission_incl_vat DECIMAL
) AS $$
DECLARE
  v_tier RECORD;
  v_total_value DECIMAL;
  v_base_commission DECIMAL;
  v_partner_commission DECIMAL;
BEGIN
  -- Calculate total contract value
  v_total_value := p_monthly_subscription * p_contract_term_months;

  -- Find applicable tier
  SELECT *
  INTO v_tier
  FROM commission_tier_config
  WHERE is_active = true
    AND p_monthly_subscription >= min_monthly_value
    AND (max_monthly_value IS NULL OR p_monthly_subscription <= max_monthly_value)
    AND (effective_from IS NULL OR effective_from <= p_transaction_date)
    AND (effective_to IS NULL OR effective_to >= p_transaction_date)
  ORDER BY tier_order DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No commission tier found for monthly subscription value: %', p_monthly_subscription;
  END IF;

  -- Calculate commissions
  v_base_commission := v_total_value * (v_tier.base_commission_rate / 100);
  v_partner_commission := v_base_commission * (v_tier.partner_share_rate / 100);

  RETURN QUERY
  SELECT
    v_tier.id,
    v_tier.tier_name,
    v_tier.tier_order,
    v_tier.base_commission_rate,
    v_tier.partner_share_rate,
    v_tier.effective_rate,
    p_monthly_subscription,
    p_contract_term_months,
    v_total_value,
    v_base_commission,
    v_partner_commission,
    v_partner_commission * 1.15 AS partner_commission_incl_vat;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- HELPER FUNCTION: Create Commission with Tier
-- ============================================

CREATE OR REPLACE FUNCTION create_tiered_commission(
  p_partner_id UUID,
  p_lead_id UUID,
  p_order_id UUID,
  p_monthly_subscription DECIMAL,
  p_contract_term_months INTEGER,
  p_description TEXT
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_commission RECORD;
BEGIN
  -- Calculate commission using tier function
  SELECT *
  INTO v_commission
  FROM calculate_tiered_commission(
    p_monthly_subscription,
    p_contract_term_months
  );

  -- Insert transaction
  INSERT INTO partner_commission_transactions (
    partner_id,
    lead_id,
    order_id,
    transaction_type,
    monthly_subscription_value,
    contract_term_months,
    total_contract_value,
    commission_tier_id,
    base_commission_rate,
    effective_commission_rate,
    commission_rate,
    amount,
    status,
    description
  ) VALUES (
    p_partner_id,
    p_lead_id,
    p_order_id,
    'lead_conversion',
    v_commission.monthly_value,
    v_commission.contract_term,
    v_commission.total_contract_value,
    v_commission.tier_id,
    v_commission.base_rate,
    v_commission.effective_rate,
    v_commission.effective_rate, -- For compatibility with existing column
    v_commission.partner_commission,
    'pending',
    p_description || ' (' || v_commission.tier_name || ')'
  )
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TIER ANALYSIS VIEW
-- ============================================

CREATE OR REPLACE VIEW v_partner_commission_tier_analysis AS
SELECT
  p.id AS partner_id,
  p.business_name,
  p.tier AS partner_tier,
  p.commission_rate AS partner_default_rate,

  -- Transaction counts by tier
  COUNT(DISTINCT pct.id) FILTER (WHERE ct.tier_order = 1) AS tier1_transactions,
  COUNT(DISTINCT pct.id) FILTER (WHERE ct.tier_order = 2) AS tier2_transactions,
  COUNT(DISTINCT pct.id) FILTER (WHERE ct.tier_order = 3) AS tier3_transactions,
  COUNT(DISTINCT pct.id) FILTER (WHERE ct.tier_order = 4) AS tier4_transactions,
  COUNT(DISTINCT pct.id) FILTER (WHERE ct.tier_order = 5) AS tier5_transactions,
  COUNT(DISTINCT pct.id) FILTER (WHERE ct.tier_order = 6) AS tier6_transactions,
  COUNT(DISTINCT pct.id) FILTER (WHERE ct.tier_order = 7) AS tier7_transactions,

  -- Revenue by tier
  COALESCE(SUM(pct.amount) FILTER (WHERE ct.tier_order = 1), 0) AS tier1_commission,
  COALESCE(SUM(pct.amount) FILTER (WHERE ct.tier_order = 2), 0) AS tier2_commission,
  COALESCE(SUM(pct.amount) FILTER (WHERE ct.tier_order = 3), 0) AS tier3_commission,
  COALESCE(SUM(pct.amount) FILTER (WHERE ct.tier_order = 4), 0) AS tier4_commission,
  COALESCE(SUM(pct.amount) FILTER (WHERE ct.tier_order = 5), 0) AS tier5_commission,
  COALESCE(SUM(pct.amount) FILTER (WHERE ct.tier_order = 6), 0) AS tier6_commission,
  COALESCE(SUM(pct.amount) FILTER (WHERE ct.tier_order = 7), 0) AS tier7_commission,

  -- Totals
  COUNT(DISTINCT pct.id) AS total_transactions,
  COALESCE(SUM(pct.amount), 0) AS total_commission,

  -- Average values
  AVG(pct.monthly_subscription_value) AS avg_monthly_subscription,
  AVG(pct.amount) AS avg_commission_per_deal

FROM partners p
LEFT JOIN partner_commission_transactions pct ON p.id = pct.partner_id
LEFT JOIN commission_tier_config ct ON pct.commission_tier_id = ct.id
WHERE p.status = 'approved'
GROUP BY p.id, p.business_name, p.tier, p.commission_rate;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_commission_tier_config_monthly_value
  ON commission_tier_config(min_monthly_value, max_monthly_value)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_commission_tier_config_effective_dates
  ON commission_tier_config(effective_from, effective_to)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_partner_transactions_tier
  ON partner_commission_transactions(commission_tier_id)
  WHERE commission_tier_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_partner_transactions_monthly_value
  ON partner_commission_transactions(monthly_subscription_value);

-- ============================================
-- RLS POLICIES (Commission Tier Config)
-- ============================================

ALTER TABLE commission_tier_config ENABLE ROW LEVEL SECURITY;

-- Everyone can view active tiers
CREATE POLICY "public_view_active_tiers"
  ON commission_tier_config FOR SELECT
  USING (is_active = true);

-- Only admins can manage tiers
CREATE POLICY "admins_manage_tiers"
  ON commission_tier_config FOR ALL
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

-- Example 1: Calculate commission for R500/month, 24-month contract
-- SELECT * FROM calculate_tiered_commission(500, 24);
-- Result: Tier 5 (Business), 9.75% base, 2.925% effective, R351 commission

-- Example 2: Calculate commission for R1,500/month, 36-month contract
-- SELECT * FROM calculate_tiered_commission(1500, 36);
-- Result: Tier 6 (Corporate), 11.75% base, 3.525% effective, R1,904.40 commission

-- Example 3: Create actual commission transaction
-- SELECT create_tiered_commission(
--   '<partner_uuid>',
--   '<lead_uuid>',
--   '<order_uuid>',
--   500.00,  -- R500/month
--   24,      -- 24 months
--   'Consumer Fibre 50Mbps Package'
-- );

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE commission_tier_config IS 'Tiered commission rate configuration based on monthly subscription value (MTN Arlan model)';
COMMENT ON FUNCTION calculate_tiered_commission IS 'Calculate partner commission based on tiered rate structure using monthly subscription value and contract term';
COMMENT ON FUNCTION create_tiered_commission IS 'Create a commission transaction using tiered rate calculation';
COMMENT ON VIEW v_partner_commission_tier_analysis IS 'Partner performance analysis showing transaction counts and revenue by commission tier';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
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
