-- Migration: Add Dynamic Pricing System Enhancement
-- Date: 2025-10-13
-- Purpose: Implement global dynamic pricing with real-time admin controls

-- Extend existing products table with dynamic pricing capabilities
ALTER TABLE products 
ADD COLUMN live_pricing JSONB DEFAULT '{}',
ADD COLUMN pricing_version INTEGER DEFAULT 1,
ADD COLUMN price_effective_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN price_expiry_date TIMESTAMPTZ,
ADD COLUMN is_promotional_active BOOLEAN DEFAULT DEFAULT false,
ADD COLUMN pricing_rules_applied TEXT[] DEFAULT '{}',
ADD COLUMN last_price_update TIMESTAMPTZ DEFAULT NOW();

-- Create pricing history table for audit trail
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
  -- Track which pricing rule was applied
  pricing_rule_id UUID NULL
);

-- Create pricing rules table for dynamic pricing logic
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL UNIQUE,
  rule_type TEXT CHECK (rule_type IN ('geographic', 'time_based', 'volume', 'customer_type', 'seasonal', 'weather_based')),
  conditions JSONB NOT NULL, -- Rule conditions (e.g., provinces, time periods, etc.)
  price_adjustment_type TEXT CHECK (price_adjustment_type IN ('percentage', 'fixed_amount', 'multiplier')),
  price_adjustment_value DECIMAL(10,4) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Higher priority rules override lower ones
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL,
  description TEXT,
  -- Geographic targeting
  target_provinces TEXT[] DEFAULT {},
  target_regions TEXT[] DEFAULT {},
  target_postal_codes TEXT[] DEFAULT {},
  -- Time-based targeting
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  active_days TEXT[] DEFAULT '{}', -- e.g., ['monday', 'tuesday']
  active_hours TEXT[] DEFAULT '{}', -- e.g., ['09:00-17:00']
);

-- Create pricing rule applications table to track which rules apply to which products
CREATE TABLE IF NOT EXISTS product_pricing_rule_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  pricing_rule_id UUID REFERENCES pricing_rules(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  applied_by TEXT,
  UNIQUE(product_id, pricing_rule_id)
);

-- Create live pricing cache table for performance
CREATE TABLE IF NOT EXISTS live_pricing_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE UNIQUE,
  cached_pricing JSONB NOT NULL,
  cache_key TEXT NOT NULL, -- Composite key for cache invalidation
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  effective_date TIMESTAMPTZ DEFAULT NOW(),
  applied_rules TEXT[] DEFAULT '{}',
  last_updated_by TEXT
);

-- Create pricing notifications table for admin alerts
CREATE TABLE IF NOT EXISTS pricing_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_type TEXT CHECK (notification_type IN ('price_change', 'price_increase', 'price_decrease', 'promotion_start', 'promotion_end', 'rule_violation')),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  target_user_id TEXT NULL, -- Specific admin user to notify
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium'
);

-- Create indexes for optimal performance
CREATE INDEX idx_product_pricing_history_product_id ON product_pricing_history(product_id);
CREATE INDEX idx_product_pricing_history_created_at ON product_pricing_history(created_at);
CREATE INDEX idx_product_pricing_history_changed_at ON product_pricing_history(changed_at);

CREATE INDEX idx_pricing_rules_type ON pricing_rules(rule_type);
CREATE INDEX idx_pricing_rules_active ON pricing_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_pricing_rules_priority ON pricing_rules(priority DESC, is_active DESC);

CREATE INDEX idx_product_pricing_rule_applications_product_id ON product_pricing_rule_applications(product_id);
CREATE INDEX idx_product_pricing_rule_applications_rule_id ON product_pricing_rule_applications(pricing_rule_id);

CREATE INDEX idx_live_pricing_cache_expires_at ON live_pricing_cache(expires_at);
CREATE INDEX idx_live_pricing_cache_product_id ON live_pricing_cache(product_id);

CREATE INDEX idx_pricing_notifications_unread ON pricing_notifications(is_read, created_at);
CREATE INDEX idx_pricing_notifications_type ON pricing_notifications(notification_type);

-- Create updated_at trigger function for pricing rules
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_pricing_rules_updated_at 
    BEFORE UPDATE ON pricing_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate effective pricing with rules applied
