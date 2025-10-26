/**
 * Test how SkyFibre Home products will appear on the frontend
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFrontendTabs() {
  console.log('=== Frontend Package Tab Test ===\n');

  const { data: all } = await supabase
    .from('service_packages')
    .select('name, service_type, product_category, speed_down, price, customer_type')
    .eq('customer_type', 'consumer')
    .eq('active', true)
    .order('price');

  // Frontend filtering logic from app/packages/[leadId]/page.tsx lines 238-243
  console.log('🔵 WIRELESS Tab (includes SkyFibre):');
  const wireless = all.filter(p => {
    const st = (p.service_type || p.product_category || '').toLowerCase();
    return (st.includes('wireless') || st.includes('skyfibre')) &&
           !st.includes('lte') &&
           !st.includes('5g');
  });
  wireless.forEach(p => console.log('  -', p.name, `(${p.speed_down}Mbps, R${p.price})`));

  console.log('\n🟢 FIBRE Tab:');
  const fibre = all.filter(p => {
    const st = (p.service_type || p.product_category || '').toLowerCase();
    return st.includes('fibre') && !st.includes('skyfibre');
  });
  console.log('  Count:', fibre.length, 'packages');

  console.log('\n🟡 LTE Tab:');
  const lte = all.filter(p => {
    const st = (p.service_type || p.product_category || '').toLowerCase();
    return st.includes('lte') && !st.includes('5g');
  });
  console.log('  Count:', lte.length, 'packages');

  console.log('\n🟠 5G Tab:');
  const fiveG = all.filter(p => {
    const st = (p.service_type || p.product_category || '').toLowerCase();
    return st.includes('5g');
  });
  console.log('  Count:', fiveG.length, 'packages');

  console.log('\n=== MTN Coverage Mapping ===');
  console.log('When MTN API returns:');
  console.log('  ✅ uncapped_wireless → Maps to SkyFibre products (WIRELESS tab)');
  console.log('  ⚠️  licensed_wireless → Shows lead capture form (P2P microwave quote-based)');
  console.log('     - Business customers only');
  console.log('     - Requires site survey');
  console.log('     - Custom pricing');
  console.log('     - Does NOT show product packages');
}

testFrontendTabs().catch(console.error);
