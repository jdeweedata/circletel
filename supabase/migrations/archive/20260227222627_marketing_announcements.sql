-- ============================================
-- Marketing Announcements Table
-- Phase 1 of Marketing Platform
-- ============================================

-- ============================================
-- Announcement Bar Table
-- ============================================
CREATE TABLE IF NOT EXISTS marketing_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content
  message TEXT NOT NULL,
  link_text VARCHAR(50),
  link_url TEXT,

  -- Styling
  bg_color VARCHAR(7) DEFAULT '#F5841E', -- CircleTel orange
  text_color VARCHAR(7) DEFAULT '#FFFFFF',

  -- Status & Scheduling
  is_active BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0, -- Higher = shown first
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,

  -- Metadata
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Add missing columns to promotions table
-- ============================================
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS category VARCHAR(20)
  CHECK (category IN ('FIBRE', 'LTE', '5G', 'VOIP', 'BUSINESS'));

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_marketing_announcements_active
  ON marketing_announcements(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_marketing_announcements_priority
  ON marketing_announcements(priority DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_announcements_valid_dates
  ON marketing_announcements(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_promotions_category
  ON promotions(category);

-- ============================================
-- Updated At Trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_marketing_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_marketing_announcements_updated_at
  BEFORE UPDATE ON marketing_announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_marketing_announcements_updated_at();

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE marketing_announcements ENABLE ROW LEVEL SECURITY;

-- Public can view active announcements
CREATE POLICY "Public can view active announcements"
  ON marketing_announcements FOR SELECT
  USING (
    is_active = true
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until > NOW())
  );

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE marketing_announcements IS 'Announcement bar content for homepage and site-wide promotions';
COMMENT ON COLUMN marketing_announcements.priority IS 'Higher priority announcements shown first (0=default)';
COMMENT ON COLUMN marketing_announcements.bg_color IS 'Background color in hex format (default CircleTel orange)';
COMMENT ON COLUMN promotions.category IS 'Product category for deal card display: FIBRE, LTE, 5G, VOIP, BUSINESS';
COMMENT ON COLUMN promotions.image_url IS 'Image URL for deal card display';
