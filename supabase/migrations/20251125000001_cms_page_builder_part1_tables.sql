-- ============================================
-- CMS Page Builder - Part 1: Core Tables
-- Run this first
-- ============================================

-- Drop existing tables if any (clean slate)
DROP TABLE IF EXISTS cms_page_versions CASCADE;
DROP TABLE IF EXISTS cms_media CASCADE;
DROP TABLE IF EXISTS cms_ai_usage CASCADE;
DROP TABLE IF EXISTS cms_templates CASCADE;
DROP TABLE IF EXISTS cms_pages CASCADE;

-- ============================================
-- CMS Pages Table
-- ============================================
CREATE TABLE cms_pages (
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CMS Templates Table
-- ============================================
CREATE TABLE cms_templates (
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CMS AI Usage Table
-- ============================================
CREATE TABLE cms_ai_usage (
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CMS Media Table
-- ============================================
CREATE TABLE cms_media (
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

-- ============================================
-- CMS Page Versions Table
-- ============================================
CREATE TABLE cms_page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content JSONB NOT NULL,
  seo_metadata JSONB,
  change_summary VARCHAR(500),
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_id, version)
);

-- Add comments
COMMENT ON TABLE cms_pages IS 'CMS pages created via the drag-and-drop page builder';
COMMENT ON TABLE cms_templates IS 'Reusable page templates for the CMS page builder';
COMMENT ON TABLE cms_ai_usage IS 'Tracks AI generation usage for rate limiting and cost monitoring';
COMMENT ON TABLE cms_media IS 'Media library for CMS page builder assets';
COMMENT ON TABLE cms_page_versions IS 'Version history for CMS pages';
