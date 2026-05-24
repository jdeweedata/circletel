-- =====================================================
-- CircleTel Email Templates System
-- Created: 2025-11-08
-- Purpose: Email template management with slice composition
-- =====================================================

-- =====================================================
-- 1. EMAIL TEMPLATES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('transactional', 'marketing', 'system', 'partner')),

  -- Email content
  subject_template TEXT NOT NULL,
  slice_composition JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Available variables (for documentation)
  variables JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Template metadata
  active BOOLEAN DEFAULT true,
  send_count INTEGER DEFAULT 0,
  last_sent_at TIMESTAMPTZ,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES admin_users(id),
  updated_by UUID REFERENCES admin_users(id)
);

-- Indexes
CREATE INDEX idx_email_templates_template_id ON email_templates(template_id);
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_active ON email_templates(active);

-- Update timestamp trigger
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE email_templates IS 'Email template definitions with slice-based composition';
COMMENT ON COLUMN email_templates.slice_composition IS 'Array of slice configurations: [{ type: "hero", props: {...} }]';
COMMENT ON COLUMN email_templates.variables IS 'Available template variables: { customerName: { type: "string", required: true } }';

-- =====================================================
-- 2. EMAIL TEMPLATE VERSIONS TABLE (A/B Testing)
-- =====================================================

CREATE TABLE IF NOT EXISTS email_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL REFERENCES email_templates(template_id) ON DELETE CASCADE,
  version_name TEXT NOT NULL,

  -- Version-specific configuration
  subject_template TEXT NOT NULL,
  slice_composition JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Version status
  is_active BOOLEAN DEFAULT false,
  is_winner BOOLEAN DEFAULT false,

  -- Performance metrics
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  bounce_count INTEGER DEFAULT 0,
  unsubscribe_count INTEGER DEFAULT 0,

  -- Calculated metrics
  open_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN sent_count > 0
    THEN (open_count::DECIMAL / sent_count::DECIMAL) * 100
    ELSE 0 END
  ) STORED,
  click_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN sent_count > 0
    THEN (click_count::DECIMAL / sent_count::DECIMAL) * 100
    ELSE 0 END
  ) STORED,

  -- A/B test configuration
  test_start_date TIMESTAMPTZ,
  test_end_date TIMESTAMPTZ,
  traffic_percentage INTEGER CHECK (traffic_percentage BETWEEN 0 AND 100),

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES admin_users(id)
);

-- Indexes
CREATE INDEX idx_email_template_versions_template_id ON email_template_versions(template_id);
CREATE INDEX idx_email_template_versions_is_active ON email_template_versions(is_active);
CREATE INDEX idx_email_template_versions_is_winner ON email_template_versions(is_winner);

-- Update timestamp trigger
CREATE TRIGGER update_email_template_versions_updated_at
  BEFORE UPDATE ON email_template_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Constraint: Only one active version per template per time
CREATE UNIQUE INDEX idx_one_active_version_per_template
  ON email_template_versions(template_id)
  WHERE is_active = true;

COMMENT ON TABLE email_template_versions IS 'Email template versions for A/B testing';
COMMENT ON COLUMN email_template_versions.traffic_percentage IS 'Percentage of emails sent using this version (0-100)';

-- =====================================================
-- 3. CMS PAGES TABLE (Prismic Metadata Cache)
-- =====================================================

CREATE TABLE IF NOT EXISTS cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  prismic_id TEXT,
  prismic_uid TEXT,

  -- Page metadata
  page_type TEXT NOT NULL CHECK (page_type IN ('landing_page', 'blog_post', 'service_page', 'homepage', 'custom')),
  title TEXT,

  -- SEO metadata
  seo_metadata JSONB DEFAULT '{}'::jsonb,

  -- Caching
  cached_slices JSONB,
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT CHECK (sync_status IN ('synced', 'pending', 'failed', 'deleted')),

  -- Publishing
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_cms_pages_slug ON cms_pages(slug);
CREATE INDEX idx_cms_pages_page_type ON cms_pages(page_type);
CREATE INDEX idx_cms_pages_status ON cms_pages(status);
CREATE INDEX idx_cms_pages_prismic_id ON cms_pages(prismic_id);

