/**
 * Payment Sync Stats API
 *
 * GET /api/admin/payments/sync-stats
 *
 * Returns payment sync statistics for admin dashboard.
 * Part of the Unified Payment & Billing Architecture.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get sync status counts
    const statuses = ['pending', 'syncing', 'synced', 'failed', 'skipped'] as const;
    const stats: Record<string, number> = {};

    for (const status of statuses) {
      const { count } = await supabase
        .from('payment_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('zoho_sync_status', status);

      stats[status] = count || 0;
    }

    // Get recent failed syncs
    const { data: recentFailed } = await supabase
      .from('payment_transactions')
      .select(`
        id,
        transaction_id,
        reference,
        amount,
        zoho_last_sync_error,
        updated_at
      `)
      .eq('zoho_sync_status', 'failed')
      .order('updated_at', { ascending: false })
      .limit(5);

    // Get last successful sync
    const { data: lastSuccess } = await supabase
      .from('payment_transactions')
      .select('zoho_last_synced_at')
      .eq('zoho_sync_status', 'synced')
      .order('zoho_last_synced_at', { ascending: false })
      .limit(1)
      .single();

    // Get total payments today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: paymentsToday } = await supabase
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', today.toISOString());

    // Calculate health status
    const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
    const failedPercent = total > 0 ? (stats.failed / total) * 100 : 0;

    let healthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (failedPercent > 10) {
      healthStatus = 'unhealthy';
    } else if (failedPercent > 5 || stats.failed > 0) {
      healthStatus = 'degraded';
    }

    return NextResponse.json({
      success: true,
      data: {
        stats,
        total,
        healthStatus,
        failedPercent: Math.round(failedPercent * 10) / 10,
        recentFailed: recentFailed || [],
        lastSuccessfulSync: lastSuccess?.zoho_last_synced_at || null,
        paymentsToday: paymentsToday || 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Payment Sync Stats] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch payment sync stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
