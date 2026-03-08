-- Device-Customer Linking Migration
-- Links Ruijie devices to consumer_orders or corporate_sites
-- Task 1.1 of Network Management Feature Plan

-- Add customer linking columns to ruijie_device_cache
ALTER TABLE ruijie_device_cache
ADD COLUMN customer_order_id UUID REFERENCES consumer_orders(id) ON DELETE SET NULL,
ADD COLUMN corporate_site_id UUID REFERENCES corporate_sites(id) ON DELETE SET NULL,
ADD COLUMN customer_name TEXT,
ADD COLUMN customer_email TEXT,
ADD COLUMN customer_phone TEXT,
ADD COLUMN support_notes TEXT,
ADD COLUMN support_notes_updated_at TIMESTAMPTZ,
ADD COLUMN support_notes_updated_by UUID REFERENCES admin_users(id);

-- Index for customer lookups
CREATE INDEX idx_ruijie_device_cache_customer_order ON ruijie_device_cache(customer_order_id) WHERE customer_order_id IS NOT NULL;
CREATE INDEX idx_ruijie_device_cache_corporate_site ON ruijie_device_cache(corporate_site_id) WHERE corporate_site_id IS NOT NULL;
CREATE INDEX idx_ruijie_device_cache_customer_email ON ruijie_device_cache(customer_email) WHERE customer_email IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN ruijie_device_cache.customer_order_id IS 'Link to consumer_orders for residential customers';
COMMENT ON COLUMN ruijie_device_cache.corporate_site_id IS 'Link to corporate_sites for B2B (e.g., Unjani)';
COMMENT ON COLUMN ruijie_device_cache.customer_name IS 'Cached customer name for quick display';
COMMENT ON COLUMN ruijie_device_cache.customer_email IS 'Cached customer email for quick lookup';
COMMENT ON COLUMN ruijie_device_cache.customer_phone IS 'Cached customer phone for quick contact';
COMMENT ON COLUMN ruijie_device_cache.support_notes IS 'Free-text notes from support staff about device issues';
COMMENT ON COLUMN ruijie_device_cache.support_notes_updated_at IS 'Timestamp of last support notes update';
COMMENT ON COLUMN ruijie_device_cache.support_notes_updated_by IS 'Admin user who last updated support notes';
