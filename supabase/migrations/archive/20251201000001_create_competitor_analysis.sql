-- ============================================
-- COMPETITOR ANALYSIS MODULE
-- Migration: 20251201000001_create_competitor_analysis.sql
-- Description: Creates tables for competitor price tracking and market analysis
-- ============================================

-- ============================================
-- TABLE: competitor_providers
-- Purpose: Registry of competitor providers to track
-- ============================================
CREATE TABLE IF NOT EXISTS competitor_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                              -- "MTN", "Vodacom", etc.
  slug TEXT UNIQUE NOT NULL,                       -- "mtn", "vodacom"
  website TEXT NOT NULL,
  logo_url TEXT,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('mobile', 'fibre', 'both')),
  scrape_urls JSONB DEFAULT '[]'::jsonb,           -- URLs to scrape
  scrape_config JSONB DEFAULT '{}'::jsonb,         -- Provider-specific config
  is_active BOOLEAN DEFAULT true,
  last_scraped_at TIMESTAMPTZ,
  scrape_frequency TEXT DEFAULT 'weekly' CHECK (scrape_frequency IN ('daily', 'weekly', 'manual')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE competitor_providers IS 'Registry of competitor providers for price tracking';

-- ============================================
-- TABLE: competitor_products
-- Purpose: Scraped competitor product data
-- ============================================
CREATE TABLE IF NOT EXISTS competitor_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES competitor_providers(id) ON DELETE CASCADE,
  external_id TEXT,                                -- Their product ID/SKU
  product_name TEXT NOT NULL,
  product_type TEXT CHECK (product_type IN ('mobile_contract', 'fibre', 'lte', 'device', 'data_only', 'prepaid')),

  -- Pricing
  monthly_price DECIMAL(10,2),
  once_off_price DECIMAL(10,2),
  price_includes_vat BOOLEAN DEFAULT true,

  -- Product details
  contract_term INTEGER,                           -- Months (12, 24, 36)
  data_bundle TEXT,                                -- "50GB", "Unlimited"
  data_gb DECIMAL(10,2),                           -- Parsed numeric value
  speed_mbps INTEGER,                              -- For fibre/LTE
  device_name TEXT,                                -- If bundled with device
  technology TEXT CHECK (technology IN ('LTE', '5G', 'Fibre', 'ADSL', 'Wireless', NULL)),

  -- Metadata
  source_url TEXT,
  raw_data JSONB,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  is_current BOOLEAN DEFAULT true,                 -- Latest version flag

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE competitor_products IS 'Scraped product data from competitor websites';

-- ============================================
-- TABLE: competitor_price_history
-- Purpose: Historical price tracking for trend analysis
-- ============================================
CREATE TABLE IF NOT EXISTS competitor_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_product_id UUID NOT NULL REFERENCES competitor_products(id) ON DELETE CASCADE,
  monthly_price DECIMAL(10,2),
  once_off_price DECIMAL(10,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE competitor_price_history IS 'Historical price records for tracking changes over time';

-- ============================================
-- TABLE: product_competitor_matches
-- Purpose: Map CircleTel products to competitor equivalents
-- ============================================
CREATE TABLE IF NOT EXISTS product_competitor_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- CircleTel product (polymorphic - can match different product types)
  product_type TEXT NOT NULL CHECK (product_type IN ('mtn_dealer', 'fibre', 'lte', 'product', 'service_package')),
  product_id UUID NOT NULL,

  -- Competitor product
  competitor_product_id UUID NOT NULL REFERENCES competitor_products(id) ON DELETE CASCADE,

  -- Match quality
  match_confidence DECIMAL(3,2) CHECK (match_confidence >= 0 AND match_confidence <= 1),
  match_method TEXT CHECK (match_method IN ('auto', 'manual')),
  matched_by UUID REFERENCES auth.users(id),
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate matches
  UNIQUE(product_type, product_id, competitor_product_id)
);

-- Add comment
COMMENT ON TABLE product_competitor_matches IS 'Mapping between CircleTel products and competitor equivalents';

-- ============================================
-- TABLE: competitor_scrape_logs
-- Purpose: Audit trail for scrape operations
-- ============================================
CREATE TABLE IF NOT EXISTS competitor_scrape_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES competitor_providers(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  products_found INTEGER DEFAULT 0,
  products_updated INTEGER DEFAULT 0,
  products_new INTEGER DEFAULT 0,
  error_message TEXT,
  firecrawl_credits_used INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  triggered_by UUID REFERENCES auth.users(id),
  trigger_type TEXT DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'scheduled'))
);

