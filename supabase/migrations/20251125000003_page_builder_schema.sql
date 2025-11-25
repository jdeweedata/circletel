-- ============================================
-- Page Builder - Database Schema
-- Uses pb_ prefix to avoid conflicts with existing Prismic cms_ tables
-- ============================================

-- ============================================
-- Page Builder Pages Table
-- ============================================
CREATE TABLE IF NOT EXISTS pb_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  content JSONB NOT NULL DEFAULT '{"blocks": []}',
  seo_metadata JSONB DEFAULT '{}',
  theme VARCHAR(50) DEFAULT 'light',
  author_id UUID REFERENCES admin_users(id),
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT pb_pages_content_type_check CHECK (content_type IN ('landing', 'blog', 'product', 'case_study', 'announcement')),
  CONSTRAINT pb_pages_status_check CHECK (status IN ('draft', 'in_review', 'scheduled', 'published', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_pb_pages_slug ON pb_pages(slug);
CREATE INDEX IF NOT EXISTS idx_pb_pages_status ON pb_pages(status);
CREATE INDEX IF NOT EXISTS idx_pb_pages_content_type ON pb_pages(content_type);
CREATE INDEX IF NOT EXISTS idx_pb_pages_author ON pb_pages(author_id);
CREATE INDEX IF NOT EXISTS idx_pb_pages_published ON pb_pages(published_at DESC) WHERE status = 'published';

COMMENT ON TABLE pb_pages IS 'Custom page builder pages with drag-and-drop block content';

-- ============================================
-- Page Builder Templates Table
-- ============================================
CREATE TABLE IF NOT EXISTS pb_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url VARCHAR(1000),
  content JSONB NOT NULL DEFAULT '{"blocks": []}',
  category VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT pb_templates_category_check CHECK (category IN ('landing', 'blog', 'product', 'marketing', 'general'))
);

CREATE INDEX IF NOT EXISTS idx_pb_templates_category ON pb_templates(category);
CREATE INDEX IF NOT EXISTS idx_pb_templates_active ON pb_templates(is_active) WHERE is_active = true;

COMMENT ON TABLE pb_templates IS 'Reusable page templates for the page builder';

-- ============================================
-- Page Builder AI Usage Table (Rate Limiting)
-- ============================================
CREATE TABLE IF NOT EXISTS pb_ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  request_type VARCHAR(50) NOT NULL,
  model_used VARCHAR(100) NOT NULL,
  prompt_summary VARCHAR(500),
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  estimated_cost_cents INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT pb_ai_usage_request_type_check CHECK (request_type IN ('text_generation', 'image_generation', 'seo_generation', 'content_enhancement', 'full_page'))
);

CREATE INDEX IF NOT EXISTS idx_pb_ai_usage_rate_limit ON pb_ai_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pb_ai_usage_analytics ON pb_ai_usage(created_at DESC, request_type);

COMMENT ON TABLE pb_ai_usage IS 'Tracks AI generation usage for rate limiting and cost monitoring';

-- ============================================
-- Page Builder Media Library Table
-- ============================================
CREATE TABLE IF NOT EXISTS pb_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path VARCHAR(1000) NOT NULL,
  public_url VARCHAR(1000) NOT NULL,
  alt_text VARCHAR(500),
  caption TEXT,
  width INTEGER,
  height INTEGER,
  metadata JSONB DEFAULT '{}',
  uploaded_by UUID REFERENCES admin_users(id),
  folder VARCHAR(255) DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pb_media_folder ON pb_media(folder, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pb_media_uploader ON pb_media(uploaded_by);

COMMENT ON TABLE pb_media IS 'Media library for page builder assets';

-- ============================================
-- Page Builder Page Versions Table (History)
-- ============================================
CREATE TABLE IF NOT EXISTS pb_page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pb_pages(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content JSONB NOT NULL,
  seo_metadata JSONB,
  change_summary VARCHAR(500),
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_id, version)
);

CREATE INDEX IF NOT EXISTS idx_pb_page_versions_page ON pb_page_versions(page_id, version DESC);

COMMENT ON TABLE pb_page_versions IS 'Version history for page builder pages';

-- ============================================
-- Rate Limiting Function
-- ============================================
CREATE OR REPLACE FUNCTION check_pb_rate_limit(
  target_user_id UUID,
  hourly_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  within_limits BOOLEAN,
  hourly_count BIGINT,
  remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) < hourly_limit,
    COUNT(*),
    GREATEST(hourly_limit - COUNT(*)::INTEGER, 0)
  FROM pb_ai_usage
  WHERE user_id = target_user_id
    AND created_at > NOW() - INTERVAL '1 hour'
    AND success = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_pb_rate_limit IS 'Checks if user is within AI generation rate limits';

