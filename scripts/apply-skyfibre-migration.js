const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://agyjovdugmtopasyvlng.supabase.co';
const supabaseKey = 'sb_publishable_jKBISiYlrRyJEfyYGcjJZw_AQJ8Udc7';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🚀 Starting SkyFibre Tarana migration...');

  try {
    // Test connection
    const { data: testConnection, error: connectionError } = await supabase
      .from('service_packages')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError);
      return;
    }

    console.log('✅ Database connection successful');

    // Step 1: Check current SkyFibre packages
    console.log('\n📋 Current SkyFibre packages:');
    const { data: currentPackages, error: fetchError } = await supabase
      .from('service_packages')
      .select('*')
      .eq('service_type', 'SkyFibre')
      .order('sort_order');

    if (fetchError) {
      console.error('❌ Error fetching packages:', fetchError);
      return;
    }

    currentPackages.forEach(pkg => {
      console.log(`  - ${pkg.name}: ${pkg.speed_down}/${pkg.speed_up} Mbps @ R${pkg.price}`);
    });

    // Step 2: Update SkyFibre Starter to Tarana specs
    console.log('\n🔄 Updating SkyFibre Starter...');
    const { error: starterError } = await supabase
      .from('service_packages')
      .update({
        speed_down: 50,
        speed_up: 50,
        price: 799,
        promotion_price: null,
        promotion_months: null,
        description: 'SkyFibre Starter - MTN Tarana Fixed Wireless perfect for basic internet needs with fiber-equivalent performance',
        features: [
          'MTN Tarana G1 Beamforming Technology',
          '50 Mbps Download / 50 Mbps Upload (Symmetrical)',
          'Sub-5ms Latency for Gaming & Video Calls',
          'Professional Installation (15-minute setup)',
          'Package-Specific Router (Reyee RG-EW1200)',
          'FREE Ruijie Cloud Management',
          'Mobile App Control (Reyee Router App)',
          'Zero-Touch Provisioning',
          'Load-Shedding Resilient',
          '30-Day Satisfaction Guarantee',
          'Month-to-Month Contract',
          '24/7 Technical Support',
          'Weather-Proof Wireless Technology',
          '99.5% Uptime SLA'
        ]
      })
      .eq('name', 'SkyFibre Starter');

    if (starterError) {
      console.error('❌ Error updating SkyFibre Starter:', starterError);
    } else {
      console.log('✅ SkyFibre Starter updated successfully');
    }

    // Step 3: Update SkyFibre Essential to SkyFibre Plus
    console.log('\n🔄 Updating SkyFibre Essential to SkyFibre Plus...');
    const { error: plusError } = await supabase
      .from('service_packages')
      .update({
        name: 'SkyFibre Plus',
        speed_down: 100,
        speed_up: 100,
        price: 899,
        promotion_price: null,
        promotion_months: null,
        description: 'SkyFibre Plus - MTN Tarana Fixed Wireless for streaming and home office with superior performance',
        features: [
          'MTN Tarana G1 Beamforming Technology',
          '100 Mbps Download / 100 Mbps Upload (Symmetrical)',
          'Sub-5ms Latency for Gaming & Video Calls',
          'Professional Installation (15-minute setup)',
          'Package-Specific Router (Reyee RG-EW1300G)',
          'FREE Ruijie Cloud Management',
          'Mobile App Control (Reyee Router App)',
          'Zero-Touch Provisioning',
          'Advanced Mesh Capabilities',
          'MU-MIMO Technology',
          'Load-Shedding Resilient',
          'Seamless Roaming',
          'VPN Support',
          '30-Day Satisfaction Guarantee',
          'Month-to-Month Contract',
          '24/7 Technical Support',
          'Weather-Proof Wireless Technology',
          '99.5% Uptime SLA'
        ]
      })
      .eq('name', 'SkyFibre Essential');

    if (plusError) {
      console.error('❌ Error updating SkyFibre Plus:', plusError);
    } else {
      console.log('✅ SkyFibre Plus updated successfully');
    }

    // Step 4: Update SkyFibre Pro to Tarana specs
    console.log('\n🔄 Updating SkyFibre Pro...');
    const { error: proError } = await supabase
      .from('service_packages')
      .update({
        speed_down: 200,
        speed_up: 200,
        price: 1099,
        promotion_price: null,
        promotion_months: null,
        description: 'SkyFibre Pro - MTN Tarana Fixed Wireless premium package for power users and large families',
        features: [
          'MTN Tarana G1 Beamforming Technology',
          '200 Mbps Download / 200 Mbps Upload (Symmetrical)',
          'Sub-5ms Latency for Competitive Gaming & 4K Streaming',
          'Professional Installation (15-minute setup)',
          'Package-Specific Router (Reyee RG-EW3000GX)',
          'FREE Ruijie Cloud Management',
          'Mobile App Control (Reyee Router App)',
          'Zero-Touch Provisioning',
          'WiFi 6 Technology (802.11ax)',
          '4x4 MU-MIMO with OFDMA',
          'Dual-WAN Support',
          'Advanced QoS',
          'Load-Shedding Resilient',
          'Static IP Option Available',
          '30-Day Satisfaction Guarantee',
          'Month-to-Month Contract',
          '24/7 Technical Support',
          'Weather-Proof Wireless Technology',
          '99.5% Uptime SLA'
        ]
      })
      .eq('name', 'SkyFibre Pro');

    if (proError) {
      console.error('❌ Error updating SkyFibre Pro:', proError);
    } else {
      console.log('✅ SkyFibre Pro updated successfully');
    }

    // Step 5: Verify the updates
    console.log('\n📊 Updated SkyFibre packages:');
    const { data: updatedPackages, error: verifyError } = await supabase
      .from('service_packages')
      .select('name, speed_down, speed_up, price')
      .eq('service_type', 'SkyFibre')
      .order('sort_order');

    if (verifyError) {
      console.error('❌ Error verifying updates:', verifyError);
    } else {
      updatedPackages.forEach(pkg => {
        console.log(`  - ${pkg.name}: ${pkg.speed_down}/${pkg.speed_up} Mbps @ R${pkg.price}`);
      });
    }

    console.log('\n🎉 SkyFibre Tarana migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

applyMigration();
