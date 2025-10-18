// Apply dynamic pricing migration
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  try {
    console.log('🗄️  Applying dynamic pricing migration...\n');

    // 1. Extend products table
    console.log('📝 Extending products table...');
    const { error: prodError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS live_pricing JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS pricing_version INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS price_effective_date TIMESTAMPTZ DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS price_expiry_date TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS is_promotional_active BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS pricing_rules_applied TEXT[] DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS last_price_update TIMESTAMPTZ DEFAULT NOW();
      `
    });

    if (prodError) {
      console.error('❌ Products table error:', prodError);
    } else {
      console.log('✅ Products table extended');
    }

    // 2. Create pricing_rules table
    console.log('\n📝 Creating pricing_rules table...');
    const { error: rulesError } = await supabase.rpc('exec_sql', {
      sql: `
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
        
        CREATE INDEX IF NOT EXISTS idx_pricing_rules_type ON pricing_rules(rule_type);
        CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(is_active) WHERE is_active = true;
        CREATE INDEX IF NOT EXISTS idx_pricing_rules_priority ON pricing_rules(priority DESC, is_active DESC);
      `
    });

    if (rulesError) {
      console.error('❌ pricing_rules error:', rulesError);
    } else {
      console.log('✅ pricing_rules table created');
    }

    // 3. Create product_pricing_history table
    console.log('\n📝 Creating product_pricing_history table...');
    const { error: historyError } = await supabase.rpc('exec_sql', {
      sql: `
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
        
        CREATE INDEX IF NOT EXISTS idx_product_pricing_history_product_id ON product_pricing_history(product_id);
        CREATE INDEX IF NOT EXISTS idx_product_pricing_history_created_at ON product_pricing_history(created_at);
        CREATE INDEX IF NOT EXISTS idx_product_pricing_history_changed_at ON product_pricing_history(changed_at);
      `
    });

    if (historyError) {
      console.error('❌ product_pricing_history error:', historyError);
    } else {
      console.log('✅ product_pricing_history table created');
    }

    // 4. Create other tables
    console.log('\n📝 Creating remaining tables...');
    const { error: otherError } = await supabase.rpc('exec_sql', {
      sql: `
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
        
        CREATE INDEX IF NOT EXISTS idx_product_pricing_rule_applications_product_id ON product_pricing_rule_applications(product_id);
        CREATE INDEX IF NOT EXISTS idx_product_pricing_rule_applications_rule_id ON product_pricing_rule_applications(pricing_rule_id);
        CREATE INDEX IF NOT EXISTS idx_live_pricing_cache_expires_at ON live_pricing_cache(expires_at);
        CREATE INDEX IF NOT EXISTS idx_live_pricing_cache_product_id ON live_pricing_cache(product_id);
        CREATE INDEX IF NOT EXISTS idx_pricing_notifications_unread ON pricing_notifications(is_read, created_at);
        CREATE INDEX IF NOT EXISTS idx_pricing_notifications_type ON pricing_notifications(notification_type);
      `
    });

    if (otherError) {
      console.error('❌ Other tables error:', otherError);
    } else {
      console.log('✅ All remaining tables created');
    }

    // 5. Insert default pricing rules
    console.log('\n📝 Inserting default pricing rules...');
    const { error: insertError } = await supabase
      .from('pricing_rules')
      .upsert([
        {
          rule_name: 'gauteng_premium',
          rule_type: 'geographic',
          conditions: { provinces: ['Gauteng'], adjustment_reason: 'Higher operational costs' },
          price_adjustment_type: 'percentage',
          price_adjustment_value: 5.0,
          priority: 10,
          created_by: 'system',
          description: '5% premium for Gauteng region due to higher infrastructure costs'
        },
        {
          rule_name: 'western_cape_discount',
          rule_type: 'geographic',
          conditions: { provinces: ['Western Cape'], min_order_amount: 500 },
          price_adjustment_type: 'percentage',
          price_adjustment_value: -3.0,
          priority: 20,
          created_by: 'system',
          description: '3% discount for Western Cape orders over R500 to remain competitive'
        },
        {
          rule_name: 'business_customer_premium',
          rule_type: 'customer_type',
          conditions: { customer_types: ['business'], min_speed: 50 },
          price_adjustment_type: 'percentage',
          price_adjustment_value: 10.0,
          priority: 15,
          created_by: 'system',
          description: '10% premium for business customers with speeds above 50Mbps'
        }
      ], {
        onConflict: 'rule_name'
      });

    if (insertError) {
      console.error('❌ Default rules error:', insertError);
    } else {
      console.log('✅ Default pricing rules inserted');
    }

    console.log('\n✨ Migration completed successfully!');
    console.log('🚀 Dynamic pricing system is now ready for use.');

  } catch (error) {
    console.error('💥 Migration failed:', error);
  }
}

applyMigration();
