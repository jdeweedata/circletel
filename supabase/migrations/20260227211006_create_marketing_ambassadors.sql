-- ============================================
-- Marketing Ambassadors & Attribution System
-- Phase 2 of Marketing Platform
-- ============================================

-- ============================================
-- AMBASSADORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ambassadors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Personal Information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,

  -- Social/Online Presence
  social_platform TEXT, -- 'instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'other'
  social_handle TEXT,
  website_url TEXT,
  audience_size INTEGER, -- Estimated follower count

  -- Ambassador Identification
  ambassador_number TEXT UNIQUE, -- e.g., "CTAB-2026-001"

  -- Tier & Commission
  tier TEXT NOT NULL DEFAULT 'starter' CHECK (
    tier IN ('starter', 'rising', 'star', 'elite')
  ),
  commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 5.00, -- Default 5%

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'suspended', 'inactive')
  ),
  approved_by UUID REFERENCES admin_users(id),
  approved_at TIMESTAMPTZ,

  -- Performance Metrics (denormalized for quick access)
  total_clicks INTEGER NOT NULL DEFAULT 0,
  total_conversions INTEGER NOT NULL DEFAULT 0,
  total_earnings DECIMAL(10, 2) NOT NULL DEFAULT 0,
  pending_earnings DECIMAL(10, 2) NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- AMBASSADOR CODES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ambassador_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES ambassadors(id) ON DELETE CASCADE,

  -- Code Details
  code TEXT NOT NULL UNIQUE, -- e.g., "JOHN20"
  label TEXT, -- Optional friendly name like "Instagram Bio"

  -- Discount Configuration (optional)
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed', 'none')),
  discount_value DECIMAL(10, 2) DEFAULT 0,

  -- Tracking Metrics
  total_clicks INTEGER NOT NULL DEFAULT 0,
  unique_clicks INTEGER NOT NULL DEFAULT 0,
  total_conversions INTEGER NOT NULL DEFAULT 0,
  total_revenue DECIMAL(10, 2) NOT NULL DEFAULT 0,

  -- Landing Page
  destination_url TEXT DEFAULT '/', -- Where to redirect after tracking

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- Optional expiry

);

-- ============================================
-- ATTRIBUTION LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS attribution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Attribution Source
  source_type TEXT NOT NULL CHECK (
    source_type IN ('ambassador', 'partner', 'campaign', 'organic', 'direct', 'referral')
  ),
  source_id UUID, -- ambassador_id, partner_id, or campaign_id
  tracking_code TEXT, -- The actual code used

  -- Event Details
  event_type TEXT NOT NULL CHECK (
    event_type IN ('click', 'signup', 'quote_request', 'order', 'payment')
  ),

  -- Associated Records
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_id UUID, -- consumer_orders.id or business_quotes.id
  order_type TEXT CHECK (order_type IN ('consumer', 'business')),

  -- Event Value
  order_value DECIMAL(10, 2),
  commission_amount DECIMAL(10, 2),
  commission_status TEXT DEFAULT 'pending' CHECK (
    commission_status IN ('pending', 'approved', 'paid', 'cancelled')
  ),

  -- Session Tracking
  session_id TEXT, -- Client-side session ID
  ip_address INET,
  user_agent TEXT,
  referrer_url TEXT,

  -- UTM Parameters (for campaign tracking)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- AMBASSADOR EARNINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ambassador_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES ambassadors(id) ON DELETE CASCADE,

  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Metrics
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  gross_revenue DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Total order value

  -- Earnings
  commission_rate DECIMAL(5, 2) NOT NULL, -- Rate at time of calculation
  gross_earnings DECIMAL(10, 2) NOT NULL DEFAULT 0,
  adjustments DECIMAL(10, 2) DEFAULT 0, -- Bonuses or deductions
  net_earnings DECIMAL(10, 2) NOT NULL DEFAULT 0,

  -- Payout
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'processing', 'paid', 'cancelled')
  ),
  paid_at TIMESTAMPTZ,
  payment_reference TEXT,
  payment_method TEXT, -- 'bank_transfer', 'paypal', etc.

  -- Timestamps
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_by UUID REFERENCES admin_users(id),
  approved_at TIMESTAMPTZ
);

