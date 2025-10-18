// Direct migration approach using existing database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function directMigration() {
  try {
    console.log('🗄️ Trying direct database migration...\n');

    // First, check current tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.log('❌ Cannot access information_schema:', tablesError.message);
    } else {
      console.log('📋 Current tables:', tables.map(t => t.table_name));
    }

    // Try to create pricing_rules table using a basic insert approach
    // This will fail if table doesn't exist, but we can catch specific errors
    console.log('\n📝 Attempting to create pricing_rules table...');
    
    // Try to insert a test rule - this will fail if table doesn't exist
    const testRule = {
      rule_name: 'test_rule',
      rule_type: 'geographic',
      conditions: {},
      price_adjustment_type: 'percentage',
      price_adjustment_value: 5.0,
      priority: 1,
      created_by: 'system',
      description: 'Test rule'
    };

    const { data, error } = await supabase
      .from('pricing_rules')
      .insert(testRule)
      .select();

    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('❌ pricing_rules table does not exist, creating manually...');
        
        // Since we can't execute DDL directly, let's provide instructions
        console.log('\n🔧 Manual Migration Required');
        console.log('Please run the following SQL in your Supabase dashboard:\n');
        
        const sqlStatements = `
-- Step 1: Extend products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS live_pricing JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS pricing_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS price_effective_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS price_expiry_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_promotional_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pricing_rules_applied TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_price_update TIMESTAMPTZ DEFAULT NOW();

-- Step 2: Create pricing_rules table
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

-- Step 3: Create other tables
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

CREATE TABLE IF NOT EXISTS product_pricing_rule_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  pricing_rule_id UUID REFERENCES pricing_rules(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  applied_by TEXT,
  UNIQUE(product_id, pricing_rule_id)
);

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

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_pricing_rules_type ON pricing_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_pricing_rules_priority ON pricing_rules(priority DESC, is_active DESC);
CREATE INDEX IF NOT EXISTS idx_product_pricing_history_product_id ON product_pricing_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_pricing_history_created_at ON product_pricing_history(created_at);
CREATE INDEX IF NOT EXISTS idx_product_pricing_rule_applications_product_id ON product_pricing_rule_applications(product_id);
CREATE INDEX IF NOT EXISTS idx_live_pricing_cache_expires_at ON live_pricing_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_live_pricing_cache_product_id ON live_pricing_cache(product_id);
CREATE INDEX IF NOT EXISTS idx_pricing_notifications_unread ON pricing_notifications(is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_pricing_notifications_type ON pricing_notifications(notification_type);

-- Step 5: Insert default pricing rules
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
('business_customer_premium', 'customer_type', '{"customer_types": ["business"], "min_speed": 50}' , 'percentage', 10.0, 15, 'system', '10% premium for business customers with speeds above 50Mbps')
ON CONFLICT (rule_name) DO NOTHING;
        `;
        
        console.log(sqlStatements);
        
      } else {
        console.log('❌ Other error:', error.message);
      }
    } else {
      console.log('✅ pricing_rules table exists and test record inserted');
      // Clean up test record
      await supabase.from('pricing_rules').delete().eq('rule_name', 'test_rule');
    }

  } catch (error) {
    console.error('💥 Migration attempt failed:', error);
  }
}

directMigration();