-- ============================================
-- Auto-update Timestamp Trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_pb_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pb_pages_updated_at ON pb_pages;
CREATE TRIGGER pb_pages_updated_at
  BEFORE UPDATE ON pb_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_pb_updated_at();

DROP TRIGGER IF EXISTS pb_templates_updated_at ON pb_templates;
CREATE TRIGGER pb_templates_updated_at
  BEFORE UPDATE ON pb_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_pb_updated_at();

-- ============================================
-- Page Version Auto-Increment Function
-- ============================================
CREATE OR REPLACE FUNCTION increment_pb_page_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content IS DISTINCT FROM OLD.content THEN
    NEW.version = OLD.version + 1;
    INSERT INTO pb_page_versions (page_id, version, content, seo_metadata, created_by)
    VALUES (OLD.id, OLD.version, OLD.content, OLD.seo_metadata, NEW.author_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pb_pages_version ON pb_pages;
CREATE TRIGGER pb_pages_version
  BEFORE UPDATE ON pb_pages
  FOR EACH ROW
  EXECUTE FUNCTION increment_pb_page_version();

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE pb_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pb_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pb_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE pb_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE pb_page_versions ENABLE ROW LEVEL SECURITY;

-- Service role bypass policies
CREATE POLICY "Service role bypass - pb_pages" ON pb_pages
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass - pb_templates" ON pb_templates
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass - pb_ai_usage" ON pb_ai_usage
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass - pb_media" ON pb_media
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role bypass - pb_page_versions" ON pb_page_versions
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Permissions Grant
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON pb_pages TO authenticated;
GRANT ALL ON pb_templates TO authenticated;
GRANT ALL ON pb_ai_usage TO authenticated;
GRANT ALL ON pb_media TO authenticated;
GRANT ALL ON pb_page_versions TO authenticated;
GRANT SELECT ON pb_pages TO anon;
GRANT SELECT ON pb_templates TO anon;

-- ============================================
-- Seed Default Templates
-- ============================================
INSERT INTO pb_templates (name, description, category, is_default, content) VALUES
(
  'Blank Page',
  'Start with a clean canvas',
  'general',
  true,
  '{"blocks": []}'
),
(
  'Landing Page Hero',
  'Hero section with CTA and feature grid',
  'landing',
  true,
  '{"blocks": [{"id": "hero-1", "type": "hero", "content": {"headline": "Your Headline Here", "subheadline": "Supporting text that explains your value proposition", "ctaText": "Get Started", "ctaUrl": "#", "backgroundType": "gradient"}, "settings": {"padding": "lg"}}, {"id": "features-1", "type": "feature_grid", "content": {"columns": 3, "features": [{"icon": "Zap", "title": "Feature 1", "description": "Description of feature 1"}, {"icon": "Shield", "title": "Feature 2", "description": "Description of feature 2"}, {"icon": "Clock", "title": "Feature 3", "description": "Description of feature 3"}]}, "settings": {"padding": "lg"}}]}'
),
(
  'Blog Post',
  'Standard blog post with header image',
  'blog',
  true,
  '{"blocks": [{"id": "image-1", "type": "image", "content": {"src": "", "alt": "Featured image", "caption": ""}, "settings": {"fullWidth": true}}, {"id": "text-1", "type": "text", "content": {"html": "<p>Start writing your blog post here...</p>"}, "settings": {"padding": "md"}}]}'
),
(
  'Product Showcase',
  'Product page with image gallery and pricing',
  'product',
  true,
  '{"blocks": [{"id": "hero-1", "type": "hero", "content": {"headline": "Product Name", "subheadline": "Product tagline goes here", "backgroundType": "solid"}, "settings": {"padding": "md"}}, {"id": "gallery-1", "type": "gallery", "content": {"images": [], "layout": "grid"}, "settings": {"padding": "lg"}}, {"id": "pricing-1", "type": "pricing", "content": {"plans": [{"name": "Basic", "price": "R99", "features": ["Feature 1", "Feature 2"]}, {"name": "Pro", "price": "R199", "features": ["Feature 1", "Feature 2", "Feature 3"]}]}, "settings": {"padding": "lg"}}]}'
),
(
  'Coming Soon',
  'Simple coming soon page with countdown',
  'marketing',
  false,
  '{"blocks": [{"id": "hero-1", "type": "hero", "content": {"headline": "Coming Soon", "subheadline": "We are working on something amazing. Stay tuned!", "ctaText": "Notify Me", "ctaUrl": "#", "backgroundType": "gradient"}, "settings": {"padding": "xl", "centerContent": true}}]}'
)
ON CONFLICT DO NOTHING;
