'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  ArrowLeft,
  BarChart3,
  Eye,
  Clock,
  Users,
  Mail,
  Share2,
  Download,
  TrendingUp,
  MapPin,
  Monitor,
  RefreshCw,
  Loader2
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Props {
  params: Promise<{ id: string }>;
}

interface TrackingEvent {
  id: string;
  event_type: 'view' | 'email_sent' | 'shared' | 'downloaded';
  viewer_ip: string | null;
  viewer_user_agent: string | null;
  viewer_email: string | null;
  viewer_name: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  session_id: string | null;
  time_spent_seconds: number;
  created_at: string;
  metadata: any;
}

interface AnalyticsData {
  quote_id: string;
  quote_number: string;
  company_name: string;
  status: string;
  total_views: number;
  unique_views: number;
  emails_sent: number;
  shares: number;
  downloads: number;
  total_time_spent_seconds: number;
  last_viewed_at: string | null;
  tracking_events: TrackingEvent[];
}

export default function QuoteAnalyticsPage({ params }: Props) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/quotes/business/${resolvedParams.id}/track`);
      const data = await response.json();

      if (data.success) {
        const raw = data.data || {};
        const normalized: AnalyticsData = {
          quote_id: raw.quote_id ?? resolvedParams.id,
          quote_number: raw.quote_number ?? '',
          company_name: raw.company_name ?? '',
          status: raw.status ?? 'draft',
          total_views: raw.total_views ?? 0,
          unique_views: raw.unique_views ?? 0,
          emails_sent: raw.emails_sent ?? 0,
          shares: raw.shares ?? 0,
          downloads: raw.downloads ?? 0,
          total_time_spent_seconds: raw.total_time_spent_seconds ?? 0,
          last_viewed_at: raw.last_viewed_at ?? null,
          tracking_events: raw.tracking_events ?? raw.tracking ?? []
        };

        setAnalytics(normalized);
        setError(null);
      } else {
        setError(data.error || 'Failed to load analytics');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [resolvedParams.id]);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getDeviceType = (userAgent: string | null): string => {
    if (!userAgent) return 'Unknown';
    if (/mobile/i.test(userAgent)) return 'Mobile';
    if (/tablet/i.test(userAgent)) return 'Tablet';
    return 'Desktop';
  };

  const getBrowserName = (userAgent: string | null): string => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'view':
        return <Eye className="w-4 h-4" />;
      case 'email_sent':
        return <Mail className="w-4 h-4" />;
      case 'shared':
        return <Share2 className="w-4 h-4" />;
      case 'downloaded':
        return <Download className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'view':
        return 'bg-blue-100 text-blue-800';
      case 'email_sent':
        return 'bg-purple-100 text-purple-800';
      case 'shared':
        return 'bg-green-100 text-green-800';
      case 'downloaded':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-circleTel-orange mx-auto mb-4" />
          <p className="text-circleTel-secondaryNeutral">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/quotes/${resolvedParams.id}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quote
          </Button>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error || 'Failed to load analytics'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const avgTimePerView = analytics.total_views > 0
    ? Math.floor(analytics.total_time_spent_seconds / analytics.total_views)
    : 0;

  const engagementRate = analytics.unique_views > 0
    ? ((analytics.total_views / analytics.unique_views) * 100).toFixed(1)
    : '0';

  const events = analytics?.tracking_events ?? [];

  // Aggregate data for charts
  const deviceCounts: Record<string, number> = events.reduce((acc, event) => {
    const device = getDeviceType(event.viewer_user_agent);
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const browserCounts: Record<string, number> = events.reduce((acc, event) => {
    const browser = getBrowserName(event.viewer_user_agent);
    acc[browser] = (acc[browser] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const deviceLabels = Object.keys(deviceCounts);
  const deviceValues = Object.values(deviceCounts);

  const browserLabels = Object.keys(browserCounts);
  const browserValues = Object.values(browserCounts);

  const commonBarOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  const deviceChartData = {
    labels: deviceLabels,
    datasets: [
      {
        label: 'Views',
        data: deviceValues,
        backgroundColor: '#F5831F',
        borderRadius: 9999,
        barThickness: 18
      }
    ]
  };

  const browserChartData = {
    labels: browserLabels,
    datasets: [
      {
        label: 'Views',
        data: browserValues,
        backgroundColor: '#2563EB',
        borderRadius: 9999,
        barThickness: 18
      }
    ]
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/quotes/${resolvedParams.id}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-circleTel-darkNeutral flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-circleTel-orange" />
              Quote Analytics
            </h1>
            <p className="text-circleTel-secondaryNeutral mt-1">
              {analytics.quote_number} - {analytics.company_name}
            </p>
          </div>
        </div>

        <Button
          onClick={fetchAnalytics}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-circleTel-secondaryNeutral">
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-circleTel-darkNeutral">
                  {analytics.total_views}
                </p>
                <p className="text-xs text-circleTel-secondaryNeutral">
                  {analytics.unique_views} unique
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-circleTel-secondaryNeutral">
              Time Engaged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-circleTel-darkNeutral">
                  {formatDuration(analytics.total_time_spent_seconds)}
                </p>
                <p className="text-xs text-circleTel-secondaryNeutral">
                  {formatDuration(avgTimePerView)} avg
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-circleTel-secondaryNeutral">
              Shares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Share2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-circleTel-darkNeutral">
                  {analytics.shares}
                </p>
                <p className="text-xs text-circleTel-secondaryNeutral">
                  {analytics.emails_sent} via email
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-circleTel-secondaryNeutral">
              Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-circleTel-darkNeutral">
                  {engagementRate}%
                </p>
                <p className="text-xs text-circleTel-secondaryNeutral">
                  {analytics.downloads} downloads
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest tracking events for this quote
            </CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-center text-circleTel-secondaryNeutral py-8">
                No tracking events yet
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {events.slice(0, 20).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className={`p-2 rounded ${getEventColor(event.event_type)}`}>
                      {getEventIcon(event.event_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm capitalize">
                          {event.event_type.replace('_', ' ')}
                        </span>
                        {event.time_spent_seconds > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDuration(event.time_spent_seconds)}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-circleTel-secondaryNeutral space-y-1">
                        <div className="flex items-center gap-2">
                          <span>{new Date(event.created_at).toLocaleString()}</span>
                        </div>
                        {event.viewer_ip && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.viewer_ip}
                          </div>
                        )}
                        {event.viewer_user_agent && (
                          <div className="flex items-center gap-1">
                            <Monitor className="w-3 h-3" />
                            {getDeviceType(event.viewer_user_agent)} • {getBrowserName(event.viewer_user_agent)}
                          </div>
                        )}
                        {event.referrer && (
                          <div className="truncate" title={event.referrer}>
                            Referrer: {new URL(event.referrer).hostname}
                          </div>
                        )}
                        {(event.utm_source || event.utm_medium || event.utm_campaign) && (
                          <div className="flex flex-wrap gap-1">
                            {event.utm_source && (
                              <Badge variant="secondary" className="text-xs">
                                Source: {event.utm_source}
                              </Badge>
                            )}
                            {event.utm_medium && (
                              <Badge variant="secondary" className="text-xs">
                                Medium: {event.utm_medium}
                              </Badge>
                            )}
                            {event.utm_campaign && (
                              <Badge variant="secondary" className="text-xs">
                                Campaign: {event.utm_campaign}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Viewer Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Viewer Insights</CardTitle>
            <CardDescription>
              Device types and browsers used to view this quote
            </CardDescription>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-center text-circleTel-secondaryNeutral py-8">
                No viewer data yet
              </p>
            ) : (
              <div className="space-y-4">
                {/* Device Breakdown */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Device Types</h4>
                  <div className="h-40">
                    <Bar
                      data={deviceChartData}
                      options={{
                        ...commonBarOptions,
                        plugins: {
                          ...commonBarOptions.plugins,
                          title: {
                            display: false,
                            text: 'Device Types'
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Browser Breakdown */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Browsers</h4>
                  <div className="h-40">
                    <Bar
                      data={browserChartData}
                      options={{
                        ...commonBarOptions,
                        plugins: {
                          ...commonBarOptions.plugins,
                          title: {
                            display: false,
                            text: 'Browsers'
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Top Referrers */}
                {events.some(e => e.referrer) && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Top Referrers</h4>
                    <div className="space-y-2">
                      {Object.entries(
                        events
                          .filter(e => e.referrer)
                          .reduce((acc, event) => {
                            const hostname = event.referrer ? new URL(event.referrer).hostname : 'Direct';
                            acc[hostname] = (acc[hostname] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                      )
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([referrer, count]) => (
                          <div key={referrer} className="flex items-center justify-between text-sm">
                            <span className="truncate">{referrer}</span>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      {analytics.last_viewed_at && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-circleTel-secondaryNeutral">
                Last viewed <strong>{new Date(analytics.last_viewed_at).toLocaleString()}</strong>
              </p>
              <div className="text-xs text-circleTel-secondaryNeutral mt-1">
                Quote status: <Badge variant="outline">{analytics.status}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
