'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Download,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IntegrationLogsTable } from '@/components/admin/integrations/IntegrationLogsTable';
import { toast } from 'sonner';

interface UnifiedLog {
  id: string;
  log_type: 'activity' | 'webhook' | 'sync';
  event_type: string;
  status: 'success' | 'failed' | 'pending' | 'processing' | 'retry';
  message: string;
  details: Record<string, unknown> | null;
  user_email: string | null;
  ip_address: string | null;
  created_at: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
}

interface LogsStats {
  total: number;
  success: number;
  failed: number;
  pending: number;
  by_type: {
    activity: number;
    webhook: number;
    sync: number;
  };
}

interface IntegrationInfo {
  slug: string;
  name: string;
}

interface LogsResponse {
  success: boolean;
  data: {
    integration: IntegrationInfo;
    logs: UnifiedLog[];
    stats: LogsStats;
    pagination: {
      total: number;
      limit: number;
      offset: number;
      has_more: boolean;
    };
  };
  error?: string;
}

export default function IntegrationLogsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  const [integration, setIntegration] = useState<IntegrationInfo | null>(null);
  const [logs, setLogs] = useState<UnifiedLog[]>([]);
  const [stats, setStats] = useState<LogsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('7d');

  // Pagination
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 50;

  const fetchLogs = async (reset = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setOffset(0);
      } else {
        setIsRefreshing(true);
      }

      const params = new URLSearchParams();
      if (logTypeFilter !== 'all') params.set('log_type', logTypeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);
      params.set('limit', limit.toString());
      params.set('offset', reset ? '0' : offset.toString());

      // Calculate date range based on filter
      if (dateFilter !== 'all') {
        const now = new Date();
        let dateFrom: Date;

        switch (dateFilter) {
          case '24h':
            dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        params.set('date_from', dateFrom.toISOString());
      }

      const response = await fetch(`/api/admin/integrations/${slug}/logs?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Integration not found');
          router.push('/admin/integrations');
          return;
        }
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }

      const data: LogsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch logs');
      }

      setIntegration(data.data.integration);
      setLogs(data.data.logs);
      setStats(data.data.stats);
      setHasMore(data.data.pagination.has_more);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load logs');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs(true);
  }, [slug, logTypeFilter, statusFilter, dateFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== '') {
        fetchLogs(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleRefresh = () => {
    fetchLogs(true);
  };

  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast.error('No logs to export');
      return;
    }

    const headers = ['Timestamp', 'Type', 'Event', 'Status', 'Message', 'User', 'IP Address'];
    const rows = logs.map(log => [
      new Date(log.created_at).toISOString(),
      log.log_type,
      log.event_type,
      log.status,
      `"${log.message.replace(/"/g, '""')}"`,
      log.user_email || '',
      log.ip_address || '',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${slug}-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('Logs exported successfully');
  };

  const handleLoadMore = () => {
    setOffset(prev => prev + limit);
    fetchLogs(false);
  };

  return (
    <div className="w-full min-h-screen bg-[#f7f8fa] text-gray-800 p-6 md:p-10 space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hover:bg-gray-200"
          >
            <Link href="/admin/integrations">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {integration?.name || 'Integration'} Logs
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View activity logs, webhook events, and sync history
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={logs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </header>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Activity className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Total Events</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                  <div className="text-xs text-muted-foreground">Successful</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Log Type Breakdown */}
      {stats && (
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">By Type:</span>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            Activity: {stats.by_type.activity}
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Webhook: {stats.by_type.webhook}
          </Badge>
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Sync: {stats.by_type.sync}
          </Badge>
        </div>
      )}

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Log Type Filter */}
            <Select value={logTypeFilter} onValueChange={setLogTypeFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Log Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="activity">Activity</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
                <SelectItem value="sync">Sync</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Log History</CardTitle>
          <CardDescription>
            {logs.length} {logs.length === 1 ? 'entry' : 'entries'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IntegrationLogsTable
            logs={logs}
            isLoading={isLoading}
            emptyMessage="No logs found for this integration"
          />

          {/* Load More */}
          {hasMore && !isLoading && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