-- ============================================
-- MARKETING ASSETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS marketing_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Asset Information
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (
    category IN ('logo', 'banner', 'social', 'flyer', 'video', 'document', 'template', 'other')
  ),
  subcategory TEXT, -- e.g., 'instagram_story', 'facebook_cover'

  -- File Details
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  width INTEGER, -- For images
  height INTEGER,
  duration INTEGER, -- For videos (seconds)

  -- Variations
  variations JSONB DEFAULT '[]', -- Array of {label, url, dimensions}

  -- Permissions
  visibility TEXT NOT NULL DEFAULT 'internal' CHECK (
    visibility IN ('public', 'ambassadors', 'partners', 'internal')
  ),
  requires_approval BOOLEAN DEFAULT false,

  -- Usage Tracking
  download_count INTEGER NOT NULL DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,

  -- Metadata
  tags TEXT[], -- Array of tags for filtering
  metadata JSONB DEFAULT '{}', -- Additional metadata

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Ambassadors
CREATE INDEX idx_ambassadors_user_id ON ambassadors(user_id);
CREATE INDEX idx_ambassadors_email ON ambassadors(email);
CREATE INDEX idx_ambassadors_status ON ambassadors(status);
CREATE INDEX idx_ambassadors_tier ON ambassadors(tier);
CREATE INDEX idx_ambassadors_number ON ambassadors(ambassador_number);

-- Ambassador Codes
CREATE INDEX idx_ambassador_codes_ambassador_id ON ambassador_codes(ambassador_id);
CREATE INDEX idx_ambassador_codes_code ON ambassador_codes(code);
CREATE INDEX idx_ambassador_codes_active ON ambassador_codes(is_active) WHERE is_active = true;

-- Attribution Logs
CREATE INDEX idx_attribution_logs_source ON attribution_logs(source_type, source_id);
CREATE INDEX idx_attribution_logs_code ON attribution_logs(tracking_code);
CREATE INDEX idx_attribution_logs_event ON attribution_logs(event_type);
CREATE INDEX idx_attribution_logs_customer ON attribution_logs(customer_id);
CREATE INDEX idx_attribution_logs_created ON attribution_logs(created_at DESC);
CREATE INDEX idx_attribution_logs_session ON attribution_logs(session_id);

-- Ambassador Earnings
CREATE INDEX idx_ambassador_earnings_ambassador ON ambassador_earnings(ambassador_id);
CREATE INDEX idx_ambassador_earnings_period ON ambassador_earnings(period_start, period_end);
CREATE INDEX idx_ambassador_earnings_status ON ambassador_earnings(status);

-- Marketing Assets
CREATE INDEX idx_marketing_assets_category ON marketing_assets(category);
CREATE INDEX idx_marketing_assets_visibility ON marketing_assets(visibility);
CREATE INDEX idx_marketing_assets_tags ON marketing_assets USING GIN(tags);
CREATE INDEX idx_marketing_assets_active ON marketing_assets(is_active) WHERE is_active = true;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update ambassadors updated_at
CREATE OR REPLACE FUNCTION update_ambassadors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ambassadors_updated_at
  BEFORE UPDATE ON ambassadors
  FOR EACH ROW
  EXECUTE FUNCTION update_ambassadors_updated_at();

-- Update marketing_assets updated_at
CREATE TRIGGER trigger_marketing_assets_updated_at
  BEFORE UPDATE ON marketing_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_ambassadors_updated_at();

-- Update ambassador metrics when attribution log is created
CREATE OR REPLACE FUNCTION update_ambassador_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.source_type = 'ambassador' AND NEW.source_id IS NOT NULL THEN
    -- Update click count
    IF NEW.event_type = 'click' THEN
      UPDATE ambassadors
      SET total_clicks = total_clicks + 1
      WHERE id = NEW.source_id;

      -- Also update the code's click count
      IF NEW.tracking_code IS NOT NULL THEN
        UPDATE ambassador_codes
        SET total_clicks = total_clicks + 1
        WHERE code = NEW.tracking_code;
      END IF;
    END IF;

    -- Update conversion count and earnings
    IF NEW.event_type IN ('order', 'payment') THEN
      UPDATE ambassadors
      SET
        total_conversions = total_conversions + 1,
        pending_earnings = pending_earnings + COALESCE(NEW.commission_amount, 0)
      WHERE id = NEW.source_id;

      IF NEW.tracking_code IS NOT NULL THEN
        UPDATE ambassador_codes
        SET
          total_conversions = total_conversions + 1,
          total_revenue = total_revenue + COALESCE(NEW.order_value, 0)
        WHERE code = NEW.tracking_code;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ambassador_metrics
  AFTER INSERT ON attribution_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_ambassador_metrics();

