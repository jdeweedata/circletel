/**
 * Zoho Books Health Check Endpoint
 *
 * Returns health status, sync stats, and connection checks
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getZohoBooksClient } from '@/lib/integrations/zoho/books-api-client';

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    credentials: { status: 'pass' | 'fail'; message: string };
    tokenRefresh: { status: 'pass' | 'fail'; message: string; duration_ms?: number };
    apiConnection: { status: 'pass' | 'fail'; message: string; duration_ms?: number };
  };
  stats: {
    customersTotal: number;
    customersSynced: number;
    invoicesTotal: number;
    invoicesSynced: number;
    paymentsTotal: number;
    paymentsSynced: number;
    failedCount: number;
  };
  lastSync: {
    timestamp: string;
    duration_ms: number;
    result: 'success' | 'partial' | 'failed';
  } | null;
  details: {
    region: string;
    organizationId: string;
    apiLatencyMs: number;
  };
}

export async function GET() {
  // Check credentials
  const credentialsCheck = checkCredentials();

  // Check token refresh
  const tokenCheck = await checkTokenRefresh();

  // Check API connection
  const apiCheck = await checkApiConnection();

  // Get sync stats
  const stats = await getSyncStats();

  // Get last sync info
  const lastSync = await getLastSyncInfo();

  // Determine overall status
  const status = determineStatus(credentialsCheck, tokenCheck, apiCheck);

  const response: HealthResponse = {
    status,
    timestamp: new Date().toISOString(),
    checks: {
      credentials: credentialsCheck,
      tokenRefresh: tokenCheck,
      apiConnection: apiCheck,
    },
    stats,
    lastSync,
    details: {
      region: process.env.ZOHO_REGION || 'US',
      organizationId: maskOrgId(process.env.ZOHO_BOOKS_ORGANIZATION_ID || process.env.ZOHO_ORG_ID || ''),
      apiLatencyMs: apiCheck.duration_ms || 0,
    },
  };

  return NextResponse.json(response);
}

function checkCredentials(): { status: 'pass' | 'fail'; message: string } {
  const required = [
    'ZOHO_CLIENT_ID',
    'ZOHO_CLIENT_SECRET',
    'ZOHO_REFRESH_TOKEN',
  ];

  // Check for org ID (either Books-specific or general)
  const hasOrgId = process.env.ZOHO_BOOKS_ORGANIZATION_ID || process.env.ZOHO_ORG_ID;

  const missing = required.filter(key => !process.env[key]);
  if (!hasOrgId) {
    missing.push('ZOHO_BOOKS_ORGANIZATION_ID');
  }

  if (missing.length === 0) {
    return { status: 'pass', message: 'All credentials configured' };
  }

  return { status: 'fail', message: `Missing: ${missing.join(', ')}` };
}

async function checkTokenRefresh(): Promise<{ status: 'pass' | 'fail'; message: string; duration_ms?: number }> {
  const start = Date.now();
  try {
    // Use testConnection which internally uses getAccessToken
    const client = getZohoBooksClient();
    const result = await client.testConnection();
    if (result.success) {
      return {
        status: 'pass',
        message: 'Token valid',
        duration_ms: Date.now() - start,
      };
    }
    return {
      status: 'fail',
      message: result.error || 'Token refresh failed',
      duration_ms: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Token refresh failed',
      duration_ms: Date.now() - start,
    };
  }
}

async function checkApiConnection(): Promise<{ status: 'pass' | 'fail'; message: string; duration_ms?: number }> {
  const start = Date.now();
  try {
    const client = getZohoBooksClient();
    const result = await client.testConnection();
    if (result.success) {
      return {
        status: 'pass',
        message: `Connected to ${result.org_name}`,
        duration_ms: Date.now() - start,
      };
    }
    return {
      status: 'fail',
      message: result.error || 'Connection failed',
      duration_ms: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'API connection failed',
      duration_ms: Date.now() - start,
    };
  }
}

async function getSyncStats() {
  const supabase = await createClient();

  // Customers
  const { count: customersTotal } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  const { count: customersSynced } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .not('zoho_books_contact_id', 'is', null);

  // Invoices
  const { count: invoicesTotal } = await supabase
    .from('customer_invoices')
    .select('*', { count: 'exact', head: true });

  const { count: invoicesSynced } = await supabase
    .from('customer_invoices')
    .select('*', { count: 'exact', head: true })
    .not('zoho_books_invoice_id', 'is', null);

  // Payments
  const { count: paymentsTotal } = await supabase
    .from('payment_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  const { count: paymentsSynced } = await supabase
    .from('payment_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .not('zoho_books_payment_id', 'is', null);

  // Failed count
  const { count: failedCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('zoho_sync_status', 'failed');

  const { count: failedInvoices } = await supabase
    .from('customer_invoices')
    .select('*', { count: 'exact', head: true })
    .eq('zoho_sync_status', 'failed');

  const { count: failedPayments } = await supabase
    .from('payment_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('zoho_sync_status', 'failed');

  return {
    customersTotal: customersTotal || 0,
    customersSynced: customersSynced || 0,
    invoicesTotal: invoicesTotal || 0,
    invoicesSynced: invoicesSynced || 0,
    paymentsTotal: paymentsTotal || 0,
    paymentsSynced: paymentsSynced || 0,
    failedCount: (failedCustomers || 0) + (failedInvoices || 0) + (failedPayments || 0),
  };
}

async function getLastSyncInfo() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('cron_execution_log')
    .select('*')
    .eq('cron_name', 'zoho-books-sync')
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;

  return {
    timestamp: data.started_at,
    duration_ms: data.duration_ms || 0,
    result: data.status as 'success' | 'partial' | 'failed',
  };
}

function determineStatus(
  credentials: { status: string },
  token: { status: string },
  api: { status: string }
): 'healthy' | 'degraded' | 'unhealthy' {
  if (credentials.status === 'fail') return 'unhealthy';
  if (token.status === 'fail') return 'unhealthy';
  if (api.status === 'fail') return 'degraded';
  return 'healthy';
}

function maskOrgId(orgId: string): string {
  if (!orgId || orgId.length < 8) return '***';
  return orgId.substring(0, 4) + '****' + orgId.substring(orgId.length - 4);
}
