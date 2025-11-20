#!/usr/bin/env tsx
/**
 * ZOHO Billing Integration Health Check
 *
 * Comprehensive health check script for production monitoring
 * Checks sync status, API connectivity, and data integrity
 *
 * Usage:
 *   npx tsx scripts/zoho-health-check.ts [--detailed] [--email]
 *
 * Options:
 *   --detailed  Show detailed results for each check
 *   --email     Generate email-friendly format for alerts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { ZohoBillingClient } from '../lib/integrations/zoho/billing-client';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const args = process.argv.slice(2);
const isDetailed = args.includes('--detailed');
const isEmailFormat = args.includes('--email');

interface HealthCheckResult {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: any;
}

const results: HealthCheckResult[] = [];

function addResult(name: string, status: 'pass' | 'warn' | 'fail', message: string, details?: any) {
  results.push({ name, status, message, details });
}

async function checkDatabaseSyncStatus() {
  console.log('\n📊 1. Database Sync Status');
  console.log('─'.repeat(60));

  try {
    // Check customers
    const { data: customerStats } = await supabase
      .from('customers')
      .select('zoho_sync_status')
      .neq('account_type', 'internal_test');

    const totalCustomers = customerStats?.length || 0;
    const syncedCustomers = customerStats?.filter(c => c.zoho_sync_status === 'synced').length || 0;
    const failedCustomers = customerStats?.filter(c => c.zoho_sync_status === 'failed').length || 0;

    if (failedCustomers > 0) {
      addResult('Customer Sync', 'warn', `${failedCustomers} customer(s) failed`, { total: totalCustomers, synced: syncedCustomers, failed: failedCustomers });
      console.log(`  ⚠️  ${failedCustomers}/${totalCustomers} customers failed`);
    } else if (syncedCustomers === totalCustomers) {
      addResult('Customer Sync', 'pass', `All ${totalCustomers} customers synced`, { total: totalCustomers, synced: syncedCustomers });
      console.log(`  ✅ All ${totalCustomers} customers synced`);
    } else {
      addResult('Customer Sync', 'warn', `${totalCustomers - syncedCustomers} customer(s) not synced`, { total: totalCustomers, synced: syncedCustomers });
      console.log(`  ⚠️  ${totalCustomers - syncedCustomers}/${totalCustomers} customers not synced`);
    }

    // Check subscriptions
    const { data: serviceStats } = await supabase
      .from('customer_services')
      .select('zoho_sync_status, status')
      .eq('status', 'active');

    const totalServices = serviceStats?.length || 0;
    const syncedServices = serviceStats?.filter(s => s.zoho_sync_status === 'synced').length || 0;
    const failedServices = serviceStats?.filter(s => s.zoho_sync_status === 'failed').length || 0;

    if (totalServices === 0) {
      addResult('Subscription Sync', 'pass', 'No active services yet', { total: 0 });
      console.log(`  ✅ No active services yet (expected)`);
    } else if (failedServices > 0) {
      addResult('Subscription Sync', 'warn', `${failedServices} service(s) failed`, { total: totalServices, synced: syncedServices, failed: failedServices });
      console.log(`  ⚠️  ${failedServices}/${totalServices} services failed`);
    } else if (syncedServices === totalServices) {
      addResult('Subscription Sync', 'pass', `All ${totalServices} services synced`, { total: totalServices, synced: syncedServices });
      console.log(`  ✅ All ${totalServices} services synced`);
    } else {
      addResult('Subscription Sync', 'warn', `${totalServices - syncedServices} service(s) not synced`, { total: totalServices, synced: syncedServices });
      console.log(`  ⚠️  ${totalServices - syncedServices}/${totalServices} services not synced`);
    }

    // Check invoices
    const { data: invoiceStats } = await supabase
      .from('customer_invoices')
      .select('zoho_sync_status');

    const totalInvoices = invoiceStats?.length || 0;
    const syncedInvoices = invoiceStats?.filter(i => i.zoho_sync_status === 'synced').length || 0;
    const failedInvoices = invoiceStats?.filter(i => i.zoho_sync_status === 'failed').length || 0;

    if (totalInvoices === 0) {
      addResult('Invoice Sync', 'pass', 'No invoices yet', { total: 0 });
      console.log(`  ✅ No invoices yet (expected)`);
    } else if (failedInvoices > 0) {
      addResult('Invoice Sync', 'warn', `${failedInvoices} invoice(s) failed`, { total: totalInvoices, synced: syncedInvoices, failed: failedInvoices });
      console.log(`  ⚠️  ${failedInvoices}/${totalInvoices} invoices failed`);
    } else {
      addResult('Invoice Sync', 'pass', `All ${totalInvoices} invoices synced`, { total: totalInvoices, synced: syncedInvoices });
      console.log(`  ✅ All ${totalInvoices} invoices synced`);
    }

    // Check payments
    const { data: paymentStats } = await supabase
      .from('payment_transactions')
      .select('zoho_sync_status, status')
      .eq('status', 'completed');

    const totalPayments = paymentStats?.length || 0;
    const syncedPayments = paymentStats?.filter(p => p.zoho_sync_status === 'synced').length || 0;
    const failedPayments = paymentStats?.filter(p => p.zoho_sync_status === 'failed').length || 0;

    if (totalPayments === 0) {
      addResult('Payment Sync', 'pass', 'No payments yet', { total: 0 });
      console.log(`  ✅ No completed payments yet (expected)`);
    } else if (failedPayments > 0) {
      addResult('Payment Sync', 'warn', `${failedPayments} payment(s) failed`, { total: totalPayments, synced: syncedPayments, failed: failedPayments });
      console.log(`  ⚠️  ${failedPayments}/${totalPayments} payments failed`);
    } else {
      addResult('Payment Sync', 'pass', `All ${totalPayments} payments synced`, { total: totalPayments, synced: syncedPayments });
      console.log(`  ✅ All ${totalPayments} payments synced`);
    }

  } catch (error: any) {
    addResult('Database Sync Status', 'fail', `Database query error: ${error.message}`);
    console.log(`  ❌ Database query error: ${error.message}`);
  }
}

async function checkRecentSyncActivity() {
  console.log('\n📝 2. Recent Sync Activity (Last 24 Hours)');
  console.log('─'.repeat(60));

  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: recentLogs } = await supabase
      .from('zoho_sync_logs')
      .select('status, entity_type')
      .gte('created_at', yesterday);

    const total = recentLogs?.length || 0;
    const succeeded = recentLogs?.filter(l => l.status === 'success').length || 0;
    const failed = recentLogs?.filter(l => l.status === 'failed').length || 0;

    const successRate = total > 0 ? ((succeeded / total) * 100).toFixed(1) : '100.0';

    if (total === 0) {
      addResult('Recent Activity', 'pass', 'No sync activity in last 24 hours', { total: 0 });
      console.log(`  ✅ No sync activity (normal for established integration)`);
    } else if (failed === 0) {
      addResult('Recent Activity', 'pass', `${total} syncs, 100% success rate`, { total, succeeded, failed });
      console.log(`  ✅ ${total} syncs in last 24h, all successful`);
    } else if (parseFloat(successRate) >= 95) {
      addResult('Recent Activity', 'pass', `${total} syncs, ${successRate}% success rate`, { total, succeeded, failed });
      console.log(`  ✅ ${total} syncs, ${successRate}% success rate`);
    } else {
      addResult('Recent Activity', 'warn', `${failed} failures (${(100 - parseFloat(successRate)).toFixed(1)}%)`, { total, succeeded, failed });
      console.log(`  ⚠️  ${failed}/${total} syncs failed (${(100 - parseFloat(successRate)).toFixed(1)}% failure rate)`);
    }

    if (isDetailed && recentLogs && recentLogs.length > 0) {
      console.log(`\n  Breakdown by entity type:`);
      const byType = recentLogs.reduce((acc, log) => {
        acc[log.entity_type] = acc[log.entity_type] || { total: 0, success: 0, failed: 0 };
        acc[log.entity_type].total++;
        if (log.status === 'success') acc[log.entity_type].success++;
        if (log.status === 'failed') acc[log.entity_type].failed++;
        return acc;
      }, {} as Record<string, { total: number; success: number; failed: number }>);

      Object.entries(byType).forEach(([type, stats]) => {
        const rate = ((stats.success / stats.total) * 100).toFixed(0);
        console.log(`    ${type}: ${stats.total} syncs, ${rate}% success`);
      });
    }

  } catch (error: any) {
    addResult('Recent Activity', 'fail', `Error checking sync logs: ${error.message}`);
    console.log(`  ❌ Error checking sync logs: ${error.message}`);
  }
}

async function checkZohoApiConnectivity() {
  console.log('\n🔌 3. ZOHO API Connectivity');
  console.log('─'.repeat(60));

  try {
    const client = new ZohoBillingClient();

    // Test 1: Token refresh
    console.log(`  ⏳ Testing token refresh...`);
    const token = await client['getAccessToken']();

    if (token && token.length > 0) {
      addResult('ZOHO Token', 'pass', 'Access token obtained successfully');
      console.log(`  ✅ Access token obtained (${token.length} chars)`);
    } else {
      addResult('ZOHO Token', 'fail', 'Failed to obtain access token');
      console.log(`  ❌ Failed to obtain access token`);
      return;
    }

    // Test 2: Organization access
    console.log(`  ⏳ Testing organization access...`);
    const orgId = process.env.ZOHO_BILLING_ORGANIZATION_ID || process.env.ZOHO_ORG_ID;
    const orgResponse = await client['request']<any>(`/organizations/${orgId}`);

    if (orgResponse.organization) {
      addResult('ZOHO Org Access', 'pass', `Connected to ${orgResponse.organization.name}`);
      console.log(`  ✅ Organization: ${orgResponse.organization.name}`);
      console.log(`  ℹ️  Currency: ${orgResponse.organization.currency_code}`);
    } else {
      addResult('ZOHO Org Access', 'fail', 'Organization not found');
      console.log(`  ❌ Organization not found`);
    }

    // Test 3: API read access (customers)
    console.log(`  ⏳ Testing API read access...`);
    const customersResponse = await client['request']<any>('/customers?per_page=1');

    if (customersResponse.code === 0) {
      const total = customersResponse.page_context?.total || 0;
      addResult('ZOHO API Access', 'pass', `API read access working (${total} customers)`);
      console.log(`  ✅ API read access confirmed (${total} total customers in ZOHO)`);
    } else {
      addResult('ZOHO API Access', 'warn', 'Unexpected API response');
      console.log(`  ⚠️  Unexpected API response code: ${customersResponse.code}`);
    }

  } catch (error: any) {
    addResult('ZOHO API Connectivity', 'fail', `API error: ${error.message}`);
    console.log(`  ❌ ZOHO API error: ${error.message}`);

    if (error.message?.includes('rate limit') || error.message?.includes('too many requests')) {
      console.log(`  ⚠️  Rate limit detected - wait 10 minutes before retrying`);
    }
  }
}

async function checkDataIntegrity() {
  console.log('\n🔍 4. Data Integrity Checks');
  console.log('─'.repeat(60));

  try {
    // Check for customers without ZOHO IDs (excluding internal_test)
    const { data: unsynced } = await supabase
      .from('customers')
      .select('id, email, account_number, created_at')
      .is('zoho_billing_customer_id', null)
      .neq('account_type', 'internal_test')
      .order('created_at', { ascending: true });

    if (!unsynced || unsynced.length === 0) {
      addResult('Unsynced Customers', 'pass', 'All customers have ZOHO IDs');
      console.log(`  ✅ All customers have ZOHO IDs`);
    } else {
      addResult('Unsynced Customers', 'warn', `${unsynced.length} customer(s) without ZOHO ID`, { count: unsynced.length });
      console.log(`  ⚠️  ${unsynced.length} customer(s) without ZOHO ID`);

      if (isDetailed) {
        console.log(`\n  Unsynced customers:`);
        unsynced.slice(0, 5).forEach(c => {
          console.log(`    - ${c.email || '(no email)'} (${c.account_number})`);
        });
        if (unsynced.length > 5) {
          console.log(`    ... and ${unsynced.length - 5} more`);
        }
      }
    }

    // Check for orphaned subscriptions (service active but customer not synced)
    const { data: orphanedServices } = await supabase
      .from('customer_services')
      .select(`
        id,
        package_name,
        customer:customers!inner(email, account_number, zoho_billing_customer_id)
      `)
      .eq('status', 'active')
      .is('customers.zoho_billing_customer_id', null);

    if (!orphanedServices || orphanedServices.length === 0) {
      addResult('Orphaned Services', 'pass', 'No orphaned services');
      console.log(`  ✅ No orphaned services (all parent customers synced)`);
    } else {
      addResult('Orphaned Services', 'warn', `${orphanedServices.length} service(s) with unsynced customer`, { count: orphanedServices.length });
      console.log(`  ⚠️  ${orphanedServices.length} service(s) with unsynced customer`);
    }

    // Check for failed syncs older than 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: staleFailed } = await supabase
      .from('zoho_sync_logs')
      .select('entity_type, entity_id')
      .eq('status', 'failed')
      .lt('created_at', weekAgo);

    if (!staleFailed || staleFailed.length === 0) {
      addResult('Stale Failures', 'pass', 'No stale failed syncs');
      console.log(`  ✅ No stale failed syncs (>7 days old)`);
    } else {
      addResult('Stale Failures', 'warn', `${staleFailed.length} failed sync(s) >7 days old`, { count: staleFailed.length });
      console.log(`  ⚠️  ${staleFailed.length} failed sync(s) >7 days old`);
      console.log(`  💡 Recommendation: Review and retry or investigate root cause`);
    }

  } catch (error: any) {
    addResult('Data Integrity', 'fail', `Error checking integrity: ${error.message}`);
    console.log(`  ❌ Error checking data integrity: ${error.message}`);
  }
}

function generateReport() {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📊 Health Check Summary');
  console.log('═'.repeat(60));

  const passed = results.filter(r => r.status === 'pass').length;
  const warned = results.filter(r => r.status === 'warn').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const total = results.length;

  console.log(`\nTotal Checks: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️  Warnings: ${warned}`);
  console.log(`❌ Failed: ${failed}`);

  console.log('\n📋 Check Results:');
  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
    console.log(`  ${icon} ${result.name}: ${result.message}`);
  });

  if (warned > 0 || failed > 0) {
    console.log('\n⚠️  Action Required:');
    results.filter(r => r.status !== 'pass').forEach(result => {
      console.log(`  - ${result.name}: ${result.message}`);
    });
  }

  console.log('');

  const overallStatus = failed > 0 ? 'UNHEALTHY' : warned > 0 ? 'DEGRADED' : 'HEALTHY';
  const statusIcon = failed > 0 ? '❌' : warned > 0 ? '⚠️' : '✅';

  console.log(`Overall Status: ${statusIcon} ${overallStatus}`);
  console.log('');

  return failed === 0 ? 0 : 1;
}

async function main() {
  const startTime = Date.now();

  if (!isEmailFormat) {
    console.log('\n🏥 ZOHO Billing Integration Health Check');
    console.log('═'.repeat(60));
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Mode: ${isDetailed ? 'Detailed' : 'Standard'}`);
  }

  await checkDatabaseSyncStatus();
  await checkRecentSyncActivity();
  await checkZohoApiConnectivity();
  await checkDataIntegrity();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\nDuration: ${duration}s`);

  const exitCode = generateReport();

  if (!isEmailFormat) {
    console.log('💡 Tip: Use --detailed flag for more information');
    console.log('💡 Tip: Use --email flag for email-friendly format');
  }

  process.exit(exitCode);
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