-- Update timestamp trigger
CREATE TRIGGER update_cms_pages_updated_at
  BEFORE UPDATE ON cms_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE cms_pages IS 'Prismic CMS page metadata and cache';
COMMENT ON COLUMN cms_pages.seo_metadata IS 'SEO fields: { title, description, keywords, ogImage, canonical }';
COMMENT ON COLUMN cms_pages.cached_slices IS 'Cached Prismic slice data for performance';

-- =====================================================
-- 4. SEED DATA: DEFAULT EMAIL TEMPLATES
-- =====================================================

INSERT INTO email_templates (template_id, name, description, category, subject_template, slice_composition, variables) VALUES
-- Consumer (B2C) Templates
('order_confirmation', 'Order Confirmation', 'Sent when customer order is confirmed', 'transactional', 'Order Confirmed: {{orderNumber}}',
  '[
    {"type": "header"},
    {"type": "hero", "props": {"title": "Order Confirmed!", "icon": "✅", "variant": "gradient"}},
    {"type": "text", "props": {"children": "Thank you {{customerName}}, your order has been confirmed."}},
    {"type": "service_details", "props": {"details": []}},
    {"type": "button", "props": {"children": "View Order", "href": "{{orderUrl}}"}},
    {"type": "footer"}
  ]'::jsonb,
  '{"customerName": {"type": "string", "required": true}, "orderNumber": {"type": "string", "required": true}, "orderUrl": {"type": "string", "required": true}}'::jsonb),

('payment_received', 'Payment Received', 'Sent when payment is successfully processed', 'transactional', 'Payment Received: {{paymentAmount}}',
  '[
    {"type": "header"},
    {"type": "hero", "props": {"title": "Payment Received", "icon": "💰", "variant": "light"}},
    {"type": "text", "props": {"children": "We have received your payment of {{paymentAmount}}."}},
    {"type": "button", "props": {"children": "View Receipt", "href": "{{receiptUrl}}"}},
    {"type": "footer"}
  ]'::jsonb,
  '{"customerName": {"type": "string", "required": true}, "paymentAmount": {"type": "string", "required": true}, "paymentMethod": {"type": "string", "required": false}}'::jsonb),

('installation_scheduled', 'Installation Scheduled', 'Sent when installation is scheduled', 'transactional', 'Installation Scheduled: {{installationDate}}',
  '[
    {"type": "header"},
    {"type": "hero", "props": {"title": "Installation Scheduled", "icon": "📅", "variant": "gradient"}},
    {"type": "text", "props": {"children": "Your installation is scheduled for {{installationDate}} at {{installationTime}}."}},
    {"type": "service_details", "props": {"details": []}},
    {"type": "footer"}
  ]'::jsonb,
  '{"customerName": {"type": "string", "required": true}, "installationDate": {"type": "string", "required": true}, "installationTime": {"type": "string", "required": true}, "installationAddress": {"type": "string", "required": true}}'::jsonb),

('service_activated', 'Service Activated', 'Sent when service is activated with credentials', 'transactional', 'Welcome to CircleTel - Service Activated',
  '[
    {"type": "header"},
    {"type": "hero", "props": {"title": "Welcome to CircleTel!", "icon": "🎉", "variant": "gradient"}},
    {"type": "text", "props": {"children": "Your service has been activated. Here are your login credentials:"}},
    {"type": "service_details", "props": {"details": []}},
    {"type": "button", "props": {"children": "Login Now", "href": "{{loginUrl}}"}},
    {"type": "footer"}
  ]'::jsonb,
  '{"customerName": {"type": "string", "required": true}, "username": {"type": "string", "required": true}, "password": {"type": "string", "required": true}, "loginUrl": {"type": "string", "required": true}}'::jsonb),

