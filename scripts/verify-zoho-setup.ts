#!/usr/bin/env tsx
/**
 * Verify ZOHO Billing Setup
 *
 * Tests ZOHO API connectivity and verifies products/plans are published
 * Part of Pre-Backfill Checklist Section 3
 *
 * Usage:
 *   npx tsx scripts/verify-zoho-setup.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly
config({ path: resolve(process.cwd(), '.env.local') });

import { ZohoBillingClient } from '../lib/integrations/zoho/billing-client';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log('\n🔍 ZOHO Billing Setup Verification');
  console.log('═'.repeat(60));

  let passedChecks = 0;
  let totalChecks = 0;

  // ============================================================================
  // Task 3.1: Verify ZOHO Account Access
  // ============================================================================

  console.log('\n📝 Task 3.1: Verify ZOHO Account Access');
  console.log('─'.repeat(60));

  const client = new ZohoBillingClient();

  try {
    // Check 1: Access token generation
    totalChecks++;
    console.log('\n✓ Check 1: Access token generation...');
    const accessToken = await client['getAccessToken']();

    if (accessToken && accessToken.length > 0) {
      console.log('  ✅ Access token obtained successfully');
      console.log(`  Token length: ${accessToken.length} characters`);
      passedChecks++;
    } else {
      console.log('  ❌ Failed to obtain access token');
    }

    // Check 2: Organization details
    totalChecks++;
    console.log('\n✓ Check 2: Fetching organization details...');

    const orgId = process.env.ZOHO_BILLING_ORGANIZATION_ID || process.env.ZOHO_ORG_ID;
    if (!orgId) {
      console.log('  ❌ ZOHO_BILLING_ORGANIZATION_ID not configured');
    } else {
      const orgResponse = await client['request']<any>(
        `/organizations/${orgId}`
      );

      if (orgResponse.organization) {
        console.log('  ✅ Organization found');
        console.log(`  Organization Name: ${orgResponse.organization.name}`);
        console.log(`  Organization ID: ${orgResponse.organization.organization_id}`);
        console.log(`  Currency: ${orgResponse.organization.currency_code}`);
        console.log(`  Country: ${orgResponse.organization.country_code}`);
        console.log(`  Status: ${orgResponse.organization.status || 'active'}`);
        passedChecks++;
      } else {
        console.log('  ❌ Organization not found');
      }
    }

    // Check 3: List customers (to verify read access)
    totalChecks++;
    console.log('\n✓ Check 3: Testing API read access (customers)...');

    const customersResponse = await client['request']<any>(
      '/customers?per_page=1'
    );

    if (customersResponse.code === 0) {
      console.log('  ✅ API read access working');
      console.log(`  Total customers in ZOHO: ${customersResponse.page_context?.total || 0}`);
      passedChecks++;
    } else {
      console.log('  ❌ API read access failed');
    }

  } catch (error: any) {
    console.error('\n❌ ZOHO API Error:', error.message);
  }

  // ============================================================================
  // Task 3.2: Verify Products/Plans Published
  // ============================================================================

  console.log('\n\n📝 Task 3.2: Verify Products/Plans Published to ZOHO');
  console.log('─'.repeat(60));

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check 4: Get active products from CircleTel
    totalChecks++;
    console.log('\n✓ Check 4: Checking CircleTel active products...');

    const { data: packages, error: packagesError } = await supabase
      .from('service_packages')
      .select(`
        id,
        name,
        price,
        active,
        integration:product_integrations(
          id,
          zoho_billing_plan_id,
          zoho_billing_sync_status,
          zoho_billing_last_synced_at
        )
      `)
      .eq('active', true);

    if (packagesError) {
      console.error('  ❌ Error fetching products:', packagesError);
    } else {
      const totalActive = packages?.length || 0;
      const published = packages?.filter(p =>
        p.integration && p.integration.length > 0 && p.integration[0].zoho_billing_plan_id
      ).length || 0;

      console.log(`  ✅ Found ${totalActive} active service packages`);
      console.log(`  Published to ZOHO: ${published}/${totalActive}`);

      if (published === totalActive && totalActive > 0) {
        console.log('  ✅ All active products published to ZOHO');
        passedChecks++;
      } else if (published === 0) {
        console.log('  ❌ No products published to ZOHO');
        console.log('  Action required: Publish products via /admin/products/catalog');
      } else {
        console.log(`  ⚠️  ${totalActive - published} products not yet published`);
        console.log('  Action required: Publish remaining products via /admin/products/catalog');
      }

      // List unpublished products
      const unpublished = packages?.filter(p =>
        !p.integration || p.integration.length === 0 || !p.integration[0].zoho_billing_plan_id
      );

      if (unpublished && unpublished.length > 0) {
        console.log('\n  Unpublished products:');
        unpublished.forEach(p => {
          console.log(`    - ${p.name} (R${p.price}/month)`);
        });
      }
    }

    // Check 5: Verify plans exist in ZOHO
    totalChecks++;
    console.log('\n✓ Check 5: Verifying plans in ZOHO Billing...');

    const plansResponse = await client['request']<any>(
      '/plans?per_page=100'
    );

    if (plansResponse.code === 0) {
      const zohoPlans = plansResponse.plans || [];
      console.log(`  ✅ Found ${zohoPlans.length} plans in ZOHO Billing`);

      if (zohoPlans.length > 0) {
        console.log(`\n  Sample plans:`);
        zohoPlans.slice(0, 5).forEach((plan: any) => {
          console.log(`    - ${plan.name} (${plan.plan_code}) - R${plan.recurring_price}`);
        });
        passedChecks++;
      } else {
        console.log('  ⚠️  No plans found in ZOHO Billing');
        console.log('  Action required: Publish products via /admin/products/catalog');
      }
    } else {
      console.log('  ❌ Failed to fetch plans from ZOHO');
    }

  } catch (error: any) {
    console.error('\n❌ Error verifying products:', error.message);
  }

  // ============================================================================
  // Summary
  // ============================================================================

  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📊 Verification Summary');
  console.log('═'.repeat(60));
  console.log(`Total Checks: ${totalChecks}`);
  console.log(`Passed: ${passedChecks}/${totalChecks}`);
  console.log(`Failed: ${totalChecks - passedChecks}/${totalChecks}`);
  console.log('');

  if (passedChecks === totalChecks) {
    console.log('✅ All checks passed! ZOHO Billing setup is ready.');
    console.log('');
    console.log('Next: Section 4 - Environment Variables Verification');
  } else {
    console.log('⚠️  Some checks failed. Review the errors above.');
    console.log('');
    console.log('Common fixes:');
    console.log('  - Verify ZOHO credentials in .env.local');
    console.log('  - Publish products via /admin/products/catalog');
    console.log('  - Check ZOHO Billing subscription status');
  }

  console.log('');

  process.exit(passedChecks === totalChecks ? 0 : 1);
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
