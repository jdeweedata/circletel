-- ============================================
-- Marketing Promotions Tables
-- Phase 1 of Marketing Platform
-- ============================================

-- Drop existing tables if any (for clean migrations)
DROP TABLE IF EXISTS promotion_usage CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;

-- ============================================
-- Promotions Table
-- ============================================
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Discount Configuration
  discount_type VARCHAR(50) NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_installation', 'free_month')),
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Promo Code
  promo_code VARCHAR(50) UNIQUE,

  -- Targeting (NULL = all products)
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_category VARCHAR(100),
  customer_type VARCHAR(50) CHECK (customer_type IN ('residential', 'business', 'all')),

  -- Validity
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,

  -- Usage Limits
  max_usage INTEGER, -- NULL = unlimited
  usage_count INTEGER DEFAULT 0,
  max_per_customer INTEGER DEFAULT 1,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'expired', 'archived')),

  -- Display
  display_on_homepage BOOLEAN DEFAULT false,
  display_on_product BOOLEAN DEFAULT true,
  banner_image_url VARCHAR(1000),

  -- Metadata
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Promotion Usage Tracking
-- ============================================
CREATE TABLE promotion_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,

  -- Who used it
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_id UUID, -- Reference to consumer_orders or business_quotes
  order_type VARCHAR(50) CHECK (order_type IN ('consumer', 'business')),

  -- Attribution
  source VARCHAR(100), -- 'homepage', 'product_page', 'checkout', 'partner', 'ambassador'
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  ambassador_code VARCHAR(50),

  -- Discount Applied
  original_amount DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  final_amount DECIMAL(10,2),

  -- Timestamps
  used_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate usage per customer
  UNIQUE(promotion_id, customer_id, order_id)
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_promotions_status ON promotions(status);
CREATE INDEX idx_promotions_promo_code ON promotions(promo_code);
CREATE INDEX idx_promotions_valid_dates ON promotions(valid_from, valid_until);
CREATE INDEX idx_promotions_product_id ON promotions(product_id);
CREATE INDEX idx_promotions_display_homepage ON promotions(display_on_homepage) WHERE display_on_homepage = true;
CREATE INDEX idx_promotion_usage_promotion_id ON promotion_usage(promotion_id);
CREATE INDEX idx_promotion_usage_customer_id ON promotion_usage(customer_id);
CREATE INDEX idx_promotion_usage_used_at ON promotion_usage(used_at);

-- ============================================
-- Updated At Trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_promotions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_promotions_updated_at();

-- ============================================
-- Auto-expire promotions function
-- ============================================
CREATE OR REPLACE FUNCTION check_promotion_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-set status to expired if past valid_until
  IF NEW.valid_until IS NOT NULL AND NEW.valid_until < NOW() AND NEW.status = 'active' THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_promotion_expiry
  BEFORE INSERT OR UPDATE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION check_promotion_expiry();

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_usage ENABLE ROW LEVEL SECURITY;

-- Admin full access (using service role bypasses RLS)
-- Public can view active promotions
CREATE POLICY "Public can view active promotions"
  ON promotions FOR SELECT
  USING (status = 'active' AND (valid_until IS NULL OR valid_until > NOW()));

-- Customers can view their own promotion usage
CREATE POLICY "Customers can view own promotion usage"
  ON promotion_usage FOR SELECT
  USING (auth.uid() = customer_id);

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE promotions IS 'Marketing promotions and discount codes';
COMMENT ON TABLE promotion_usage IS 'Tracks promotion code usage for attribution and limits';
COMMENT ON COLUMN promotions.discount_type IS 'Type of discount: percentage, fixed amount, free installation, or free month';
COMMENT ON COLUMN promotions.customer_type IS 'Target customer segment: residential, business, or all';
COMMENT ON COLUMN promotion_usage.source IS 'Where the promotion was applied from for attribution tracking';
