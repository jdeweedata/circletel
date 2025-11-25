'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ActivityLog {
  id: string;
  user_email: string;
  action: string;
  action_category: string;
  status: string;
  severity: string;
  is_suspicious: boolean;
  ip_address: string;
  user_agent: string;
  request_path: string;
  metadata: any;
  created_at: string;
  admin_user: {
    full_name: string;
    email: string;
  } | null;
}

interface Statistics {
  total: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  suspicious: number;
  critical: number;
}

export default function AdminUserActivityPage() {
  const { user } = useAdminAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(50);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState('');

  useEffect(() => {
    fetchActivityLogs();
  }, [page, filterCategory, filterStatus, filterSeverity, suspiciousOnly, userFilter]);

  const fetchActivityLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filterCategory) params.append('category', filterCategory);
      if (filterStatus) params.append('status', filterStatus);
      if (filterSeverity) params.append('severity', filterSeverity);
      if (suspiciousOnly) params.append('suspicious', 'true');
      if (userFilter) params.append('user', userFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/admin/users/activity?${params}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch activity logs');
      }

      setLogs(result.data.logs);
      setStatistics(result.data.statistics);
      setTotalPages(result.data.pagination.totalPages);
    } catch (error: any) {
      console.error('Error fetching activity logs:', error);
      toast.error(error.message || 'Failed to load activity logs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchActivityLogs();
  };

  const handleRefresh = () => {
    fetchActivityLogs();
    toast.success('Activity logs refreshed');
  };

  const handleReset = () => {
    setFilterCategory('');
    setFilterStatus('');
    setFilterSeverity('');
    setSuspiciousOnly(false);
    setSearchQuery('');
    setUserFilter('');
    setPage(1);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failure':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={colors[severity as keyof typeof colors] || colors.low}>
        {severity}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      authentication: 'bg-blue-100 text-blue-800',
      password: 'bg-purple-100 text-purple-800',
      user_management: 'bg-indigo-100 text-indigo-800',
      system: 'bg-gray-100 text-gray-800',
      data_access: 'bg-cyan-100 text-cyan-800',
      configuration: 'bg-teal-100 text-teal-800',
      security: 'bg-red-100 text-red-800',
    };

    return (
      <Badge variant="outline" className={colors[category as keyof typeof colors] || colors.system}>
        {category.replace(/_/g, ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-8 h-8 text-circleTel-orange" />
            User Activity
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor all admin user activities, security events, and system changes
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {statistics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Suspicious Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {statistics.suspicious.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Failed Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {(statistics.byStatus?.failure || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Critical Severity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-800">
                {statistics.critical.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <CardTitle>Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="col-span-full md:col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Search
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search action or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} size="sm">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* User Email Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                User Email
              </label>
              <Input
                placeholder="Filter by user..."
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Category
              </label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  <SelectItem value="authentication">Authentication</SelectItem>
                  <SelectItem value="password">Password</SelectItem>
                  <SelectItem value="user_management">User Management</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="data_access">Data Access</SelectItem>
                  <SelectItem value="configuration">Configuration</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Status
              </label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failure">Failure</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Severity Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Severity
              </label>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All severities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Suspicious Only */}
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={suspiciousOnly}
                  onChange={(e) => setSuspiciousOnly(e.target.checked)}
                  className="w-4 h-4 text-circleTel-orange focus:ring-circleTel-orange border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Suspicious only
                </span>
              </label>
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <Button onClick={handleReset} variant="outline" className="w-full">
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
          <CardDescription>
            Showing {logs.length} of {statistics?.total || 0} total events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-circleTel-orange" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No activity logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                      User
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                      Action
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                      Category
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                      Severity
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                      IP Address
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className={`border-b hover:bg-gray-50 ${
                        log.is_suspicious ? 'bg-orange-50' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          {log.is_suspicious && (
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-sm">
                            {log.admin_user?.full_name || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-600">{log.user_email}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">{log.action}</div>
                        {log.request_path && (
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">
                            {log.request_path}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">{getCategoryBadge(log.action_category)}</td>
                      <td className="py-3 px-4">{getSeverityBadge(log.severity)}</td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-mono">{log.ip_address || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || isLoading}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
