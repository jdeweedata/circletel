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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Activity,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
  PlayCircle,
  TestTube,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface WebhookLog {
  id: string;
  webhook_id: string;
  integration_slug: string;
  integration_name: string;
  event_type: string;
  status: 'pending' | 'processed' | 'failed' | 'duplicate' | 'test' | 'replay';
  processing_time_ms: number | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
  processed_at: string | null;
  payload?: any;
  headers?: Record<string, string>;
}

interface WebhookSummary {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  byIntegration: Record<string, number>;
}

export default function WebhookMonitorPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [summary, setSummary] = useState<WebhookSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);

  // Filters
  const [filterIntegration, setFilterIntegration] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterEventType, setFilterEventType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dialogs
  const [replayDialogOpen, setReplayDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [logToReplay, setLogToReplay] = useState<WebhookLog | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Test webhook form
  const [testIntegration, setTestIntegration] = useState<string>('');
  const [testEventType, setTestEventType] = useState<string>('');
  const [testPayload, setTestPayload] = useState<string>('{}');

  // Fetch webhook logs
  useEffect(() => {
    fetchLogs();
  }, [filterIntegration, filterStatus]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLogs(true); // Silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, filterIntegration, filterStatus]);

  const fetchLogs = async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }

      const params = new URLSearchParams();
      if (filterIntegration !== 'all') params.append('integration_slug', filterIntegration);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      params.append('limit', '50');

      const response = await fetch(`/api/admin/integrations/webhooks?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch webhook logs: ${response.statusText}`);
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error('Error fetching webhook logs:', err);
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Failed to load webhook logs');
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  const fetchLogDetails = async (logId: string) => {
    try {
      const response = await fetch(`/api/admin/integrations/webhooks/${logId}/logs`);

      if (!response.ok) {
        throw new Error('Failed to fetch log details');
      }

      const data = await response.json();
      setSelectedLog(data.log);
    } catch (err) {
      console.error('Error fetching log details:', err);
    }
  };

  const handleReplayWebhook = async () => {
    if (!logToReplay) return;

    try {
      setIsReplaying(true);

      const response = await fetch(`/api/admin/integrations/webhooks/${logToReplay.id}/replay`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to replay webhook');
      }

      const data = await response.json();

      // Refresh logs to show the replayed webhook
      await fetchLogs();

      setReplayDialogOpen(false);
      setLogToReplay(null);
    } catch (err) {
      console.error('Error replaying webhook:', err);
      alert(err instanceof Error ? err.message : 'Failed to replay webhook');
    } finally {
      setIsReplaying(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!testIntegration) return;

    try {
      setIsTesting(true);

      let payload;
      try {
        payload = JSON.parse(testPayload);
      } catch {
        throw new Error('Invalid JSON payload');
      }

      // Find a webhook for this integration
      const webhookResponse = await fetch(`/api/admin/integrations/webhooks?integration_slug=${testIntegration}&limit=1`);
      const webhookData = await webhookResponse.json();

      if (!webhookData.logs || webhookData.logs.length === 0) {
        throw new Error('No webhook found for this integration');
      }

      const webhookId = webhookData.logs[0].webhook_id;

      const response = await fetch(`/api/admin/integrations/webhooks/${webhookId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: testEventType,
          payload,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send test webhook');
      }

      const data = await response.json();

      // Refresh logs to show the test webhook
      await fetchLogs();

      setTestDialogOpen(false);
      setTestIntegration('');
      setTestEventType('');
      setTestPayload('{}');
    } catch (err) {
      console.error('Error sending test webhook:', err);
      alert(err instanceof Error ? err.message : 'Failed to send test webhook');
    } finally {
      setIsTesting(false);
    }
  };

  const toggleExpandLog = async (log: WebhookLog) => {
    if (expandedLogId === log.id) {
      setExpandedLogId(null);
      setSelectedLog(null);
    } else {
      setExpandedLogId(log.id);
      await fetchLogDetails(log.id);
    }
  };

  const getStatusBadge = (status: WebhookLog['status']) => {
    switch (status) {
      case 'processed':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Processed
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'test':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <TestTube className="w-3 h-3 mr-1" />
            Test
          </Badge>
        );
      case 'replay':
        return (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            <PlayCircle className="w-3 h-3 mr-1" />
            Replay
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            {status}
          </Badge>
        );
    }
  };

  // Filter logs by search query
  const filteredLogs = logs.filter(log => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.integration_name.toLowerCase().includes(query) ||
        log.event_type.toLowerCase().includes(query) ||
        log.id.toLowerCase().includes(query)
      );
    }
    if (filterEventType) {
      return log.event_type.toLowerCase().includes(filterEventType.toLowerCase());
    }
    return true;
  });

  // Get unique integrations for filter
  const uniqueIntegrations = Array.from(new Set(logs.map(log => ({
    slug: log.integration_slug,
    name: log.integration_name,
  })))).reduce((acc, curr) => {
    if (!acc.find(item => item.slug === curr.slug)) {
      acc.push(curr);
    }
    return acc;
  }, [] as Array<{ slug: string; name: string }>);

  if (isLoading && !logs.length) {
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
            Webhook Monitor
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Real-time webhook activity across all integrations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'border-green-500 text-green-600' : ''}
          >
            <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => setTestDialogOpen(true)}
            className="bg-circleTel-orange hover:bg-circleTel-orange/90"
          >
            <TestTube className="w-4 h-4 mr-2" />
            Test Webhook
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold">{summary.total}</p>
                </div>
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Successful</p>
                  <p className="text-2xl font-bold text-green-600">{summary.successful}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{summary.failed}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Integration</label>
              <Select value={filterIntegration} onValueChange={setFilterIntegration}>
                <SelectTrigger>
                  <SelectValue placeholder="All integrations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All integrations</SelectItem>
                  {uniqueIntegrations.map(integration => (
                    <SelectItem key={integration.slug} value={integration.slug}>
                      {integration.name}
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
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="test">Test</SelectItem>
                  <SelectItem value="replay">Replay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Event Type</label>
              <Input
                placeholder="Filter by event type..."
                value={filterEventType}
                onChange={(e) => setFilterEventType(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Logs */}
      <Card>
        <CardHeader>
          <CardTitle>
            Webhook Activity Feed
            {autoRefresh && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (Auto-refreshes every 30s)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No webhook logs found
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  {/* Main row */}
                  <div
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => toggleExpandLog(log)}
                  >
                    <div className="flex-shrink-0">
                      {expandedLogId === log.id ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-5 gap-4">
                      <div className="sm:col-span-2">
                        <p className="font-medium text-sm truncate">
                          {log.integration_name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {log.event_type}
                        </p>
                      </div>

                      <div>
                        {getStatusBadge(log.status)}
                      </div>

                      <div className="text-sm">
                        {log.processing_time_ms !== null && (
                          <p className="text-gray-600 dark:text-gray-400">
                            {log.processing_time_ms}ms
                          </p>
                        )}
                        {log.retry_count > 0 && (
                          <p className="text-xs text-yellow-600 dark:text-yellow-400">
                            {log.retry_count} {log.retry_count === 1 ? 'retry' : 'retries'}
                          </p>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </div>
                    </div>

                    {log.status === 'failed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLogToReplay(log);
                          setReplayDialogOpen(true);
                        }}
                      >
                        <PlayCircle className="w-4 h-4 mr-1" />
                        Replay
                      </Button>
                    )}
                  </div>

                  {/* Expanded details */}
                  {expandedLogId === log.id && selectedLog && (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Details</h4>
                          <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <dt className="text-gray-600 dark:text-gray-400">Log ID:</dt>
                              <dd className="font-mono text-xs">{selectedLog.id}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-600 dark:text-gray-400">Created:</dt>
                              <dd>{format(new Date(selectedLog.created_at), 'PPpp')}</dd>
                            </div>
                            {selectedLog.processed_at && (
                              <div className="flex justify-between">
                                <dt className="text-gray-600 dark:text-gray-400">Processed:</dt>
                                <dd>{format(new Date(selectedLog.processed_at), 'PPpp')}</dd>
                              </div>
                            )}
                          </dl>
                        </div>

                        {selectedLog.error_message && (
                          <div>
                            <h4 className="font-medium text-sm mb-2 text-red-600">Error</h4>
                            <p className="text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 font-mono text-xs">
                              {selectedLog.error_message}
                            </p>
                          </div>
                        )}
                      </div>

                      {selectedLog.payload && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Payload</h4>
                          <pre className="text-xs bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded p-3 overflow-x-auto">
                            {JSON.stringify(selectedLog.payload, null, 2)}
                          </pre>
                        </div>
                      )}

                      {selectedLog.headers && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Headers</h4>
                          <pre className="text-xs bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded p-3 overflow-x-auto">
                            {JSON.stringify(selectedLog.headers, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Replay Confirmation Dialog */}
      <AlertDialog open={replayDialogOpen} onOpenChange={setReplayDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replay Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to replay this failed webhook? This will re-send the original
              payload to the webhook handler.
              {logToReplay && (
                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm space-y-1">
                  <p><strong>Integration:</strong> {logToReplay.integration_name}</p>
                  <p><strong>Event:</strong> {logToReplay.event_type}</p>
                  <p><strong>Failed at:</strong> {format(new Date(logToReplay.created_at), 'PPpp')}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReplaying}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReplayWebhook}
              disabled={isReplaying}
              className="bg-circleTel-orange hover:bg-circleTel-orange/90"
            >
              {isReplaying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Replaying...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Replay Webhook
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Test Webhook Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Test Webhook</DialogTitle>
            <DialogDescription>
              Send a test webhook to verify your webhook handler is working correctly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Integration</label>
              <Select value={testIntegration} onValueChange={setTestIntegration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select integration..." />
                </SelectTrigger>
                <SelectContent>
                  {uniqueIntegrations.map(integration => (
                    <SelectItem key={integration.slug} value={integration.slug}>
                      {integration.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Event Type</label>
              <Input
                placeholder="e.g., payment.completed"
                value={testEventType}
                onChange={(e) => setTestEventType(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Payload (JSON)</label>
              <textarea
                className="w-full h-48 p-3 border border-gray-300 dark:border-gray-700 rounded font-mono text-xs"
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                placeholder='{\n  "test": true,\n  "data": {}\n}'
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)} disabled={isTesting}>
              Cancel
            </Button>
            <Button
              onClick={handleTestWebhook}
              disabled={isTesting || !testIntegration}
              className="bg-circleTel-orange hover:bg-circleTel-orange/90"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Send Test
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
