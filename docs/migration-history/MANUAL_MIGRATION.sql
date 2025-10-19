-- ============================================================================
-- Dynamic Pricing System Migration - Run This in Supabase Dashboard SQL Editor
-- ============================================================================

-- Step 1: Extend products table with dynamic pricing capabilities
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS live_pricing JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS pricing_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS price_effective_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS price_expiry_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_promotional_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pricing_rules_applied TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_price_update TIMESTAMPTZ DEFAULT NOW();

-- Step 2: Create pricing_rules table for dynamic pricing logic
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL UNIQUE,
  rule_type TEXT CHECK (rule_type IN ('geographic', 'time_based', 'volume', 'customer_type', 'seasonal', 'weather_based')),
  conditions JSONB NOT NULL,
  price_adjustment_type TEXT CHECK (price_adjustment_type IN ('percentage', 'fixed_amount', 'multiplier')),
  price_adjustment_value DECIMAL(10,4) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  description TEXT,
  target_provinces TEXT[] DEFAULT '{}',
  target_regions TEXT[] DEFAULT '{}',
  target_postal_codes TEXT[] DEFAULT '{}',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  active_days TEXT[] DEFAULT '{}',
  active_hours TEXT[] DEFAULT '{}'
);

-- Step 3: Create product_pricing_history table for audit trail
CREATE TABLE IF NOT EXISTS product_pricing_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  previous_price DECIMAL(10,2) NOT NULL,
  new_price DECIMAL(10,2) NOT NULL,
  previous_promotion_price DECIMAL(10,2),
  new_promotion_price DECIMAL(10,2),
  change_type TEXT CHECK (change_type IN ('increase', 'decrease', 'promotion', 'promotion_end', 'rule_application', 'manual_update')),
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  effective_date TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  pricing_rule_id UUID NULL
);

-- Step 4: Create product_pricing_rule_applications table
CREATE TABLE IF NOT EXISTS product_pricing_rule_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  pricing_rule_id UUID REFERENCES pricing_rules(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  applied_by TEXT,
  UNIQUE(product_id, pricing_rule_id)
);

-- Step 5: Create live_pricing_cache table for performance
CREATE TABLE IF NOT EXISTS live_pricing_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE UNIQUE,
  cached_pricing JSONB NOT NULL,
  cache_key TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  effective_date TIMESTAMPTZ DEFAULT NOW(),
  applied_rules TEXT[] DEFAULT '{}',
  last_updated_by TEXT
);

-- Step 6: Create pricing_notifications table for admin alerts
CREATE TABLE IF NOT EXISTS pricing_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_type TEXT CHECK (notification_type IN ('price_change', 'price_increase', 'price_decrease', 'promotion_start', 'promotion_end', 'rule_violation')),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  target_user_id TEXT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium'
);

-- Step 7: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_pricing_rules_type ON pricing_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_pricing_rules_priority ON pricing_rules(priority DESC, is_active DESC);

CREATE INDEX IF NOT EXISTS idx_product_pricing_history_product_id ON product_pricing_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_pricing_history_created_at ON product_pricing_history(created_at);
CREATE INDEX IF NOT EXISTS idx_product_pricing_history_changed_at ON product_pricing_history(changed_at);

CREATE INDEX IF NOT EXISTS idx_product_pricing_rule_applications_product_id ON product_pricing_rule_applications(product_id);
CREATE INDEX IF NOT EXISTS idx_product_pricing_rule_applications_rule_id ON product_pricing_rule_applications(pricing_rule_id);

CREATE INDEX IF NOT EXISTS idx_live_pricing_cache_expires_at ON live_pricing_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_live_pricing_cache_product_id ON live_pricing_cache(product_id);

CREATE INDEX IF NOT EXISTS idx_pricing_notifications_unread ON pricing_notifications(is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_pricing_notifications_type ON pricing_notifications(notification_type);

-- Step 8: Create trigger function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for pricing_rules
DROP TRIGGER IF EXISTS update_pricing_rules_updated_at ON pricing_rules;
CREATE TRIGGER update_pricing_rules_updated_at 
    BEFORE UPDATE ON pricing_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Insert default pricing rules
INSERT INTO pricing_rules (
  rule_name,
  rule_type,
  conditions,
  price_adjustment_type,
  price_adjustment_value,
  priority,
  created_by,
  description
) VALUES
('gauteng_premium', 'geographic', '{"provinces": ["Gauteng"], "adjustment_reason": "Higher operational costs"}', 'percentage', 5.0, 10, 'system', '5% premium for Gauteng region due to higher infrastructure costs'),

('western_cape_discount', 'geographic', '{"provinces": ["Western Cape"], "min_order_amount": 500}' , 'percentage', -3.0, 20, 'system', '3% discount for Western Cape orders over R500 to remain competitive'),

('business_customer_premium', 'customer_type', '{"customer_types": ["business"], "min_speed": 50}' , 'percentage', 10.0, 15, 'system', '10% premium for business customers with speeds above 50Mbps'),

('rural_off_peak_discount', 'time_based', '{"provinces": ["Limpopo", "Mpumalanga", "North West", "Free State", "Northern Cape"], "active_hours": ["00:00-06:00", "22:00-24:00"]}' , 'percentage', -8.0, 25, 'system', '8% off-peak discount for rural areas during night hours')
ON CONFLICT (rule_name) DO NOTHING;

-- Step 10: Add table comments for documentation
COMMENT ON TABLE product_pricing_history IS 'Tracks all price changes across the system with audit trail';
COMMENT ON TABLE pricing_rules IS 'Dynamic pricing rules for geographic, time-based, and customer segment pricing';
COMMENT ON TABLE product_pricing_rule_applications IS 'Maps products to pricing rules for targeted pricing';
COMMENT ON TABLE live_pricing_cache IS 'Performance optimized cache for calculated effective pricing';
COMMENT ON TABLE pricing_notifications IS 'Admin notifications for significant pricing events and changes';

-- ============================================================================
-- Migration Complete!
-- ============================================================================

-- Verify tables were created
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'pricing_rules',
    'product_pricing_history', 
    'product_pricing_rule_applications',
    'live_pricing_cache',
    'pricing_notifications'
  )
ORDER BY tablename;
