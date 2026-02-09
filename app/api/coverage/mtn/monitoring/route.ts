// MTN Coverage Monitoring API Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { mtnCoverageMonitor } from '@/lib/coverage/mtn/monitoring';
import { apiLogger } from '@/lib/logging';

interface MonitoringQuery {
  action: 'stats' | 'health' | 'export' | 'reset';
  window?: string; // Time window in milliseconds
  format?: 'json' | 'csv';
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') as MonitoringQuery['action'] || 'stats';
    const windowMs = searchParams.get('window') ? parseInt(searchParams.get('window')!) : 60 * 60 * 1000; // Default 1 hour
    const format = searchParams.get('format') as 'json' | 'csv' || 'json';

    switch (action) {
      case 'stats': {
        const stats = mtnCoverageMonitor.getPerformanceStats(windowMs);

        return NextResponse.json({
          success: true,
          data: {
            ...stats,
            timeWindow: {
              windowMs,
              windowHours: windowMs / (60 * 60 * 1000),
              generatedAt: new Date().toISOString()
            }
          }
        });
      }

      case 'health': {
        const health = mtnCoverageMonitor.getHealthStatus();
        const rateLimitStats = mtnCoverageMonitor.getRateLimitingStats();

        return NextResponse.json({
          success: true,
          data: {
            ...health,
            rateLimiting: rateLimitStats,
            timestamp: new Date().toISOString()
          }
        });
      }

      case 'export': {
        const exportData = mtnCoverageMonitor.exportMetrics(format);

        if (format === 'csv') {
          return new NextResponse(exportData, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': 'attachment; filename="mtn-coverage-metrics.csv"'
            }
          });
        } else {
          return NextResponse.json({
            success: true,
            data: JSON.parse(exportData)
          });
        }
      }

      case 'reset': {
        // Only allow reset in development
        if (process.env.NODE_ENV !== 'development') {
          return NextResponse.json({
            success: false,
            error: 'Reset only allowed in development environment'
          }, { status: 403 });
        }

        mtnCoverageMonitor.reset();

        return NextResponse.json({
          success: true,
          message: 'Monitoring metrics reset successfully'
        });
      }

      default: {
        return NextResponse.json({
          success: false,
          error: `Invalid action: ${action}. Supported actions: stats, health, export, reset`
        }, { status: 400 });
      }
    }

  } catch (error) {
    apiLogger.error('Monitoring API error:', error);

    return NextResponse.json({
      success: false,
      error: 'Internal monitoring error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action, params } = body;

    switch (action) {
      case 'bulk_export': {
        const { startTime, endTime, format = 'json' } = params;

        if (!startTime || !endTime) {
          return NextResponse.json({
            success: false,
            error: 'startTime and endTime are required for bulk export'
          }, { status: 400 });
        }

        const metrics = mtnCoverageMonitor.getMetricsForTimeRange(startTime, endTime);

        if (format === 'csv') {
          // Convert metrics to CSV
          const headers = [
            'requestId', 'timestamp', 'lat', 'lng', 'layers', 'duration',
            'success', 'errorCode', 'errorMessage', 'cacheHit', 'source',
            'validationErrors', 'validationWarnings'
          ];

          const csvRows = metrics.map(metric => [
            metric.requestId,
            new Date(metric.timestamp).toISOString(),
            metric.coordinates.lat,
            metric.coordinates.lng,
            metric.layers.join(';'),
            metric.duration,
            metric.success,
            metric.errorCode || '',
            metric.errorMessage || '',
            metric.cacheHit,
            metric.source,
            metric.validationErrors,
            metric.validationWarnings
          ]);

          const csvContent = [headers, ...csvRows].map(row => row.join(',')).join('\n');

          return new NextResponse(csvContent, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="mtn-coverage-metrics-${startTime}-${endTime}.csv"`
            }
          });
        } else {
          return NextResponse.json({
            success: true,
            data: {
              metrics,
              count: metrics.length,
              timeRange: {
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString()
              }
            }
          });
        }
      }

      case 'alert_test': {
        // Simulate an alert for testing purposes (development only)
        if (process.env.NODE_ENV !== 'development') {
          return NextResponse.json({
            success: false,
            error: 'Alert testing only allowed in development environment'
          }, { status: 403 });
        }

        // Record a fake failed request to trigger alert
        mtnCoverageMonitor.recordRequest({
          coordinates: { lat: -26.2041, lng: 28.0473 },
          layers: ['test-layer'],
          duration: 15000, // High response time
          success: false,
          errorCode: 'WMS_REQUEST_FAILED',
          errorMessage: 'Test alert triggered',
          cacheHit: false,
          source: 'business',
          validationErrors: 1,
          validationWarnings: 0
        });

        return NextResponse.json({
          success: true,
          message: 'Test alert triggered successfully'
        });
      }

      default: {
        return NextResponse.json({
          success: false,
          error: `Invalid action: ${action}. Supported actions: bulk_export, alert_test`
        }, { status: 400 });
      }
    }

  } catch (error) {
    apiLogger.error('Monitoring POST API error:', error);

    return NextResponse.json({
      success: false,
      error: 'Internal monitoring error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Health check endpoint
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  try {
    const health = mtnCoverageMonitor.getHealthStatus();

    // Return appropriate HTTP status based on health
    let status = 200;
    if (health.status === 'degraded') {
      status = 200; // Still OK but with warning header
    } else if (health.status === 'unhealthy') {
      status = 503; // Service unavailable
    }

    const headers = new Headers();
    headers.set('X-Health-Status', health.status);
    headers.set('X-Success-Rate', health.details.successRate.toFixed(2));
    headers.set('X-Average-Response-Time', health.details.averageResponseTime.toFixed(0));
    headers.set('X-Consecutive-Failures', health.details.consecutiveFailures.toString());

    return new NextResponse(null, {
      status,
      headers
    });

  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}