'use client';

import {
  PiArrowsClockwiseBold,
  PiBuildingBold,
  PiCaretDownBold,
  PiChatBold,
  PiCheckCircleBold,
  PiClockBold,
  PiEnvelopeBold,
  PiPlayBold,
  PiWarningCircleBold,
} from 'react-icons/pi';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
  AdminPage,
  PageHeader,
  SectionCard,
  StatusBadge,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/backend';

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
      setError(null);
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
    } catch {
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
    if (log.dry_run) return <PiClockBold className="h-5 w-5 text-blue-500" />;
    if (log.failed > 0) return <PiWarningCircleBold className="h-5 w-5 text-yellow-500" />;
    return <PiCheckCircleBold className="h-5 w-5 text-green-500" />;
  };

  const latestRun = logs[0];

  if (loading) {
    return (
      <AdminPage>
        <LoadingState message="Loading cron logs..." />
      </AdminPage>
    );
  }

  if (error) {
    return (
      <AdminPage>
        <ErrorState title="Unable to load cron logs" message={error} onRetry={fetchLogs} />
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <PageHeader
        title="Billing Cron Logs"
        subtitle="Audit trail for automated billing jobs"
        actions={
          <>
            <Button variant="outline" onClick={fetchLogs}>
              <PiArrowsClockwiseBold className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-circleTel-orange hover:bg-circleTel-orange-dark">
                  {runningAction ? (
                    <PiArrowsClockwiseBold className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <PiPlayBold className="h-4 w-4 mr-2" />
                  )}
                  Run Now
                  <PiCaretDownBold className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleRunCron(true)}>
                  <PiClockBold className="h-4 w-4 mr-2" />
                  Dry Run (Preview)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRunCron(false)}>
                  <PiPlayBold className="h-4 w-4 mr-2" />
                  Run Now (Live)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {latestRun && !latestRun.dry_run && (
        <SectionCard title="Latest Run Summary">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <PiClockBold className="h-4 w-4" />
            Last Run: {formatDate(latestRun.run_date)}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { label: 'Processed', value: latestRun.services_processed, bg: 'bg-gray-50', text: 'text-gray-900' },
              { label: 'Invoices', value: latestRun.invoices_created, bg: 'bg-green-50', text: 'text-green-600' },
              { label: 'ZOHO Synced', value: latestRun.zoho_synced, bg: 'bg-blue-50', text: 'text-blue-600' },
              { label: 'Emails', value: latestRun.emails_sent, bg: 'bg-purple-50', text: 'text-purple-600' },
              { label: 'SMS', value: latestRun.sms_sent, bg: 'bg-cyan-50', text: 'text-cyan-600' },
            ].map((item) => (
              <div key={item.label} className={`text-center p-3 ${item.bg} rounded-lg`}>
                <div className={`text-2xl font-bold tabular-nums ${item.text}`}>{item.value}</div>
                <div className="text-xs text-gray-500">{item.label}</div>
              </div>
            ))}
            {latestRun.failed > 0 && (
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600 tabular-nums">{latestRun.failed}</div>
                <div className="text-xs text-gray-500">Failed</div>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Run History">
        {logs.length === 0 ? (
          <EmptyState
            icon={<PiClockBold />}
            title="No cron runs yet"
            description="Billing job history will appear here after the first run."
          />
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
                      <span className="font-medium text-gray-900">{formatDate(log.run_date)}</span>
                      {log.dry_run && <StatusBadge status="Dry Run" variant="info" />}
                    </div>
                    <p className="text-sm text-gray-500">
                      {log.cron_type} · {log.services_processed} services → {log.invoices_created}{' '}
                      invoices
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <PiBuildingBold className="h-4 w-4" />
                    {log.zoho_synced}
                  </div>
                  <div className="flex items-center gap-1">
                    <PiEnvelopeBold className="h-4 w-4" />
                    {log.emails_sent}
                  </div>
                  <div className="flex items-center gap-1">
                    <PiChatBold className="h-4 w-4" />
                    {log.sms_sent}
                  </div>
                  {log.failed > 0 && (
                    <StatusBadge status={`${log.failed} failed`} variant="error" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

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
                  <p className="font-medium tabular-nums">{selectedLog.services_processed}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Invoices Created</span>
                  <p className="font-medium tabular-nums">{selectedLog.invoices_created}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">ZOHO Synced</span>
                  <p className="font-medium tabular-nums">{selectedLog.zoho_synced}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Emails Sent</span>
                  <p className="font-medium tabular-nums">{selectedLog.emails_sent}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">SMS Sent</span>
                  <p className="font-medium tabular-nums">{selectedLog.sms_sent}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Failed</span>
                  <p className="font-medium text-red-600 tabular-nums">{selectedLog.failed}</p>
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
    </AdminPage>
  );
}
