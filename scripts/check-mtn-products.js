#!/usr/bin/env node
/**
 * Check MTN Products in Database
 * Quick script to verify imported MTN products
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMTNProducts() {
  console.log('\n📊 MTN Products Database Check\n');

  // 1. Total count
  const { count: totalCount } = await supabase
    .from('service_packages')
    .select('id', { count: 'exact', head: true })
    .like('name', 'MTN%');

  console.log(`Total MTN Products: ${totalCount}\n`);

  // 2. Count by device type
  const { data: withDevice } = await supabase
    .from('service_packages')
    .select('id', { count: 'exact', head: true })
    .like('name', 'MTN%')
    .not('metadata->>oemDevice', 'eq', 'Use Your Own');

  const { data: simOnly } = await supabase
    .from('service_packages')
    .select('id', { count: 'exact', head: true })
    .like('name', 'MTN%')
    .eq('metadata->>oemDevice', 'Use Your Own');

  console.log('By Device Type:');
  console.log(`  With Device: ${withDevice?.length || 0}`);
  console.log(`  SIM Only: ${simOnly?.length || 0}\n`);

  // 3. Price range
  const { data: priceStats } = await supabase
    .from('service_packages')
    .select('base_price_zar')
    .like('name', 'MTN%')
    .order('base_price_zar', { ascending: true });

  if (priceStats && priceStats.length > 0) {
    const prices = priceStats.map(p => p.base_price_zar);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);

    console.log('Price Range:');
    console.log(`  Minimum: R${minPrice}/month`);
    console.log(`  Maximum: R${maxPrice}/month`);
    console.log(`  Average: R${avgPrice}/month\n`);
  }

  // 4. Sample products
  const { data: samples } = await supabase
    .from('service_packages')
    .select('name, base_price_zar, sku, metadata')
    .like('name', 'MTN%')
    .limit(5);

  if (samples && samples.length > 0) {
    console.log('Sample Products:\n');
    samples.forEach((product, i) => {
      const data = product.metadata?.totalData || 'N/A';
      const minutes = product.metadata?.totalMinutes || 'N/A';
      console.log(`${i + 1}. ${product.name}`);
      console.log(`   Price: R${product.base_price_zar}/month`);
      console.log(`   Data: ${data} | Minutes: ${minutes}`);
      console.log(`   SKU: ${product.sku}\n`);
    });
  }

  // 5. Contract terms distribution
  const { data: allProducts } = await supabase
    .from('service_packages')
    .select('metadata')
    .like('name', 'MTN%');

  if (allProducts && allProducts.length > 0) {
    const contractTerms = {};
    allProducts.forEach(p => {
      const term = p.metadata?.contractTerm || 'Unknown';
      contractTerms[term] = (contractTerms[term] || 0) + 1;
    });

    console.log('By Contract Term:');
    Object.entries(contractTerms)
      .sort((a, b) => a[0] - b[0])
      .forEach(([term, count]) => {
        console.log(`  ${term} months: ${count} products`);
      });
    console.log('');
  }

  // 6. Popular products
  const { count: popularCount } = await supabase
    .from('service_packages')
    .select('id', { count: 'exact', head: true })
    .like('name', 'MTN%')
    .eq('is_popular', true);

  console.log(`Popular Products (5GB+ data): ${popularCount}\n`);

  // 7. Recent imports (by SKU pattern - 202508EBU means August 2025)
  const recentSKUPattern = '202510%'; // October 2025
  const { count: recentCount } = await supabase
    .from('service_packages')
    .select('id', { count: 'exact', head: true })
    .like('sku', recentSKUPattern);

  if (recentCount > 0) {
    console.log(`Products from October 2025: ${recentCount}\n`);
  }

  console.log('='.repeat(60));
}

checkMTNProducts()
  .then(() => {
    console.log('✅ Check completed!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
