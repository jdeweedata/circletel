/**
 * AR Analytics API
 * GET /api/admin/finance/ar-analytics
 *
 * Provides comprehensive Accounts Receivable analytics including:
 * - AR Aging Summary
 * - DSO (Days Sales Outstanding) metrics
 * - Notification effectiveness
 * - Collection performance
 * - Historical trends
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createClientWithSession } from '@/lib/supabase/server';
import { NotificationTrackingService } from '@/lib/billing/notification-tracking-service';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const sessionClient = await createClientWithSession();
    const {
      data: { user },
      error: authError,
    } = await sessionClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    const supabase = await createClient();
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('email', user.email)
      .single();

    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const includeHistory = searchParams.get('history') === 'true';

    // Fetch all analytics data in parallel
    const [arSummary, dsoMetrics, collectionEffectiveness, notificationAnalytics] = await Promise.all([
      NotificationTrackingService.getARAgingSummary(),
      NotificationTrackingService.calculateDSOMetrics(),
      NotificationTrackingService.getCollectionEffectiveness(days),
      NotificationTrackingService.getNotificationAnalytics(
        new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      ),
    ]);

    // Get historical AR snapshots if requested
    let historicalData = null;
    if (includeHistory) {
      const { data: snapshots } = await supabase
        .from('ar_aging_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: false })
        .limit(days);

      historicalData = snapshots?.reverse() || [];
    }

    // Get recent notifications
    const { data: recentNotifications } = await supabase
      .from('invoice_notification_log')
      .select(`
        id,
        invoice_number,
        notification_type,
        recipient,
        status,
        amount_due,
        days_overdue,
        created_at,
        sent_at
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    // Calculate notification summary
    const notificationSummary = {
      total_sms: notificationAnalytics.filter(n => n.notification_type === 'sms').reduce((sum, n) => sum + n.total_sent, 0),
      total_email: notificationAnalytics.filter(n => n.notification_type === 'email').reduce((sum, n) => sum + n.total_sent, 0),
      total_delivered: notificationAnalytics.reduce((sum, n) => sum + n.delivered, 0),
      total_failed: notificationAnalytics.reduce((sum, n) => sum + n.failed, 0),
      delivery_rate: 0,
    };

    const totalSent = notificationSummary.total_sms + notificationSummary.total_email;
    notificationSummary.delivery_rate = totalSent > 0
      ? Math.round((notificationSummary.total_delivered / totalSent) * 100 * 100) / 100
      : 0;

    // Build response
    return NextResponse.json({
      success: true,
      data: {
        // AR Aging
        ar_aging: arSummary || {
          total_outstanding_invoices: 0,
          total_outstanding_amount: 0,
          current_count: 0,
          current_amount: 0,
          overdue_1_30_count: 0,
          overdue_1_30_amount: 0,
          overdue_31_60_count: 0,
          overdue_31_60_amount: 0,
          overdue_61_90_count: 0,
          overdue_61_90_amount: 0,
          overdue_90_plus_count: 0,
          overdue_90_plus_amount: 0,
          avg_days_overdue: 0,
        },

        // DSO Metrics
        dso: dsoMetrics || {
          dso_current: 0,
          dso_30_day_avg: 0,
          dso_trend: 'stable',
          best_possible_dso: 0,
          collection_effectiveness_index: 0,
        },

        // Collection Performance
        collection: collectionEffectiveness || {
          total_notifications_sent: 0,
          total_amount_collected: 0,
          collection_rate: 0,
          avg_days_to_payment: 0,
          response_rate: 0,
        },

        // Notification Summary
        notifications: notificationSummary,

        // Daily Analytics
        daily_analytics: notificationAnalytics,

        // Recent Notifications
        recent_notifications: recentNotifications || [],

        // Historical Trends (if requested)
        historical: historicalData,

        // Metadata
        period_days: days,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[AR Analytics] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch AR analytics' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/finance/ar-analytics
 * Create daily AR snapshot (can be called manually or by cron)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret or admin auth
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    let isAuthorized = false;

    // Check cron secret
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      isAuthorized = true;
    }

    // Check admin auth
    if (!isAuthorized) {
      const sessionClient = await createClientWithSession();
      const { data: { user } } = await sessionClient.auth.getUser();

      if (user) {
        const supabase = await createClient();
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('id')
          .eq('email', user.email)
          .single();

        if (adminUser) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Create daily snapshot
    const result = await NotificationTrackingService.createDailySnapshot();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Daily AR snapshot created successfully',
    });
  } catch (error) {
    console.error('[AR Analytics] Snapshot error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create snapshot' },
      { status: 500 }
    );
  }
}
