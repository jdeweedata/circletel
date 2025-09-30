// MTN Coverage API Monitoring and Performance Tracking
import { MTNWMSResponse, MTNError, MTNErrorCode } from './types';
import { Coordinates, ServiceType } from '../types';

export interface CoverageMetrics {
  requestId: string;
  timestamp: number;
  coordinates: Coordinates;
  layers: string[];
  duration: number;
  success: boolean;
  errorCode?: MTNErrorCode;
  errorMessage?: string;
  responseSize?: number;
  cacheHit: boolean;
  source: 'business' | 'consumer' | 'both';
  validationErrors: number;
  validationWarnings: number;
}

export interface PerformanceStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  cacheHitRate: number;
  errorBreakdown: Record<MTNErrorCode, number>;
  hourlyStats: Record<string, {
    requests: number;
    successRate: number;
    avgResponseTime: number;
  }>;
  layerStats: Record<string, {
    requests: number;
    successRate: number;
    avgResponseTime: number;
  }>;
}

export interface AlertThresholds {
  maxResponseTime: number; // ms
  minSuccessRate: number; // percentage
  maxErrorRate: number; // percentage
  consecutiveFailures: number;
}

export class MTNCoverageMonitor {
  private metrics: CoverageMetrics[] = [];
  private readonly maxMetricsHistory = 10000; // Keep last 10k requests
  private consecutiveFailures = 0;
  private lastAlertTime = 0;
  private readonly alertCooldownMs = 5 * 60 * 1000; // 5 minutes

  private defaultThresholds: AlertThresholds = {
    maxResponseTime: 10000, // 10 seconds
    minSuccessRate: 85, // 85%
    maxErrorRate: 15, // 15%
    consecutiveFailures: 5
  };

  /**
   * Record a coverage request metric
   */
  recordRequest(metric: Omit<CoverageMetrics, 'requestId' | 'timestamp'>): string {
    const requestId = this.generateRequestId();
    const fullMetric: CoverageMetrics = {
      ...metric,
      requestId,
      timestamp: Date.now()
    };

    this.metrics.push(fullMetric);

    // Maintain rolling window
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Update consecutive failure counter
    if (fullMetric.success) {
      this.consecutiveFailures = 0;
    } else {
      this.consecutiveFailures++;
    }

    // Check for alerts
    this.checkAlerts(fullMetric);

    return requestId;
  }

  /**
   * Get performance statistics for a time window
   */
  getPerformanceStats(windowMs: number = 60 * 60 * 1000): PerformanceStats {
    const cutoffTime = Date.now() - windowMs;
    const windowMetrics = this.metrics.filter(m => m.timestamp >= cutoffTime);

    if (windowMetrics.length === 0) {
      return this.getEmptyStats();
    }

    const successful = windowMetrics.filter(m => m.success);
    const failed = windowMetrics.filter(m => !m.success);
    const responseTimes = windowMetrics.map(m => m.duration).sort((a, b) => a - b);
    const cacheHits = windowMetrics.filter(m => m.cacheHit);

    // Calculate percentiles
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);
    const medianIndex = Math.floor(responseTimes.length * 0.5);

    // Error breakdown
    const errorBreakdown: Record<MTNErrorCode, number> = {
      'CONFIG_NOT_FOUND': 0,
      'LAYER_NOT_AVAILABLE': 0,
      'WMS_REQUEST_FAILED': 0,
      'FEATURE_INFO_EMPTY': 0,
      'COORDINATE_OUT_OF_BOUNDS': 0,
      'SERVICE_UNAVAILABLE': 0
    };

    failed.forEach(metric => {
      if (metric.errorCode) {
        errorBreakdown[metric.errorCode] = (errorBreakdown[metric.errorCode] || 0) + 1;
      }
    });

    // Hourly breakdown
    const hourlyStats = this.calculateHourlyStats(windowMetrics);
    const layerStats = this.calculateLayerStats(windowMetrics);

