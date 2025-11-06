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