-- Add comment
COMMENT ON TABLE competitor_scrape_logs IS 'Audit log for all scrape operations';

-- ============================================
-- INDEXES
-- ============================================

-- competitor_providers indexes
CREATE INDEX IF NOT EXISTS idx_competitor_providers_slug ON competitor_providers(slug);
CREATE INDEX IF NOT EXISTS idx_competitor_providers_active ON competitor_providers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_competitor_providers_type ON competitor_providers(provider_type);

-- competitor_products indexes
CREATE INDEX IF NOT EXISTS idx_competitor_products_provider ON competitor_products(provider_id);
CREATE INDEX IF NOT EXISTS idx_competitor_products_current ON competitor_products(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_competitor_products_type ON competitor_products(product_type);
CREATE INDEX IF NOT EXISTS idx_competitor_products_external ON competitor_products(provider_id, external_id);
CREATE INDEX IF NOT EXISTS idx_competitor_products_scraped ON competitor_products(scraped_at DESC);

-- competitor_price_history indexes
CREATE INDEX IF NOT EXISTS idx_price_history_product ON competitor_price_history(competitor_product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON competitor_price_history(recorded_at DESC);

-- product_competitor_matches indexes
CREATE INDEX IF NOT EXISTS idx_product_matches_product ON product_competitor_matches(product_type, product_id);
CREATE INDEX IF NOT EXISTS idx_product_matches_competitor ON product_competitor_matches(competitor_product_id);

-- competitor_scrape_logs indexes
CREATE INDEX IF NOT EXISTS idx_scrape_logs_provider ON competitor_scrape_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_status ON competitor_scrape_logs(status);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_started ON competitor_scrape_logs(started_at DESC);

-- ============================================
-- VIEWS
-- ============================================

-- View: Price comparison results (joins matches with products and providers)
CREATE OR REPLACE VIEW v_competitor_price_comparison AS
SELECT
  pcm.id AS match_id,
  pcm.product_type,
  pcm.product_id,
  pcm.match_confidence,
  pcm.match_method,
  cp.id AS competitor_product_id,
  cp.provider_id,
  prov.name AS competitor_name,
  prov.slug AS competitor_slug,
  prov.logo_url AS competitor_logo,
  cp.product_name AS competitor_product,
  cp.monthly_price AS competitor_price,
  cp.once_off_price AS competitor_once_off,
  cp.data_bundle AS competitor_data,
  cp.data_gb AS competitor_data_gb,
  cp.contract_term AS competitor_term,
  cp.technology AS competitor_technology,
  cp.device_name AS competitor_device,
  cp.scraped_at,
  cp.source_url
FROM product_competitor_matches pcm
JOIN competitor_products cp ON pcm.competitor_product_id = cp.id
JOIN competitor_providers prov ON cp.provider_id = prov.id
WHERE cp.is_current = true;

-- Add comment
COMMENT ON VIEW v_competitor_price_comparison IS 'Denormalized view for easy price comparison queries';

-- View: Provider summary statistics
CREATE OR REPLACE VIEW v_competitor_provider_stats AS
SELECT
  p.id,
  p.name,
  p.slug,
  p.website,
  p.logo_url,
  p.provider_type,
  p.is_active,
  p.scrape_frequency,
  p.last_scraped_at,
  COUNT(cp.id) AS total_products,
  COUNT(CASE WHEN cp.is_current THEN 1 END) AS current_products,
  ROUND(AVG(cp.monthly_price)::numeric, 2) AS avg_monthly_price,
  MIN(cp.monthly_price) AS min_monthly_price,
  MAX(cp.monthly_price) AS max_monthly_price,
  COUNT(DISTINCT pcm.id) AS matched_products
FROM competitor_providers p
LEFT JOIN competitor_products cp ON p.id = cp.provider_id
LEFT JOIN product_competitor_matches pcm ON cp.id = pcm.competitor_product_id
GROUP BY p.id;

-- Add comment
COMMENT ON VIEW v_competitor_provider_stats IS 'Aggregate statistics per competitor provider';

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE competitor_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_competitor_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_scrape_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only access via service role
-- These tables contain sensitive competitive intelligence data
-- All access should go through API routes using service role

CREATE POLICY "Service role full access on competitor_providers"
  ON competitor_providers FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on competitor_products"
  ON competitor_products FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on competitor_price_history"
  ON competitor_price_history FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on product_competitor_matches"
  ON product_competitor_matches FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on competitor_scrape_logs"
  ON competitor_scrape_logs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- TRIGGERS: Auto-update updated_at timestamp
-- ============================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_competitor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for competitor_providers
DROP TRIGGER IF EXISTS trigger_competitor_providers_updated_at ON competitor_providers;
CREATE TRIGGER trigger_competitor_providers_updated_at
  BEFORE UPDATE ON competitor_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_competitor_updated_at();

-- Trigger for competitor_products
DROP TRIGGER IF EXISTS trigger_competitor_products_updated_at ON competitor_products;
CREATE TRIGGER trigger_competitor_products_updated_at
  BEFORE UPDATE ON competitor_products
  FOR EACH ROW
  EXECUTE FUNCTION update_competitor_updated_at();

-- Trigger for product_competitor_matches
DROP TRIGGER IF EXISTS trigger_product_matches_updated_at ON product_competitor_matches;
CREATE TRIGGER trigger_product_matches_updated_at
  BEFORE UPDATE ON product_competitor_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_competitor_updated_at();

-- ============================================
-- SEED DATA: Initial competitor providers
-- ============================================

INSERT INTO competitor_providers (name, slug, website, provider_type, scrape_urls, is_active, scrape_frequency) VALUES
-- Mobile/Wireless Providers (High Priority)
('MTN', 'mtn', 'https://www.mtn.co.za', 'mobile',
 '["https://www.mtn.co.za/shop/deals/devices/phones", "https://www.mtn.co.za/shop/deals/contracts", "https://www.mtn.co.za/shop/deals/contracts/data-only", "https://www.mtn.co.za/business/shop/devices"]'::jsonb,
 true, 'weekly'),

('Vodacom', 'vodacom', 'https://www.vodacom.co.za', 'mobile',
 '["https://www.vodacom.co.za/vodacom/shopping/smartphones", "https://www.vodacom.co.za/vodacom/shopping/contracts"]'::jsonb,
 false, 'weekly'),

('Rain', 'rain', 'https://www.rain.co.za', 'mobile',
 '["https://www.rain.co.za/5g", "https://www.rain.co.za/4g"]'::jsonb,
 false, 'weekly'),

('Telkom', 'telkom', 'https://www.telkom.co.za', 'both',
 '["https://www.telkom.co.za/shop/plan/postpaid", "https://www.telkom.co.za/shop/plan/fibre"]'::jsonb,
 false, 'weekly'),

('Cell C', 'cellc', 'https://www.cellc.co.za', 'mobile',
 '[]'::jsonb,
 false, 'manual'),

-- Fibre/ISP Providers
('Afrihost', 'afrihost', 'https://www.afrihost.com', 'fibre',
 '["https://www.afrihost.com/fibre", "https://www.afrihost.com/lte"]'::jsonb,
 false, 'weekly'),

('WebAfrica', 'webafrica', 'https://www.webafrica.co.za', 'fibre',
 '["https://www.webafrica.co.za/fibre", "https://www.webafrica.co.za/lte"]'::jsonb,
 false, 'weekly'),

('Supersonic', 'supersonic', 'https://www.supersonic.co.za', 'fibre',
 '["https://www.supersonic.co.za/fibre", "https://www.supersonic.co.za/lte"]'::jsonb,
 false, 'weekly'),

('Cool Ideas', 'coolideas', 'https://www.coolideas.co.za', 'fibre',
 '["https://www.coolideas.co.za/fibre"]'::jsonb,
 false, 'weekly'),

('RSAWEB', 'rsaweb', 'https://www.rsaweb.co.za', 'fibre',
 '["https://www.rsaweb.co.za/fibre", "https://www.rsaweb.co.za/lte"]'::jsonb,
 false, 'manual'),

('Herotel', 'herotel', 'https://www.herotel.com', 'fibre',
 '[]'::jsonb,
 false, 'manual')

ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- GRANTS (for completeness, handled by RLS)
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant select on views to authenticated users (views respect underlying RLS)
GRANT SELECT ON v_competitor_price_comparison TO authenticated;
GRANT SELECT ON v_competitor_provider_stats TO authenticated;