CREATE OR REPLACE FUNCTION calculate_effective_pricing(
    p_product_id UUID,
    p_context JSONB DEFAULT '{}' -- Optional context: {province: 'Gauteng', time: '14:30', customer_type: 'business'}
) RETURNS JSONB AS $$
DECLARE
    v_base_pricing JSONB;
    v_effective_pricing JSONB;
    v_applied_rules TEXT[] DEFAULT '{}';
    v_price_adjustment DECIMAL(10,2) DEFAULT 0;
    v_promotion_adjustment DECIMAL(10,2) DEFAULT 0;
    v_rule_record RECORD;
BEGIN
    -- Get base pricing from product
    SELECT live_pricing INTO v_base_pricing
    FROM products 
    WHERE id = p_product_id;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Start with base pricing
    v_effective_pricing := v_base_pricing;
    
    -- Apply active pricing rules based on context
    FOR v_rule_record IN 
        SELECT pr.*
        FROM pricing_rules pr
        INNER JOIN product_pricing_rule_applications pra 
            ON pr.id = pra.pricing_rule_id 
        WHERE pra.product_id = p_product_id 
            AND pra.is_active = true 
            AND pr.is_active = true
            AND (pr.start_date IS NULL OR pr.start_date <= NOW())
            AND (pr.end_date IS NULL OR pr.end_date >= NOW())
        ORDER BY pr.priority DESC
    LOOP
        -- Check if rule conditions are met (simplified logic)
        -- In production, this would be more sophisticated with full JSONB condition matching
        IF (
            -- Check geographic conditions
            (NOT v_rule_record.conditions ?::jsonb ?-> 'provinces' IS NULL OR 
             v_rule_record.conditions ?::jsonb ?-> 'provinces' @> (p_context ?::jsonb ?-> 'province')) OR
            -- Check time-based conditions  
            (NOT v_rule_record.conditions ?::jsonb ?-> 'active_hours' IS NULL OR
             EXTRACT(HOUR FROM NOW())::text @> (v_rule_record.conditions ?::jsonb ?-> 'active_hours'))
        ) THEN
            -- Apply price adjustment
            CASE v_rule_record.price_adjustment_type
                WHEN 'percentage' THEN
                    v_price_adjustment := (v_effective_pricing ?->>'monthly_price'::DECIMAL * v_rule_record.price_adjustment_value / 100);
                WHEN 'fixed_amount' THEN
                    v_price_adjustment := v_rule_record.price_adjustment_value;
                WHEN 'multiplier' THEN
                    v_price_adjustment := (v_effective_pricing ?->>'monthly_price'::DECIMAL * (v_rule_record.price_adjustment_value - 1));
            END CASE;
            
            -- Update effective pricing
            v_effective_pricing := v_effective_pricing || jsonb_build_object(
                'applied_rules', v_applied_rules || array[v_rule_record.rule_name],
                'price_adjustment', v_price_adjustment,
                'base_price', (v_effective_pricing ?->>'monthly_price'::DECIMAL),
                'adjusted_price', ((v_effective_pricing ?->>'monthly_price'::DECIMAL) + v_price_adjustment)
            );
            
            v_applied_rules := v_applied_rules || array[v_rule_record.rule_name];
        END IF;
    END LOOP;
    
    -- Return effective pricing with metadata
    RETURN v_effective_pricing || jsonb_build_object(
        'effective_date', NOW(),
        'applied_rules', v_applied_rules,
        'total_adjustment', v_price_adjustment
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create pricing history record
CREATE OR REPLACE FUNCTION create_pricing_history(
    p_product_id UUID,
    p_previous_price DECIMAL,
    p_new_price DECIMAL,
    p_change_type TEXT,
    p_changed_by TEXT,
    p_reason TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_history_id UUID;
BEGIN
    INSERT INTO product_pricing_history (
        product_id, 
        previous_price, 
        new_price, 
        change_type, 
        changed_by, 
        reason, 
        metadata
    ) VALUES (
        p_product_id, 
        p_previous_price, 
        p_new_price, 
        p_change_type, 
        p_changed_by, 
        p_reason, 
        p_metadata || jsonb_build_object('effective_date', NOW())
    ) RETURNING id INTO v_history_id;
    
    RETURN v_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for pricing tables (if RLS is enabled)
ALTER TABLE product_pricing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_pricing_rule_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_pricing_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies (示例 - adjust as needed for your RBAC system)
CREATE POLICY "Pricing history read policy" ON product_pricing_history
    FOR SELECT USING (true); -- Adjust based on your admin user permissions

CREATE POLICY "Pricing rules read policy" ON pricing_rules
    FOR SELECT USING (true);

CREATE POLICY "Pricing rules write policy" ON pricing_rules
    FOR ALL USING (true); -- Adjust based on admin permissions framework

-- Insert default pricing rules for geographic targeting
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
-- Geographic pricing for Gauteng (higher cost area)
('gauteng_premium', 'geographic', '{"provinces": ["Gauteng"], "adjustment_reason": "Higher operational costs"}', 'percentage', 5.0, 10, 'system', '5% premium for Gauteng region due to higher infrastructure costs'),

-- Discount for Western Cape (competitive market)
('western_cape_discount', 'geographic', '{"provinces": ["Western Cape"], "min_order_amount": 500}' , 'percentage', -3.0, 20, 'system', '3% discount for Western Cape orders over R500 to remain competitive'),

-- Business customer premium
('business_customer_premium', 'customer_type', '{"customer_types": ["business"], "min_speed": 50}' , 'percentage', 10.0, 15, 'system', '10% premium for business customers with speeds above 50Mbps'),

-- Off-peak discount for rural areas
('rural_off_peak_discount', 'time_based', '{"provinces": ["Limpopo", "Mpumalanga", "North West", "Free State", "Northern Cape"], "active_hours": ["00:00-06:00", "22:00-24:00"]}' , 'percentage', -8.0, 25, 'system', '8% off-peak discount for rural areas during night hours');

-- Cache default timezone and business rules settings
INSERT INTO live_pricing_cache (
    product_id, 
    cached_pricing, 
    cache_key, 
    expires_at, 
    effective_date,
    last_updated_by
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- System cache entry
    '{"default_currency": "ZAR", "vat_rate": 0.15, "default_timezone": "Africa/Johannesburg", "business_hours_start": "08:00", "business_hours_end": "17:00"}',
    'system_settings',
    NOW() + INTERVAL '24 hours',
    NOW(),
    'system'
);

-- Create trigger to automatically update last_price_update when pricing changes
CREATE OR REPLACE FUNCTION update_price_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_price_update = NEW.updated_at;
    
    -- Create pricing history if price actually changed
    IF OLD.monthly_price IS DISTINCT FROM NEW.monthly_price OR 
       OLD.promotion_price IS DISTINCT FROM NEW.promotion_price THEN
       
        -- Determine change type
        DECLARE v_change_type TEXT;
        DECLARE v_reason TEXT;
        
        IF NEW.promotion_price IS NOT NULL AND OLD.promotion_price IS NULL THEN
            v_change_type := 'promotion';
            v_reason := 'New promotional pricing applied';
        ELSIF NEW.promotion_price IS NULL AND OLD.promotion_price IS NOT NULL THEN
            v_change_type := 'promotion_end';
            v_reason := 'Promotional pricing ended';
        ELSIF NEW.monthly_price > OLD.monthly_price THEN
            v_change_type := 'increase';
            v_reason := 'Price increase applied';
        ELSE
            v_change_type := 'decrease';
            v_reason := 'Price decrease applied';
        END IF;
        
        PERFORM create_pricing_history(
            NEW.id,
            COALESCE(OLD.monthly_price, 0),
            NEW.monthly_price,
            v_change_type,
            COALESCE(NEW.updated_by, 'system'),
            v_reason,
            jsonb_build_object(
                'previous_promo_price', OLD.promotion_price,
                'new_promo_price', NEW.promotion_price,
                'effective_date', NEW.price_effective_date
            )
        );
    END IF;
    
    -- Update pricing version
    NEW.pricing_version := OLD.pricing_version + 1;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER pricing_update_trigger
    BEFORE UPDATE ON products
    FOR EACH ROW
    WHEN (
        OLD.monthly_price IS DISTINCT FROM NEW.monthly_price OR 
        OLD.promotion_price IS DISTINCT FROM NEW.promotion_price OR
        OLD.is_promotional_active IS DISTINCT FROM NEW.is_promotional_active OR
        OLD.price_expiry_date IS DISTINCT FROM NEW.price_expiry_date
    )
    EXECUTE FUNCTION update_price_timestamp();

-- Add comments for documentation
COMMENT ON TABLE product_pricing_history IS 'Tracks all price changes across the system with audit trail';
COMMENT ON TABLE pricing_rules IS 'Dynamic pricing rules for geographic, time-based, and customer segment pricing';
COMMENT ON TABLE product_pricing_rule_applications IS 'Maps products to pricing rules for targeted pricing';
COMMENT ON TABLE live_pricing_cache IS 'Performance optimized cache for calculated effective pricing';
COMMENT ON TABLE pricing_notifications IS 'Admin notifications for significant pricing events and changes';
