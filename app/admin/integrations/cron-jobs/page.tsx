'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Activity,
  RefreshCw,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Calendar,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface CronJob {
  id: string;
  integrationSlug: string;
  jobName: string;
  jobUrl: string;
  schedule: string;
  humanReadableSchedule: string;
  isActive: boolean;
  lastRunAt: string | null;
  lastRunStatus: 'success' | 'failed' | null;
  lastRunDurationMs: number | null;
  nextRunAt: string | null;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface CronJobSummary {
  total: number;
  active: number;
  inactive: number;
  byIntegration: Record<string, number>;
}

export default function CronJobsPage() {
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [summary, setSummary] = useState<CronJobSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterIntegration, setFilterIntegration] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch cron jobs
  useEffect(() => {
    fetchCronJobs();
  }, [filterIntegration, filterStatus]);

  const fetchCronJobs = async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }

      const params = new URLSearchParams();
      if (filterIntegration !== 'all') params.append('integration_slug', filterIntegration);
      if (filterStatus !== 'all') params.append('is_active', filterStatus);

      const response = await fetch(`/api/admin/integrations/cron?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch cron jobs: ${response.statusText}`);
      }

      const data = await response.json();
      setCronJobs(data.cronJobs || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error('Error fetching cron jobs:', err);
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Failed to load cron jobs');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  const getStatusBadge = (status: 'success' | 'failed' | null) => {
    if (!status) {
      return (
        <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          Never Run
        </Badge>
      );
    }
    if (status === 'success') {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Success
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
        <XCircle className="w-3 h-3 mr-1" />
        Failed
      </Badge>
    );
  };

  // Filter jobs
  const filteredJobs = cronJobs.filter(job => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        job.jobName.toLowerCase().includes(query) ||
        job.integrationSlug.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Get unique integrations
  const uniqueIntegrations = Array.from(new Set(cronJobs.map(job => job.integrationSlug)));

  if (isLoading && !cronJobs.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-circleTel-darkNeutral dark:text-white">
            Cron Jobs Management
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage scheduled tasks across all integrations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCronJobs()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Jobs</p>
                  <p className="text-2xl font-bold">{summary.total}</p>
                </div>
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                  <p className="text-2xl font-bold text-green-600">{summary.active}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Inactive</p>
                  <p className="text-2xl font-bold text-gray-600">{summary.inactive}</p>
                </div>
                <XCircle className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Integration</label>
              <Select value={filterIntegration} onValueChange={setFilterIntegration}>
                <SelectTrigger>
                  <SelectValue placeholder="All integrations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All integrations</SelectItem>
                  {uniqueIntegrations.map(slug => (
                    <SelectItem key={slug} value={slug}>
                      {slug}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cron Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No cron jobs found matching your filters
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{job.jobName}</CardTitle>
                      {job.isActive ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{job.description}</p>
                  </div>
                  {getStatusBadge(job.lastRunStatus)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Job Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Schedule</p>
                        <p className="text-sm font-medium">{job.humanReadableSchedule}</p>
                        <p className="text-xs text-gray-400 font-mono">{job.schedule}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Integration</p>
                        <p className="text-sm font-medium">{job.integrationSlug}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Activity className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Endpoint</p>
                        <p className="text-sm font-mono text-gray-600 dark:text-gray-300">
                          {job.jobUrl}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {job.lastRunAt ? (
                      <>
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Last Run</p>
                            <p className="text-sm font-medium">
                              {formatDistanceToNow(new Date(job.lastRunAt), { addSuffix: true })}
                            </p>
                            <p className="text-xs text-gray-400">
                              {format(new Date(job.lastRunAt), 'PPpp')}
                            </p>
                          </div>
                        </div>

                        {job.lastRunDurationMs !== null && (
                          <div className="flex items-start gap-2">
                            <Zap className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                              <p className="text-sm font-medium">{job.lastRunDurationMs}ms</p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Last Run</p>
                          <p className="text-sm text-gray-400">Never executed</p>
                        </div>
                      </div>
                    )}

                    {job.nextRunAt && (
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Next Run</p>
                          <p className="text-sm font-medium">
                            {formatDistanceToNow(new Date(job.nextRunAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={!job.isActive}
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Trigger Now
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    View History
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-300 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
