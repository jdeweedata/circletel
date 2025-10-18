#!/usr/bin/env tsx
/**
 * Product Pricing Verification Script
 * 
 * This script verifies that product pricing in the database matches
 * what should be displayed on the frontend.
 * 
 * Usage: npx tsx scripts/verify-product-pricing.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface ProductVerification {
  id: string;
  name: string;
  service_type: string;
  speed_down: number;
  speed_up: number;
  price: number;
  promotion_price: number | null;
  promotion_months: number | null;
  features: string[];
  description: string | null;
  active: boolean;
  customer_type: string;
  product_category: string;
}

async function verifyProducts() {
  console.log('🔍 Product Pricing Verification Tool\n');
  console.log('=' .repeat(80));

  // Fetch all active service packages
  const { data: packages, error } = await supabase
    .from('service_packages')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('❌ Error fetching packages:', error);
    return;
  }

  if (!packages || packages.length === 0) {
    console.log('⚠️  No active packages found in database');
    return;
  }

  console.log(`✅ Found ${packages.length} active packages\n`);

  // Find HomeFibre Premium (the one from screenshot)
  const homeFibrePremium = packages.find(p => p.name === 'HomeFibre Premium');

  if (homeFibrePremium) {
    console.log('🎯 HomeFibre Premium (from screenshot) verification:\n');
    console.log('━'.repeat(80));
    console.log('Field Mapping:');
    console.log('━'.repeat(80));
    console.log(`Product Name:        ${homeFibrePremium.name}`);
    console.log(`Product Portfolio:   ${homeFibrePremium.service_type}`);
    console.log(`Download Speed:      ${homeFibrePremium.speed_down} Mbps`);
    console.log(`Upload Speed:        ${homeFibrePremium.speed_up} Mbps`);
    console.log(`Current Price:       R ${homeFibrePremium.promotion_price || homeFibrePremium.price}`);
    console.log(`Normal Price:        R ${homeFibrePremium.price}`);
    console.log(`Promotion Duration:  ${homeFibrePremium.promotion_months || 0} months`);
    console.log(`Active:              ${homeFibrePremium.active ? '✅' : '❌'}`);
    console.log(`Customer Type:       ${homeFibrePremium.customer_type || 'N/A'}`);
    console.log(`Product Category:    ${homeFibrePremium.product_category || 'N/A'}`);
    console.log('\nFeatures:');
    if (homeFibrePremium.features && homeFibrePremium.features.length > 0) {
      homeFibrePremium.features.forEach((feature: string, idx: number) => {
        console.log(`  ${idx + 1}. ${feature}`);
      });
    } else {
      console.log('  (No features listed)');
    }
    console.log(`\nDescription: ${homeFibrePremium.description || '(No description)'}`);
    console.log('━'.repeat(80));

    // Check for discrepancies
    const issues: string[] = [];
    
    if (homeFibrePremium.price !== 799) {
      issues.push(`⚠️  Normal price is R${homeFibrePremium.price}, expected R799`);
    }
    
    if (homeFibrePremium.promotion_price !== 499) {
      issues.push(`⚠️  Promo price is R${homeFibrePremium.promotion_price}, expected R499`);
    }
    
    if (homeFibrePremium.speed_down !== 100) {
      issues.push(`⚠️  Download speed is ${homeFibrePremium.speed_down} Mbps, expected 100 Mbps`);
    }
    
    if (homeFibrePremium.speed_up !== 50) {
      issues.push(`⚠️  Upload speed is ${homeFibrePremium.speed_up} Mbps, expected 50 Mbps`);
    }

    if (issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      issues.forEach(issue => console.log(`   ${issue}`));
    } else {
      console.log('\n✅ All fields match expected values!');
    }
  } else {
    console.log('⚠️  HomeFibre Premium package not found in database');
  }

  // Display all packages
  console.log('\n\n📦 All Active Packages:\n');
  console.log('━'.repeat(80));

  packages.forEach((pkg: any, index: number) => {
    const currentPrice = pkg.promotion_price || pkg.price;
    const hasPromo = pkg.promotion_price !== null;
    
    console.log(`\n${index + 1}. ${pkg.name}`);
    console.log(`   Type: ${pkg.service_type}`);
    console.log(`   Speed: ${pkg.speed_down}/${pkg.speed_up} Mbps`);
    console.log(`   Price: R${currentPrice}${hasPromo ? ` (promo for ${pkg.promotion_months} months, regular R${pkg.price})` : ''}`);
    console.log(`   Customer: ${pkg.customer_type || 'any'}`);
    console.log(`   Category: ${pkg.product_category || 'N/A'}`);
    console.log(`   Features: ${pkg.features?.length || 0} items`);
  });

  console.log('\n' + '━'.repeat(80));

  // Summary
  console.log('\n📊 Summary:');
  console.log(`   Total Packages: ${packages.length}`);
  console.log(`   Consumer Packages: ${packages.filter((p: any) => p.customer_type === 'consumer').length}`);
  console.log(`   Business Packages: ${packages.filter((p: any) => p.customer_type === 'business').length}`);
  console.log(`   With Promotions: ${packages.filter((p: any) => p.promotion_price !== null).length}`);
  console.log(`   Without Promotions: ${packages.filter((p: any) => p.promotion_price === null).length}`);

  // Service type breakdown
  const serviceTypes = new Set(packages.map((p: any) => p.service_type));
  console.log('\n📡 By Service Type:');
  serviceTypes.forEach(type => {
    const count = packages.filter((p: any) => p.service_type === type).length;
    console.log(`   ${type}: ${count} packages`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Verification Complete!');
  console.log('\n💡 To update products:');
  console.log('   1. Visit: http://localhost:3006/admin/products');
  console.log('   2. Click the menu (⋮) next to any product');
  console.log('   3. Select "Edit Price" or "Edit" to make changes');
  console.log('   4. Changes reflect immediately on the frontend\n');
}

// Run verification
verifyProducts().catch(console.error);
