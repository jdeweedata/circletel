// Admin API: Coverage Monitoring Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logging';
import { mtnCoverageMonitor } from '@/lib/coverage/mtn/monitoring';
import { mtnCoverageCache } from '@/lib/coverage/mtn/cache';
import { coverageAggregationService } from '@/lib/coverage/aggregation-service';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/coverage/monitoring
 * Returns comprehensive monitoring data for coverage APIs
 */
export async function GET(request: NextRequest) {
  try {
    // TEMPORARY: Disable auth for testing
    // TODO: Re-enable authentication before production
    /*
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      apiLogger.error('[Monitoring API] Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 });
    }

    // For development: Skip role check if in dev mode
    if (process.env.NODE_ENV === 'production') {
      const { data: profile } = await supabase
        .from('customers')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    */

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeWindow = parseInt(searchParams.get('window') || '3600000'); // Default 1 hour
    const format = searchParams.get('format') || 'json';

    // Collect monitoring data
    const monitoringData = {
      timestamp: new Date().toISOString(),
      timeWindow,
      
      // MTN Coverage API Performance
      mtn: {
        health: mtnCoverageMonitor.getHealthStatus(),
        performance: mtnCoverageMonitor.getPerformanceStats(timeWindow),
        rateLimiting: mtnCoverageMonitor.getRateLimitingStats(),
      },

      // Cache Performance
      cache: {
        stats: mtnCoverageCache.getStats(),
        hitRatio: mtnCoverageCache.getHitRatio(),
      },

      // Aggregation Service Stats
      aggregation: {
        cacheStats: coverageAggregationService.getCacheStats(),
      },

      // System Health Summary
      summary: generateHealthSummary(),
    };

    // Export formats
    if (format === 'csv') {
      const csv = mtnCoverageMonitor.exportMetrics('csv');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="coverage-metrics-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json(monitoringData);

  } catch (error) {
    apiLogger.error('Monitoring API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitoring data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/coverage/monitoring/reset
 * Reset monitoring metrics (useful for testing)
 */
export async function POST(request: NextRequest) {
  try {
    // TEMPORARY: Disable auth for testing
    // TODO: Re-enable authentication before production
    /*
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    */

    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'reset_metrics':
        mtnCoverageMonitor.reset();
        return NextResponse.json({ success: true, message: 'Metrics reset' });

      case 'clear_cache':
        mtnCoverageCache.clear();
        coverageAggregationService.clearCache();
        return NextResponse.json({ success: true, message: 'Cache cleared' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    apiLogger.error('Monitoring action error:', error);
    return NextResponse.json(
      { error: 'Failed to execute action' },
      { status: 500 }
    );
  }
}

/**
 * Generate health summary
 */
function generateHealthSummary() {
  const health = mtnCoverageMonitor.getHealthStatus();
  const perf = mtnCoverageMonitor.getPerformanceStats(300000); // Last 5 minutes
  const cacheHitRatio = mtnCoverageCache.getHitRatio();

  return {
    overallStatus: health.status,
    metrics: {
      successRate: perf.successRate,
      avgResponseTime: perf.averageResponseTime,
      cacheHitRate: cacheHitRatio * 100,
      totalRequests: perf.totalRequests,
    },
    alerts: generateAlerts(health, perf, cacheHitRatio),
  };
}

/**
 * Generate alert messages
 */
function generateAlerts(health: any, perf: any, cacheHitRatio: number) {
  const alerts = [];

  if (health.status === 'unhealthy') {
    alerts.push({
      level: 'critical',
      message: 'MTN Coverage API is unhealthy',
      details: health.details,
    });
  } else if (health.status === 'degraded') {
    alerts.push({
      level: 'warning',
      message: 'MTN Coverage API performance degraded',
      details: health.details,
    });
  }

  if (perf.successRate < 90 && perf.totalRequests > 10) {
    alerts.push({
      level: 'warning',
      message: `Low success rate: ${perf.successRate.toFixed(1)}%`,
    });
  }

  if (perf.averageResponseTime > 5000) {
    alerts.push({
      level: 'warning',
      message: `High response time: ${perf.averageResponseTime.toFixed(0)}ms`,
    });
  }

  if (cacheHitRatio < 0.5 && perf.totalRequests > 20) {
    alerts.push({
      level: 'info',
      message: `Low cache hit rate: ${(cacheHitRatio * 100).toFixed(1)}%`,
    });
  }

  return alerts;
}
