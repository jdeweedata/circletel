#!/usr/bin/env tsx
/**
 * Verify Environment Variables
 *
 * Comprehensive check of all required environment variables for ZOHO Billing backfill
 * Part of Pre-Backfill Checklist Section 4
 *
 * Usage:
 *   npx tsx scripts/verify-env-variables.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Load .env.local explicitly
config({ path: resolve(process.cwd(), '.env.local') });

interface EnvCheck {
  name: string;
  value: string | undefined;
  required: boolean;
  masked?: boolean;
  length?: number;
  passed?: boolean;
  error?: string;
}

async function main() {
  console.log('\n🔐 Environment Variables Verification');
  console.log('═'.repeat(60));

  let passedChecks = 0;
  let totalChecks = 0;

  // ============================================================================
  // Task 4.1: Verify Supabase Credentials
  // ============================================================================

  console.log('\n📝 Task 4.1: Verify Supabase Credentials');
  console.log('─'.repeat(60));

  const supabaseChecks: EnvCheck[] = [
    {
      name: 'NEXT_PUBLIC_SUPABASE_URL',
      value: process.env.NEXT_PUBLIC_SUPABASE_URL,
      required: true,
    },
    {
      name: 'SUPABASE_SERVICE_ROLE_KEY',
      value: process.env.SUPABASE_SERVICE_ROLE_KEY,
      required: true,
      masked: true,
    },
  ];

  console.log('\n✓ Check 1: Supabase environment variables...');

  for (const check of supabaseChecks) {
    totalChecks++;

    if (!check.value) {
      console.log(`  ❌ ${check.name}: MISSING`);
      check.passed = false;
      check.error = 'Variable not set';
    } else {
      const displayValue = check.masked
        ? `${check.value.substring(0, 10)}...${check.value.substring(check.value.length - 4)}`
        : check.value;

      console.log(`  ✅ ${check.name}: ${displayValue}`);
      check.passed = true;
      passedChecks++;
    }
  }

  // Test Supabase connection
  if (supabaseChecks.every(c => c.passed)) {
    totalChecks++;
    console.log('\n✓ Check 2: Testing Supabase connection...');

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      const { data, error } = await supabase
        .from('customers')
        .select('count')
        .limit(1)
        .single();

      if (!error || error.code === 'PGRST116') { // PGRST116 = no rows (acceptable)
        console.log('  ✅ Supabase connection successful');
        console.log('  Database: agyjovdugmtopasyvlng.supabase.co');
        passedChecks++;
      } else {
        console.log(`  ❌ Supabase connection failed: ${error.message}`);
      }
    } catch (error: any) {
      console.log(`  ❌ Supabase connection failed: ${error.message}`);
    }
  }

  // ============================================================================
  // Task 4.2: Verify ZOHO API Credentials
  // ============================================================================

  console.log('\n\n📝 Task 4.2: Verify ZOHO API Credentials');
  console.log('─'.repeat(60));

  const zohoChecks: EnvCheck[] = [
    {
      name: 'ZOHO_CLIENT_ID',
      value: process.env.ZOHO_CLIENT_ID,
      required: true,
      masked: true,
    },
    {
      name: 'ZOHO_CLIENT_SECRET',
      value: process.env.ZOHO_CLIENT_SECRET,
      required: true,
      masked: true,
    },
    {
      name: 'ZOHO_REFRESH_TOKEN',
      value: process.env.ZOHO_REFRESH_TOKEN,
      required: true,
      masked: true,
    },
    {
      name: 'ZOHO_BILLING_ORGANIZATION_ID',
      value: process.env.ZOHO_BILLING_ORGANIZATION_ID || process.env.ZOHO_ORG_ID,
      required: true,
    },
    {
      name: 'ZOHO_REGION',
      value: process.env.ZOHO_REGION || 'US',
      required: false,
    },
  ];

  console.log('\n✓ Check 3: ZOHO environment variables...');

  for (const check of zohoChecks) {
    totalChecks++;

    if (!check.value && check.required) {
      console.log(`  ❌ ${check.name}: MISSING`);
      check.passed = false;
      check.error = 'Variable not set';
    } else if (!check.value && !check.required) {
      console.log(`  ⚠️  ${check.name}: Not set (using default)`);
      check.passed = true;
      passedChecks++;
    } else {
      const displayValue = check.masked
        ? `${check.value!.substring(0, 10)}...${check.value!.substring(check.value!.length - 4)}`
        : check.value;

      console.log(`  ✅ ${check.name}: ${displayValue}`);
      check.passed = true;
      passedChecks++;
    }
  }

  // ============================================================================
  // Task 4.3: Test ZOHO API Connectivity
  // ============================================================================

  console.log('\n\n📝 Task 4.3: Test ZOHO API Connectivity');
  console.log('─'.repeat(60));

  if (zohoChecks.filter(c => c.required).every(c => c.passed)) {
    // Test 1: Exchange refresh token for access token
    totalChecks++;
    console.log('\n✓ Check 4: ZOHO OAuth token exchange...');

    try {
      const tokenResponse = await axios.post(
        'https://accounts.zoho.com/oauth/v2/token',
        null,
        {
          params: {
            refresh_token: process.env.ZOHO_REFRESH_TOKEN,
            client_id: process.env.ZOHO_CLIENT_ID,
            client_secret: process.env.ZOHO_CLIENT_SECRET,
            grant_type: 'refresh_token'
          }
        }
      );

      if (tokenResponse.data.access_token) {
        console.log('  ✅ Access token obtained successfully');
        console.log(`  Token type: ${tokenResponse.data.token_type || 'Bearer'}`);
        console.log(`  Expires in: ${tokenResponse.data.expires_in || 3600}s`);
        passedChecks++;

        // Test 2: Verify organization access
        totalChecks++;
        console.log('\n✓ Check 5: ZOHO Billing organization access...');

        const orgId = process.env.ZOHO_BILLING_ORGANIZATION_ID || process.env.ZOHO_ORG_ID;
        const orgResponse = await axios.get(
          `https://www.zohoapis.com/billing/v1/organizations/${orgId}?organization_id=${orgId}`,
          {
            headers: {
              'Authorization': `Zoho-oauthtoken ${tokenResponse.data.access_token}`,
              'X-com-zoho-subscriptions-organizationid': orgId!
            }
          }
        );

        if (orgResponse.data.organization) {
          console.log('  ✅ Organization access verified');
          console.log(`  Name: ${orgResponse.data.organization.name}`);
          console.log(`  ID: ${orgResponse.data.organization.organization_id}`);
          console.log(`  Currency: ${orgResponse.data.organization.currency_code}`);
          passedChecks++;
        } else {
          console.log('  ❌ Organization not found');
        }

      } else {
        console.log('  ❌ Failed to obtain access token');
      }
    } catch (error: any) {
      console.log(`  ❌ ZOHO API test failed: ${error.message}`);
      if (error.response?.data) {
        console.log(`  Error details: ${JSON.stringify(error.response.data)}`);
      }
    }
  } else {
    console.log('\n  ⏭️  Skipping API connectivity tests (missing credentials)');
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

  // Display failed checks
  const allChecks = [...supabaseChecks, ...zohoChecks];
  const failed = allChecks.filter(c => c.passed === false);

  if (failed.length > 0) {
    console.log('❌ Failed Checks:');
    failed.forEach(c => {
      console.log(`  - ${c.name}: ${c.error}`);
    });
    console.log('');
  }

  if (passedChecks === totalChecks) {
    console.log('✅ All environment variables verified!');
    console.log('');
    console.log('Environment ready for ZOHO Billing backfill.');
    console.log('');
    console.log('Next: Section 5 - Monitoring Dashboard Verification');
  } else {
    console.log('⚠️  Some checks failed. Review the errors above.');
    console.log('');
    console.log('Action required:');
    console.log('  1. Check .env.local file exists');
    console.log('  2. Verify all required variables are set');
    console.log('  3. Test credentials in ZOHO dashboard');
  }

  console.log('');

  process.exit(passedChecks === totalChecks ? 0 : 1);
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