    return {
      totalRequests: windowMetrics.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      successRate: (successful.length / windowMetrics.length) * 100,
      averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      medianResponseTime: responseTimes[medianIndex] || 0,
      p95ResponseTime: responseTimes[p95Index] || 0,
      p99ResponseTime: responseTimes[p99Index] || 0,
      cacheHitRate: (cacheHits.length / windowMetrics.length) * 100,
      errorBreakdown,
      hourlyStats,
      layerStats
    };
  }

  /**
   * Calculate hourly statistics
   */
  private calculateHourlyStats(metrics: CoverageMetrics[]): Record<string, {
    requests: number;
    successRate: number;
    avgResponseTime: number;
  }> {
    const hourlyData: Record<string, CoverageMetrics[]> = {};

    metrics.forEach(metric => {
      const hour = new Date(metric.timestamp).toISOString().slice(0, 13); // YYYY-MM-DDTHH
      if (!hourlyData[hour]) {
        hourlyData[hour] = [];
      }
      hourlyData[hour].push(metric);
    });

    const hourlyStats: Record<string, any> = {};
    Object.entries(hourlyData).forEach(([hour, hourMetrics]) => {
      const successful = hourMetrics.filter(m => m.success);
      const avgResponseTime = hourMetrics.reduce((sum, m) => sum + m.duration, 0) / hourMetrics.length;

      hourlyStats[hour] = {
        requests: hourMetrics.length,
        successRate: (successful.length / hourMetrics.length) * 100,
        avgResponseTime
      };
    });

    return hourlyStats;
  }

  /**
   * Calculate layer-specific statistics
   */
  private calculateLayerStats(metrics: CoverageMetrics[]): Record<string, {
    requests: number;
    successRate: number;
    avgResponseTime: number;
  }> {
    const layerData: Record<string, CoverageMetrics[]> = {};

    metrics.forEach(metric => {
      metric.layers.forEach(layer => {
        if (!layerData[layer]) {
          layerData[layer] = [];
        }
        layerData[layer].push(metric);
      });
    });

    const layerStats: Record<string, any> = {};
    Object.entries(layerData).forEach(([layer, layerMetrics]) => {
      const successful = layerMetrics.filter(m => m.success);
      const avgResponseTime = layerMetrics.reduce((sum, m) => sum + m.duration, 0) / layerMetrics.length;

      layerStats[layer] = {
        requests: layerMetrics.length,
        successRate: (successful.length / layerMetrics.length) * 100,
        avgResponseTime
      };
    });

    return layerStats;
  }

  /**
   * Check for performance alerts
   */
  private checkAlerts(metric: CoverageMetrics, thresholds?: AlertThresholds): void {
    const activeThresholds = thresholds || this.defaultThresholds;
    const now = Date.now();

    // Avoid alert spam
    if (now - this.lastAlertTime < this.alertCooldownMs) {
      return;
    }

    const alerts: string[] = [];

    // Check response time
    if (metric.duration > activeThresholds.maxResponseTime) {
      alerts.push(`High response time: ${metric.duration}ms > ${activeThresholds.maxResponseTime}ms`);
    }

    // Check consecutive failures
    if (this.consecutiveFailures >= activeThresholds.consecutiveFailures) {
      alerts.push(`${this.consecutiveFailures} consecutive failures detected`);
    }

    // Check recent success rate (last 50 requests)
    const recentMetrics = this.metrics.slice(-50);
    if (recentMetrics.length >= 10) {
      const recentSuccessRate = (recentMetrics.filter(m => m.success).length / recentMetrics.length) * 100;
      if (recentSuccessRate < activeThresholds.minSuccessRate) {
        alerts.push(`Low success rate: ${recentSuccessRate.toFixed(1)}% < ${activeThresholds.minSuccessRate}%`);
      }
    }

    if (alerts.length > 0) {
      this.sendAlert(alerts, metric);
      this.lastAlertTime = now;
    }
  }

  /**
   * Send performance alert
   */
  private sendAlert(alerts: string[], metric: CoverageMetrics): void {
    const alertData = {
      timestamp: new Date().toISOString(),
      alerts,
      metric,
      context: {
        consecutiveFailures: this.consecutiveFailures,
        recentStats: this.getPerformanceStats(5 * 60 * 1000) // Last 5 minutes
      }
    };

    // Log alert (in production, this could send to monitoring service)
    console.error('MTN Coverage API Alert:', alertData);

    // In production, integrate with monitoring services:
    // - Send to DataDog, New Relic, etc.
    // - Trigger PagerDuty/Slack notifications
    // - Store in monitoring database
    this.handleProductionAlert(alertData);
  }

  /**
   * Handle production alerting
   */
  private handleProductionAlert(alertData: any): void {
    // Example integration points:

    // 1. Send to external monitoring service
    if (process.env.DATADOG_API_KEY) {
      // sendToDataDog(alertData);
    }

    // 2. Trigger Slack notification
    if (process.env.SLACK_WEBHOOK_URL) {
      // sendSlackNotification(alertData);
    }

    // 3. Store alert in database for analysis
    if (process.env.NODE_ENV === 'production') {
      // storeAlertInDatabase(alertData);
    }
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      successRate: number;
      averageResponseTime: number;
      consecutiveFailures: number;
      lastRequestTime: number;
    };
  } {
    const recentStats = this.getPerformanceStats(5 * 60 * 1000); // Last 5 minutes
    const lastRequest = this.metrics[this.metrics.length - 1];

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (this.consecutiveFailures >= 10 || recentStats.successRate < 50) {
      status = 'unhealthy';
    } else if (this.consecutiveFailures >= 3 || recentStats.successRate < 85 || recentStats.averageResponseTime > 5000) {
      status = 'degraded';
    }

    return {
      status,
      details: {
        successRate: recentStats.successRate,
        averageResponseTime: recentStats.averageResponseTime,
        consecutiveFailures: this.consecutiveFailures,
        lastRequestTime: lastRequest?.timestamp || 0
      }
    };
  }

  /**
   * Reset metrics (useful for testing)
   */
  reset(): void {
    this.metrics = [];
    this.consecutiveFailures = 0;
    this.lastAlertTime = 0;
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.exportMetricsAsCsv();
    }
    return JSON.stringify(this.metrics, null, 2);
  }

  /**
   * Export metrics as CSV
   */
  private exportMetricsAsCsv(): string {
    if (this.metrics.length === 0) {
      return 'No metrics available';
    }

    const headers = [
      'requestId', 'timestamp', 'lat', 'lng', 'layers', 'duration',
      'success', 'errorCode', 'errorMessage', 'responseSize', 'cacheHit',
      'source', 'validationErrors', 'validationWarnings'
    ];

    const csvRows = this.metrics.map(metric => [
      metric.requestId,
      new Date(metric.timestamp).toISOString(),
      metric.coordinates.lat,
      metric.coordinates.lng,
      metric.layers.join(';'),
      metric.duration,
      metric.success,
      metric.errorCode || '',
      metric.errorMessage || '',
      metric.responseSize || '',
      metric.cacheHit,
      metric.source,
      metric.validationErrors,
      metric.validationWarnings
    ]);

    return [headers, ...csvRows].map(row => row.join(',')).join('\n');
  }

  private getEmptyStats(): PerformanceStats {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      successRate: 0,
      averageResponseTime: 0,
      medianResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      cacheHitRate: 0,
      errorBreakdown: {
        'CONFIG_NOT_FOUND': 0,
        'LAYER_NOT_AVAILABLE': 0,
        'WMS_REQUEST_FAILED': 0,
        'FEATURE_INFO_EMPTY': 0,
        'COORDINATE_OUT_OF_BOUNDS': 0,
        'SERVICE_UNAVAILABLE': 0
      },
      hourlyStats: {},
      layerStats: {}
    };
  }

  private generateRequestId(): string {
    return `mtn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Get metrics for specific time range
   */
  getMetricsForTimeRange(startTime: number, endTime: number): CoverageMetrics[] {
    return this.metrics.filter(m => m.timestamp >= startTime && m.timestamp <= endTime);
  }

  /**
   * Get rate limiting statistics
   */
  getRateLimitingStats(): {
    averageDelay: number;
    rateLimitHits: number;
    requestsPerMinute: number;
  } {
    const recentMetrics = this.getMetricsForTimeRange(Date.now() - 60000, Date.now()); // Last minute
    const rateLimitErrors = recentMetrics.filter(m => m.errorCode === 'WMS_REQUEST_FAILED' &&
      m.errorMessage?.includes('rate limit'));

    return {
      averageDelay: 250, // Our configured delay
      rateLimitHits: rateLimitErrors.length,
      requestsPerMinute: recentMetrics.length
    };
  }
}

// Export singleton instance
export const mtnCoverageMonitor = new MTNCoverageMonitor();