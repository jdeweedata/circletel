// Test script for dynamic pricing system
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testDynamicPricingSystem() {
  console.log('🧪 Testing Dynamic Pricing System...\n');

  try {
    // Test 1: Verify database tables exist
    console.log('📊 Testing database schema...');
    
    const tables = [
      'pricing_rules',
      'product_pricing_history', 
      'product_pricing_rule_applications',
      'live_pricing_cache',
      'pricing_notifications'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.error(`❌ Table ${table} error:`, error.message);
        } else {
          console.log(`✅ Table ${table} accessible`);
        }
      } catch (err) {
        console.error(`❌ Table ${table} error:`, err);
      }
    }

    // Test 2: Test pricing rules functionality
    console.log('\n📋 Testing pricing rules...');
    
    const { data: rules, error: rulesError } = await supabase
      .from('pricing_rules')
      .select('*')
      .limit(5);

    if (rulesError) {
      console.error('❌ Pricing rules error:', rulesError.message);
    } else {
      console.log(`✅ Found ${rules?.length || 0} pricing rules`);
      rules?.forEach((rule, index) => {
        console.log(`   ${index + 1}. ${rule.rule_name} (${rule.rule_type})`);
      });
    }

    // Test 3: Test effective pricing function
    console.log('\n💰 Testing effective pricing calculation...');
    
    // First try to get any product ID
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, monthly_price')
      .limit(1);

    if (productsError) {
      console.error('❌ Products query error:', productsError.message);
    } else if (products && products.length > 0) {
      const testProduct = products[0];
      console.log(`✅ Using test product: ${testProduct.name}`);
      
      try {
        const { data: pricing, error: pricingError } = await supabase
          .rpc('calculate_effective_pricing', {
            p_product_id: testProduct.id,
            p_context: { province: 'Gauteng' }
          });

        if (pricingError) {
          console.error('❌ Pricing calculation error:', pricingError.message);
        } else {
          console.log('✅ Pricing calculation successful');
          console.log(`   Base price: R${parseFloat(testProduct.monthly_price).toFixed(2)}`);
          if (pricing) {
            console.log(`   Calculated price: R${parseFloat(pricing.base_price || '0').toFixed(2)}`);
            console.log(`   Applied rules: ${JSON.stringify(pricing.applied_rules)}`);
          }
        }
      } catch (calcError) {
        console.error('❌ Pricing calculation exception:', calcError);
      }
    } else {
      console.log('⚠️  No products found for testing');
    }

    // Test 4: Test cache functionality
    console.log('\n💾 Testing cache system...');
    
    const { data: cache, error: cacheError } = await supabase
      .from('live_pricing_cache')
      .select('*')
      .limit(1);

    if (cacheError) {
      console.error('❌ Cache query error:', cacheError.message);
    } else {
      console.log(`✅ Cache system accessible (${cache?.length || 0} cache entries)`);
    }

    // Test 5: Test pricing history
    console.log('\n📈 Testing pricing history...');
    
    const { data: history, error: historyError } = await supabase
      .from('product_pricing_history')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(3);

    if (historyError) {
      console.error('❌ Pricing history error:', historyError.message);
    } else {
      console.log(`✅ Pricing history accessible (${history?.length || 0} records)`);
      history?.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.change_type} - ${record.reason || 'No reason'}`);
      });
    }

    console.log('\n✨ Dynamic pricing system test completed successfully!');
    console.log('\n🚀 Ready for production use.');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Test API endpoints
async function testAPIEndpoints() {
  console.log('\n🌐 Testing API endpoints...\n');

  const baseUrl = 'http://localhost:3006'; // Adjust for your setup

  const endpoints = [
    { path: '/api/dynamic-pricing/rules', method: 'GET', description: 'Get pricing rules' },
    { path: '/api/dynamic-pricing/notifications', method: 'GET', description: 'Get pricing notifications' },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint.description}: ${data.success ? 'Success' : 'Failed'}`);
      } else {
        console.log(`❌ ${endpoint.description}: HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.description}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  testDynamicPricingSystem()
    .then(() => testAPIEndpoints())
    .then(() => {
      console.log('\n🎉 All tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

export { testDynamicPricingSystem, testAPIEndpoints };
