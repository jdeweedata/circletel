'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Play,
  ChevronDown,
  Mail,
  MessageSquare,
  Building,
} from 'lucide-react';

interface CronLog {
  id: string;
  cron_type: string;
  run_date: string;
  services_processed: number;
  invoices_created: number;
  zoho_synced: number;
  emails_sent: number;
  sms_sent: number;
  failed: number;
  skipped: number;
  dry_run: boolean;
  details: Record<string, unknown> | null;
  created_at: string;
}

export default function CronLogsPage() {
  const [logs, setLogs] = useState<CronLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<CronLog | null>(null);
  const [runningAction, setRunningAction] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/billing/cron-logs');
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRunCron = async (dryRun: boolean) => {
    try {
      setRunningAction(dryRun ? 'dry-run' : 'run');
      const response = await fetch('/api/cron/generate-monthly-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      });
      const data = await response.json();

      if (data.success) {
        alert(
          dryRun
            ? `Dry Run: Would process ${data.totalServices} services`
            : `Processed ${data.servicesProcessed} services, created ${data.invoicesCreated} invoices`
        );
        if (!dryRun) fetchLogs();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Failed to run cron');
    } finally {
      setRunningAction(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (log: CronLog) => {
    if (log.dry_run) {
      return <Clock className="h-5 w-5 text-blue-500" />;
    }
    if (log.failed > 0) {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const latestRun = logs[0];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading cron logs...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing Cron Logs</h1>
          <p className="text-gray-500 mt-1">Audit trail for automated billing jobs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-circleTel-orange hover:bg-circleTel-orange/90">
                {runningAction ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Run Now
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleRunCron(true)}>
                <Clock className="h-4 w-4 mr-2" />
                Dry Run (Preview)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRunCron(false)}>
                <Play className="h-4 w-4 mr-2" />
                Run Now (Live)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {latestRun && !latestRun.dry_run && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Latest Run Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <Clock className="h-4 w-4" />
              Last Run: {formatDate(latestRun.run_date)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {latestRun.services_processed}
                </div>
                <div className="text-xs text-gray-500">Processed</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {latestRun.invoices_created}
                </div>
                <div className="text-xs text-gray-500">Invoices</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {latestRun.zoho_synced}
                </div>
                <div className="text-xs text-gray-500">ZOHO Synced</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {latestRun.emails_sent}
                </div>
                <div className="text-xs text-gray-500">Emails</div>
              </div>
              <div className="text-center p-3 bg-cyan-50 rounded-lg">
                <div className="text-2xl font-bold text-cyan-600">
                  {latestRun.sms_sent}
                </div>
                <div className="text-xs text-gray-500">SMS</div>
              </div>
              {latestRun.failed > 0 && (
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {latestRun.failed}
                  </div>
                  <div className="text-xs text-gray-500">Failed</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Run History */}
      <Card>
        <CardHeader>
          <CardTitle>Run History</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No cron runs yet</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(log)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {formatDate(log.run_date)}
                        </span>
                        {log.dry_run && (
                          <Badge className="bg-blue-100 text-blue-800">Dry Run</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {log.cron_type} • {log.services_processed} services →{' '}
                        {log.invoices_created} invoices
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {log.zoho_synced}
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {log.emails_sent}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {log.sms_sent}
                    </div>
                    {log.failed > 0 && (
                      <Badge className="bg-red-100 text-red-800">
                        {log.failed} failed
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Cron Run Details - {selectedLog && formatDate(selectedLog.run_date)}
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Type</span>
                  <p className="font-medium">{selectedLog.cron_type}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Dry Run</span>
                  <p className="font-medium">{selectedLog.dry_run ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Services Processed</span>
                  <p className="font-medium">{selectedLog.services_processed}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Invoices Created</span>
                  <p className="font-medium">{selectedLog.invoices_created}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">ZOHO Synced</span>
                  <p className="font-medium">{selectedLog.zoho_synced}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Emails Sent</span>
                  <p className="font-medium">{selectedLog.emails_sent}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">SMS Sent</span>
                  <p className="font-medium">{selectedLog.sms_sent}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Failed</span>
                  <p className="font-medium text-red-600">{selectedLog.failed}</p>
                </div>
              </div>
              {selectedLog.details && (
                <div>
                  <span className="text-sm text-gray-500">Details (JSON)</span>
                  <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