-- Business (B2B) Templates
('quote_sent', 'Quote Sent', 'Sent when business quote is generated', 'transactional', 'Your CircleTel Quote: {{quoteNumber}}',
  '[
    {"type": "header"},
    {"type": "hero", "props": {"title": "Quote Ready", "icon": "📄", "variant": "light"}},
    {"type": "text", "props": {"children": "Dear {{customerName}}, your quote {{quoteNumber}} is ready."}},
    {"type": "button", "props": {"children": "View Quote", "href": "{{quoteUrl}}"}},
    {"type": "footer"}
  ]'::jsonb,
  '{"customerName": {"type": "string", "required": true}, "companyName": {"type": "string", "required": false}, "quoteNumber": {"type": "string", "required": true}, "quoteUrl": {"type": "string", "required": true}}'::jsonb),

('invoice_generated', 'Invoice Generated', 'Sent when invoice is generated', 'transactional', 'Invoice {{invoiceNumber}} - Amount Due: {{totalAmount}}',
  '[
    {"type": "header"},
    {"type": "hero", "props": {"title": "Invoice Ready", "icon": "📋", "variant": "light"}},
    {"type": "text", "props": {"children": "Your invoice {{invoiceNumber}} is ready."}},
    {"type": "invoice_table", "props": {}},
    {"type": "button", "props": {"children": "Pay Now", "href": "{{paymentUrl}}"}},
    {"type": "footer"}
  ]'::jsonb,
  '{"customerName": {"type": "string", "required": true}, "invoiceNumber": {"type": "string", "required": true}, "totalAmount": {"type": "string", "required": true}, "paymentUrl": {"type": "string", "required": true}}'::jsonb);

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;

-- Email Templates: Admin users can manage all templates
CREATE POLICY "Admin users can manage email templates"
  ON email_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

-- Email Template Versions: Admin users can manage all versions
CREATE POLICY "Admin users can manage email template versions"
  ON email_template_versions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

-- CMS Pages: Admin users can manage all pages
CREATE POLICY "Admin users can manage CMS pages"
  ON cms_pages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

-- Public read access to published CMS pages
CREATE POLICY "Public can read published CMS pages"
  ON cms_pages
  FOR SELECT
  TO anon
  USING (status = 'published');

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to increment send count for email template
CREATE OR REPLACE FUNCTION increment_email_template_send_count(p_template_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE email_templates
  SET send_count = send_count + 1,
      last_sent_at = now()
  WHERE template_id = p_template_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record email metrics (version)
CREATE OR REPLACE FUNCTION record_email_version_metrics(
  p_version_id UUID,
  p_metric_type TEXT, -- 'sent', 'open', 'click', 'bounce', 'unsubscribe'
  p_count INTEGER DEFAULT 1
)
RETURNS void AS $$
BEGIN
  UPDATE email_template_versions
  SET
    sent_count = CASE WHEN p_metric_type = 'sent' THEN sent_count + p_count ELSE sent_count END,
    open_count = CASE WHEN p_metric_type = 'open' THEN open_count + p_count ELSE open_count END,
    click_count = CASE WHEN p_metric_type = 'click' THEN click_count + p_count ELSE click_count END,
    bounce_count = CASE WHEN p_metric_type = 'bounce' THEN bounce_count + p_count ELSE bounce_count END,
    unsubscribe_count = CASE WHEN p_metric_type = 'unsubscribe' THEN unsubscribe_count + p_count ELSE unsubscribe_count END,
    updated_at = now()
  WHERE id = p_version_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. VIEWS FOR REPORTING
-- =====================================================

-- View: Email template performance
CREATE OR REPLACE VIEW v_email_template_performance AS
SELECT
  et.template_id,
  et.name,
  et.category,
  et.send_count AS total_sent,
  et.last_sent_at,
  COUNT(etv.id) AS version_count,
  COUNT(etv.id) FILTER (WHERE etv.is_active = true) AS active_versions,
  AVG(etv.open_rate) AS avg_open_rate,
  AVG(etv.click_rate) AS avg_click_rate
FROM email_templates et
LEFT JOIN email_template_versions etv ON et.template_id = etv.template_id
GROUP BY et.template_id, et.name, et.category, et.send_count, et.last_sent_at;

COMMENT ON VIEW v_email_template_performance IS 'Email template performance metrics and A/B test results';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Add migration record (if you have a migrations tracking table)
-- INSERT INTO schema_migrations (version, name, executed_at)
-- VALUES ('20251108060000', 'create_email_templates_system', now());
