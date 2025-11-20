/**
 * ZOHO Billing Sync Status API
 *
 * GET /api/admin/zoho-sync/status
 *
 * Returns sync status summary across all entity types:
 * - Customers → ZOHO Contacts
 * - Services → ZOHO Subscriptions
 * - Invoices → ZOHO Invoices
 * - Payments → ZOHO Payments
 *
 * Response includes:
 * - Total counts by entity type
 * - Counts by sync status (pending, syncing, synced, failed, retrying)
 * - Failed sync alerts
 *
 * @module app/api/admin/zoho-sync/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/zoho-sync/status
 *
 * Get sync status summary for all entity types
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('auth_user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get customer sync status
    const { data: customerStats } = await supabase
      .from('customers')
      .select('zoho_sync_status')
      .then(result => {
        const stats = {
          total: result.data?.length || 0,
          pending: 0,
          syncing: 0,
          synced: 0,
          failed: 0,
          retrying: 0
        };

        result.data?.forEach(row => {
          const status = row.zoho_sync_status || 'pending';
          stats[status as keyof typeof stats]++;
        });

        return { data: stats };
      });

    // Get service (subscription) sync status
    const { data: serviceStats } = await supabase
      .from('customer_services')
      .select('zoho_sync_status')
      .then(result => {
        const stats = {
          total: result.data?.length || 0,
          pending: 0,
          syncing: 0,
          synced: 0,
          failed: 0,
          retrying: 0
        };

        result.data?.forEach(row => {
          const status = row.zoho_sync_status || 'pending';
          stats[status as keyof typeof stats]++;
        });

        return { data: stats };
      });

    // Get invoice sync status (only syncable types)
    const { data: invoiceStats } = await supabase
      .from('customer_invoices')
      .select('zoho_sync_status, invoice_type')
      .in('invoice_type', ['installation', 'pro_rata', 'equipment', 'adjustment'])
      .then(result => {
        const stats = {
          total: result.data?.length || 0,
          pending: 0,
          syncing: 0,
          synced: 0,
          failed: 0,
          retrying: 0
        };

        result.data?.forEach(row => {
          const status = row.zoho_sync_status || 'pending';
          stats[status as keyof typeof stats]++;
        });

        return { data: stats };
      });

    // Get payment sync status
    const { data: paymentStats } = await supabase
      .from('payment_transactions')
      .select('zoho_sync_status, status')
      .eq('status', 'completed')
      .then(result => {
        const stats = {
          total: result.data?.length || 0,
          pending: 0,
          syncing: 0,
          synced: 0,
          failed: 0,
          retrying: 0
        };

        result.data?.forEach(row => {
          const status = row.zoho_sync_status || 'pending';
          stats[status as keyof typeof stats]++;
        });

        return { data: stats };
      });

    // Get recent failed syncs (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: recentFailures, error: failuresError } = await supabase
      .from('zoho_sync_logs')
      .select('*')
      .eq('status', 'failed')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(10);

    if (failuresError) {
      console.error('Error fetching recent failures:', failuresError);
    }

    // Calculate overall statistics
    const overallStats = {
      total: (customerStats?.total || 0) + (serviceStats?.total || 0) +
             (invoiceStats?.total || 0) + (paymentStats?.total || 0),
      synced: (customerStats?.synced || 0) + (serviceStats?.synced || 0) +
              (invoiceStats?.synced || 0) + (paymentStats?.synced || 0),
      pending: (customerStats?.pending || 0) + (serviceStats?.pending || 0) +
               (invoiceStats?.pending || 0) + (paymentStats?.pending || 0),
      failed: (customerStats?.failed || 0) + (serviceStats?.failed || 0) +
              (invoiceStats?.failed || 0) + (paymentStats?.failed || 0),
      syncing: (customerStats?.syncing || 0) + (serviceStats?.syncing || 0) +
               (invoiceStats?.syncing || 0) + (paymentStats?.syncing || 0),
      retrying: (customerStats?.retrying || 0) + (serviceStats?.retrying || 0) +
                (invoiceStats?.retrying || 0) + (paymentStats?.retrying || 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        overall: overallStats,
        by_entity: {
          customers: customerStats,
          subscriptions: serviceStats,
          invoices: invoiceStats,
          payments: paymentStats
        },
        recent_failures: recentFailures || [],
        sync_health: {
          success_rate: overallStats.total > 0
            ? Math.round((overallStats.synced / overallStats.total) * 100)
            : 0,
          has_failures: overallStats.failed > 0,
          failure_count_24h: recentFailures?.length || 0
        }
      }
    });

  } catch (error) {
    console.error('ZOHO sync status API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