-- Generate ambassador number on approval
CREATE OR REPLACE FUNCTION generate_ambassador_number()
RETURNS TRIGGER AS $$
DECLARE
  year_suffix TEXT;
  sequence_num INTEGER;
  new_number TEXT;
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' AND NEW.ambassador_number IS NULL THEN
    year_suffix := TO_CHAR(NOW(), 'YYYY');

    -- Get next sequence number for this year
    SELECT COALESCE(MAX(
      CAST(SUBSTRING(ambassador_number FROM 'CTAB-' || year_suffix || '-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO sequence_num
    FROM ambassadors
    WHERE ambassador_number LIKE 'CTAB-' || year_suffix || '-%';

    new_number := 'CTAB-' || year_suffix || '-' || LPAD(sequence_num::TEXT, 3, '0');
    NEW.ambassador_number := new_number;
    NEW.approved_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_ambassador_number
  BEFORE UPDATE ON ambassadors
  FOR EACH ROW
  EXECUTE FUNCTION generate_ambassador_number();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE ambassadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassador_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassador_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_assets ENABLE ROW LEVEL SECURITY;

-- Ambassadors: View own data
CREATE POLICY "ambassadors_view_own"
  ON ambassadors FOR SELECT
  USING (user_id = auth.uid());

-- Ambassadors: Update own data (when pending)
CREATE POLICY "ambassadors_update_own"
  ON ambassadors FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Ambassadors: Register
CREATE POLICY "ambassadors_register"
  ON ambassadors FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Ambassador Codes: View own
CREATE POLICY "ambassadors_view_own_codes"
  ON ambassador_codes FOR SELECT
  USING (ambassador_id IN (SELECT id FROM ambassadors WHERE user_id = auth.uid()));

-- Ambassador Codes: Manage own
CREATE POLICY "ambassadors_manage_own_codes"
  ON ambassador_codes FOR ALL
  USING (ambassador_id IN (SELECT id FROM ambassadors WHERE user_id = auth.uid()))
  WITH CHECK (ambassador_id IN (SELECT id FROM ambassadors WHERE user_id = auth.uid()));

-- Attribution Logs: Ambassadors view own
CREATE POLICY "ambassadors_view_own_attribution"
  ON attribution_logs FOR SELECT
  USING (
    source_type = 'ambassador' AND
    source_id IN (SELECT id FROM ambassadors WHERE user_id = auth.uid())
  );

-- Attribution Logs: Public insert for tracking
CREATE POLICY "public_insert_attribution"
  ON attribution_logs FOR INSERT
  WITH CHECK (true);

-- Ambassador Earnings: View own
CREATE POLICY "ambassadors_view_own_earnings"
  ON ambassador_earnings FOR SELECT
  USING (ambassador_id IN (SELECT id FROM ambassadors WHERE user_id = auth.uid()));

-- Marketing Assets: Based on visibility
CREATE POLICY "public_view_public_assets"
  ON marketing_assets FOR SELECT
  USING (visibility = 'public' AND is_active = true);

CREATE POLICY "ambassadors_view_ambassador_assets"
  ON marketing_assets FOR SELECT
  USING (
    visibility IN ('public', 'ambassadors') AND
    is_active = true AND
    EXISTS (SELECT 1 FROM ambassadors WHERE user_id = auth.uid() AND status = 'approved')
  );

CREATE POLICY "partners_view_partner_assets"
  ON marketing_assets FOR SELECT
  USING (
    visibility IN ('public', 'ambassadors', 'partners') AND
    is_active = true AND
    EXISTS (SELECT 1 FROM partners WHERE user_id = auth.uid() AND status = 'approved')
  );

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE ambassadors IS 'Brand ambassadors who promote CircleTel through referral codes';
COMMENT ON TABLE ambassador_codes IS 'Unique tracking codes for ambassadors with click/conversion metrics';
COMMENT ON TABLE attribution_logs IS 'Tracks all marketing attribution events (clicks, signups, orders)';
COMMENT ON TABLE ambassador_earnings IS 'Monthly earnings calculations and payout tracking';
COMMENT ON TABLE marketing_assets IS 'Marketing materials library with role-based access';

COMMENT ON COLUMN ambassadors.tier IS 'Ambassador tier: starter (5%), rising (7.5%), star (10%), elite (15%)';
COMMENT ON COLUMN attribution_logs.session_id IS 'Client-generated session ID for grouping events';
COMMENT ON COLUMN marketing_assets.variations IS 'Array of size variations: [{label, url, width, height}]';
