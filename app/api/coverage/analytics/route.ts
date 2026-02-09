import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { apiLogger } from '@/lib/logging';

export const dynamic = 'force-dynamic';

interface TimeSeriesData {
  timestamp: string;
  requests: number;
  successRate: number;
  responseTime: number;
  errors: number;
}

interface ProvinceData {
  province: string;
  requests: number;
  successRate: number;
  avgResponseTime: number;
}

interface ErrorDistribution {
  type: string;
  count: number;
  percentage: number;
}

interface PerformanceTrend {
  period: string;
  p50: number;
  p95: number;
  p99: number;
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '24h';

    // Calculate time range
    const now = new Date();
    let startTime: Date;
    let interval: string;
    let intervalMinutes: number;

    switch (range) {
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        interval = '4 hours';
        intervalMinutes = 240;
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        interval = '1 day';
        intervalMinutes = 1440;
        break;
      default: // 24h
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        interval = '1 hour';
        intervalMinutes = 60;
    }

    // Fetch time series data
    const { data: timeSeriesRaw, error: timeSeriesError } = await supabase.rpc('get_coverage_time_series', {
      p_start_time: startTime.toISOString(),
      p_end_time: now.toISOString(),
      p_interval: interval
    });

    if (timeSeriesError) {
      apiLogger.error('Time series error:', timeSeriesError);
    }

    // Fetch province data
    const { data: provinceRaw, error: provinceError } = await supabase
      .from('coverage_check_logs')
      .select('province, success, response_time_ms')
      .gte('created_at', startTime.toISOString())
      .not('province', 'is', null);

    if (provinceError) {
      apiLogger.error('Province error:', provinceError);
    }

    // Fetch error distribution
    const { data: errorRaw, error: errorError } = await supabase
      .from('coverage_check_logs')
      .select('error_type')
      .gte('created_at', startTime.toISOString())
      .not('error_type', 'is', null);

    if (errorError) {
      apiLogger.error('Error data error:', errorError);
    }

    // Fetch performance trends (last 7, 30, 90 days)
    const periods = [
      { label: 'Last 7 Days', days: 7 },
      { label: 'Last 30 Days', days: 30 },
      { label: 'Last 90 Days', days: 90 }
    ];

    const performanceTrends: PerformanceTrend[] = await Promise.all(
      periods.map(async ({ label, days }) => {
        const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const { data } = await supabase
          .from('coverage_check_logs')
          .select('response_time_ms')
          .gte('created_at', periodStart.toISOString())
          .order('response_time_ms', { ascending: true });

        if (!data || data.length === 0) {
          return { period: label, p50: 0, p95: 0, p99: 0 };
        }

        const times = data.map(d => d.response_time_ms);
        const p50Index = Math.floor(times.length * 0.5);
        const p95Index = Math.floor(times.length * 0.95);
        const p99Index = Math.floor(times.length * 0.99);

        return {
          period: label,
          p50: times[p50Index] || 0,
          p95: times[p95Index] || 0,
          p99: times[p99Index] || 0
        };
      })
    );

    // Process time series data
    const timeSeries: TimeSeriesData[] = [];
    if (timeSeriesRaw && Array.isArray(timeSeriesRaw)) {
      for (const row of timeSeriesRaw) {
        const timestamp = new Date(row.time_bucket);
        timeSeries.push({
          timestamp: timestamp.toISOString().slice(11, 16), // HH:MM
          requests: row.total_requests || 0,
          successRate: row.success_rate || 0,
          responseTime: row.avg_response_time || 0,
          errors: row.error_count || 0
        });
      }
    }

    // If no data from function, query directly
    if (timeSeries.length === 0) {
      const { data: directData } = await supabase
        .from('coverage_check_logs')
        .select('created_at, success, response_time_ms, error_code')
        .gte('created_at', startTime.toISOString())
        .order('created_at', { ascending: true });

      if (directData && directData.length > 0) {
        // Group by time intervals
        const buckets = new Map<string, { requests: number; success: number; totalTime: number; errors: number }>();
        
        for (const log of directData) {
          const logTime = new Date(log.created_at);
          const bucketTime = new Date(Math.floor(logTime.getTime() / (intervalMinutes * 60 * 1000)) * (intervalMinutes * 60 * 1000));
          const key = bucketTime.toISOString();

          if (!buckets.has(key)) {
            buckets.set(key, { requests: 0, success: 0, totalTime: 0, errors: 0 });
          }

          const bucket = buckets.get(key)!;
          bucket.requests++;
          if (log.success) bucket.success++;
          bucket.totalTime += log.response_time_ms || 0;
          if (log.error_code) bucket.errors++;
        }

        for (const [key, bucket] of buckets.entries()) {
          const timestamp = new Date(key);
          timeSeries.push({
            timestamp: timestamp.toISOString().slice(11, 16),
            requests: bucket.requests,
            successRate: bucket.requests > 0 ? (bucket.success / bucket.requests) * 100 : 0,
            responseTime: bucket.requests > 0 ? Math.round(bucket.totalTime / bucket.requests) : 0,
            errors: bucket.errors
          });
        }
      }
    }

    // Process province data
    const provinceMap = new Map<string, { requests: number; success: number; totalTime: number }>();
    if (provinceRaw && Array.isArray(provinceRaw)) {
      for (const row of provinceRaw) {
        const province = row.province;
        if (!provinceMap.has(province)) {
          provinceMap.set(province, { requests: 0, success: 0, totalTime: 0 });
        }
        const stats = provinceMap.get(province)!;
        stats.requests++;
        if (row.success) stats.success++;
        stats.totalTime += row.response_time_ms || 0;
      }
    }

    const provinceData: ProvinceData[] = Array.from(provinceMap.entries()).map(([province, stats]) => ({
      province,
      requests: stats.requests,
      successRate: stats.requests > 0 ? (stats.success / stats.requests) * 100 : 0,
      avgResponseTime: stats.requests > 0 ? Math.round(stats.totalTime / stats.requests) : 0
    }));

    // Process error distribution
    const errorMap = new Map<string, number>();
    let totalErrors = 0;
    if (errorRaw && Array.isArray(errorRaw)) {
      for (const row of errorRaw) {
        const type = row.error_type || 'UNKNOWN';
        errorMap.set(type, (errorMap.get(type) || 0) + 1);
        totalErrors++;
      }
    }

    const errorData: ErrorDistribution[] = Array.from(errorMap.entries()).map(([type, count]) => ({
      type,
      count,
      percentage: totalErrors > 0 ? (count / totalErrors) * 100 : 0
    }));

    return NextResponse.json({
      success: true,
      data: {
        timeSeries,
        provinceData,
        errorData,
        performanceTrends
      }
    });

  } catch (error) {
    apiLogger.error('Analytics API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
